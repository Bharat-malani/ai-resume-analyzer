const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', jobController.createJob);
router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);
router.post('/match', jobController.matchResumeWithJob);
router.get('/match/:id', jobController.getJobMatchById);

module.exports = router;
