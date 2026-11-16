import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';
import { getSettingsConfig } from '../services/firebaseDb';

export default function AdminLoginModal({ onLoginSuccess, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const ct = res.headers.get('content-type');
      if (res.ok && ct && ct.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('admin_token', data.token);
          onLoginSuccess();
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }

    // Client-side authentication fallback (checking Cloud Firestore then localStorage)
    try {
      const liveSettings = await getSettingsConfig();
      if (liveSettings?.adminPin && pin.trim() === liveSettings.adminPin.trim()) {
        localStorage.setItem('admin_pin', liveSettings.adminPin);
        localStorage.setItem('admin_token', 'admin-auth-valid-session');
        onLoginSuccess();
        return;
      }
    } catch (e) {}

    const validPin = localStorage.getItem('admin_pin') || '123456';
    if (pin.trim() === validPin.trim()) {
      localStorage.setItem('admin_token', 'admin-auth-valid-session');
      onLoginSuccess();
    } else {
      setError('ভুল পিন নম্বর! আবার চেষ্টা করুন।');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center relative">
        
        {/* Back button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          title="ফিরে যান"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-4 border border-rose-100">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-1">
          অ্যাডমিন প্যানেল প্রবেশ
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          স্টক, সাইজ ও অর্ডার পরিচালনা করতে সিকিউরিটি পিন দিন।
        </p>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-xl flex items-center gap-2 border border-red-200 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              autoFocus
              maxLength={10}
              placeholder="সিকিউরিটি পিন দিন"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-center font-mono text-lg tracking-widest text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow transition active:scale-95 disabled:opacity-50"
          >
            {loading ? 'যাচাই হচ্ছে...' : 'লগইন করুন'}
          </button>
        </form>

      </div>
    </div>
  );
}

