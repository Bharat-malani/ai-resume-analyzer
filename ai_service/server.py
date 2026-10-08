import json
import re
import sys
import os
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# Ensure app can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.parser import ResumeParser
from app.skills import skill_extractor
from app.scoring import ScoringEngine
from app.matcher import SemanticJobMatcher
from app.suggestions import SuggestionAgent

class AIRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: dict):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        if parsed_url.path == '/health' or parsed_url.path == '/':
            self._send_json(200, {
                "status": "healthy",
                "service": "ResumeAI High-Performance Python NLP Service",
                "taxonomy_skills_count": len(skill_extractor.canonical_skills),
                "version": "1.0.0"
            })
        else:
            self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        content_length = int(self.headers.get('Content-Length', 0))
        content_type = self.headers.get('Content-Type', '')

        # 1. Parse Resume File (multipart/form-data)
        if path == '/ai/parse-resume':
            try:
                body = self.rfile.read(content_length)
                
                # Extract boundary from content-type header
                boundary_match = re.search(r'boundary=([^\s;]+)', content_type)
                if not boundary_match:
                    self._send_json(400, {"detail": "Missing boundary in multipart request"})
                    return
                
                boundary = boundary_match.group(1).encode('utf-8')
                parts = body.split(b'--' + boundary)
                
                file_bytes = None
                filename = "resume.pdf"

                for part in parts:
                    if b'filename="' in part:
                        # Extract filename
                        fn_match = re.search(rb'filename="([^"]+)"', part)
                        if fn_match:
                            filename = fn_match.group(1).decode('utf-8', errors='ignore')
                        # Extract binary data after double CRLF
                        header_end = part.find(b'\r\n\r\n')
                        if header_end != -1:
                            file_bytes = part[header_end + 4 :].rstrip(b'\r\n')
                            break

                if not file_bytes:
                    self._send_json(400, {"detail": "No file content found in request"})
                    return

                parsed_data = ResumeParser.parse(file_bytes, filename)
                extracted_skills = skill_extractor.extract_skills(parsed_data["raw_text"])
                parsed_data["extracted_skills"] = extracted_skills

                self._send_json(200, {
                    "success": True,
                    "filename": filename,
                    "data": parsed_data
                })
            except Exception as e:
                self._send_json(422, {"detail": str(e)})
            return

        # Handle JSON payloads for other endpoints
        try:
            raw_body = self.rfile.read(content_length).decode('utf-8')
            payload = json.loads(raw_body) if raw_body else {}
        except Exception:
            payload = {}

        if path == '/ai/analyze-resume':
            raw_text = payload.get('raw_text', '').strip()
            if not raw_text:
                self._send_json(400, {"detail": "Empty resume text"})
                return

            personal_info = ResumeParser.extract_personal_info(raw_text)
            sections = ResumeParser.segment_sections(raw_text)
            parsed_resume = {
                "personal_info": personal_info,
                "sections": sections,
                "raw_text": raw_text,
                "word_count": len(raw_text.split())
            }
            skills_data = skill_extractor.extract_skills(raw_text)
            scoring_result = ScoringEngine.calculate_score(
                parsed_resume=parsed_resume,
                extracted_skills=skills_data,
                weights=payload.get('weights')
            )
            recommendations = SuggestionAgent.generate_recommendations(
                parsed_resume=parsed_resume,
                scoring_results=scoring_result,
                skills_data=skills_data
            )
            roles = SuggestionAgent.recommend_roles(skills_data["skills"])

            self._send_json(200, {
                "success": True,
                "parsed_resume": parsed_resume,
                "skills_data": skills_data,
                "scoring": scoring_result,
                "recommendations": recommendations,
                "recommended_roles": roles[:4]
            })

        elif path == '/ai/analyze-job':
            job_text = payload.get('job_description', '')
            job_title = payload.get('job_title', 'Target Role')
            res = SemanticJobMatcher.analyze_job_description(job_text, job_title)
            self._send_json(200, {"success": True, "data": res})

        elif path == '/ai/match-resume':
            resume_text = payload.get('resume_text', '')
            resume_skills = payload.get('resume_skills', [])
            job_desc = payload.get('job_description', '')
            job_title = payload.get('job_title', 'Target Role')

            match_res = SemanticJobMatcher.match(
                resume_text=resume_text,
                resume_skills=resume_skills,
                job_text=job_desc,
                job_title=job_title
            )
            self._send_json(200, {"success": True, "match": match_res})

        elif path == '/ai/improve-bullet':
            bullet = payload.get('bullet_point', '')
            res = SuggestionAgent.improve_bullet_point(bullet)
            self._send_json(200, {"success": True, "data": res})

        elif path == '/ai/generate-summary':
            c_name = payload.get('candidate_name', 'Candidate')
            skills = payload.get('skills', [])
            target_role = payload.get('target_role', 'Software Engineer')
            summary = SuggestionAgent.generate_summary(c_name, skills, target_role)
            self._send_json(200, {"success": True, "summary": summary})

        elif path == '/ai/recommend-roles':
            skills = payload.get('skills', [])
            roles = SuggestionAgent.recommend_roles(skills)
            self._send_json(200, {"success": True, "roles": roles})

        else:
            self._send_json(404, {"error": "Endpoint not found"})

def run(host='127.0.0.1', port=8000):
    server = ThreadingHTTPServer((host, port), AIRequestHandler)
    print(f"==================================================")
    print(f"ResumeAI Python AI Microservice running on http://{host}:{port}")
    print(f"Ready to process PDF/DOCX parses, scoring, and matching!")
    print(f"==================================================")
    server.serve_forever()

if __name__ == '__main__':
    run()
