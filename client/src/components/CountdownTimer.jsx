import React, { useState, useEffect } from 'react';

export default function CountdownTimer({ product }) {
  const comboPrice = product?.comboPrice || 2000;
  const regularComboPrice = product?.regularComboPrice || 2600;
  const comboSavings = Math.max(0, regularComboPrice - comboPrice);
  const comboQty = product?.comboQuantity || 4;
  const hasFreeDelivery = product?.comboFreeDelivery ?? true;

  const [timeLeft, setTimeLeft] = useState({
    hours: 11,
    minutes: 42,
    seconds: 35
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 11, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num) => {
    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num)
      .padStart(2, '0')
      .split('')
      .map(d => bnNums[parseInt(d)] || d)
      .join('');
  };

  return (
    <div className="bg-slate-950 text-slate-200 py-2 px-3 sm:px-4 border-b border-slate-800/80">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 text-center sm:text-left">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="text-[11px] sm:text-xs md:text-sm font-semibold tracking-wide text-slate-100">
            ধামাকা অফার: {comboQty} পিস কম্বোতে {comboSavings > 0 ? `৳${comboSavings} ছাড় ` : ''}{hasFreeDelivery ? '+ ফ্রি হোম ডেলিভারি' : ''}
          </span>
        </div>

        {/* Minimal Digit Boxes */}
        <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs font-bold">
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-sans mr-0.5 sm:mr-1">বাকি:</span>
          <div className="bg-slate-900 px-1.5 sm:px-2 py-0.5 rounded border border-slate-800 text-amber-300">
            <span>{formatNumber(timeLeft.hours)}</span>
            <span className="text-[8px] sm:text-[9px] font-sans text-slate-400 ml-0.5 sm:ml-1">ঘণ্টা</span>
          </div>
          <span className="text-slate-500">:</span>
          <div className="bg-slate-900 px-1.5 sm:px-2 py-0.5 rounded border border-slate-800 text-amber-300">
            <span>{formatNumber(timeLeft.minutes)}</span>
            <span className="text-[8px] sm:text-[9px] font-sans text-slate-400 ml-0.5 sm:ml-1">মিঃ</span>
          </div>
          <span className="text-slate-500">:</span>
          <div className="bg-slate-900 px-1.5 sm:px-2 py-0.5 rounded border border-slate-800 text-amber-300">
            <span>{formatNumber(timeLeft.seconds)}</span>
            <span className="text-[8px] sm:text-[9px] font-sans text-slate-400 ml-0.5 sm:ml-1">সেঃ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
