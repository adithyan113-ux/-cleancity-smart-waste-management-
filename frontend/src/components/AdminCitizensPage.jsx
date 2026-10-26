import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Trash2,
  UserCheck2,
  Phone,
  Mail,
  Home,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Shield,
  Search,
  Award,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminCitizensPage({ currentUser, onOpenProfileModal, onNavigateToWorkers, onNavigateToReports }) {
  const [citizens, setCitizens] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, total_points: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'approved'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const loadCitizens = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminUsers('citizen');
      const list = res.users || [];
      setCitizens(list);
      setStats({
        total: list.length,
        pending: list.filter(c => !c.profile?.is_approved).length,
        approved: list.filter(c => c.profile?.is_approved).length,
        total_points: list.reduce((acc, c) => acc + (c.profile?.reward_points || 0), 0)
      });
    } catch (err) {
      console.error(err);
      setNotification({ error: err.message || 'Failed to load citizens' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCitizens();
  }, []);

  const handleApprove = async (citizenId) => {
    try {
      setActionLoadingId(citizenId);
      const res = await api.approveUser(citizenId);
      setNotification({ success: res.message });
      setTimeout(() => setNotification(null), 3500);
      await loadCitizens();
    } catch (err) {
      setNotification({ error: err.message || 'Citizen approval failed' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (citizenId) => {
    if (!window.confirm('Are you sure you want to delete this Citizen account? Their submitted reports will remain for municipal sanitation archives.')) {
      return;
    }
    try {
      setDeletingId(citizenId);
      const res = await api.deleteUser(citizenId);
      setNotification({ success: res.message });
      setTimeout(() => setNotification(null), 3500);
      await loadCitizens();
    } catch (err) {
      setNotification({ error: err.message || 'Failed to delete citizen' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCitizens = citizens.filter((c) => {
    const isApproved = c.profile?.is_approved;
    if (filter === 'pending' && isApproved) return false;
    if (filter === 'approved' && !isApproved) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (c.full_name || c.username || '').toLowerCase();
      const phone = (c.profile?.phone || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-10">
      
      {/* Top Banner (Dedicated to Citizen Community Members) */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-emerald-900/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Citizen Community Registry</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                ★ Admin Authority
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Citizen Registrations & Approvals
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Review public citizen registrations, view resident profile photos and contact details, approve citizens to permit login, or remove accounts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenProfileModal && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="min-h-[44px] px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs sm:text-sm font-bold border border-white/20 flex items-center gap-1.5 transition-all"
                title="View & Edit Admin Profile"
              >
                <Shield className="w-4 h-4 text-amber-300" />
                <span>Admin Profile</span>
              </button>
            )}

            {onNavigateToWorkers && (
              <button
                type="button"
                onClick={onNavigateToWorkers}
                className="min-h-[44px] px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-1.5 transition-all"
                title="Switch to Workers Management Page"
              >
                <span>Worker Approvals Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Citizen Summary Metric Pills */}
        <div className="mt-5 pt-4 border-t border-emerald-900/60 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
          <div className="bg-white/5 p-2 sm:p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-emerald-200 block uppercase font-semibold">Total Citizens</span>
            <strong className="text-lg sm:text-2xl font-black text-white">{stats.total}</strong>
          </div>
          <div className="bg-white/5 p-2 sm:p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-amber-300 block uppercase font-bold flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> Pending Approval
            </span>
            <strong className="text-lg sm:text-2xl font-black text-amber-300">{stats.pending}</strong>
          </div>
          <div className="bg-white/5 p-2 sm:p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-emerald-300 block uppercase font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Approved Members
            </span>
            <strong className="text-lg sm:text-2xl font-black text-emerald-300">{stats.approved}</strong>
          </div>
          <div className="bg-white/5 p-2 sm:p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-teal-200 block uppercase font-semibold flex items-center justify-center gap-1">
              <Award className="w-3 h-3 text-teal-400" /> Total Points Held
            </span>
            <strong className="text-lg sm:text-2xl font-black text-white">{stats.total_points}</strong>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 shadow-xs ${
            notification.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'
          }`}
          role="alert"
        >
          {notification.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
          <span className="font-semibold">{notification.success || notification.error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search citizens by name, mobile, email..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Citizens ({stats.total})
          </button>

          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({stats.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('approved')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'approved'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved ({stats.approved})</span>
          </button>

          <button
            onClick={loadCitizens}
            className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center gap-1"
            title="Refresh citizens"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Citizens Cards List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="py-20 text-center" role="status">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Loading citizen community members...</p>
          </div>
        ) : filteredCitizens.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No citizens found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {filter === 'pending'
                ? 'Awesome! There are no pending citizen registrations awaiting approval.'
                : 'No citizen accounts match your filter or search query.'}
            </p>
          </div>
        ) : (
          filteredCitizens.map((citizen) => {
            const prof = citizen.profile || {};
            const isApproved = prof.is_approved;
            const isActionLoading = actionLoadingId === citizen.id;
            const isDeleting = deletingId === citizen.id;

            return (
              <article
                key={citizen.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all ${
                  !isApproved
                    ? 'border-amber-300 shadow-md shadow-amber-500/5 bg-amber-50/20'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left: Citizen Avatar / Photo & Details */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-500 font-black shadow-xs">
                        {prof.profile_photo ? (
                          <img
                            src={prof.profile_photo}
                            alt={citizen.full_name || citizen.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold uppercase text-slate-600">
                            {(citizen.full_name || citizen.username || 'C').charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-lg shadow-xs">
                        <Sparkles className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active Citizen Member
                        </span>

                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                            <span>Approved (Can Login)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>Pending Approval (Login Blocked)</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                        {citizen.full_name || `${citizen.first_name || ''} ${citizen.last_name || ''}`.trim() || citizen.username}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">@{citizen.username}</p>

                      {/* Contact Info Pills */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <strong className="text-slate-800">{prof.phone || 'No phone'}</strong>
                        </span>

                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[200px]">{citizen.email || 'No email'}</span>
                        </span>

                        <span className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded text-emerald-800 font-bold border border-emerald-200">
                          <Award className="w-3 h-3 text-emerald-600" />
                          <span>{prof.reward_points || 0} pts</span>
                        </span>

                        {prof.age && (
                          <span className="text-slate-500">
                            Age: <strong>{prof.age}</strong>
                          </span>
                        )}

                        {prof.gender && (
                          <span className="text-slate-500 capitalize">
                            Gender: <strong>{prof.gender.replace('_', ' ')}</strong>
                          </span>
                        )}
                      </div>

                      {prof.address && (
                        <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{prof.address}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Approve Citizen & Delete Citizen */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleApprove(citizen.id)}
                        disabled={isActionLoading}
                        className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {isActionLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserCheck2 className="w-4 h-4" />
                        )}
                        <span>Approve Citizen</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(citizen.id)}
                      disabled={isDeleting}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      title={`Delete ${citizen.username}'s account`}
                    >
                      {isDeleting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>Delete Citizen</span>
                    </button>
                  </div>

                </div>
              </article>
            );
          })
        )}
      </div>

    </div>
  );
}