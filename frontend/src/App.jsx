import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import CitizenDashboard from './components/CitizenDashboard';
import RouteMap from './components/RouteMap';
import VouchersCatalog from './components/VouchersCatalog';
import WorkerPortal from './components/WorkerPortal';
import AdminPortal from './components/AdminPortal';
import AdminWorkersPage from './components/AdminWorkersPage';
import AdminCitizensPage from './components/AdminCitizensPage';
import ReportGarbageModal from './components/ReportGarbageModal';
import ProfileModal from './components/ProfileModal';
import AccessibilityControls from './components/AccessibilityControls';
import ViewportTester, { VIEWPORT_PRESETS } from './components/ViewportTester';
import LoginPage from './components/LoginPage';
import { api, getStoredUser, setStoredUser, DEMO_USERS } from './services/api';
import { WifiOff, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(getStoredUser());
  const [points, setPoints] = useState(140);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [viewportPreset, setViewportPreset] = useState(VIEWPORT_PRESETS[0]); // Fluid 100%
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online / offline state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch initial user and reward points when user is logged in
  const refreshUserData = async () => {
    if (!user) return;
    try {
      const summary = await api.getDashboardSummary();
      if (summary?.reward_points !== undefined) {
        setPoints(summary.reward_points);
      }
    } catch (err) {
      console.warn('Initial summary fetch note:', err);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, [user]);

  // Strict Role-Based Tab Guard: ensure user only ever accesses their allowed module tabs
  useEffect(() => {
    if (!user) return;
    const role = user.role || 'citizen';
    if (role === 'citizen') {
      if (!['dashboard', 'map', 'vouchers'].includes(activeTab)) {
        setActiveTab('dashboard');
      }
    } else if (role === 'worker') {
      if (!['worker', 'map'].includes(activeTab)) {
        setActiveTab('worker');
      }
    } else if (role === 'admin') {
      if (!['admin', 'admin-citizens', 'admin-workers', 'map'].includes(activeTab)) {
        setActiveTab('admin');
      }
    }
  }, [user, activeTab]);

  const handleUserChange = (newUser) => {
    setUser(newUser);
    setStoredUser(newUser);
  };

  const handleLoginSuccess = (userObj, redirectTab) => {
    setUser(userObj);
    if (redirectTab) {
      setActiveTab(redirectTab);
    } else {
      setActiveTab(userObj.role === 'worker' ? 'worker' : (userObj.role === 'admin' ? 'admin' : 'dashboard'));
    }
    if (userObj.points !== undefined) {
      setPoints(userObj.points);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  const handleReportSubmitted = (newReportData) => {
    if (newReportData?.new_reward_points !== undefined) {
      setPoints(newReportData.new_reward_points);
    } else {
      setPoints(prev => prev + 20);
    }
  };

  const isSimulatedFrame = viewportPreset.width !== '100%';

  // If user is not logged in, show the attractive unified login page
  if (!user) {
    return (
      <div className={`min-h-screen bg-slate-900 flex flex-col ${isSimulatedFrame ? 'p-2 sm:p-6 items-center' : ''}`}>
        <div className="w-full">
          <ViewportTester
            activePreset={viewportPreset}
            onPresetChange={setViewportPreset}
          />
        </div>
        <div
          className={`w-full transition-all duration-300 relative shadow-2xl ${
            isSimulatedFrame
              ? 'rounded-2xl border-4 border-slate-700 overflow-hidden my-4 max-h-[92vh] overflow-y-auto'
              : ''
          }`}
          style={{
            maxWidth: viewportPreset.width !== '100%' ? viewportPreset.width : undefined,
          }}
        >
          <LoginPage onLoginSuccess={handleLoginSuccess} />
          <AccessibilityControls />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-100 flex flex-col ${isSimulatedFrame ? 'p-2 sm:p-6 items-center' : ''}`}>
      
      {/* Viewport Simulator Toolbar for Testing 320px, 375px, 390px, 768px, 1024px, 1440px */}
      <div className="w-full">
        <ViewportTester
          activePreset={viewportPreset}
          onPresetChange={setViewportPreset}
        />
      </div>

      {/* Main Application Shell (Fluid or constrained to simulated device frame) */}
      <div
        className={`w-full bg-slate-50 min-h-screen flex flex-col transition-all duration-300 relative shadow-xl ${
          isSimulatedFrame
            ? 'rounded-2xl border-4 border-slate-700 overflow-hidden my-4 max-h-[92vh] overflow-y-auto'
            : ''
        }`}
        style={{
          maxWidth: viewportPreset.width !== '100%' ? viewportPreset.width : undefined,
        }}
      >
        
        {/* Offline Banner (Respects Section H: Safe offline feedback) */}
        {!isOnline && (
          <div
            className="bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md"
            role="status"
          >
            <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>You are currently offline. Cached interface is loaded. Report submissions will upload once connection is restored.</span>
          </div>
        )}

        {/* Responsive Navigation Bar */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          points={points}
          user={user}
          onUserChange={handleUserChange}
          onOpenReportModal={() => setReportModalOpen(true)}
          onOpenProfileModal={() => setProfileModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Main Content Area - Strictly Separated Per Module */}
        <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-20 md:pb-8">
          
          {/* MODULE 1: CITIZEN FUNCTIONS (Strictly when user.role === 'citizen') */}
          {user.role === 'citizen' && (
            <>
              {activeTab === 'dashboard' && (
                <CitizenDashboard
                  currentUser={user}
                  onOpenReportModal={() => setReportModalOpen(true)}
                  onOpenProfileModal={() => setProfileModalOpen(true)}
                  onNavigateToRewards={() => setActiveTab('vouchers')}
                  onNavigateToMap={() => setActiveTab('map')}
                />
              )}

              {activeTab === 'map' && (
                <RouteMap currentUser={user} />
              )}

              {activeTab === 'vouchers' && (
                <VouchersCatalog
                  points={points}
                  onPointsUpdated={(newPts) => setPoints(newPts)}
                />
              )}
            </>
          )}

          {/* MODULE 2: WORKER FUNCTIONS (Strictly when user.role === 'worker') */}
          {user.role === 'worker' && (
            <>
              {activeTab === 'worker' && (
                <WorkerPortal
                  currentUser={user}
                  onOpenProfileModal={() => setProfileModalOpen(true)}
                />
              )}

              {activeTab === 'map' && (
                <RouteMap currentUser={user} />
              )}
            </>
          )}

          {/* MODULE 3: ADMIN FUNCTIONS (Strictly when user.role === 'admin') */}
          {user.role === 'admin' && (
            <>
              {activeTab === 'admin' && (
                <AdminPortal
                  currentUser={user}
                  onOpenProfileModal={() => setProfileModalOpen(true)}
                  onNavigateToMap={() => setActiveTab('map')}
                  onNavigateToCitizens={() => setActiveTab('admin-citizens')}
                  onNavigateToWorkers={() => setActiveTab('admin-workers')}
                />
              )}

              {activeTab === 'admin-citizens' && (
                <AdminCitizensPage
                  currentUser={user}
                  onOpenProfileModal={() => setProfileModalOpen(true)}
                  onNavigateToWorkers={() => setActiveTab('admin-workers')}
                  onNavigateToReports={() => setActiveTab('admin')}
                />
              )}

              {activeTab === 'admin-workers' && (
                <AdminWorkersPage
                  currentUser={user}
                  onOpenProfileModal={() => setProfileModalOpen(true)}
                  onNavigateToCitizens={() => setActiveTab('admin-citizens')}
                  onNavigateToReports={() => setActiveTab('admin')}
                />
              )}

              {activeTab === 'map' && (
                <RouteMap currentUser={user} />
              )}
            </>
          )}

        </main>

        {/* Garbage Reporting Modal - Accessible ONLY to Citizens */}
        {user.role === 'citizen' && (
          <ReportGarbageModal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            onReportSubmitted={handleReportSubmitted}
          />
        )}

        {/* Universal Profile View & Edit Modal for All Roles */}
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          currentUser={user}
          onUserUpdated={handleUserChange}
        />

        {/* Accessibility Floating Settings Panel */}
        <AccessibilityControls />

      </div>
    </div>
  );
}
