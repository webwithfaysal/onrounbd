import React from 'react';
import { Phone, ArrowRight } from 'lucide-react';

export default function FloatingCTA({ onScrollToOrder, product, settings }) {
  const hotline = settings?.hotline || "01711223344";
  const comboPrice = product?.comboPrice || 2000;
  const comboQty = product?.comboQuantity || 4;
  const twoPcsPrice = product?.twoPcsPrice || 1200;
  const threePcsPrice = product?.threePcsPrice || 1500;
  const singlePrice = product?.singlePrice || 650;
  const freeDeliveryText = product?.comboFreeDelivery ? ' (ফ্রি ডেলিভারি)' : '';

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-3.5 shadow-lg md:hidden">
      <div className="flex items-center justify-between gap-2.5 max-w-md mx-auto">
        
        {/* Call button */}
        <a
          href={`tel:${hotline.replace(/[^0-9]/g, '')}`}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 border border-slate-200"
          title="হটলাইনে কল করুন"
        >
          <Phone className="w-4 h-4 text-slate-700" />
        </a>

        {/* Info & Price */}
        <div className="flex-1 truncate">
          <span className="block text-[11px] font-bold text-slate-900 uppercase tracking-tight truncate">
            মেগা কম্বো: {comboQty} পিস ৳{comboPrice}{freeDeliveryText}
          </span>
          <span className="block text-[9px] text-slate-500 truncate">
            ২ পিস ৳{twoPcsPrice} • ৩ পিস ৳{threePcsPrice} • ১ পিস ৳{singlePrice}
          </span>
        </div>

        {/* Minimal Order Button */}
        <button
          onClick={onScrollToOrder}
          className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-2xs flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer"
        >
          <span>অর্ডার করুন</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

      </div>
    </div>
  );
}
