import { useState } from 'react';
import { Eye, EyeOff, Building, User, Mail, Phone, Lock, Shield, ArrowLeft, DollarSign, MapPin, Users, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { ParkMateLogo } from '../ui/parkmate-logo';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SignupOwnerPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    propertyType: '',
    propertyAddress: '',
    propertyDescription: '',
    totalSpaces: '',
    agreesToTerms: false,
    agreesToNewsletters: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsLoading(true);

    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      toast.error('Signup is taking too long. Please try again.');
    }, 15000);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      clearTimeout(timeoutId);
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      clearTimeout(timeoutId);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'host',
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            business_name: formData.businessName,
            address: formData.propertyAddress,
            initial_property_type: formData.propertyType,
            initial_capacity: formData.totalSpaces,
            description: formData.propertyDescription,
            preferences: { newsletter: formData.agreesToNewsletters }
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const userId = authData.user.id;

        // 2. Update Role in public.users
        const { error: roleError } = await supabase
          .from('users')
          .update({ role: 'host' })
          .eq('id', userId);

        if (roleError) console.error('Role update error', roleError);

        // 3. Update Profile with Host Details
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone_number: formData.phone,
            business_name: formData.businessName,
            address: formData.propertyAddress,
            preferences: { newsletter: formData.agreesToNewsletters },
            metadata: {
              initial_property_type: formData.propertyType,
              initial_capacity: formData.totalSpaces,
              description: formData.propertyDescription
            }
          })
          .eq('user_id', userId);

        if (profileError) {
          console.error('Profile update error', profileError);
          // Non-blocking
        }

        toast.success('Host account created successfully! Welcome to ParkMate!');
        clearTimeout(timeoutId);

        // Small delay to ensure state updates
        setTimeout(() => {
          navigate('/host-dashboard');
        }, 100);
      }
    } catch (error: any) {
      console.error('Signup error:', error);

      // Handle specific error cases with user-friendly messages
      if (error.message?.toLowerCase().includes('user already registered')) {
        toast.error('This email is already registered. Please use a different email or try logging in.');
      } else if (error.message?.toLowerCase().includes('email rate limit exceeded')) {
        toast.error('Too many signup attempts. Please wait a few minutes and try again.');
      } else if (error.message?.toLowerCase().includes('password should be at least')) {
        toast.error('Password must be at least 6 characters long.');
      } else if (error.message?.toLowerCase().includes('invalid email')) {
        toast.error('Please enter a valid email address.');
      } else if (error.message?.toLowerCase().includes('email address invalid')) {
        toast.error('This email format is not valid. Please use a different email address.');
      } else if (error.message?.toLowerCase().includes('network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create account. Please try again.');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onNavigateBack = () => navigate('/');
  const onNavigateToLogin = () => navigate('/login');
  const onNavigateToDriverSignup = () => navigate('/signup-driver');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex relative overflow-hidden">
      {/* Enhanced Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-blue-300/20 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-indigo-300/25 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-5 h-5 bg-purple-300/15 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-md animate-scale-in">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-8 animate-slide-in-down">
              <Button
                variant="ghost"
                size="icon"
                onClick={onNavigateBack}
                className="h-10 w-10 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 interactive-button hover-lift"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="animate-bounce-gentle">
                <ParkMateLogo size="sm" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Join as Space Owner
              </h1>
              <p className="text-gray-600">
                Monetize your parking space and earn passive income
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center mb-8">
              <div className={`flex-1 h-2 rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'
                }`}></div>
              <div className="px-4">
                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'
                  }`}></div>
              </div>
              <div className={`flex-1 h-2 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'
                }`}></div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
                  <p className="text-sm text-gray-600">Tell us about yourself to get started</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+880 1XXX-XXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">
                    Business Name (Optional)
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="businessName"
                      placeholder="Your Company Name"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-12 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200"
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
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 pr-12 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Property Information</h3>
                  <p className="text-sm text-gray-600">Tell us about your parking space</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyType" className="text-sm font-medium text-gray-700">
                    Property Type
                  </Label>
                  <Select value={formData.propertyType} onValueChange={(value) => setFormData({ ...formData, propertyType: value })}>
                    <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">🏠 Residential Driveway</SelectItem>
                      <SelectItem value="commercial">🏢 Commercial Building</SelectItem>
                      <SelectItem value="garage">🏬 Private Garage</SelectItem>
                      <SelectItem value="lot">🅿️ Open Parking Lot</SelectItem>
                      <SelectItem value="street">🛣️ Street Parking</SelectItem>
                      <SelectItem value="other">🏗️ Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyAddress" className="text-sm font-medium text-gray-700">
                    Property Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="propertyAddress"
                      placeholder="Enter your property address"
                      value={formData.propertyAddress}
                      onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                      className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalSpaces" className="text-sm font-medium text-gray-700">
                    Number of Parking Spaces
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="totalSpaces"
                      type="number"
                      placeholder="e.g., 2"
                      value={formData.totalSpaces}
                      onChange={(e) => setFormData({ ...formData, totalSpaces: e.target.value })}
                      className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyDescription" className="text-sm font-medium text-gray-700">
                    Property Description (Optional)
                  </Label>
                  <Textarea
                    id="propertyDescription"
                    placeholder="Describe your parking space, any special instructions, or amenities..."
                    value={formData.propertyDescription}
                    onChange={(e) => setFormData({ ...formData, propertyDescription: e.target.value })}
                    className="min-h-[100px] bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200"
                    rows={4}
                  />
                </div>

                {/* Benefits Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Space Owner Benefits
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Earn passive income from unused space</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Set your own pricing and availability</span>
                    </div>
                  </div>
                </div>

                {/* Agreement Checkboxes */}
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreesToTerms}
                      onChange={(e) => setFormData({ ...formData, agreesToTerms: e.target.checked })}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the Terms of Service
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex-1 h-12 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  Previous
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className={`${currentStep === 1 ? 'w-full' : 'flex-1'} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 rounded-lg transition-all duration-200 hover:shadow-lg`}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  currentStep === 1 ? 'Continue' : 'Create Account'
                )}
              </Button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Already have an account?</p>
              <Button
                variant="outline"
                onClick={onNavigateToLogin}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 h-10 px-6 transition-all duration-200"
              >
                Sign In Instead
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Looking for parking instead?</p>
              <Button
                variant="link"
                onClick={onNavigateToDriverSignup}
                className="text-purple-600 hover:text-purple-700 p-0 h-auto text-sm"
              >
                Sign up as Driver
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 relative overflow-hidden">
        {/* Geometric Background and Content... (Simplified for brevity as it's visual) */}
        <div className="flex items-center justify-center w-full h-full p-12 relative z-10">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Monetize Your Space</h2>
            <p className="text-gray-600">Join thousands of hosts earning passive income with ParkMate.</p>
          </div>
        </div>
      </div>
    </div>
  );
}