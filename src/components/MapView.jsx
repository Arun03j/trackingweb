// Map View - Shows all buses
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import BusMap from './BusMap.jsx';
import { useBusLocations } from '../hooks/useBusData.js';
import { Navigation, Loader2 } from 'lucide-react';
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
  const [geolocationInvalid, setGeolocationInvalid] = useState(false);

  // Check geolocation availability on mount
  useEffect(() => {
    const checkGeolocation = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLocalhost = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
      const isSecure = window.location.protocol === 'https:';
      const isValidOrigin = isSecure || isLocalhost;
      
      setGeolocationInvalid(!isValidOrigin);
      
      console.log('🔍 MAP VIEW INITIALIZED');
      console.log('📱 Device:', isMobile ? 'MOBILE' : 'DESKTOP');
      console.log('🌍 Geolocation API:', navigator.geolocation ? '✅ Available' : '❌ Not Available');
      console.log('🔒 Secure Context:', window.isSecureContext ? 'Yes' : 'No (OK for localhost)');
      console.log('🌐 Origin:', window.location.origin);
      console.log('✅ Valid for Geolocation:', isValidOrigin ? 'YES' : 'NO - Must use localhost or HTTPS');
      
      if (!isValidOrigin) {
        console.warn('⚠️ GEOLOCATION WILL NOT WORK ON THIS URL');
        console.warn('Current hostname:', window.location.hostname);
        console.warn('Geolocation requires HTTPS or localhost HTTP only');
      }
      
      console.log('📍 Location button ready - click to request permission');
      
      // Check permissions status if available
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(permission => {
          console.log('🔐 Geolocation Permission Status:', permission.state);
        }).catch(err => {
          console.log('ℹ️ Cannot check permission status (normal on some browsers)');
        });
      }
    };
    
    checkGeolocation();
  }, []);

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

  // Simple demo location
  const useDemoLocation = () => {
    const demoPos = {
      latitude: 40.7589,
      longitude: -73.9851
    };
    setUserLocation(demoPos);
    setLoadingLocation(false);
    toast.success('📍 Demo Location: Times Square, NYC\n\nThis is for testing the map feature!', {
      duration: 4000,
    });
  };

  // Main location request handler - SIMPLIFIED FOR MOBILE
  const handleCenterOnUserLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      console.error('❌ navigator.geolocation not available');
      return;
    }

    // CHECK: Geolocation requires HTTPS or localhost HTTP
    const isLocalhost = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
    const isSecure = window.location.protocol === 'https:';
    const isValidOrigin = isSecure || isLocalhost;
    
    if (!isValidOrigin) {
      const ip = window.location.hostname;
      console.error('❌ GEOLOCATION BLOCKED: HTTP on non-localhost IP address');
      console.log('Current origin:', window.location.origin);
      console.log('Hostname:', ip);
      const msg = `🔒 GEOLOCATION REQUIRES HTTPS\n\nYour IP: ${ip}\n\nSolutions:\n1. Use http://localhost:5173 (recommended)\n2. Enable HTTPS with certificate\n3. Use ngrok tunnel`;
      toast.error(msg, { duration: 8000 });
      setLoadingLocation(false);
      return;
    }

    setLoadingLocation(true);
    const attempt = locationAttempts + 1;
    setLocationAttempts(attempt);
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('='.repeat(60));
    console.log('📍 LOCATION REQUEST #' + attempt);
    console.log('='.repeat(60));
    console.log('📱 Device Type:', isMobile ? 'MOBILE 📱' : 'DESKTOP 💻');
    console.log('🌍 Protocol:', window.location.protocol);
    console.log('🏠 Host:', window.location.hostname);
    console.log('📐 Viewport:', window.innerWidth + 'x' + window.innerHeight);
    console.log('🔒 Secure Context:', window.isSecureContext);
    console.log('⏱️ Timestamp:', new Date().toLocaleTimeString());
    console.log('='.repeat(60));
    
    // After 3 failed attempts, offer demo
    if (attempt >= 3) {
      console.warn('⚠️ 3 ATTEMPTS FAILED - SHOWING DEMO OPTION');
      const useDemo = window.confirm('Location unavailable. Test with demo location (Times Square)?');
      if (useDemo) {
        useDemoLocation();
        setLocationAttempts(0);
      } else {
        setLoadingLocation(false);
      }
      return;
    }
    
    // STRATEGY 1: Simple getCurrentPosition with 15 second total timeout
    console.log('🔵 STRATEGY 1: Direct getCurrentPosition (15s timeout)');
    
    try {
      const position = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          console.log('❌ STRATEGY 1: Timeout after 15 seconds');
          reject(new Error('timeout'));
        }, 15000);
        
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            console.log('✅ STRATEGY 1: SUCCESS');
            console.log('   Lat:', pos.coords.latitude);
            console.log('   Lng:', pos.coords.longitude);
            console.log('   Accuracy:', Math.round(pos.coords.accuracy), 'meters');
            resolve(pos);
          },
          (err) => {
            clearTimeout(timeoutId);
            console.log('❌ STRATEGY 1: ERROR');
            console.log('   Code:', err.code, '(1=denied, 2=unavailable, 3=timeout)');
            console.log('   Message:', err.message);
            reject(err);
          },
          {
            enableHighAccuracy: false,
            timeout: 12000,
            maximumAge: 60000
          }
        );
      });
      
      // Success!
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = Math.round(position.coords.accuracy);
      
      setUserLocation({ latitude: lat, longitude: lng });
      setLocationAttempts(0);
      
      console.log('🎉 LOCATION ACQUIRED SUCCESSFULLY');
      toast.success(`📍 Got Location!\n${lat.toFixed(4)}, ${lng.toFixed(4)}\n±${accuracy}m`, { duration: 5000 });
      setLoadingLocation(false);
      return;
      
    } catch (err) {
      console.log('❌ STRATEGY 1 FAILED:', err.code, err.message);
      console.log('');
      console.log('🔵 STRATEGY 2: watchPosition (20s timeout)');
      
      // STRATEGY 2: Use watchPosition as fallback
      try {
        const position = await new Promise((resolve, reject) => {
          let watchId = null;
          const timeoutId = setTimeout(() => {
            if (watchId !== null) {
              navigator.geolocation.clearWatch(watchId);
            }
            console.log('❌ STRATEGY 2: Timeout after 20 seconds');
            reject(new Error('watchTimeout'));
          }, 20000);
          
          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              clearTimeout(timeoutId);
              if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
              }
              console.log('✅ STRATEGY 2: SUCCESS via watchPosition');
              resolve(pos);
            },
            (error) => {
              clearTimeout(timeoutId);
              if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
              }
              console.log('❌ STRATEGY 2: ERROR');
              console.log('   Code:', error.code);
              console.log('   Message:', error.message);
              reject(error);
            },
            {
              enableHighAccuracy: false,
              timeout: 18000,
              maximumAge: isMobile ? 300000 : 60000
            }
          );
        });
        
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);
        
        setUserLocation({ latitude: lat, longitude: lng });
        setLocationAttempts(0);
        
        console.log('🎉 LOCATION ACQUIRED VIA STRATEGY 2');
        toast.success(`📍 Got Location!\n${lat.toFixed(4)}, ${lng.toFixed(4)}\n±${accuracy}m`, { duration: 5000 });
        setLoadingLocation(false);
        return;
        
      } catch (err2) {
        console.log('❌ STRATEGY 2 ALSO FAILED:', err2.code, err2.message);
        
        // Both strategies failed
        let errorMsg = '❌ Location failed';
        
        const firstErr = err;
        if (firstErr.code === 1) {
          errorMsg = '🔒 PERMISSION DENIED\n\n' + (isMobile 
            ? 'Go to Settings → Safari/Chrome → Location → Allow Always'
            : 'Click 🔒 in address bar → Location → Allow');
        } else if (firstErr.code === 2) {
          errorMsg = '📡 UNAVAILABLE\n\n✓ Enable Location Services\n✓ Turn on WiFi/Cellular\n✓ Try outdoors';
        } else if (firstErr.code === 3) {
          errorMsg = '⏱️ TIMEOUT\n\nGPS too slow. Try moving outdoors or waiting.';
        } else {
          errorMsg = '⚠️ Error: ' + (firstErr.message || 'Unknown');
        }
        
        toast.error(errorMsg, { duration: 7000 });
      }
    }
    
    setLoadingLocation(false);
  };

  // Handle centering map on user's current location
  // (handler above)

  return (
    <>
      {/* Geolocation Warning Banner */}
      {geolocationInvalid && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-3 text-center text-sm z-[1000] flex items-center justify-center gap-2">
          <span>⚠️ Geolocation requires localhost or HTTPS</span>
          <span className="text-xs opacity-90">Access via http://localhost:5173 instead</span>
        </div>
      )}
      <div className={geolocationInvalid ? 'pt-14' : ''}>
      <div className="absolute inset-0 w-full h-full" style={{ height: '100%', width: '100%' }}>
        {/* Map */}
        <BusMap
          buses={buses}
          selectedBus={selectedBus}
          onBusSelect={handleBusSelect}
          userLocation={userLocation}
          className="h-full w-full"
        />

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
      
      {/* Live Location Button - Outside absolute container for proper fixed positioning */}
      <div className="location-button-mobile">
        <button
          onClick={handleCenterOnUserLocation}
          disabled={loadingLocation}
          className="h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 relative"
          title={
            /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname) || window.location.protocol === 'https:'
              ? "Click to get your live location"
              : "⚠️ Geolocation requires localhost or HTTPS (see console)"
          }
          aria-label="Get current location"
        >
          {loadingLocation ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Navigation className="h-6 w-6" />
          )}
          {!/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname) && window.location.protocol !== 'https:' && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</div>
          )}
        </button>
      </div>
      </div>
    </>
  );
};

export default MapView;
