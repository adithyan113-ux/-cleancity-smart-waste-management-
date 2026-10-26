import React, { useState, useEffect } from 'react';
import {
  Award,
  Clock,
  CheckCircle2,
  CheckCheck,
  AlertCircle,
  Gift,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Sparkles,
  MapPin,
  RefreshCw,
  Camera,
  Tag,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { User } from 'lucide-react';

export default function CitizenDashboard({ onOpenReportModal, onNavigateToRewards, onNavigateToMap, currentUser, onOpenProfileModal }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardSummary();
      setData(res);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4" role="status" aria-label="Loading dashboard">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-600">Loading your green dashboard...</p>
      </div>
    );
  }

  const { reward_points, milestone, stats, recent_reports, user_vouchers } = data || {
    reward_points: 140,
    milestone: { points_in_cycle: 40, progress_percentage: 40, points_needed: 60, eligible_vouchers_count: 1 },
    stats: { approved: 2, pending: 1, resolved: 1, in_progress: 1 },
    recent_reports: [],
    user_vouchers: []
  };

  // Status badge styling helper (Color + Icon + Text)
  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
            <span>Resolved</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <RefreshCw className="w-3.5 h-3.5 text-blue-700 animate-spin" aria-hidden="true" />
            <span>Collecting</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
            <span>Approved</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'urgent':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">Urgent</span>;
      case 'high':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300">High</span>;
      case 'medium':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">Medium</span>;
      default:
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">Low</span>;
    }
  };

  return (
    <div className="space-y-5 pb-8">
      
      {/* Mobile Top Welcome Banner */}
      <section className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white rounded-2xl p-4 sm:p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-600/60 text-emerald-100 border border-emerald-400/40 mb-2">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Smart Citizen Hub</span>
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Welcome back, {data?.user?.first_name || 'Sarah'}!
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
                Your reported waste helps optimize municipal collection routes and keeps our city clean.
              </p>
            </div>
            
            {/* Quick Actions: Profile & Report Waste */}
            <div className="flex flex-wrap items-center gap-2">
              {onOpenProfileModal && (
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="min-h-[44px] px-3.5 py-2.5 bg-emerald-800/60 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-bold border border-emerald-400/40 shadow-xs flex items-center gap-1.5 transition-all"
                  title="View & Edit My Profile & Photo"
                >
                  {currentUser?.profile_photo || currentUser?.photo ? (
                    <img
                      src={currentUser.profile_photo || currentUser.photo}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover border border-white"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>My Profile & Photo</span>
                </button>
              )}

              <button
                onClick={onOpenReportModal}
                className="min-h-[44px] px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 active:bg-emerald-100 rounded-xl text-sm font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95 focus:ring-2 focus:ring-white"
                aria-label="Report garbage now"
              >
                <Camera className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>Report Waste</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* D. Compact Responsive Cards: Points & Milestone */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5" aria-label="Points and Milestone Summary">
        
        {/* Available Reward Points Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reward Points</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">{reward_points}</span>
              <span className="text-sm font-bold text-emerald-600">Points Available</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Earn +20 points for each verified waste report submission.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onNavigateToRewards}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 min-h-[36px] focus:ring-2 focus:ring-emerald-500 rounded p-1"
            >
              <span>Redeem Vouchers</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span className="text-xs text-slate-400 font-medium">100 pts = $5 Voucher</span>
          </div>
        </div>

        {/* Milestone Progress Toward Next 100-Point Voucher */}
        <div className="md:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Gift className="w-4 h-4" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Next 100-Point Voucher Milestone</h2>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {milestone.eligible_vouchers_count > 0 ? `${milestone.eligible_vouchers_count} Ready to Redeem` : 'In Progress'}
            </span>
          </div>

          {/* Progress Bar & Details */}
          <div className="my-3">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>Current Cycle: <strong className="text-slate-900">{milestone.points_in_cycle} / 100 pts</strong></span>
              <span className="text-teal-700 font-bold">{milestone.progress_percentage}%</span>
            </div>

            {/* Accessible Progress Bar */}
            <div
              className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 overflow-hidden"
              role="progressbar"
              aria-valuenow={milestone.progress_percentage}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label={`Progress toward next 100-point voucher: ${milestone.progress_percentage}%`}
            >
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(milestone.progress_percentage, 5)}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 mt-2">
              {milestone.points_needed > 0
                ? `${milestone.points_needed} more points needed to unlock your next $5 partner voucher!`
                : 'You have reached 100 points! Ready to claim your voucher below.'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Eligible Partner Rewards</span>
            <button
              onClick={onNavigateToRewards}
              className="min-h-[36px] px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              Claim Voucher
            </button>
          </div>
        </div>

      </section>

      {/* D. Report Counts: Approved, Pending, Resolved */}
      <section aria-label="Report Statistics Breakdown">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          Report Activity & Verification
        </h2>
        
        {/* On mobile screens, cards stack or use 2x2 grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-teal-600 mb-1">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-bold text-slate-600">Approved</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.approved}</p>
            <span className="text-[11px] text-slate-400">Scheduled for pickup</span>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-amber-600 mb-1">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-bold text-slate-600">Pending</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.pending}</p>
            <span className="text-[11px] text-slate-400">Awaiting AI/Inspector</span>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-blue-600 mb-1">
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-bold text-slate-600">In Progress</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.in_progress || 1}</p>
            <span className="text-[11px] text-slate-400">Truck en route</span>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
              <CheckCheck className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-bold text-slate-600">Resolved</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.resolved}</p>
            <span className="text-[11px] text-slate-400">Cleaned & completed</span>
          </div>

        </div>
      </section>

      {/* D. Recent Report History: Mobile-Friendly Cards */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Waste Reports</h2>
            <p className="text-xs text-slate-500">Track real-time status of garbage spots you reported</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="min-h-[44px] min-w-[44px] p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-50 rounded-lg flex items-center justify-center"
            aria-label="Refresh report list"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {recent_reports.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">No reports submitted yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Take a photo of street waste to earn points!</p>
            <button
              onClick={onOpenReportModal}
              className="mt-3 min-h-[44px] px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              + Submit First Report
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recent_reports.map((report) => (
              <article
                key={report.id}
                onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                className="p-3 sm:p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all bg-white hover:bg-slate-50/50 cursor-pointer"
                tabIndex="0"
                role="button"
                aria-expanded={selectedReport?.id === report.id}
                aria-label={`Report #${report.id}: ${report.title}, status: ${report.status_display}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedReport(selectedReport?.id === report.id ? null : report);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  
                  {/* Thumbnail / Waste Icon */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                    {report.image_url ? (
                      <img
                        src={report.image_url}
                        alt={`Photo of ${report.title}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Tag className="w-6 h-6" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  {/* Report Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">#{report.id}</span>
                        {getSeverityBadge(report.severity)}
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 truncate">{report.title}</h3>

                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span className="truncate">{report.address}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      <span className="font-semibold text-emerald-700">+{report.points_awarded} pts</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details when tapped */}
                {selectedReport?.id === report.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-100">
                      <strong className="block font-bold mb-0.5">AI Classification Assessment:</strong>
                      <p>{report.ai_classification_summary || 'Analyzed via server-side vision model.'}</p>
                      <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                        Confidence: {(report.ai_confidence * 100).toFixed(1)}% • Waste Type: {report.waste_type_display}
                      </span>
                    </div>
                    {report.notes && (
                      <p className="text-slate-600">
                        <strong>Citizen Notes:</strong> {report.notes}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500">Assigned Driver: <strong>{report.assigned_worker_name}</strong></span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToMap();
                        }}
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1 min-h-[36px]"
                      >
                        <span>View on Map</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* D. Active Vouchers Section */}
      {user_vouchers.length > 0 && (
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs" aria-label="Active Vouchers">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Active Vouchers</h2>
              <p className="text-xs text-slate-500">Present code at partner checkout to redeem discount</p>
            </div>
            <button
              onClick={onNavigateToRewards}
              className="text-xs font-bold text-emerald-700 hover:underline min-h-[36px] flex items-center gap-1"
            >
              <span>Store</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {user_vouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="p-3.5 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>{voucher.partner_name}</span>
                    <span className="text-emerald-700 font-extrabold">{voucher.discount_text}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{voucher.title}</h3>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-emerald-200">
                  <code className="text-sm font-mono font-bold text-emerald-800 tracking-wider">
                    {voucher.code}
                  </code>
                  <button
                    onClick={() => handleCopyCode(voucher.code)}
                    className="min-h-[36px] px-2.5 py-1 text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded flex items-center gap-1 transition-colors"
                    aria-label={`Copy voucher code ${voucher.code}`}
                  >
                    {copiedCode === voucher.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
