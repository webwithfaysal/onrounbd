import React from 'react';
import { Ruler, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react';

export default function SizeChart({ onScrollToOrder }) {
  const chartData = [
    {
      size: "M",
      waist: "২৯ - ৩১ ইঞ্চি",
      weight: "৫০ - ৬০ কেজি",
      fit: "রেগুলার"
    },
    {
      size: "L",
      waist: "৩২ - ৩৪ ইঞ্চি",
      weight: "৬১ - ৭০ কেজি",
      fit: "পারফেক্ট"
    },
    {
      size: "XL",
      waist: "৩৫ - ৩৭ ইঞ্চি",
      weight: "৭১ - ৮০ কেজি",
      fit: "কমফোর্ট"
    },
    {
      size: "XXL",
      waist: "৩৮ - ৪০ ইঞ্চি",
      weight: "৮১ - ৯৫+ কেজি",
      fit: "রিলাক্সড"
    }
  ];

  return (
    <section className="py-10 sm:py-14 md:py-20 bg-white border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-3.5 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold mb-2.5 border border-slate-200/60">
            <Ruler className="w-3.5 h-3.5 text-slate-700" />
            <span>সাইজ নির্বাচন গাইড</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
            সাইজ ও পরিমাপ চার্ট
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            কোমরের মাপ ও শারীরিক ওজন অনুযায়ী সঠিক সাইজ বেছে নিন
          </p>
        </div>

        {/* Clean Size Chart Table Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden mb-5 sm:mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-[11px] sm:text-sm font-bold">
                <th className="py-3 px-3 sm:px-6 text-center w-14 sm:w-24">সাইজ</th>
                <th className="py-3 px-2.5 sm:px-6">কোমর পরিমাপ</th>
                <th className="py-3 px-3 sm:px-6 text-right">সম্ভাব্য ওজন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {chartData.map((row) => (
                <tr
                  key={row.size}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  {/* Size Badge */}
                  <td className="py-2.5 sm:py-3.5 px-3 sm:px-6 text-center">
                    <span className="inline-flex w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-950 text-white font-extrabold text-xs sm:text-sm items-center justify-center">
                      {row.size}
                    </span>
                  </td>

                  {/* Waist Measurement */}
                  <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-6 font-bold text-slate-900">
                    <span className="text-slate-950 font-extrabold text-xs sm:text-base block sm:inline">{row.waist}</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal sm:ml-1.5">({row.fit})</span>
                  </td>

                  {/* Body Weight */}
                  <td className="py-2.5 sm:py-3.5 px-3 sm:px-6 text-right font-bold text-slate-800">
                    <span className="bg-slate-100 border border-slate-200/70 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl inline-block text-[11px] sm:text-sm">
                      {row.weight}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Measurement Tips & Exchange Guarantee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-[#FAFBFC] border border-slate-200/80 p-3.5 sm:p-5 rounded-2xl flex items-start gap-2.5 sm:gap-3">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900 block mb-0.5">সাইজ বোঝার সহজ টিপস</span>
              কোমরের মাপ অনুযায়ী সাইজ বেছে নিন। কিছুটা ঢিলেঢালা পরতে পছন্দ করলে ১ সাইজ বড় অর্ডার করতে পারেন।
            </div>
          </div>

          <div className="bg-[#FAFBFC] border border-slate-200/80 p-3.5 sm:p-5 rounded-2xl flex items-start gap-2.5 sm:gap-3">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900 block mb-0.5">১০০% সাইজ এক্সচেঞ্জ সুবিধা</span>
              ডেলিভারি পাওয়ার পর সাইজ সমস্যা হলে দুশ্চিন্তার কিছু নেই। দ্রুত জানালে ফ্রিতে সাইজ পরিবর্তন করে দেওয়া হবে।
            </div>
          </div>
        </div>

        {/* Scroll to Order CTA */}
        {onScrollToOrder && (
          <div className="mt-6 sm:mt-8 text-center">
            <button
              onClick={onScrollToOrder}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-2xl shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <span>পছন্দের সাইজ দিয়ে অর্ডার করুন</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
