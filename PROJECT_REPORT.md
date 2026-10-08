# ACADEMIC PROJECT REPORT

## PROJECT TITLE:
# ResumeAI — AI-Powered Resume Analyzer & Job Match System

**Degree:** Bachelor of Science in Computer Science (B.Sc. CS)  
**Academic Year:** Final Year Capstone Project  
**Domain:** Artificial Intelligence, Natural Language Processing, Full-Stack Web Engineering  

---

## 1. ABSTRACT

In modern recruitment ecosystems, Applicant Tracking Systems (ATS) automatically filter over 70% of resumes before a human recruiter conducts an initial review. Job seekers—particularly college students and recent graduates—frequently struggle to identify why their applications fail to progress through automated screening pipelines. Existing consumer tools often either present opaque, unexplainable numerical scores or rely entirely on generative large language models that invent false metrics, work history, and unverified achievements (hallucinations).

**ResumeAI** addresses these limitations by providing an explainable, deterministic, full-stack software application for resume parsing, ATS scoring, and semantic job description matching. Utilizing a three-tier microservice architecture (React 18 + Vite frontend, Node.js Express REST API backend, and Python 3.12 FastAPI NLP microservice), the system extracts contact details, segment boundaries, and over 350+ technical skills from PDF and DOCX files. Resumes are evaluated against transparent scoring metrics across five distinct dimensions, benchmarked against real job descriptions via Term Frequency-Inverse Document Frequency (TF-IDF) cosine similarity, and enhanced through strict anti-hallucination recommendation algorithms.

---

## 2. INTRODUCTION

The emergence of automated talent acquisition tools has revolutionized how organizations evaluate talent. However, this has created significant informational asymmetry between applicants and recruiters. Job applicants lack insight into whether their resumes feature ATS-compatible structural layouts, clear section headings, appropriate technical keyword density, or verifiable action-oriented project bullets.

ResumeAI provides job seekers with a comprehensive, SaaS-grade analytics suite that demystifies ATS evaluation through deterministic calculation, prioritized skill gap diagnosis, and verifiable career readiness insights.

---

## 3. PROBLEM STATEMENT

1. **Opaque Scoring Algorithms:** Most existing platforms generate arbitrary scores without transparent mathematical breakdowns, leaving students confused about actionable improvement areas.
2. **Generative Hallucinations:** Naive LLM integrations frequently fabricate percentages, metrics, unearned degrees, or unmentioned technologies, resulting in misleading resumes that violate academic and professional integrity.
3. **Keyword Stuffing vs. Semantic Relevance:** Many applicants resort to hidden keyword stuffing, which modern ATS parsers penalize. There is an urgent need for semantic matching that evaluates transferable skill overlap.
4. **Poor Document Parsing Handling:** Resumes formatted in complex tables or unconventional formats often suffer from corrupted text extraction, resulting in silent screening rejections.

---

## 4. OBJECTIVES

1. Develop a high-performance document extraction engine capable of normalizing text and segmenting section boundaries across PDF and DOCX documents.
2. Construct a categorized database of 350+ software engineering skills with alias mapping (e.g., `JS` → `JavaScript`, `K8s` → `Kubernetes`).
3. Implement a deterministic ATS scoring engine with configurable category weights (Skill Match: 40%, Keyword Relevance: 25%, Structure: 15%, Project Quality: 10%, Section Completeness: 10%).
4. Engineer a semantic matching algorithm using TF-IDF N-grams and Cosine Similarity to compare candidate resumes against raw job descriptions.
5. Create an automated skill gap diagnostic prioritizing missing competencies into High, Medium, and Low tiers.
6. Design an anti-hallucination bullet point optimizer that re-writes passive statements into active phrases without fabricating false quantitative metrics.
7. Provide version comparison, score progression tracking, and downloadable PDF evaluation reports.

---

## 5. EXISTING SYSTEM VS. PROPOSED SYSTEM

| Feature | Existing Systems / General Tools | Proposed System (ResumeAI) |
|---|---|---|
| **Scoring Algorithm** | Arbitrary or black-box rating | Deterministic, transparent, and configurable |
| **Skill Extraction** | Rigid exact-string matching | 350+ taxonomy with multi-word alias resolution |
| **Job Description Match** | Keyword frequency counter | TF-IDF Cosine Similarity & Transferable Skills |
| **AI Suggestions** | Unrestricted LLM generation (prone to hallucinated metrics) | Strict anti-hallucination action-verb enhancement |
| **Version History** | Single-scan, ephemeral results | Complete multi-version tracking with delta charts |
| **Report Generation** | Paid or watermarked | Executive multi-page PDF generation via PDFKit |
| **Database Architecture** | Monolithic or flat files | Dual-mode PostgreSQL with persistent zero-config fallback |

---

## 6. SYSTEM ARCHITECTURE

```
[ User Browser (Client) ]
           │  (HTTP / JSON / JWT)
           ▼
[ React 18 + Vite Frontend ]
  ├── Modular Component Architecture
  ├── Recharts Visualizations & SVG Score Dials
  └── Tailwind CSS SaaS Design System
           │
           ▼
[ Node.js Express REST API ]
  ├── JWT Auth & bcryptjs Password Security
  ├── Multer File Ingestion & Format Validation
  ├── PDFKit Dynamic Report Generation
  └── Dual Database Persistence Layer
           │
     ┌─────┴────────────────────────┐
     ▼                              ▼
[ PostgreSQL / Local DB ]   [ Python FastAPI AI Microservice ]
 - Users                     - PDF / DOCX Text Normalizer
 - Resumes                   - Section Segmentation Engine
 - Analyses                  - 350+ Skills Alias Taxonomy
 - Jobs & Matches            - Explainable ATS Scoring Engine
                             - TF-IDF Cosine Similarity Matcher
                             - Anti-Hallucination Recommender
```

---

## 7. DATA FLOW DIAGRAMS (DFD)

### DFD Level 0 (Context Level)
```
[ User / Job Seeker ] ──── Upload Resume & Target Job ───► [ ResumeAI System ]
[ User / Job Seeker ] ◄─── ATS Score, Skill Gap & Report ─ [ ResumeAI System ]
```

### DFD Level 1 (Functional Decomposition)
1. **User Management:** Authenticates user credentials, hashes passwords, and issues signed JWT tokens.
2. **Document Ingestion:** Receives multipart files, checks MIME types, and streams bytes to the AI microservice.
3. **Parsing & Section Extraction:** Segment lines into Summary, Education, Experience, Projects, and Skills.
4. **Taxonomy & Keyword Analysis:** Matches words against pre-compiled canonical aliases and evaluates TF-IDF N-grams.
5. **Deterministic Scoring:** Computes individual category scores and calculates weighted aggregate score.
6. **Semantic Job Match:** Compares resume vector space with target job description vector space.
7. **Report Dispatch:** Formats data into executive dashboard views and printable PDF reports.

---

## 8. ENTITY RELATIONSHIP (ER) DIAGRAM & SCHEMA

### Core Entities:
- **USERS:** `(id, name, email, password_hash, role, created_at)`
- **RESUMES:** `(id, user_id, title, filename, file_path, file_size, file_type, raw_text, word_count, version_number)`
- **RESUME_SECTIONS:** `(id, resume_id, section_name, content)`
- **RESUME_SKILLS:** `(id, resume_id, skill_name, category)`
- **JOB_DESCRIPTIONS:** `(id, user_id, title, company, description_text, required_skills, top_keywords)`
- **ANALYSES:** `(id, user_id, resume_id, overall_score, category_scores, strengths, issues, recommendations)`
- **JOB_MATCHES:** `(id, user_id, resume_id, job_id, overall_match_score, skills_match_score, matched_skills, missing_skills, skill_gap)`

---

## 9. MATHEMATICAL ALGORITHMS & METHODOLOGIES

### 9.1 Explainable ATS Scoring Formula
$$\text{Overall Score} = \sum_{i=1}^{5} w_i \cdot S_i$$
Where:
- $w_1 = 0.40$ (Skill Match $S_{\text{skills}}$)
- $w_2 = 0.25$ (Keyword Relevance $S_{\text{keywords}}$)
- $w_3 = 0.15$ (Resume Structure $S_{\text{structure}}$)
- $w_4 = 0.10$ (Project Quality $S_{\text{projects}}$)
- $w_5 = 0.10$ (Section Completeness $S_{\text{completeness}}$)

### 9.2 TF-IDF Vectorization & Cosine Semantic Similarity
Given a document $d$ and term $t$:
$$\text{TF}(t, d) = \frac{f_{t,d}}{\sum_{t' \in d} f_{t',d}}$$
$$\text{IDF}(t, D) = \ln\left(\frac{1 + |D|}{1 + |\{d \in D : t \in d\}|}\right) + 1$$
$$\text{Cosine Similarity}(\vec{u}, \vec{v}) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\|_2 \|\vec{v}\|_2} = \frac{\sum_{i=1}^{n} u_i v_i}{\sqrt{\sum_{i=1}^{n} u_i^2} \sqrt{\sum_{i=1}^{n} v_i^2}}$$

### 9.3 Anti-Hallucination Formulation
Generative outputs are governed by strict constraints:
$$\text{Let } F_{\text{candidate}} = \text{Set of all explicit factual tokens in candidate resume}$$
$$\forall t \in \text{Output}, \quad t \text{ is permitted } \iff t \in F_{\text{candidate}} \lor t \in \text{PermittedActionVerbs} \lor t \in \text{GrammarTransitions}$$
$$\text{Prohibited: Unverified Metrics } \{\Delta\%, \$X, N\text{ users}\}, \quad \text{Unverified Credentials, Non-existent Titles.}$$

---

## 10. TESTING & RESULTS

| Test Case ID | Test Description | Input | Expected Output | Status |
|---|---|---|---|---|
| **TC-01** | Account Registration | Valid Name, Email, Password (8 char) | User record created, JWT returned | **PASSED** |
| **TC-02** | Duplicate Email Handling | Existing email address | HTTP 409 Conflict with friendly alert | **PASSED** |
| **TC-03** | PDF File Text Extraction | `sample_alex_morgan_resume.pdf` | Extracted Name: Alex Morgan, 256 words | **PASSED** |
| **TC-04** | Categorized Skill Detection | Resume containing `Docker, React, TS, Postgres` | Correctly identified 29 skills with aliases | **PASSED** |
| **TC-05** | Explainable ATS Scoring | Extracted resume text | Deterministic Overall Score: 90/100 | **PASSED** |
| **TC-06** | Job Semantic Matching | Java Developer Job Description | Match Score: 46%, Missing: Hibernate, Spring | **PASSED** |
| **TC-07** | Skill Gap Prioritization | Missing Java, Spring, Hibernate | High priority tags assigned to core stack | **PASSED** |
| **TC-08** | Anti-Hallucination Bullet Optimizer | "made an e-commerce website using React" | "Developed an e-commerce website using React." (No fake numbers) | **PASSED** |
| **TC-09** | Version Delta Comparison | Compare Version 1 vs Version 2 | Displays +17 pts score delta & added skills | **PASSED** |
| **TC-10** | PDF Report Generation | `GET /api/reports/pdf/:id` | Streams valid multi-page PDF document | **PASSED** |

---

## 11. VIVA VOCE QUESTIONS & ANSWERS (COLLEGE DEFENSE)

### Q1: Why did you separate the system into a Node.js backend and a Python AI service?
**A:** Separation of concerns. Node.js excels at asynchronous I/O, REST APIs, JSON handling, JWT authentication, and file routing. Python is the premier ecosystem for natural language processing, text tokenization, and numerical algorithms. Decoupling them allows independent horizontal scaling and ensures a heavy NLP task never blocks the web API event loop.

### Q2: How does your ATS scoring algorithm prevent arbitrary numbers?
**A:** Unlike tools that invoke an unconstrained LLM prompt, ResumeAI calculates every score using documented, explainable formulas. Each sub-score (Skills, Keywords, Structure, Projects, Completeness) is derived from concrete data: verified keyword counts, presence of critical links (GitHub/LinkedIn), word count thresholds, and action-verb frequencies.

### Q3: What is "Anti-Hallucination" in the context of this project?
**A:** Generative AI tools often rewrite bullet points by fabricating statistics (e.g., turning "Built a website" into "Built a website that improved conversions by 35%"). ResumeAI enforces algorithmic guardrails: it elevates syntactic professionalism and active verbs (`Engineered`, `Architected`) while strictly preserving candidate-provided facts without inventing unearned figures.

### Q4: How does the system handle database connectivity if PostgreSQL is unavailable?
**A:** The database layer implements a dual-mode persistence adapter. On initialization, it checks PostgreSQL connectivity. If PostgreSQL is active, it runs standard relational DDL migrations. If credentials are not configured or connection fails, it activates a persistent local JSON store with atomic disk synchronization, ensuring the system operates reliably without blocking.

---

## 12. CONCLUSION & FUTURE SCOPE

**ResumeAI** successfully bridges the gap between automated recruitment algorithms and job applicants. By combining robust document parsing, comprehensive skill extraction, explainable ATS scoring, and fact-grounded recommendations, the platform empowers candidates to optimize their career trajectories with confidence.

### Future Scope:
1. Integration with public job board APIs (LinkedIn, Indeed) for live matching.
2. Multilingual resume parsing across non-English languages.
3. Automated cover letter generation grounded in verified resume facts.
