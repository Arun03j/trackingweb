// Settings View - Login settings and preferences
import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { 
  LogOut, 
  Shield, 
  Bell, 
  MapPin, 
  User,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { signOutUser } from '../lib/authService.js';
import useUserRole from '../hooks/useUserRole.js';

const SettingsView = () => {
  const { user } = useAuth();
  const { userProfile } = useUserRole();
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleLogout = async () => {
    setLoggingOut(true);
    setMessage({ type: '', text: '' });
    
    try {
      const result = await signOutUser();
      if (result.success) {
        setMessage({ type: 'success', text: 'Logged out successfully!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to logout' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred during logout' });
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {message.text && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription className="text-xs">
              Your basic account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-xs text-muted-foreground">Display Name</span>
                <span className="text-sm font-medium">{userProfile?.displayName || user?.displayName || 'User'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-xs text-muted-foreground">Email</span>
                <span className="text-sm font-medium truncate ml-2">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-xs text-muted-foreground">Role</span>
                <span className="text-sm font-medium capitalize">{userProfile?.role || 'Student'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-xs text-muted-foreground">Account ID</span>
                <span className="text-xs font-mono">{user?.uid.slice(0, 8)}...</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Location Access</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Enabled</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Notifications</span>
              </div>
              <span className="text-xs text-gray-600 font-medium">System Default</span>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">App Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Build</span>
              <span className="font-medium">Production</span>
            </div>
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-600">Account Actions</CardTitle>
            <CardDescription className="text-xs">
              Sign out from your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              className="w-full touch-manipulation min-h-[48px]"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-xs text-muted-foreground py-4">
          <p>© 2026 Bus Tracker</p>
          <p className="mt-1">Real-time Bus Location Tracking</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
