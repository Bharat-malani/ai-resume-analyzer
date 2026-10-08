import re
import math
from collections import Counter
from typing import Dict, Any, List, Set
from app.skills import skill_extractor

class PureTfidfCosine:
    """
    Pure Python TF-IDF and Cosine Similarity engine.
    Immune to Windows DLL Application Control blocks while maintaining 100% precision.
    """

    STOP_WORDS = {
        "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
        "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", 
        "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", 
        "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", 
        "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", 
        "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", 
        "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", 
        "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", 
        "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", 
        "under", "until", "up", "very", "was", "we", "were", "what", "when", "where", "which", 
        "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself", "yourselves",
        "will", "work", "role", "team", "years", "experience", "candidate", "looking", "responsible"
    }

    @classmethod
    def tokenize(cls, text: str) -> List[str]:
        tokens = re.findall(r'[a-zA-Z0-9+#.-]{2,25}', text.lower())
        return [t for t in tokens if t not in cls.STOP_WORDS and not t.isdigit()]

    @classmethod
    def extract_ngrams(cls, tokens: List[str], n: int = 2) -> List[str]:
        ngrams = []
        for i in range(len(tokens) - n + 1):
            ngrams.append(" ".join(tokens[i:i+n]))
        return ngrams

    @classmethod
    def compute_tfidf_vectors(cls, docs: List[str]) -> List[Dict[str, float]]:
        tokenized_docs = []
        doc_counts = Counter()

        for doc in docs:
            tokens = cls.tokenize(doc)
            bigrams = cls.extract_ngrams(tokens, 2)
            all_terms = tokens + bigrams
            tokenized_docs.append(all_terms)
            
            # Count document frequency
            unique_terms = set(all_terms)
            for t in unique_terms:
                doc_counts[t] += 1

        total_docs = len(docs)
        tfidf_vectors = []

        for terms in tokenized_docs:
            term_freq = Counter(terms)
            total_terms = max(1, len(terms))
            vector = {}
            for t, count in term_freq.items():
                tf = count / total_terms
                # Smooth IDF formula: log((1 + N) / (1 + df)) + 1
                idf = math.log((1 + total_docs) / (1 + doc_counts[t])) + 1.0
                vector[t] = tf * idf
            
            # Normalize vector to unit length (L2 norm)
            norm = math.sqrt(sum(v * v for v in vector.values()))
            if norm > 0:
                vector = {k: v / norm for k, v in vector.items()}
            tfidf_vectors.append(vector)

        return tfidf_vectors

    @classmethod
    def cosine_similarity(cls, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        # Dot product of unit vectors
        common_keys = set(vec1.keys()).intersection(set(vec2.keys()))
        if not common_keys:
            return 0.0
        dot_product = sum(vec1[k] * vec2[k] for k in common_keys)
        return max(0.0, min(1.0, dot_product))


class SemanticJobMatcher:
    """
    Semantic Job Description Matching and Skill Gap Engine.
    Combines exact/aliased skill taxonomy analysis with pure TF-IDF cosine semantic similarity.
    """

    RELATED_SKILL_MAP = {
        "PostgreSQL": ["SQL", "MySQL", "Relational Databases", "Database Management"],
        "MySQL": ["SQL", "PostgreSQL", "Relational Databases"],
        "MongoDB": ["NoSQL", "Document Databases", "Database Management"],
        "React": ["JavaScript", "Frontend Development", "TypeScript", "UI/UX"],
        "Angular": ["TypeScript", "Frontend Development", "JavaScript"],
        "Vue.js": ["JavaScript", "Frontend Development"],
        "Node.js": ["Express.js", "JavaScript", "Backend Development", "REST API"],
        "Express.js": ["Node.js", "REST API", "Backend Development"],
        "Django": ["Python", "Backend Development", "REST API", "SQL"],
        "FastAPI": ["Python", "REST API", "Asynchronous Programming"],
        "Spring Boot": ["Java", "Backend Development", "Microservices", "REST API"],
        "Docker": ["Containerization", "DevOps", "Kubernetes", "CI/CD"],
        "Kubernetes": ["Docker", "Container Orchestration", "DevOps", "Cloud"],
        "AWS": ["Cloud Computing", "DevOps", "Serverless"],
        "Machine Learning": ["Python", "Data Analysis", "Artificial Intelligence"],
        "Deep Learning": ["Machine Learning", "Neural Networks"],
        "PyTorch": ["Deep Learning", "Machine Learning", "Python"],
        "TensorFlow": ["Deep Learning", "Machine Learning", "Python"]
    }

    @classmethod
    def analyze_job_description(cls, job_text: str, job_title: str = "") -> Dict[str, Any]:
        """
        Analyze a raw job description: extract required skills, keywords, and qualifications.
        """
        extracted = skill_extractor.extract_skills(job_text)
        required_skills = extracted.get("skills", [])
        categories = extracted.get("categories", {})

        # Extract top keywords using frequency & IDF
        keywords = cls.extract_top_keywords(job_text, top_n=12)

        # Experience level detection
        exp_match = re.search(r'(\d+)(?:\s*(?:to|-)\s*(\d+))?\s*\+?\s*years?(?:\s*of)?\s*experience', job_text, re.IGNORECASE)
        experience_required = exp_match.group(0) if exp_match else "Not explicitly specified"

        # Education requirements detection
        edu_keywords = []
        for edu in ["Bachelor", "Master", "B.Sc", "B.Tech", "M.Tech", "Ph.D", "Computer Science", "Information Technology", "Degree"]:
            if re.search(rf'\b{re.escape(edu)}\b', job_text, re.IGNORECASE):
                edu_keywords.append(edu)

        return {
            "job_title": job_title.strip() or "Target Role",
            "required_skills": required_skills,
            "skill_categories": categories,
            "top_keywords": keywords,
            "experience_required": experience_required,
            "education_mentions": list(set(edu_keywords)),
            "total_skills_count": len(required_skills)
        }

    @classmethod
    def extract_top_keywords(cls, text: str, top_n: int = 15) -> List[str]:
        """Extract highest-importance non-stopword keywords."""
        if not text or len(text.strip()) < 20:
            return []

        tokens = PureTfidfCosine.tokenize(text)
        counts = Counter(tokens)
        return [w for w, c in counts.most_common(top_n)]

    @classmethod
    def match(cls, resume_text: str, resume_skills: List[str], job_text: str, job_title: str = "") -> Dict[str, Any]:
        """
        Compare candidate resume against job description using semantic similarity and skill overlap.
        """
        job_analysis = cls.analyze_job_description(job_text, job_title)
        job_skills = job_analysis["required_skills"]

        resume_skills_set = set(resume_skills)
        job_skills_set = set(job_skills)

        # 1. Matched and Missing Skills
        matched_skills = sorted(list(resume_skills_set.intersection(job_skills_set)))
        missing_skills_list = sorted(list(job_skills_set.difference(resume_skills_set)))

        # 2. Skill Gap with Priority assignment
        skill_gap = []
        for skill in missing_skills_list:
            cat = skill_extractor.category_map.get(skill, "")
            if cat in ["Programming Languages", "Backend & Frameworks", "Frontend Development"]:
                priority = "High"
            elif cat in ["Databases & Storage", "Cloud & DevOps", "Data Science, AI & ML"]:
                priority = "High" if len(matched_skills) < 4 else "Medium"
            else:
                priority = "Low"
            
            skill_gap.append({
                "skill": skill,
                "category": cat or "General",
                "priority": priority
            })

        p_order = {"High": 1, "Medium": 2, "Low": 3}
        skill_gap.sort(key=lambda x: p_order.get(x["priority"], 4))

        # 3. Related / Transferable Skills
        related_skills = []
        for r_skill in resume_skills:
            if r_skill in cls.RELATED_SKILL_MAP:
                for target_req in cls.RELATED_SKILL_MAP[r_skill]:
                    if target_req in job_skills_set and target_req not in matched_skills:
                        related_skills.append({
                            "candidate_skill": r_skill,
                            "relevant_to_requirement": target_req,
                            "explanation": f"Knowledge of {r_skill} provides strong foundational transferability to {target_req}."
                        })

        # 4. Skills Match Percentage
        if job_skills_set:
            transfer_credit = min(len(related_skills) * 0.5, len(missing_skills_list) * 0.4)
            skills_match_score = round(min(100.0, ((len(matched_skills) + transfer_credit) / len(job_skills_set)) * 100))
        else:
            skills_match_score = 75

        # 5. Semantic TF-IDF Cosine Similarity
        try:
            vectors = PureTfidfCosine.compute_tfidf_vectors([resume_text, job_text])
            cosine_sim = PureTfidfCosine.cosine_similarity(vectors[0], vectors[1])
            # Scale cosine similarity (typically 0.15 - 0.70 for text) to 0-100 scale
            semantic_score = round(min(100.0, max(20.0, (cosine_sim * 135) + 20)))
        except Exception:
            semantic_score = 65

        # 6. Keyword Match Percentage
        job_keywords = job_analysis["top_keywords"]
        if job_keywords:
            matched_keywords = [kw for kw in job_keywords if re.search(rf'\b{re.escape(kw)}\b', resume_text, re.IGNORECASE)]
            keyword_match_score = round((len(matched_keywords) / len(job_keywords)) * 100)
        else:
            keyword_match_score = 70
            matched_keywords = []

        # 7. Overall Weighted Job Match Score
        # 50% Explicit Skills Match, 30% Semantic Similarity, 20% Keyword Relevance
        overall_match_score = round(
            (skills_match_score * 0.50) +
            (semantic_score * 0.30) +
            (keyword_match_score * 0.20)
        )
        overall_match_score = max(15, min(100, overall_match_score))

        return {
            "overall_match_score": overall_match_score,
            "skills_match_score": skills_match_score,
            "semantic_match_score": semantic_score,
            "keyword_match_score": keyword_match_score,
            "job_title": job_analysis["job_title"],
            "experience_required": job_analysis["experience_required"],
            "education_mentions": job_analysis["education_mentions"],
            "matched_skills": matched_skills,
            "missing_skills": missing_skills_list,
            "skill_gap": skill_gap,
            "related_skills": related_skills,
            "important_keywords": job_keywords,
            "matched_keywords": matched_keywords,
            "total_job_skills": len(job_skills_set),
            "matched_skills_count": len(matched_skills)
        }
