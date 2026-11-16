import React from 'react';
import { XCircle, CheckCircle, Flame, ShieldAlert, Award } from 'lucide-react';

export default function WhyChooseUs({ onScrollToOrder }) {
  const comparisonData = [
    {
      bad: "সাধারণ সুতি বা সিন্থেটিক কাপড় যাতে প্রচুর ঘাম জমে ও স্যাঁতসেঁতে হয়ে থাকে।",
      good: "মাইক্রো-মেশ এয়ারফ্লো টেকনোলজি যা তাৎক্ষণিক ঘাম শুষে ত্বক সবসময় শুষ্ক ও সতেজ রাখে।"
    },
    {
      bad: "হাঁটাহাঁটি বা কাজ করার সময় উরুতে অনবরত ঘর্ষণ লেগে চামড়া ছিলে যায় ও জ্বালাপোড়া করে।",
      good: "অ্যান্টি-চ্যাফিং সিমলেস কাটিং, যা উরুর ঘর্ষণ সম্পূর্ণ দূর করে শতভাগ আরাম দেয়।"
    },
    {
      bad: "শক্ত ও মোটা ইলাস্টিকের কারণে কোমরে চাপ ও কালচে বা লাল দাগ পড়ে যায়।",
      good: "আল্ট্রা-সফট নন-রোলিং মাইক্রোফাইবার কোমর ব্যান্ড, যা কোনো দাগ বা অস্বস্তি তৈরি করে না।"
    },
    {
      bad: "বারবার ব্যবহারের পর কাপড় ঢিলেঢালা হয়ে যায়, রাবার ফেঁপে যায় এবং রঙ নষ্ট হয়।",
      good: "৪-ওয়ে স্ট্রেচেবল মেটেরিয়াল ও প্রিমিয়াম ডাইং, যা ১০০+ ওয়াশেও নতুনের মতো ফিটিং ধরে রাখে।"
    },
    {
      bad: "গরমে ব্যাক্টেরিয়া জন্মে চুলকানি ও দুর্গন্ধের অস্বস্তিকর সমস্যায় পড়তে হয়।",
      good: "অ্যান্টি-ব্যাকটেরিয়াল প্রোটেকশন যুক্ত স্কিন-ফ্রেন্ডলি কাপড় যা দুর্গন্ধ ও অ্যালার্জি প্রতিরোধ করে।"
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>কেন এই বক্সার ব্রিফ অনন্য?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            সাধারণ আন্ডারওয়্যার বনাম আমাদের প্রিমিয়াম বক্সার ব্রিফ
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            সারাদিনের আরামের প্রশ্নে কোনো আপস নয়! নিজেই দেখে নিন পার্থক্যটি।
          </p>
        </div>

        {/* Comparison Table / Cards */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 text-center text-sm font-bold border-b border-slate-200">
            <div className="bg-red-50 text-red-700 py-3.5 px-4 flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>বাজারে প্রচলিত সাধারণ আন্ডারওয়্যার</span>
            </div>
            <div className="bg-emerald-50 text-emerald-800 py-3.5 px-4 flex items-center justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-200">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>আমাদের প্রিমিয়াম কোয়ালিটি বক্সার ব্রিফ</span>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {comparisonData.map((row, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 text-xs sm:text-sm">
                {/* Bad side */}
                <div className="p-4 bg-red-50/20 flex items-start gap-2.5">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600 leading-relaxed">{row.bad}</span>
                </div>
                {/* Good side */}
                <div className="p-4 bg-emerald-50/30 flex items-start gap-2.5 md:border-l border-slate-200">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-800 font-medium leading-relaxed">{row.good}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Callout */}
        <div className="mt-8 text-center">
          <button
            onClick={onScrollToOrder}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base py-3 px-6 rounded-2xl shadow-md transition transform hover:scale-105 active:scale-95"
          >
            <span>সেরা আরাম পেতে এখনই অর্ডার করুন</span>
            <span>&rarr;</span>
          </button>
        </div>

      </div>
    </section>
  );
}

