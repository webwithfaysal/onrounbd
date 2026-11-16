import React from 'react';
import { Phone, ShoppingBag, Search } from 'lucide-react';

export default function Header({ onScrollToOrder, onOpenTrackOrder, product, settings }) {
  const hotline = settings?.hotline || "01711-223344";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-2xs border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between">
        
        {/* Brand Logo with Transparent Background */}
        <a href="/" className="flex items-center gap-2 group cursor-pointer" title="ONROUN">
          <img
            src="/images/logo.png"
            alt="ONROUN"
            className="h-7 sm:h-8 md:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-102"
          />
        </a>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Order Tracking Button for Customers */}
          {onOpenTrackOrder && (
            <button
              onClick={onOpenTrackOrder}
              className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 p-2 sm:px-3 sm:py-1.5 rounded-full transition cursor-pointer"
              title="পার্সেল ট্র্যাক করুন"
            >
              <Search className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">অর্ডার ট্র্যাক</span>
            </button>
          )}

          <a
            href={`tel:${hotline.replace(/[^0-9]/g, '')}`}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3 sm:py-1.5 rounded-full transition"
          >
            <Phone className="w-3.5 h-3.5 text-slate-700" />
            <span>{hotline}</span>
          </a>

          <button
            onClick={onScrollToOrder}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-rose-400" />
            <span>অর্ডার করুন</span>
          </button>
        </div>

      </div>
    </header>
  );
}
