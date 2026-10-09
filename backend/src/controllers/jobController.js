const axios = require('axios');
const db = require('../db');
const { getAiServiceUrl, callAiWithRetry } = require('../utils/aiConfig');

const jobController = {
  async createJob(req, res, next) {
    try {
      const { title, company, description_text } = req.body;

      if (!description_text || !description_text.trim()) {
        return res.status(400).json({ success: false, message: 'Job description text is required.' });
      }

      // Analyze job skills & requirements via AI
      let jobAnalysis = { required_skills: [], top_keywords: [], experience_required: '' };
      try {
        const aiUrl = getAiServiceUrl();
        const aiResponse = await callAiWithRetry(async () => {
          return await axios.post(`${aiUrl}/ai/analyze-job`, {
            job_description: description_text,
            job_title: title || 'Software Engineer'
          }, { timeout: 60000 });
        }, 3, 3000);
        jobAnalysis = aiResponse.data.data;
      } catch (aiErr) {
        console.warn('AI Job analysis warning:', aiErr.message);
      }

      const jobRecord = await db.jobs.create({
        user_id: req.user.id,
        title: title || 'Target Role',
        company: company || '',
        description_text,
        required_skills: jobAnalysis.required_skills,
        top_keywords: jobAnalysis.top_keywords,
        experience_required: jobAnalysis.experience_required
      });

      res.status(201).json({
        success: true,
        message: 'Job description saved and analyzed successfully.',
        job: jobRecord
      });
    } catch (err) {
      next(err);
    }
  },

  async getAllJobs(req, res, next) {
    try {
      const jobs = await db.jobs.listByUser(req.user.id);
      res.json({
        success: true,
        count: jobs.length,
        jobs
      });
    } catch (err) {
      next(err);
    }
  },

  async getJobById(req, res, next) {
    try {
      const { id } = req.params;
      const job = await db.jobs.findById(id);

      if (!job || job.user_id !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Job description not found.' });
      }

      res.json({ success: true, job });
    } catch (err) {
      next(err);
    }
  },

  async matchResumeWithJob(req, res, next) {
    try {
      const { resumeId, jobId, job_title, job_description } = req.body;

      if (!resumeId) {
        return res.status(400).json({ success: false, message: 'Resume ID is required for matching.' });
      }

      const resume = await db.resumes.findById(resumeId);
      if (!resume || resume.user_id !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Resume not found.' });
      }

      const resumeSkills = (await db.resumeSkills.getByResume(resumeId)).map(s => s.skill_name);

      let targetJobText = job_description;
      let targetJobTitle = job_title || 'Target Job';

      if (jobId) {
        const savedJob = await db.jobs.findById(jobId);
        if (savedJob && savedJob.user_id === req.user.id) {
          targetJobText = savedJob.description_text;
          targetJobTitle = savedJob.title;
        }
      }

      if (!targetJobText || !targetJobText.trim()) {
        return res.status(400).json({ success: false, message: 'Please provide or select a job description.' });
      }

      // Call AI Service for semantic matching (with auto-retry for Render wake-ups)
      const aiUrl = getAiServiceUrl();
      const aiResponse = await callAiWithRetry(async () => {
        return await axios.post(`${aiUrl}/ai/match-resume`, {
          resume_text: resume.raw_text,
          resume_skills: resumeSkills,
          job_description: targetJobText,
          job_title: targetJobTitle
        }, { timeout: 60000 });
      }, 3, 3000);

      const matchData = aiResponse.data.match;

      // Persist Job Match result
      const savedMatch = await db.jobMatches.create({
        user_id: req.user.id,
        resume_id: resume.id,
        job_id: jobId || null,
        job_title: targetJobTitle,
        overall_match_score: matchData.overall_match_score,
        skills_match_score: matchData.skills_match_score,
        semantic_match_score: matchData.semantic_match_score,
        keyword_match_score: matchData.keyword_match_score,
        matched_skills: matchData.matched_skills,
        missing_skills: matchData.missing_skills,
        skill_gap: matchData.skill_gap,
        related_skills: matchData.related_skills,
        important_keywords: matchData.important_keywords
      });

      res.json({
        success: true,
        message: 'Job match analysis completed.',
        match: savedMatch,
        details: matchData
      });
    } catch (err) {
      next(err);
    }
  },

  async getJobMatchById(req, res, next) {
    try {
      const { id } = req.params;
      const match = await db.jobMatches.findById(id);

      if (!match || match.user_id !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Job match record not found.' });
      }

      const resume = await db.resumes.findById(match.resume_id);

      res.json({
        success: true,
        match,
        resume
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = jobController;
