import React, { useState } from 'react';
import { CheckCircle2, Phone, Copy, Check, Download } from 'lucide-react';
import { generateInvoicePdf } from '../services/emailService';

export default function OrderSuccessModal({ order, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    try {
      const blob = generateInvoicePdf(order);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl border border-slate-200 relative text-center my-4 sm:my-8">
        
        {/* Success Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3.5 sm:mb-4 border border-emerald-100">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-950 mb-1">
          অভিনন্দন! অর্ডার সফল হয়েছে
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-5">
          আমাদের কাস্টমার কেয়ার টিম শীঘ্রই ফোন করে অর্ডারটি নিশ্চিত করবে।
        </p>

        {/* Order Details Card */}
        <div className="bg-[#FAFBFC] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200 text-left mb-4 sm:mb-6 space-y-2 text-xs sm:text-sm">
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
            <span className="text-slate-500 font-medium">অর্ডার আইডি:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-xs sm:text-sm">
                {order.id}
              </span>
              <button
                onClick={handleCopyOrderId}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                title="কপি করুন"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">গ্রাহকের নাম:</span>
            <span className="font-bold text-slate-900">{order.customerName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">মোবাইল নম্বর:</span>
            <span className="font-bold text-slate-900 font-mono">{order.phone}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">প্যাকেজ:</span>
            <span className="font-bold text-slate-900">
              {order.packageType === 'combo' 
                ? '৪ পিস মেগা কম্বো' 
                : order.packageType === 'three_pcs'
                ? '৩ পিস স্মার্ট প্যাক'
                : order.packageType === 'two_pcs'
                ? '২ পিস ডুও প্যাক'
                : '১ পিস ট্রায়াল'} ({order.quantity}টি)
            </span>
          </div>

          {order.selectedColor && order.packageType !== 'combo' && (
            <div className="flex justify-between">
              <span className="text-slate-500">কালার:</span>
              <span className="font-bold text-slate-800">{order.selectedColor}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-slate-500">নির্বাচিত সাইজ:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">{order.selectedSize}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">ডেলিভারি ঠিকানা:</span>
            <span className="font-medium text-slate-800 text-right max-w-[200px] truncate">{order.address}</span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex justify-between items-baseline font-bold">
            <span className="text-slate-900">মোট প্রদেয় (ক্যাশ অন ডেলিভারি):</span>
            <span className="text-lg sm:text-xl font-black text-slate-950">৳{order.totalPrice}</span>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 mb-2.5">
          <button
            onClick={handleDownloadPdf}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ইনভয়েস PDF ডাউনলোড</span>
          </button>
          <a
            href="tel:01711223344"
            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
          >
            <Phone className="w-4 h-4 text-slate-700" />
            <span>হটলাইনে কল করুন</span>
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
        >
          বন্ধ করুন
        </button>

      </div>
    </div>
  );
}
