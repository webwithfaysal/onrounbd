import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Truck, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { saveOrder, generateOrderId } from '../services/firebaseDb';
import { sendOrderEmailNotification } from '../services/emailService';

export default function OrderForm({
  product,
  selectedPackage,
  setSelectedPackage,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  onOrderSuccess
}) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('inside'); // 'inside' or 'outside'
  const [quantity, setQuantity] = useState(1);
  const [multiColors, setMultiColors] = useState(['navy', 'grey']);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const nameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const addressInputRef = useRef(null);
  const errorBannerRef = useRef(null);

  const singlePrice = product?.singlePrice || 650;
  const regularSinglePrice = product?.regularSinglePrice || 850;
  const twoPcsPrice = product?.twoPcsPrice || 1200;
  const regularTwoPcsPrice = product?.regularTwoPcsPrice || 1300;
  const threePcsPrice = product?.threePcsPrice || 1500;
  const regularThreePcsPrice = product?.regularThreePcsPrice || 1950;
  const comboPrice = product?.comboPrice || 2000;
  const regularComboPrice = product?.regularComboPrice || 2600;

  const comboSavings = Math.max(0, regularComboPrice - comboPrice);
  const threePcsSavings = Math.max(0, regularThreePcsPrice - threePcsPrice);
  const twoPcsSavings = Math.max(0, regularTwoPcsPrice - twoPcsPrice);
  const singleSavings = Math.max(0, regularSinglePrice - singlePrice);
  const comboQty = product?.comboQuantity || 4;

  const deliveryInsideDhaka = product?.deliveryInsideDhaka ?? 70;
  const deliveryOutsideDhaka = product?.deliveryOutsideDhaka ?? 130;
  const comboFreeDelivery = product?.comboFreeDelivery ?? true;

  const isCombo = selectedPackage === 'combo';
  const isThreePcs = selectedPackage === 'three_pcs';
  const isTwoPcs = selectedPackage === 'two_pcs';
  const isSingle = selectedPackage === 'single' || (!isCombo && !isThreePcs && !isTwoPcs);

  // Unit price and regular price calculation
  let unitPrice = singlePrice;
  let regularUnitPrice = regularSinglePrice;
  if (isCombo) {
    unitPrice = comboPrice;
    regularUnitPrice = regularComboPrice;
  } else if (isThreePcs) {
    unitPrice = threePcsPrice;
    regularUnitPrice = regularThreePcsPrice;
  } else if (isTwoPcs) {
    unitPrice = twoPcsPrice;
    regularUnitPrice = regularTwoPcsPrice;
  }
  const itemTotal = unitPrice * quantity;

  // Delivery charge calculation
  let deliveryCharge = deliveryZone === 'outside' ? deliveryOutsideDhaka : deliveryInsideDhaka;
  if (isCombo && comboFreeDelivery) {
    deliveryCharge = 0;
  }
  const grandTotal = itemTotal + deliveryCharge;

  // Handle package selection and multi-color state initialization
  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    if (pkg === 'two_pcs' && (!multiColors || multiColors.length === 0)) {
      setMultiColors(['navy', 'grey']);
    } else if (pkg === 'three_pcs' && (!multiColors || multiColors.length === 0)) {
      setMultiColors(['navy', 'mint', 'grey']);
    }
  };

  // Sync package changes from parent components
  useEffect(() => {
    if (selectedPackage === 'two_pcs') {
      if (!multiColors || multiColors.length === 0) {
        setMultiColors(['navy', 'grey']);
      }
    } else if (selectedPackage === 'three_pcs') {
      if (!multiColors || multiColors.length === 0) {
        setMultiColors(['navy', 'mint', 'grey']);
      }
    }
  }, [selectedPackage]);

  // Toggle multi-color selection with smart rotation
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
  }, [product, selectedSize, setSelectedSize]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    const errors = {};
    let firstErrorField = null;

    // 1. Name Validation
    if (!customerName || !customerName.trim()) {
      errors.name = 'আপনার পুরো নাম লিখুন।';
      if (!firstErrorField) firstErrorField = 'name';
    } else if (customerName.trim().length < 2) {
      errors.name = 'নামে কমপক্ষে ২টি অক্ষর লিখুন।';
      if (!firstErrorField) firstErrorField = 'name';
    }

    // 2. Phone Validation
    let cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    if (cleanPhone.startsWith('8801') && cleanPhone.length === 13) {
      cleanPhone = cleanPhone.slice(2);
    }

    if (!phone || !phone.trim()) {
      errors.phone = 'আপনার মোবাইল নম্বর দিন।';
      if (!firstErrorField) firstErrorField = 'phone';
    } else if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      errors.phone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।';
      if (!firstErrorField) firstErrorField = 'phone';
    }

    // 3. Address Validation
    if (!address || !address.trim()) {
      errors.address = 'আপনার বিস্তারিত ডেলিভারি ঠিকানা লিখুন।';
      if (!firstErrorField) firstErrorField = 'address';
    } else if (address.trim().length < 5) {
      errors.address = 'ঠিকানাটি বিস্তারিত লিখুন (বাসা/রোড নং, এলাকা, থানা, জেলা)।';
      if (!firstErrorField) firstErrorField = 'address';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage('অনুগ্রহ করে লাল চিহ্নিত তথ্যগুলো সঠিকভাবে পূরণ করুন।');

      setTimeout(() => {
        if (firstErrorField === 'name' && nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (firstErrorField === 'phone' && phoneInputRef.current) {
          phoneInputRef.current.focus();
          phoneInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (firstErrorField === 'address' && addressInputRef.current) {
          addressInputRef.current.focus();
          addressInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);

      return;
    }

    // Prepare multi-color array
    let finalColors = [...multiColors];
    if (isTwoPcs) {
      if (finalColors.length === 0) finalColors = ['navy', 'grey'];
      else if (finalColors.length === 1) finalColors = [finalColors[0], finalColors[0]];
      else finalColors = finalColors.slice(0, 2);
    } else if (isThreePcs) {
      if (finalColors.length === 0) finalColors = ['navy', 'mint', 'grey'];
      else if (finalColors.length === 1) finalColors = [finalColors[0], finalColors[0], finalColors[0]];
      else if (finalColors.length === 2) finalColors = [finalColors[0], finalColors[1], finalColors[0]];
      else finalColors = finalColors.slice(0, 3);
    }

    // Stock validation
    const currentSizeObj = product?.sizes?.find(s => s.id.toLowerCase() === selectedSize.toLowerCase());
    if (!currentSizeObj) {
      setErrorMessage(`নির্বাচিত '${selectedSize}' সাইজটি খুঁজে পাওয়া যায়নি। অন্য সাইজ নির্বাচন করুন।`);
      setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }

    const getAvailStock = (sizeObj, colorId) => {
      if (sizeObj.colorStock && sizeObj.colorStock[colorId] !== undefined) {
        return Number(sizeObj.colorStock[colorId]) || 0;
      }
      return Math.max(0, Math.floor((sizeObj.stock || 0) / (product?.colors?.length || 4)));
    };

    if (isCombo) {
      for (const c of (product?.colors || [])) {
        const avail = getAvailStock(currentSizeObj, c.id);
        if (avail < quantity) {
          setErrorMessage(`স্টক শেষ: কম্বো প্যাকের জন্য ${currentSizeObj.label} সাইজের '${c.name}' কালার পর্যাপ্ত নেই। বর্তমান স্টক: ${avail} পিস, প্রয়োজন: ${quantity} পিস।`);
          setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
          return;
        }
      }
    } else if (isTwoPcs || isThreePcs) {
      const colorCounts = {};
      for (const cid of finalColors) {
        colorCounts[cid] = (colorCounts[cid] || 0) + 1;
      }
      for (const [cid, countNeeded] of Object.entries(colorCounts)) {
        const avail = getAvailStock(currentSizeObj, cid);
        const totalNeeded = countNeeded * quantity;
        const cObj = product?.colors?.find(c => c.id === cid) || { name: cid };
        if (avail < totalNeeded) {
          setErrorMessage(`স্টক শেষ: ${currentSizeObj.label} সাইজের '${cObj.name}' কালার স্টক পর্যাপ্ত নেই।`);
          setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
          return;
        }
      }
    } else {
      const targetColor = (selectedColor || 'navy').toLowerCase();
      const matchedColor = product?.colors?.find(c => c.id.toLowerCase() === targetColor) || product?.colors?.[0];
      const avail = getAvailStock(currentSizeObj, matchedColor?.id || 'navy');
      if (avail < quantity) {
        setErrorMessage(`স্টক শেষ: ${currentSizeObj.label} সাইজের '${matchedColor?.name || targetColor}' কালারের পর্যাপ্ত স্টক নেই।`);
        setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payloadColors = isCombo 
        ? (product?.colors || []).map(c => c.id) 
        : isSingle 
        ? [selectedColor || 'navy'] 
        : finalColors;

      const displayColor = isCombo 
        ? 'all' 
        : isSingle 
        ? (selectedColor || 'navy') 
        : finalColors.map(cid => {
            const c = product?.colors?.find(col => col.id === cid);
            return c ? c.name.split(' ')[0] : cid;
          }).join(', ');

      const orderPayload = {
        customerName: customerName.trim(),
        phone: cleanPhone,
        address: address.trim(),
        deliveryZone,
        packageType: selectedPackage,
        selectedColor: displayColor,
        selectedColors: payloadColors,
        selectedSize,
        quantity,
        notes: notes.trim()
      };

      let orderSuccessData = null;

      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });

        const ct = response.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const data = await response.json();
          if (response.ok && data.success && data.order) {
            orderSuccessData = data.order;
          } else if (!response.ok && data.message) {
            setErrorMessage(`অর্ডার ব্যর্থ: ${data.message}`);
            setIsSubmitting(false);
            setTimeout(() => errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
            return;
          }
        }
      } catch (netErr) {
        // Static hosting fallback
      }

      // If backend API is not available
      if (!orderSuccessData) {
        const localOrders = JSON.parse(localStorage.getItem('onroun_orders') || '[]');
        const orderId = generateOrderId();
        const newOrder = {
          id: orderId,
          customerName: customerName.trim(),
          phone: cleanPhone,
          address: address.trim(),
          deliveryZone,
          packageType: selectedPackage,
          selectedColor: displayColor,
          selectedColors: payloadColors,
          selectedSize,
          quantity,
          itemPrice: itemTotal,
          deliveryCharge,
          totalPrice: grandTotal,
          status: 'pending',
          unitsCount: payloadColors.length * quantity,
          orderItems: payloadColors.map(cid => {
            const c = product?.colors?.find(col => col.id === cid) || { name: cid, code: '#333' };
            return {
              name: c.name,
              size: selectedSize,
              qty: quantity,
              colorCode: c.code
            };
          }),
          notes: notes.trim(),
          createdAt: new Date().toISOString()
        };

        localOrders.unshift(newOrder);
        localStorage.setItem('onroun_orders', JSON.stringify(localOrders));

        // Deduct stock in localStorage
        const updatedSizes = (product?.sizes || []).map(s => {
          if (s.id.toLowerCase() === selectedSize.toLowerCase()) {
            const nextColorStock = { ...(s.colorStock || {}) };
            for (const cid of payloadColors) {
              nextColorStock[cid] = Math.max(0, (nextColorStock[cid] || 0) - quantity);
            }
            const nextTotal = Object.values(nextColorStock).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
            return { ...s, colorStock: nextColorStock, stock: nextTotal };
          }
          return s;
        });

        const updatedProduct = { ...product, sizes: updatedSizes };
        localStorage.setItem('onroun_product_stock', JSON.stringify(updatedProduct));

        orderSuccessData = newOrder;
      }

      // Always save to Firebase Firestore
      if (orderSuccessData) {
        try {
          await saveOrder(orderSuccessData);
        } catch (fbErr) {
          console.error('Failed to sync order to Firebase:', fbErr);
        }

        // Send email with PDF invoice
        try {
          sendOrderEmailNotification(orderSuccessData).catch(console.error);
        } catch (mailErr) {
          console.error('Email notification dispatch error:', mailErr);
        }

        try {
          confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // ignore
        }

        if (onOrderSuccess) {
          onOrderSuccess(orderSuccessData);
        }
      } else {
        setErrorMessage('অর্ডার সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSizeObj = product?.sizes?.find(s => s.id.toLowerCase() === (selectedSize || '').toLowerCase());

  return (
    <section id="order-form-section" className="py-10 sm:py-14 md:py-20 bg-[#FAFBFC] border-b border-slate-100">
      <div className="max-w-2xl mx-auto px-3.5 sm:px-6">
        
        {/* Minimalist Section Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold mb-2.5 border border-slate-200/60">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-700" />
            <span>ক্যাশ অন ডেলিভারি চেকআউট</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
            অর্ডার নিশ্চিত করতে তথ্য দিন
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            কোনো অগ্রিম পেমেন্ট নেই • পণ্য হাতে পেয়ে দেখে টাকা দিন
          </p>
        </div>

        {/* Clean, Mobile-Optimized Card Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xs border border-slate-200/90"
        >
          {errorMessage && (
            <div className="mb-5 bg-rose-50 border border-rose-200 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl text-rose-700 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Package Switcher (4 Options Grid) */}
          <div className="mb-5 sm:mb-6">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              ১. প্যাকেজ নির্বাচন করুন:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              
              {/* Combo Option (Recommended) */}
              <button
                type="button"
                onClick={() => handleSelectPackage('combo')}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition flex items-center justify-between relative cursor-pointer ${
                  isCombo
                    ? 'border-2 border-slate-950 bg-slate-50/60 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-950">{comboQty} পিস মেগা কম্বো</span>
                    <span className="text-[9px] sm:text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                      {comboFreeDelivery ? 'ফ্রি ডেলিভারি' : `৳${comboSavings} ছাড়`}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 block mt-0.5">
                    সব কালার ({comboQty} পিস) + গিফট বক্স
                  </span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-black text-slate-950 text-sm sm:text-base">৳{comboPrice}</span>
                  <span className="block text-[9px] sm:text-[10px] text-slate-400 line-through">৳{regularComboPrice}</span>
                </div>
              </button>

              {/* 3 Pcs Pack */}
              <button
                type="button"
                onClick={() => handleSelectPackage('three_pcs')}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition flex items-center justify-between relative cursor-pointer ${
                  isThreePcs
                    ? 'border-2 border-slate-950 bg-slate-50/60 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-950">৩ পিস স্মার্ট প্যাক</span>
                    <span className="text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      ৳{threePcsSavings} ছাড়
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 block mt-0.5">
                    পছন্দের যেকোনো ৩টি কালার
                  </span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-black text-slate-950 text-sm sm:text-base">৳{threePcsPrice}</span>
                  <span className="block text-[9px] sm:text-[10px] text-slate-400 line-through">৳{regularThreePcsPrice}</span>
                </div>
              </button>

              {/* 2 Pcs Pack */}
              <button
                type="button"
                onClick={() => handleSelectPackage('two_pcs')}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition flex items-center justify-between relative cursor-pointer ${
                  isTwoPcs
                    ? 'border-2 border-slate-950 bg-slate-50/60 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-950">২ পিস ডুও প্যাক</span>
                    <span className="text-[9px] sm:text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                      ৳{twoPcsSavings} ছাড়
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 block mt-0.5">
                    পছন্দের যেকোনো ২টি কালার
                  </span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-black text-slate-950 text-sm sm:text-base">৳{twoPcsPrice}</span>
                  <span className="block text-[9px] sm:text-[10px] text-slate-400 line-through">৳{regularTwoPcsPrice}</span>
                </div>
              </button>

              {/* Single Option */}
              <button
                type="button"
                onClick={() => handleSelectPackage('single')}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition flex items-center justify-between relative cursor-pointer ${
                  isSingle
                    ? 'border-2 border-slate-950 bg-slate-50/60 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-950">১ পিস ট্রায়াল প্যাক</span>
                    {singleSavings > 0 && (
                      <span className="text-[9px] sm:text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                        ৳{singleSavings} ছাড়
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 block mt-0.5">পছন্দের যেকোনো ১টি কালার</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-black text-slate-950 text-sm sm:text-base">৳{singlePrice}</span>
                  <span className="block text-[9px] sm:text-[10px] text-slate-400 line-through">৳{regularSinglePrice}</span>
                </div>
              </button>

            </div>
          </div>

          {/* 2. Color Selection */}
          <div className="mb-5 sm:mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                ২. কালার নির্বাচন করুন:
              </label>
              {(isTwoPcs || isThreePcs) && (
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {isTwoPcs ? (
                    multiColors.length === 2
                      ? '✓ ২টি কালার নির্বাচিত'
                      : '✓ ১টি কালার নির্বাচিত'
                  ) : (
                    multiColors.length === 3
                      ? '✓ ৩টি কালার নির্বাচিত'
                      : `✓ ${multiColors.length}টি কালার`
                  )}
                </span>
              )}
            </div>

            {isCombo ? (
              <div className="bg-slate-50 border border-slate-200 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-slate-900 shrink-0" />
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-900">মেগা কম্বোতে পাচ্ছেন {product?.comboQuantity || product?.colors?.length || 4}টি কালার: </span>
                  <span>
                    {(product?.colors && product.colors.length > 0)
                      ? product.colors.map(c => c.name.split(' ')[0]).join(', ') + ' (১টি করে)।'
                      : 'নেভি ব্লু, মিন্ট গ্রিন, চারকোল গ্রে এবং লাইট অ্যাশ গ্রে (১টি করে)।'}
                  </span>
                </div>
              </div>
            ) : (isTwoPcs || isThreePcs) ? (
              <div>
                <p className="text-[11px] sm:text-xs text-slate-500 mb-2">
                  নিচের কালারগুলোতে ক্লিক করে পছন্দ নির্বাচন করুন:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  {product?.colors?.map((c) => {
                    const colorPcs = currentSizeObj?.colorStock?.[c.id] ?? 0;
                    const isColorSoldOut = colorPcs <= 0;
                    const isSelected = multiColors.includes(c.id);

                    return (
                      <button
                        type="button"
                        key={c.id}
                        disabled={isColorSoldOut}
                        onClick={() => toggleMultiColor(c.id, isTwoPcs ? 2 : 3)}
                        className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition text-center flex flex-col items-center relative cursor-pointer ${
                          isColorSoldOut
                            ? 'border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed'
                            : isSelected
                            ? 'border-2 border-slate-950 bg-slate-50/70 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-slate-950 text-white text-[9px] font-black flex items-center justify-center">
                            ✓
                          </div>
                        )}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden bg-slate-50 p-0.5 mb-1 flex items-center justify-center">
                          <img src={c.image} alt={c.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-slate-900 truncate w-full">{c.name.split(' ')[0]}</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                          {isColorSoldOut ? 'স্টক শেষ' : isSelected ? 'নির্বাচিত' : `${colorPcs} পিস`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {product?.colors?.map((c) => {
                  const colorPcs = currentSizeObj?.colorStock?.[c.id] ?? 0;
                  const isColorSoldOut = colorPcs <= 0;
                  const isSelected = selectedColor === c.id;

                  return (
                    <button
                      type="button"
                      key={c.id}
                      disabled={isColorSoldOut}
                      onClick={() => setSelectedColor(c.id)}
                      className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition text-center flex flex-col items-center relative cursor-pointer ${
                        isColorSoldOut
                          ? 'border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'border-2 border-slate-950 bg-slate-50/70 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-slate-950 text-white text-[9px] font-black flex items-center justify-center">
                          ✓
                        </div>
                      )}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden bg-slate-50 p-0.5 mb-1 flex items-center justify-center">
                        <img src={c.image} alt={c.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-900 truncate w-full">{c.name.split(' ')[0]}</span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                        {isColorSoldOut ? 'স্টক শেষ' : `${colorPcs} পিস`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Size & Quantity */}
          <div className="mb-5 sm:mb-6">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              ৩. সাইজ নির্বাচন করুন:
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
              {product?.sizes?.map((s) => {
                const isSelected = selectedSize === s.id;
                const comboAvailable = Math.min(...Object.values(s.colorStock || { navy: 0, mint: 0, grey: 0, lightgrey: 0 }));
                const isOut = isCombo ? (comboAvailable <= 0) : ((s.stock || 0) <= 0);

                return (
                  <button
                    type="button"
                    key={s.id}
                    disabled={isOut}
                    onClick={() => setSelectedSize(s.id)}
                    className={`py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl sm:rounded-2xl border font-bold text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      isOut
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                        : isSelected
                        ? 'border-2 border-slate-950 bg-slate-950 text-white shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm font-extrabold">{s.id}</span>
                    <span className={`text-[9px] sm:text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {s.waist}"
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-5 sm:mb-6 flex items-center justify-between p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-xs font-bold text-slate-900 block">অর্ডার পরিমাণ:</span>
              <span className="text-[10px] sm:text-[11px] text-slate-500">
                {isCombo ? 'প্রতি বক্সে ৪ পিস' : isThreePcs ? 'প্রতি প্যাকে ৩ পিস' : isTwoPcs ? 'প্রতি প্যাকে ২ পিস' : '১ পিস প্যাক'}
              </span>
            </div>
            <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white h-9 sm:h-10">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 sm:w-11 h-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-sm flex items-center justify-center transition cursor-pointer"
              >
                -
              </button>
              <div className="w-10 sm:w-12 text-center font-bold text-slate-900 text-sm">
                {quantity}
              </div>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 sm:w-11 h-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-sm flex items-center justify-center transition cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* 4. Customer Delivery Information */}
          <div className="space-y-3 sm:space-y-3.5 mb-5 sm:mb-6 pt-3.5 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                ৪. ডেলিভারির তথ্য দিন:
              </label>
              {(fieldErrors.name || fieldErrors.phone || fieldErrors.address) && (
                <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  সঠিক তথ্য দিন
                </span>
              )}
            </div>

            {/* Name */}
            <div>
              <input
                ref={nameInputRef}
                type="text"
                autoComplete="name"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null }));
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="আপনার নাম লিখুন *"
                className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border text-base sm:text-sm text-slate-900 bg-white transition ${
                  fieldErrors.name 
                    ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-200' 
                    : 'border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.name}</span>
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <input
                ref={phoneInputRef}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: null }));
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="মোবাইল নম্বর (যেমন: 017XXXXXXXX) *"
                className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border text-base sm:text-sm text-slate-900 bg-white transition ${
                  fieldErrors.phone 
                    ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-200' 
                    : 'border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-xs font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.phone}</span>
                </p>
              )}
            </div>

            {/* Delivery Zone (2 clean pills) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              <label
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border cursor-pointer flex items-center justify-between text-xs font-bold transition ${
                  deliveryZone === 'inside'
                    ? 'border-2 border-slate-950 bg-slate-50/80 text-slate-950'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 truncate mr-1">
                  <input
                    type="radio"
                    name="deliveryZone"
                    checked={deliveryZone === 'inside'}
                    onChange={() => setDeliveryZone('inside')}
                    className="accent-slate-950 shrink-0"
                  />
                  <span className="truncate">সিলেটের ভেতরে</span>
                </div>
                <span className={`shrink-0 ${isCombo && comboFreeDelivery ? "text-emerald-600 font-extrabold" : "text-slate-900"}`}>
                  {isCombo && comboFreeDelivery ? "ফ্রি" : `৳${deliveryInsideDhaka}`}
                </span>
              </label>

              <label
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border cursor-pointer flex items-center justify-between text-xs font-bold transition ${
                  deliveryZone === 'outside'
                    ? 'border-2 border-slate-950 bg-slate-50/80 text-slate-950'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 truncate mr-1">
                  <input
                    type="radio"
                    name="deliveryZone"
                    checked={deliveryZone === 'outside'}
                    onChange={() => setDeliveryZone('outside')}
                    className="accent-slate-950 shrink-0"
                  />
                  <span className="truncate">সিলেটের বাইরে</span>
                </div>
                <span className={`shrink-0 ${isCombo && comboFreeDelivery ? "text-emerald-600 font-extrabold" : "text-slate-900"}`}>
                  {isCombo && comboFreeDelivery ? "ফ্রি" : `৳${deliveryOutsideDhaka}`}
                </span>
              </label>
            </div>

            {/* Address */}
            <div>
              <textarea
                ref={addressInputRef}
                rows={2}
                autoComplete="street-address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (fieldErrors.address) setFieldErrors(prev => ({ ...prev, address: null }));
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="সম্পূর্ণ বিস্তারিত ঠিকানা (বাসা/রোড নং, এলাকা, থানা, জেলা) *"
                className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border text-base sm:text-sm text-slate-900 bg-white transition ${
                  fieldErrors.address 
                    ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-200' 
                    : 'border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              />
              {fieldErrors.address && (
                <p className="mt-1 text-xs font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.address}</span>
                </p>
              )}
            </div>
          </div>

          {/* 5. Minimal Order Summary Receipt */}
          <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 mb-5 sm:mb-6 flex items-center justify-between">
            <div>
              <span className="text-[11px] sm:text-xs text-slate-500 block">মোট প্রদেয় (ক্যাশ অন ডেলিভারি):</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {isCombo ? '৪ পিস কম্বো' : isThreePcs ? '৩ পিস প্যাক' : isTwoPcs ? '২ পিস প্যাক' : '১ পিস'} • সাইজ: {selectedSize} • ডেলিভারি: {deliveryCharge === 0 ? 'ফ্রি' : `৳${deliveryCharge}`}
              </span>
            </div>
            <div className="text-right shrink-0 ml-2">
              <span className="text-xl sm:text-2xl font-black text-slate-950">৳{grandTotal}</span>
            </div>
          </div>

          {/* Error Banner Directly Above Submit Button */}
          {errorMessage && (
            <div
              ref={errorBannerRef}
              className="mb-4 bg-rose-50 border border-rose-300 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-rose-900"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-rose-900">
                    অর্ডার কনফার্ম করা যাচ্ছে না:
                  </h4>
                  <p className="text-xs font-medium text-rose-700 mt-0.5">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6. Solid Confident Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-sm sm:text-base transition-all cursor-pointer shadow-2xs active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                অর্ডার পাঠানো হচ্ছে...
              </span>
            ) : (
              <>
                <span>অর্ডার নিশ্চিত করুন — ৳{grandTotal}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </>
            )}
          </button>

          {/* Trust Guarantees */}
          <div className="mt-3.5 sm:mt-4 flex items-center justify-center gap-4 sm:gap-5 text-[10px] sm:text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-slate-700" />
              পণ্য দেখে মূল্য পরিশোধ
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
              ১০০% কোয়ালিটি নিশ্চয়তা
            </span>
          </div>

        </form>

      </div>
    </section>
  );
}
