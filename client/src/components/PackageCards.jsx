import React from 'react';
import { Check, Flame, Gift, Sparkles } from 'lucide-react';

export default function PackageCards({ product, selectedPackage, onSelectPackage, onScrollToOrder }) {
  const singlePrice = product?.singlePrice || 650;
  const regularSinglePrice = product?.regularSinglePrice || 850;
  const comboPrice = product?.comboPrice || 2000;
  const regularComboPrice = product?.regularComboPrice || 2600;

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-rose-600 font-bold text-xs uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">
            প্যাকেজ অফার ও প্রাইসিং
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            আপনার পছন্দের প্যাকেজটি নির্বাচন করুন
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            কম্বো প্যাকে পাচ্ছেন সর্বোচ্চ ডিসকাউন্ট ও ফ্রি হোম ডেলিভারি সুবিধা!
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          
          {/* Package 1: Single Piece Trial Pack */}
          <div
            onClick={() => {
              onSelectPackage('single');
              onScrollToOrder();
            }}
            className={`rounded-3xl p-6 sm:p-8 cursor-pointer transition-all duration-300 border-2 flex flex-col justify-between relative ${
              selectedPackage === 'single'
                ? 'border-slate-900 bg-slate-50/50 shadow-xl'
                : 'border-slate-200 bg-white hover:border-slate-400 shadow-sm'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    ট্রায়াল প্যাক
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">
                    ১ পিস প্রিমিয়াম বক্সার ব্রিফ
                  </h3>
                </div>
                {selectedPackage === 'single' && (
                  <span className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                    সিলেক্টেড
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">৳{singlePrice}</span>
                <span className="text-sm text-slate-400 line-through">৳{regularSinglePrice}</span>
                <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                  ৳{regularSinglePrice - singlePrice} সাশ্রয়
                </span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-600 mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>যেকোনো ১টি পছন্দের কালার নির্বাচন করার সুবিধা</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>১০০% আল্ট্রা-সফট ব্রিদেবল মাইক্রোমোডাল কটন</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ক্যাশ অন ডেলিভারি (পণ্য দেখে মূল্য পরিশোধ)</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-400">
                  <Check className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>ডেলিভারি চার্জ প্রযোজ্য (ঢাকা ৳৭০ / বাইরে ৳১৩০)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectPackage('single');
                onScrollToOrder();
              }}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white transition shadow"
            >
              ১ পিস অর্ডার করুন (৳{singlePrice})
            </button>
          </div>

          {/* Package 2: 4 Pcs Mega Combo Pack (Recommended) */}
          <div
            onClick={() => {
              onSelectPackage('combo');
              onScrollToOrder();
            }}
            className={`rounded-3xl p-6 sm:p-8 cursor-pointer transition-all duration-300 border-2 flex flex-col justify-between relative bg-gradient-to-b from-rose-50/70 via-white to-amber-50/40 shadow-xl ${
              selectedPackage === 'combo'
                ? 'border-rose-600 ring-2 ring-rose-500/30'
                : 'border-rose-300 hover:border-rose-500'
            }`}
          >
            {/* Top Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-black px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
              <Flame className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>সর্বাধিক জনপ্রিয় ও সাশ্রয়ী চয়েস (Best Value)</span>
            </div>

            <div>
              <div className="flex justify-between items-start mb-4 mt-2">
                <div>
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    মেগা কম্বো বক্স
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">
                    ৪ পিস প্রিমিয়াম বক্সার ব্রিফ কম্বো
                  </h3>
                </div>
                <span className="bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  {selectedPackage === 'combo' ? 'সিলেক্টেড 🔥' : 'অফার'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl sm:text-4xl font-black text-rose-600">৳{comboPrice}</span>
                <span className="text-sm text-slate-400 line-through">৳{regularComboPrice}</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  ৳{regularComboPrice - comboPrice} ফ্ল্যাট ডিসকাউন্ট
                </span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 mb-8">
                <li className="flex items-center gap-2.5 font-semibold text-rose-700">
                  <Gift className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>সারাদেশে হোম ডেলিভারি সম্পূর্ণ ফ্রি! (৳০ ডেলিভারি চার্জ)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>৪টি ভিন্ন ক্লাসিক কালার ভ্যারিয়েন্ট (Navy, Mint, Grey, Light Ash)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>প্রিমিয়াম লাক্সারি গিফট বক্স প্যাকেজিং সহ</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>১০০% কোয়ালিটি গ্যারান্টি ও ৭ দিনের ফ্রি এক্সচেঞ্জ</span>
                </li>
              </ul>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectPackage('combo');
                onScrollToOrder();
              }}
              className="w-full py-4 px-4 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white transition shadow-lg shadow-rose-600/30 transform active:scale-95 animate-pulse-glow"
            >
              মেগা কম্বো প্যাক অর্ডার করুন (৳{comboPrice})
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}

