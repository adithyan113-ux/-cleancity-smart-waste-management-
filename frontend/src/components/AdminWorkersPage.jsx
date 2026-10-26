import React, { useState, useEffect } from 'react';
import {
  Truck,
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
  Filter
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminWorkersPage({ currentUser, onOpenProfileModal, onNavigateToCitizens, onNavigateToReports }) {
  const [workers, setWorkers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'approved'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminUsers('worker');
      const list = res.users || [];
      setWorkers(list);
      setStats({
        total: list.length,
        pending: list.filter(w => !w.profile?.is_approved).length,
        approved: list.filter(w => w.profile?.is_approved).length,
      });
    } catch (err) {
      console.error(err);
      setNotification({ error: err.message || 'Failed to load workers' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleApprove = async (workerId) => {
    try {
      setActionLoadingId(workerId);
      const res = await api.approveUser(workerId);
      setNotification({ success: res.message });
      setTimeout(() => setNotification(null), 3500);
      await loadWorkers();
    } catch (err) {
      setNotification({ error: err.message || 'Worker approval failed' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (workerId) => {
    if (!window.confirm('Are you sure you want to delete this Sanitation Worker account? They will no longer be able to log in or service routes.')) {
      return;
    }
    try {
      setDeletingId(workerId);
      const res = await api.deleteUser(workerId);
      setNotification({ success: res.message });
      setTimeout(() => setNotification(null), 3500);
      await loadWorkers();
    } catch (err) {
      setNotification({ error: err.message || 'Failed to delete worker' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    const isApproved = w.profile?.is_approved;
    if (filter === 'pending' && isApproved) return false;
    if (filter === 'approved' && !isApproved) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (w.full_name || w.username || '').toLowerCase();
      const phone = (w.profile?.phone || '').toLowerCase();
      const email = (w.email || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-10">
      
      {/* Top Banner (Dedicated to Sanitation Workers) */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-blue-900/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Truck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sanitation Fleet Workforce</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                ★ Admin Authority
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Sanitation Worker Registrations & Approvals
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Review field driver registrations, verify driver photos and credentials, approve accounts so workers can log in, or remove staff.
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

            {onNavigateToCitizens && (
              <button
                type="button"
                onClick={onNavigateToCitizens}
                className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-1.5 transition-all"
                title="Switch to Citizens Management Page"
              >
                <span>Citizen Approvals Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Worker Summary Metric Pills */}
        <div className="mt-5 pt-4 border-t border-blue-900/60 grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="bg-white/5 p-2 sm:p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-blue-200 block uppercase font-semibold">Total Drivers</span>
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
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Approved Drivers
            </span>
            <strong className="text-lg sm:text-2xl font-black text-emerald-300">{stats.approved}</strong>
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
            placeholder="Search workers by name, mobile, email..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Workers ({stats.total})
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
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved ({stats.approved})</span>
          </button>

          <button
            onClick={loadWorkers}
            className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center gap-1"
            title="Refresh workers"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Workers Cards List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="py-20 text-center" role="status">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Loading sanitation workers...</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
            <Truck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No workers found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {filter === 'pending'
                ? 'Great! There are no pending sanitation worker registrations awaiting approval.'
                : 'No sanitation worker accounts match your filter or search query.'}
            </p>
          </div>
        ) : (
          filteredWorkers.map((worker) => {
            const prof = worker.profile || {};
            const isApproved = prof.is_approved;
            const isActionLoading = actionLoadingId === worker.id;
            const isDeleting = deletingId === worker.id;

            return (
              <article
                key={worker.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all ${
                  !isApproved
                    ? 'border-amber-300 shadow-md shadow-amber-500/5 bg-amber-50/20'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left: Driver Avatar / Photo & Details */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-500 font-black shadow-xs">
                        {prof.profile_photo ? (
                          <img
                            src={prof.profile_photo}
                            alt={worker.full_name || worker.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold uppercase text-slate-600">
                            {(worker.full_name || worker.username || 'W').charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 p-1 bg-blue-600 text-white rounded-lg shadow-xs">
                        <Truck className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Sanitation Driver
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
                        {worker.full_name || `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || worker.username}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">@{worker.username}</p>

                      {/* Contact Info Pills */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <strong className="text-slate-800">{prof.phone || 'No phone'}</strong>
                        </span>

                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[200px]">{worker.email || 'No email'}</span>
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

                      {prof.id_details && (
                        <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 inline-flex items-center gap-1.5">
                          <span>🪪 ID / License:</span>
                          <strong>{prof.id_details}</strong>
                        </div>
                      )}

                      {prof.address && (
                        <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{prof.address}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Approve Worker & Delete Worker */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleApprove(worker.id)}
                        disabled={isActionLoading}
                        className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {isActionLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserCheck2 className="w-4 h-4" />
                        )}
                        <span>Approve Worker</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(worker.id)}
                      disabled={isDeleting}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      title={`Delete ${worker.username}'s account`}
                    >
                      {isDeleting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>Delete Worker</span>
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