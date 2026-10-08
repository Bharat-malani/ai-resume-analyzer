const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./db');
const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/health', async (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ResumeAI Backend REST API',
    database: db.isPostgres() ? 'PostgreSQL' : 'Persistent Storage (Local)',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Fallback Route
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use(errorHandler);

// Server Startup
async function startServer() {
  try {
    await db.initDb();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`ResumeAI Backend API running on http://localhost:${PORT}`);
      console.log(`AI Microservice URL: ${process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000'}`);
      console.log(`Database engine: ${db.isPostgres() ? 'PostgreSQL 18' : 'Local Persistent Engine'}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start ResumeAI backend:', err);
    process.exit(1);
  }
}

startServer();
