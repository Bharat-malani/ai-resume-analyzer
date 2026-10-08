const axios = require('axios');
const db = require('../db');
const { getAiServiceUrl } = require('../utils/aiConfig');

const analysisController = {
  async analyzeResume(req, res, next) {
    try {
      const { resumeId } = req.params;
      const { weights } = req.body;

      const resume = await db.resumes.findById(resumeId);
      if (!resume || resume.user_id !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Resume not found.' });
      }

      const aiUrl = getAiServiceUrl();
      const aiResponse = await axios.post(`${aiUrl}/ai/analyze-resume`, {
        raw_text: resume.raw_text,
        filename: resume.filename,
        weights: weights || null
      }, { timeout: 60000 });

      const analysisData = aiResponse.data;

      const savedRecord = await db.analyses.create({
        user_id: req.user.id,
        resume_id: resume.id,
        overall_score: analysisData.scoring.overall_score,
        category_scores: analysisData.scoring.category_scores,
        strengths: analysisData.scoring.strengths,
        issues: analysisData.scoring.issues,
        score_breakdown: analysisData.scoring.score_breakdown,
        recommendations: analysisData.recommendations,
        recommended_roles: analysisData.recommended_roles
      });

      res.json({
        success: true,
        message: 'Resume analyzed successfully.',
        analysis: savedRecord,
        details: analysisData
      });
    } catch (err) {
      next(err);
    }
  },

  async getAnalysisById(req, res, next) {
    try {
      const { id } = req.params;
      const analysis = await db.analyses.findById(id);

      if (!analysis || analysis.user_id !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Analysis not found.' });
      }

      const resume = await db.resumes.findById(analysis.resume_id);

      res.json({
        success: true,
        analysis,
        resume
      });
    } catch (err) {
      next(err);
    }
  },

  async improveBullet(req, res, next) {
    try {
      const { bullet_point } = req.body;
      if (!bullet_point || !bullet_point.trim()) {
        return res.status(400).json({ success: false, message: 'Bullet point text is required.' });
      }

      const aiUrl = getAiServiceUrl();
      const aiResponse = await axios.post(`${aiUrl}/ai/improve-bullet`, {
        bullet_point
      }, { timeout: 60000 });

      res.json({
        success: true,
        data: aiResponse.data.data
      });
    } catch (err) {
      next(err);
    }
  },

  async generateSummary(req, res, next) {
    try {
      const { resumeId, target_role } = req.body;
      let skills = [];
      let candidateName = req.user.name;

      if (resumeId) {
        const resumeSkills = await db.resumeSkills.getByResume(resumeId);
        skills = resumeSkills.map(s => s.skill_name);
        const resume = await db.resumes.findById(resumeId);
        if (resume?.personal_info?.name) {
          candidateName = resume.personal_info.name;
        }
      }

      const aiUrl = getAiServiceUrl();
      const aiResponse = await axios.post(`${aiUrl}/ai/generate-summary`, {
        candidate_name: candidateName,
        skills,
        target_role: target_role || 'Software Engineer'
      }, { timeout: 60000 });

      res.json({
        success: true,
        summary: aiResponse.data.summary
      });
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req, res, next) {
    try {
      const analyses = await db.analyses.listByUser(req.user.id);
      const jobMatches = await db.jobMatches.listByUser(req.user.id);

      // Combine both into chronological feed
      const combined = [
        ...analyses.map(a => ({
          id: a.id,
          type: 'RESUME_ANALYSIS',
          title: `ATS Analysis - ${a.resume_title || 'Resume'}`,
          score: a.overall_score,
          resume_id: a.resume_id,
          target: 'ATS Evaluation',
          date: a.created_at
        })),
        ...jobMatches.map(m => ({
          id: m.id,
          type: 'JOB_MATCH',
          title: `Job Match - ${m.job_title}`,
          score: m.overall_match_score,
          resume_id: m.resume_id,
          target: m.job_title,
          date: m.created_at
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      res.json({
        success: true,
        history: combined
      });
    } catch (err) {
      next(err);
    }
  },

  async compareResumes(req, res, next) {
    try {
      const { resumeId1, resumeId2 } = req.body;

      if (!resumeId1 || !resumeId2) {
        return res.status(400).json({ success: false, message: 'Please specify two resumes to compare.' });
      }

      const r1 = await db.resumes.findById(resumeId1);
      const r2 = await db.resumes.findById(resumeId2);

      if (!r1 || !r2 || r1.user_id !== req.user.id || r2.user_id !== req.user.id) {
        return res.status(404).json({ success: false, message: 'One or both resumes not found.' });
      }

      const s1 = (await db.resumeSkills.getByResume(resumeId1)).map(s => s.skill_name);
      const s2 = (await db.resumeSkills.getByResume(resumeId2)).map(s => s.skill_name);

      const a1 = await db.analyses.getLatestForResume(resumeId1);
      const a2 = await db.analyses.getLatestForResume(resumeId2);

      const score1 = a1 ? a1.overall_score : 0;
      const score2 = a2 ? a2.overall_score : 0;
      const scoreDelta = score2 - score1;

      const set1 = new Set(s1);
      const set2 = new Set(s2);

      const addedSkills = s2.filter(s => !set1.has(s));
      const removedSkills = s1.filter(s => !set2.has(s));
      const sharedSkills = s1.filter(s => set2.has(s));

      res.json({
        success: true,
        comparison: {
          resume1: {
            id: r1.id,
            title: r1.title,
            score: score1,
            skills_count: s1.length,
            word_count: r1.word_count,
            created_at: r1.created_at,
            category_scores: a1 ? a1.category_scores : {}
          },
          resume2: {
            id: r2.id,
            title: r2.title,
            score: score2,
            skills_count: s2.length,
            word_count: r2.word_count,
            created_at: r2.created_at,
            category_scores: a2 ? a2.category_scores : {}
          },
          score_delta: scoreDelta,
          added_skills: addedSkills,
          removed_skills: removedSkills,
          shared_skills: sharedSkills
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = analysisController;
