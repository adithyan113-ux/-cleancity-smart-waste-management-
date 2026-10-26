import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Camera,
  Gift,
  Shield,
  Truck,
  Menu,
  X,
  User,
  Award,
  Sparkles,
  ChevronRight,
  LogOut,
  CheckCircle2,
  ListOrdered,
  FileCheck,
  Users
} from 'lucide-react';
import { getStoredUser } from '../services/api';

export default function Navigation({
  activeTab,
  setActiveTab,
  points,
  user,
  onOpenReportModal,
  onLogout,
  onOpenProfileModal
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = user || getStoredUser() || { role: 'citizen', name: 'Citizen' };
  const role = currentUser.role || 'citizen';

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Strictly Role-Separated Navigation Items
  const roleNavItems = {
    citizen: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'map', label: 'Waste Map', icon: MapPin },
      { id: 'vouchers', label: 'EcoRewards', icon: Gift },
    ],
    worker: [
      { id: 'worker', label: 'Driver Stops', icon: Truck },
      { id: 'map', label: 'Route Map', icon: MapPin },
    ],
    admin: [
      { id: 'admin', label: 'Supervision & Dispatch', icon: Shield },
      { id: 'admin-citizens', label: 'Citizens', icon: Users },
      { id: 'admin-workers', label: 'Workers', icon: Truck },
      { id: 'map', label: 'City Fleet Map', icon: MapPin },
    ],
  };

  const navItems = roleNavItems[role] || roleNavItems.citizen;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  // Header Title & Brand Subtitle per Role
  const roleBranding = {
    citizen: {
      sub: 'Citizen Portal',
      badge: 'Active Member',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    worker: {
      sub: 'Sanitation Driver Console',
      badge: 'Unit 4 • On Duty',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    admin: {
      sub: 'Municipal Command Portal',
      badge: '★ Superuser Admin',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    },
  }[role];

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-700 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Title with Role Subtitle */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleTabClick(role === 'citizen' ? 'dashboard' : role)}
                className="flex items-center gap-2.5 rounded-lg p-1 text-left focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                aria-label={`CleanCity ${roleBranding.sub}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                  role === 'admin'
                    ? 'bg-gradient-to-tr from-slate-900 to-indigo-900 shadow-indigo-900/20'
                    : role === 'worker'
                    ? 'bg-gradient-to-tr from-blue-700 to-cyan-600 shadow-blue-600/20'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20'
                }`}>
                  {role === 'admin' ? (
                    <Shield className="w-5 h-5" aria-hidden="true" />
                  ) : role === 'worker' ? (
                    <Truck className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-lg tracking-tight text-slate-900 block leading-tight">
                    Clean<span className={role === 'admin' ? 'text-indigo-600' : role === 'worker' ? 'text-blue-600' : 'text-emerald-600'}>City</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 block leading-tight">
                    {roleBranding.sub}
                  </span>
                </div>
              </button>
            </div>

            {/* Desktop Navigation Links - Exclusively for Current Role */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Desktop primary navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                      isActive
                        ? role === 'admin'
                          ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 font-bold'
                          : role === 'worker'
                          ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 font-bold'
                          : 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Action Bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Citizen Only: Reward Points Pill */}
              {role === 'citizen' && (
                <div 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-800 text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
                  onClick={() => handleTabClick('vouchers')}
                  title="Your reward points. Click to view vouchers."
                  role="status"
                  aria-label={`${points} reward points available`}
                >
                  <Award className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>{points}</span>
                  <span className="hidden sm:inline font-normal text-emerald-600">pts</span>
                </div>
              )}

              {/* Citizen Only: Report Waste CTA */}
              {role === 'citizen' && (
                <button
                  onClick={onOpenReportModal}
                  className="hidden sm:inline-flex items-center gap-2 min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600"
                  aria-label="Report Garbage with photo and location"
                >
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  <span>Report Waste</span>
                </button>
              )}

              {/* User Profile Pill (Clickable -> Opens Profile View & Edit) */}
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 rounded-xl text-xs transition-all focus:ring-2 focus:ring-emerald-500"
                title="View & Edit your profile"
                aria-label="View and edit profile"
              >
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-[11px] overflow-hidden border border-slate-300">
                  {currentUser.profile_photo || currentUser.photo ? (
                    <img
                      src={currentUser.profile_photo || currentUser.photo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{currentUser.name ? currentUser.name.charAt(0) : 'U'}</span>
                  )}
                </div>
                <div className="text-left">
                  <span className="font-bold text-slate-900 block leading-tight truncate max-w-[130px]">
                    {currentUser.name || currentUser.username}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                    role === 'admin' ? 'text-indigo-700' : role === 'worker' ? 'text-blue-700' : 'text-emerald-700'
                  }`}>
                    {roleBranding.badge}
                  </span>
                </div>
              </button>

              {/* Log Out Button (Desktop) */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="hidden sm:inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors focus:ring-2 focus:ring-red-400"
                  title="Log out and return to unified login page"
                  aria-label="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Log Out</span>
                </button>
              )}

              {/* Mobile Logout Button (1-Tap on small screens) */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="sm:hidden min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 focus:outline-hidden"
                  title="Log Out"
                  aria-label="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation-drawer"
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Slide-in Drawer - Exclusively for Current Role */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label={`${role} Navigation Drawer`}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-5 overflow-y-auto z-10 animate-in slide-in-from-right duration-200">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                    role === 'admin' ? 'bg-indigo-700' : role === 'worker' ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}>
                    {role === 'admin' ? <Shield className="w-4 h-4" /> : role === 'worker' ? <Truck className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">CleanCity</h2>
                    <p className="text-xs text-slate-500 font-semibold">{roleBranding.sub}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:ring-2 focus:ring-emerald-500"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card in Drawer */}
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenProfileModal) onOpenProfileModal();
                }}
                className="my-4 p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                title="Tap to view and edit profile"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-900 font-bold flex items-center justify-center shrink-0 overflow-hidden border border-slate-300">
                    {currentUser.profile_photo || currentUser.photo ? (
                      <img
                        src={currentUser.profile_photo || currentUser.photo}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{currentUser.name ? currentUser.name.charAt(0) : 'U'}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name || currentUser.username}</p>
                    <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border mt-0.5 ${roleBranding.badgeClass}`}>
                      {roleBranding.badge}
                    </span>
                    {role === 'citizen' && (
                      <p className="text-xs text-emerald-700 mt-1 font-bold">{points} Reward Points</p>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 shrink-0">
                  Profile →
                </span>
              </div>

              {/* Citizen Only: Report Garbage Action */}
              {role === 'citizen' && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenReportModal();
                  }}
                  className="w-full min-h-[48px] mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/30 text-sm transition-all focus:ring-2 focus:ring-emerald-500"
                  aria-label="Open Garbage Reporting Camera and Form"
                >
                  <Camera className="w-5 h-5" aria-hidden="true" />
                  <span>+ Report Garbage Now</span>
                </button>
              )}

              {/* Role-Specific Navigation Links */}
              <nav className="space-y-1" aria-label="Mobile Drawer Navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                        isActive
                          ? role === 'admin'
                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                            : role === 'worker'
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" aria-hidden="true" />
                    </button>
                  );
                })}
              </nav>

              {/* Logout Option in Mobile Drawer */}
              {onLogout && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out from Account</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">CleanCity • Role-Isolated Module</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar - Strictly Separated Per Role */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 pb-safe"
        aria-label="Mobile bottom navigation"
      >
        {/* 1. CITIZEN BOTTOM BAR */}
        {role === 'citizen' && (
          <div className="flex items-center justify-around h-16 max-w-md mx-auto relative">
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-colors ${
                activeTab === 'dashboard' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-label="Dashboard"
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-tight">Dashboard</span>
            </button>

            <button
              onClick={() => handleTabClick('map')}
              className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-colors ${
                activeTab === 'map' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-label="Waste Map"
            >
              <MapPin className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-tight">Map</span>
            </button>

            {/* Centered Floating Citizen Camera Action */}
            <div className="relative -top-3 flex justify-center">
              <button
                onClick={onOpenReportModal}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/40 flex flex-col items-center justify-center border-4 border-slate-50 active:scale-95 transition-transform focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                aria-label="Report Garbage"
              >
                <Camera className="w-6 h-6" aria-hidden="true" />
                <span className="sr-only">Report Waste</span>
              </button>
            </div>

            <button
              onClick={() => handleTabClick('vouchers')}
              className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-colors ${
                activeTab === 'vouchers' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-label="Rewards"
            >
              <Gift className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-tight">Rewards</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 text-slate-500 hover:text-slate-800 transition-colors"
              aria-label="More"
            >
              <Menu className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-tight">More</span>
            </button>
          </div>
        )}

        {/* 2. WORKER BOTTOM BAR (Strictly Worker Functions Only) */}
        {role === 'worker' && (
          <div className="flex items-center justify-around h-16 max-w-md mx-auto">
            <button
              onClick={() => handleTabClick('worker')}
              className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-colors ${
                activeTab === 'worker' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-label="Assigned Stops"
            >
              <Truck className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-tight">Driver Stops</span>
            </button>

            <button
              onClick={() => handleTabClick('map')}
              className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-colors ${
                activeTab === 'map' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-label="Route Navigation Map"
            >
              <MapPin className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-tight">Route Map</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 text-slate-500 hover:text-slate-800 transition-colors"
              aria-label="Driver Menu & Logout"
            >
              <Menu className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-tight">Driver Menu</span>
            </button>
          </div>
        )}

        {/* 3. ADMIN BOTTOM BAR (Strictly Admin Supervision Only) */}
        {role === 'admin' && (
          <div className="flex items-center justify-around h-16 max-w-md mx-auto">
            <button
              onClick={() => handleTabClick('admin')}
              className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-colors ${
                activeTab === 'admin' ? 'text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-label="Review Reports"
            >
              <Shield className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-tight">Supervision</span>
            </button>

            <button
              onClick={() => handleTabClick('map')}
              className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-colors ${
                activeTab === 'map' ? 'text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-label="Fleet Routes Map"
            >
              <MapPin className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-tight">Fleet Map</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 text-slate-500 hover:text-slate-800 transition-colors"
              aria-label="Admin Menu & Logout"
            >
              <Menu className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-tight">Admin Menu</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
