import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQ({ product }) {
  const [openIndex, setOpenIndex] = useState(0);

  const comboPrice = product?.comboPrice || 2000;
  const twoPcsPrice = product?.twoPcsPrice || 1200;
  const threePcsPrice = product?.threePcsPrice || 1500;
  const comboQty = product?.comboQuantity || 4;
  const freeDeliveryText = product?.comboFreeDelivery ? ' ও ফ্রি হোম ডেলিভারিসহ' : '';

  const faqs = [
    {
      q: "আমি কি পার্সেল রিসিভ করার আগে দেখে নিতে পারব?",
      a: "হ্যাঁ, অবশ্যই! ডেলিভারিম্যানের সামনে আপনি প্যাকেট খুলে কোয়ালিটি ও কালার দেখে নিশ্চিত হয়ে তারপর মূল্য পরিশোধ করবেন।"
    },
    {
      q: "ডেলিভারি পেতে কতদিন সময় লাগবে?",
      a: "সিলেটের ভেতরে ২৪ ঘণ্টার মধ্যে এবং সিলেটের বাইরে ২ থেকে ৩ দিনের মধ্যে আপনার ঠিকানায় সরাসরি হোম ডেলিভারি পৌঁছে দেওয়া হবে।"
    },
    {
      q: "সাইজ যদি ঠিক না হয় তাহলে কি পরিবর্তন করা যাবে?",
      a: "জী, সাইজ নিয়ে কোনো সমস্যা হলে ডেলিভারি পাওয়ার পর দ্রুত আমাদের হটলাইনে জানালে আমরা সম্পূর্ণ ফ্রিতে আপনার পছন্দের সাইজ এক্সচেঞ্জ করে দেব।"
    },
    {
      q: "কম্বো ও অন্যান্য প্যাকেজে কালার কিভাবে নির্বাচন করব?",
      a: `আমাদের ${comboQty} পিস মেগা কম্বো প্যাকে থাকছে ছবির ৪টি ভিন্ন ভিন্ন প্রিমিয়াম কালার (Navy Blue, Mint Green, Charcoal Grey, Light Ash Grey) গিফট বক্স${freeDeliveryText}। এছাড়া আপনি চাইলে ২ পিস ডুও প্যাকে (৳${twoPcsPrice}) যেকোনো ২টি কালার এবং ৩ পিস স্মার্ট প্যাকে (৳${threePcsPrice}) যেকোনো ৩টি কালার নিজের পছন্দমতো বেছে নিতে পারবেন।`
    },
    {
      q: "এটি কিভাবে ধোয়া বা যত্ন নেওয়া উচিত?",
      a: "স্বাভাবিক পানিতে হাতে বা ওয়াশিং মেশিনে ধোয়া যাবে। তবে ব্লিচ ব্যবহার করবেন না এবং অতিরিক্ত তাপে ইস্ত্রি করা পরিহার করুন যাতে ফেব্রিকের কোমলতা দীর্ঘস্থায়ী থাকে।"
    }
  ];

  return (
    <section className="py-14 md:py-20 bg-white border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3.5 py-1 rounded-full text-xs font-semibold mb-3 border border-slate-200/60">
            <HelpCircle className="w-3.5 h-3.5 text-slate-700" />
            <span>সচরাচর জিজ্ঞাসা</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
            সাধারণ প্রশ্ন ও উত্তর (FAQ)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            অর্ডার করার আগে আপনার মনের সকল প্রশ্নের সহজ উত্তর
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/60 transition cursor-pointer"
                >
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-slate-900' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
