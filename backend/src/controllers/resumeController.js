const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const db = require('../db');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const resumeController = {
  async uploadResume(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload a PDF or DOCX file.' });
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname;
      const fileSize = req.file.size;
      const fileType = path.extname(fileName).replace('.', '').toUpperCase();

      // 1. Send file to Python AI Service for parsing
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath), {
        filename: fileName,
        contentType: req.file.mimetype
      });

      let parseResult;
      try {
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/parse-resume`, form, {
          headers: form.getHeaders(),
          timeout: 25000
        });
        parseResult = aiResponse.data.data;
      } catch (aiErr) {
        console.error('[AI Service Error]', aiErr.response?.data || aiErr.message);
        return res.status(502).json({
          success: false,
          message: aiErr.response?.data?.detail || 'Resume uploaded, but AI parsing service is temporarily unavailable. Please ensure the Python service is running.'
        });
      }

      // 2. Count existing resumes for versioning
      const userResumes = await db.resumes.listByUser(req.user.id);
      const versionNumber = userResumes.length + 1;
      const resumeTitle = req.body.title || `${fileName.replace(/\.[^/.]+$/, '')} (v${versionNumber})`;

      // 3. Save Resume in DB
      const resumeRecord = await db.resumes.create({
        user_id: req.user.id,
        title: resumeTitle,
        filename: fileName,
        file_path: filePath,
        file_size: fileSize,
        file_type: fileType,
        raw_text: parseResult.raw_text,
        personal_info: parseResult.personal_info,
        word_count: parseResult.word_count,
        version_number: versionNumber
      });

      // 4. Save Sections & Skills
      if (parseResult.sections) {
        await db.sections.save(resumeRecord.id, parseResult.sections);
      }
      if (parseResult.extracted_skills?.skills) {
        const catMap = {};
        for (const [cat, skList] of Object.entries(parseResult.extracted_skills.categories || {})) {
          skList.forEach(sk => { catMap[sk] = cat; });
        }
        await db.resumeSkills.save(resumeRecord.id, parseResult.extracted_skills.skills, catMap);
      }

      // 5. Automatically run initial ATS Scoring & Recommendations
      let analysisRecord = null;
      try {
        const analyzeResponse = await axios.post(`${AI_SERVICE_URL}/ai/analyze-resume`, {
          raw_text: parseResult.raw_text,
          filename: fileName
        }, { timeout: 20000 });

        const analysisData = analyzeResponse.data;
        analysisRecord = await db.analyses.create({
          user_id: req.user.id,
          resume_id: resumeRecord.id,
          overall_score: analysisData.scoring.overall_score,
          category_scores: analysisData.scoring.category_scores,
          strengths: analysisData.scoring.strengths,
          issues: analysisData.scoring.issues,
          score_breakdown: analysisData.scoring.score_breakdown,
          recommendations: analysisData.recommendations,
          recommended_roles: analysisData.recommended_roles
        });
      } catch (scoreErr) {
        console.warn('[Scoring Warning] Initial scoring failed:', scoreErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Resume uploaded and analyzed successfully.',
        resume: resumeRecord,
        parsed_data: parseResult,
        analysis: analysisRecord
      });
    } catch (err) {
      next(err);
    }
  },

  async getAllResumes(req, res, next) {
    try {
      const resumes = await db.resumes.listByUser(req.user.id);
      res.json({
        success: true,
        count: resumes.length,
        resumes
      });
    } catch (err) {
      next(err);
    }
  },

  async getResumeById(req, res, next) {
    try {
      const { id } = req.params;
      const resume = await db.resumes.findById(id);

      if (!resume || resume.user_id !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Resume not found.' });
      }

      const sections = await db.sections.getByResume(id);
      const skills = await db.resumeSkills.getByResume(id);
      const latestAnalysis = await db.analyses.getLatestForResume(id);

      res.json({
        success: true,
        resume,
        sections,
        skills,
        latest_analysis: latestAnalysis
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteResume(req, res, next) {
    try {
      const { id } = req.params;
      const resume = await db.resumes.findById(id);

      if (!resume || resume.user_id !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Resume not found.' });
      }

      // Remove file if exists on disk
      if (fs.existsSync(resume.file_path)) {
        try {
          fs.unlinkSync(resume.file_path);
        } catch (fErr) {
          console.warn('Failed to delete physical file:', fErr.message);
        }
      }

      await db.resumes.delete(id, req.user.id);

      res.json({
        success: true,
        message: 'Resume and associated analysis records deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = resumeController;
