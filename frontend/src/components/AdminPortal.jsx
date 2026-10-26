import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Truck,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  Users,
  UserX,
  UserCheck2,
  Phone,
  Mail,
  Home,
  Clock,
  Camera,
  Trash2,
  Check,
  Filter
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminPortal({ currentUser, onNavigateToMap, onOpenProfileModal }) {
  const [activeSection, setActiveSection] = useState('reports'); // 'reports' | 'users'
  const [reports, setReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [userStats, setUserStats] = useState({ total_users: 0, pending_count: 0, approved_count: 0, citizen_count: 0, worker_count: 0 });
  const [userFilter, setUserFilter] = useState('all'); // 'all' | 'pending' | 'citizen' | 'worker'

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [generatingRoute, setGeneratingRoute] = useState(false);
  const [notification, setNotification] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [reportsRes, usersRes] = await Promise.all([
        api.getAdminReports(),
        api.getAdminUsers()
      ]);
      setReports(reportsRes.reports || []);
      setWorkers(reportsRes.workers || []);
      setUsersList(usersRes.users || []);
      setUserStats({
        total_users: usersRes.total_users || 0,
        pending_count: usersRes.pending_count || 0,
        approved_count: usersRes.approved_count || 0,
        citizen_count: usersRes.citizen_count || 0,
        worker_count: usersRes.worker_count || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAction = async (reportId, action, workerId = null) => {
    try {
      setActionLoadingId(reportId);
      await api.updateReportStatus(reportId, action, workerId);
      setNotification({ success: `Report #${reportId} status set to ${action}.` });
      setTimeout(() => setNotification(null), 3000);
      await loadAdminData();
    } catch (err) {
      setNotification({ error: err.message || 'Action failed' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGenerateRoute = async () => {
    try {
      setGeneratingRoute(true);
      const res = await api.generateDynamicRoute();
      setNotification({ success: res.message });
      await loadAdminData();
      if (onNavigateToMap) onNavigateToMap();
    } catch (err) {
      setNotification({ error: err.message || 'Route generation failed' });
    } finally {
      setGeneratingRoute(false);
    }
  };

  // User Approval Action
  const handleApproveUser = async (userId) => {
    try {
      setActionLoadingId(`approve-${userId}`);
      const res = await api.approveUser(userId);
      setNotification({ success: res.message });
      setTimeout(() => setNotification(null), 3500);
      await loadAdminData();
    } catch (err) {
      setNotification({ error: err.message || 'Approval failed' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // User Deletion Action
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account? This cannot be undone.')) {
      return;
    }
    try {
      setDeletingUserId(userId);
      const res = await api.deleteUser(userId);
      setNotification({ success: res.message });
      setTimeout(() => setNotification(null), 3500);
      await loadAdminData();
    } catch (err) {
      setNotification({ error: err.message || 'Failed to delete user' });
    } finally {
      setDeletingUserId(null);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
        <Shield className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="text-lg font-bold text-red-900">Administrator Access Enforced</h2>
        <p className="text-xs text-red-700">
          This portal requires municipal administrative privileges. Backend endpoints strictly verify administrator credentials.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 text-center" role="status">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-600">Loading municipal supervision console...</p>
      </div>
    );
  }

  // Filter users based on selected filter tab
  const filteredUsers = usersList.filter(u => {
    const prof = u.profile || {};
    if (userFilter === 'pending') return !prof.is_approved;
    if (userFilter === 'citizen') return prof.role === 'citizen';
    if (userFilter === 'worker') return prof.role === 'worker';
    return true;
  });

  return (
    <div className="space-y-5 pb-8">
      
      {/* Admin Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Municipal Sanitation Command</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                ★ Exclusive Superuser (Only 1 Admin)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              City Supervision & User Approval
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Superuser: <strong>{currentUser?.name || 'Chief Elena Martinez'}</strong> • Single Administrative Authority
            </p>
          </div>

          {/* Action Buttons: Profile Modal & Dynamic Route Dispatch */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenProfileModal && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="min-h-[44px] px-3.5 py-2 bg-indigo-800/70 hover:bg-indigo-700/80 active:bg-indigo-900 text-white rounded-xl text-xs sm:text-sm font-bold border border-indigo-600/40 flex items-center gap-1.5 transition-all"
                title="View and edit admin profile"
              >
                <Shield className="w-4 h-4 text-amber-300" />
                <span>Admin Profile</span>
              </button>
            )}

            <button
              onClick={handleGenerateRoute}
              disabled={generatingRoute}
              className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Truck className={`w-4 h-4 ${generatingRoute ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{generatingRoute ? 'Optimizing Stops...' : 'Generate Dynamic Route'}</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Pills */}
        <div className="mt-5 pt-4 border-t border-indigo-900/60 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('reports')}
            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeSection === 'reports'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Waste Reports ({reports.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('users')}
            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeSection === 'users'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User & Citizen Management ({userStats.total_users})</span>
            {userStats.pending_count > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 animate-pulse">
                {userStats.pending_count} Pending
              </span>
            )}
          </button>
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

      {/* SECTION 1: INCOMING WASTE REPORTS */}
      {activeSection === 'reports' && (
        <section aria-label="Citizen Reports Review List">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Incoming Waste Reports ({reports.length})</h2>
              <p className="text-xs text-slate-500">Review AI predictions and approve for truck collection</p>
            </div>
            <button
              onClick={loadAdminData}
              className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg flex items-center gap-1 bg-white border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-3">
            {reports.map((report) => {
              const isLoading = actionLoadingId === report.id;

              return (
                <article
                  key={report.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">Report #{report.id}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 capitalize">
                        {report.waste_type_display}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          report.severity === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : report.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {report.severity_display}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        report.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : report.status === 'approved'
                          ? 'bg-teal-100 text-teal-800'
                          : report.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {report.status_display}
                    </span>
                  </div>

                  {/* Content with thumbnail and AI summary */}
                  <div className="flex items-start gap-3">
                    {report.image_url && (
                      <img
                        src={report.image_url}
                        alt={report.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900">{report.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{report.address}</span>
                      </p>
                      <div className="mt-1.5 p-2 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900">
                        <strong>AI Vision Prediction:</strong> {report.ai_classification_summary || 'Verified high confidence classification.'}
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions Bar (Touch targets >= 44px) */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      Reporter: <strong>{report.user_name}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(report.id, 'reject')}
                            disabled={isLoading}
                            className="min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                          <button
                            onClick={() => handleAction(report.id, 'approve')}
                            disabled={isLoading}
                            className="min-h-[44px] px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                        </>
                      )}

                      {report.status === 'approved' && !report.assigned_worker && (
                        <button
                          onClick={() => handleAction(report.id, 'assign', workers[0]?.id)}
                          disabled={isLoading}
                          className="min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1"
                        >
                          <UserCheck className="w-4 h-4" /> Assign Driver
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 2: USER & CITIZEN MANAGEMENT / APPROVAL */}
      {activeSection === 'users' && (
        <section aria-label="User & Citizen Registration Approval and Deletion Console" className="space-y-4">
          
          {/* Header & Stats Overview */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registered Citizens & Workers</h2>
              <p className="text-xs text-slate-500">
                Approve accounts to permit login, view photo profiles, or delete citizen/worker accounts
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setUserFilter('all')}
                className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  userFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({usersList.length})
              </button>

              <button
                type="button"
                onClick={() => setUserFilter('pending')}
                className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  userFilter === 'pending' ? 'bg-amber-500 text-slate-950' : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Approvals ({userStats.pending_count})</span>
              </button>

              <button
                type="button"
                onClick={() => setUserFilter('citizen')}
                className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  userFilter === 'citizen' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                Citizens ({userStats.citizen_count})
              </button>

              <button
                type="button"
                onClick={() => setUserFilter('worker')}
                className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  userFilter === 'worker' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                Workers ({userStats.worker_count})
              </button>
            </div>
          </div>

          {/* Users List Cards */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No users match this filter</h3>
                <p className="text-xs text-slate-400 mt-0.5">Try selecting "All" or waiting for new registrations.</p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const prof = u.profile || {};
                const isApproved = prof.is_approved;
                const isActionLoading = actionLoadingId === `approve-${u.id}`;
                const isDeleting = deletingUserId === u.id;
                const isCitizen = prof.role === 'citizen';

                return (
                  <article
                    key={u.id}
                    className={`bg-white rounded-2xl p-4 border transition-all ${
                      !isApproved
                        ? 'border-amber-300 shadow-amber-500/5 bg-amber-50/20'
                        : 'border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* Left: User Avatar Photo & Identity */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0 flex items-center justify-center text-slate-500 font-black shadow-xs">
                          {prof.profile_photo ? (
                            <img
                              src={prof.profile_photo}
                              alt={u.full_name || u.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl font-bold uppercase text-slate-600">
                              {(u.full_name || u.username || 'U').charAt(0)}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            {/* Role Badge */}
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isCitizen
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {isCitizen ? 'Citizen' : 'Sanitation Driver'}
                            </span>

                            {/* Approval Status Badge */}
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                <span>Approved (Can Login)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>Pending Approval (Cannot Login)</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900 leading-tight truncate">
                            {u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username}
                          </h3>
                          <span className="text-xs text-slate-400 font-mono">@{u.username}</span>

                          {/* Contact Info Pills */}
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <strong className="text-slate-800">{prof.phone || 'No phone'}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{u.email || 'No email'}</span>
                            </span>
                            {prof.age && (
                              <span className="text-slate-500">
                                Age: <strong>{prof.age}</strong>
                              </span>
                            )}
                          </div>

                          {prof.address && (
                            <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                              <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{prof.address}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions Bar (Approve, Delete) */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        
                        {/* Approve Button (Visible if unapproved) */}
                        {!isApproved && (
                          <button
                            type="button"
                            onClick={() => handleApproveUser(u.id)}
                            disabled={isActionLoading}
                            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            {isActionLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck2 className="w-4 h-4" />
                            )}
                            <span>Approve User</span>
                          </button>
                        )}

                        {/* Delete User Button (Requirement: "admin user and citiezn na delete cheyn ula functionu venam") */}
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={isDeleting}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                          title={`Delete ${u.username}'s account`}
                        >
                          {isDeleting ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          <span>Delete</span>
                        </button>
                      </div>

                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}

    </div>
  );
}
