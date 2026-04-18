import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Dashboard } from './components/Dashboard';
import { ServerTest } from './components/ServerTest';
import { supabase } from '../utils/supabaseClient';

type AuthView = 'login' | 'signup' | 'dashboard' | 'test';

export default function App() {
  const [authView, setAuthView] = useState<AuthView>('login');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if URL has ?test parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === 'true') {
      setAuthView('test');
      setLoading(false);
      return;
    }
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token && session?.user?.id) {
      setAccessToken(session.access_token);
      setUserId(session.user.id);
      setAuthView('dashboard');
    }

    setLoading(false);
  };

  const handleLoginSuccess = (token: string, uid: string) => {
    setAccessToken(token);
    setUserId(uid);
    setAuthView('dashboard');
  };

  const handleSignupSuccess = () => {
    setAuthView('login');
  };

  const handleLogout = () => {
    setAccessToken(null);
    setUserId(null);
    setAuthView('login');
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-white">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (authView === 'test') {
    return <ServerTest />;
  }

  if (authView === 'login') {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignup={() => setAuthView('signup')}
      />
    );
  }

  if (authView === 'signup') {
    return (
      <Signup
        onSignupSuccess={handleSignupSuccess}
        onSwitchToLogin={() => setAuthView('login')}
      />
    );
  }

  if (authView === 'dashboard' && accessToken && userId) {
    return (
      <Dashboard
        accessToken={accessToken}
        userId={userId}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}