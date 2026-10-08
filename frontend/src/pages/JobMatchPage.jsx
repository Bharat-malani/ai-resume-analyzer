import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { 
  Briefcase, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight, 
  Sliders, 
  HelpCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import Layout from '../components/Layout';
import { resumeApi, jobApi } from '../api/client';
import ScoreRing from '../components/ScoreRing';
import { useToast } from '../context/ToastContext';

const SAMPLE_JOBS = [
  {
    title: "Java Backend Developer",
    text: "We are seeking a Java Backend Developer with strong proficiency in Java, Spring Boot, Hibernate, REST APIs, Microservices, and SQL/PostgreSQL. Experience with Docker, Git, and JUnit testing is highly valued."
  },
  {
    title: "Full Stack Engineer (React & Node.js)",
    text: "Looking for an energetic Full Stack Developer skilled in React, Node.js, Express.js, TypeScript, PostgreSQL or MongoDB. Experience in building scalable REST APIs, responsive UI design with Tailwind CSS, Git workflows, and CI/CD pipelines."
  },
  {
    title: "Frontend Developer (React)",
    text: "Join our frontend engineering team. Key requirements: HTML5, CSS3, JavaScript (ES6+), React, Redux or Zustand, responsive design, Tailwind CSS, Vite, Jest unit testing, and Git version control."
  }
];

export default function JobMatchPage() {
  const [searchParams] = useSearchParams();
  const { id: routeMatchId } = useParams();

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobTitle, setJobTitle] = useState('Java Backend Developer');
  const [jobDescription, setJobDescription] = useState(SAMPLE_JOBS[0].text);
  
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  useEffect(() => {
    async function loadInitialData() {
      try {
        const resList = await resumeApi.getAll();
        setResumes(resList.resumes || []);

        const preselect = searchParams.get('resumeId');
        if (preselect) {
          setSelectedResumeId(preselect);
        } else if (resList.resumes?.length > 0) {
          setSelectedResumeId(resList.resumes[0].id);
        }

        // If viewing an existing match record by route ID
        if (routeMatchId) {
          const matchData = await jobApi.getMatchById(routeMatchId);
          setMatchResult(matchData.match);
          if (matchData.match.resume_id) setSelectedResumeId(matchData.match.resume_id);
          if (matchData.match.job_title) setJobTitle(matchData.match.job_title);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [routeMatchId, searchParams]);

  const handleRunMatch = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
      toast.error('Please upload and select a resume first.');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Please paste a job description.');
      return;
    }

    setMatching(true);
    try {
      const res = await jobApi.match({
        resumeId: selectedResumeId,
        job_title: jobTitle,
        job_description: jobDescription
      });
      setMatchResult(res.match);
      toast.success('Job match calculated successfully!');
    } catch (err) {
      toast.error('Match failed: ' + err.message);
    } finally {
      setMatching(false);
    }
  };

  const handleSelectSample = (sample) => {
    setJobTitle(sample.title);
    setJobDescription(sample.text);
  };

  return (
    <Layout title="Job Match & Semantic Scoring" subtitle="Benchmark your resume against specific job requirements using semantic TF-IDF matching">
      <div className="space-y-8">
        {/* Input Configuration Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Configure Target Job Description</h2>
              <p className="text-xs text-slate-500">Paste any real job posting or try one of the pre-loaded industry templates</p>
            </div>
            
            {/* Quick Templates */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Samples:</span>
              {SAMPLE_JOBS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors"
                >
                  {s.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRunMatch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Select Resume Version
                </label>
                {resumes.length > 0 ? (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} (v{r.version_number}) {r.overall_score ? `• ${r.overall_score}%` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                    <span>No resumes available.</span>
                    <Link to="/resumes/upload" className="font-bold underline text-amber-900">Upload one now</Link>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Target Role / Job Title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Java Backend Engineer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                3. Paste Job Description Text
              </label>
              <textarea
                rows={5}
                required
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job posting requirements, required tech stack, responsibilities, etc..."
                className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-sans"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={matching || !selectedResumeId}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {matching ? (
                  <span>Evaluating Semantic Match...</span>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    <span>Run Semantic Job Match</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {matchResult && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Match Overview Header */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <ScoreRing 
                  score={matchResult.overall_match_score} 
                  size={140} 
                  strokeWidth={12} 
                  label="Job Match Score" 
                />
                <div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Role: {matchResult.job_title}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">
                    {matchResult.overall_match_score >= 80 ? 'Exceptional Fit' : matchResult.overall_match_score >= 60 ? 'Strong Candidate Potential' : 'Skill Gaps Present'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    Computed via 50% Explicit Skills Match, 30% Semantic Cosine Vector Similarity, and 20% Keyword Overlap.
                  </p>
                </div>
              </div>

              {/* Component Dials */}
              <div className="grid grid-cols-3 gap-3 w-full md:w-auto text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xl font-black text-slate-900">{matchResult.skills_match_score}%</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Skills</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xl font-black text-slate-900">{matchResult.semantic_match_score}%</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Semantic</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xl font-black text-slate-900">{matchResult.keyword_match_score}%</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Keywords</p>
                </div>
              </div>
            </div>

            {/* Matched vs Missing Skills Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matched Skills */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Matched Skills ({matchResult.matched_skills?.length || 0})
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Found in Resume
                  </span>
                </div>

                {matchResult.matched_skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {matchResult.matched_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No explicit matching skills found.</p>
                )}
              </div>

              {/* Missing Skills */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Missing Skills ({matchResult.missing_skills?.length || 0})
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                    Required by Job
                  </span>
                </div>

                {matchResult.missing_skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {matchResult.missing_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 font-semibold">100% of required skills present on your resume!</p>
                )}
              </div>
            </div>

            {/* Transferable / Related Skills Notice */}
            {matchResult.related_skills?.length > 0 && (
              <div className="bg-indigo-50/60 p-6 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-indigo-950">Transferable Skill Overlap Identified</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {matchResult.related_skills.map((rel, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-indigo-100/80 shadow-2xs">
                      <span className="font-bold text-indigo-700">{rel.candidate_skill}</span>
                      <span className="text-slate-500"> → supports requirement for </span>
                      <span className="font-bold text-slate-900">{rel.relevant_to_requirement}</span>
                      <p className="text-slate-500 text-[11px] mt-1">{rel.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Gap Priority Table */}
            {matchResult.skill_gap?.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Skill Gap Prioritization</h3>
                    <p className="text-xs text-slate-500">Focus your learning on High-priority technical prerequisites</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Missing Skill</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Priority Impact</th>
                        <th className="pb-3">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matchResult.skill_gap.map((gap, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-900">{gap.skill}</td>
                          <td className="py-3 text-slate-500">{gap.category}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              gap.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                              gap.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {gap.priority} Priority
                            </span>
                          </td>
                          <td className="py-3 text-slate-600">
                            {gap.priority === 'High' 
                              ? 'Critical framework/language. Recommend building a sample project.'
                              : 'Secondary tool. Add to self-study roadmap.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Important Job Keywords */}
            {matchResult.important_keywords?.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Important Job Keywords (TF-IDF Extracted)</h4>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.important_keywords.map((kw, idx) => {
                    const isMatched = matchResult.matched_keywords?.includes(kw);
                    return (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                          isMatched 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold' 
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isMatched ? '✓ ' : ''}{kw}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
