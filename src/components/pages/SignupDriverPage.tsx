import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SignupDriverPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicleType: 'car',
    vehiclePlate: '',
    agreesToTerms: false,
    agreesToNewsletters: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateProgress = () => {
    return step === 1 ? 50 : 100;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
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
            role: 'driver'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const userId = authData.user.id;

        // 2. Update Profile
        // Trigger might create the row, but we update it
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone_number: formData.phone,
            preferences: { newsletter: formData.agreesToNewsletters },
          })
          .eq('user_id', userId);

        if (profileError) {
          // Note: If trigger failed or hasn't run yet, this might fail.
          // But usually trigger runs immediately. 
          // Better strategy: Insert if not exists or Upsert?
          // RLS allows update own profile.
          console.error('Profile update error', profileError);
        }

        // 3. Insert Vehicle
        if (formData.vehiclePlate) {
          const { error: vehicleError } = await supabase
            .from('vehicles')
            .insert({
              user_id: userId,
              type: formData.vehicleType || 'car',
              license_plate: formData.vehiclePlate,
              is_default: true
            });

          if (vehicleError) throw vehicleError;
        }

        toast.success('Account created successfully! Welcome to ParkMate!');
        navigate('/find');
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Form Container - Centered */}
      <div className="w-full max-w-lg p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Create driver account</h2>
            <p className="text-muted-foreground">Sign up to book parking spots instantly.</p>
          </div>

          <div className="relative h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-zinc-900 transition-all duration-300 ease-in-out"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>

          <form onSubmit={step === 2 ? handleSubmit : handleNext} className="space-y-6">

            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+880 1XXX QXXXXX"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label>Primary Vehicle Type</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {['car', 'bike', 'truck'].map((type) => (
                      <div key={type} className="relative">
                        <input
                          type="radio"
                          name="vehicleType"
                          value={type}
                          id={type}
                          className="peer sr-only"
                          checked={formData.vehicleType === type}
                          onChange={handleChange}
                          required
                        />
                        <Label
                          htmlFor={type}
                          className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer transition-all ${formData.vehicleType === type
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                        >
                          <span className="capitalize font-medium">{type}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehiclePlate">License Plate</Label>
                  <Input
                    id="vehiclePlate"
                    name="vehiclePlate"
                    placeholder="DHA-KA-1234"
                    required
                    value={formData.vehiclePlate}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      name="agreesToTerms"
                      checked={formData.agreesToTerms}
                      onCheckedChange={(checked) => setFormData(p => ({ ...p, agreesToTerms: checked === true }))}
                      required
                    />
                    <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="newsletter"
                      name="agreesToNewsletters"
                      checked={formData.agreesToNewsletters}
                      onCheckedChange={(checked) => setFormData(p => ({ ...p, agreesToNewsletters: checked === true }))}
                    />
                    <Label htmlFor="newsletter" className="text-sm font-normal text-muted-foreground leading-none">
                      Subscribe to newsletters and updates
                    </Label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1 h-11">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              )}
              <Button type="submit" className={`${step === 1 ? 'w-full' : 'flex-1'} h-11`} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
                  </>
                ) : step < 2 ? (
                  <>
                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </form>

          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}