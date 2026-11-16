import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton({ phone = "01711223344" }) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const internationalPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
  const message = encodeURIComponent("হ্যালো, আমি অনরাউন বিডির প্রিমিয়াম বক্সার ব্রিফ অফার সম্পর্কে বিস্তারিত জানতে ও অর্ডার করতে চাই।");
  const waUrl = `https://wa.me/${internationalPhone}?text=${message}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center group"
      title="সরাসরি হোয়াটসঅ্যাপে চ্যাট করুন"
    >
      <MessageCircle className="w-6 h-6 fill-white" />
      
      {/* Tooltip on desktop */}
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold px-0 group-hover:px-2">
        হোয়াটসঅ্যাপে চ্যাট করুন
      </span>

      {/* Online indicator ping */}
      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-300 rounded-full animate-ping opacity-75" />
      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
    </a>
  );
}

