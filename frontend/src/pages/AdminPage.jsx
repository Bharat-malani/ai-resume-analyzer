import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Database, Plus, Trash2, BarChart3, Lock, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { adminApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Skill modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Programming Languages');

  const toast = useToast();

  const loadAdminData = async () => {
    try {
      const [sRes, uRes, skRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getSkills()
      ]);
      setStats(sRes.stats);
      setUsers(uRes.users || []);
      setSkills(skRes.skills || []);
    } catch (err) {
      toast.error('Failed to load admin data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    try {
      const res = await adminApi.createSkill({
        name: newSkillName.trim(),
        category: newSkillCategory
      });
      toast.success('Skill added to catalog.');
      setSkills(prev => [res.skill, ...prev]);
      setNewSkillName('');
      setIsAddOpen(false);
    } catch (err) {
      toast.error('Failed to add skill: ' + err.message);
    }
  };

  const handleDeleteSkill = async (id) => {
    try {
      await adminApi.deleteSkill(id);
      toast.success('Skill deleted from catalog.');
      setSkills(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      toast.error('Failed to delete skill: ' + err.message);
    }
  };

  if (!isAdmin) {
    return (
      <Layout title="Administrator Portal">
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-500">
            You require administrator credentials to view platform statistics and modify the skills catalog.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Control Center" subtitle="Manage platform metrics, user accounts, and canonical skills dictionary">
      <div className="space-y-8">
        {/* System Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{stats.total_users}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Resumes</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{stats.total_resumes}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Analyses</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{stats.total_analyses}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Avg Score</span>
              <p className="text-3xl font-black text-indigo-600 mt-1">{stats.avg_score}%</p>
            </div>
          </div>
        )}

        {/* User Accounts Overview */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Registered Users ({users.length})</h3>
              <p className="text-xs text-slate-500">Candidate accounts registered on ResumeAI platform</p>
            </div>
            <Users className="w-5 h-5 text-slate-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 text-slate-600">{u.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Skills Taxonomy Management */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Custom Skills Taxonomy Catalog</h3>
              <p className="text-xs text-slate-500">Manage recognized canonical tech terms for parser scoring</p>
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Skill</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {skills.map((sk) => (
              <div key={sk.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-900">{sk.name}</p>
                  <p className="text-[10px] text-slate-400">{sk.category}</p>
                </div>
                <button
                  onClick={() => handleDeleteSkill(sk.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                  title="Remove skill"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Skill Modal */}
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title="Add New Verified Skill"
        >
          <form onSubmit={handleAddSkill} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Skill Name
              </label>
              <input
                type="text"
                required
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g. GraphQL, Tailwind CSS"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                <option value="Programming Languages">Programming Languages</option>
                <option value="Frontend Development">Frontend Development</option>
                <option value="Backend & Frameworks">Backend & Frameworks</option>
                <option value="Databases & Storage">Databases & Storage</option>
                <option value="Cloud & DevOps">Cloud & DevOps</option>
                <option value="Data Science, AI & ML">Data Science, AI & ML</option>
                <option value="Testing & QA">Testing & QA</option>
                <option value="Tools & Methodologies">Tools & Methodologies</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Save Skill
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
