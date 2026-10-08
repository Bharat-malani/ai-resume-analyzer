const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/resume/:resumeId', analysisController.analyzeResume);
router.get('/:id', analysisController.getAnalysisById);
router.post('/improve-bullet', analysisController.improveBullet);
router.post('/generate-summary', analysisController.generateSummary);
router.get('/user/history', analysisController.getHistory);
router.post('/compare', analysisController.compareResumes);

module.exports = router;
