import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import Layout from '../components/Layout';
import { resumeApi } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const toast = useToast();
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      setError('Please upload a PDF (.pdf) or Word document (.docx).');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File exceeds maximum 10MB limit. Please upload a smaller file.');
      return;
    }

    if (selectedFile.size === 0) {
      setError('The selected file appears to be empty.');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError('');

    // Progressive step indicator
    setProgressStep('Uploading document to secure processing pipeline...');
    const t1 = setTimeout(() => setProgressStep('Parsing resume structure and text boundaries...'), 900);
    const t2 = setTimeout(() => setProgressStep('Scanning 350+ categorized skills and aliases...'), 2000);
    const t3 = setTimeout(() => setProgressStep('Calculating explainable ATS scores and checking formatting...'), 3200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title.trim()) formData.append('title', title.trim());

      const res = await resumeApi.upload(formData);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);

      toast.success('Resume analyzed successfully!');
      if (res.analysis?.id) {
        navigate(`/analysis/${res.analysis.id}`);
      } else {
        navigate(`/resumes/${res.resume.id}`);
      }
    } catch (err) {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      setError(err.message || 'Failed to upload or analyze document.');
      setLoading(false);
    }
  };

  return (
    <Layout title="Upload Resume" subtitle="Upload your PDF or DOCX resume for instant ATS analysis & skill extraction">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Upload Card */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer
              ${dragActive ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'}
              ${file ? 'cursor-default border-indigo-200 bg-indigo-50/20' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleChange}
              className="hidden"
            />

            {!file ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    Drag & drop your resume here, or <span className="text-indigo-600 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PDF and DOCX files up to 10MB
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Secure processing • Anti-hallucination compliance</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <FileCheck2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{file.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB • {file.name.split('.').pop().toUpperCase()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove file</span>
                </button>
              </div>
            )}
          </div>

          {/* Resume Version Title Field */}
          {file && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Resume Title / Version Label
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Software Engineer Resume (v2)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              {/* Loading Progress State */}
              {loading && (
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="text-xs font-semibold">{progressStep}</span>
                  </div>
                  <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <button
                type="button"
                onClick={handleUploadAndAnalyze}
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing Resume...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Full ATS Analysis</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Informative Guidance Card */}
        <div className="bg-slate-100/70 p-5 rounded-2xl border border-slate-200/60 text-xs text-slate-600 space-y-2">
          <p className="font-bold text-slate-800">Why ATS-Friendly Formatting Matters:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            <li>Standard single-column or clean two-column layouts prevent parser fragmentation.</li>
            <li>Use recognizable section titles (Education, Experience, Skills, Projects).</li>
            <li>Avoid inserting personal details or critical skills inside embedded image graphics.</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
