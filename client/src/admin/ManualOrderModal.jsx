import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Check, AlertCircle, ShoppingBag, Truck, Gift, User, Phone, MapPin, Tag } from 'lucide-react';
import { saveOrder, generateOrderId } from '../services/firebaseDb';
import { sendOrderEmailNotification } from '../services/emailService';

export default function ManualOrderModal({ product, onClose, onOrderCreated }) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('inside'); // 'inside' or 'outside'
  const [packageType, setPackageType] = useState('combo'); // 'combo', 'three_pcs', 'two_pcs', 'single'
  const [selectedColor, setSelectedColor] = useState('navy');
  const [multiColors, setMultiColors] = useState(['navy', 'grey']);
  const [selectedSize, setSelectedSize] = useState('L');
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState('confirmed'); // default to confirmed for manual orders
  const [customPrice, setCustomPrice] = useState('2000');
  const [customDelivery, setCustomDelivery] = useState('0');
  const [isDeliveryManuallyChanged, setIsDeliveryManuallyChanged] = useState(false);
  const [isPriceManuallyChanged, setIsPriceManuallyChanged] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('paid'); // 'paid', 'due', 'partial'
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'bkash', 'nagad', 'bank', 'due'
  const [notes, setNotes] = useState('ম্যানুয়াল অর্ডার (এডমিন প্যানেল)');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const singlePrice = product?.singlePrice || 650;
  const twoPcsPrice = product?.twoPcsPrice || 1200;
  const threePcsPrice = product?.threePcsPrice || 1600;
  const comboPrice = product?.comboPrice || 2000;
  const deliveryInside = product?.deliveryInsideDhaka ?? 70;
  const deliveryOutside = product?.deliveryOutsideDhaka ?? 130;
  const comboFreeDelivery = product?.comboFreeDelivery ?? true;

  // Auto-calculate suggested price on package/qty change (only if admin hasn't customized it)
  useEffect(() => {
    if (!isPriceManuallyChanged) {
      let baseItemPrice = singlePrice;
      if (packageType === 'combo') baseItemPrice = comboPrice;
      else if (packageType === 'three_pcs') baseItemPrice = threePcsPrice;
      else if (packageType === 'two_pcs') baseItemPrice = twoPcsPrice;

      setCustomPrice((baseItemPrice * quantity).toString());
    }
  }, [packageType, quantity, comboPrice, threePcsPrice, twoPcsPrice, singlePrice, isPriceManuallyChanged]);

  // Auto-calculate suggested delivery on package/zone change (only if admin hasn't customized it)
  useEffect(() => {
    if (!isDeliveryManuallyChanged) {
      let defDel = deliveryZone === 'outside' ? deliveryOutside : deliveryInside;
      if (packageType === 'combo' && comboFreeDelivery) {
        defDel = 0;
      }
      setCustomDelivery(defDel.toString());
    }
  }, [packageType, deliveryZone, deliveryInside, deliveryOutside, comboFreeDelivery, isDeliveryManuallyChanged]);

  // Handle package change and multi-colors setup
  const handlePackageChange = (pkg) => {
    setPackageType(pkg);
    if (pkg === 'two_pcs' && multiColors.length !== 2) {
      setMultiColors(['navy', 'grey']);
    } else if (pkg === 'three_pcs' && multiColors.length !== 3) {
      setMultiColors(['navy', 'mint', 'grey']);
    }
  };

  const toggleMultiColor = (colorId, targetCount) => {
    if (multiColors.includes(colorId)) {
      if (multiColors.length > 1) {
        setMultiColors(multiColors.filter(c => c !== colorId));
      }
    } else {
      if (multiColors.length < targetCount) {
        setMultiColors([...multiColors, colorId]);
      } else {
        setMultiColors([...multiColors.slice(1), colorId]);
      }
    }
  };

  // Ensure default size selection
  useEffect(() => {
    if (!selectedSize && product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0].id);
    }
  }, [product, selectedSize]);

  const currentSizeObj = product?.sizes?.find(s => s.id.toLowerCase() === (selectedSize || '').toLowerCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim() || !phone.trim() || !address.trim() || !selectedSize) {
      setError('অনুগ্রহ করে নাম, ফোন, ঠিকানা ও সাইজ সঠিকভাবে পূরণ করুন।');
      return;
    }

    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('8801') && cleanPhone.length === 13) {
      cleanPhone = cleanPhone.slice(2);
    }
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      setError('সঠিক ১১ ডিজিটের ফোন নম্বর দিন (যেমন: 017XXXXXXXX)।');
      return;
    }

    if (packageType === 'two_pcs' && multiColors.length < 1) {
      setError('২ পিস প্যাকের জন্য কালার সিলেক্ট করুন।');
      return;
    }

    if (packageType === 'three_pcs' && multiColors.length < 1) {
      setError('৩ পিস প্যাকের জন্য কালার সিলেক্ট করুন।');
      return;
    }

    setSubmitting(true);

    try {
      let finalColors = [...multiColors];
      if (packageType === 'two_pcs') {
        if (finalColors.length === 0) finalColors = ['navy', 'grey'];
        else if (finalColors.length === 1) finalColors = [finalColors[0], finalColors[0]];
        else finalColors = finalColors.slice(0, 2);
      } else if (packageType === 'three_pcs') {
        if (finalColors.length === 0) finalColors = ['navy', 'mint', 'grey'];
        else if (finalColors.length === 1) finalColors = [finalColors[0], finalColors[0], finalColors[0]];
        else if (finalColors.length === 2) finalColors = [finalColors[0], finalColors[1], finalColors[0]];
        else finalColors = finalColors.slice(0, 3);
      }

      const payloadColors = packageType === 'combo'
        ? (product?.colors || []).map(c => c.id)
        : packageType === 'single'
        ? [selectedColor || 'navy']
        : finalColors;

      const displayColor = packageType === 'combo'
        ? 'all'
        : packageType === 'single'
        ? (selectedColor || 'navy')
        : finalColors.join(', ');

      const qtyNum = Math.max(1, parseInt(quantity) || 1);
      const itemPriceVal = (customPrice !== '' && customPrice !== null && customPrice !== undefined)
        ? Math.max(0, parseInt(customPrice, 10) || 0)
        : (
          packageType === 'combo' ? (product?.comboPrice || 2000) * qtyNum :
          packageType === 'three_pcs' ? (product?.threePcsPrice || 1600) * qtyNum :
          packageType === 'two_pcs' ? (product?.twoPcsPrice || 1200) * qtyNum :
          (product?.singlePrice || 650) * qtyNum
        );

      // If delivery is cut / cleared or set to 0, delivery charge is strictly 0 tk!
      const deliveryChargeVal = (customDelivery !== '' && customDelivery !== null && customDelivery !== undefined)
        ? Math.max(0, parseInt(customDelivery, 10) || 0)
        : 0;

      const finalTotalPrice = itemPriceVal + deliveryChargeVal;
      const actualPaid = paymentStatus === 'due'
        ? 0
        : paymentStatus === 'paid'
        ? finalTotalPrice
        : Math.min(finalTotalPrice, Math.max(0, parseInt(paidAmount) || 0));
      const actualDue = Math.max(0, finalTotalPrice - actualPaid);
      const orderId = generateOrderId();

      const createdOrder = {
        id: orderId,
        customerName: customerName.trim(),
        phone: cleanPhone,
        address: address.trim(),
        deliveryZone,
        packageType,
        selectedColor: displayColor,
        selectedColors: payloadColors,
        selectedSize,
        quantity: qtyNum,
        itemPrice: itemPriceVal,
        deliveryCharge: deliveryChargeVal,
        totalPrice: finalTotalPrice,
        paymentStatus,
        paidAmount: actualPaid,
        dueAmount: actualDue,
        paymentMethod,
        status: status || 'confirmed',
        unitsCount: payloadColors.length * qtyNum,
        orderSource: 'manual',
        isManual: true,
        orderItems: payloadColors.map(cid => {
          const c = product?.colors?.find(col => col.id === cid) || { name: cid, code: '#333' };
          return {
            name: c.name,
            size: selectedSize,
            qty: qtyNum,
            colorCode: c.code
          };
        }),
        notes: actualDue > 0
          ? (notes.trim() ? `[ম্যানুয়াল অর্ডার] [বকেয়া: ৳${actualDue}] ${notes.trim()}` : `[ম্যানুয়াল অর্ডার] [বকেয়া: ৳${actualDue}]`)
          : (notes.trim() ? `[ম্যানুয়াল অর্ডার] ${notes.trim()}` : '[ম্যানুয়াল অর্ডার]'),
        createdAt: new Date().toISOString()
      };

      // 1. Save to local storage as fallback
      try {
        const localOrders = JSON.parse(localStorage.getItem('onroun_orders') || '[]');
        localOrders.unshift(createdOrder);
        localStorage.setItem('onroun_orders', JSON.stringify(localOrders));
      } catch (lsErr) {
        console.warn('LocalStorage save warning:', lsErr);
      }

      // 2. Save directly to Firebase Firestore (also handles Firestore stock deduction & onroun_product_stock)
      try {
        await saveOrder(createdOrder, true);
      } catch (fbErr) {
        console.error('Firebase manual order save error:', fbErr);
      }

      // 3. Fire-and-forget email notification
      try {
        sendOrderEmailNotification(createdOrder).catch(console.error);
      } catch (mailErr) {}

      // 4. Notify parent callback
      if (onOrderCreated) {
        onOrderCreated(createdOrder);
      }

      // 5. Close modal
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError('অর্ডার তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const calculatedTotal = (parseInt(customPrice) || 0) + (parseInt(customDelivery) || 0);
  const actualPaidAmount = paymentStatus === 'due' 
    ? 0 
    : paymentStatus === 'paid' 
    ? calculatedTotal 
    : Math.min(calculatedTotal, Math.max(0, parseInt(paidAmount) || 0));
  const actualDueAmount = Math.max(0, calculatedTotal - actualPaidAmount);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                নতুন ম্যানুয়াল অর্ডার তৈরি করুন
              </h3>
              <p className="text-xs text-slate-500">
                ফোন কল, হোয়াটসঅ্যাপ বা মেসেঞ্জারের অর্ডার সরাসরি সিস্টেমে যুক্ত করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-5 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-rose-700 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Section 1: Customer Details */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              ১. গ্রাহকের বিবরণ:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">গ্রাহকের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ জাহিদুল ইসলাম"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">ডেলিভারি ঠিকানা *</label>
              <textarea
                required
                rows={2}
                placeholder="বাসা/রোড নং, এলাকা, থানা, জেলা"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Delivery Zone Selection */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">ডেলিভারি জোন</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryZone('inside')}
                  className={`p-2.5 rounded-xl border-2 text-xs font-bold transition flex items-center justify-between ${
                    deliveryZone === 'inside'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>সিলেটের ভেতরে</span>
                  <span className="text-[10px] opacity-80">(৳৭০)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryZone('outside')}
                  className={`p-2.5 rounded-xl border-2 text-xs font-bold transition flex items-center justify-between ${
                    deliveryZone === 'outside'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>সিলেটের বাইরে</span>
                  <span className="text-[10px] opacity-80">(৳১৩০)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Package, Size & Color */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              ২. প্যাকেজ ও সাইজ নির্বাচন:
            </span>

            {/* Package Type (4 Options) */}
            <div className="grid grid-cols-2 gap-2">
              {/* 4 Pcs Combo */}
              <button
                type="button"
                onClick={() => handlePackageChange('combo')}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  packageType === 'combo'
                    ? 'border-rose-600 bg-rose-50/70 text-rose-900 font-extrabold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 font-medium hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">৪ পিস মেগা কম্বো</span>
                  <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-black">৪ পিস</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">সব কালার সেট (৳{comboPrice})</span>
              </button>

              {/* 3 Pcs Pack */}
              <button
                type="button"
                onClick={() => handlePackageChange('three_pcs')}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  packageType === 'three_pcs'
                    ? 'border-rose-600 bg-rose-50/70 text-rose-900 font-extrabold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 font-medium hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">৩ পিস ভ্যালু প্যাক</span>
                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-black">৩ পিস</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">পছন্দের ৩ কালার (৳{threePcsPrice})</span>
              </button>

              {/* 2 Pcs Pack */}
              <button
                type="button"
                onClick={() => handlePackageChange('two_pcs')}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  packageType === 'two_pcs'
                    ? 'border-rose-600 bg-rose-50/70 text-rose-900 font-extrabold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 font-medium hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">২ পিস স্মার্ট প্যাক</span>
                  <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.2 rounded font-black">২ পিস</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">পছন্দের ২ কালার (৳{twoPcsPrice})</span>
              </button>

              {/* 1 Pc Single */}
              <button
                type="button"
                onClick={() => handlePackageChange('single')}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  packageType === 'single'
                    ? 'border-slate-900 bg-slate-50 text-slate-900 font-extrabold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 font-medium hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">১ পিস ট্রায়াল প্যাক</span>
                  <span className="text-[10px] bg-slate-800 text-white px-1.5 py-0.2 rounded font-black">১ পিস</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">পছন্দের ১ কালার (৳{singlePrice})</span>
              </button>
            </div>

            {/* Color Selection based on package */}
            {packageType === 'single' ? (
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">কালার নির্বাচন করুন:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {product?.colors?.map((c) => {
                    const colorPcs = currentSizeObj?.colorStock?.[c.id] ?? 0;
                    const isSelected = selectedColor === c.id;

                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setSelectedColor(c.id)}
                        className={`p-2 rounded-xl border-2 transition text-center flex flex-col items-center ${
                          isSelected
                            ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-slate-300 mb-1" style={{ backgroundColor: c.code }} />
                        <span className="text-xs truncate w-full">{c.name.split(' ')[0]}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{colorPcs} পিস বাকি</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (packageType === 'two_pcs' || packageType === 'three_pcs') ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    {packageType === 'two_pcs' ? 'পছন্দের ২টি কালার বেছে নিন:' : 'পছন্দের ৩টি কালার বেছে নিন:'}
                  </label>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    {multiColors.length} / {packageType === 'two_pcs' ? 2 : 3} নির্বাচিত
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {product?.colors?.map((c) => {
                    const colorPcs = currentSizeObj?.colorStock?.[c.id] ?? 0;
                    const isSelected = multiColors.includes(c.id);

                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleMultiColor(c.id, packageType === 'two_pcs' ? 2 : 3)}
                        className={`p-2 rounded-xl border-2 transition text-center flex flex-col items-center relative ${
                          isSelected
                            ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold ring-1 ring-rose-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                            ✓
                          </div>
                        )}
                        <span className="w-4 h-4 rounded-full border border-slate-300 mb-1" style={{ backgroundColor: c.code }} />
                        <span className="text-xs truncate w-full">{c.name.split(' ')[0]}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{colorPcs} পিস বাকি</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Size Selection */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">সাইজ নির্বাচন করুন:</label>
              <div className="grid grid-cols-4 gap-2">
                {product?.sizes?.map((s) => {
                  const isSelected = selectedSize === s.id;
                  const comboAvailable = Math.min(...Object.values(s.colorStock || { navy: 0, mint: 0, grey: 0, lightgrey: 0 }));

                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setSelectedSize(s.id)}
                      className={`p-2 rounded-xl border-2 font-bold text-center transition flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-rose-600 bg-rose-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm font-extrabold">{s.id}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-rose-100' : 'text-slate-500'}`}>
                        {s.waist}"
                      </span>
                      <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-rose-200' : 'text-slate-400'}`}>
                        {packageType === 'combo' ? `${comboAvailable} কম্বো` : `${s.stock} পিস`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-bold text-slate-700 block">পরিমাণ (Quantity):</span>
                <span className="text-[10px] text-slate-500">
                  {packageType === 'combo' 
                    ? `মোট ${quantity * 4} পিস বক্সার` 
                    : packageType === 'three_pcs'
                    ? `মোট ${quantity * 3} পিস`
                    : packageType === 'two_pcs'
                    ? `মোট ${quantity * 2} পিস`
                    : `মোট ${quantity} পিস`}
                </span>
              </div>
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white h-9">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm flex items-center justify-center transition"
                >
                  -
                </button>
                <div className="w-12 text-center font-bold text-slate-900 text-sm">
                  {quantity}
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm flex items-center justify-center transition"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* Section 3: Pricing & Status */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              ৩. মূল্য, ডেলিভারি ফি ও স্ট্যাটাস:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">প্রোডাক্ট মূল্য (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={customPrice}
                  onChange={(e) => {
                    setCustomPrice(e.target.value);
                    setIsPriceManuallyChanged(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600">ডেলিভারি চার্জ (৳)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDelivery('0');
                      setIsDeliveryManuallyChanged(true);
                    }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer ${
                      customDelivery === '0' || customDelivery === ''
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    ফ্রি ডেলিভারি (৳০)
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={customDelivery}
                  onChange={(e) => {
                    setCustomDelivery(e.target.value);
                    setIsDeliveryManuallyChanged(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                {isDeliveryManuallyChanged && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeliveryManuallyChanged(false);
                      let defDel = deliveryZone === 'outside' ? deliveryOutside : deliveryInside;
                      if (packageType === 'combo' && comboFreeDelivery) defDel = 0;
                      setCustomDelivery(defDel.toString());
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 underline mt-1 block"
                  >
                    স্বাভাবিক চার্জে রিসেট
                  </button>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">প্রাথমিক স্ট্যাটাস</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                >
                  <option value="pending">পেন্ডিং (নতুন)</option>
                  <option value="confirmed">কনফার্মড</option>
                  <option value="shipping">কুরিয়ারে পাঠানো হয়েছে</option>
                  <option value="delivered">ডেলিভার্ড</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">অর্ডার নোট / উৎস (যেমন: হোয়াটসঅ্যাপ, কল)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="যেমন: হোয়াটসঅ্যাপ থেকে অর্ডার কনফার্ম করেছে"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
              />
            </div>

            {/* Total Display */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">মোট বিক্রয়মূল্য (Total COD):</span>
              <span className="text-xl font-black text-rose-600">৳{calculatedTotal}</span>
            </div>
          </div>

          {/* Section 4: Payment & Due Tracking (পেমেন্ট ও বকেয়া হিসাব) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                ৪. পেমেন্ট ও বকেয়া হিসাব (Payment & Due):
              </span>
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                actualDueAmount > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {actualDueAmount > 0 ? `বকেয়া: ৳${actualDueAmount}` : '✓ সম্পূর্ণ পেইড'}
              </span>
            </div>

            {/* Payment Status Switcher */}
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setPaymentStatus('paid');
                  setPaidAmount(calculatedTotal.toString());
                }}
                className={`py-2 px-2.5 rounded-xl border-2 transition flex items-center justify-center gap-1 cursor-pointer ${
                  paymentStatus === 'paid'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>✓ সম্পূর্ণ পেইড</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentStatus('due');
                  setPaidAmount('0');
                }}
                className={`py-2 px-2.5 rounded-xl border-2 transition flex items-center justify-center gap-1 cursor-pointer ${
                  paymentStatus === 'due'
                    ? 'border-rose-600 bg-rose-50 text-rose-800 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>⚠️ সম্পূর্ণ বকেয়া</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentStatus('partial');
                  if (!paidAmount || parseInt(paidAmount) === calculatedTotal || parseInt(paidAmount) === 0) {
                    setPaidAmount(Math.round(calculatedTotal / 2).toString());
                  }
                }}
                className={`py-2 px-2.5 rounded-xl border-2 transition flex items-center justify-center gap-1 cursor-pointer ${
                  paymentStatus === 'partial'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>🌓 আংশিক বকেয়া</span>
              </button>
            </div>

            {/* Partial / Paid input details */}
            {paymentStatus === 'partial' && (
              <div className="p-3 bg-white rounded-xl border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    কাস্টমার জমা দিয়েছে / অগ্রিম পরিশোধ (৳):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={calculatedTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="যেমন: ৫০০"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-black text-emerald-700 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    অবশিষ্ট বকেয়া থাকবে (Due Amount):
                  </label>
                  <div className="w-full px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 font-black text-rose-600 text-sm flex items-center justify-between">
                    <span>৳{actualDueAmount}</span>
                    <span className="text-[10px] text-rose-500 font-semibold">(পরে পরিশোধ করবে)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Selector & Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">পেমেন্ট মাধ্যম (Payment Method)</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white cursor-pointer"
                >
                  <option value="cash">নগদ ক্যাশ (Cash)</option>
                  <option value="bkash">বিকাশ (bKash)</option>
                  <option value="nagad">নগদ (Nagad)</option>
                  <option value="bank">ব্যাংক ট্রান্সফার (Bank)</option>
                  <option value="due">বাকি / ধার (Credit/Due)</option>
                </select>
              </div>

              {/* Quick Summary Pill */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">পেমেন্ট হিসাব:</span>
                  <span className="font-bold text-slate-800 text-xs">
                    জমা: <strong className="text-emerald-700">৳{actualPaidAmount}</strong> | বকেয়া: <strong className={actualDueAmount > 0 ? "text-rose-600" : "text-slate-500"}>৳{actualDueAmount}</strong>
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              বাতিল
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/30 transition transform active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? 'অর্ডার তৈরি হচ্ছে...' : 'অর্ডার তৈরি ও স্টক সমন্বয় করুন'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

