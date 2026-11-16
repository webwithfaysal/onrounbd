import React from 'react';
import { Printer, X, CheckCircle, Package, Download } from 'lucide-react';
import { generateInvoicePdf } from '../services/emailService';

export default function InvoiceModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Explicit Print isolation CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #invoice-printable-card, #invoice-printable-card * {
            visibility: visible !important;
          }
          #invoice-printable-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: white !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 print:m-0 print:p-0 print:border-none print:shadow-none">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex justify-between items-center mb-6 no-print print:hidden">
          <h3 className="font-extrabold text-slate-900 text-lg">
            চালান / ইনভয়েস প্রিভিউ
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>PDF ডাউনলোড</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="invoice-printable-card" className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 print:bg-white print:border-none print:p-0">
          
          {/* Header */}
          <div className="flex justify-between items-start pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                ONROUN <span className="text-rose-600">BD</span>
              </h2>
              <p className="text-xs text-slate-500">প্রিমিয়াম মেনস ইনারওয়্যার</p>
              <p className="text-[11px] text-slate-500">হটলাইন: 01711-223344</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white text-xs font-mono font-bold px-2.5 py-1 rounded">
                {order.id}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                তারিখ: {new Date(order.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Customer & Delivery Details */}
          <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
            <div>
              <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px]">
                গ্রাহকের বিবরণ:
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{order.customerName}</p>
              <p className="font-mono text-slate-700 font-semibold">{order.phone}</p>
              <p className="text-slate-600 mt-1 whitespace-pre-wrap">{order.address}</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px]">
                পেমেন্ট মেথড:
              </span>
              {(() => {
                const due = order.dueAmount !== undefined ? order.dueAmount : ((order.notes || '').match(/\[বকেয়া:\s*৳?(\d+)\]/) ? parseInt((order.notes || '').match(/\[বকেয়া:\s*৳?(\d+)\]/)[1]) : 0);
                const paid = order.paidAmount !== undefined ? order.paidAmount : Math.max(0, (order.totalPrice || 0) - due);
                if (due > 0) {
                  return (
                    <p className="font-bold text-amber-700 text-sm mt-0.5">
                      {paid > 0 ? `আংশিক জমা (বকেয়া: ৳${due})` : `সম্পূর্ণ বকেয়া (Due: ৳${due})`}
                    </p>
                  );
                }
                const method = order.paymentMethod || 'cod';
                const methodLabel = method === 'bkash' ? 'বিকাশ (bKash - পেইড)' : method === 'nagad' ? 'নগদ (Nagad - পেইড)' : method === 'bank' ? 'ব্যাংক ট্রান্সফার (পেইড)' : order.isManual ? 'ক্যাশ (পেইড)' : 'ক্যাশ অন ডেলিভারি (COD)';
                return <p className="font-bold text-emerald-700 text-sm mt-0.5">{methodLabel}</p>;
              })()}
              <p className="text-slate-500 text-[11px] mt-1">
                জোন: {order.deliveryZone === 'outside' ? 'সিলেটের বাইরে' : 'সিলেটের ভেতরে'}
              </p>
              {order.notes && (
                <p className="text-slate-600 text-[11px] mt-1 italic">নোট: {order.notes}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="py-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="pb-2">আইটেম ও কালার বিবরণ</th>
                  <th className="pb-2 text-center">সাইজ</th>
                  <th className="pb-2 text-center">পরিমাণ</th>
                  <th className="pb-2 text-right">মূল্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 font-semibold text-slate-800">
                    <span className="font-bold text-slate-900 block text-sm">
                      {order.packageType === 'combo'
                        ? 'প্রিমিয়াম বক্সার ব্রিফ (৪ পিস মেগা কম্বো প্যাক)'
                        : order.packageType === 'three_pcs'
                        ? 'প্রিমিয়াম বক্সার ব্রিফ (৩ পিস ভ্যালু প্যাক)'
                        : order.packageType === 'two_pcs'
                        ? 'প্রিমিয়াম বক্সার ব্রিফ (২ পিস স্মার্ট প্যাক)'
                        : 'প্রিমিয়াম বক্সার ব্রিফ (১ পিস ট্রায়াল প্যাক)'}
                    </span>
                    
                    {/* Item color breakdown */}
                    <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-600 font-normal">
                      {order.orderItems && order.orderItems.length > 0 ? (
                        order.orderItems.map((itm, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span>•</span>
                            <span>{itm.name} — সাইজ {itm.size} (×{itm.qty})</span>
                          </div>
                        ))
                      ) : order.packageType === 'combo' ? (
                        <>
                          <div>• ১টি ক্লাসিক নেভি ব্লু — সাইজ {order.selectedSize}</div>
                          <div>• ১টি সতেজ মিন্ট গ্রিন — সাইজ {order.selectedSize}</div>
                          <div>• ১টি চারকোল গ্রে — সাইজ {order.selectedSize}</div>
                          <div>• ১টি লাইট অ্যাশ গ্রে — সাইজ {order.selectedSize}</div>
                        </>
                      ) : (
                        <div>• ১টি {order.selectedColor} — সাইজ {order.selectedSize}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-center font-bold text-slate-900 align-top">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">{order.selectedSize}</span>
                  </td>
                  <td className="py-3 text-center font-bold text-slate-900 align-top">
                    {order.packageType === 'combo' 
                      ? `${order.quantity} বক্স (${order.quantity * 4} পিস)` 
                      : order.packageType === 'three_pcs'
                      ? `${order.quantity} প্যাক (${order.quantity * 3} পিস)`
                      : order.packageType === 'two_pcs'
                      ? `${order.quantity} প্যাক (${order.quantity * 2} পিস)`
                      : `${order.quantity} পিস`}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900 align-top text-sm">
                    ৳{order.itemPrice}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculation */}
          <div className="pt-2 border-t border-slate-200 text-xs space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>সাবটোটাল:</span>
              <span className="font-semibold text-slate-800">৳{order.itemPrice}</span>
            </div>
            <div className="flex justify-between">
              <span>ডেলিভারি চার্জ:</span>
              <span className="font-semibold text-slate-800">
                {order.deliveryCharge === 0 ? 'ফ্রি (৳০)' : `৳${order.deliveryCharge}`}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
              <span>মোট অর্ডারের মূল্য:</span>
              <span className="text-slate-900 text-base">৳{order.totalPrice}</span>
            </div>

            {/* Payment & Due breakdown if applicable */}
            {(() => {
              const due = order.dueAmount !== undefined ? order.dueAmount : ((order.notes || '').match(/\[বকেয়া:\s*৳?(\d+)\]/) ? parseInt((order.notes || '').match(/\[বকেয়া:\s*৳?(\d+)\]/)[1]) : 0);
              const paid = order.paidAmount !== undefined ? order.paidAmount : Math.max(0, (order.totalPrice || 0) - due);
              if (due > 0) {
                return (
                  <div className="pt-2 mt-1 border-t border-dashed border-amber-300 bg-amber-50 p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-emerald-800 text-xs">
                      <span>পরিশোধিত / অগ্রিম জমা:</span>
                      <span>৳{paid}</span>
                    </div>
                    <div className="flex justify-between font-black text-rose-700 text-sm pt-1 border-t border-amber-200">
                      <span>অবশিষ্ট বকেয়া টাকা (Due):</span>
                      <span className="text-base font-black">৳{due}</span>
                    </div>
                  </div>
                );
              }
              return (
                <div className="pt-1.5 flex justify-between items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                  <span>পেমেন্ট স্ট্যাটাস:</span>
                  <span>✓ সম্পূর্ণ পরিশোধিত (পেইড)</span>
                </div>
              );
            })()}
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400">
            ধন্যবাদ অনরাউন বিডি থেকে কেনাকাটা করার জন্য। পার্সেল ডেলিভারি সংক্রান্ত যেকোনো প্রয়োজনে কল করুন 01711-223344
          </div>

        </div>

      </div>
    </div>
  );
}

