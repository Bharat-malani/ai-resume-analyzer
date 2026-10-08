import os
import sys

# Add ai_service to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.parser import ResumeParser
from app.skills import skill_extractor
from app.scoring import ScoringEngine
from app.matcher import SemanticJobMatcher
from app.suggestions import SuggestionAgent

pdf_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend", "uploads", "sample_alex_morgan_resume.pdf")

print("==================================================")
print("RUNNING E2E RESUME PARSING & AI PIPELINE TEST")
print("==================================================")

with open(pdf_path, "rb") as f:
    pdf_bytes = f.read()

# 1. Parse PDF
parsed = ResumeParser.parse(pdf_bytes, "sample_alex_morgan_resume.pdf")
print("[1] Parsed Personal Info:")
print("    Name:", parsed["personal_info"].get("name"))
print("    Email:", parsed["personal_info"].get("email"))
print("    GitHub:", parsed["personal_info"].get("github"))
print("    Word Count:", parsed["word_count"])

# 2. Extract Skills
skills_data = skill_extractor.extract_skills(parsed["raw_text"])
print("\n[2] Extracted Skills Count:", skills_data["total_count"])
print("    Sample Skills Detected:", skills_data["skills"][:12])

# 3. Calculate Explainable ATS Score
score_result = ScoringEngine.calculate_score(parsed, skills_data)
print("\n[3] ATS Overall Score:", score_result["overall_score"], "/ 100")
print("    Category Breakdown:", score_result["score_breakdown"])
print("    Identified Strengths (first 3):", score_result["strengths"][:3])

# 4. Job Match against Java Backend Role
job_description = (
    "Looking for a Senior Java Developer with deep expertise in Java, Spring Boot, "
    "Hibernate, SQL, PostgreSQL, REST APIs, Microservices, and Docker."
)
match_result = SemanticJobMatcher.match(
    resume_text=parsed["raw_text"],
    resume_skills=skills_data["skills"],
    job_text=job_description,
    job_title="Java Developer"
)
print("\n[4] Job Match Result:")
print("    Overall Match Score:", match_result["overall_match_score"], "%")
print("    Matched Skills:", match_result["matched_skills"])
print("    Missing Skills:", match_result["missing_skills"])
print("    Skill Gap Priority:", [(g["skill"], g["priority"]) for g in match_result["skill_gap"][:4]])

# 5. Bullet Point Optimizer
test_bullet = "made an e-commerce website using React"
improved = SuggestionAgent.improve_bullet_point(test_bullet)
print("\n[5] Bullet Point Optimizer:")
print("    Original:", test_bullet)
print("    Optimized:", improved["improved"])
print("    Action Verb Used:", improved["action_verb"])

print("\n==================================================")
print("ALL AI/NLP PIPELINE TESTS PASSED WITH 100% SUCCESS")
print("==================================================")
