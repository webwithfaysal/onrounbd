import React from 'react';
import { Phone, Mail, MapPin, ShieldCheck, Truck, Search } from 'lucide-react';

export default function Footer({ onOpenTrackOrder, settings }) {
  const hotline = settings?.hotline || "01711-223344";
  const address = settings?.address || "সিলেট সদর, সিলেট";

  return (
    <footer className="bg-slate-950 text-slate-400 pt-12 pb-24 md:pb-12 border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Col 1: Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3.5">
              <div className="bg-white px-2.5 py-1 rounded-xl flex items-center justify-center shadow-xs">
                <img src="/images/logo.png" alt="ONROUN" className="h-6 w-auto object-contain" />
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-4">
              বাংলাদেশের আধুনিক পুরুষদের জন্য সেরা মানের প্রিমিয়াম মাইক্রোমোডাল সিমলেস বক্সার ব্রিফ। সর্বোচ্চ আরাম ও দীর্ঘস্থায়িত্বের নিশ্চয়তা নিয়ে আমরা সারাদেশে ক্যাশ অন ডেলিভারি সেবা প্রদান করছি।
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-slate-400" />
                ফাস্ট হোম ডেলিভারি
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                ১০০% কোয়ালিটি গ্যারান্টি
              </span>
            </div>
          </div>

          {/* Col 2: Support & Contact */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">
              কাস্টমার সাপোর্ট
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <a href={`tel:${hotline.replace(/[^0-9]/g, '')}`} className="hover:text-white transition">{hotline}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>support@onrounbd.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{address}</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">
              প্রয়োজনীয় তথ্য
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-400">ক্যাশ অন ডেলিভারি উপলব্ধ</span>
              </li>
              <li>
                <span className="text-slate-400">ফ্রি সাইজ এক্সচেঞ্জ সুবিধা</span>
              </li>
              <li>
                <span className="text-slate-400">দেখে নেওয়ার শতভাগ নিশ্চয়তা</span>
              </li>
              {onOpenTrackOrder && (
                <li className="pt-2">
                  <button
                    onClick={onOpenTrackOrder}
                    className="inline-flex items-center gap-1.5 text-slate-200 hover:text-white transition text-xs font-medium cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>পার্সেল ট্র্যাক করুন</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <span>&copy; ২০২৬ Onroun BD. সর্বস্বত্ব সংরক্ষিত।</span>
          <span>Designed with care</span>
        </div>

      </div>
    </footer>
  );
}
