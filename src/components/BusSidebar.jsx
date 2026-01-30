// Sidebar component for displaying buses
import React from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { 
  MapPin, 
  Clock, 
  Route, 
  Zap, 
  RefreshCw, 
  Bus
} from 'lucide-react';
import { formatLastUpdated } from '../lib/busService.js';

const BusSidebar = ({ 
  buses = [], 
  selectedBus = null, 
  onBusSelect = () => {},
  loading = false,
  connected = true,
  onRefresh = () => {}
}) => {

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'maintenance': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="sidebar w-full h-full flex flex-col">
      {/* Header - Mobile Optimized */}
      <div className="p-3 sm:p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg sm:text-xl font-bold">Bus Tracker</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="touch-manipulation min-h-[40px] min-w-[40px] p-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={connected ? 'text-green-700' : 'text-red-700'}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Buses List - Mobile Optimized */}
      <div className="flex-1 mt-3 sm:mt-4">
        <ScrollArea className="h-full px-3 sm:px-4">
          <div className="space-y-2 sm:space-y-3 pb-4">
            {loading && buses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                Loading buses...
              </div>
            ) : buses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bus className="h-8 w-8 mx-auto mb-2" />
                No buses available
              </div>
            ) : (
              buses.map((bus) => (
                <Card
                  key={bus.id}
                  className={`cursor-pointer transition-all hover:shadow-md touch-manipulation active:scale-98 ${
                    selectedBus?.id === bus.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => onBusSelect(bus)}
                >
                  <CardHeader className="pb-2 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg">{bus.busId}</CardTitle>
                      <Badge variant={getStatusBadgeVariant(bus.status)} className="text-xs">
                        {bus.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 p-3 sm:p-4">
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Route className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{bus.route}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span>{bus.speed || 0} km/h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span>{formatLastUpdated(bus.lastUpdated)}</span>
                      </div>
                      {bus.latitude && bus.longitude && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs font-mono truncate">
                            {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default BusSidebar;

