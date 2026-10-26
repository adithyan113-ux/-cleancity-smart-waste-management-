import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  MapPin,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Navigation,
  Check,
  Award,
  Image as ImageIcon
} from 'lucide-react';
import L from 'leaflet';
import { api, compressImageFile } from '../services/api';

export default function ReportGarbageModal({ isOpen, onClose, onReportSubmitted }) {
  const [step, setStep] = useState('form'); // 'form' | 'submitting' | 'success'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [wasteType, setWasteType] = useState('plastic');
  const [severity, setSeverity] = useState('medium');
  const [address, setAddress] = useState('Downtown Civic Center, Broadway & Pine');
  const [latitude, setLatitude] = useState(40.7135);
  const [longitude, setLongitude] = useState(-74.0042);
  const [notes, setNotes] = useState('');

  // UI & Validation States
  const [errors, setErrors] = useState({});
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null);
  const [submittedReport, setSubmittedReport] = useState(null);

  // File input refs for camera vs gallery
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setErrors({});
      setGpsStatus(null);
    }
  }, [isOpen]);

  // Leaflet Map Initialization for Location Picker
  useEffect(() => {
    if (!isOpen || step !== 'form') return;

    const timer = setTimeout(() => {
      if (mapContainerRef.current && !mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [latitude, longitude],
          zoom: 15,
          zoomControl: true,
          attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        // Custom touch-friendly pin marker
        const pinIcon = L.divIcon({
          className: 'custom-pin-icon',
          html: `<div style="background-color: #059669; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                 </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36]
        });

        const marker = L.marker([latitude, longitude], {
          draggable: true,
          icon: pinIcon
        }).addTo(map);

        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          setLatitude(Number(pos.lat.toFixed(5)));
          setLongitude(Number(pos.lng.toFixed(5)));
          setAddress(`Map Pin Location (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`);
        });

        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          setLatitude(Number(e.latlng.lat.toFixed(5)));
          setLongitude(Number(e.latlng.lng.toFixed(5)));
          setAddress(`Selected Location (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`);
        });

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;

        // Requirement E: Map resizing when orientation or screen width changes
        map.invalidateSize();
      } else if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [isOpen, step]);

  // Handle Photo Selection (Camera or Gallery)
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const rawPreviewUrl = URL.createObjectURL(file);
    setImagePreview(rawPreviewUrl);
    setErrors((prev) => ({ ...prev, image: undefined }));

    // Client-side compression for mobile bandwidth optimization
    const originalSizeKb = (file.size / 1024).toFixed(0);
    const compressed = await compressImageFile(file);
    const compressedSizeKb = (compressed.size / 1024).toFixed(0);
    
    setImageFile(compressed);
    setCompressionInfo({
      original: originalSizeKb,
      compressed: compressedSizeKb,
      saved: Math.max(0, originalSizeKb - compressedSizeKb)
    });

    // Run Server-side AI model inference for automatic waste category & severity detection
    try {
      setAnalyzingAi(true);
      const aiRes = await api.classifyImagePreview(compressed);
      setAiAnalysis(aiRes);
      if (aiRes.predicted_type) setWasteType(aiRes.predicted_type);
      if (aiRes.severity) setSeverity(aiRes.severity);
      if (!title) setTitle(`Reported ${aiRes.waste_label || 'Waste'}`);
    } catch (err) {
      console.warn('AI preview note:', err);
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Optional Geolocation Permission Handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus({ error: 'Geolocation is not supported by your browser.' });
      return;
    }

    setGpsLoading(true);
    setGpsStatus(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lon = Number(pos.coords.longitude.toFixed(5));
        setLatitude(lat);
        setLongitude(lon);
        setAddress(`GPS Position (${lat}, ${lon}) - Accuracy: ±${Math.round(pos.coords.accuracy)}m`);
        setGpsStatus({ success: `GPS location acquired (accuracy ±${Math.round(pos.coords.accuracy)}m)` });
        setGpsLoading(false);

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lon], 16);
          markerInstanceRef.current.setLatLng([lat, lon]);
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatus({
          error: `Location access denied or unavailable (${err.message}). You can select your location on the map below.`
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Submit Handler with Duplicate Submission Prevention
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Inline field validation
    const newErrors = {};
    if (!address.trim()) {
      newErrors.address = 'Street address or location description is required.';
    }
    if (!latitude || !longitude) {
      newErrors.location = 'Valid coordinates must be selected on the map or GPS.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStep('submitting');
    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      formData.append('title', title.trim() || 'Reported Waste Spot');
      formData.append('waste_type', wasteType);
      formData.append('severity', severity);
      formData.append('address', address.trim());
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('notes', notes.trim());

      const res = await api.submitReport(formData);
      setSubmittedReport(res);
      setStep('success');
      if (onReportSubmitted) {
        onReportSubmitted(res);
      }
    } catch (err) {
      setStep('form');
      setErrors({ form: err.message || 'Submission failed. Please check connection and try again.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-4 py-3.5 sm:px-6 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-200" aria-hidden="true" />
            <h2 id="report-modal-title" className="text-base sm:text-lg font-bold">
              Report Street Garbage
            </h2>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -mr-2 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-600/50 flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {step === 'form' && (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              
              {/* Top Form Alert Error */}
              {errors.form && (
                <div
                  className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs sm:text-sm flex items-start gap-2"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* C. Image Capture & Gallery Upload Controls */}
              <fieldset className="space-y-2">
                <legend className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Waste Photo (Camera / Gallery)
                </legend>

                {/* Hidden input for direct camera capture */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageSelect}
                  aria-label="Take photo with camera"
                />

                {/* Hidden input for gallery upload */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                  aria-label="Upload photo from gallery"
                />

                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src={imagePreview}
                      alt="Uploaded waste preview"
                      className="w-full h-48 sm:h-56 object-cover"
                    />
                    
                    {/* Compression indicator pill */}
                    {compressionInfo && (
                      <span className="absolute bottom-2 left-2 px-2 py-1 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono rounded-md">
                        Compressed: {compressionInfo.compressed}KB (saved {compressionInfo.saved}KB)
                      </span>
                    )}

                    {/* Change / Retake Photo Button */}
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="min-h-[38px] px-2.5 py-1 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-xs font-bold shadow-sm backdrop-blur-xs flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" /> Retake
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setAiAnalysis(null);
                        }}
                        className="min-h-[38px] min-w-[38px] p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center shadow-sm"
                        aria-label="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Option A: Take Photo Directly */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="min-h-[64px] p-3 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 active:bg-emerald-100 text-emerald-800 flex flex-col items-center justify-center gap-1 transition-colors focus:ring-2 focus:ring-emerald-500"
                    >
                      <Camera className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                      <span className="text-xs font-bold">Take Live Photo</span>
                      <span className="text-[10px] text-emerald-600">Opens Camera</span>
                    </button>

                    {/* Option B: Choose from Photo Gallery */}
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="min-h-[64px] p-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 flex flex-col items-center justify-center gap-1 transition-colors focus:ring-2 focus:ring-slate-400"
                    >
                      <Upload className="w-6 h-6 text-slate-500" aria-hidden="true" />
                      <span className="text-xs font-bold">Choose from Gallery</span>
                      <span className="text-[10px] text-slate-500">Select Image</span>
                    </button>
                  </div>
                )}

                {/* AI Instant Inference Preview Banner */}
                {analyzingAi && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" aria-hidden="true" />
                    <span>Running server-side AI model inference...</span>
                  </div>
                )}

                {aiAnalysis && !analyzingAi && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1 text-emerald-800">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                        AI Vision Analysis Result
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800 text-[10px]">
                        {(aiAnalysis.confidence * 100).toFixed(1)}% Confidence
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">{aiAnalysis.summary}</p>
                  </div>
                )}
              </fieldset>

              {/* C. Location Selection & Optional Geolocation */}
              <fieldset className="space-y-2">
                <div className="flex items-center justify-between">
                  <legend className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    2. Location & Map Pin
                  </legend>
                  
                  {/* Optional Geolocation Trigger */}
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gpsLoading}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1 transition-colors disabled:opacity-50"
                    aria-label="Use device GPS location"
                  >
                    <Navigation className={`w-3.5 h-3.5 text-emerald-600 ${gpsLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                    <span>{gpsLoading ? 'Locating...' : 'Use My GPS'}</span>
                  </button>
                </div>

                {gpsStatus?.success && (
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    {gpsStatus.success}
                  </p>
                )}

                {gpsStatus?.error && (
                  <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {gpsStatus.error}
                  </p>
                )}

                {/* Leaflet Touch-friendly Location Picker */}
                <div className="relative rounded-xl overflow-hidden border border-slate-200 h-44 sm:h-52 w-full">
                  <div ref={mapContainerRef} className="w-full h-full" />
                  <span className="absolute bottom-1 right-2 z-20 bg-white/90 backdrop-blur-xs text-[10px] px-2 py-0.5 rounded text-slate-600 font-medium pointer-events-none">
                    Tap map or drag pin to adjust
                  </span>
                </div>

                {/* Address Input Field */}
                <div>
                  <label htmlFor="report-address" className="block text-xs font-semibold text-slate-600 mb-1">
                    Address / Landmark Description *
                  </label>
                  <input
                    id="report-address"
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                    }}
                    className={`w-full min-h-[44px] px-3 py-2 text-sm rounded-xl border bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden ${
                      errors.address ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                    }`}
                    placeholder="e.g. Near Bus Stand, 5th Avenue"
                    aria-invalid={errors.address ? 'true' : 'false'}
                    aria-describedby={errors.address ? 'address-error' : undefined}
                  />
                  {errors.address && (
                    <p id="address-error" className="text-xs text-red-600 mt-1 font-medium" role="alert">
                      {errors.address}
                    </p>
                  )}
                </div>
              </fieldset>

              {/* Waste Type & Severity Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="report-type" className="block text-xs font-semibold text-slate-600 mb-1">
                    Waste Category
                  </label>
                  <select
                    id="report-type"
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="plastic">Plastic / Dry Packaging</option>
                    <option value="organic">Organic / Food Waste</option>
                    <option value="electronic">E-Waste / Batteries</option>
                    <option value="hazardous">Hazardous Chemical / Medical</option>
                    <option value="glass_metal">Glass & Metal Cans</option>
                    <option value="mixed_debris">Mixed Street Debris</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="report-severity" className="block text-xs font-semibold text-slate-600 mb-1">
                    Urgency / Severity
                  </label>
                  <select
                    id="report-severity"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="low">Low - Minor Litter</option>
                    <option value="medium">Medium - Overflowing Bin</option>
                    <option value="high">High - Large Illegal Dump</option>
                    <option value="urgent">Urgent - Road Hazard</option>
                  </select>
                </div>
              </div>

              {/* Notes Field */}
              <div>
                <label htmlFor="report-notes" className="block text-xs font-semibold text-slate-600 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="report-notes"
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Access code needed or blocked pathway..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-transform active:scale-95 focus:ring-2 focus:ring-emerald-500"
                >
                  <Award className="w-4 h-4" aria-hidden="true" />
                  <span>Submit & Earn +20 Pts</span>
                </button>
              </div>

            </form>
          )}

          {/* Submitting State (Prevents duplicate submissions) */}
          {step === 'submitting' && (
            <div className="py-12 px-4 text-center space-y-4" role="status" aria-label="Uploading report">
              <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto" aria-hidden="true" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Submitting Waste Report</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Uploading compressed photo, confirming GPS coordinates, and registering with municipal route optimizer...
                </p>
              </div>
            </div>
          )}

          {/* Success Confirmation Modal */}
          {step === 'success' && (
            <div className="py-6 px-2 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">Report Successfully Submitted!</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Report <strong className="text-slate-900">#{submittedReport?.report?.id || 'NEW'}</strong> has been registered.
                </p>
              </div>

              {/* Points Awarded Banner */}
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 text-emerald-900 max-w-sm mx-auto">
                <div className="flex items-center justify-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                  <span className="font-extrabold text-sm">+20 Reward Points Added</span>
                </div>
                <p className="text-xs text-emerald-700 mt-1">
                  Your new balance: <strong>{submittedReport?.new_reward_points || 160} pts</strong>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] w-full max-w-xs px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
                >
                  Done & Back to Dashboard
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
