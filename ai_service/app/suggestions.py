import re
from typing import Dict, Any, List, Optional

ROLE_PROFILES = {
    "Full Stack Developer": {
        "core": ["JavaScript", "React", "Node.js", "Express.js", "HTML", "CSS", "SQL", "Git"],
        "bonus": ["TypeScript", "PostgreSQL", "MongoDB", "Docker", "REST API"]
    },
    "Frontend Developer": {
        "core": ["JavaScript", "React", "HTML", "CSS", "TypeScript", "Tailwind CSS"],
        "bonus": ["Redux", "Next.js", "Responsive Design", "Vite", "Git"]
    },
    "Backend Developer": {
        "core": ["Node.js", "Python", "Java", "SQL", "REST API", "Git", "PostgreSQL"],
        "bonus": ["Express.js", "Django", "FastAPI", "Spring Boot", "Docker", "Redis", "Microservices"]
    },
    "Java Developer": {
        "core": ["Java", "Spring Boot", "SQL", "Git", "REST API", "Hibernate"],
        "bonus": ["Microservices", "PostgreSQL", "Maven", "Docker", "JUnit"]
    },
    "Python Developer": {
        "core": ["Python", "Django", "Flask", "FastAPI", "SQL", "Git", "REST API"],
        "bonus": ["PostgreSQL", "Pandas", "Docker", "Linux", "Celery"]
    },
    "Data Scientist / ML Engineer": {
        "core": ["Python", "Machine Learning", "Pandas", "NumPy", "scikit-learn", "SQL"],
        "bonus": ["Deep Learning", "PyTorch", "TensorFlow", "Data Visualization", "NLP"]
    },
    "Cloud & DevOps Engineer": {
        "core": ["Linux", "Docker", "Kubernetes", "AWS", "CI/CD", "Git"],
        "bonus": ["Terraform", "GCP", "Microsoft Azure", "Jenkins", "Nginx"]
    },
    "QA Automation Engineer": {
        "core": ["Unit Testing", "Selenium", "Postman", "Python", "JavaScript", "Git"],
        "bonus": ["Cypress", "PyTest", "Jest", "CI/CD", "API Testing"]
    }
}

class SuggestionAgent:
    """
    AI Resume Improvement & Recommendation Agent adhering strictly to anti-hallucination rules.
    Never invents unverified achievements, jobs, metrics, or technologies.
    """

    ACTION_VERB_MAP = {
        "made": "Developed",
        "did": "Executed",
        "built": "Engineered",
        "worked on": "Collaborated on",
        "helped": "Facilitated",
        "created": "Architected",
        "used": "Leveraged",
        "fixed": "Resolved",
        "managed": "Coordinated",
        "handled": "Administered"
    }

    @classmethod
    def improve_bullet_point(cls, original_bullet: str) -> Dict[str, Any]:
        """
        Rewrites a weak bullet point into an impactful, professional statement.
        Never fabricates percentages, metrics, or unstated technologies.
        """
        bullet = original_bullet.strip().lstrip("•-* ").strip()
        if not bullet:
            return {
                "original": original_bullet,
                "improved": "",
                "explanation": "Input bullet point was empty.",
                "action_verb": ""
            }

        lower_bullet = bullet.lower()
        chosen_verb = "Engineered"
        improved = bullet

        # Detect weak starting phrase
        found_weak = False
        for weak, strong in cls.ACTION_VERB_MAP.items():
            if lower_bullet.startswith(weak):
                # Replace weak start with strong verb
                rest_of_sentence = bullet[len(weak):].strip()
                improved = f"{strong} {rest_of_sentence}"
                chosen_verb = strong
                found_weak = True
                break

        if not found_weak:
            # If starts with an -ing verb e.g. "Building", "Making", "Developing"
            ing_match = re.match(r'^(building|making|developing|working on|creating|fixing|designing)\b', lower_bullet)
            if ing_match:
                verb_matched = ing_match.group(1)
                replacement = cls.ACTION_VERB_MAP.get(verb_matched.replace("ing", "ed"), "Implemented")
                rest = bullet[len(verb_matched):].strip()
                improved = f"{replacement} {rest}"
                chosen_verb = replacement
            else:
                # Polish structure without altering factual statements
                if not any(lower_bullet.startswith(v) for v in ["developed", "engineered", "designed", "architected", "implemented", "deployed", "integrated"]):
                    improved = f"Implemented {bullet[0].lower() + bullet[1:]}"
                    chosen_verb = "Implemented"

        # Ensure terminal punctuation
        if not improved.endswith("."):
            improved += "."

        return {
            "original": original_bullet,
            "improved": improved,
            "explanation": f"Elevated phrasing with the strong action verb '{chosen_verb}', improving ATS readability while strictly preserving candidate-provided facts without metric fabrication.",
            "action_verb": chosen_verb
        }

    @classmethod
    def generate_recommendations(
        cls,
        parsed_resume: Dict[str, Any],
        scoring_results: Dict[str, Any],
        skills_data: Dict[str, Any],
        job_match_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Produce structured, transparent resume improvement recommendations.
        """
        skills = skills_data.get("skills", [])
        sections = parsed_resume.get("sections", {})
        overall_score = scoring_results.get("overall_score", 0)
        category_scores = scoring_results.get("category_scores", {})
        strengths = scoring_results.get("strengths", [])
        issues = scoring_results.get("issues", [])

        recommendations: List[str] = []
        learning_recommendations: List[Dict[str, str]] = []

        # 1. Structure & section recommendations
        for s in ["experience", "projects", "education", "skills"]:
            if not sections.get(s, "").strip():
                recommendations.append(f"Add a dedicated '{s.capitalize()}' section with clear bullet points.")

        # 2. Skill coverage recommendations
        if len(skills) < 10:
            recommendations.append("Expand your technical skills list to include specific frameworks, databases, and testing tools you have worked with.")

        # 3. Project bullet points recommendations
        recommendations.append("Format every project and experience entry using the Action Verb + Task + Technology formula.")

        # 4. Job Match context recommendations
        missing_skills_list = []
        if job_match_data:
            missing_skills_list = job_match_data.get("missing_skills", [])
            if missing_skills_list:
                top_missing = missing_skills_list[:4]
                recommendations.append(f"Target role specifically seeks: {', '.join(top_missing)}. If you have academic or self-directed project experience in these areas, incorporate them.")
                
                for m_skill in top_missing:
                    learning_recommendations.append({
                        "skill": m_skill,
                        "resource_topic": f"Foundational {m_skill} tutorials and hands-on practice projects",
                        "priority": "Recommended for Target Job"
                    })

        # Rewritten bullets samples from project section
        rewritten_bullets = []
        proj_text = sections.get("projects", "") or sections.get("experience", "")
        candidate_bullets = [b.strip() for b in re.split(r'[\n•\*\-]+', proj_text) if len(b.strip()) > 20][:3]
        for b in candidate_bullets:
            improved_item = cls.improve_bullet_point(b)
            if improved_item["improved"] != b:
                rewritten_bullets.append(improved_item)

        # High-level summary
        if overall_score >= 80:
            summary = f"Your resume demonstrates strong technical foundations with a competitive ATS score of {overall_score}/100. Fine-tuning project bullet clarity and addressing minor keyword alignments will maximize interview conversion."
        elif overall_score >= 60:
            summary = f"Your resume has solid foundational components (Score: {overall_score}/100) but has noticeable opportunities to improve section completeness, technical keyword breadth, and bullet phrasing."
        else:
            summary = f"Your resume currently scores {overall_score}/100. Adding dedicated sections for projects, skills, and contact links will dramatically improve its ATS visibility."

        return {
            "summary": summary,
            "overall_score": overall_score,
            "category_scores": category_scores,
            "strengths": strengths,
            "weaknesses": issues,
            "missing_keywords": missing_skills_list,
            "recommendations": recommendations,
            "rewritten_bullets": rewritten_bullets,
            "learning_recommendations": learning_recommendations
        }

    @classmethod
    def generate_summary(cls, candidate_name: str, skills: List[str], target_role: str = "") -> str:
        """
        Generate professional summary strictly based on candidate's detected skills.
        """
        top_skills = skills[:6]
        skills_str = ", ".join(top_skills) if top_skills else "modern software engineering tools"
        role_label = target_role.strip() if target_role.strip() else "Software Engineering Professional"

        summary = (
            f"Results-driven {role_label} with proven academic and practical competency in {skills_str}. "
            f"Passionate about building scalable applications, applying clean software architecture principles, "
            f"and continuously expanding technical capabilities in collaborative, high-impact environments."
        )
        return summary

    @classmethod
    def recommend_roles(cls, detected_skills: List[str]) -> List[Dict[str, Any]]:
        """
        Recommend industry roles based on detected skills overlap.
        Explicitly labeled as skill-based similarity, not an employment prediction.
        """
        candidate_set = set(detected_skills)
        recommendations = []

        for role_name, profile in ROLE_PROFILES.items():
            core = profile["core"]
            bonus = profile["bonus"]
            
            matched_core = [s for s in core if s in candidate_set]
            missing_core = [s for s in core if s not in candidate_set]
            matched_bonus = [s for s in bonus if s in candidate_set]

            # Calculate match score: core skills weighted 75%, bonus weighted 25%
            core_pct = (len(matched_core) / max(1, len(core))) * 75
            bonus_pct = (len(matched_bonus) / max(1, len(bonus))) * 25
            total_match = round(core_pct + bonus_pct)
            total_match = max(10, min(100, total_match))

            recommendations.append({
                "role_title": role_name,
                "match_percentage": total_match,
                "matching_skills": matched_core + matched_bonus,
                "missing_skills": missing_core,
                "disclaimer": "Skills-based relevance indicator. Not a guarantee or prediction of employment."
            })

        # Sort descending by match percentage
        recommendations.sort(key=lambda r: r["match_percentage"], reverse=True)
        return recommendations
