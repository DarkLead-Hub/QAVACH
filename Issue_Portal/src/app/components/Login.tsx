import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface LoginProps {
  onLoginSuccess: (accessToken: string, userId: string) => void;
  onSwitchToSignup: () => void;
}

export function Login({ onLoginSuccess, onSwitchToSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.session?.access_token && data.user?.id) {
        // Ensure profile row exists (handles users created before the trigger was set up)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || '',
            phone: data.user.user_metadata?.phone || '',
            address: data.user.user_metadata?.address || ''
          });
        }

        onLoginSuccess(data.session.access_token, data.user.id);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An unexpected error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
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
            <i className="fa-solid fa-shield-halved text-white text-xl"></i>
          </div>
        </div>

        <div className="glass p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1 tracking-tight">Citizen Portal</h1>
            <p className="text-sm text-[#6b7280]">Government of India</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5"
                placeholder="••••••••"
                required
              />
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
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={onSwitchToSignup}
              className="text-sm text-[#6b7280] hover:text-[#4f46e5] transition-colors"
            >
              Don't have an account? <span className="text-[#4f46e5] font-medium">Register here</span>
            </button>
          </div>
        </div>

        <div className="mt-5 text-center text-xs text-[#9ca3af]">
          <p className="flex items-center justify-center gap-1.5">
            <i className="fa-solid fa-lock text-[0.65rem]"></i>
            Secured with Post-Quantum Cryptography
          </p>
        </div>
      </div>
    </div>
  );
}
