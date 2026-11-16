import React from 'react';
import { Wind, Shield, Sparkles, Feather, HeartHandshake, RefreshCw } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Feather,
      title: "মাখনের মতো মসৃণ ও নরম ফেব্রিক",
      desc: "১০০% প্রিমিয়াম মাইক্রোমোডাল ও কম্বড কটনের মিশ্রণে তৈরি, যা পরলে মনেই হবে না আপনি কিছু পরে আছেন।"
    },
    {
      icon: Wind,
      title: "নো-সুইট এয়ারফ্লো টেকনোলজি",
      desc: "উন্নত ব্রিদেবল ম্যাটেরিয়াল যা বাতাস চলাচল নিশ্চিত করে এবং দীর্ঘ সময় অফিসে বা গরমেও ঘামহীন রাখে।"
    },
    {
      icon: Shield,
      title: "অ্যান্টি-চ্যাফিং নো-ফ্রিকশন ডিজাইন",
      desc: "উরু ও কুঁচকির অংশে বিশেষ সিমলেস কাটিং, যা হাঁটাচলা বা দৌড়াদৌড়ির সময় ঘর্ষণ ও ছিলে যাওয়া থেকে রক্ষা করে।"
    },
    {
      icon: Sparkles,
      title: "দাগহীন নন-রোলিং কোমর ব্যান্ড",
      desc: "উচ্চমানের স্ট্রেচেবল মাইক্রোফাইবার ইলাস্টিক যা পেটের সাথে মুড়ে যায় না এবং কোনো কালো দাগ ফেলে না।"
    },
    {
      icon: HeartHandshake,
      title: "অ্যান্টি-ব্যাকটেরিয়াল ও স্কিন ফ্রেন্ডলি",
      desc: "ত্বকের জন্য শতভাগ নিরাপদ। ব্যাক্টেরিয়া ও ফাঙ্গাস বংশবৃদ্ধি করতে পারে না, ফলে থাকে না কোনো দুর্গন্ধ বা চুলকানি।"
    },
    {
      icon: RefreshCw,
      title: "লং লাস্টিং পারফেক্ট ফিটিং",
      desc: "১০০ বারের বেশি ওয়াশ করার পরেও ফেব্রিকের কোমলতা ও পারফেক্ট শেইপ অপরিবর্তিত থাকে।"
    }
  ];

  return (
    <section className="py-10 sm:py-14 md:py-20 bg-[#FAFBFC] border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold mb-2.5 border border-slate-200/60">
            <span>প্রিমিয়াম কোয়ালিটি ফিচারস</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
            প্রতিটি খুঁটিনাটিতে নিখুঁত ছোঁয়া
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            দৈনন্দিন ব্যবহারের জন্য প্রিমিয়াম কমফোর্ট ও আন্তর্জাতিক মানের ফিনিশিং।
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all duration-200"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mb-3 sm:mb-4 border border-slate-200/60">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
