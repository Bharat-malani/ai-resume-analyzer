import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, ExternalLink, Calendar, Search, Filter, Trash2, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';
import { analysisApi } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const toast = useToast();

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await analysisApi.getHistory();
        setHistory(res.history || []);
      } catch (err) {
        toast.error('Failed to load history: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    const matchesType = filterType === 'ALL' || item.type === filterType;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.target.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const currentItems = filteredHistory.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <Layout title="Analysis History" subtitle="Chronological audit log of all resume ATS evaluations and job match benchmarks">
      <div className="space-y-6">
        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Search evaluations..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => { setFilterType('ALL'); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filterType === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Records ({history.length})
            </button>
            <button
              onClick={() => { setFilterType('RESUME_ANALYSIS'); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filterType === 'RESUME_ANALYSIS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ATS Scans
            </button>
            <button
              onClick={() => { setFilterType('JOB_MATCH'); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filterType === 'JOB_MATCH' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Job Matches
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-6">Evaluation Details</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Target Benchmark</th>
                  <th className="py-3.5 px-6">Score</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {item.title}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          item.type === 'JOB_MATCH' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.type === 'JOB_MATCH' ? 'Job Match' : 'ATS Evaluation'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {item.target}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                          item.score >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.score >= 60 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {item.score}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={item.type === 'JOB_MATCH' ? `/job-match/${item.id}` : `/analysis/${item.id}`}
                          className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No matching evaluation records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
