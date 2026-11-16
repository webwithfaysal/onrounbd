import React, { useState } from 'react';
import {
  X,
  Phone,
  MapPin,
  Calendar,
  Package,
  Tag,
  FileText,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  RotateCcw,
  AlertCircle,
  Edit3,
  Save,
  Check,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { updateOrder } from '../services/firebaseDb';

export default function OrderDetailsModal({
  order,
  product,
  onClose,
  onOpenInvoice,
  onStatusChange,
  onUpdateOrder,
  updatingId
}) {
  if (!order) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Local state for editing
  const [formData, setFormData] = useState({
    customerName: order.customerName || '',
    phone: order.phone || '',
    address: order.address || '',
    deliveryZone: order.deliveryZone || 'inside',
    packageType: order.packageType || 'combo',
    selectedSize: order.selectedSize || 'L',
    selectedColor: order.selectedColor || 'navy',
    quantity: order.quantity || 1,
    itemPrice: order.itemPrice ?? 2000,
    deliveryCharge: order.deliveryCharge ?? 0,
    totalPrice: order.totalPrice ?? 2000,
    paymentStatus: order.paymentStatus || ((parseInt(order.dueAmount) || 0) > 0 ? ((parseInt(order.paidAmount) || 0) > 0 ? 'partial' : 'due') : 'paid'),
    paidAmount: order.paidAmount !== undefined ? order.paidAmount : ((parseInt(order.dueAmount) || 0) > 0 ? Math.max(0, (order.totalPrice || 0) - order.dueAmount) : (order.totalPrice || 0)),
    dueAmount: order.dueAmount !== undefined ? order.dueAmount : 0,
    paymentMethod: order.paymentMethod || 'cash',
    status: order.status || 'pending',
    notes: order.notes || ''
  });

  const [collectAmount, setCollectAmount] = useState('');
  const [showCollectInput, setShowCollectInput] = useState(false);

  const statusMap = {
    pending: { label: 'নতুন অর্ডার (পেন্ডিং)', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
    confirmed: { label: 'কনফার্মড', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
    shipping: { label: 'কুরিয়ারে পাঠানো হয়েছে', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Truck },
    delivered: { label: 'সফল ডেলিভারি', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
    cancelled: { label: 'বাতিল (ক্যানসেল)', color: 'bg-rose-100 text-rose-800 border-rose-300', icon: XCircle },
    returned: { label: 'রিটার্ন (পার্সেল ফেরত)', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: RotateCcw }
  };

  const stObj = statusMap[order.status] || statusMap.pending;
  const StatusIcon = stObj.icon;

  const getPackageLabel = (pkg) => {
    return pkg === 'combo'
      ? '৪ পিস মেগা কম্বো প্যাক'
      : pkg === 'three_pcs'
      ? '৩ পিস ভ্যালু প্যাক'
      : pkg === 'two_pcs'
      ? '২ পিস স্মার্ট প্যাক'
      : '১ পিস ট্রায়াল প্যাক';
  };

  const availableSizes = product?.sizes?.map(s => s.id) || ['M', 'L', 'XL', '2XL'];

  const handlePriceChange = (field, val) => {
    const raw = val === '' ? '' : Math.max(0, parseInt(val) || 0);
    const updated = { ...formData, [field]: raw };
    const pNum = field === 'itemPrice' ? (parseInt(raw) || 0) : (parseInt(formData.itemPrice) || 0);
    const dNum = field === 'deliveryCharge' ? (parseInt(raw) || 0) : (parseInt(formData.deliveryCharge) || 0);
    const newTotal = pNum + dNum;
    updated.totalPrice = newTotal;

    // Recalculate due if paid amount is set
    if (updated.paymentStatus === 'paid') {
      updated.paidAmount = newTotal;
      updated.dueAmount = 0;
    } else if (updated.paymentStatus === 'due') {
      updated.paidAmount = 0;
      updated.dueAmount = newTotal;
    } else {
      const curPaid = parseInt(updated.paidAmount) || 0;
      updated.dueAmount = Math.max(0, newTotal - curPaid);
    }
    setFormData(updated);
  };

  const handlePaidAmountChange = (val) => {
    const rawPaid = val === '' ? '' : Math.max(0, parseInt(val) || 0);
    const tot = parseInt(formData.totalPrice) || 0;
    const pNum = parseInt(rawPaid) || 0;
    const due = Math.max(0, tot - pNum);
    let st = 'partial';
    if (pNum >= tot) st = 'paid';
    else if (pNum === 0) st = 'due';

    setFormData({
      ...formData,
      paidAmount: rawPaid,
      dueAmount: due,
      paymentStatus: st
    });
  };

  const handleMarkDueAsFullyPaid = async () => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে অর্ডার #${order.id}-এর বকেয়া ৳${order.dueAmount} সম্পূর্ণ পরিশোধ হয়েছে?`)) return;

    setSaveLoading(true);
    try {
      const tot = order.totalPrice || 0;
      const cleanNotes = (order.notes || '').replace(/\[বকেয়া:.*?\]/g, '').trim();
      const updatedOrder = {
        ...order,
        paymentStatus: 'paid',
        paidAmount: tot,
        dueAmount: 0,
        notes: cleanNotes ? `${cleanNotes} [বকেয়া পরিশোধিত]` : '[বকেয়া পরিশোধিত]'
      };

      if (onUpdateOrder) {
        await onUpdateOrder(updatedOrder);
      } else {
        await updateOrder(updatedOrder, order);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCollectPartialAmount = async (e) => {
    e.preventDefault();
    const addAmt = parseInt(collectAmount) || 0;
    if (addAmt <= 0) return;

    const curPaid = parseInt(order.paidAmount) || 0;
    const newPaid = curPaid + addAmt;
    const tot = order.totalPrice || 0;
    const newDue = Math.max(0, tot - newPaid);
    const newStatus = newDue === 0 ? 'paid' : 'partial';

    setSaveLoading(true);
    try {
      const cleanNotes = (order.notes || '').replace(/\[বকেয়া:.*?\]/g, '').trim();
      const noteAdd = newDue > 0 ? `[বকেয়া: ৳${newDue}]` : '[বকেয়া পরিশোধিত]';
      const updatedOrder = {
        ...order,
        paymentStatus: newStatus,
        paidAmount: newPaid,
        dueAmount: newDue,
        notes: cleanNotes ? `${cleanNotes} ${noteAdd}` : noteAdd
      };

      if (onUpdateOrder) {
        await onUpdateOrder(updatedOrder);
      } else {
        await updateOrder(updatedOrder, order);
      }
      setCollectAmount('');
      setShowCollectInput(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.customerName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMsg('গ্রাহকের নাম, ফোন নম্বর ও পূর্ণ ঠিকানা আবশ্যক।');
      return;
    }

    let cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('8801') && cleanPhone.length === 13) {
      cleanPhone = cleanPhone.slice(2);
    }
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      setErrorMsg('সঠিক ১১ ডিজিটের ফোন নম্বর দিন (যেমন: 017XXXXXXXX)।');
      return;
    }

    setSaveLoading(true);

    try {
      const itemP = parseInt(formData.itemPrice) || 0;
      const delP = parseInt(formData.deliveryCharge) || 0;
      const totP = itemP + delP;
      const paidP = formData.paymentStatus === 'due'
        ? 0
        : formData.paymentStatus === 'paid'
        ? totP
        : Math.min(totP, Math.max(0, parseInt(formData.paidAmount) || 0));
      const dueP = Math.max(0, totP - paidP);

      let cleanNotes = formData.notes.replace(/\[বকেয়া:.*?\]/g, '').trim();
      if (dueP > 0) {
        cleanNotes = cleanNotes ? `${cleanNotes} [বকেয়া: ৳${dueP}]` : `[বকেয়া: ৳${dueP}]`;
      }

      const updatedOrder = {
        ...order,
        customerName: formData.customerName.trim(),
        phone: cleanPhone,
        address: formData.address.trim(),
        deliveryZone: formData.deliveryZone,
        packageType: formData.packageType,
        selectedSize: formData.selectedSize,
        selectedColor: formData.selectedColor,
        quantity: Math.max(1, parseInt(formData.quantity) || 1),
        itemPrice: itemP,
        deliveryCharge: delP,
        totalPrice: totP,
        paymentStatus: formData.paymentStatus,
        paidAmount: paidP,
        dueAmount: dueP,
        paymentMethod: formData.paymentMethod || 'cash',
        status: formData.status,
        notes: cleanNotes
      };

      // Call parent update callback or firestore directly
      if (onUpdateOrder) {
        await onUpdateOrder(updatedOrder);
      } else {
        await updateOrder(updatedOrder, order);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1000);
    } catch (err) {
      console.error('Save order error:', err);
      setErrorMsg('অর্ডার আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              ORD
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {isEditing ? 'অর্ডার তথ্য পরিবর্তন / এডিট' : 'অর্ডার বিবরণী'}
                </h3>
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                  {order.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>
                  {order.createdAt ? new Date(order.createdAt).toLocaleString('bn-BD', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'তারিখ পাওয়া যায়নি'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => {
                  const ordTot = order.totalPrice ?? 2000;
                  const ordDue = order.dueAmount !== undefined ? order.dueAmount : ((order.notes || '').match(/\[বকেয়া:\s*৳?(\d+)\]/) ? parseInt((order.notes || '').match(/\[বকেয়া:\s*৳?(\d+)\]/)[1]) : 0);
                  const ordPaid = order.paidAmount !== undefined ? order.paidAmount : (ordDue > 0 ? Math.max(0, ordTot - ordDue) : ordTot);
                  const ordPaySt = order.paymentStatus || (ordDue > 0 ? (ordPaid > 0 ? 'partial' : 'due') : 'paid');
                  setFormData({
                    customerName: order.customerName || '',
                    phone: order.phone || '',
                    address: order.address || '',
                    deliveryZone: order.deliveryZone || 'inside',
                    packageType: order.packageType || 'combo',
                    selectedSize: order.selectedSize || 'L',
                    selectedColor: order.selectedColor || 'navy',
                    quantity: order.quantity || 1,
                    itemPrice: order.itemPrice ?? 2000,
                    deliveryCharge: order.deliveryCharge ?? 0,
                    totalPrice: ordTot,
                    paymentStatus: ordPaySt,
                    paidAmount: ordPaid,
                    dueAmount: ordDue,
                    paymentMethod: order.paymentMethod || 'cash',
                    status: order.status || 'pending',
                    notes: order.notes || ''
                  });
                  setIsEditing(true);
                }}
                className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-rose-600" />
                <span>এডিট</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="my-3 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-pulse">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>অর্ডারের তথ্য সফলভাবে আপডেট ও সংরক্ষিত হয়েছে!</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="my-3 bg-rose-50 border border-rose-200 p-3 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isEditing ? (
          /* ================= EDIT FORM MODE ================= */
          <form onSubmit={handleSaveEdit} className="space-y-4 my-4">
            
            {/* Customer Information */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                ১. গ্রাহকের তথ্য সম্পাদন:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">গ্রাহকের নাম *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-medium text-slate-900 bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">পূর্ণ ঠিকানা *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">ডেলিভারি এলাকা</label>
                  <select
                    value={formData.deliveryZone}
                    onChange={(e) => setFormData({ ...formData, deliveryZone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white"
                  >
                    <option value="inside">সিলেটের ভেতরে</option>
                    <option value="outside">সিলেটের বাইরে (সারাদেশ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">অর্ডার স্ট্যাটাস</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="pending">নতুন অর্ডার (পেন্ডিং)</option>
                    <option value="confirmed">কনফার্মড</option>
                    <option value="shipping">কুরিয়ারে পাঠানো হয়েছে</option>
                    <option value="delivered">সফল ডেলিভারি</option>
                    <option value="cancelled">বাতিল (ক্যানসেল)</option>
                    <option value="returned">রিটার্ন (ফেরত)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product & Package Information */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                ২. পণ্য ও প্যাকেজ নির্বাচন:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">প্যাকেজ টাইপ</label>
                  <select
                    value={formData.packageType}
                    onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white"
                  >
                    <option value="combo">৪ পিস মেগা কম্বো</option>
                    <option value="three_pcs">৩ পিস ভ্যালু প্যাক</option>
                    <option value="two_pcs">২ পিস স্মার্ট প্যাক</option>
                    <option value="single">১ পিস ট্রায়াল প্যাক</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">সাইজ</label>
                  <select
                    value={formData.selectedSize}
                    onChange={(e) => setFormData({ ...formData, selectedSize: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    {availableSizes.map(sz => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">পরিমাণ (Pack Qty)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                ৩. মূল্য ও ডেলিভারি চার্জ:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">পণ্য মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.itemPrice}
                    onChange={(e) => handlePriceChange('itemPrice', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600">ডেলিভারি চার্জ (৳)</label>
                    <button
                      type="button"
                      onClick={() => handlePriceChange('deliveryCharge', 0)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                        (parseInt(formData.deliveryCharge) || 0) === 0
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      ফ্রি (৳০)
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.deliveryCharge}
                    onChange={(e) => handlePriceChange('deliveryCharge', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">মোট প্রদেয় COD (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalPrice}
                    onChange={(e) => setFormData({ ...formData, totalPrice: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-xl border border-rose-300 text-xs font-black text-rose-600 bg-rose-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">অর্ডার নোট / মন্তব্য</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="যেমন: বিকেলে ডেলিভারি দিতে হবে"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                />
              </div>
            </div>

            {/* Section 4: Payment & Due Control */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                ৪. পেমেন্ট ও বকেয়া হিসাব (Payment & Due Control):
              </span>

              {/* Quick Status Selectors */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const tot = parseInt(formData.totalPrice) || 0;
                    setFormData({
                      ...formData,
                      paymentStatus: 'paid',
                      paidAmount: tot,
                      dueAmount: 0
                    });
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border cursor-pointer ${
                    formData.paymentStatus === 'paid'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>সম্পূর্ণ পেইড</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const tot = parseInt(formData.totalPrice) || 0;
                    setFormData({
                      ...formData,
                      paymentStatus: 'due',
                      paidAmount: 0,
                      dueAmount: tot
                    });
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border cursor-pointer ${
                    formData.paymentStatus === 'due'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>সম্পূর্ণ বকেয়া</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const tot = parseInt(formData.totalPrice) || 0;
                    const curPaid = parseInt(formData.paidAmount) || 0;
                    const initPaid = curPaid > 0 && curPaid < tot ? curPaid : Math.round(tot / 2);
                    setFormData({
                      ...formData,
                      paymentStatus: 'partial',
                      paidAmount: initPaid,
                      dueAmount: Math.max(0, tot - initPaid)
                    });
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border cursor-pointer ${
                    formData.paymentStatus === 'partial'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🌓 আংশিক বকেয়া</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">পরিশোধিত / জমা টাকা (৳)</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalPrice}
                    value={formData.paidAmount}
                    onChange={(e) => handlePaidAmountChange(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">পেমেন্ট মাধ্যম</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="cash">ক্যাশ (Cash)</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                    <option value="bank">ব্যাংক (Bank)</option>
                    <option value="due">বকেয়া (Due)</option>
                  </select>
                </div>
              </div>

              {/* Live calculation banner */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  মোট: <strong>৳{formData.totalPrice}</strong> | জমা: <strong className="text-emerald-600">৳{formData.paidAmount || 0}</strong>
                </span>
                <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
                  (formData.dueAmount || 0) > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {(formData.dueAmount || 0) > 0 ? `অবশিষ্ট বকেয়া: ৳${formData.dueAmount}` : '✓ কোনো বকেয়া নেই'}
                </span>
              </div>
            </div>

            {/* Edit Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                বাতিল করুন
              </button>

              <button
                type="submit"
                disabled={saveLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveLoading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
              </button>
            </div>

          </form>
        ) : (
          /* ================= VIEW MODE ================= */
          <>
            {/* Status Control Card */}
            <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600">বর্তমান স্ট্যাটাস:</span>
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${stObj.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{stObj.label}</span>
                </span>
                {(() => {
                  const isMan = order.isManual === true || order.orderSource === 'manual' || (order.notes || '').toLowerCase().includes('ম্যানুয়াল') || (order.notes || '').toLowerCase().includes('manual') || (order.notes || '').toLowerCase().includes('এডমিন');
                  return isMan ? (
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-800 border border-indigo-200">
                      📝 ম্যানুয়াল অর্ডার (কুরিয়ার খরচ নেই)
                    </span>
                  ) : (
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 border border-sky-200">
                      🌐 অনলাইন ওয়েবসাইট অর্ডার (কুরিয়ার)
                    </span>
                  );
                })()}
              </div>

              <div className="relative">
                <select
                  value={order.status}
                  disabled={updatingId === order.id}
                  onChange={(e) => onStatusChange && onStatusChange(order.id, e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 shadow-xs cursor-pointer focus:ring-2 focus:ring-rose-500"
                >
                  <option value="pending">পেন্ডিং (নতুন)</option>
                  <option value="confirmed">কনফার্মড</option>
                  <option value="shipping">কুরিয়ারে পাঠানো হয়েছে</option>
                  <option value="delivered">ডেলিভার্ড (সফল)</option>
                  <option value="cancelled">বাতিল (ক্যানসেল)</option>
                  <option value="returned">রিটার্ন (ফেরত)</option>
                </select>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 mb-4 space-y-2">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                গ্রাহকের তথ্য (Customer Details)
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">গ্রাহকের নাম:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{order.customerName}</p>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">মোবাইল নম্বর:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a
                      href={`tel:${order.phone}`}
                      className="font-mono font-bold text-rose-600 hover:underline flex items-center gap-1 text-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{order.phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/88${order.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-lg font-bold hover:bg-emerald-700 transition"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-500 block text-[11px]">ডেলিভারির পূর্ণ ঠিকানা:</span>
                  <p className="font-medium text-slate-800 mt-0.5 whitespace-pre-wrap bg-white p-2.5 rounded-xl border border-slate-200">
                    {order.address}
                  </p>
                  <span className="inline-block mt-1 text-[11px] font-bold text-slate-600">
                    ডেলিভারি এলাকা: <strong className="text-rose-600">{order.deliveryZone === 'outside' ? 'সিলেটের বাইরে (সারাদেশ)' : 'সিলেটের ভেতরে'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Product & Package Details Card */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 mb-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  প্যাকেজ ও পণ্যের বিবরণ
                </span>
                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[11px]">
                  সাইজ: {order.selectedSize}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between font-bold text-slate-900 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-rose-600" />
                    <span>{getPackageLabel(order.packageType)}</span>
                  </div>
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">
                    {order.quantity || 1} টি
                  </span>
                </div>

                {/* Individual items breakdown */}
                <div className="mt-2 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    আইটেম ও কালার তালিকা:
                  </span>
                  {order.orderItems && order.orderItems.length > 0 ? (
                    order.orderItems.map((itm, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                        <span className="flex items-center gap-2">
                          {itm.colorCode && (
                            <span className="w-3 h-3 rounded-full shrink-0 border border-slate-300" style={{ backgroundColor: itm.colorCode }} />
                          )}
                          <span className="font-medium">{itm.name}</span>
                        </span>
                        <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          সাইজ {itm.size} (×{itm.qty})
                        </span>
                      </div>
                    ))
                  ) : order.packageType === 'combo' ? (
                    <div className="space-y-1 text-[11px] text-slate-700">
                      <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded">
                        <span>• ক্লাসিক নেভি ব্লু</span>
                        <span className="font-bold">সাইজ {order.selectedSize} (×1)</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded">
                        <span>• সতেজ মিন্ট গ্রিন</span>
                        <span className="font-bold">সাইজ {order.selectedSize} (×1)</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded">
                        <span>• চারকোল গ্রে</span>
                        <span className="font-bold">সাইজ {order.selectedSize} (×1)</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded">
                        <span>• লাইট অ্যাশ গ্রে</span>
                        <span className="font-bold">সাইজ {order.selectedSize} (×1)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded">
                      কালার: <strong>{order.selectedColor || 'নেভি ব্লু'}</strong> (সাইজ {order.selectedSize})
                    </div>
                  )}
                </div>
              </div>

              {order.notes && (
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                  <strong>গ্রাহকের নোট:</strong> {order.notes}
                </div>
              )}
            </div>

            {/* Payment & Due Status Card */}
            {(() => {
              const tot = order.totalPrice || 0;
              const due = order.dueAmount !== undefined ? order.dueAmount : ((order.notes || '').match(/\[বকেয়া:\s*৳?(\d+)\]/) ? parseInt((order.notes || '').match(/\[বকেয়া:\s*৳?(\d+)\]/)[1]) : 0);
              const paid = order.paidAmount !== undefined ? order.paidAmount : Math.max(0, tot - due);
              const method = order.paymentMethod || 'cash';
              const methodLabel = method === 'bkash' ? 'বিকাশ (bKash)' : method === 'nagad' ? 'নগদ (Nagad)' : method === 'bank' ? 'ব্যাংক ট্রান্সফার' : method === 'due' ? 'বকেয়া' : 'ক্যাশ (Cash)';

              if (due > 0) {
                return (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
                          ⚠️
                        </span>
                        <div>
                          <h4 className="font-extrabold text-amber-950 text-sm">
                            পেমেন্ট বকেয়া রয়েছে (Due Order)
                          </h4>
                          <p className="text-[11px] text-amber-700">
                            এই অর্ডারে এখনো গ্রাহকের কাছে বকেয়া পাওনা আছে
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black bg-rose-600 text-white px-2.5 py-1 rounded-xl shadow-2xs">
                        বকেয়া: ৳{due}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-white/90 p-2.5 rounded-xl border border-amber-200 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">মোট প্রদেয়</span>
                        <span className="font-black text-slate-800 text-sm">৳{tot}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 font-bold block">জমা / পেইড</span>
                        <span className="font-black text-emerald-600 text-sm">৳{paid}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-700 font-bold block">অবশিষ্ট বকেয়া</span>
                        <span className="font-black text-rose-600 text-sm">৳{due}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-amber-900 flex items-center justify-between">
                      <span>পেমেন্ট মাধ্যম: <strong className="text-slate-800">{methodLabel}</strong></span>
                      {order.paymentStatus === 'partial' && (
                        <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">আংশিক পেইড</span>
                      )}
                    </div>

                    {/* Due Resolution Actions */}
                    <div className="pt-2 border-t border-amber-200 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={saveLoading}
                        onClick={handleMarkDueAsFullyPaid}
                        className="flex-1 min-w-[170px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>✓ বকেয়া পরিশোধ সম্পন্ন</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCollectInput(!showCollectInput)}
                        className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold py-2 px-3 rounded-xl transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <span>+ আংশিক জমা</span>
                      </button>
                    </div>

                    {/* Inline partial collection form */}
                    {showCollectInput && (
                      <form onSubmit={handleCollectPartialAmount} className="pt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={due}
                          placeholder={`জমার পরিমাণ (সর্বোচ্চ ৳${due})`}
                          value={collectAmount}
                          onChange={(e) => setCollectAmount(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={saveLoading || !collectAmount}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition disabled:opacity-50 cursor-pointer"
                        >
                          জমা করুন
                        </button>
                      </form>
                    )}
                  </div>
                );
              } else {
                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold">পেমেন্ট সম্পূর্ণ পরিশোধিত (কোনো বকেয়া নেই)</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                      জমা: ৳{paid} ({methodLabel})
                    </span>
                  </div>
                );
              }
            })()}

            {/* Pricing & Profit Card */}
            {(() => {
              const isMan = order.isManual === true || order.orderSource === 'manual' || (order.notes || '').toLowerCase().includes('ম্যানুয়াল') || (order.notes || '').toLowerCase().includes('manual') || (order.notes || '').toLowerCase().includes('এডমিন');
              const costPerPcs = product?.costPricePerPiece ?? 220;
              const packCost = isMan ? 0 : (product?.packagingCost ?? 30);
              const courierFee = isMan ? 0 : (order.deliveryZone === 'outside' ? (product?.deliveryRealCostOutside ?? 120) : (product?.deliveryRealCostInside ?? 60));
              const qtyNum = Math.max(1, parseInt(order.quantity) || 1);
              const units = order.packageType === 'combo' ? (4 * qtyNum) : order.packageType === 'three_pcs' ? (3 * qtyNum) : order.packageType === 'two_pcs' ? (2 * qtyNum) : qtyNum;
              const buyingCost = units * costPerPcs;
              const totalEstCost = buyingCost + packCost + courierFee;
              const netProfit = (order.totalPrice || 0) - totalEstCost;

              return (
                <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm text-xs space-y-2 mb-5">
                  <div className="flex justify-between text-slate-300">
                    <span>পণ্য মূল্য (Item Price):</span>
                    <span className="font-semibold text-white">৳{order.itemPrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>ডেলিভারি চার্জ:</span>
                    <span className="font-semibold text-white">
                      {order.deliveryCharge === 0 ? 'ফ্রি (৳০)' : `৳${order.deliveryCharge}`}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-700 flex justify-between items-baseline text-sm font-black">
                    <span>ক্যাশ অন ডেলিভারি (মোট প্রদেয়):</span>
                    <span className="text-white text-base">৳{order.totalPrice}</span>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="pt-2 border-t border-slate-800 bg-white/5 p-2.5 rounded-xl space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>পণ্যের কেনা খরচ ({units} পিস × ৳{costPerPcs}):</span>
                      <span className="font-medium text-amber-300">-৳{buyingCost}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>বক্স ও কুরিয়ার ডেলিভারি খরচ:</span>
                      {isMan ? (
                        <span className="font-bold text-emerald-400">৳০ (ম্যানুয়াল - কুরিয়ার খরচ নেই)</span>
                      ) : (
                        <span className="font-medium text-amber-300">-৳{packCost + courierFee}</span>
                      )}
                    </div>
                    <div className="pt-1.5 border-t border-white/10 flex justify-between items-center font-bold">
                      <span className="text-slate-200">
                        {order.status === 'delivered' ? 'অর্জিত নিট লাভ (Net Profit):' : 'ডেলিভারি সম্পন্ন হলে প্রাক্কলিত লাভ:'}
                      </span>
                      <span className={`text-sm font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {netProfit >= 0 ? `+৳${netProfit}` : `-৳${Math.abs(netProfit)}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Actions Bottom Bar */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenInvoice) onOpenInvoice(order);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
              >
                <FileText className="w-4 h-4" />
                <span>চালান / ইনভয়েস দেখুন</span>
              </button>
              
              <button
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
