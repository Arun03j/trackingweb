import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Menu, X } from 'lucide-react';
import BusMap from './components/BusMap.jsx';
import BusSidebar from './components/BusSidebar.jsx';
import AuthPage from './components/AuthPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import UserProfile from './components/UserProfile.jsx';
import DriverVerificationForm from './components/DriverVerificationForm.jsx';
import AdminUserVerificationPanel from './components/AdminUserVerificationPanel.jsx';
import DriverLocationControl from './components/DriverLocationControl.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import useUserRole from './hooks/useUserRole.js';
import { useBusLocations } from './hooks/useBusData.js';
import './App.css';

// Main App Content Component
const AppContent = () => {
  const { user } = useAuth();
  const { userProfile, isDriver, isStudent, isAdmin, isPending, isVerified } = useUserRole();
  const { buses, loading, connected, refreshData } = useBusLocations();
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-open sidebar on desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleBusSelect = (bus) => {
    setSelectedBus(bus);
    setSelectedDriver(null); // Clear driver selection
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
    setSelectedBus(null); // Clear bus selection
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Demo data for buses (fallback)
  const demoData = [
    {
      id: 'bus-001',
      busId: 'B001',
      latitude: 40.7614,
      longitude: -73.9776,
      route: 'Route 1',
      status: 'active',
      speed: 25,
      heading: 90,
      lastUpdated: { seconds: Date.now() / 1000 - 120 }
    },
    {
      id: 'bus-002',
      busId: 'B002',
      latitude: 40.7589,
      longitude: -73.9851,
      route: 'Route 2',
      status: 'active',
      speed: 18,
      heading: 180,
      lastUpdated: { seconds: Date.now() / 1000 - 300 }
    },
    {
      id: 'bus-003',
      busId: 'B003',
      latitude: 40.7505,
      longitude: -73.9934,
      route: 'Route 3',
      status: 'maintenance',
      speed: 0,
      heading: 0,
      lastUpdated: { seconds: Date.now() / 1000 - 1800 }
    }
  ];

  // Use demo data if no real data is available
  const displayBuses = buses.length > 0 ? buses : demoData;

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

  // Show admin panel
  if (isAdmin && showAdminPanel) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setShowAdminPanel(false)}
            >
              ← Back to Map
            </Button>
          </div>
          <AdminUserVerificationPanel onClose={() => setShowAdminPanel(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 right-4 z-[1001] bg-white shadow-lg"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-[1000]' : 'relative'} 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-transform duration-300 ease-in-out
        ${isMobile ? 'w-80' : 'w-80'}
        bg-background border-r shadow-lg flex flex-col
      `}>
        {/* User Profile Section - Moved to left side below title */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Bus Tracker</h1>
          </div>
          
          {/* User Profile positioned below title */}
          <div className="mb-3">
            <UserProfile compact />
          </div>

          {/* Role-based Action Buttons */}
          <div className="space-y-2">
            {isDriver && isPending && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowVerificationForm(true)}
              >
                Complete Driver Verification
              </Button>
            )}
            
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowAdminPanel(true)}
              >
                Manage User Verifications
              </Button>
            )}
          </div>
        </div>

        {/* Driver Location Control for verified drivers */}
        {isDriver && isVerified && (
          <div className="p-4 border-b">
            <DriverLocationControl />
          </div>
        )}

        {/* Bus/Driver List */}
        <div className="flex-1 overflow-hidden">
          <BusSidebar
            buses={displayBuses}
            selectedBus={selectedBus}
            onBusSelect={handleBusSelect}
            selectedDriver={selectedDriver}
            onDriverSelect={handleDriverSelect}
            loading={loading}
            connected={connected}
            onRefresh={refreshData}
          />
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[999]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 relative">
        <BusMap
          buses={displayBuses}
          selectedBus={selectedBus}
          onBusSelect={handleBusSelect}
          selectedDriver={selectedDriver}
          onDriverSelect={handleDriverSelect}
          className="h-full"
        />
        
        {/* Info Panel for selected items */}
        {(selectedBus || selectedDriver) && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-[500]">
            {selectedBus && (
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedBus.busId}</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Route:</strong> {selectedBus.route}</p>
                  <p><strong>Status:</strong> {selectedBus.status}</p>
                  <p><strong>Speed:</strong> {selectedBus.speed || 0} km/h</p>
                </div>
              </div>
            )}
            
            {selectedDriver && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <h3 className="font-semibold text-lg">Live Driver</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <p><strong>Driver:</strong> {selectedDriver.displayName}</p>
                  <p><strong>Bus:</strong> {selectedDriver.busNumber}</p>
                  <p><strong>Route:</strong> {selectedDriver.route}</p>
                  <p><strong>Speed:</strong> {Math.round((selectedDriver.speed || 0) * 3.6)} km/h</p>
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={() => {
                setSelectedBus(null);
                setSelectedDriver(null);
              }}
            >
              ×
            </Button>
          </div>
        )}
      </div>
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

