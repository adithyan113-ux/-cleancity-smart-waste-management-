import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Navigation,
  RefreshCw,
  MapPin,
  Camera,
  ExternalLink,
  Check,
  User,
  Shield
} from 'lucide-react';
import { api } from '../services/api';

export default function WorkerPortal({ currentUser, onOpenProfileModal }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStop, setActiveStop] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadStops = async () => {
    try {
      setLoading(true);
      const res = await api.getWorkerStops();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStops();
  }, []);

  const handleUpdateStatus = async (stopId, newStatus) => {
    try {
      setUpdatingId(stopId);
      const res = await api.updateStopStatus(stopId, newStatus);
      setFeedback({ success: res.message });
      setTimeout(() => setFeedback(null), 3000);
      await loadStops();
    } catch (err) {
      setFeedback({ error: err.message || 'Status update failed' });
    } finally {
      setUpdatingId(null);
    }
  };

  if (currentUser?.role !== 'worker' && currentUser?.role !== 'admin') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="text-lg font-bold text-red-900">Worker Authorization Required</h2>
        <p className="text-xs text-red-700">
          This portal is reserved for sanitation drivers and municipal collection crews. Please switch to the Worker role to access route controls.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 text-center" role="status">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-600">Loading collection assignments...</p>
      </div>
    );
  }

  const activeRoute = data?.routes?.[0];
  const stops = activeRoute?.stops || [];

  return (
    <div className="space-y-4 pb-8">
      
      {/* Worker Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              <Truck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sanitation Driver Field Console</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {activeRoute?.route_name || 'Assigned Daily Collection'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Driver: <strong>{currentUser?.name || 'Dave Miller (Unit 4)'}</strong> • Vehicle: Electric Compactor #04
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenProfileModal && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="min-h-[44px] px-3.5 py-2 bg-blue-600/80 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-blue-400/40 shadow-xs transition-all"
                title="View & Edit Driver Profile & Photo"
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
                <span>Driver Profile & Photo</span>
              </button>
            )}

            <button
              onClick={loadStops}
              className="min-h-[44px] min-w-[44px] p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-colors"
              aria-label="Refresh stops"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Route Metrics Pill */}
        {activeRoute && (
          <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Total Route</span>
              <strong className="text-white text-sm font-bold">{activeRoute.total_distance_km} km</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Est. Time</span>
              <strong className="text-white text-sm font-bold">{activeRoute.estimated_duration_mins} mins</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Pending Stops</span>
              <strong className="text-emerald-400 text-sm font-bold">
                {stops.filter(s => s.status !== 'collected').length} / {stops.length}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-2 ${
            feedback.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'
          }`}
          role="alert"
        >
          {feedback.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
          <span>{feedback.success || feedback.error}</span>
        </div>
      )}

      {/* Assigned Stops: Mobile Touch-Friendly Card List */}
      <section aria-label="Assigned Stops List">
        <h2 className="text-base font-bold text-slate-900 mb-2.5">Route Collection Stops</h2>

        {stops.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">All Scheduled Pickups Completed!</h3>
            <p className="text-xs text-slate-500 mt-1">Check back when the municipality dispatches new routes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stops.map((stop) => {
              const rep = stop.report_details;
              const isUpdating = updatingId === stop.id;

              return (
                <article
                  key={stop.id}
                  className={`bg-white rounded-2xl p-4 border transition-all ${
                    stop.status === 'collected'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : stop.status === 'in_progress'
                      ? 'border-blue-400 ring-2 ring-blue-400/20'
                      : 'border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                        #{stop.stop_order}
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Priority: <strong className="text-red-700 capitalize">{rep?.severity}</strong> • Type: {rep?.waste_type_display}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{rep?.title}</h3>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                        stop.status === 'collected'
                          ? 'bg-emerald-100 text-emerald-800'
                          : stop.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {stop.status_display}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-600 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                    <span>{rep?.address}</span>
                  </div>

                  {stop.notes && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      Driver Note: {stop.notes}
                    </p>
                  )}

                  {/* Touch-Friendly Worker Actions (min 44px height) */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    
                    {/* Navigation shortcut */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${rep?.latitude},${rep?.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      aria-label={`Open Google Maps navigation to Stop ${stop.stop_order}`}
                    >
                      <Navigation className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      <span>Turn-by-Turn GPS</span>
                    </a>

                    {/* Status Action Buttons */}
                    <div className="flex items-center gap-2">
                      {stop.status !== 'in_progress' && stop.status !== 'collected' && (
                        <button
                          onClick={() => handleUpdateStatus(stop.id, 'in_progress')}
                          disabled={isUpdating}
                          className="min-h-[44px] px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                        >
                          En Route
                        </button>
                      )}

                      {stop.status !== 'collected' ? (
                        <button
                          onClick={() => handleUpdateStatus(stop.id, 'collected')}
                          disabled={isUpdating}
                          className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          <span>Mark Collected</span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 py-2">
                          <Check className="w-4 h-4" /> Picked Up
                        </span>
                      )}
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
