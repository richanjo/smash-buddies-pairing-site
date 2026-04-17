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

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('pickleball_logged_in', 'true');
      localStorage.setItem('pickleball_user_email', email);
      document.cookie = 'pickleball_logged_in=true; path=/';
      router.push('/');
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
          </ul>
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
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
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>
      </div>
      <footer className="text-center mt-4 text-zinc-900 text-sm font-bold">
        Developed by Rits
      </footer>
    </div>
  );
}