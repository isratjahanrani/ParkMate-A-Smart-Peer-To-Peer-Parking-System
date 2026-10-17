import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Car, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParkMateLogo } from '@/components/ui/parkmate-logo';
import { FloatingElements } from '@/components/ui/floating-elements';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('Login attempt started...');

    // DEV MODE: Quick bypass for slow Supabase connections
    const DEV_MODE = false; // Set to false when Supabase connection is fixed

    if (DEV_MODE && formData.email === 'robiulislamtamim12345@gmail.com') {
      console.log('DEV MODE: Bypassing Supabase auth');
      setTimeout(() => {
        toast.success('Welcome back! Logged in as host (DEV MODE)');
        // Manually set a mock session in localStorage
        localStorage.setItem('dev_user', JSON.stringify({
          id: 'dev-user-id',
          email: formData.email,
          role: 'host'
        }));
        navigate('/host-dashboard');
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      console.log('Calling signInWithPassword...');

      // First, check if Supabase is reachable
      console.log('🔍 Checking Supabase connectivity...');
      const { checkSupabaseHealth } = await import('@/lib/supabase');
      const healthCheck = await checkSupabaseHealth();

      if (!healthCheck.healthy) {
        console.error('❌ Supabase health check failed:', healthCheck.message);
        toast.error(`Connection issue: ${healthCheck.message}`, {
          duration: 5000,
          description: 'Please check your internet connection and try again.'
        });
        setIsLoading(false);
        return;
      }

      console.log('✓ Supabase is reachable, attempting login...');

      // Create timeout promise (increased to 30 seconds to match fetch timeout)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LOGIN_TIMEOUT')), 30000)
      );

      const loginPromise = supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      let data, error;
      try {
        const result = await Promise.race([loginPromise, timeoutPromise]);
        data = result.data;
        error = result.error;
      } catch (timeoutError: any) {
        if (timeoutError.message === 'LOGIN_TIMEOUT') {
          console.error('❌ Login timeout - Supabase is not responding');
          toast.error('Connection timeout. Please check your internet connection and try again.', {
            duration: 5000
          });
          setIsLoading(false);
          return;
        }
        throw timeoutError;
      }

      console.log('SignIn response:', { hasData: !!data, hasError: !!error });

      if (error) throw error;

      if (data.user) {
        console.log('User authenticated, fetching role...');

        // Fetch user role with timeout (increased to 15 seconds)
        const roleTimeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('ROLE_TIMEOUT')), 15000)
        );

        const rolePromise = supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        let userData, userError;
        try {
          const result = await Promise.race([rolePromise, roleTimeoutPromise]);
          userData = result.data;
          userError = result.error;
        } catch (roleTimeoutError: any) {
          if (roleTimeoutError.message === 'ROLE_TIMEOUT') {
            console.warn('Role fetch timeout, using default role');
            toast.success('Welcome back! Logged in successfully');
            // Default to driver if role fetch times out
            navigate('/find');
            setIsLoading(false);
            return;
          }
          throw roleTimeoutError;
        }

        if (userError) {
          console.error('Error fetching user role:', userError);
          toast.warning('Logged in, but could not fetch profile. Redirecting to driver dashboard...');
          navigate('/find');
          setIsLoading(false);
          return;
        }

        const role = userData?.role || 'driver';
        console.log('User role:', role);
        toast.success(`Welcome back! Logged in as ${role}`);

        // Small delay to ensure state updates
        setTimeout(() => {
          if (role === 'host') {
            navigate('/host-dashboard');
          } else if (role === 'admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/find');
          }
          setIsLoading(false);
        }, 100);
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Provide more specific error messages
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please try again.');
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Please verify your email address before logging in.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error('Network error. Please check your internet connection.');
      } else {
        toast.error(error.message || 'Failed to login. Please try again.');
      }

      setIsLoading(false);
    }
  };

  const onNavigateToSignup = (type: 'driver' | 'owner') => {
    if (type === 'driver') navigate('/signup-driver');
    else navigate('/signup-owner');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex relative overflow-hidden">
      {/* Enhanced Floating Background Elements */}
      <FloatingElements count={12} colors={['purple', 'blue', 'indigo']} />

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-md animate-scale-in">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-8 animate-slide-in-down">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="h-10 w-10 rounded-full hover:bg-purple-100 hover:text-purple-700 transition-all duration-200 interactive-button hover-lift"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="animate-bounce-gentle">
                <ParkMateLogo size="sm" />
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-8 modern-card animate-slide-in-up">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 interactive-button ${activeTab === 'login'
                  ? 'bg-white text-purple-700 shadow-sm transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:scale-102'
                  }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 interactive-button ${activeTab === 'signup'
                  ? 'bg-white text-purple-700 shadow-sm transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:scale-102'
                  }`}
              >
                Sign up
              </button>
            </div>
          </div>

          {activeTab === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-slide-in-up">
              {/* Email Field */}
              <div className="space-y-2 animate-slide-in-left stagger-1">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-purple-500 transition-all duration-300 hover:border-gray-300 modern-input"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-12 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-purple-500 transition-all duration-200"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-purple-600 hover:text-purple-700 p-0 h-auto"
                >
                  Forgot your password?
                </Button>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          )}

          {activeTab === 'signup' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Join ParkMate</h3>
                <p className="text-gray-600">Choose how you want to get started</p>
              </div>

              <Button
                onClick={() => onNavigateToSignup('driver')}
                variant="outline"
                className="w-full h-16 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-200">
                    <Car className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Sign up as Driver</div>
                    <div className="text-sm text-gray-500">Find and book parking spots</div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => onNavigateToSignup('owner')}
                variant="outline"
                className="w-full h-16 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-200">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Sign up as Space Owner</div>
                    <div className="text-sm text-gray-500">List and monetize your space</div>
                  </div>
                </div>
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{' '}
              <Button variant="link" className="text-xs text-purple-600 hover:text-purple-700 p-0 h-auto">
                Terms of Service
              </Button>{' '}
              and{' '}
              <Button variant="link" className="text-xs text-purple-600 hover:text-purple-700 p-0 h-auto">
                Privacy Policy
              </Button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-200 relative overflow-hidden">
        {/* Geometric Background and Content moved to separate component or simplified if needed. 
            Keeping it simple here as it was in original but pure JSX. */}
        <div className="flex items-center justify-center w-full h-full p-12 relative z-10">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Smart Parking Made Simple</h2>
            <p className="text-gray-600">Login to access your dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}