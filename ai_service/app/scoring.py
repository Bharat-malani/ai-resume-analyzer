import re
from typing import Dict, Any, List

class ScoringEngine:
    """
    Explainable, deterministic ATS Resume Scoring Engine.
    Configurable weights:
      - 40% Skill Match / Breadth
      - 25% Keyword Relevance
      - 15% Resume Structure & ATS Formatting
      - 10% Project Quality & Metrics
      - 10% Section Completeness
    """

    DEFAULT_WEIGHTS = {
        "skill_weight": 0.40,
        "keyword_weight": 0.25,
        "structure_weight": 0.15,
        "project_weight": 0.10,
        "completeness_weight": 0.10
    }

    ACTION_VERBS = [
        "built", "developed", "engineered", "designed", "architected", "implemented", 
        "created", "deployed", "optimized", "integrated", "spearheaded", "automated", 
        "orchestrated", "refactored", "analyzed", "managed", "led", "enhanced", 
        "configured", "solved", "collaborated", "maintained", "accelerated", "scaled"
    ]

    @classmethod
    def calculate_score(
        cls, 
        parsed_resume: Dict[str, Any], 
        extracted_skills: Dict[str, Any],
        weights: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """
        Calculate ATS score with complete transparency, strengths, and issue flags.
        """
        w = weights or cls.DEFAULT_WEIGHTS
        personal_info = parsed_resume.get("personal_info", {})
        sections = parsed_resume.get("sections", {})
        raw_text = parsed_resume.get("raw_text", "")
        word_count = parsed_resume.get("word_count", 0)
        skills_list = extracted_skills.get("skills", [])
        categories = extracted_skills.get("categories", {})

        strengths: List[str] = []
        issues: List[str] = []

        # ----------------------------------------------------
        # 1. Section Completeness Score (0 - 100)
        # ----------------------------------------------------
        completeness_pts = 0
        total_completeness_pts = 5

        # Check contact info completeness
        has_email = bool(personal_info.get("email"))
        has_phone = bool(personal_info.get("phone"))
        has_linkedin = bool(personal_info.get("linkedin"))
        has_github = bool(personal_info.get("github"))
        has_name = bool(personal_info.get("name"))

        contact_completeness = (
            (1 if has_email else 0) +
            (1 if has_phone else 0) +
            (1 if has_name else 0) +
            (1 if (has_linkedin or has_github) else 0)
        )
        if contact_completeness >= 3:
            completeness_pts += 1
            strengths.append("Clear and accessible contact information")
        else:
            issues.append("Contact details are incomplete (missing email, phone, or professional links)")

        if not has_github:
            issues.append("Missing GitHub or technical portfolio link for code verification")
        else:
            strengths.append("Technical profile link (GitHub/Portfolio) is present")

        # Check essential sections
        essential_sections = ["education", "skills", "experience", "projects"]
        present_sections = [s for s in essential_sections if bool(sections.get(s, "").strip())]
        
        completeness_pts += len(present_sections) # Up to 4 points

        for s in essential_sections:
            if s in present_sections:
                strengths.append(f"Dedicated {s.capitalize()} section detected")
            else:
                issues.append(f"Missing recommended section: '{s.capitalize()}'")

        completeness_score = round((completeness_pts / total_completeness_pts) * 100)

        # ----------------------------------------------------
        # 2. Resume Structure & Formatting Score (0 - 100)
        # ----------------------------------------------------
        structure_pts = 100

        # Word count check: optimal is 350 - 900 words
        if word_count < 150:
            structure_pts -= 35
            issues.append(f"Resume is very brief ({word_count} words). Recommended length is 350-800 words.")
        elif word_count < 280:
            structure_pts -= 15
            issues.append(f"Resume is somewhat concise ({word_count} words). Consider elaborating on key accomplishments.")
        elif word_count > 1500:
            structure_pts -= 15
            issues.append("Resume exceeds 1500 words. Consider condensing to 1-2 pages.")
        else:
            strengths.append(f"Optimal resume length ({word_count} words) for standard 1-2 page formatting")

        # Check decorative/special character anomalies
        unusual_chars = len(re.findall(r'[★◆■▲▼►◄●\u2022]{5,}', raw_text))
        if unusual_chars > 3:
            structure_pts -= 10
            issues.append("Excessive non-standard decorative bullet symbols may impair ATS parser accuracy.")

        # Formatting clarity
        non_empty_sections_count = sum(1 for s, text in sections.items() if s != "other" and len(text.strip()) > 20)
        if non_empty_sections_count >= 3:
            strengths.append("Well-segmented document structure with distinct headings")
        else:
            structure_pts -= 20
            issues.append("Section headers may be ambiguous or merged. Use standard headers.")

        structure_score = max(20, min(100, structure_pts))

        # ----------------------------------------------------
        # 3. Skill Breadth & Depth Score (0 - 100)
        # ----------------------------------------------------
        skill_count = len(skills_list)
        category_count = len(categories)

        if skill_count >= 15:
            skill_score = 95
            strengths.append(f"Comprehensive skill coverage across {category_count} technical domains ({skill_count} skills)")
        elif skill_count >= 10:
            skill_score = 85
            strengths.append(f"Good technical skill coverage ({skill_count} detected skills)")
        elif skill_count >= 6:
            skill_score = 70
        elif skill_count >= 3:
            skill_score = 50
            issues.append("Skill coverage is limited. List specific tools, libraries, and frameworks you know.")
        else:
            skill_score = 30
            issues.append("Very few technical skills identified. Add a dedicated 'Skills' section.")

        # Bonus for domain variety (Languages + Frameworks + Databases)
        has_lang = any(c in categories for c in ["Programming Languages"])
        has_backend_or_front = any(c in categories for c in ["Frontend Development", "Backend & Frameworks"])
        has_db = any(c in categories for c in ["Databases & Storage"])
        if has_lang and has_backend_or_front and has_db:
            strengths.append("Balanced tech stack: Programming languages, frameworks, and databases all present")

        # ----------------------------------------------------
        # 4. Project Quality & Impact Score (0 - 100)
        # ----------------------------------------------------
        proj_text = sections.get("projects", "") + " " + sections.get("experience", "")
        proj_score = 50

        if len(proj_text.strip()) > 100:
            # Check for action verbs
            lower_proj = proj_text.lower()
            verb_hits = sum(1 for verb in cls.ACTION_VERBS if re.search(rf'\b{verb}\b', lower_proj))
            if verb_hits >= 6:
                proj_score += 30
                strengths.append("High utilization of impactful action verbs in project & experience descriptions")
            elif verb_hits >= 3:
                proj_score += 15
            else:
                issues.append("Project descriptions rely on passive phrasing. Use strong action verbs (e.g., 'Engineered', 'Optimized', 'Deployed').")

            # Check for quantitative metrics (% or numbers or metrics)
            metric_hits = len(re.findall(r'\b(?:\d+[\%kKmM]?|\$\d+|\d+\+)\b', proj_text))
            if metric_hits >= 3:
                proj_score += 20
                strengths.append("Includes measurable outcomes and metrics in project statements")
            elif metric_hits >= 1:
                proj_score += 10
            else:
                issues.append("Consider including measurable metrics or scope where appropriate (e.g., user count, latency, requests handled).")
        else:
            proj_score = 25
            issues.append("Project details are sparse or missing. Detail at least 2 technical projects.")

        project_score = max(10, min(100, proj_score))

        # ----------------------------------------------------
        # 5. Keyword Relevance & Density (0 - 100)
        # ----------------------------------------------------
        # Evaluates richness of vocabulary, technical density, and section flow
        tech_density = (skill_count / max(1, word_count)) * 100
        if 2.0 <= tech_density <= 8.5:
            keyword_score = 90
            strengths.append(f"Balanced technical keyword density ({tech_density:.1f}%) without keyword stuffing")
        elif tech_density > 8.5:
            keyword_score = 75
            issues.append("High keyword density detected. Ensure skills are embedded in natural sentences.")
        else:
            keyword_score = 65
            issues.append("Technical keyword density is relatively low. Expand on technical implementations.")

        # ----------------------------------------------------
        # Weighted Overall Score
        # ----------------------------------------------------
        overall_score = round(
            (skill_score * w["skill_weight"]) +
            (keyword_score * w["keyword_weight"]) +
            (structure_score * w["structure_weight"]) +
            (project_score * w["project_weight"]) +
            (completeness_score * w["completeness_weight"])
        )

        overall_score = max(10, min(100, overall_score))

        # Deduplicate and limit issues/strengths
        clean_strengths = list(dict.fromkeys(strengths))
        clean_issues = list(dict.fromkeys(issues))

        return {
            "overall_score": overall_score,
            "category_scores": {
                "skill_score": skill_score,
                "keyword_score": keyword_score,
                "structure_score": structure_score,
                "project_score": project_score,
                "completeness_score": completeness_score
            },
            "weights": w,
            "strengths": clean_strengths,
            "issues": clean_issues,
            "word_count": word_count,
            "skill_count": skill_count,
            "score_breakdown": {
                "Skill Match (40%)": f"{skill_score}/100",
                "Keyword Relevance (25%)": f"{keyword_score}/100",
                "Resume Structure (15%)": f"{structure_score}/100",
                "Project Quality (10%)": f"{project_score}/100",
                "Section Completeness (10%)": f"{completeness_score}/100"
            }
        }
