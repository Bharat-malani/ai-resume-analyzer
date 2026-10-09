import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Sparkles, 
  Briefcase, 
  FileText, 
  Copy, 
  Check, 
  RotateCw, 
  ArrowRight,
  ShieldAlert,
  Code2,
  Layers,
  Wand2
} from 'lucide-react';
import Layout from '../components/Layout';
import { analysisApi, resumeApi, reportApi } from '../api/client';
import ScoreRing from '../components/ScoreRing';
import { CardSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

export default function AnalysisPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [resume, setResume] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bullet optimizer state
  const [bulletInput, setBulletInput] = useState('Made an e-commerce website using React.');
  const [bulletResult, setBulletResult] = useState(null);
  const [bulletLoading, setBulletLoading] = useState(false);

  // Summary generator state
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const toast = useToast();

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const res = await analysisApi.getById(id);
        setAnalysis(res.analysis);
        setResume(res.resume);

        if (res.analysis?.resume_id) {
          const rRes = await resumeApi.getById(res.analysis.resume_id);
          setSkills(rRes.skills || []);
        }

        // Set initial summary if available in recommendations
        if (res.analysis?.recommendations?.summary) {
          setSummaryText(res.analysis.recommendations.summary);
        }
      } catch (err) {
        toast.error('Failed to load analysis: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [id]);

  const handleImproveBullet = async (e) => {
    e.preventDefault();
    if (!bulletInput.trim()) return;
    setBulletLoading(true);
    try {
      const res = await analysisApi.improveBullet(bulletInput);
      setBulletResult(res.data);
      toast.success('Bullet point enhanced with active phrasing!');
    } catch (err) {
      toast.error('Failed to optimize bullet: ' + err.message);
    } finally {
      setBulletLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!resume) return;
    setSummaryLoading(true);
    try {
      const res = await analysisApi.generateSummary(resume.id, targetRole);
      setSummaryText(res.summary);
      toast.success('Professional summary generated!');
    } catch (err) {
      toast.error('Failed to generate summary: ' + err.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await reportApi.downloadPdfBlob(id);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanName = (resume?.filename || 'Analysis').replace(/\.[^/.]+$/, '');
      link.download = `ResumeAI-Report-${cleanName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('PDF report downloaded successfully!');
    } catch (err) {
      console.warn('Direct blob download fallback to URL:', err);
      // Fallback: URL with token in query param
      const url = reportApi.downloadPdf(id);
      window.open(url, '_blank');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Resume Analysis" subtitle="Loading comprehensive ATS evaluation...">
        <div className="space-y-6">
          <CardSkeleton /><CardSkeleton />
        </div>
      </Layout>
    );
  }

  if (!analysis) {
    return (
      <Layout title="Analysis Not Found">
        <div className="bg-white p-12 rounded-2xl border text-center">
          <p className="text-slate-600">The requested analysis record could not be found.</p>
          <Link to="/resumes" className="mt-4 inline-block font-bold text-indigo-600">Back to Resumes</Link>
        </div>
      </Layout>
    );
  }

  const catScores = analysis.category_scores || {};
  const strengths = analysis.strengths || [];
  const issues = analysis.issues || [];
  const recommendedRoles = analysis.recommended_roles || [];

  return (
    <Layout 
      title="Resume ATS Analysis" 
      subtitle={`Detailed evaluation report for: ${resume?.title || 'Document'}`}
    >
      <div className="space-y-8">
        {/* Top Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <ScoreRing score={analysis.overall_score} size={140} strokeWidth={12} label="Overall ATS Score" />
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>{resume?.filename}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {analysis.overall_score >= 80 ? 'ATS Competitive Resume' : analysis.overall_score >= 60 ? 'Standard Application' : 'Optimization Required'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Evaluated across 5 core dimensions with deterministic scoring weights. No arbitrary or hallucinated rankings.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              <Download className={`w-4 h-4 text-slate-500 ${downloadingPdf ? 'animate-bounce text-indigo-600' : ''}`} />
              <span>{downloadingPdf ? 'Preparing PDF...' : 'Download PDF Report'}</span>
            </button>
            <Link
              to={`/job-match?resumeId=${resume?.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/25 transition-all"
            >
              <Briefcase className="w-4 h-4" />
              <span>Match Against Job</span>
            </Link>
          </div>
        </div>

        {/* Explainable Category Scores Grid */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Explainable ATS Scoring Breakdown</h3>
            <p className="text-xs text-slate-500">Documented weights determining your candidate readiness score</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Skill Match', weight: '40%', score: catScores.skill_score || 0, desc: 'Coverage across languages, frameworks & databases.' },
              { label: 'Keyword Relevance', weight: '25%', score: catScores.keyword_score || 0, desc: 'Vocabulary depth and natural keyword density.' },
              { label: 'Resume Structure', weight: '15%', score: catScores.structure_score || 0, desc: 'Standard headings and ATS formatting safety.' },
              { label: 'Project Quality', weight: '10%', score: catScores.project_score || 0, desc: 'Action verbs and impact metrics in descriptions.' },
              { label: 'Completeness', weight: '10%', score: catScores.completeness_score || 0, desc: 'Contact links, GitHub, education & core sections.' },
            ].map((cat, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{cat.label}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-700">{cat.weight}</span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    {cat.score}<span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${cat.score >= 80 ? 'bg-emerald-500' : cat.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Issues Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strengths Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Document Strengths ({strengths.length})</h3>
            </div>
            {strengths.length > 0 ? (
              <ul className="space-y-2.5">
                {strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No major strengths identified yet.</p>
            )}
          </div>

          {/* Issues / Recommendations Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">ATS Risks & Warnings ({issues.length})</h3>
            </div>
            {issues.length > 0 ? (
              <ul className="space-y-2.5">
                {issues.map((iss, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                    <span className="text-amber-600 font-bold shrink-0 mt-0.5">⚠</span>
                    <span>{iss}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No critical ATS warnings identified.</p>
            )}
          </div>
        </div>

        {/* Detected Skills Taxonomy */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Extracted Technical Skills ({skills.length})</h3>
              <p className="text-xs text-slate-500">Parsed directly from document text and mapped against 350+ canonical aliases</p>
            </div>
            <Code2 className="w-5 h-5 text-indigo-500" />
          </div>

          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1.5"
                >
                  <span>{s.skill_name}</span>
                  <span className="text-[10px] text-indigo-400 font-normal">({s.category})</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No explicit technical skills recognized in document text.</p>
          )}
        </div>

        {/* AI Bullet Point Optimizer Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Anti-Hallucination Bullet Optimizer</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Elevate Resume Bullet Points</h3>
              <p className="text-xs text-slate-500">Converts passive phrasing into high-impact action statements without fabricating false metrics.</p>
            </div>
          </div>

          <form onSubmit={handleImproveBullet} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Original Bullet Point
              </label>
              <textarea
                rows={2}
                value={bulletInput}
                onChange={(e) => setBulletInput(e.target.value)}
                placeholder="e.g. Made an e-commerce website using React."
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono text-xs"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400">Strict rule: Preserves your factual claims without inventing unearned numbers.</span>
              <button
                type="submit"
                disabled={bulletLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {bulletLoading ? <span>Optimizing...</span> : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Optimize Bullet</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {bulletResult && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AI Suggestion</p>
                <p className="text-sm font-semibold text-slate-900 mt-1 bg-white p-3 rounded-lg border border-slate-200">
                  {bulletResult.improved}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>{bulletResult.explanation}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bulletResult.improved)}
                  className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Professional Summary Generator Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Candidate Summary Generator</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tailored Professional Summary</h3>
              <p className="text-xs text-slate-500">Concise executive summary grounded exclusively in your verified skill profile.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Target Role (e.g., Full Stack Engineer)"
              className="w-full sm:flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
            <button
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCw className={`w-3.5 h-3.5 ${summaryLoading ? 'animate-spin' : ''}`} />
              <span>Regenerate Summary</span>
            </button>
          </div>

          {summaryText && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans pr-16">
                "{summaryText}"
              </p>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => copyToClipboard(summaryText)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recommended Roles based on Skills */}
        {recommendedRoles.length > 0 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Job Role Recommendations</h3>
              <p className="text-xs text-slate-500">Roles with highest technical skill overlap according to candidate skills</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedRoles.map((role, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{role.role_title}</h4>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {role.match_percentage}% Match
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <p className="text-slate-600">
                        <span className="font-semibold text-emerald-700">Matched Skills:</span>{' '}
                        {role.matching_skills.slice(0, 5).join(', ') || 'Foundational basics'}
                      </p>
                      {role.missing_skills.length > 0 && (
                        <p className="text-slate-600">
                          <span className="font-semibold text-rose-600">Missing Prerequisites:</span>{' '}
                          {role.missing_skills.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-200">
                    {role.disclaimer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
