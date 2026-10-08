# ResumeAI — AI-Powered Resume Analyzer & Job Match System

**ResumeAI** is an enterprise-grade, full-stack SaaS platform designed for college students, software engineers, and hiring managers. It provides transparent, explainable **Applicant Tracking System (ATS)** scoring, skill gap detection, bullet-point optimization without hallucinated metrics, semantic job matching, and downloadable PDF analysis reports.

---

## Table of Contents
1. [Key Features](#key-features)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Folder Structure](#folder-structure)
5. [Prerequisites & Local Installation](#prerequisites--local-installation)
6. [Running Locally](#running-locally)
7. [REST API Documentation](#rest-api-documentation)
8. [ATS Scoring Methodology](#ats-scoring-methodology)
9. [Anti-Hallucination Framework](#anti-hallucination-framework)
10. [Database Schema](#database-schema)
11. [Testing & Verification](#testing--verification)
12. [Production Deployment Guide](#production-deployment-guide)

---

## 1. Key Features

- **Multi-Format Document Parsing:** Ingests PDF and DOCX files, normalizing whitespace and segmenting standard sections (Summary, Skills, Experience, Projects, Education, Certifications).
- **350+ Categorized Skills Taxonomy:** Automatically extracts technical and soft skills with full alias resolution (e.g., `JS` → `JavaScript`, `K8s` → `Kubernetes`, `Postgres` → `PostgreSQL`).
- **Explainable ATS Scoring Engine:** Deterministic, non-arbitrary score calculated across 5 weighted dimensions:
  - 40% Skill Match & Breadth
  - 25% Keyword Relevance & Density
  - 15% Resume Structure & ATS Formatting Safety
  - 10% Project Quality & Impact Metrics
  - 10% Section Completeness & Contact Links
- **Semantic Job Description Matching:** Uses TF-IDF N-grams and Cosine Similarity to benchmark candidate resumes against real job postings.
- **Skill Gap Prioritization:** Categorizes missing requirements into `High`, `Medium`, and `Low` priorities.
- **Anti-Hallucination AI Recommendations:** Re-writes passive bullet points using strong action verbs without fabricating false metrics, unearned degrees, or unmentioned technologies.
- **Version Tracking & Comparison:** Maintains history of previous resume submissions with side-by-side score delta comparisons and skill evolution graphs.
- **Executive PDF Report Export:** Streams comprehensive multi-page PDF evaluation reports.
- **Admin Control Center:** Manage platform users, view usage metrics, and modify the canonical skills catalog.

---

## 2. System Architecture

```
                       Browser (User Interface)
                                  │
                                  ▼
                     React 18 + Vite Frontend
                    (Tailwind CSS, Recharts)
                                  │
                                  ▼
                   Node.js / Express REST API
             (JWT Auth, Multer Upload, PDF Generation)
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
      PostgreSQL / Local DB              Python 3.12 FastAPI
  (Users, Resumes, Analyses, Jobs)     (pypdf, python-docx, NLP,
                                        TF-IDF Cosine Matcher,
                                        Scoring & Bullet Optimizer)
```

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS with custom SaaS color palette
- **Icons:** Lucide React
- **Data Visualization:** Recharts (Line Charts, Bar Charts, SVG Dials)
- **Routing & Networking:** React Router DOM v6, Axios

### Backend
- **Runtime:** Node.js 24 with Express
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs password hashing
- **File Ingestion:** Multer (with MIME & extension filtering)
- **Document Generation:** PDFKit
- **Database Driver:** `pg` (PostgreSQL) with automatic zero-config persistent local storage fallback

### AI & NLP Microservice
- **Runtime:** Python 3.12 with FastAPI & Uvicorn
- **Document Parsing:** `pypdf` (PDF), `python-docx` (DOCX)
- **NLP & Similarity:** Pure-Python Vectorizer, TF-IDF N-grams, Cosine Similarity
- **Data Validation:** Pydantic v2 schemas

---

## 4. Folder Structure

```
ai-resume-analyzer/
├── run_all.bat               # 1-Click launcher for all 3 services
├── run_ai.bat                # Python AI service launcher
├── run_backend.bat           # Node.js backend launcher
├── run_frontend.bat          # React Vite launcher
├── ai_service/
│   ├── app/
│   │   ├── main.py           # FastAPI application endpoints
│   │   ├── parser.py         # PDF/DOCX text & section parser
│   │   ├── skills.py         # 350+ skills taxonomy with alias mapping
│   │   ├── scoring.py        # Explainable ATS scoring engine
│   │   ├── matcher.py        # Semantic TF-IDF matching engine
│   │   └── suggestions.py    # Anti-hallucination recommendation agent
│   ├── requirements.txt      # Python dependencies
│   └── test_e2e_ai.py        # AI verification script
├── backend/
│   ├── src/
│   │   ├── controllers/      # Auth, Resume, Job, Analysis, Admin, Report
│   │   ├── middleware/       # Auth, Admin, Upload, ErrorHandler
│   │   ├── routes/           # REST API routes
│   │   ├── db/               # PostgreSQL schema & persistent storage adapter
│   │   └── server.js         # Express server entrypoint
│   ├── uploads/              # Storage directory for uploaded resumes
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Layout, Sidebar, Navbar, ScoreRing, Modal, Toast
│   │   ├── pages/            # 14 complete SaaS pages
│   │   ├── context/          # AuthContext, ToastContext
│   │   ├── api/client.js     # Axios API service
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── package.json
├── README.md
└── PROJECT_REPORT.md
```

---

## 5. Prerequisites & Local Installation

1. **Node.js** (v18 or higher)
2. **Python** (v3.11 or v3.12) or `uv`
3. **PostgreSQL** (optional; the app features automatic local persistence if credentials are not configured)

---

## 6. Running Locally

### Option 1: 1-Click Windows Launcher (Fastest)
Double-click `run_all.bat` in the root project folder. It launches all 3 services in separate terminal windows.

### Option 2: Run Services Manually

#### Step 1: Start the Python AI Microservice
```bash
cd ai_service
.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Runs on `http://127.0.0.1:8000` (Swagger docs available at `/docs`).*

#### Step 2: Start the Node.js Backend API
```bash
cd backend
node src/server.js
```
*Runs on `http://localhost:5000`.*

#### Step 3: Start the React Frontend
```bash
cd frontend
npm.cmd run dev
```
*Opens on `http://localhost:5173`.*

---

## 7. Pre-Seeded Demo Accounts

The database comes pre-seeded with sample credentials for immediate testing:
- **Candidate Account:** `demo@resumeai.io` / Password: `demo1234`
- **Administrator Account:** `admin@resumeai.io` / Password: `admin1234`
- *(Or register any new account on `/register`).*

---

## 8. REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new account (name, email, password) |
| `POST` | `/api/auth/login` | Sign in and receive JWT token |
| `GET` | `/api/auth/me` | Retrieve active authenticated session |

### Resumes (`/api/resumes`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/resumes/upload` | Upload PDF/DOCX resume file via multipart form |
| `GET` | `/api/resumes` | List all resumes belonging to user |
| `GET` | `/api/resumes/:id` | Fetch resume details, sections, and detected skills |
| `DELETE` | `/api/resumes/:id` | Permanently remove resume and files |

### Analysis (`/api/analysis`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analysis/resume/:resumeId` | Run ATS score calculation with custom weights |
| `GET` | `/api/analysis/:id` | Fetch complete ATS analysis report |
| `POST` | `/api/analysis/improve-bullet` | Enhance bullet point using strong action verbs |
| `POST` | `/api/analysis/generate-summary` | Generate fact-grounded professional summary |
| `POST` | `/api/analysis/compare` | Compare two resume versions side-by-side |
| `GET` | `/api/analysis/user/history` | Chronological audit log of user analyses |

### Job Matching (`/api/jobs`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/jobs` | Save job description and extract requirements |
| `GET` | `/api/jobs` | List user saved job descriptions |
| `POST` | `/api/jobs/match` | Compute semantic TF-IDF match & skill gaps |
| `GET` | `/api/jobs/match/:id` | Retrieve saved job match evaluation |

### Reports & Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports/pdf/:analysisId` | Download styled PDF evaluation report |
| `GET` | `/api/admin/statistics` | System-wide statistics (users, scans, averages) |
| `GET` | `/api/admin/users` | List registered accounts |
| `GET/POST/DELETE` | `/api/admin/skills` | Manage platform skills taxonomy |

---

## 9. ATS Scoring Methodology

Scoring weights are completely transparent and configurable:
$$\text{Overall Score} = 0.40 \cdot S_{\text{skills}} + 0.25 \cdot S_{\text{keywords}} + 0.15 \cdot S_{\text{structure}} + 0.10 \cdot S_{\text{projects}} + 0.10 \cdot S_{\text{completeness}}$$

1. **Skill Match ($S_{\text{skills}}$):** Evaluates depth and breadth across categorized domains (Languages, Frontend, Backend, Databases, Cloud).
2. **Keyword Relevance ($S_{\text{keywords}}$):** Evaluates natural technical keyword density without penalizing formatting.
3. **Resume Structure ($S_{\text{structure}}$):** Verifies word count (optimal: 350–900 words) and standard section headers.
4. **Project Quality ($S_{\text{projects}}$):** Checks for active verbs (`Engineered`, `Architected`, `Deployed`) and scope metrics.
5. **Section Completeness ($S_{\text{completeness}}$):** Validates email, phone, LinkedIn, GitHub, and core sections.

---

## 10. Anti-Hallucination Framework

Unlike naive generative wrappers, ResumeAI enforces strict safeguards:
- **No Fabricated Metrics:** Never adds unauthorized numerical statistics (e.g. "increased revenue by 30%") to bullet points.
- **Factual Grounding:** Professional summaries and role matches strictly reference candidate-verified skills.
- **Explainable Insights:** Every recommendation explicitly quotes the missing requirement.

---

## 11. Production Deployment Guide

### Frontend Deployment (Vercel / Netlify)
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_BASE_URL=https://your-backend-api.com/api`

### Backend Deployment (Render / Railway)
- **Build Command:** `npm install`
- **Start Command:** `node src/server.js`
- **Environment Variables:**
  - `PORT=5000`
  - `DATABASE_URL=postgresql://user:password@host:5432/dbname`
  - `JWT_SECRET=your-production-secret-key`
  - `AI_SERVICE_URL=https://your-python-ai-service.com`

### Python AI Service Deployment (Render / Railway)
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Requirements:** `ai_service/requirements.txt`
