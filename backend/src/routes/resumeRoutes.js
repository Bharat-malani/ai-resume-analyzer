const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const { authMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authMiddleware);

router.post('/upload', upload.single('file'), resumeController.uploadResume);
router.get('/', resumeController.getAllResumes);
router.get('/:id', resumeController.getResumeById);
router.delete('/:id', resumeController.deleteResume);

module.exports = router;
