const PDFDocument = require('pdfkit');
const db = require('../db');

const reportController = {
  async generatePdfReport(req, res, next) {
    try {
      const { analysisId } = req.params;

      const analysis = await db.analyses.findById(analysisId);
      if (!analysis || analysis.user_id !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Analysis record not found.' });
      }

      const resume = await db.resumes.findById(analysis.resume_id);
      const skills = await db.resumeSkills.getByResume(analysis.resume_id);

      const doc = new PDFDocument({ margin: 50 });
      const filename = `ResumeAI-Analysis-Report-${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);

      // --- Header ---
      doc.rect(0, 0, doc.page.width, 100).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
         .text('ResumeAI — Evaluation Report', 50, 30);
      doc.fontSize(11).font('Helvetica')
         .text('AI-Powered ATS Analysis & Job Readiness Assessment', 50, 60);

      doc.moveDown(4);

      // --- Metadata Table ---
      doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('Candidate & File Details');
      doc.rect(50, 130, 500, 1).fill('#E2E8F0');
      doc.moveDown(0.8);

      doc.fontSize(10).font('Helvetica');
      const candidateName = resume?.personal_info?.name || req.user.name;
      const candidateEmail = resume?.personal_info?.email || req.user.email;
      const candidatePhone = resume?.personal_info?.phone || 'Not provided';
      const resumeName = resume?.filename || 'Uploaded Resume';
      const reportDate = new Date(analysis.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      doc.text(`Candidate Name: ${candidateName}`);
      doc.text(`Email Address: ${candidateEmail}`);
      doc.text(`Phone: ${candidatePhone}`);
      doc.text(`Document Name: ${resumeName} (Words: ${resume?.word_count || 'N/A'})`);
      doc.text(`Evaluation Date: ${reportDate}`);

      doc.moveDown(1.5);

      // --- Overall Score Box ---
      const score = analysis.overall_score || 0;
      let scoreColor = '#10B981'; // Green
      if (score < 60) scoreColor = '#EF4444'; // Red
      else if (score < 75) scoreColor = '#F59E0B'; // Amber

      doc.roundedRect(50, doc.y, 500, 70, 8).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#334155').fontSize(12).font('Helvetica-Bold').text('OVERALL ATS READINESS SCORE', 70, doc.y - 55);
      doc.fillColor(scoreColor).fontSize(28).font('Helvetica-Bold').text(`${score} / 100`, 70, doc.y - 35);

      doc.moveDown(3);

      // --- Category Score Breakdown ---
      doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text('Category Score Breakdown');
      doc.moveDown(0.5);

      const catScores = analysis.category_scores || {};
      const categories = [
        { label: 'Skill Match & Breadth (40%)', val: catScores.skill_score || 0 },
        { label: 'Keyword Relevance (25%)', val: catScores.keyword_score || 0 },
        { label: 'Resume Structure (15%)', val: catScores.structure_score || 0 },
        { label: 'Project Quality (10%)', val: catScores.project_score || 0 },
        { label: 'Section Completeness (10%)', val: catScores.completeness_score || 0 }
      ];

      categories.forEach(c => {
        doc.fillColor('#334155').fontSize(10).font('Helvetica').text(`${c.label}: `, { continued: true });
        doc.font('Helvetica-Bold').text(`${c.val}%`);
      });

      doc.moveDown(1.2);

      // --- Key Strengths ---
      doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text('Identified Strengths');
      doc.moveDown(0.5);
      const strengths = analysis.strengths || [];
      if (strengths.length > 0) {
        strengths.slice(0, 4).forEach(s => {
          doc.fillColor('#059669').fontSize(10).font('Helvetica').text(`[+] ${s}`);
        });
      } else {
        doc.fillColor('#64748B').fontSize(10).font('Helvetica').text('No notable strengths identified.');
      }

      doc.moveDown(1.2);

      // --- Areas for Improvement ---
      doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text('Improvement Recommendations & ATS Warnings');
      doc.moveDown(0.5);
      const issues = analysis.issues || [];
      if (issues.length > 0) {
        issues.slice(0, 4).forEach(iss => {
          doc.fillColor('#D97706').fontSize(10).font('Helvetica').text(`[!] ${iss}`);
        });
      }

      const recs = analysis.recommendations?.recommendations || [];
      if (recs.length > 0) {
        recs.slice(0, 3).forEach(r => {
          doc.fillColor('#2563EB').fontSize(10).font('Helvetica').text(`[*] ${r}`);
        });
      }

      doc.moveDown(1.2);

      // --- Detected Skills Summary ---
      doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text('Detected Skills Taxonomy');
      doc.moveDown(0.5);
      const skillNames = skills.map(s => s.skill_name);
      if (skillNames.length > 0) {
        doc.fillColor('#334155').fontSize(9).font('Helvetica').text(skillNames.join(', '));
      } else {
        doc.fillColor('#64748B').fontSize(9).font('Helvetica').text('None detected.');
      }

      // --- Footer ---
      doc.fontSize(8).fillColor('#94A3B8')
         .text('Generated automatically by ResumeAI System. Explainable ATS scoring algorithm.', 50, 720, { align: 'center', width: 500 });

      doc.end();
    } catch (err) {
      next(err);
    }
  }
};

module.exports = reportController;
