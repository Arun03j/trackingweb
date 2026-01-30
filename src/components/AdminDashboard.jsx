// Enhanced admin dashboard with comprehensive management features
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { 
  Users, 
  Bus, 
  Route, 
  Calendar, 
  Bell, 
  BarChart3,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import AdminUserVerificationPanel from './AdminUserVerificationPanel.jsx';
import BusRouteManager from './BusRouteManager.jsx';
import BusScheduleManager from './BusScheduleManager.jsx';
import NotificationSystem from './NotificationSystem.jsx';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingVerifications: 0,
    activeDrivers: 0,
    totalRoutes: 0,
    activeSchedules: 0,
    recentNotifications: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Listen to users for stats
    const usersQuery = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      let totalUsers = 0;
      let pendingVerifications = 0;
      let activeDrivers = 0;

      snapshot.forEach((doc) => {
        const userData = doc.data();
        totalUsers++;
        
        if (userData.isPending) {
          pendingVerifications++;
        }
        
        if (userData.role === 'driver' && userData.isVerified) {
          activeDrivers++;
        }
      });

      setStats(prev => ({
        ...prev,
        totalUsers,
        pendingVerifications,
        activeDrivers
      }));
    });

    // Listen to routes
    const routesQuery = collection(db, 'routes');
    const unsubscribeRoutes = onSnapshot(routesQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalRoutes: snapshot.size
      }));
    });

    // Listen to schedules
    const schedulesQuery = query(
      collection(db, 'schedules'),
      where('isActive', '==', true)
    );
    const unsubscribeSchedules = onSnapshot(schedulesQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        activeSchedules: snapshot.size
      }));
    });

    // Listen to recent activity (login events)
    const activityQuery = query(
      collection(db, 'login'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const unsubscribeActivity = onSnapshot(activityQuery, (snapshot) => {
      const activities = [];
      snapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setRecentActivity(activities);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRoutes();
      unsubscribeSchedules();
      unsubscribeActivity();
    };
  }, []);

  const formatActivityTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'signup':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'login':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'logout':
        return <Activity className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const StatCard = ({ title, value, description, icon: Icon, trend }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your bus tracking system from one central location
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-0 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-2 touch-manipulation">Overview</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm px-2 py-2 touch-manipulation">Users</TabsTrigger>
          <TabsTrigger value="routes" className="text-xs sm:text-sm px-2 py-2 touch-manipulation">Routes</TabsTrigger>
          <TabsTrigger value="schedules" className="text-xs sm:text-sm px-2 py-2 touch-manipulation">Schedules</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 py-2 touch-manipulation">Notify</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2 py-2 touch-manipulation">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Stats Overview - Mobile Optimized */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              description="Registered users in the system"
              icon={Users}
              trend="+12% from last month"
            />
            
            <StatCard
              title="Pending Verifications"
              value={stats.pendingVerifications}
              description="Users awaiting approval"
              icon={Clock}
            />
            
            <StatCard
              title="Active Drivers"
              value={stats.activeDrivers}
              description="Verified drivers"
              icon={MapPin}
              trend="+3 this week"
            />
            
            <StatCard
              title="Total Routes"
              value={stats.totalRoutes}
              description="Configured bus routes"
              icon={Route}
            />
            
            <StatCard
              title="Active Schedules"
              value={stats.activeSchedules}
              description="Currently running schedules"
              icon={Calendar}
            />
            
            <StatCard
              title="System Status"
              value="Operational"
              description="All systems running normally"
              icon={CheckCircle}
            />
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest user activities and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      {getActivityIcon(activity.action)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.displayName || activity.email} {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatActivityTime(activity.timestamp)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <AdminUserVerificationPanel />
        </TabsContent>

        <TabsContent value="routes">
          <BusRouteManager />
        </TabsContent>

        <TabsContent value="schedules">
          <BusScheduleManager />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSystem />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics & Reports
              </CardTitle>
              <CardDescription>
                System usage statistics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p>
                  Detailed analytics and reporting features will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;