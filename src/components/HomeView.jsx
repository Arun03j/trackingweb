// Home View - Shows bus details and information
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { 
  Bus, 
  Route, 
  Zap, 
  Clock, 
  MapPin,
  RefreshCw,
  User
} from 'lucide-react';
import { useBusLocations } from '../hooks/useBusData.js';
import { formatLastUpdated } from '../lib/busService.js';
import { useAuth } from '../hooks/useAuth.jsx';
import useUserRole from '../hooks/useUserRole.js';

const HomeView = ({ onBusSelect }) => {
  const { user } = useAuth();
  const { userProfile } = useUserRole();
  const { buses, loading, connected, refreshData } = useBusLocations();

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'maintenance': return 'destructive';
      default: return 'outline';
    }
  };

  const formatSpeed = (speed) => {
    if (!speed || speed === 0) return 'Stationary';
    return `${Math.round(speed * 3.6)} km/h`;
  };

  const isDriverRecent = (timestamp) => {
    if (!timestamp) return false;
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return (new Date() - date) < 300000; // 5 minutes
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Bus Tracker</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {userProfile?.displayName || user?.email?.split('@')[0] || 'User'}!
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="touch-manipulation min-h-[44px] min-w-[44px] p-2"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={connected ? 'text-green-700' : 'text-red-700'}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 p-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{buses.length}</p>
                <p className="text-xs text-muted-foreground">Total Buses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buses List */}
      <div className="flex-1 px-4 pb-28 safe-bottom">
        <ScrollArea className="h-full">
          <div className="space-y-3 pb-4">
            {loading && buses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading buses...</p>
              </div>
            ) : buses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bus className="h-8 w-8 mx-auto mb-2" />
                <p>No buses available</p>
              </div>
            ) : (
              buses.map((bus) => {
                const isLiveDriver = bus.isLiveDriver === true;
                return (
                  <Card 
                    key={bus.id}
                    className={`cursor-pointer hover:shadow-lg transition-shadow active:scale-98 ${
                      isLiveDriver ? 'border-green-300 bg-green-50/50' : ''
                    }`}
                    onClick={() => onBusSelect && onBusSelect(bus)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{bus.busId}</CardTitle>
                          {isLiveDriver && (
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {isLiveDriver && (
                            <Badge className="bg-green-600 text-white text-xs">
                              LIVE
                            </Badge>
                          )}
                          <Badge variant={getStatusBadgeVariant(bus.status)}>
                            {isLiveDriver ? 'Tracking' : bus.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        {isLiveDriver && bus.driverName && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-green-600" />
                            <span className="text-green-700 font-medium">{bus.driverName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Route className="h-4 w-4 text-muted-foreground" />
                          <span>{bus.route}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <span>{Math.round((bus.speed || 0) * 3.6)} km/h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatLastUpdated(bus.lastUpdated)}</span>
                        </div>
                        {bus.latitude && bus.longitude && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-mono">
                              {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default HomeView;
