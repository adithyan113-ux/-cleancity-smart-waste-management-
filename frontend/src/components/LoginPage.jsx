import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Truck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Camera,
  MapPin,
  Check,
  Clock,
  Phone,
  Home,
  FileText,
  BadgeCheck,
  ArrowLeft
} from 'lucide-react';
import { api, compressImageFile } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  // Mode: 'login' | 'register-citizen' | 'register-worker'
  const [mode, setMode] = useState('login');
  
  // Login credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [address, setAddress] = useState('');
  const [idDetails, setIdDetails] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [pendingApprovalMsg, setPendingApprovalMsg] = useState(null);

  // Handle Photo selection & compression
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 600, 0.85);
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        setPhotoPreview(uploadEvt.target.result);
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process image');
    }
  };

  // Reset registration form
  const resetForm = () => {
    setFullName('');
    setEmail('');
    setMobile('');
    setAge('');
    setGender('male');
    setAddress('');
    setIdDetails('');
    setPhotoPreview('');
    setRegUsername('');
    setRegPassword('');
    setErrorMsg(null);
  };

  // Unified Sign In Submit
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username (or email) and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setPendingApprovalMsg(null);

    try {
      const res = await api.login(username.trim(), password.trim());
      setSuccessMsg({
        name: res.user.name,
        role: res.role,
        redirectTab: res.redirect_tab
      });
      setTimeout(() => {
        onLoginSuccess(res.user, res.redirect_tab);
      }, 700);
    } catch (err) {
      const msg = err.message || 'Login failed. Please verify your credentials.';
      if (msg.toLowerCase().includes('pending administrator approval')) {
        setPendingApprovalMsg(msg);
      } else {
        setErrorMsg(msg);
      }
      setLoading(false);
    }
  };

  // Registration Submit (Citizen or Worker)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const isWorker = mode === 'register-worker';

    if (!fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid Email Address is mandatory.');
      return;
    }
    if (!mobile.trim()) {
      setErrorMsg('Mobile Number is mandatory.');
      return;
    }
    if (isWorker && !idDetails.trim()) {
      setErrorMsg('ID details (Driver License / Employee ID number) are required for sanitation workers.');
      return;
    }
    if (!regUsername.trim() || !regPassword.trim()) {
      setErrorMsg('Please choose both a username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setPendingApprovalMsg(null);

    try {
      await api.register({
        username: regUsername.trim(),
        password: regPassword.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        full_name: fullName.trim(),
        age: age ? parseInt(age, 10) : null,
        gender,
        address: address.trim(),
        id_details: idDetails.trim(),
        profile_photo: photoPreview,
        role: isWorker ? 'worker' : 'citizen'
      });

      // Clear & switch to login with approval message
      setPendingApprovalMsg(
        isWorker
          ? `Sanitation Worker registration submitted for ${fullName.trim()}! Your account is now pending Municipal Administrator approval before you can log in.`
          : `Citizen registration submitted for ${fullName.trim()}! Your account has been submitted for administrator review.`
      );
      setUsername(regUsername.trim());
      setPassword('');
      resetForm();
      setMode('login');
      setLoading(false);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 flex flex-col justify-center items-center p-3 sm:p-6 text-slate-100 relative overflow-hidden">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md sm:max-w-xl z-10 space-y-4 my-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/30 mb-1 border border-emerald-300/30 animate-in zoom-in-90 duration-300">
            <Sparkles className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Clean<span className="text-emerald-400">City</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/80 font-medium max-w-sm mx-auto mt-0.5">
              AI-Powered Smart Waste Management & Dynamic Collection System
            </p>
          </div>
        </div>

        {/* Main Glassmorphic Card Container */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:p-7 shadow-2xl border border-white/20 text-slate-800 space-y-4">
          
          {/* Top Mode Header / Tabs */}
          {mode === 'login' ? (
            <div className="text-center pb-2 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">Sign In to Your Account</h2>
              <p className="text-xs text-slate-500 mt-0.5">Single unified login for Citizens, Sanitation Workers, and Admin</p>
            </div>
          ) : mode === 'register-worker' ? (
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">Worker Registration</h2>
                  <p className="text-[11px] text-blue-700 font-semibold">Sanitation Driver Fleet Application</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 p-1 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" /> Sign In
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">Citizen Registration</h2>
                  <p className="text-[11px] text-emerald-700 font-semibold">EcoRewards & Waste Reporting Member</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 p-1 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" /> Sign In
              </button>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMsg && (
            <div
              className="p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Pending Approval Notice Banner */}
          {pendingApprovalMsg && (
            <div
              className="p-4 bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-2xl text-xs sm:text-sm space-y-2 animate-in fade-in duration-200 shadow-sm"
              role="status"
            >
              <div className="flex items-start gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-extrabold text-amber-950 text-sm">Account Pending Approval</h3>
                  <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                    {pendingApprovalMsg}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-amber-700 font-medium">
                The Municipal Administrator reviews new registrations before permitting login. Please wait for approval.
              </p>
            </div>
          )}

          {/* Welcome Toast Banner */}
          {successMsg && (
            <div
              className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs sm:text-sm flex items-center gap-3 animate-in fade-in duration-200"
              role="status"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  Welcome, {successMsg.name}!
                </p>
                <p className="text-emerald-700 font-semibold text-[11px] sm:text-xs">
                  {successMsg.role === 'citizen' && 'Redirecting to Citizen Dashboard...'}
                  {successMsg.role === 'worker' && 'Redirecting to Sanitation Driver Route...'}
                  {successMsg.role === 'admin' && 'Redirecting to Municipal Admin Portal...'}
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 1: SIGN IN FORM                                           */}
          {/* ============================================================== */}
          {mode === 'login' && !successMsg && (
            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username or email"
                    required
                    autoComplete="username"
                    className="w-full min-h-[46px] pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full min-h-[46px] pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-hidden"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember checkbox */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Stay logged in</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>

              {/* Registration Links Section */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-center text-xs">
                
                {/* Citizen Registration Link */}
                <div className="text-slate-600">
                  New resident in town?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register-citizen'); setErrorMsg(null); }}
                    className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                  >
                    Create Citizen Account
                  </button>
                </div>

                {/* HIGHLIGHTED DEDICATED WORKER REGISTRATION LINK */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => { setMode('register-worker'); setErrorMsg(null); }}
                    className="w-full min-h-[44px] px-4 py-2 rounded-xl border-2 border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-900 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Sanitation Driver? Register as Worker →</span>
                  </button>
                </div>

              </div>

            </form>
          )}

          {/* ============================================================== */}
          {/* VIEW 2: DEDICATED WORKER REGISTRATION FORM                    */}
          {/* ============================================================== */}
          {mode === 'register-worker' && !successMsg && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500 font-extrabold">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dave Miller"
                  required
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Mobile (Mandatory) & Email (Mandatory) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number <span className="text-red-500 font-extrabold">* (Mandatory)</span>
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. +91 94462 87654"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500 font-extrabold">* (Mandatory)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="driver@cleancity.gov"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                    min="18"
                    max="75"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 35"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Residential / Depot Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Residential / Depot Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Quarter / Street address, Zone, City"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              {/* ID Details (Driving License / Employee ID proof) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  ID Details <span className="text-red-500 font-extrabold">* (License / Employee ID / Gov ID)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={idDetails}
                    onChange={(e) => setIdDetails(e.target.value)}
                    placeholder="e.g. Commercial DL #DL-KL07-2023-89912 or Govt ID"
                    required
                    className="w-full min-h-[44px] pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Worker Profile Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Worker Photograph
                </label>
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 flex items-center justify-center text-slate-400 shrink-0 border border-slate-300">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Worker photo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handlePhotoUpload}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Capture with phone camera or upload from gallery</p>
                  </div>
                </div>
              </div>

              {/* Account Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Choose Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="driver_dave"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Create Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Strong password"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Admin Approval Notice */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  <strong>Municipal Approval Required:</strong> Your driver profile and ID details will be reviewed by the Municipal Administrator. Once approved, you can log in to view stops.
                </span>
              </div>

              {/* Submit Worker Application */}
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-800 hover:to-cyan-800 shadow-md shadow-blue-700/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4" />
                    <span>Submit Worker Application for Approval</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(null); }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  ← Already registered? Back to Sign In
                </button>
              </div>

            </form>
          )}

          {/* ============================================================== */}
          {/* VIEW 3: CITIZEN REGISTRATION FORM                              */}
          {/* ============================================================== */}
          {mode === 'register-citizen' && !successMsg && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500 font-extrabold">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  required
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number <span className="text-red-500 font-extrabold">* (Mandatory)</span>
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. +91 98470 12345"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500 font-extrabold">* (Mandatory)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

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
                    placeholder="e.g. 26"
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

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Residential Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House / Flat No, Street, Landmark, City"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Profile Photo (Optional)
                </label>
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 flex items-center justify-center text-slate-400 shrink-0 border border-slate-300">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handlePhotoUpload}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Camera or gallery upload</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Choose Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="maya_lin"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Create Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Strong password"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Create Citizen Account</span>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(null); }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  ← Back to Sign In
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400">
          CleanCity v2.4 • Role-Based Protected Endpoints • Progressive Web App
        </p>

      </div>
    </div>
  );
}