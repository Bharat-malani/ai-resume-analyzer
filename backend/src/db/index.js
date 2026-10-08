const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

let pool = null;
let usePostgres = false;

// Path for fallback persistent JSON database
const dataDir = path.join(__dirname, '..', '..', 'data');
const jsonDbPath = path.join(dataDir, 'db.json');

// Initial default state for JSON database fallback
const defaultState = {
  users: [],
  resumes: [],
  resume_sections: [],
  skills: [
    { id: '1', name: 'JavaScript', category: 'Programming Languages', is_verified: true },
    { id: '2', name: 'Python', category: 'Programming Languages', is_verified: true },
    { id: '3', name: 'Java', category: 'Programming Languages', is_verified: true },
    { id: '4', name: 'React', category: 'Frontend Development', is_verified: true },
    { id: '5', name: 'Node.js', category: 'Backend & Frameworks', is_verified: true },
    { id: '6', name: 'PostgreSQL', category: 'Databases & Storage', is_verified: true },
    { id: '7', name: 'Docker', category: 'Cloud & DevOps', is_verified: true },
    { id: '8', name: 'Git', category: 'Tools & Methodologies', is_verified: true }
  ],
  resume_skills: [],
  job_descriptions: [],
  analyses: [],
  job_matches: []
};

// Memory cache synced to disk for JSON DB
let memoryDb = null;

function loadJsonDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(jsonDbPath)) {
    fs.writeFileSync(jsonDbPath, JSON.stringify(defaultState, null, 2), 'utf-8');
    memoryDb = JSON.parse(JSON.stringify(defaultState));
  } else {
    try {
      memoryDb = JSON.parse(fs.readFileSync(jsonDbPath, 'utf-8'));
    } catch (e) {
      memoryDb = JSON.parse(JSON.stringify(defaultState));
    }
  }
}

function saveJsonDb() {
  if (!memoryDb) return;
  fs.writeFileSync(jsonDbPath, JSON.stringify(memoryDb, null, 2), 'utf-8');
}

async function initDb() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/resumeai';
  console.log('[Database] Checking connection...');

  try {
    const testPool = new Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 3000
    });
    
    // Quick test query
    await testPool.query('SELECT 1;');
    pool = testPool;
    usePostgres = true;
    console.log('[Database] Connected to PostgreSQL successfully!');

    // Initialize schema
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('[Database] PostgreSQL schema initialized.');
  } catch (err) {
    console.warn(`[Database] PostgreSQL not connected (${err.message}). Activating persistent local storage.`);
    usePostgres = false;
    loadJsonDb();
    console.log(`[Database] Local database initialized at: ${jsonDbPath}`);
  }
}

// ----------------------------------------------------
// Unified Database Repository Methods
// ----------------------------------------------------

const db = {
  initDb,
  isPostgres: () => usePostgres,

  // Users
  users: {
    async findByEmail(email) {
      if (usePostgres) {
        const res = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1;', [email.toLowerCase()]);
        return res.rows[0] || null;
      }
      return memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },

    async findById(id) {
      if (usePostgres) {
        const res = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1;', [id]);
        return res.rows[0] || null;
      }
      const u = memoryDb.users.find(user => user.id === id);
      if (!u) return null;
      const { password_hash, ...safeUser } = u;
      return safeUser;
    },

    async create({ name, email, password_hash, role = 'USER' }) {
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      if (usePostgres) {
        await pool.query(
          'INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $6);',
          [id, name, email.toLowerCase(), password_hash, role, createdAt]
        );
        return { id, name, email: email.toLowerCase(), role, created_at: createdAt };
      }
      const newUser = { id, name, email: email.toLowerCase(), password_hash, role, created_at: createdAt };
      memoryDb.users.push(newUser);
      saveJsonDb();
      const { password_hash: _, ...safeUser } = newUser;
      return safeUser;
    },

    async listAll() {
      if (usePostgres) {
        const res = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC;');
        return res.rows;
      }
      return memoryDb.users.map(({ password_hash, ...u }) => u);
    }
  },

  // Resumes
  resumes: {
    async create(resumeData) {
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      const item = {
        id,
        user_id: resumeData.user_id,
        title: resumeData.title,
        filename: resumeData.filename,
        file_path: resumeData.file_path,
        file_size: resumeData.file_size,
        file_type: resumeData.file_type,
        raw_text: resumeData.raw_text,
        personal_info: resumeData.personal_info || {},
        word_count: resumeData.word_count || 0,
        version_number: resumeData.version_number || 1,
        created_at: createdAt,
        updated_at: createdAt
      };

      if (usePostgres) {
        await pool.query(
          `INSERT INTO resumes (id, user_id, title, filename, file_path, file_size, file_type, raw_text, personal_info, word_count, version_number, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`,
          [item.id, item.user_id, item.title, item.filename, item.file_path, item.file_size, item.file_type, item.raw_text, JSON.stringify(item.personal_info), item.word_count, item.version_number, item.created_at, item.updated_at]
        );
      } else {
        memoryDb.resumes.push(item);
        saveJsonDb();
      }
      return item;
    },

    async listByUser(userId) {
      if (usePostgres) {
        const res = await pool.query(
          `SELECT r.*, a.overall_score, a.id as latest_analysis_id
           FROM resumes r
           LEFT JOIN (
             SELECT DISTINCT ON (resume_id) id, resume_id, overall_score
             FROM analyses ORDER BY resume_id, created_at DESC
           ) a ON a.resume_id = r.id
           WHERE r.user_id = $1
           ORDER BY r.created_at DESC;`,
          [userId]
        );
        return res.rows;
      }
      return memoryDb.resumes
        .filter(r => r.user_id === userId)
        .map(r => {
          const userAnalyses = memoryDb.analyses.filter(a => a.resume_id === r.id);
          const latest = userAnalyses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
          return {
            ...r,
            overall_score: latest ? latest.overall_score : null,
            latest_analysis_id: latest ? latest.id : null
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    async findById(id) {
      if (usePostgres) {
        const res = await pool.query('SELECT * FROM resumes WHERE id = $1;', [id]);
        return res.rows[0] || null;
      }
      return memoryDb.resumes.find(r => r.id === id) || null;
    },

    async delete(id, userId) {
      if (usePostgres) {
        const res = await pool.query('DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING *;', [id, userId]);
        return res.rowCount > 0;
      }
      const initialLen = memoryDb.resumes.length;
      memoryDb.resumes = memoryDb.resumes.filter(r => !(r.id === id && r.user_id === userId));
      memoryDb.analyses = memoryDb.analyses.filter(a => a.resume_id !== id);
      memoryDb.resume_sections = memoryDb.resume_sections.filter(s => s.resume_id !== id);
      memoryDb.resume_skills = memoryDb.resume_skills.filter(sk => sk.resume_id !== id);
      saveJsonDb();
      return memoryDb.resumes.length < initialLen;
    }
  },

  // Resume Sections & Skills
  sections: {
    async save(resumeId, sectionsObj) {
      if (usePostgres) {
        await pool.query('DELETE FROM resume_sections WHERE resume_id = $1;', [resumeId]);
        for (const [name, content] of Object.entries(sectionsObj)) {
          if (content && content.trim()) {
            await pool.query(
              'INSERT INTO resume_sections (id, resume_id, section_name, content) VALUES ($1, $2, $3, $4);',
              [uuidv4(), resumeId, name, content]
            );
          }
        }
      } else {
        memoryDb.resume_sections = memoryDb.resume_sections.filter(s => s.resume_id !== resumeId);
        for (const [name, content] of Object.entries(sectionsObj)) {
          if (content && content.trim()) {
            memoryDb.resume_sections.push({ id: uuidv4(), resume_id: resumeId, section_name: name, content });
          }
        }
        saveJsonDb();
      }
    },

    async getByResume(resumeId) {
      if (usePostgres) {
        const res = await pool.query('SELECT section_name, content FROM resume_sections WHERE resume_id = $1;', [resumeId]);
        const map = {};
        res.rows.forEach(r => { map[r.section_name] = r.content; });
        return map;
      }
      const map = {};
      memoryDb.resume_sections.filter(s => s.resume_id === resumeId).forEach(r => { map[r.section_name] = r.content; });
      return map;
    }
  },

  resumeSkills: {
    async save(resumeId, skillsList, categoryMap = {}) {
      if (usePostgres) {
        await pool.query('DELETE FROM resume_skills WHERE resume_id = $1;', [resumeId]);
        for (const skill of skillsList) {
          const category = categoryMap[skill] || 'General';
          await pool.query(
            'INSERT INTO resume_skills (id, resume_id, skill_name, category) VALUES ($1, $2, $3, $4);',
            [uuidv4(), resumeId, skill, category]
          );
        }
      } else {
        memoryDb.resume_skills = memoryDb.resume_skills.filter(s => s.resume_id !== resumeId);
        for (const skill of skillsList) {
          const category = categoryMap[skill] || 'General';
          memoryDb.resume_skills.push({ id: uuidv4(), resume_id: resumeId, skill_name: skill, category });
        }
        saveJsonDb();
      }
    },

    async getByResume(resumeId) {
      if (usePostgres) {
        const res = await pool.query('SELECT skill_name, category FROM resume_skills WHERE resume_id = $1;', [resumeId]);
        return res.rows;
      }
      return memoryDb.resume_skills.filter(s => s.resume_id === resumeId);
    }
  },

  // Analyses
  analyses: {
    async create(data) {
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      const item = {
        id,
        user_id: data.user_id,
        resume_id: data.resume_id,
        overall_score: data.overall_score,
        category_scores: data.category_scores,
        strengths: data.strengths,
        issues: data.issues,
        score_breakdown: data.score_breakdown,
        recommendations: data.recommendations,
        recommended_roles: data.recommended_roles || [],
        created_at: createdAt
      };

      if (usePostgres) {
        await pool.query(
          `INSERT INTO analyses (id, user_id, resume_id, overall_score, category_scores, strengths, issues, score_breakdown, recommendations, recommended_roles, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
          [id, item.user_id, item.resume_id, item.overall_score, JSON.stringify(item.category_scores), JSON.stringify(item.strengths), JSON.stringify(item.issues), JSON.stringify(item.score_breakdown), JSON.stringify(item.recommendations), JSON.stringify(item.recommended_roles), createdAt]
        );
      } else {
        memoryDb.analyses.push(item);
        saveJsonDb();
      }
      return item;
    },

    async findById(id) {
      if (usePostgres) {
        const res = await pool.query('SELECT * FROM analyses WHERE id = $1;', [id]);
        return res.rows[0] || null;
      }
      return memoryDb.analyses.find(a => a.id === id) || null;
    },

    async getLatestForResume(resumeId) {
      if (usePostgres) {
        const res = await pool.query('SELECT * FROM analyses WHERE resume_id = $1 ORDER BY created_at DESC LIMIT 1;', [resumeId]);
        return res.rows[0] || null;
      }
      return memoryDb.analyses
        .filter(a => a.resume_id === resumeId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
    },

    async listByUser(userId) {
      if (usePostgres) {
        const res = await pool.query(
          `SELECT a.*, r.title as resume_title, r.filename
           FROM analyses a
           JOIN resumes r ON r.id = a.resume_id
           WHERE a.user_id = $1
           ORDER BY a.created_at DESC;`,
          [userId]
        );
        return res.rows;
      }
      return memoryDb.analyses
        .filter(a => a.user_id === userId)
        .map(a => {
          const resume = memoryDb.resumes.find(r => r.id === a.resume_id);
          return {
            ...a,
            resume_title: resume ? resume.title : 'Resume',
            filename: resume ? resume.filename : ''
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  },

  // Jobs
  jobs: {
    async create(data) {
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      const item = {
        id,
        user_id: data.user_id,
        title: data.title,
        company: data.company || '',
        description_text: data.description_text,
        required_skills: data.required_skills || [],
        top_keywords: data.top_keywords || [],
        experience_required: data.experience_required || '',
        created_at: createdAt
      };

      if (usePostgres) {
        await pool.query(
          `INSERT INTO job_descriptions (id, user_id, title, company, description_text, required_skills, top_keywords, experience_required, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
          [id, item.user_id, item.title, item.company, item.description_text, JSON.stringify(item.required_skills), JSON.stringify(item.top_keywords), item.experience_required, createdAt]
        );
      } else {
        memoryDb.job_descriptions.push(item);
        saveJsonDb();
      }
      return item;
    },

    async listByUser(userId) {
      if (usePostgres) {
        const res = await pool.query('SELECT * FROM job_descriptions WHERE user_id = $1 ORDER BY created_at DESC;', [userId]);
        return res.rows;
      }
      return memoryDb.job_descriptions
        .filter(j => j.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    async findById(id) {
      if (usePostgres) {
        const res = await pool.query('SELECT * FROM job_descriptions WHERE id = $1;', [id]);
        return res.rows[0] || null;
      }
      return memoryDb.job_descriptions.find(j => j.id === id) || null;
    },

    async delete(id, userId) {
      if (usePostgres) {
        const res = await pool.query('DELETE FROM job_descriptions WHERE id = $1 AND user_id = $2 RETURNING *;', [id, userId]);
        return res.rowCount > 0;
      }
      const initial = memoryDb.job_descriptions.length;
      memoryDb.job_descriptions = memoryDb.job_descriptions.filter(j => !(j.id === id && j.user_id === userId));
      saveJsonDb();
      return memoryDb.job_descriptions.length < initial;
    }
  },

  // Job Matches
  jobMatches: {
    async create(data) {
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      const item = {
        id,
        user_id: data.user_id,
        resume_id: data.resume_id,
        job_id: data.job_id || null,
        job_title: data.job_title || 'Target Job',
        overall_match_score: data.overall_match_score,
        skills_match_score: data.skills_match_score,
        semantic_match_score: data.semantic_match_score,
        keyword_match_score: data.keyword_match_score,
        matched_skills: data.matched_skills || [],
        missing_skills: data.missing_skills || [],
        skill_gap: data.skill_gap || [],
        related_skills: data.related_skills || [],
        important_keywords: data.important_keywords || [],
        created_at: createdAt
      };

      if (usePostgres) {
        await pool.query(
          `INSERT INTO job_matches (id, user_id, resume_id, job_id, job_title, overall_match_score, skills_match_score, semantic_match_score, keyword_match_score, matched_skills, missing_skills, skill_gap, related_skills, important_keywords, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);`,
          [id, item.user_id, item.resume_id, item.job_id, item.job_title, item.overall_match_score, item.skills_match_score, item.semantic_match_score, item.keyword_match_score, JSON.stringify(item.matched_skills), JSON.stringify(item.missing_skills), JSON.stringify(item.skill_gap), JSON.stringify(item.related_skills), JSON.stringify(item.important_keywords), createdAt]
        );
      } else {
        memoryDb.job_matches.push(item);
        saveJsonDb();
      }
      return item;
    },

    async findById(id) {
      if (usePostgres) {
        const res = await pool.query('SELECT * FROM job_matches WHERE id = $1;', [id]);
        return res.rows[0] || null;
      }
      return memoryDb.job_matches.find(m => m.id === id) || null;
    },

    async listByUser(userId) {
      if (usePostgres) {
        const res = await pool.query(
          `SELECT jm.*, r.title as resume_title, r.filename
           FROM job_matches jm
           JOIN resumes r ON r.id = jm.resume_id
           WHERE jm.user_id = $1
           ORDER BY jm.created_at DESC;`,
          [userId]
        );
        return res.rows;
      }
      return memoryDb.job_matches
        .filter(m => m.user_id === userId)
        .map(m => {
          const resume = memoryDb.resumes.find(r => r.id === m.resume_id);
          return {
            ...m,
            resume_title: resume ? resume.title : 'Resume',
            filename: resume ? resume.filename : ''
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    async delete(id, userId) {
      if (usePostgres) {
        const res = await pool.query('DELETE FROM job_matches WHERE id = $1 AND user_id = $2 RETURNING *;', [id, userId]);
        return res.rowCount > 0;
      }
      const initial = memoryDb.job_matches.length;
      memoryDb.job_matches = memoryDb.job_matches.filter(m => !(m.id === id && m.user_id === userId));
      saveJsonDb();
      return memoryDb.job_matches.length < initial;
    }
  },

  // Skills Catalog (Admin)
  skillsCatalog: {
    async listAll() {
      if (usePostgres) {
        const res = await pool.query('SELECT * FROM skills ORDER BY category, name ASC;');
        return res.rows;
      }
      return memoryDb.skills.slice().sort((a, b) => a.name.localeCompare(b.name));
    },

    async create({ name, category, is_verified = true }) {
      const id = uuidv4();
      const item = { id, name, category, is_verified, created_at: new Date().toISOString() };
      if (usePostgres) {
        await pool.query(
          'INSERT INTO skills (id, name, category, is_verified, created_at) VALUES ($1, $2, $3, $4, $5);',
          [id, name, category, is_verified, item.created_at]
        );
      } else {
        memoryDb.skills.push(item);
        saveJsonDb();
      }
      return item;
    },

    async update(id, updates) {
      if (usePostgres) {
        const res = await pool.query(
          'UPDATE skills SET name = COALESCE($1, name), category = COALESCE($2, category) WHERE id = $3 RETURNING *;',
          [updates.name, updates.category, id]
        );
        return res.rows[0] || null;
      }
      const skill = memoryDb.skills.find(s => s.id === id);
      if (skill) {
        if (updates.name) skill.name = updates.name;
        if (updates.category) skill.category = updates.category;
        saveJsonDb();
      }
      return skill;
    },

    async delete(id) {
      if (usePostgres) {
        const res = await pool.query('DELETE FROM skills WHERE id = $1 RETURNING *;', [id]);
        return res.rowCount > 0;
      }
      const len = memoryDb.skills.length;
      memoryDb.skills = memoryDb.skills.filter(s => s.id !== id);
      saveJsonDb();
      return memoryDb.skills.length < len;
    }
  },

  // System Stats (Admin & Dashboard)
  async getSystemStats() {
    if (usePostgres) {
      const uRes = await pool.query('SELECT COUNT(*) as count FROM users;');
      const rRes = await pool.query('SELECT COUNT(*) as count FROM resumes;');
      const aRes = await pool.query('SELECT COUNT(*) as count, AVG(overall_score) as avg_score, MAX(overall_score) as max_score FROM analyses;');
      const jmRes = await pool.query('SELECT COUNT(*) as count, AVG(overall_match_score) as avg_match FROM job_matches;');

      return {
        total_users: parseInt(uRes.rows[0].count, 10),
        total_resumes: parseInt(rRes.rows[0].count, 10),
        total_analyses: parseInt(aRes.rows[0].count, 10),
        avg_score: Math.round(parseFloat(aRes.rows[0].avg_score || 0)),
        best_score: parseInt(aRes.rows[0].max_score || 0, 10),
        total_job_matches: parseInt(jmRes.rows[0].count, 10),
        avg_match_score: Math.round(parseFloat(jmRes.rows[0].avg_match || 0))
      };
    }

    const totalAnalyses = memoryDb.analyses.length;
    const scores = memoryDb.analyses.map(a => a.overall_score);
    const avgScore = totalAnalyses > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / totalAnalyses) : 0;
    const bestScore = totalAnalyses > 0 ? Math.max(...scores) : 0;

    return {
      total_users: memoryDb.users.length,
      total_resumes: memoryDb.resumes.length,
      total_analyses: totalAnalyses,
      avg_score: avgScore,
      best_score: bestScore,
      total_job_matches: memoryDb.job_matches.length,
      avg_match_score: memoryDb.job_matches.length > 0 
        ? Math.round(memoryDb.job_matches.reduce((acc, m) => acc + m.overall_match_score, 0) / memoryDb.job_matches.length) 
        : 0
    };
  }
};

module.exports = db;
