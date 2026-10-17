import { useState, useEffect, ReactNode } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Components
import { ModernFixedHeader } from "./components/ui/modern-fixed-header";
import { PageTransitionLoader } from "./components/ui/loading-spinner";
import { ModernDashboardLayout } from "./components/ui/modern-dashboard-layout";

// Pages
import { LandingPage } from "./components/pages/LandingPage";
import { LoginPage } from "./components/pages/LoginPage";
import SignupDriverPage from "./components/pages/SignupDriverPage";
import SignupOwnerPage from "./components/pages/SignupOwnerPage";
import { AdminDashboard } from "./components/pages/AdminDashboard";
import { SpaceOwnerDashboard } from "./components/pages/SpaceOwnerDashboard";
import { SmartSearchPage } from "./components/pages/SmartSearchPage";
import { RealTimeAvailabilityPage } from "./components/pages/RealTimeAvailabilityPage";
import { MobilePaymentsPage } from "./components/pages/MobilePaymentsPage";
import { GPSNavigationPage } from "./components/pages/GPSNavigationPage";
import { VehicleSupportPage } from "./components/pages/VehicleSupportPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { MapPage } from "./components/pages/MapPage";
import { BookingsPage } from "./components/pages/BookingsPage";
import { FiltersPage } from "./components/pages/FiltersPage";
import { PaymentPage } from "./components/pages/PaymentPage";
import { NotificationsPage } from "./components/pages/NotificationsPage";
import { SettingsPage } from "./components/pages/SettingsPage";
import { HelpSupportPage } from "./components/pages/HelpSupportPage";
import { UserManagementPage } from "./components/pages/UserManagementPage";
import { AddSpacePage } from "./components/pages/AddSpacePage";
import { EarningsPage } from "./components/pages/EarningsPage";
import { BookingManagementPage } from "./components/pages/BookingManagementPage";
import { WithdrawalPage } from "./components/pages/WithdrawalPage";
import { VehiclePricingPage } from "./components/pages/VehiclePricingPage";
import { PlatformOverviewPage } from "./components/pages/PlatformOverviewPage";
import { HostOverviewPage } from "./components/pages/HostOverviewPage";
import { ComprehensiveDashboardPage } from "./components/pages/ComprehensiveDashboardPage";
import { DiagnosticsPage } from "./components/pages/DiagnosticsPage";

export default function App() {
  const [userRole, setUserRole] = useState<"driver" | "host" | "admin" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        // DEV MODE: Check localStorage for dev user
        const DEV_MODE = false; // Set to false when Supabase connection is fixed

        if (DEV_MODE) {
          const devUser = localStorage.getItem('dev_user');
          if (devUser) {
            const user = JSON.parse(devUser);
            console.log('DEV MODE: Using localStorage session', user);
            setUserRole(user.role);
            setIsLoading(false);
            return;
          }
        }

        console.log('Checking session...');

        // Add timeout to prevent infinite loading (increased to 20 seconds for slow connections)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 20000)
        );

        const sessionPromise = supabase.auth.getSession();

        let session;
        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]);
          session = result.data?.session;
        } catch (timeoutError) {
          console.warn('⚠️ Session check timed out, assuming no active session');
          // If timeout occurs, assume no session and allow user to proceed to login
          setUserRole(null);
          setIsLoading(false);
          return;
        }

        if (session) {
          console.log('✓ Session found, fetching user role...');

          // Add timeout for role fetch as well (increased to 10 seconds)
          const roleTimeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Role fetch timeout')), 10000)
          );

          const rolePromise = supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          try {
            const { data, error } = await Promise.race([rolePromise, roleTimeoutPromise]);

            if (error) {
              console.warn('Error fetching user role:', error);
              setUserRole('driver'); // Default fallback
            } else if (data) {
              console.log('User role fetched:', data.role);
              setUserRole(data.role);
            } else {
              console.warn('User role not found in database, defaulting to driver');
              setUserRole('driver');
            }
          } catch (roleError) {
            console.warn('Role fetch timed out, using default role');
            setUserRole('driver');
          }
        } else {
          console.log('No active session found');
          setUserRole(null);
        }
      } catch (error) {
        console.error("Session check error:", error);
        // On error, assume no session and continue
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes (skip in DEV MODE)
    const DEV_MODE = false;
    if (!DEV_MODE) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUserRole(null);
          navigate('/');
        } else if (session) {
          // Re-fetch role on sign in (or we could store it in metadata to avoid DB call)
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          if (data) setUserRole(data.role);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [navigate]);


  const handleLogout = async () => {
    // Clear dev mode session
    localStorage.removeItem('dev_user');
    setUserRole(null);
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate('/');
  };

  // Protected Route Wrapper
  const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) => {
    if (isLoading) return <PageTransitionLoader />;
    if (!userRole) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      // Redirect based on actual role if trying to access unauthorized route
      if (userRole === 'host') return <Navigate to="/host-dashboard" replace />;
      if (userRole === 'admin') return <Navigate to="/admin-dashboard" replace />;
      return <Navigate to="/find" replace />;
    }
    return children;
  };

  // Helper to map current path to ID for Header highlighting
  const getCurrentPageId = () => {
    const path = location.pathname;
    if (path === '/' || path === '/find') return 'find';
    if (path === '/host-dashboard') return 'host-dashboard';
    if (path === '/admin-dashboard') return 'admin';
    return path.substring(1); // e.g. /map -> map
  };

  // Navigation handler passed to components that expect onNavigate
  // Many legacy components use onNavigate('page-id')
  const handleNavigate = (pageId: string) => {
    // Map IDs to Routes
    switch (pageId) {
      case 'landing': navigate('/'); break;
      case 'login': navigate('/login'); break;
      case 'signup-driver': navigate('/signup-driver'); break;
      case 'signup-owner': navigate('/signup-owner'); break;
      case 'find': navigate('/find'); break;
      case 'host-dashboard': navigate('/host-dashboard'); break;
      case 'admin': navigate('/admin-dashboard'); break;

      // Direct mappings
      default: navigate(`/${pageId}`);
    }
  };

  if (isLoading) {
    return <PageTransitionLoader />;
  }

  // Define User Role for Header (default to driver for guests to show layout, but hide protected items)
  const headerRole = userRole || 'driver';

  return (
    <div className="min-h-screen bg-white">
      {/* Hide Header on Auth Pages and Landing Page (if needed, but Landing usually has its own header) 
          Actually, LandingPage has its own header. 
      */}
      {!['/', '/login', '/signup-driver', '/signup-owner', '/platform-overview', '/host-overview', '/comprehensive-overview'].includes(location.pathname) && (
        <ModernFixedHeader
          userRole={headerRole}
          currentPage={getCurrentPageId()}
          onNavigate={handleNavigate}
          onSpecialNavigation={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Spacer if Header is present */}
      {!['/', '/login', '/signup-driver', '/signup-owner', '/platform-overview', '/host-overview', '/comprehensive-overview'].includes(location.pathname) && (
        <div className="" /> /* Header is fixed, but ModernDashboardLayout handles spacing usually? 
           ModernFixedHeader (step 221) has a spacer div at the bottom: <div className="h-16"></div> 
           So we don't need extra spacing here.
        */
      )}

      <main className="">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            // If logged in, redirect to dashboard. If not, show landing.
            !userRole ? <LandingPage onNavigateToAuth={(type) => handleNavigate(type)} onNavigateToOverview={(type) => handleNavigate(`${type}-overview`)} />
              : <Navigate to={userRole === 'host' ? '/host-dashboard' : (userRole === 'admin' ? '/admin-dashboard' : '/find')} replace />
          } />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup-driver" element={<SignupDriverPage />} />
          <Route path="/signup-owner" element={<SignupOwnerPage />} />

          {/* Diagnostics - Public for troubleshooting */}
          <Route path="/diagnostics" element={<DiagnosticsPage />} />

          {/* Overviews - Publicly accessible or protected? Assuming public for now as they are marketing pages */}
          <Route path="/platform-overview" element={<PlatformOverviewPage onNavigateToAuth={(type) => handleNavigate(type)} onNavigateBack={() => navigate('/')} />} />
          <Route path="/host-overview" element={<HostOverviewPage onNavigateToAuth={(type) => handleNavigate(type)} onNavigateBack={() => navigate('/')} />} />
          <Route path="/comprehensive-overview" element={<ComprehensiveDashboardPage onNavigateToAuth={(type) => handleNavigate(type)} onNavigateBack={() => navigate('/')} onNavigateToFeature={(f) => handleNavigate('login')} />} />

          {/* Driver Routes - Protected */}
          <Route path="/find" element={
            <ProtectedRoute allowedRoles={['driver']}>
              <ModernDashboardLayout userRole="driver" onNavigate={handleNavigate} />
            </ProtectedRoute>
          } />
          <Route path="/map" element={<ProtectedRoute allowedRoles={['driver']}><MapPage /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute allowedRoles={['driver']}><BookingsPage /></ProtectedRoute>} />
          <Route path="/smart-search" element={<ProtectedRoute allowedRoles={['driver']}><SmartSearchPage /></ProtectedRoute>} />
          <Route path="/real-time" element={<ProtectedRoute allowedRoles={['driver']}><RealTimeAvailabilityPage /></ProtectedRoute>} />
          <Route path="/mobile-payments" element={<ProtectedRoute allowedRoles={['driver']}><MobilePaymentsPage /></ProtectedRoute>} />
          <Route path="/gps-navigation" element={<ProtectedRoute allowedRoles={['driver']}><GPSNavigationPage /></ProtectedRoute>} />
          <Route path="/vehicle-support" element={<ProtectedRoute allowedRoles={['driver']}><VehicleSupportPage /></ProtectedRoute>} />

          {/* Host Routes - Protected */}
          <Route path="/host-dashboard" element={
            <ProtectedRoute allowedRoles={['host']}>
              <SpaceOwnerDashboard onNavigate={handleNavigate} />
            </ProtectedRoute>
          } />
          <Route path="/add-space" element={<ProtectedRoute allowedRoles={['host']}><AddSpacePage /></ProtectedRoute>} />
          <Route path="/earnings" element={<ProtectedRoute allowedRoles={['host']}><EarningsPage onNavigate={handleNavigate} /></ProtectedRoute>} />
          <Route path="/bookings-manage" element={<ProtectedRoute allowedRoles={['host']}><BookingManagementPage /></ProtectedRoute>} />
          <Route path="/withdrawal" element={<ProtectedRoute allowedRoles={['host']}><WithdrawalPage /></ProtectedRoute>} />

          {/* Admin Routes - Protected */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />

          {/* Shared / Common - Protected for any logged in user */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage userRole={headerRole} /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage userRole={headerRole} /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><HelpSupportPage /></ProtectedRoute>} />
          <Route path="/filters" element={<ProtectedRoute><FiltersPage /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/vehicle-pricing" element={<ProtectedRoute><VehiclePricingPage /></ProtectedRoute>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}