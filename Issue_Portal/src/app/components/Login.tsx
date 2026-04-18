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
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="border border-gray-300 bg-white p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">DigiLocker Portal</h1>
            <p className="text-sm text-gray-600">Government of India</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-800 px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2 px-4 border border-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:border-gray-400"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={onSwitchToSignup}
              className="text-sm text-gray-700 hover:text-gray-900 underline"
            >
              Don't have an account? Register here
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Secure Portal • Post-Quantum Cryptography</p>
        </div>
      </div>
    </div>
  );
}
