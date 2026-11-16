import React, { useState } from 'react';
import { ShieldCheck, Truck, RotateCcw, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Hero({ product, onScrollToOrder, onSelectPackage }) {
  const [activeColorIndex, setActiveColorIndex] = useState(0);

  const comboPrice = product?.comboPrice || 2000;
  const regularComboPrice = product?.regularComboPrice || 2600;
  const comboSavings = Math.max(0, regularComboPrice - comboPrice);
  const comboQty = product?.comboQuantity || 4;

  const threePcsPrice = product?.threePcsPrice || 1500;
  const regularThreePcsPrice = product?.regularThreePcsPrice || 1950;
  const threePcsSavings = Math.max(0, regularThreePcsPrice - threePcsPrice);

  const twoPcsPrice = product?.twoPcsPrice || 1200;
  const regularTwoPcsPrice = product?.regularTwoPcsPrice || 1300;
  const twoPcsSavings = Math.max(0, regularTwoPcsPrice - twoPcsPrice);

  const singlePrice = product?.singlePrice || 650;
  const regularSinglePrice = product?.regularSinglePrice || 850;
  const singleSavings = Math.max(0, regularSinglePrice - singlePrice);

  const maxSavings = Math.max(comboSavings, threePcsSavings, twoPcsSavings, singleSavings);

  const colors = product?.colors || [
    { id: "navy", name: "ক্লাসিক নেভি ব্লু (Navy Blue)", image: "/images/underwear-navy.jpg", code: "#2B3A4A" },
    { id: "mint", name: "সতেজ মিন্ট গ্রিন (Mint Green)", image: "/images/underwear-mint.jpg", code: "#8FB7A5" },
    { id: "grey", name: "চারকোল গ্রে (Charcoal Grey)", image: "/images/underwear-grey.jpg", code: "#68727A" },
    { id: "lightgrey", name: "লাইট অ্যাশ গ্রে (Light Ash Grey)", image: "/images/underwear-lightgrey.jpg", code: "#9E9C99" }
  ];

  const activeColor = colors[activeColorIndex] || colors[0];

  return (
    <section className="relative bg-[#FAFBFC] border-b border-slate-100 pt-5 pb-10 sm:pt-8 sm:pb-14 md:py-20">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Studio Product Showcase */}
          <div className="lg:col-span-6 flex flex-col items-center">
            {/* Studio Card Stage */}
            <div className="relative w-full max-w-sm sm:max-w-md aspect-square rounded-3xl bg-white p-4 sm:p-6 shadow-2xs border border-slate-200/80 flex items-center justify-center overflow-hidden group">
              {/* Minimalist Badges */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-1 bg-slate-900 text-white text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-2xs">
                <span>বেস্টসেলার</span>
                <span className="text-slate-400">•</span>
                <span className="text-amber-300">২০২৬</span>
              </div>

              {maxSavings > 0 && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                  ৳{maxSavings} ছাড়
                </div>
              )}

              {/* Product Image */}
              <img
                src={activeColor.image}
                alt={activeColor.name}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />

              {/* Minimal Color Identifier Pill */}
              <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-6 bg-white/95 backdrop-blur-md border border-slate-200/80 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-1.5 sm:gap-2 truncate mr-2">
                  <span
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                    style={{ backgroundColor: activeColor.code }}
                  />
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-800 truncate">{activeColor.name}</span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium shrink-0">১০০% কম্বড কটন</span>
              </div>
            </div>

            {/* Thumbnail Selectors (4 Colors) */}
            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 sm:gap-2.5">
              {colors.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setActiveColorIndex(idx)}
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl overflow-hidden p-1 bg-white transition-all cursor-pointer ${
                    activeColorIndex === idx
                      ? 'border-2 border-slate-950 ring-2 sm:ring-4 ring-slate-200/70 shadow-2xs scale-105'
                      : 'border border-slate-200/80 hover:border-slate-300 opacity-80 hover:opacity-100'
                  }`}
                  title={c.name}
                >
                  <img src={c.image} alt={c.name} className="w-full h-full object-contain" />
                  <div
                    className="absolute bottom-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-white shadow-2xs"
                    style={{ backgroundColor: c.code }}
                  />
                </button>
              ))}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 sm:mt-2 font-medium">
              কালার পরিবর্তন করতে ছবিতে ট্যাপ করুন
            </p>
          </div>

          {/* Right Column: Editorial Typography & Clean Package Selector */}
          <div className="lg:col-span-6 text-center lg:text-left">
            {/* Subtle Eyebrow Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-slate-100 text-slate-800 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold mb-3 sm:mb-4 border border-slate-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              <span>{product?.badge || product?.name || '১০০% প্রিমিয়াম মাইক্রোমোডাল পিওর কটন'}</span>
            </div>

            {/* Editorial Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-[38px] font-black text-slate-950 tracking-tight leading-snug sm:leading-[1.2]">
              {product?.headline ? (
                <span>{product.headline}</span>
              ) : (
                <>সারাদিন থাকুন <span className="text-rose-600">ঘামহীন, চুলকানিমুক্ত</span> ও পরম স্বাচ্ছন্দ্যে</>
              )}
            </h1>

            {/* Sub-headline */}
            <p className="mt-2.5 sm:mt-3.5 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {product?.subTitle || product?.description || 'গরমে ঘাম ও অস্বস্তি থেকে মুক্তি দিতে বিশেষভাবে প্রস্তুত আল্ট্রা-সফট ব্রিদেবল সিমলেস বক্সার ব্রিফ। এটি ত্বকে ফেলে না কোনো লাল দাগ, উরুর সাথে গুটিয়ে যায় না এবং দেয় সারাদিন সতেজ থাকার শতভাগ নিশ্চয়তা।'}
            </p>

            {/* 4 Clean Minimal Value Props (2x2 Grid on Mobile) */}
            <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-1.5 sm:gap-2 text-left text-[11px] sm:text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium truncate">ঘাম শোষক ও ব্রিদেবল</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium truncate">অ্যান্টি-চ্যাফিং ডিজাইন</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium truncate">মাখনের মতো নরম ব্যান্ড</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium truncate">অ্যান্টি-ব্যাকটেরিয়াল</span>
              </div>
            </div>

            {/* Package Selector Cards */}
            <div className="mt-5 sm:mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                  প্যাকেজ নির্বাচন করুন:
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  {product?.comboFreeDelivery ? 'কম্বোতে ফ্রি ডেলিভারি' : 'ক্যাশ অন ডেলিভারি'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                
                {/* Combo Pack Card (Recommended Spotlight) */}
                <div
                  onClick={() => {
                    onSelectPackage('combo');
                    onScrollToOrder();
                  }}
                  className="cursor-pointer bg-white p-2.5 sm:p-3.5 rounded-2xl border-2 border-slate-950 shadow-2xs hover:shadow-xs transition text-left group relative"
                >
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <span className="bg-slate-950 text-amber-300 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded">
                      বেস্ট ভ্যালু
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-rose-600 shrink-0">
                      {product?.comboFreeDelivery ? 'ফ্রি ডেলিভারি' : `৳${comboSavings} ছাড়`}
                    </span>
                  </div>

                  <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                    {comboQty} পিস মেগা কম্বো
                  </span>

                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base sm:text-lg font-black text-slate-950">৳{comboPrice}</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">৳{regularComboPrice}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">সব কালার + বক্স</p>
                </div>

                {/* 3 Pcs Pack Card */}
                <div
                  onClick={() => {
                    onSelectPackage('three_pcs');
                    onScrollToOrder();
                  }}
                  className="cursor-pointer bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200 hover:border-slate-400 transition text-left group shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <span className="bg-slate-100 text-slate-700 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      ভ্যালু প্যাক
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 shrink-0">
                      ৳{threePcsSavings} ছাড়
                    </span>
                  </div>

                  <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                    ৩ পিস স্মার্ট প্যাক
                  </span>

                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base sm:text-lg font-black text-slate-950">৳{threePcsPrice}</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">৳{regularThreePcsPrice}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">যেকোনো ৩টি কালার</p>
                </div>

                {/* 2 Pcs Pack Card */}
                <div
                  onClick={() => {
                    onSelectPackage('two_pcs');
                    onScrollToOrder();
                  }}
                  className="cursor-pointer bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200 hover:border-slate-400 transition text-left group shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <span className="bg-slate-100 text-slate-700 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      ডুও প্যাক
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 shrink-0">
                      ৳{twoPcsSavings} ছাড়
                    </span>
                  </div>

                  <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                    ২ পিস ডুও প্যাক
                  </span>

                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base sm:text-lg font-black text-slate-950">৳{twoPcsPrice}</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">৳{regularTwoPcsPrice}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">যেকোনো ২টি কালার</p>
                </div>

                {/* Single Piece Card */}
                <div
                  onClick={() => {
                    onSelectPackage('single');
                    onScrollToOrder();
                  }}
                  className="cursor-pointer bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200 hover:border-slate-400 transition text-left group shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <span className="bg-slate-100 text-slate-700 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      ট্রায়াল
                    </span>
                    {singleSavings > 0 && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 shrink-0">
                        ৳{singleSavings} ছাড়
                      </span>
                    )}
                  </div>

                  <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                    ১ পিস ট্রায়াল
                  </span>

                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base sm:text-lg font-black text-slate-950">৳{singlePrice}</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">৳{regularSinglePrice}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">পছন্দের ১টি কালার</p>
                </div>

              </div>
            </div>

            {/* Solid Minimalist Primary CTA Button */}
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={onScrollToOrder}
                className="w-full flex-1 bg-slate-950 hover:bg-slate-900 text-white text-sm sm:text-base font-bold py-3.5 px-6 rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>অর্ডার করতে এগিয়ে যান</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Trust Badges - Clean Monochrome on Mobile */}
            <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-200/70 grid grid-cols-3 gap-1 sm:gap-2 text-center">
              <div className="flex flex-col items-center">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 mb-1" />
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-tight">ক্যাশ অন ডেলিভারি</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 leading-tight mt-0.5">হাতে পেয়ে পেমেন্ট</span>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 mb-1" />
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-tight">দেখে নেওয়ার সুযোগ</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 leading-tight mt-0.5">১০০% সন্তুষ্টি</span>
              </div>
              <div className="flex flex-col items-center">
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 mb-1" />
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-tight">সহজ এক্সচেঞ্জ</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 leading-tight mt-0.5">সাইজ পরিবর্তন</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
