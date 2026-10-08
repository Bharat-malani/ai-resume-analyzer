import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ResumesPage from './pages/ResumesPage';
import AnalysisPage from './pages/AnalysisPage';
import JobMatchPage from './pages/JobMatchPage';
import SkillGapPage from './pages/SkillGapPage';
import HistoryPage from './pages/HistoryPage';
import ComparePage from './pages/ComparePage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Authenticated Dashboard Pages */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/resumes/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
      <Route path="/resumes" element={<ProtectedRoute><ResumesPage /></ProtectedRoute>} />
      <Route path="/analysis/:id" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
      <Route path="/job-match" element={<ProtectedRoute><JobMatchPage /></ProtectedRoute>} />
      <Route path="/job-match/:id" element={<ProtectedRoute><JobMatchPage /></ProtectedRoute>} />
      <Route path="/skill-gap" element={<ProtectedRoute><SkillGapPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
