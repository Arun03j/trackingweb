// Map View - Shows all buses
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import BusMap from './BusMap.jsx';
import { useBusLocations } from '../hooks/useBusData.js';
import { Navigation, Loader2 } from 'lucide-react';
import { getCurrentPosition } from '../lib/locationService.js';
import { toast } from 'sonner';

const MapView = ({ 
  selectedBus: initialSelectedBus,
  onBusSelect: onBusSelectProp 
}) => {
  const { buses, loading, connected, refreshData } = useBusLocations();
  const [selectedBus, setSelectedBus] = useState(initialSelectedBus);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationAttempts, setLocationAttempts] = useState(0);

  // Update selected bus when props change
  useEffect(() => {
    if (initialSelectedBus) {
      setSelectedBus(initialSelectedBus);
    }
  }, [initialSelectedBus]);

  const handleBusSelect = (bus) => {
    setSelectedBus(bus);
    if (onBusSelectProp) onBusSelectProp(bus);
  };

  // Demo location function
  const useDemoLocation = () => {
    const demoPos = {
      latitude: 40.7589, // Times Square, NYC
      longitude: -73.9851
    };
    setUserLocation(demoPos);
    toast.success('📍 Using demo location (Times Square, NYC)\n\nThis is just for testing the feature!', {
      duration: 5000,
    });
  };

  // Long press handler for demo mode
  const [pressTimer, setPressTimer] = useState(null);
  
  const handleButtonPress = () => {
    const timer = setTimeout(() => {
      useDemoLocation();
      setLoadingLocation(false);
    }, 2000);
    setPressTimer(timer);
  };

  const handleButtonRelease = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  // Handle centering map on user's current location
  const handleCenterOnUserLocation = async () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    setLocationAttempts(prev => prev + 1);
    
    // After 2 failed attempts, offer demo location
    if (locationAttempts >= 2) {
      const useDemoLocation = window.confirm(
        'Location services are having trouble. Would you like to use a demo location (New York City) to test the feature?'
      );
      
      if (useDemoLocation) {
        const demoPos = {
          latitude: 40.7589, // Times Square, NYC
          longitude: -73.9851
        };
        setUserLocation(demoPos);
        toast.success('📍 Using demo location (Times Square, NYC)');
        setLoadingLocation(false);
        return;
      }
    }
    
    // Try multiple strategies
    try {
      console.log('🔍 Attempt', locationAttempts + 1, '- Trying to get location...');
      console.log('Browser:', navigator.userAgent);
      console.log('Protocol:', window.location.protocol);
      
      // Strategy 1: Try with cached position first (fastest)
      let position;
      try {
        position = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => reject(new Error('Strategy 1 timeout')), 5000);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeoutId);
              resolve(pos);
            },
            (err) => {
              clearTimeout(timeoutId);
              reject(err);
            },
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 10 * 60 * 1000 // Accept 10 minute old position
            }
          );
        });
        console.log('✅ Strategy 1 (cached) succeeded');
      } catch (err1) {
        console.log('⚠️ Strategy 1 failed:', err1.message);
        
        // Strategy 2: Try with longer timeout and no accuracy requirement
        try {
          position = await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => reject(new Error('Strategy 2 timeout')), 15000);
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                clearTimeout(timeoutId);
                resolve(pos);
              },
              (err) => {
                clearTimeout(timeoutId);
                reject(err);
              },
              {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 0
              }
            );
          });
          console.log('✅ Strategy 2 (fresh) succeeded');
        } catch (err2) {
          console.log('⚠️ Strategy 2 failed:', err2.message);
          
          // Strategy 3: Try watchPosition (sometimes works when getCurrentPosition doesn't)
          position = await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              navigator.geolocation.clearWatch(watchId);
              reject(new Error('Strategy 3 timeout'));
            }, 10000);
            
            const watchId = navigator.geolocation.watchPosition(
              (pos) => {
                clearTimeout(timeoutId);
                navigator.geolocation.clearWatch(watchId);
                resolve(pos);
              },
              (err) => {
                clearTimeout(timeoutId);
                navigator.geolocation.clearWatch(watchId);
                reject(err);
              },
              {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000
              }
            );
          });
          console.log('✅ Strategy 3 (watch) succeeded');
        }
      }
      
      console.log('✅ Location obtained:', position.coords);
      console.log('   Accuracy:', position.coords.accuracy, 'meters');
      
      const userPos = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      
      setUserLocation(userPos);
      setLocationAttempts(0); // Reset attempts on success
      toast.success(`📍 Location found!\n${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}\nAccuracy: ${Math.round(position.coords.accuracy)}m`);
      
    } catch (error) {
      console.error('❌ All location strategies failed');
      console.error('Final error:', error);
      if (error.code) {
        console.error('Error code:', error.code);
      }
      
      // Detailed error message
      let errorMessage = 'Could not get your location';
      
      if (error.code === 1) { // PERMISSION_DENIED
        errorMessage = '🔒 Location permission denied.\n\nPlease:\n1. Click the location icon in the address bar\n2. Select "Allow" for location access\n3. Refresh the page\n4. Try again';
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        errorMessage = '📡 Location unavailable.\n\nPlease check:\n✓ WiFi is ON (needed for location on Mac)\n✓ Location Services enabled in System Settings\n✓ Browser has location permission\n\nTry clicking the button again for a demo location.';
      } else if (error.code === 3) { // TIMEOUT
        errorMessage = '⏱️ Location request timed out.\n\nYour device is taking too long to get a GPS fix.\nTry clicking again for a demo location.';
      } else {
        errorMessage = `Location error: ${error.message || 'Unknown error'}\n\nClick again to try with a demo location.`;
      }
      
      toast.error(errorMessage, {
        duration: 8000,
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <div className="h-full w-full relative" style={{ height: '100%', minHeight: '100%' }}>
      {/* Map */}
      <BusMap
        buses={buses}
        selectedBus={selectedBus}
        onBusSelect={handleBusSelect}
        userLocation={userLocation}
        className="h-full w-full absolute inset-0"
      />

      {/* Live Location Button */}
      <button
        onClick={handleCenterOnUserLocation}
        onMouseDown={handleButtonPress}
        onMouseUp={handleButtonRelease}
        onMouseLeave={handleButtonRelease}
        onTouchStart={handleButtonPress}
        onTouchEnd={handleButtonRelease}
        disabled={loadingLocation}
        className="absolute bottom-24 right-4 z-[1000] h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        title="Click: Get your location | Hold 2s: Use demo location (Times Square, NYC)"
      >
        {loadingLocation ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Navigation className="h-6 w-6" />
        )}
      </button>

      {/* Info Panel for selected items */}
      {selectedBus && (
        <div className="absolute bottom-20 left-4 right-20 z-[500] bg-white rounded-lg shadow-lg p-4 max-h-[30vh] overflow-y-auto">
          {selectedBus && (
            <div>
              <h3 className="font-semibold text-base mb-2">{selectedBus.busId}</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Route:</strong> {selectedBus.route}</p>
                <p><strong>Status:</strong> {selectedBus.status}</p>
                <p><strong>Speed:</strong> {selectedBus.speed || 0} km/h</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => {
              setSelectedBus(null);
            }}
          >
            ×
          </Button>
        </div>
      )}
    </div>
  );
};

export default MapView;
