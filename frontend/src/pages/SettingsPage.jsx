import React, { useState } from 'react';
import { Settings, Shield, Sliders, User, Trash2, CheckCircle2 } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [weights, setWeights] = useState({
    skill_weight: 40,
    keyword_weight: 25,
    structure_weight: 15,
    project_weight: 10,
    completeness_weight: 10
  });

  const handleWeightChange = (key, val) => {
    setWeights(prev => ({ ...prev, [key]: parseInt(val, 10) }));
  };

  const handleSaveWeights = (e) => {
    e.preventDefault();
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      toast.warning(`Total weights must sum to 100% (currently ${sum}%).`);
      return;
    }
    toast.success('ATS scoring weights updated.');
  };

  return (
    <Layout title="Settings & Privacy" subtitle="Manage your profile, configurable ATS scoring algorithm weights, and data privacy">
      <div className="max-w-4xl space-y-8">
        {/* Profile Details */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">User Profile</h3>
              <p className="text-xs text-slate-500">Your account credentials and current role</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Full Name</span>
              <p className="font-bold text-slate-900 mt-1">{user?.name}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Email Address</span>
              <p className="font-bold text-slate-900 mt-1">{user?.email}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Role Permission</span>
              <p className="font-bold text-indigo-600 mt-1">{user?.role || 'USER'}</p>
            </div>
          </div>
        </div>

        {/* Algorithm Weights Configurator */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Configurable ATS Scoring Weights</h3>
                <p className="text-xs text-slate-500">Customize how different dimensions contribute to your overall score (Total must equal 100%)</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
              Sum: {Object.values(weights).reduce((a, b) => a + b, 0)}%
            </span>
          </div>

          <form onSubmit={handleSaveWeights} className="space-y-4">
            {[
              { key: 'skill_weight', label: 'Skill Match & Breadth', val: weights.skill_weight },
              { key: 'keyword_weight', label: 'Keyword Relevance & Density', val: weights.keyword_weight },
              { key: 'structure_weight', label: 'Resume Structure & Formatting', val: weights.structure_weight },
              { key: 'project_weight', label: 'Project Quality & Metrics', val: weights.project_weight },
              { key: 'completeness_weight', label: 'Section Completeness & Links', val: weights.completeness_weight },
            ].map((item) => (
              <div key={item.key} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{item.label}</span>
                  <span className="text-indigo-600">{item.val}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={item.val}
                  onChange={(e) => handleWeightChange(item.key, e.target.value)}
                  className="w-full accent-indigo-600"
                />
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
              >
                Apply Custom Weights
              </button>
            </div>
          </form>
        </div>

        {/* Privacy & Data Ownership Notice */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Privacy & Data Governance Notice</h3>
              <p className="text-xs text-slate-500">How your personal resume data and documents are processed</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p>
              • <strong>Document Processing:</strong> Resumes uploaded to ResumeAI are processed solely to compute ATS structure metrics, extract skills, and benchmark job match scores.
            </p>
            <p>
              • <strong>Anti-Hallucination & Model Safety:</strong> All numerical scores and taxonomy matches are calculated deterministically. The AI service is strictly constrained against fabricating unstated achievements, metrics, or degrees.
            </p>
            <p>
              • <strong>Data Erasure:</strong> You retain complete ownership of your submissions. Deleting a resume instantly removes all associated database records, extracted text, and physical files.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
