import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface SignupProps {
  onSignupSuccess: () => void;
  onSwitchToLogin: () => void;
}

/**
 * Signup component — uses Supabase client-side auth (supabase.auth.signUp).
 * The profile row is auto-created by the handle_new_user() Postgres trigger,
 * so no edge function call is needed for registration.
 */
export function Signup({ onSignupSuccess, onSwitchToLogin }: SignupProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Client-side signup via Supabase Auth.
      // The handle_new_user() trigger on auth.users automatically creates
      // a profiles row with the metadata (full_name, phone, address).
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
            address: formData.address
          }
        }
      });

      if (signupError) {
        console.error('Signup error:', signupError.message);
        setError(signupError.message);
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required — show message
        setSuccessMessage(
          'Account created! Please check your email to confirm your account, then sign in.'
        );
      } else {
        // Auto-confirmed — immediately go to login
        setSuccessMessage('Account created successfully! You can now sign in.');
      }

      // Sign out if auto-logged-in (we want the user to explicitly log in)
      if (data.session) {
        await supabase.auth.signOut();
      }

      // Switch to login after a short delay
      setTimeout(() => onSignupSuccess(), 2000);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(`Unexpected error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative">
      {/* Animated grid background */}
      <div className="grid-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#4338ca] flex items-center justify-center shadow-md shadow-[rgba(79,70,229,0.25)]">
            <i className="fa-solid fa-user-plus text-white text-lg"></i>
          </div>
        </div>

        <div className="glass p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1 tracking-tight">Create Account</h1>
            <p className="text-sm text-[#6b7280]">Citizen Portal — Government of India</p>
          </div>

          {successMessage && (
            <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-xs"></i>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-3.5">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="glass-input w-full px-3.5 py-2.5"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="glass-input w-full px-3.5 py-2.5"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="glass-input w-full px-3.5 py-2.5"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="glass-input w-full px-3.5 py-2.5 resize-none"
                placeholder="Your residential address"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="glass-input w-full px-3.5 py-2.5"
                  placeholder="••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Confirm *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="glass-input w-full px-3.5 py-2.5"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 text-sm flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation text-xs"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 px-4 text-sm font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={onSwitchToLogin}
              className="text-sm text-[#6b7280] hover:text-[#4f46e5] transition-colors"
            >
              Already have an account? <span className="text-[#4f46e5] font-medium">Sign in</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
