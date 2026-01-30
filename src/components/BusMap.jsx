// Map component for displaying buses
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

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

// Custom icon for live driver locations
const createLiveDriverIcon = () => {
  return L.divIcon({
    className: 'custom-live-driver-marker',
    html: `
      <div style="position: relative;">
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          background-color: rgba(34, 197, 94, 0.3);
          border-radius: 50%;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        "></div>
        <div style="
          position: relative;
          background-color: #22c55e;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.3);
          }
        }
      </style>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Custom user location icon
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="
        background-color: #3b82f6;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
  });
};

// Component to handle map updates
const MapUpdater = ({ selectedBus, userLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedBus && selectedBus.latitude && selectedBus.longitude) {
      map.setView([selectedBus.latitude, selectedBus.longitude], 15);
    }
  }, [selectedBus, map]);

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 15);
    }
  }, [userLocation, map]);

  return null;
};

const BusMap = ({
  buses = [],
  selectedBus,
  onBusSelect,
  userLocation,
  className = ""
}) => {
  const mapRef = useRef();

  // Debug logging for mobile
  useEffect(() => {
    console.log('🗺️ BusMap mounted');
    console.log('📍 Buses count:', buses.length);
    console.log('📱 Is mobile:', /Mobi|Android/i.test(navigator.userAgent));
    console.log('🌍 User location:', userLocation);
  }, [buses.length, userLocation]);

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

  // Default center (New York City)
  const defaultCenter = [40.7128, -74.0060];
  
  // Calculate center based on available data
  const getMapCenter = () => {
    const allLocations = buses.filter(bus => bus.latitude && bus.longitude);

    if (allLocations.length === 0) return defaultCenter;

    const avgLat = allLocations.reduce((sum, loc) => sum + loc.latitude, 0) / allLocations.length;
    const avgLng = allLocations.reduce((sum, loc) => sum + loc.longitude, 0) / allLocations.length;

    return [avgLat, avgLng];
  };

  return (
    <div className={`h-full w-full relative ${className}`} style={{ height: '100%', minHeight: '100%', position: 'relative' }}>
      <MapContainer
        center={getMapCenter()}
        zoom={13}
        className="h-full w-full"
        style={{ height: '100%', width: '100%', minHeight: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        ref={mapRef}
        zoomControl={false}
        preferCanvas={true}
        touchZoom={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater selectedBus={selectedBus} userLocation={userLocation} />

        {/* Bus and Driver Markers */}
        {buses.map((bus) => {
          if (!bus.latitude || !bus.longitude) return null;
          
          const isLiveDriver = bus.isLiveDriver === true;
          
          return (
            <Marker
              key={`bus-${bus.id}`}
              position={[bus.latitude, bus.longitude]}
              icon={isLiveDriver ? createLiveDriverIcon() : createBusIcon(bus.status)}
              eventHandlers={{
                click: () => onBusSelect && onBusSelect(bus)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-lg mb-2">
                    {isLiveDriver ? '🚗' : '🚌'} {bus.busId}
                    {isLiveDriver && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        LIVE
                      </span>
                    )}
                  </h3>
                  <div className="space-y-1 text-sm">
                    {isLiveDriver && bus.driverName && (
                      <p><strong>Driver:</strong> {bus.driverName}</p>
                    )}
                    <p><strong>Route:</strong> {bus.route}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        isLiveDriver ? 'bg-green-100 text-green-800' :
                        bus.status === 'active' ? 'bg-green-100 text-green-800' :
                        bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {isLiveDriver ? 'Live Tracking' : bus.status}
                      </span>
                    </p>
                    <p><strong>Speed:</strong> {Math.round((bus.speed || 0) * 3.6)} km/h</p>
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

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createUserLocationIcon()}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-base mb-1">📍 Your Location</h3>
                <p className="text-xs text-gray-500">
                  {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

      </MapContainer>
    </div>
  );
};

export default BusMap;

