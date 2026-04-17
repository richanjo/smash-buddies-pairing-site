'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

useEffect(() => {
    const isLoggedIn = localStorage.getItem('pickleball_logged_in');
    if (isLoggedIn === 'true') {
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePreventBack);
    return () => window.removeEventListener('popstate', handlePreventBack);
  }, []);

  const handlePreventBack = () => {
    window.history.pushState(null, '', window.location.href);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.endsWith('@gmail.com') && !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('pickleball_logged_in', 'true');
      localStorage.setItem('pickleball_user_email', email);
      document.cookie = 'pickleball_logged_in=true; path=/';
      window.location.href = '/';
    }, 1000);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('pickleball_logged_in', 'true');
      localStorage.setItem('pickleball_user_email', 'user@gmail.com');
      document.cookie = 'pickleball_logged_in=true; path=/';
      window.location.href = '/';
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#84cc16' }}>
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-zinc-200 flex-none">
        <div className="text-center mb-6">
          <Image src="/logo.jpg" alt="Smash Buddies" width={80} height={80} className="w-20 h-20 mx-auto mb-4 rounded-xl object-cover" />
          <h1 className="text-3xl font-black text-zinc-900">Smash Buddies</h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Generate balanced teams, track scores, and manage your games with ease
          </p>
        </div>

        <div className="bg-zinc-50 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold text-zinc-600 mb-2">How to use:</p>
          <ul className="text-xs text-zinc-500 space-y-1">
            <li>1. Add players with name, skill level, and gender</li>
            <li>2. Generate balanced team pairings</li>
            <li>3. Track scores and timer during matches</li>
            <li>4. Switch sides at halfway point</li>
          </ul>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border-2 border-zinc-300 hover:bg-zinc-50 disabled:bg-zinc-100 text-zinc-700 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 mb-4"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.96 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.96 3.47 2.18 6.83l2.85 2.23c.87-2.6 3.3-4.68 6.16-4.68z"/>
            </svg>
          )}
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-zinc-500">or</span>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full px-4 py-3 text-base bg-black border-2 border-zinc-800 rounded-xl focus:border-green-500 focus:outline-none text-white placeholder:text-zinc-400 mb-4"
          />

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-300 text-white font-black py-3 rounded-xl transition-all"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
      <footer className="text-center mt-4 text-zinc-900 text-sm font-bold">
        Developed by Rits
      </footer>
    </div>
  );
}