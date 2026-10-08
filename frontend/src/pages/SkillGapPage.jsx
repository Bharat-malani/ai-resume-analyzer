import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, AlertCircle, BookOpen, CheckCircle2, ArrowRight, Briefcase } from 'lucide-react';
import Layout from '../components/Layout';
import { resumeApi, jobApi } from '../api/client';

export default function SkillGapPage() {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [detectedSkills, setDetectedSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await resumeApi.getAll();
        setResumes(res.resumes || []);
        if (res.resumes?.length > 0) {
          const firstId = res.resumes[0].id;
          const details = await resumeApi.getById(firstId);
          setSelectedResume(details.resume);
          setDetectedSkills(details.skills || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleResumeChange = async (resumeId) => {
    setLoading(true);
    try {
      const details = await resumeApi.getById(resumeId);
      setSelectedResume(details.resume);
      setDetectedSkills(details.skills || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const detectedNames = new Set(detectedSkills.map(s => s.skill_name));

  // High-demand modern industry core skills
  const benchmarkCatalog = [
    { name: 'TypeScript', category: 'Programming Languages', priority: 'High', demand: 'High in modern frontend/fullstack roles' },
    { name: 'Docker', category: 'Cloud & DevOps', priority: 'High', demand: 'Essential for containerization and microservices' },
    { name: 'Kubernetes', category: 'Cloud & DevOps', priority: 'Medium', demand: 'Critical for scalable cloud architectures' },
    { name: 'PostgreSQL', category: 'Databases & Storage', priority: 'High', demand: 'Leading relational database in modern web stacks' },
    { name: 'Redis', category: 'Databases & Storage', priority: 'Medium', demand: 'In-memory caching and session management' },
    { name: 'CI/CD', category: 'Cloud & DevOps', priority: 'High', demand: 'Automated testing and deployment pipelines' },
    { name: 'Unit Testing', category: 'Testing & QA', priority: 'Medium', demand: 'Quality assurance and robust code reliability' },
    { name: 'AWS', category: 'Cloud & DevOps', priority: 'High', demand: 'Most requested cloud provider in job postings' }
  ];

  const presentSkills = benchmarkCatalog.filter(s => detectedNames.has(s.name));
  const missingSkills = benchmarkCatalog.filter(s => !detectedNames.has(s.name));

  return (
    <Layout title="Skill Gap Analysis" subtitle="Identify and prioritize high-value industry competencies missing from your profile">
      <div className="space-y-8">
        {/* Selector Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Resume Benchmark</h2>
            <p className="text-xs text-slate-500">Benchmark your resume against high-demand cloud and software engineering proficiencies</p>
          </div>
          {resumes.length > 0 && (
            <select
              value={selectedResume?.id || ''}
              onChange={(e) => handleResumeChange(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.title} (v{r.version_number})</option>
              ))}
            </select>
          )}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified On Profile</span>
            <p className="text-3xl font-black text-emerald-600 mt-1">{presentSkills.length}</p>
            <p className="text-xs text-slate-500 mt-1">Foundational competencies</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">High-Priority Gaps</span>
            <p className="text-3xl font-black text-rose-600 mt-1">{missingSkills.filter(s => s.priority === 'High').length}</p>
            <p className="text-xs text-slate-500 mt-1">Recommended to learn first</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Medium-Priority Gaps</span>
            <p className="text-3xl font-black text-amber-600 mt-1">{missingSkills.filter(s => s.priority === 'Medium').length}</p>
            <p className="text-xs text-slate-500 mt-1">Enhance career versatility</p>
          </div>
        </div>

        {/* Missing Competencies Table */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Your High-Impact Skill Gaps</h3>
              <p className="text-xs text-slate-500">Skills commonly sought in mid-to-senior software engineering roles</p>
            </div>
            <Link
              to="/job-match"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              <span>Match Specific Job Posting</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Industry Skill</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Why It Matters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {missingSkills.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>{item.name}</span>
                    </td>
                    <td className="py-3.5 text-slate-500">{item.category}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        item.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.priority} Priority
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-600">{item.demand}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
