import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  ExternalLink, 
  Briefcase, 
  Calendar, 
  FileSpreadsheet, 
  Sparkles,
  BarChart3
} from 'lucide-react';
import Layout from '../components/Layout';
import { resumeApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { CardSkeleton } from '../components/Skeleton';
import Modal from '../components/Modal';

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  const loadResumes = async () => {
    try {
      const res = await resumeApi.getAll();
      setResumes(res.resumes || []);
    } catch (err) {
      toast.error('Failed to load resumes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await resumeApi.delete(deleteId);
      toast.success('Resume deleted successfully.');
      setResumes(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      toast.error('Failed to delete resume: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout title="My Resumes" subtitle="Manage your uploaded resume versions and their ATS benchmark scores">
      <div className="space-y-6">
        {/* Header Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Document Repository</h2>
            <p className="text-xs text-slate-500 mt-0.5">Maintain different resume versions tailored for specific roles</p>
          </div>
          <Link
            to="/resumes/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Version</span>
          </Link>
        </div>

        {/* Resumes Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
        ) : resumes.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {r.file_type || 'PDF'}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{r.title}</h3>
                        <p className="text-xs text-slate-400 truncate">{r.filename}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      v{r.version_number}
                    </span>
                  </div>

                  {/* Score pill */}
                  <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">ATS Readiness:</span>
                    {r.overall_score !== null ? (
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        r.overall_score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                        r.overall_score >= 60 ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {r.overall_score} / 100
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Not analyzed</span>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                      <span>{r.word_count} words • {(r.file_size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {r.latest_analysis_id ? (
                      <Link
                        to={`/analysis/${r.latest_analysis_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>View Score</span>
                      </Link>
                    ) : null}
                    <Link
                      to={`/job-match?resumeId=${r.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Match Job</span>
                    </Link>
                  </div>

                  <button
                    onClick={() => setDeleteId(r.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center max-w-lg mx-auto">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No resumes uploaded yet</h3>
            <p className="text-xs text-slate-500 mt-1">Upload your first resume to extract skills, view ATS scores, and match against job descriptions.</p>
            <div className="mt-6">
              <Link
                to="/resumes/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Resume</span>
              </Link>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={Boolean(deleteId)}
          onClose={() => setDeleteId(null)}
          title="Confirm Deletion"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete this resume and all its associated ATS analyses? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Resume'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
