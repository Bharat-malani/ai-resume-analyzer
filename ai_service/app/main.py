import os
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.parser import ResumeParser
from app.skills import skill_extractor
from app.scoring import ScoringEngine
from app.matcher import SemanticJobMatcher
from app.suggestions import SuggestionAgent

app = FastAPI(
    title="ResumeAI - AI/NLP Analysis & Matching Service",
    description="High-performance NLP service for ATS resume parsing, skill extraction, explainable scoring, and job matching.",
    version="1.0.0"
)

# CORS setup for direct or local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# Pydantic Schemas
# ----------------------------------------------------
class TextAnalysisRequest(BaseModel):
    raw_text: str
    filename: Optional[str] = "resume.txt"
    weights: Optional[Dict[str, float]] = None

class JobAnalysisRequest(BaseModel):
    job_description: str
    job_title: Optional[str] = "Software Engineer"

class MatchRequest(BaseModel):
    resume_text: str
    resume_skills: List[str]
    job_description: str
    job_title: Optional[str] = "Software Engineer"

class BulletImproveRequest(BaseModel):
    bullet_point: str

class SummaryRequest(BaseModel):
    candidate_name: Optional[str] = "Candidate"
    skills: List[str]
    target_role: Optional[str] = "Software Engineer"

class RoleRecommendationRequest(BaseModel):
    skills: List[str]

# ----------------------------------------------------
# Endpoints
# ----------------------------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ResumeAI NLP Service",
        "taxonomy_skills_count": len(skill_extractor.canonical_skills),
        "version": "1.0.0"
    }

@app.post("/ai/parse-resume")
async def parse_resume_file(file: UploadFile = File(...)):
    """Parse an uploaded PDF or DOCX file."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name")
    
    filename = file.filename.lower()
    if not (filename.endswith('.pdf') or filename.endswith('.docx')):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF or DOCX.")
    
    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File exceeds maximum 10MB limit.")

        parsed_data = ResumeParser.parse(content, file.filename)
        # Extract skills right away
        extracted_skills = skill_extractor.extract_skills(parsed_data["raw_text"])
        parsed_data["extracted_skills"] = extracted_skills

        return {
            "success": True,
            "filename": file.filename,
            "data": parsed_data
        }
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal parsing error: {str(e)}")

@app.post("/ai/analyze-resume")
def analyze_resume(payload: TextAnalysisRequest):
    """Full end-to-end ATS resume analysis, skill extraction, scoring, and recommendations."""
    raw_text = payload.raw_text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Empty resume text provided.")

    personal_info = ResumeParser.extract_personal_info(raw_text)
    sections = ResumeParser.segment_sections(raw_text)
    word_count = len(raw_text.split())

    parsed_resume = {
        "personal_info": personal_info,
        "sections": sections,
        "raw_text": raw_text,
        "word_count": word_count
    }

    # Extract skills
    skills_data = skill_extractor.extract_skills(raw_text)

    # Score resume
    scoring_result = ScoringEngine.calculate_score(
        parsed_resume=parsed_resume,
        extracted_skills=skills_data,
        weights=payload.weights
    )

    # Generate recommendations
    recommendations = SuggestionAgent.generate_recommendations(
        parsed_resume=parsed_resume,
        scoring_results=scoring_result,
        skills_data=skills_data
    )

    # Role suggestions
    roles = SuggestionAgent.recommend_roles(skills_data["skills"])

    return {
        "success": True,
        "parsed_resume": parsed_resume,
        "skills_data": skills_data,
        "scoring": scoring_result,
        "recommendations": recommendations,
        "recommended_roles": roles[:4]
    }

@app.post("/ai/analyze-job")
def analyze_job(payload: JobAnalysisRequest):
    """Extract required skills, experience, and keywords from job description."""
    if not payload.job_description.strip():
        raise HTTPException(status_code=400, detail="Empty job description provided.")
    
    result = SemanticJobMatcher.analyze_job_description(
        job_text=payload.job_description,
        job_title=payload.job_title or ""
    )
    return {"success": True, "data": result}

@app.post("/ai/match-resume")
def match_resume(payload: MatchRequest):
    """Perform semantic matching and skill gap analysis between resume and job description."""
    if not payload.job_description.strip():
        raise HTTPException(status_code=400, detail="Empty job description.")
    if not payload.resume_text.strip():
        raise HTTPException(status_code=400, detail="Empty resume text.")

    match_result = SemanticJobMatcher.match(
        resume_text=payload.resume_text,
        resume_skills=payload.resume_skills,
        job_text=payload.job_description,
        job_title=payload.job_title or ""
    )

    return {"success": True, "match": match_result}

@app.post("/ai/improve-bullet")
def improve_bullet(payload: BulletImproveRequest):
    """Rewrites resume bullet point with strong action verbs without metric fabrication."""
    result = SuggestionAgent.improve_bullet_point(payload.bullet_point)
    return {"success": True, "data": result}

@app.post("/ai/generate-summary")
def generate_summary(payload: SummaryRequest):
    """Generates professional resume summary strictly from candidate skills."""
    summary_text = SuggestionAgent.generate_summary(
        candidate_name=payload.candidate_name or "Candidate",
        skills=payload.skills,
        target_role=payload.target_role or "Software Engineer"
    )
    return {"success": True, "summary": summary_text}

@app.post("/ai/recommend-roles")
def recommend_roles(payload: RoleRecommendationRequest):
    """Recommend industry roles based on detected skills."""
    roles = SuggestionAgent.recommend_roles(payload.skills)
    return {"success": True, "roles": roles}
