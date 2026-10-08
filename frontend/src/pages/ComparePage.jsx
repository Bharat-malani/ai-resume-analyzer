import React, { useState, useEffect } from 'react';
import { GitCompare, TrendingUp, TrendingDown, ArrowRight, CheckCircle2, MinusCircle, PlusCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Layout from '../components/Layout';
import { resumeApi, analysisApi } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ComparePage() {
  const [resumes, setResumes] = useState([]);
  const [resumeId1, setResumeId1] = useState('');
  const [resumeId2, setResumeId2] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  useEffect(() => {
    async function fetchResumes() {
      try {
        const res = await resumeApi.getAll();
        const list = res.resumes || [];
        setResumes(list);
        if (list.length >= 2) {
          setResumeId1(list[1].id);
          setResumeId2(list[0].id);
        } else if (list.length === 1) {
          setResumeId1(list[0].id);
          setResumeId2(list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchResumes();
  }, []);

  const handleRunComparison = async () => {
    if (!resumeId1 || !resumeId2) {
      toast.error('Please select two resumes to compare.');
      return;
    }

    setLoading(true);
    try {
      const res = await analysisApi.compare(resumeId1, resumeId2);
      setComparison(res.comparison);
      toast.success('Version comparison calculated!');
    } catch (err) {
      toast.error('Comparison failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Prepare Recharts data for category comparison
  const chartData = comparison ? [
    { category: 'Skills', V1: comparison.resume1.category_scores?.skill_score || 0, V2: comparison.resume2.category_scores?.skill_score || 0 },
    { category: 'Keywords', V1: comparison.resume1.category_scores?.keyword_score || 0, V2: comparison.resume2.category_scores?.keyword_score || 0 },
    { category: 'Structure', V1: comparison.resume1.category_scores?.structure_score || 0, V2: comparison.resume2.category_scores?.structure_score || 0 },
    { category: 'Projects', V1: comparison.resume1.category_scores?.project_score || 0, V2: comparison.resume2.category_scores?.project_score || 0 },
    { category: 'Complete', V1: comparison.resume1.category_scores?.completeness_score || 0, V2: comparison.resume2.category_scores?.completeness_score || 0 },
  ] : [];

  return (
    <Layout title="Resume Version Comparison" subtitle="Inspect incremental ATS score progress, added skills, and keyword evolution">
      <div className="space-y-8">
        {/* Comparison Selectors Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Select Two Resume Versions</h2>
            <p className="text-xs text-slate-500">Compare earlier revisions against updated drafts to benchmark score changes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Baseline (Version 1)
              </label>
              <select
                value={resumeId1}
                onChange={(e) => setResumeId1(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.title} (Score: {r.overall_score ?? 'N/A'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Comparison (Version 2)
              </label>
              <select
                value={resumeId2}
                onChange={(e) => setResumeId2(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.title} (Score: {r.overall_score ?? 'N/A'})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunComparison}
              disabled={loading || resumes.length < 2}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <GitCompare className="w-4 h-4" />
              <span>{loading ? 'Comparing Versions...' : 'Compare Resumes'}</span>
            </button>
          </div>
        </div>

        {/* Comparison Results */}
        {comparison && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Score Delta Header */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Version 1</span>
                  <p className="text-3xl font-black text-slate-700 mt-1">{comparison.resume1.score}%</p>
                </div>

                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                  <ArrowRight className="w-5 h-5 text-indigo-600" />
                </div>

                <div className="text-center">
                  <span className="text-xs font-bold text-indigo-600 uppercase">Version 2</span>
                  <p className="text-3xl font-black text-slate-900 mt-1">{comparison.resume2.score}%</p>
                </div>
              </div>

              {/* Delta Badge */}
              <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                comparison.score_delta > 0 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : comparison.score_delta < 0
                  ? 'bg-rose-50 text-rose-900 border-rose-200'
                  : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}>
                {comparison.score_delta > 0 ? (
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-rose-600" />
                )}
                <div>
                  <p className="text-xl font-black">
                    {comparison.score_delta > 0 ? `+${comparison.score_delta}` : comparison.score_delta} pts
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {comparison.score_delta > 0 ? 'Net ATS score improvement' : 'No net score change'}
                  </p>
                </div>
              </div>
            </div>

            {/* Category Score Bar Chart */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Category Comparison (V1 vs V2)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="V1" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Version 1" />
                    <Bar dataKey="V2" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Version 2" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Skills Diff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Added Skills */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>Newly Added Skills in V2 ({comparison.added_skills.length})</span>
                </div>
                {comparison.added_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {comparison.added_skills.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        + {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No new skills added in Version 2.</p>
                )}
              </div>

              {/* Removed Skills */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <MinusCircle className="w-4 h-4 text-rose-600" />
                  <span>Removed Skills from V1 ({comparison.removed_skills.length})</span>
                </div>
                {comparison.removed_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {comparison.removed_skills.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        - {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No skills were removed.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
