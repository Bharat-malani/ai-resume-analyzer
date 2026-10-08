-- ResumeAI PostgreSQL Schema
-- Tables for users, resumes, skills, jobs, analyses, and history

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resumes (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(64) NOT NULL,
    raw_text TEXT NOT NULL,
    personal_info JSONB,
    word_count INTEGER DEFAULT 0,
    version_number INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resume_sections (
    id VARCHAR(64) PRIMARY KEY,
    resume_id VARCHAR(64) REFERENCES resumes(id) ON DELETE CASCADE,
    section_name VARCHAR(64) NOT NULL,
    content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) UNIQUE NOT NULL,
    category VARCHAR(128) NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resume_skills (
    id VARCHAR(64) PRIMARY KEY,
    resume_id VARCHAR(64) REFERENCES resumes(id) ON DELETE CASCADE,
    skill_name VARCHAR(128) NOT NULL,
    category VARCHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS job_descriptions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    description_text TEXT NOT NULL,
    required_skills JSONB,
    top_keywords JSONB,
    experience_required VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analyses (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    resume_id VARCHAR(64) REFERENCES resumes(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL,
    category_scores JSONB NOT NULL,
    strengths JSONB NOT NULL,
    issues JSONB NOT NULL,
    score_breakdown JSONB,
    recommendations JSONB,
    recommended_roles JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_matches (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    resume_id VARCHAR(64) REFERENCES resumes(id) ON DELETE CASCADE,
    job_id VARCHAR(64) REFERENCES job_descriptions(id) ON DELETE CASCADE,
    job_title VARCHAR(255),
    overall_match_score INTEGER NOT NULL,
    skills_match_score INTEGER NOT NULL,
    semantic_match_score INTEGER NOT NULL,
    keyword_match_score INTEGER NOT NULL,
    matched_skills JSONB NOT NULL,
    missing_skills JSONB NOT NULL,
    skill_gap JSONB NOT NULL,
    related_skills JSONB,
    important_keywords JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_resume ON analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_user ON job_matches(user_id);
