// Map component for displaying buses and live driver locations
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


// Component to handle map updates
const MapUpdater = ({ buses, selectedBus, onBusSelect }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedBus && selectedBus.latitude && selectedBus.longitude) {
      map.setView([selectedBus.latitude, selectedBus.longitude], 15);
    }
  }, [selectedBus, map]);

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
  const mapRef = useRef();

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

      </MapContainer>
    </div>
  );
};

export default BusMap;

