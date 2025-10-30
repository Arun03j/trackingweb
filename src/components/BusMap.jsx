// Map component for displaying buses and live driver locations
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { listenToDriverLocations } from '../lib/locationService.js';
import { Button } from './ui/button';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bus icon for static bus data
const createBusIcon = (status = 'active') => {
  const color = status === 'active' ? '#2563eb' : '#6b7280';
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13]
  });
};

// Custom driver icon for live driver locations
const createDriverIcon = (isActive = true) => {
  const color = isActive ? '#16a34a' : '#dc2626';
  return L.divIcon({
    className: 'custom-driver-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
        "></div>
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background-color: #fbbf24;
          border-radius: 50%;
          border: 1px solid white;
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Component to handle map updates
const MapUpdater = ({ buses, selectedBus, onBusSelect, driverLocations, selectedDriver, onDriverSelect }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedBus && selectedBus.latitude && selectedBus.longitude) {
      map.setView([selectedBus.latitude, selectedBus.longitude], 15);
    }
  }, [selectedBus, map]);

  useEffect(() => {
    if (selectedDriver && selectedDriver.latitude && selectedDriver.longitude) {
      map.setView([selectedDriver.latitude, selectedDriver.longitude], 15);
    }
  }, [selectedDriver, map]);

  return null;
};

const BusMap = ({
  buses = [],
  selectedBus,
  onBusSelect,
  selectedDriver,
  onDriverSelect,
  className = ""
}) => {
  const [driverLocations, setDriverLocations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef();

  // Listen to live driver locations
  useEffect(() => {
    const unsubscribe = listenToDriverLocations((drivers) => {
      setDriverLocations(drivers);
    });

    return () => unsubscribe();
  }, []);

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const formatSpeed = (speed) => {
    if (!speed || speed === 0) return 'Stationary';
    return `${Math.round(speed * 3.6)} km/h`;
  };

  const formatAccuracy = (accuracy) => {
    if (!accuracy) return 'Unknown';
    return accuracy < 1000 ? `${Math.round(accuracy)}m` : `${(accuracy / 1000).toFixed(1)}km`;
  };

  const handleLocateUser = () => {
    setIsLocating(true);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });

        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
        }

        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to retrieve your location. ';

        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
        }

        alert(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Default center (New York City)
  const defaultCenter = [40.7128, -74.0060];
  
  // Calculate center based on available data
  const getMapCenter = () => {
    const allLocations = [
      ...buses.filter(bus => bus.latitude && bus.longitude),
      ...driverLocations.filter(driver => driver.latitude && driver.longitude)
    ];
    
    if (allLocations.length === 0) return defaultCenter;
    
    const avgLat = allLocations.reduce((sum, loc) => sum + loc.latitude, 0) / allLocations.length;
    const avgLng = allLocations.reduce((sum, loc) => sum + loc.longitude, 0) / allLocations.length;
    
    return [avgLat, avgLng];
  };

  const createUserIcon = () => {
    return L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="
          background-color: #3b82f6;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), 0 2px 6px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s ease-in-out infinite;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        </style>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -13]
    });
  };

  return (
    <div className={`h-full w-full relative ${className}`}>
      <MapContainer
        center={getMapCenter()}
        zoom={13}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater 
          buses={buses}
          selectedBus={selectedBus}
          onBusSelect={onBusSelect}
          driverLocations={driverLocations}
          selectedDriver={selectedDriver}
          onDriverSelect={onDriverSelect}
        />

        {/* Static Bus Markers */}
        {buses.map((bus) => {
          if (!bus.latitude || !bus.longitude) return null;
          
          return (
            <Marker
              key={`bus-${bus.id}`}
              position={[bus.latitude, bus.longitude]}
              icon={createBusIcon(bus.status)}
              eventHandlers={{
                click: () => onBusSelect && onBusSelect(bus)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-lg mb-2">{bus.busId}</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Route:</strong> {bus.route}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        bus.status === 'active' ? 'bg-green-100 text-green-800' :
                        bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {bus.status}
                      </span>
                    </p>
                    <p><strong>Speed:</strong> {bus.speed || 0} km/h</p>
                    <p><strong>Last Updated:</strong> {formatLastUpdated(bus.lastUpdated)}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {bus.latitude.toFixed(6)}, {bus.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Live Driver Markers */}
        {driverLocations.map((driver) => {
          if (!driver.latitude || !driver.longitude) return null;
          
          const isRecent = driver.timestamp && 
            (new Date() - new Date(driver.timestamp.seconds * 1000)) < 300000; // 5 minutes
          
          return (
            <Marker
              key={`driver-${driver.id}`}
              position={[driver.latitude, driver.longitude]}
              icon={createDriverIcon(isRecent)}
              eventHandlers={{
                click: () => onDriverSelect && onDriverSelect(driver)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[220px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="font-semibold text-lg">Live Driver</h3>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p><strong>Driver:</strong> {driver.displayName || 'Unknown'}</p>
                    <p><strong>Bus Number:</strong> {driver.busNumber || 'N/A'}</p>
                    <p><strong>Route:</strong> {driver.route || 'N/A'}</p>
                    <p><strong>Speed:</strong> {formatSpeed(driver.speed)}</p>
                    <p><strong>Accuracy:</strong> {formatAccuracy(driver.accuracy)}</p>
                    <p><strong>Last Update:</strong> {formatLastUpdated(driver.timestamp)}</p>
                    
                    <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-xs text-green-800 font-medium">
                        🔴 LIVE TRACKING
                      </p>
                      <p className="text-xs text-green-700">
                        Real-time location from driver's device
                      </p>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {driver.latitude.toFixed(6)}, {driver.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createUserIcon()}
          >
            <Popup>
              <div className="p-2 min-w-[180px]">
                <h3 className="font-semibold text-lg mb-2">Your Location</h3>
                <p className="text-xs text-gray-500">
                  {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <Button
        onClick={handleLocateUser}
        disabled={isLocating}
        className="absolute bottom-4 left-4 z-[1000] shadow-lg rounded-full w-14 h-14 p-0 flex items-center justify-center bg-white hover:bg-gray-100 border-2 border-gray-300"
        variant="outline"
        title="Show my location"
      >
        <Navigation className={`h-6 w-6 ${isLocating ? 'animate-pulse' : ''} text-blue-600`} />
      </Button>
    </div>
  );
};

export default BusMap;

