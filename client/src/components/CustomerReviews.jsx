import React, { useState, useRef } from 'react';
import { Star, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomerReviews() {
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const carouselRef = useRef(null);

  const reviews = [
    {
      name: "মোঃ আরিফ হোসেন",
      rating: 5,
      date: "৩ দিন আগে",
      review: "ভাই আমি এর আগে বিভিন্ন ব্র্যান্ডের আন্ডারওয়্যার ব্যবহার করেছি, কিন্তু এই বক্সার ব্রিফটা সত্যিই অসাধারণ! সারাদিন বাইরে গরমে ঘুরেও একটুও ঘাম বা অস্বস্তি ফিল হয়নি। ফেব্রিকটা এত বেশি নরম যে গায়ে আছে বলেই মনে হয় না। ৪ পিসের কম্বোটা নিয়েছিলাম, ভ্যালু ফর মানি!",
      badge: "ভেরিফায়েড ক্রেতা"
    },
    {
      name: "তানভীর আহমেদ",
      rating: 5,
      date: "৫ দিন আগে",
      review: "সবচেয়ে বড় শান্তি হচ্ছে উরুতে কোনো ঘর্ষণ লাগে না আর কোমরে কোনো লাল দাগ ফেলে না। সাধারণ ইলাস্টিকে আমার কোমরে দাগ পড়ে যেতো, এইটার ইলাস্টিকটা সত্যিই খুব আরামদায়ক। ডেলিভারি দ্রুত পেয়েছি, ধন্যবাদ অনরাউন বিডিকে।",
      badge: "ভেরিফায়েড ক্রেতা"
    },
    {
      name: "কামরুল ইসলাম",
      rating: 5,
      date: "১ সপ্তাহ আগে",
      review: "প্রথমে ১ পিস ট্রায়াল হিসেবে নিয়েছিলাম। কোয়ালিটি দেখে মুগ্ধ হয়ে পরবর্তীতে আরও ৪ পিসের কম্বো বক্স অর্ডার দিয়েছি। কালারগুলো চমৎকার এবং ওয়াশ করার পরেও কাপড় একদম ঠিক থাকে। ১০০% রিকমেন্ডেড!",
      badge: "ভেরিফায়েড ক্রেতা"
    },
    {
      name: "রফিকুল ইসলাম",
      rating: 5,
      date: "২ সপ্তাহ আগে",
      review: "ফেব্রিক কোয়ালিটি সত্যি অনেক ভালো। সিমলেস ফিনিশিং এবং বাতাস চলাচল ভালো হওয়ায় গরমে দীর্ঘ সময় পরেও ঘাম হয় না। যারা ভালো মানের বক্সার খুঁজছেন তারা নিঃসন্দেহে নিতে পারেন।",
      badge: "ভেরিফায়েড ক্রেতা"
    }
  ];

  // Mobile Carousel Scroll Handler
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.offsetWidth * 0.82;
    const newIndex = Math.round(scrollLeft / (itemWidth + 14));
    const clamped = Math.max(0, Math.min(reviews.length - 1, newIndex));
    setActiveMobileIndex(clamped);
  };

  const scrollToIndex = (index) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const cards = container.children;
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
      setActiveMobileIndex(index);
    }
  };

  const handlePrev = () => {
    const nextIdx = Math.max(0, activeMobileIndex - 1);
    scrollToIndex(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = Math.min(reviews.length - 1, activeMobileIndex + 1);
    scrollToIndex(nextIdx);
  };

  return (
    <section className="py-10 sm:py-14 md:py-20 bg-[#FAFBFC] border-b border-slate-100 overflow-hidden">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold mb-2.5 shadow-2xs">
            <div className="flex gap-0.5 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-slate-800 font-bold ml-1">৪.৯/৫.০ রেটিং</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
            গ্রাহকদের বাস্তব অভিজ্ঞতা
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            সারাদেশে সন্তুষ্ট গ্রাহকদের আসল অনুভূতি
          </p>
        </div>

        {/* 1. MOBILE VIEW: Interactive Touch Carousel */}
        <div className="block md:hidden relative">
          
          {/* Swipeable Container */}
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-3 px-2 scrollbar-none scroll-smooth items-stretch"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {reviews.map((rev, index) => (
              <div
                key={index}
                className="w-[82vw] max-w-[290px] shrink-0 snap-center bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex gap-0.5 text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/60">
                      <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                      <span>{rev.badge}</span>
                    </span>
                  </div>

                  <p className="text-slate-700 text-xs sm:text-sm leading-relaxed mb-3">
                    "{rev.review}"
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{rev.name}</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-400">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Controls: Arrows & Indicators */}
          <div className="flex items-center justify-between mt-2.5 px-2">
            <button
              onClick={handlePrev}
              disabled={activeMobileIndex === 0}
              className="w-8 h-8 rounded-full bg-white border border-slate-300 text-slate-700 flex items-center justify-center shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed transition"
              aria-label="পূর্ববর্তী রিভিউ"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {reviews.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeMobileIndex === idx
                      ? 'w-5 bg-slate-950'
                      : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`রিভিউ ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={activeMobileIndex === reviews.length - 1}
              className="w-8 h-8 rounded-full bg-white border border-slate-300 text-slate-700 flex items-center justify-center shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed transition"
              aria-label="পরবর্তী রিভিউ"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
            সোয়াইপ করে গ্রাহক রিভিউ দেখুন
          </p>
        </div>

        {/* 2. DESKTOP VIEW: Clean 2-Column Grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-6">
          {reviews.map((rev, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{rev.badge}</span>
                  </span>
                </div>

                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed mb-5">
                  "{rev.review}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-slate-900 text-sm">{rev.name}</span>
                <span className="text-[11px] text-slate-400">{rev.date}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
