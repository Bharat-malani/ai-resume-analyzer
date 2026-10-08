import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  FileSearch, 
  BarChart3, 
  Target, 
  Cpu, 
  History, 
  Zap, 
  Sliders
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 bg-linear-to-b from-white via-indigo-50/20 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explainable ATS Scoring & Semantic Matching</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Analyze Your Resume. <br />
            <span className="bg-linear-to-r from-indigo-600 via-primary-600 to-indigo-800 bg-clip-text text-transparent">
              Match Your Dream Job.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Use AI-powered resume analysis and job matching to identify skill gaps, improve your resume bullet points, and become more job-ready.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 transition-all text-base"
            >
              <span>Analyze My Resume</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition-all text-base"
            >
              <span>Sign In / Demo</span>
            </Link>
          </div>

          {/* Quick Metrics Cards */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-2xl font-extrabold text-slate-900">350+</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Verified Tech Skills & Aliases</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-2xl font-extrabold text-slate-900">5 Weights</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Explainable ATS Algorithm</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-2xl font-extrabold text-slate-900">Semantic</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">TF-IDF Cosine Match Engine</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-2xl font-extrabold text-indigo-600">Zero Hallucination</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Strict Fact-Preserving AI</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Core Capabilities</h2>
            <p className="text-3xl font-extrabold text-slate-900">Built for Students, Engineers & Recruiters</p>
            <p className="text-slate-600 mt-3 text-sm">Every calculation is derived directly from your uploaded document and job description.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <FileSearch className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI Resume Analysis</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Extracts contact info, segmented sections, and technical skills across PDF and DOCX documents with robust normalization.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">ATS-Style Scoring</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Clear scoring breakdown: 40% Skills, 25% Keywords, 15% Structure, 10% Projects, and 10% Section Completeness.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Job Description Matching</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Compare your resume with real job postings using TF-IDF cosine similarity to reveal matched skills and keyword gaps.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Skill Gap Prioritization</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Instantly identify missing requirements ranked into High, Medium, and Low priorities based on target job prerequisites.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI Bullet Optimizer</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Transform passive statements into active, ATS-friendly bullet points using strong action verbs without fabricating false numbers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Version History & Comparison</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Maintain multiple resume versions, track score improvements over time, and compare changes side-by-side.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Workflow</h2>
            <p className="text-3xl font-extrabold text-slate-900">How ResumeAI Works</p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: "01", title: "Upload Resume", desc: "Drag and drop your PDF or DOCX file." },
              { step: "02", title: "AI Analyzes Resume", desc: "Extracts sections, contact links, and skills." },
              { step: "03", title: "Add Job Description", desc: "Paste your target job posting or select a role." },
              { step: "04", title: "Get Match Score", desc: "Inspect matched skills, gaps, and relevance." },
              { step: "05", title: "Improve & Export", desc: "Refine bullets and download your report." }
            ].map((s, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
                <span className="text-2xl font-black text-indigo-600/30 font-mono">{s.step}</span>
                <h4 className="font-bold text-slate-900 mt-2 text-base">{s.title}</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Improve Your Resume Today
          </h2>
          <p className="mt-4 text-indigo-200 text-base max-w-xl mx-auto">
            Get an instant ATS score, detect missing keywords, and elevate your job application readiness with explainable AI.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-indigo-950 bg-white hover:bg-indigo-50 shadow-lg transition-all"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-900 text-slate-400 border-t border-slate-800 text-center text-xs">
        <p>© 2026 ResumeAI — AI-Powered Resume Analyzer & Job Match System. B.Sc. Computer Science Capstone Project.</p>
      </footer>
    </div>
  );
}
