import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Truck,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  ExternalLink,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';
import L from 'leaflet';
import { api } from '../services/api';

export default function RouteMap({ currentUser }) {
  const [reports, setReports] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [activeRoute, setActiveRoute] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [showStopsList, setShowStopsList] = useState(true);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const polylineRef = useRef(null);

  // Load reports and routes
  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, workerData] = await Promise.all([
        api.getReports({ page_size: 20 }),
        api.getWorkerStops().catch(() => ({ routes: [] }))
      ]);

      setReports(reportsData.results || []);
      const activeRoutes = workerData.routes || [];
      setRoutes(activeRoutes);
      if (activeRoutes.length > 0) {
        setActiveRoute(activeRoutes[0]);
      }
    } catch (err) {
      console.error('Error fetching route map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update stop status directly from map interface (Worker action)
  const handleUpdateStopStatus = async (stopId, newStatus) => {
    try {
      await api.updateStopStatus(stopId, newStatus);
      await loadData();
    } catch (err) {
      alert(`Could not update stop: ${err.message}`);
    }
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [40.7180, -74.0040],
        zoom: 14,
        zoomControl: true,
        attributionControl: false
      });

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      });

      tileLayer.on('tileerror', () => {
        setTileError(true);
      });

      tileLayer.addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Handle window resize and mobile orientation change
      const handleResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);

      // Clean up on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, []);

  // Render markers and polyline when data or activeRoute changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const map = mapInstanceRef.current;
    const bounds = L.latLngBounds();

    // 1. Municipal Depot Pin (Starting point)
    const depotLat = 40.7128;
    const depotLon = -74.0060;
    bounds.extend([depotLat, depotLon]);

    const depotIcon = L.divIcon({
      className: 'depot-marker',
      html: `<div style="background-color: #0f172a; width: 44px; height: 44px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
             </div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    L.marker([depotLat, depotLon], { icon: depotIcon })
      .bindPopup('<strong>Central Sanitation Depot</strong><br/>Route Start & Vehicle Fleet')
      .addTo(layerGroupRef.current);

    const routeCoordinates = [[depotLat, depotLon]];

    // 2. Plot Stops from active route if available, or all reports
    const displayStops = activeRoute?.stops || [];
    
    if (displayStops.length > 0) {
      displayStops.forEach((stop) => {
        const rep = stop.report_details;
        if (!rep?.latitude || !rep?.longitude) return;

        bounds.extend([rep.latitude, rep.longitude]);
        routeCoordinates.push([rep.latitude, rep.longitude]);

        // Touch-friendly color coded marker
        const markerColor =
          stop.status === 'collected'
            ? '#059669' // Green
            : rep.severity === 'urgent'
            ? '#dc2626' // Red
            : rep.severity === 'high'
            ? '#ea580c' // Orange
            : '#2563eb'; // Blue

        const stopIcon = L.divIcon({
          className: 'touch-stop-marker',
          html: `<div style="background-color: ${markerColor}; width: 44px; height: 44px; border-radius: 50%; border: 3px solid white; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                  <span>#${stop.stop_order}</span>
                 </div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const marker = L.marker([rep.latitude, rep.longitude], { icon: stopIcon })
          .addTo(layerGroupRef.current);

        marker.on('click', () => {
          setSelectedStop(stop);
        });
      });

      // Draw Route Polyline
      polylineRef.current = L.polyline(routeCoordinates, {
        color: '#059669',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8'
      }).addTo(map);

    } else {
      // Fallback: plot general waste reports
      reports.forEach((rep) => {
        if (!rep.latitude || !rep.longitude) return;
        bounds.extend([rep.latitude, rep.longitude]);

        const markerColor = rep.severity === 'urgent' ? '#dc2626' : rep.severity === 'high' ? '#ea580c' : '#059669';

        const repIcon = L.divIcon({
          className: 'touch-report-marker',
          html: `<div style="background-color: ${markerColor}; width: 44px; height: 44px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                 </div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const marker = L.marker([rep.latitude, rep.longitude], { icon: repIcon })
          .addTo(layerGroupRef.current);

        marker.on('click', () => {
          setSelectedStop({ report_details: rep, stop_order: 1, status: rep.status });
        });
      });
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
    map.invalidateSize();
  }, [reports, activeRoute]);

  return (
    <div className="space-y-4 pb-8">
      
      {/* Header and Route Info */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dynamic Collection Route Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time optimal stop sequence powered by distance and urgency weighting.
          </p>
        </div>

        {/* Transparent Simulation Notice */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
          <Info className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          <span>Demo Route Optimization • GPS Signal Emulated</span>
        </div>
      </div>

      {/* Tile Unavailable Warning Fallback */}
      {tileError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
          <span>External map tile server is temporarily slow or unavailable. Map markers remain interactive.</span>
        </div>
      )}

      {/* Main Map Container: Responsive Mobile First */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 h-[380px] sm:h-[460px] w-full">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Route Stats Floating Badge */}
        {activeRoute && (
          <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Truck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>{activeRoute.route_name}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-600 font-semibold">
              <span>{activeRoute.total_distance_km} km</span>
              <span>•</span>
              <span>~{activeRoute.estimated_duration_mins} mins</span>
              <span>•</span>
              <span>{activeRoute.stops?.length || 0} stops</span>
            </div>
          </div>
        )}

        {/* Selected Stop Quick Action Drawer on Map */}
        {selectedStop && (
          <div className="absolute bottom-3 left-3 right-3 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl animate-in slide-in-from-bottom duration-200 max-w-md mx-auto">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                    Stop #{selectedStop.stop_order}
                  </span>
                  <span className="capitalize text-xs font-bold text-slate-600">
                    {selectedStop.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {selectedStop.report_details?.title}
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {selectedStop.report_details?.address}
                </p>
              </div>

              <button
                onClick={() => setSelectedStop(null)}
                className="min-h-[36px] min-w-[36px] p-1 text-slate-400 hover:text-slate-700 flex items-center justify-center rounded-lg"
                aria-label="Close stop card"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStop.report_details?.latitude},${selectedStop.report_details?.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>Navigate (GPS)</span>
              </a>

              {/* Worker status update triggers */}
              {(currentUser?.role === 'worker' || currentUser?.role === 'admin') && selectedStop.id && (
                <div className="flex items-center gap-1.5">
                  {selectedStop.status !== 'collected' && (
                    <button
                      onClick={() => handleUpdateStopStatus(selectedStop.id, 'collected')}
                      className="min-h-[40px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Mark Collected</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stop Sequence List: Exclusively for Workers and Admin */}
      {(currentUser?.role === 'worker' || currentUser?.role === 'admin') && activeRoute?.stops && activeRoute.stops.length > 0 && (
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Assigned Collection Stops</h2>
              <p className="text-xs text-slate-500">Tap any stop to center on map or update collection state</p>
            </div>
            <button
              onClick={() => setShowStopsList(!showStopsList)}
              className="min-h-[44px] px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg flex items-center gap-1"
            >
              <span>{showStopsList ? 'Hide List' : 'Show List'}</span>
              {showStopsList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showStopsList && (
            <div className="space-y-2.5">
              {activeRoute.stops.map((stop) => {
                const rep = stop.report_details;
                const isSelected = selectedStop?.id === stop.id;
                return (
                  <div
                    key={stop.id}
                    onClick={() => {
                      setSelectedStop(stop);
                      if (mapInstanceRef.current && rep?.latitude && rep?.longitude) {
                        mapInstanceRef.current.setView([rep.latitude, rep.longitude], 16);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                    tabIndex="0"
                    role="button"
                    aria-label={`Stop #${stop.stop_order}: ${rep?.title}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {stop.stop_order}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {rep?.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">{rep?.address}</p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {stop.status === 'collected' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Collected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Citizen View: Reported Waste Locations on Map */}
      {currentUser?.role === 'citizen' && reports.length > 0 && (
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Community Waste Reports Map List</h2>
              <p className="text-xs text-slate-500">Tap any report to view coordinates and cleanup status</p>
            </div>
          </div>
          <div className="space-y-2">
            {reports.slice(0, 6).map((rep) => (
              <div
                key={rep.id}
                onClick={() => {
                  setSelectedStop({ report_details: rep, stop_order: 1, status: rep.status });
                  if (mapInstanceRef.current && rep.latitude && rep.longitude) {
                    mapInstanceRef.current.setView([rep.latitude, rep.longitude], 16);
                  }
                }}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-between gap-2 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{rep.title}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{rep.address}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                  rep.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {rep.status_display}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
