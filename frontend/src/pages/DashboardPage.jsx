import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  BarChart3, 
  Award, 
  TrendingUp, 
  UploadCloud, 
  Briefcase, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  ExternalLink 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import Layout from '../components/Layout';
import { resumeApi, analysisApi } from '../api/client';
import { CardSkeleton } from '../components/Skeleton';
import ScoreRing from '../components/ScoreRing';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [resumesRes, historyRes] = await Promise.all([
          resumeApi.getAll(),
          analysisApi.getHistory()
        ]);
        setResumes(resumesRes.resumes || []);
        setHistory(historyRes.history || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Compute metrics
  const totalResumes = resumes.length;
  const totalAnalyses = history.length;
  const scoresWithVal = resumes.filter(r => r.overall_score !== null).map(r => r.overall_score);
  const avgScore = scoresWithVal.length > 0 
    ? Math.round(scoresWithVal.reduce((a, b) => a + b, 0) / scoresWithVal.length) 
    : 0;
  const bestScore = scoresWithVal.length > 0 ? Math.max(...scoresWithVal) : 0;

  // Prepare chart data chronologically
  const chartData = [...history]
    .filter(h => h.score !== undefined && h.score !== null)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7)
    .map((item, index) => ({
      name: `V${index + 1}`,
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: item.score
    }));

  return (
    <Layout title="Dashboard" subtitle="Overview of your resume ATS scores, improvements, and job matches">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Resumes</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{totalResumes}</p>
                <p className="text-xs text-slate-500 mt-1">Uploaded versions</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Analyses</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{totalAnalyses}</p>
                <p className="text-xs text-slate-500 mt-1">ATS & Job evaluations</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Score</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{avgScore > 0 ? `${avgScore}%` : 'N/A'}</p>
                <p className="text-xs text-slate-500 mt-1">Across all submissions</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Best Resume Score</p>
                <p className="text-3xl font-black text-indigo-600 mt-1">{bestScore > 0 ? `${bestScore}%` : 'N/A'}</p>
                <p className="text-xs text-slate-500 mt-1">Highest ATS match</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-linear-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-medium mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next Career Step</span>
              </div>
              <h2 className="text-xl font-bold text-black">Ready to analyze or match a resume?</h2>
              <p className="text-xs text-slate-300 mt-1">Upload a new revision or benchmark against an open position.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/resumes/upload"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-indigo-950 bg-white hover:bg-indigo-50 shadow-sm transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Resume</span>
              </Link>
              <Link
                to="/job-match"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
              >
                <Briefcase className="w-4 h-4" />
                <span>Match Job Description</span>
              </Link>
            </div>
          </div>

          {/* Analytics & Progression Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Over Time Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Score Improvement Over Time</h3>
                  <p className="text-xs text-slate-500">Track how your ATS score evolves across versions</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Version Trend
                </span>
              </div>

              {chartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                        itemStyle={{ color: '#818cf8' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#4f46e5" 
                        strokeWidth={3} 
                        dot={{ r: 5, fill: '#4f46e5' }} 
                        activeDot={{ r: 7 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <TrendingUp className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No evaluation data yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">Upload your resume to see your score progression history.</p>
                </div>
              )}
            </div>

            {/* Quick Profile Summary Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center justify-center">
              <ScoreRing score={bestScore} size={130} strokeWidth={11} label="Current Top Score" />
              <div className="mt-4 w-full pt-4 border-t border-slate-100 space-y-2 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Benchmark Quality:</span>
                  <span className="font-semibold text-slate-900">
                    {bestScore >= 80 ? 'Highly Competitive' : bestScore >= 60 ? 'Standard Quality' : 'Needs Optimization'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Scoring Engine:</span>
                  <span className="font-semibold text-indigo-600">Deterministic ATS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Evaluations Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Analyses</h3>
                <p className="text-xs text-slate-500">Recently evaluated resumes and target job matches</p>
              </div>
              <Link to="/history" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <span>View Full History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {history.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        item.score >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        item.score >= 60 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {item.score}%
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="text-indigo-600 font-medium">{item.target}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={item.type === 'JOB_MATCH' ? `/job-match/${item.id}` : `/analysis/${item.id}`}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No evaluations recorded yet</p>
                <p className="text-xs text-slate-400 mt-1">Upload a resume to begin your first comprehensive analysis.</p>
                <div className="mt-4">
                  <Link
                    to="/resumes/upload"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Resume</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
