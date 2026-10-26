import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Truck,
  Sparkles,
  Camera,
  Edit2,
  Check,
  RefreshCw,
  AlertCircle,
  Award,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { api, compressImageFile } from '../services/api';

export default function ProfileModal({ isOpen, onClose, currentUser, onUserUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');
  const [address, setAddress] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  const fileInputRef = useRef(null);

  // Synchronize state when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || currentUser.full_name || currentUser.username || '');
      setEmail(currentUser.email || '');
      setMobile(currentUser.mobile || currentUser.phone || '');
      setAge(currentUser.age !== undefined && currentUser.age !== null ? currentUser.age : '');
      setGender(currentUser.gender || 'prefer_not_to_say');
      setAddress(currentUser.address || '');
      setPhotoPreview(currentUser.profile_photo || currentUser.photo || '');
      setIsEditing(false);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const role = currentUser?.role || 'citizen';

  // Handle Photo File selection & compression
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress image client side for snappy mobile performance
      const compressed = await compressImageFile(file, 600, 0.85);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setPhotoPreview(uploadEvent.target.result);
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error('Photo read error:', err);
      setErrorMsg('Failed to process image.');
    }
  };

  // Handle Save Profile Changes
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid email address is mandatory.');
      return;
    }
    if (!mobile.trim()) {
      setErrorMsg('Mobile number is mandatory.');
      return;
    }

    setSaveLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.updateProfile({
        full_name: name.trim(),
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        phone: mobile.trim(),
        age: age ? parseInt(age, 10) : null,
        gender,
        address: address.trim(),
        profile_photo: photoPreview
      });

      setSuccessMsg('Profile updated successfully!');
      if (onUserUpdated && res.user) {
        onUserUpdated(res.user);
      }
      setTimeout(() => {
        setSuccessMsg(null);
        setIsEditing(false);
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Header Ribbon */}
        <div className={`p-4 sm:p-6 text-white relative ${
          role === 'admin'
            ? 'bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900'
            : role === 'worker'
            ? 'bg-gradient-to-r from-blue-700 via-cyan-800 to-blue-900'
            : 'bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:ring-2 focus:ring-white"
            aria-label="Close profile modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            {/* Profile Avatar / Photo */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white/40 shadow-xl overflow-hidden bg-white/20 flex items-center justify-center text-white">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={`${name}'s Profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black uppercase">
                    {name ? name.charAt(0) : 'U'}
                  </span>
                )}
              </div>

              {/* Photo Change Trigger (Always available in edit mode, or on hover) */}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg border-2 border-white focus:ring-2 focus:ring-emerald-400"
                  title="Upload profile photo"
                  aria-label="Upload profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            {/* Profile Header Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  role === 'admin'
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-300/30'
                    : role === 'worker'
                    ? 'bg-blue-300/20 text-blue-100 border border-blue-300/30'
                    : 'bg-emerald-300/20 text-emerald-100 border border-emerald-300/30'
                }`}>
                  {role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : role === 'worker' ? <Truck className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{role === 'admin' ? 'Superuser Admin' : role === 'worker' ? 'Driver Worker' : 'Citizen Member'}</span>
                </span>
                
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  <span>Approved</span>
                </span>
              </div>

              <h2 id="profile-modal-title" className="text-xl sm:text-2xl font-black truncate text-white">
                {name || currentUser?.username}
              </h2>
              <p className="text-xs text-white/80 font-mono truncate">
                @{currentUser?.username}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Success / Error Banners */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center gap-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2" role="status">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW MODE */}
          {!isEditing ? (
            <div className="space-y-4">
              
              {/* Contact Information Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold uppercase">Mobile Number</span>
                      <span className="font-bold text-slate-800">{mobile || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold uppercase">Email Address</span>
                      <span className="font-bold text-slate-800 truncate block max-w-[200px]">{email || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/60 text-sm">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Residential / Work Address</span>
                    <span className="font-medium text-slate-700">{address || 'No address specified'}</span>
                  </div>
                </div>
              </div>

              {/* Personal Details Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Personal Details
                </h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Age</span>
                    <span className="font-bold text-slate-800">{age ? `${age} years` : 'Not specified'}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">Gender</span>
                    <span className="font-bold text-slate-800 capitalize">
                      {gender ? gender.replace('_', ' ') : 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role-Specific Stats Pill Card */}
              {role === 'citizen' && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block">Available EcoRewards</span>
                      <span className="text-sm text-emerald-700 font-medium">Earn +20 pts for each verified report</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-900 block leading-tight">
                      {currentUser?.points || 0}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase">Points</span>
                  </div>
                </div>
              )}

              {role === 'worker' && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-950 block">Sanitation Driver Unit</span>
                      <span className="text-sm text-blue-700 font-medium">Assigned to Sector Morning Collection</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                    Active Driver
                  </span>
                </div>
              )}

              {role === 'admin' && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center shadow-md">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-indigo-950 block">Municipal Control System</span>
                      <span className="text-sm text-indigo-700 font-medium">Full Superuser Administrative Authority</span>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    ★ Superuser
                  </span>
                </div>
              )}

            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSave} className="space-y-3.5">
              
              {/* Photo Upload Notice */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <Camera className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-950 block">Upload Profile Photo</span>
                  <span className="text-emerald-700">Tap the camera icon on the avatar above to pick or take a photo.</span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your full name"
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Email & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500 font-bold">* (Mandatory)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number <span className="text-red-500 font-bold">* (Mandatory)</span>
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    placeholder="e.g. +91 98470 12345"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 28"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House/Flat No, Street, City"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

            </form>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="min-h-[44px] px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={saveLoading}
                onClick={() => {
                  setIsEditing(false);
                  setErrorMsg(null);
                }}
                className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saveLoading}
                onClick={handleSave}
                className="min-h-[44px] px-5 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 rounded-xl shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saveLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}