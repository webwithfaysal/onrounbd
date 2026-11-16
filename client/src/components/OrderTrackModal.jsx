import React, { useState } from 'react';
import { Search, X, CheckCircle2, Clock, Truck, Package, AlertCircle } from 'lucide-react';

export default function OrderTrackModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const statusSteps = [
    { key: 'pending', label: 'অর্ডার গৃহীত', desc: 'আপনার অর্ডারটি আমাদের সিস্টেমে সফলভাবে জমা হয়েছে।' },
    { key: 'confirmed', label: 'অর্ডার কনফার্মড', desc: 'প্রতিনিধি ফোনে যোগাযোগ করে অর্ডার কনফার্ম করেছেন।' },
    { key: 'shipping', label: 'কুরিয়ারে পাঠানো হয়েছে', desc: 'পার্সেলটি কুরিয়ারে বুকিং দেওয়া হয়েছে, ডেলিভারির পথে।' },
    { key: 'delivered', label: 'সফল ডেলিভারি', desc: 'পার্সেলটি গ্রাহক হাতে পেয়েছেন।' }
  ];

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      let foundOrder = null;
      try {
        const res = await fetch(`/api/orders/track?query=${encodeURIComponent(query.trim())}`);
        const ct = res.headers.get('content-type');
        if (res.ok && ct && ct.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.order) {
            foundOrder = data.order;
          }
        }
      } catch (e) {}

      if (!foundOrder) {
        const local = JSON.parse(localStorage.getItem('onroun_orders') || '[]');
        const q = query.trim().toLowerCase();
        foundOrder = local.find(o => 
          (o.id && o.id.toLowerCase() === q) || 
          (o.phone && o.phone.includes(q))
        );
      }

      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setError('এই নম্বরে বা আইডিতে কোনো অর্ডার পাওয়া যায়নি।');
      }
    } catch (err) {
      console.error(err);
      setError('ট্র্যাকিং করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status) => {
    if (status === 'cancelled') return -1;
    const idx = statusSteps.findIndex(s => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-slate-900 mb-1">
          অর্ডার ট্র্যাকিং
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          আপনার অর্ডার আইডি (যেমন: ORD-1001) অথবা ব্যবহৃত ১১ ডিজিটের মোবাইল নম্বর দিন।
        </p>

        {/* Search Form */}
        <form onSubmit={handleTrack} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="অর্ডার আইডি বা মোবাইল নম্বর"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition active:scale-95 disabled:opacity-50"
          >
            {loading ? 'খুঁজছে...' : 'ট্র্যাক'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl flex items-center gap-2 border border-red-200 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Order Details & Timeline */}
        {order && (
          <div className="space-y-6 pt-2 border-t border-slate-100">
            
            {/* Header info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">অর্ডার আইডি:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{order.id}</span>
                <span className="block text-slate-500 mt-0.5">{order.customerName}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">মোট প্রদেয় টাকা:</span>
                <span className="font-black text-rose-600 text-base">৳{order.totalPrice}</span>
                <span className="block text-emerald-600 font-medium text-[11px]">ক্যাশ অন ডেলিভারি</span>
              </div>
            </div>

            {/* Cancelled notice if cancelled */}
            {order.status === 'cancelled' ? (
              <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-200 text-xs font-semibold text-center">
                এই অর্ডারটি বাতিল করা হয়েছে। বিস্তারিত জানতে আমাদের হটলাইনে যোগাযোগ করুন।
              </div>
            ) : (
              /* Step Timeline */
              <div className="space-y-4 px-2">
                {statusSteps.map((step, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={step.key} className="flex items-start gap-3 relative">
                      {idx !== statusSteps.length - 1 && (
                        <div
                          className={`absolute left-3.5 top-7 bottom-0 w-0.5 -ml-px ${
                            idx < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      )}
                      
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs ${
                          isDone
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>

                      <div className="flex-1">
                        <span
                          className={`text-xs font-bold block ${
                            isCurrent
                              ? 'text-rose-600'
                              : isDone
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label} {isCurrent && '(বর্তমান স্ট্যাটাস)'}
                        </span>
                        <span className="text-[11px] text-slate-500 leading-relaxed block">
                          {step.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 text-center text-xs text-slate-500">
              জরুরি প্রয়োজনে সরাসরি কল করুন: <a href="tel:01711223344" className="font-bold text-rose-600 hover:underline">01711-223344</a>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

