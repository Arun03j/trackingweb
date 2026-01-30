// Profile View - Role-based profile display
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  User, 
  Mail, 
  Shield, 
  Car, 
  GraduationCap,
  Clock,
  CheckCircle,
  Settings as SettingsIcon,
  LayoutDashboard,
  MapPin,
  Power,
  Radio
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import useUserRole from '../hooks/useUserRole.js';
import { 
  startLocationSharing, 
  stopLocationSharing, 
  getDriverLocation,
  updateDriverLocation,
  watchPosition 
} from '../lib/locationService.js';
import { toast } from 'sonner';

const ProfileView = ({ onNavigateToSettings, onNavigateToAdminDashboard, onNavigateToVerifications }) => {
  const { user } = useAuth();
  const { userProfile, isDriver, isStudent, isAdmin, isVerified, isPending } = useUserRole();
  
  // Location sharing state for drivers
  const [isSharing, setIsSharing] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Check if driver is already sharing location on mount
  useEffect(() => {
    if (isDriver && user?.uid) {
      checkLocationSharingStatus();
    }
  }, [isDriver, user?.uid]);

  // Check current location sharing status
  const checkLocationSharingStatus = async () => {
    if (!user?.uid) return;
    
    const result = await getDriverLocation(user.uid);
    if (result.success && result.isSharing) {
      setIsSharing(true);
      setLastUpdate(result.data?.timestamp);
    }
  };

  // Start sharing location
  const handleStartSharing = async () => {
    if (!user || !userProfile?.driverInfo) {
      toast.error('Driver information not found');
      return;
    }

    setIsLoadingLocation(true);
    
    try {
      // Start location sharing
      const result = await startLocationSharing(
        user.uid,
        user.email,
        {
          displayName: userProfile.displayName || user.displayName || 'Driver',
          busNumber: userProfile.driverInfo.busNumber || 'Unknown',
          route: userProfile.driverInfo.route || 'Unknown Route'
        }
      );

      if (result.success) {
        setIsSharing(true);
        setLastUpdate(new Date());
        
        // Start watching position for continuous updates
        const id = watchPosition(
          async (position) => {
            await updateDriverLocation(user.uid, position);
            setLastUpdate(new Date());
          },
          (error) => {
            console.error('Watch position error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 60000
          }
        );
        
        setWatchId(id);
        toast.success('📍 Location sharing started');
      } else {
        toast.error(result.error || 'Failed to start location sharing');
      }
    } catch (error) {
      console.error('Error starting location sharing:', error);
      toast.error('Failed to start location sharing');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Stop sharing location
  const handleStopSharing = async () => {
    if (!user?.uid) return;

    setIsLoadingLocation(true);
    
    try {
      // Clear watch position
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }

      // Remove location from database
      const result = await stopLocationSharing(user.uid);
      
      if (result.success) {
        setIsSharing(false);
        setLastUpdate(null);
        toast.success('Location sharing stopped');
      } else {
        toast.error(result.error || 'Failed to stop location sharing');
      }
    } catch (error) {
      console.error('Error stopping location sharing:', error);
      toast.error('Failed to stop location sharing');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const getRoleIcon = () => {
    if (isAdmin) return <Shield className="h-5 w-5 text-purple-600" />;
    if (isDriver) return <Car className="h-5 w-5 text-blue-600" />;
    return <GraduationCap className="h-5 w-5 text-green-600" />;
  };

  const getRoleBadgeColor = () => {
    if (isAdmin) return 'bg-purple-100 text-purple-800';
    if (isDriver) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="h-full overflow-y-auto pb-28 bg-gradient-to-b from-gray-50 to-white safe-bottom">
      <div className="p-4 space-y-4">
        {/* Profile Header */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                  {getRoleIcon()}
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{userProfile?.displayName || user?.displayName || 'User'}</h2>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user?.email}
                </p>
                <Badge className={`${getRoleBadgeColor()} text-xs`}>
                  {userProfile?.role?.toUpperCase() || 'STUDENT'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-Specific Content */}
        
        {/* Admin Actions */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5" />
                Admin Portal
              </CardTitle>
              <CardDescription className="text-xs">
                Access administrative features and management tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start touch-manipulation min-h-[44px]"
                onClick={onNavigateToAdminDashboard}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start touch-manipulation min-h-[44px]"
                onClick={onNavigateToVerifications}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                User Verifications
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Driver-Specific Content */}
        {isDriver && (
          <>
            {/* Verification Status */}
            <Card className={isPending ? 'border-yellow-200 bg-yellow-50' : isVerified ? 'border-green-200 bg-green-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {isPending && <Clock className="h-5 w-5 text-yellow-600" />}
                  {isVerified && <CheckCircle className="h-5 w-5 text-green-600" />}
                  Driver Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPending && (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Verification Pending
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Your driver verification is being reviewed by an administrator.
                    </p>
                  </div>
                )}
                {isVerified && (
                  <div className="space-y-2">
                    <Badge className="bg-green-100 text-green-800">
                      Verified Driver
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Your driver account is verified.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Driver Info */}
            {userProfile?.driverInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Driver Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Bus Number</p>
                      <p className="font-medium">{userProfile.driverInfo.busNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Route</p>
                      <p className="font-medium">{userProfile.driverInfo.route || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">License</p>
                      <p className="font-medium text-xs">{userProfile.driverInfo.licenseNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium text-xs">{userProfile.driverInfo.phoneNumber || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Sharing Control - Only for verified drivers */}
            {isVerified && (
              <Card className={isSharing ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className={`h-5 w-5 ${isSharing ? 'text-green-600' : 'text-gray-600'}`} />
                    Live Location Sharing
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isSharing 
                      ? 'Your location is being shared with students in real-time'
                      : 'Share your live location with students while on route'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Status Indicator */}
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${isSharing ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <div className="relative">
                      {isSharing && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
                      )}
                      <Radio className={`h-5 w-5 relative ${isSharing ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isSharing ? 'text-green-900' : 'text-gray-900'}`}>
                        {isSharing ? 'Broadcasting Location' : 'Not Broadcasting'}
                      </p>
                      {isSharing && lastUpdate && (
                        <p className="text-xs text-green-700">
                          Last update: {new Date(lastUpdate).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <Badge variant={isSharing ? 'default' : 'secondary'} className={isSharing ? 'bg-green-600' : ''}>
                      {isSharing ? 'ON' : 'OFF'}
                    </Badge>
                  </div>

                  {/* Control Button */}
                  <Button
                    onClick={isSharing ? handleStopSharing : handleStartSharing}
                    disabled={isLoadingLocation}
                    className={`w-full touch-manipulation min-h-[44px] ${
                      isSharing 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isLoadingLocation ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        {isSharing ? 'Stopping...' : 'Starting...'}
                      </>
                    ) : (
                      <>
                        <Power className="mr-2 h-4 w-4" />
                        {isSharing ? 'Stop Sharing Location' : 'Start Sharing Location'}
                      </>
                    )}
                  </Button>

                  {/* Info Text */}
                  {isSharing && (
                    <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="flex items-start gap-1">
                        <span className="text-blue-600 mt-0.5">ℹ️</span>
                        <span>
                          Your location updates automatically every minute. Make sure to stop sharing when you finish your route.
                        </span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </>
        )}

        {/* Student Info */}
        {isStudent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-5 w-5" />
                Student Profile
              </CardTitle>
              <CardDescription className="text-xs">
                Track buses in real-time and stay updated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-xs text-muted-foreground">Account Status</span>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-xs text-muted-foreground">Access Level</span>
                  <Badge variant="secondary" className="text-xs">Standard</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Settings Access */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              variant="outline" 
              className="w-full justify-start touch-manipulation min-h-[44px]"
              onClick={onNavigateToSettings}
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Account Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileView;
