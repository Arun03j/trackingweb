import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Toaster } from '@/components/ui/sonner.jsx';
import AuthPage from './components/AuthPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import BottomNav from './components/BottomNav.jsx';
import HomeView from './components/HomeView.jsx';
import MapView from './components/MapView.jsx';
import ProfileView from './components/ProfileView.jsx';
import SettingsView from './components/SettingsView.jsx';
import DriverVerificationForm from './components/DriverVerificationForm.jsx';
import AdminUserVerificationPanel from './components/AdminUserVerificationPanel.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import useUserRole from './hooks/useUserRole.js';
import './App.css';

// Main App Content Component with Bottom Navigation
const AppContent = () => {
  const { user } = useAuth();
  const { userProfile, isDriver, isAdmin, isPending, isVerified } = useUserRole();
  const [activeTab, setActiveTab] = useState('home');
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);

  // Handle bus selection from Home view
  const handleBusSelect = (bus) => {
    setSelectedBus(bus);
    setActiveTab('map');
  };

  // Show verification form for pending drivers
  if (isDriver && isPending && showVerificationForm) {
    return (
      <div className="min-h-screen bg-background p-4">
        <DriverVerificationForm
          onSuccess={() => setShowVerificationForm(false)}
          onCancel={() => setShowVerificationForm(false)}
        />
      </div>
    );
  }

  // Show admin dashboard
  if (isAdmin && showAdminDashboard) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 pb-20">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setShowAdminDashboard(false)}
              className="touch-manipulation min-h-[44px]"
            >
              ← Back
            </Button>
          </div>
          <AdminDashboard />
        </div>
        <BottomNav activeTab="profile" onTabChange={(tab) => {
          if (tab !== 'profile') {
            setShowAdminDashboard(false);
            setActiveTab(tab);
          }
        }} />
      </div>
    );
  }

  // Show admin panel
  if (isAdmin && showAdminPanel) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 pb-20">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setShowAdminPanel(false)}
              className="touch-manipulation min-h-[44px]"
            >
              ← Back
            </Button>
          </div>
          <AdminUserVerificationPanel onClose={() => setShowAdminPanel(false)} />
        </div>
        <BottomNav activeTab="profile" onTabChange={(tab) => {
          if (tab !== 'profile') {
            setShowAdminPanel(false);
            setActiveTab(tab);
          }
        }} />
      </div>
    );
  }

  // Render current view based on active tab
  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeView 
            onBusSelect={handleBusSelect}
          />
        );
      case 'map':
        return (
          <MapView 
            selectedBus={selectedBus}
            onBusSelect={setSelectedBus}
          />
        );
      case 'profile':
        return (
          <ProfileView
            onNavigateToSettings={() => setActiveTab('settings')}
            onNavigateToAdminDashboard={() => setShowAdminDashboard(true)}
            onNavigateToVerifications={() => setShowAdminPanel(true)}
          />
        );
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <HomeView 
            onBusSelect={handleBusSelect}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
};

// Main App Component with Authentication
function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;

