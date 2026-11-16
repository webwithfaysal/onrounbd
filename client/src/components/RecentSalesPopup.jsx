import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, CheckCircle } from 'lucide-react';
import { getAssetUrl } from '../utils/assetHelper';

export default function RecentSalesPopup() {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const notifications = [
    { name: "তানভীর আহমেদ", loc: "উত্তরা, ঢাকা", item: "৪ পিস মেগা কম্বো প্যাক", time: "২ মিনিট আগে", image: "/images/underwear-navy.jpg" },
    { name: "মাহমুদ হাসান", loc: "আগ্রাবাদ, চট্টগ্রাম", item: "৪ পিস মেগা কম্বো প্যাক", time: "৪ মিনিট আগে", image: "/images/underwear-mint.jpg" },
    { name: "আরিফুল ইসলাম", loc: "মিরপুর-১০, ঢাকা", item: "১ পিস চারকোল গ্রে", time: "৬ মিনিট আগে", image: "/images/underwear-grey.jpg" },
    { name: "সাইফুল ইসলাম", loc: "উপশহর, সিলেট", item: "৪ পিস মেগা কম্বো প্যাক", time: "৯ মিনিট আগে", image: "/images/underwear-lightgrey.jpg" },
    { name: "শফিকুর রহমান", loc: "গুলশান-২, ঢাকা", item: "৪ পিস মেগা কম্বো প্যাক", time: "১২ মিনিট আগে", image: "/images/underwear-navy.jpg" }
  ];

  useEffect(() => {
    // Show first after 4 seconds
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 4000);

    // Loop interval
    const interval = setInterval(() => {
      setVisible(prev => {
        if (!prev) {
          setCurrentIndex(curr => (curr + 1) % notifications.length);
          return true;
        } else {
          return false;
        }
      });
    }, 12000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [notifications.length]);

  if (!visible) return null;

  const current = notifications[currentIndex];

  return (
    <div className="fixed bottom-20 left-4 z-40 max-w-xs sm:max-w-sm bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-slate-200 animate-slide-up flex items-center gap-3 transition-all duration-300">
      
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-xl bg-slate-50 p-1 border border-slate-100 shrink-0 relative">
        <img src={getAssetUrl(current.image)} alt={current.item} className="w-full h-full object-contain" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1">
          <span className="font-bold text-xs text-slate-900 truncate">{current.name}</span>
          <span className="text-[10px] text-slate-500">({current.loc})</span>
        </div>
        <p className="text-[11px] font-semibold text-rose-600 truncate mt-0.5">
          {current.item} অর্ডার করেছেন
        </p>
        <span className="text-[10px] text-slate-400 block">{current.time}</span>
      </div>

      {/* Close button */}
      <button
        onClick={() => setVisible(false)}
        className="text-slate-400 hover:text-slate-700 p-1"
        title="বন্ধ করুন"
      >
        <X className="w-3.5 h-3.5" />
      </button>

    </div>
  );
}

