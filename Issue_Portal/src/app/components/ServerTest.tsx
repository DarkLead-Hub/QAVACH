import { useState } from 'react';
import { publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://zlzjfjjrhedelcgbhfla.supabase.co/functions/v1/make-server-93e10323`;

export function ServerTest() {
  const [result, setResult] = useState('');

  const testHealth = async () => {
    setResult('Testing health endpoint...');
    try {
      const response = await fetch(`${API_BASE}/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      const data = await response.json();
      setResult(`Health: ${response.status} - ${JSON.stringify(data)}`);
    } catch (err: any) {
      setResult(`Health Error: ${err.message}`);
    }
  };

  const testSignup = async () => {
    setResult('Testing signup endpoint...');
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'test123456',
          full_name: 'Test User'
        })
      });

      const data = await response.json();
      setResult(`Signup: ${response.status} - ${JSON.stringify(data)}`);
    } catch (err: any) {
      setResult(`Signup Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Server Test Page</h1>

      <div className="space-y-4 mb-6">
        <button
          onClick={testHealth}
          className="px-4 py-2 bg-blue-600 text-white"
        >
          Test Health Endpoint
        </button>

        <button
          onClick={testSignup}
          className="px-4 py-2 bg-green-600 text-white ml-4"
        >
          Test Signup Endpoint
        </button>
      </div>

      <div className="border border-gray-300 p-4 bg-gray-50">
        <h2 className="font-bold mb-2">Result:</h2>
        <pre className="text-sm whitespace-pre-wrap">{result || 'Click a button to test'}</pre>
      </div>

      <div className="mt-6 border border-gray-300 p-4 bg-yellow-50">
        <h2 className="font-bold mb-2">Debug Info:</h2>
        <p className="text-sm mb-1"><strong>API Base:</strong> {API_BASE}</p>
        <p className="text-sm"><strong>Anon Key:</strong> {publicAnonKey.substring(0, 30)}...</p>
      </div>
    </div>
  );
}
