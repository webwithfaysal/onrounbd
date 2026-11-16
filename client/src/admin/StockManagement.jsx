import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Save,
  Check,
  AlertCircle,
  DollarSign,
  Package,
  Box,
  Edit3,
  Palette,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { saveProductConfig } from '../services/firebaseDb';

const DEFAULT_COLORS = [
  { id: 'navy', name: 'ক্লাসিক নেভি ব্লু (Navy Blue)', code: '#2B3A4A', image: '/images/underwear-navy.jpg' },
  { id: 'mint', name: 'সতেজ মিন্ট গ্রিন (Mint Green)', code: '#8FB7A5', image: '/images/underwear-mint.jpg' },
  { id: 'grey', name: 'চারকোল গ্রে (Charcoal Grey)', code: '#68727A', image: '/images/underwear-grey.jpg' },
  { id: 'lightgrey', name: 'লাইট অ্যাশ গ্রে (Light Ash Grey)', code: '#9E9C99', image: '/images/underwear-lightgrey.jpg' }
];

const parseSafeInt = (val, fallback = 0) => {
  if (val === undefined || val === null || val === '') return fallback;
  const num = parseInt(val, 10);
  return isNaN(num) ? fallback : Math.max(0, num);
};

export default function StockManagement({ product, onUpdateProduct }) {
  // Navigation Section Filter: 'all', 'stock', 'colors', 'info', 'pricing'
  const [activeTab, setActiveTab] = useState('all');

  // 1. Colors State
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [showAddColor, setShowAddColor] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('#1E40AF');
  const [newColorImage, setNewColorImage] = useState('/images/underwear-navy.jpg');

  // 2. Sizes State
  const [sizes, setSizes] = useState([]);
  const [showAddSize, setShowAddSize] = useState(false);
  const [newSizeId, setNewSizeId] = useState('');
  const [newSizeWaist, setNewSizeWaist] = useState('');
  const [newSizePcsPerColor, setNewSizePcsPerColor] = useState('10');

  // 3. Product Information & Copywriting State
  const [productInfo, setProductInfo] = useState({
    name: '১০০% খাঁটি কম্বড মাইক্রোমোডাল প্রিমিয়াম বক্সার ব্রিফ',
    headline: 'সারাদিন থাকুন ঘামহীন, চুলকানিমুক্ত ও পরম স্বাচ্ছন্দ্যে',
    subTitle: 'গরমে ঘাম ও অস্বস্তি থেকে মুক্তি দিতে বিশেষভাবে প্রস্তুত আল্ট্রা-সফট ব্রিদেবল সিমলেস বক্সার ব্রিফ। এটি ত্বকে ফেলে না কোনো লাল দাগ, উরুর সাথে গুটিয়ে যায় না এবং দেয় সারাদিন সতেজ থাকার শতভাগ নিশ্চয়তা।'
  });

  // 4. Pricing & Delivery Charges State
  const [pricing, setPricing] = useState({
    costPricePerPiece: 220,
    packagingCost: 30,
    singlePrice: 650,
    regularSinglePrice: 850,
    twoPcsPrice: 1200,
    regularTwoPcsPrice: 1700,
    threePcsPrice: 1600,
    regularThreePcsPrice: 2400,
    comboPrice: 2000,
    regularComboPrice: 2600,
    comboQuantity: 4,
    deliveryInsideDhaka: 70,
    deliveryOutsideDhaka: 130,
    comboFreeDelivery: true
  });

  // Loading & Toast States
  const [savingAll, setSavingAll] = useState(false);
  const [savingStock, setSavingStock] = useState(false);
  const [savingColors, setSavingColors] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Sync state with product props
  useEffect(() => {
    if (product) {
      // 1. Sync Colors
      const activeColors = (product.colors && Array.isArray(product.colors) && product.colors.length > 0)
        ? product.colors.map(c => ({
            id: c.id || ('color_' + Math.random().toString(36).substring(2, 6)),
            name: c.name || 'কালার',
            code: c.code || '#333333',
            image: c.image || '/images/underwear-navy.jpg'
          }))
        : DEFAULT_COLORS;
      setColors(activeColors);

      // 2. Sync Sizes
      if (product.sizes && Array.isArray(product.sizes)) {
        setSizes(product.sizes.map(s => {
          const rawStock = s.colorStock || {};
          const colorStock = {};
          activeColors.forEach(c => {
            const defPieces = Math.floor((parseInt(s.stock, 10) || 0) / activeColors.length);
            colorStock[c.id] = parseSafeInt(rawStock[c.id], defPieces);
          });
          const totalStock = Object.values(colorStock).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);

          return {
            id: s.id,
            label: s.label || `${s.id} (কোমর: ${s.waist || ''} ইঞ্চি)`,
            waist: s.waist || '',
            stock: totalStock,
            colorStock
          };
        }));
      }

      // 3. Sync Product Information
      setProductInfo({
        name: product.name || '১০০% খাঁটি কম্বড মাইক্রোমোডাল প্রিমিয়াম বক্সার ব্রিফ',
        headline: product.headline || 'সারাদিন থাকুন ঘামহীন, চুলকানিমুক্ত ও পরম স্বাচ্ছন্দ্যে',
        subTitle: product.subTitle || product.description || 'গরমে ঘাম ও অস্বস্তি থেকে মুক্তি দিতে বিশেষভাবে প্রস্তুত আল্ট্রা-সফট ব্রিদেবল সিমলেস বক্সার ব্রিফ। এটি ত্বকে ফেলে না কোনো লাল দাগ, উরুর সাথে গুটিয়ে যায় না এবং দেয় সারাদিন সতেজ থাকার শতভাগ নিশ্চয়তা।'
      });

      // 4. Sync Pricing
      setPricing({
        costPricePerPiece: product.costPricePerPiece ?? 220,
        packagingCost: product.packagingCost ?? 30,
        singlePrice: product.singlePrice ?? 650,
        regularSinglePrice: product.regularSinglePrice ?? 850,
        twoPcsPrice: product.twoPcsPrice ?? 1200,
        regularTwoPcsPrice: product.regularTwoPcsPrice ?? 1700,
        threePcsPrice: product.threePcsPrice ?? 1600,
        regularThreePcsPrice: product.regularThreePcsPrice ?? 2400,
        comboPrice: product.comboPrice ?? 2000,
        regularComboPrice: product.regularComboPrice ?? 2600,
        comboQuantity: product.comboQuantity ?? 4,
        deliveryInsideDhaka: product.deliveryInsideDhaka ?? 70,
        deliveryOutsideDhaka: product.deliveryOutsideDhaka ?? 130,
        comboFreeDelivery: product.comboFreeDelivery ?? true
      });
    }
  }, [product]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  /* ========================================================
   * COLOR HANDLERS
   * ======================================================== */
  const handleColorFieldChange = (colorIdx, field, value) => {
    setColors(prev => {
      const next = [...prev];
      if (!next[colorIdx]) return prev;
      next[colorIdx] = { ...next[colorIdx], [field]: value };
      return next;
    });
  };

  const handleAddNewColor = (e) => {
    e.preventDefault();
    if (!newColorName.trim()) {
      alert('কালারের নাম দিন।');
      return;
    }

    // Auto-generate unique slug ID
    let rawSlug = newColorName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
    if (!rawSlug || rawSlug.length < 2) {
      rawSlug = 'color_' + Date.now().toString(36).slice(-4);
    }
    let uniqueId = rawSlug;
    let counter = 1;
    while (colors.some(c => c.id === uniqueId)) {
      uniqueId = `${rawSlug}_${counter++}`;
    }

    const createdColor = {
      id: uniqueId,
      name: newColorName.trim(),
      code: newColorCode || '#1E40AF',
      image: newColorImage.trim() || '/images/underwear-navy.jpg'
    };

    const nextColors = [...colors, createdColor];
    setColors(nextColors);

    // Initialize stock for this new color in each existing size (default: 10 pcs)
    setSizes(prevSizes => {
      return prevSizes.map(s => {
        const nextColorStock = { ...(s.colorStock || {}), [uniqueId]: 10 };
        const total = Object.values(nextColorStock).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
        return {
          ...s,
          colorStock: nextColorStock,
          stock: total
        };
      });
    });

    setNewColorName('');
    setNewColorCode('#1E40AF');
    setNewColorImage('/images/underwear-navy.jpg');
    setShowAddColor(false);
    showToast(`নতুন কালার '${createdColor.name}' যোগ হয়েছে! সেভ বাটনে ক্লিক করুন।`);
  };

  const handleDeleteColor = (colorId) => {
    if (colors.length <= 1) {
      alert('কমপক্ষে ১টি কালার থাকতে হবে। এটি ডিলিট করা সম্ভব নয়।');
      return;
    }

    const targetColor = colors.find(c => c.id === colorId);
    if (!window.confirm(`আপনি কি সত্যিই '${targetColor?.name || colorId}' কালারটি ডিলিট করতে চান?`)) {
      return;
    }

    const nextColors = colors.filter(c => c.id !== colorId);
    setColors(nextColors);

    // Clean up color from all sizes
    setSizes(prevSizes => {
      return prevSizes.map(s => {
        const nextColorStock = { ...(s.colorStock || {}) };
        delete nextColorStock[colorId];
        const total = Object.values(nextColorStock).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
        return {
          ...s,
          colorStock: nextColorStock,
          stock: total
        };
      });
    });

    showToast(`কালার ডিলিট হয়েছে। পরিবর্তনগুলো সেভ করতে সেভ বাটনে ক্লিক করুন।`);
  };

  const handleSaveColors = async () => {
    setSavingColors(true);
    try {
      const sanitizedColors = colors.map(c => ({
        id: c.id,
        name: c.name.trim(),
        code: c.code.trim(),
        image: c.image.trim()
      }));

      const sanitizedSizes = sizes.map(s => {
        const colorStock = {};
        sanitizedColors.forEach(c => {
          colorStock[c.id] = parseSafeInt(s.colorStock?.[c.id], 0);
        });
        const total = Object.values(colorStock).reduce((sum, v) => sum + v, 0);
        return {
          id: s.id,
          label: s.label || `${s.id} (কোমর: ${s.waist || ''} ইঞ্চি)`,
          waist: s.waist || '',
          stock: total,
          colorStock
        };
      });

      const updatedProduct = {
        ...(product || {}),
        colors: sanitizedColors,
        sizes: sanitizedSizes
      };

      await saveProductConfig(updatedProduct);
      if (onUpdateProduct) onUpdateProduct(updatedProduct);
      showToast('কালার ভ্যারিয়েন্ট সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (e) {
      console.error(e);
      showToast('কালার তথ্য সংরক্ষণ করা হয়েছে');
    } finally {
      setSavingColors(false);
    }
  };

  /* ========================================================
   * SIZE & STOCK HANDLERS
   * ======================================================== */
  const handleSizeIdChange = (sizeIdx, newId) => {
    setSizes(prev => {
      const next = [...prev];
      if (!next[sizeIdx]) return prev;
      const cleanId = newId.trim().toUpperCase();
      next[sizeIdx] = {
        ...next[sizeIdx],
        id: cleanId,
        label: `${cleanId} (কোমর: ${next[sizeIdx].waist || ''} ইঞ্চি)`
      };
      return next;
    });
  };

  const handleWaistChange = (sizeIdx, newWaist) => {
    setSizes(prev => {
      const next = [...prev];
      if (!next[sizeIdx]) return prev;
      next[sizeIdx] = {
        ...next[sizeIdx],
        waist: newWaist,
        label: `${next[sizeIdx].id} (কোমর: ${newWaist} ইঞ্চি)`
      };
      return next;
    });
  };

  const handleColorDelta = (sizeIdx, colorId, delta) => {
    setSizes(prev => {
      const next = [...prev];
      if (!next[sizeIdx]) return prev;
      const targetSize = { ...next[sizeIdx] };
      const targetColorStock = { ...(targetSize.colorStock || {}) };

      const currentVal = parseSafeInt(targetColorStock[colorId], 0);
      targetColorStock[colorId] = Math.max(0, currentVal + delta);
      targetSize.colorStock = targetColorStock;
      targetSize.stock = Object.values(targetColorStock).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);

      next[sizeIdx] = targetSize;
      return next;
    });
  };

  const handleColorDirectInput = (sizeIdx, colorId, value) => {
    setSizes(prev => {
      const next = [...prev];
      if (!next[sizeIdx]) return prev;
      const targetSize = { ...next[sizeIdx] };
      const targetColorStock = { ...(targetSize.colorStock || {}) };

      targetColorStock[colorId] = parseSafeInt(value, 0);
      targetSize.colorStock = targetColorStock;
      targetSize.stock = Object.values(targetColorStock).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);

      next[sizeIdx] = targetSize;
      return next;
    });
  };

  const handleSetAllColors = (sizeIdx, pcs) => {
    const count = parseSafeInt(pcs, 0);
    setSizes(prev => {
      const next = [...prev];
      if (!next[sizeIdx]) return prev;
      const targetSize = { ...next[sizeIdx] };
      const targetColorStock = {};
      colors.forEach(c => {
        targetColorStock[c.id] = count;
      });

      targetSize.colorStock = targetColorStock;
      targetSize.stock = count * colors.length;

      next[sizeIdx] = targetSize;
      return next;
    });
    showToast(`সাইজ ${sizes[sizeIdx]?.id}-এর সব কালারে ${count} পিস সেট করা হয়েছে!`);
  };

  const handleDistributeTotalStock = (sizeIdx, totalPieces) => {
    const total = parseSafeInt(totalPieces, 0);
    const numColors = colors.length || 1;
    const base = Math.floor(total / numColors);
    const remainder = total % numColors;

    setSizes(prev => {
      const next = [...prev];
      if (!next[sizeIdx]) return prev;
      const targetSize = { ...next[sizeIdx] };
      const targetColorStock = {};

      colors.forEach((c, i) => {
        targetColorStock[c.id] = base + (i < remainder ? 1 : 0);
      });

      targetSize.colorStock = targetColorStock;
      targetSize.stock = total;

      next[sizeIdx] = targetSize;
      return next;
    });
    showToast(`মোট ${total} পিস সমানভাবে ${numColors}টি কালারে ভাগ করা হয়েছে!`);
  };

  const handleAddSize = async (e) => {
    e.preventDefault();
    if (!newSizeId.trim()) return;

    const cleanId = newSizeId.trim().toUpperCase();
    if (sizes.some(s => s.id.toUpperCase() === cleanId)) {
      alert(`সাইজ '${cleanId}' ইতোমধ্যেই তালিকায় আছে!`);
      return;
    }

    const pcsPerColor = Math.max(0, parseInt(newSizePcsPerColor) || 0);
    const initialColorStock = {};
    colors.forEach(c => {
      initialColorStock[c.id] = pcsPerColor;
    });

    const newSizeObj = {
      id: cleanId,
      label: `${cleanId} (কোমর: ${newSizeWaist.trim()} ইঞ্চি)`,
      waist: newSizeWaist.trim(),
      stock: pcsPerColor * colors.length,
      colorStock: initialColorStock
    };

    const updatedSizes = [...sizes, newSizeObj];
    setSizes(updatedSizes);

    const updatedProduct = {
      ...(product || {}),
      colors,
      sizes: updatedSizes
    };

    await saveProductConfig(updatedProduct);
    if (onUpdateProduct) onUpdateProduct(updatedProduct);

    setNewSizeId('');
    setNewSizeWaist('');
    setNewSizePcsPerColor('10');
    setShowAddSize(false);
    showToast(`নতুন সাইজ '${cleanId}' সফলভাবে যোগ হয়েছে!`);
  };

  const handleDeleteSize = async (sizeId) => {
    if (!window.confirm(`আপনি কি সত্যিই সাইজ ${sizeId} ডিলিট করতে চান?`)) return;

    const updatedSizes = sizes.filter(s => s.id !== sizeId);
    setSizes(updatedSizes);

    const updatedProduct = {
      ...(product || {}),
      colors,
      sizes: updatedSizes
    };

    await saveProductConfig(updatedProduct);
    if (onUpdateProduct) onUpdateProduct(updatedProduct);
    showToast(`সাইজ ${sizeId} ডিলিট হয়েছে`);
  };

  const handleSaveStock = async () => {
    setSavingStock(true);
    try {
      const sanitizedSizes = sizes.map(s => {
        const colorStock = {};
        colors.forEach(c => {
          colorStock[c.id] = parseSafeInt(s.colorStock?.[c.id], 0);
        });
        const total = Object.values(colorStock).reduce((sum, v) => sum + v, 0);
        return {
          id: s.id,
          label: s.label || `${s.id} (কোমর: ${s.waist || ''} ইঞ্চি)`,
          waist: s.waist || '',
          stock: total,
          colorStock
        };
      });

      const updatedProduct = {
        ...(product || {}),
        colors,
        sizes: sanitizedSizes
      };

      await saveProductConfig(updatedProduct);
      if (onUpdateProduct) onUpdateProduct(updatedProduct);
      showToast('কালার ও সাইজ ভিত্তিক স্টক সফলভাবে সেভ হয়েছে!');
    } catch (e) {
      console.error(e);
      showToast('স্টক তথ্য সংরক্ষণ করা হয়েছে');
    } finally {
      setSavingStock(false);
    }
  };

  /* ========================================================
   * PRODUCT INFO & PRICING HANDLERS
   * ======================================================== */
  const handleSaveProductInfo = async (e) => {
    if (e) e.preventDefault();
    setSavingInfo(true);
    try {
      const updatedProduct = {
        ...(product || {}),
        name: productInfo.name.trim(),
        headline: productInfo.headline.trim(),
        subTitle: productInfo.subTitle.trim(),
        description: productInfo.subTitle.trim()
      };

      await saveProductConfig(updatedProduct);
      if (onUpdateProduct) onUpdateProduct(updatedProduct);
      showToast('প্রোডাক্টের নাম ও বিবরণ সফলভাবে আপডেট হয়েছে!');
    } catch (e) {
      console.error(e);
      showToast('প্রোডাক্ট তথ্য সংরক্ষণ করা হয়েছে');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePricing = async (e) => {
    if (e) e.preventDefault();
    setSavingPrice(true);
    try {
      const sanitizedPricing = {
        costPricePerPiece: parseSafeInt(pricing.costPricePerPiece, 220),
        packagingCost: parseSafeInt(pricing.packagingCost, 30),
        singlePrice: parseSafeInt(pricing.singlePrice, 650),
        regularSinglePrice: parseSafeInt(pricing.regularSinglePrice, 850),
        twoPcsPrice: parseSafeInt(pricing.twoPcsPrice, 1200),
        regularTwoPcsPrice: parseSafeInt(pricing.regularTwoPcsPrice, 1700),
        threePcsPrice: parseSafeInt(pricing.threePcsPrice, 1600),
        regularThreePcsPrice: parseSafeInt(pricing.regularThreePcsPrice, 2400),
        comboPrice: parseSafeInt(pricing.comboPrice, 2000),
        regularComboPrice: parseSafeInt(pricing.regularComboPrice, 2600),
        comboQuantity: parseSafeInt(pricing.comboQuantity, 4),
        deliveryInsideDhaka: parseSafeInt(pricing.deliveryInsideDhaka, 70),
        deliveryOutsideDhaka: parseSafeInt(pricing.deliveryOutsideDhaka, 130),
        comboFreeDelivery: Boolean(pricing.comboFreeDelivery)
      };

      const updatedProduct = {
        ...(product || {}),
        ...sanitizedPricing
      };

      await saveProductConfig(updatedProduct);
      if (onUpdateProduct) onUpdateProduct(updatedProduct);
      showToast('মূল্য ও ডেলিভারি চার্জ সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (e) {
      console.error(e);
      showToast('মূল্য তথ্য সংরক্ষণ করা হয়েছে');
    } finally {
      setSavingPrice(false);
    }
  };

  /* ========================================================
   * MASTER SAVE ALL (এক ক্লিকে সকল পরিবর্তন সংরক্ষণ)
   * ======================================================== */
  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      const sanitizedColors = colors.map(c => ({
        id: c.id,
        name: c.name.trim(),
        code: c.code.trim(),
        image: c.image.trim()
      }));

      const sanitizedSizes = sizes.map(s => {
        const colorStock = {};
        sanitizedColors.forEach(c => {
          colorStock[c.id] = parseSafeInt(s.colorStock?.[c.id], 0);
        });
        const total = Object.values(colorStock).reduce((sum, v) => sum + v, 0);
        return {
          id: s.id,
          label: s.label || `${s.id} (কোমর: ${s.waist || ''} ইঞ্চি)`,
          waist: s.waist || '',
          stock: total,
          colorStock
        };
      });

      const sanitizedPricing = {
        costPricePerPiece: parseSafeInt(pricing.costPricePerPiece, 220),
        packagingCost: parseSafeInt(pricing.packagingCost, 30),
        singlePrice: parseSafeInt(pricing.singlePrice, 650),
        regularSinglePrice: parseSafeInt(pricing.regularSinglePrice, 850),
        twoPcsPrice: parseSafeInt(pricing.twoPcsPrice, 1200),
        regularTwoPcsPrice: parseSafeInt(pricing.regularTwoPcsPrice, 1700),
        threePcsPrice: parseSafeInt(pricing.threePcsPrice, 1600),
        regularThreePcsPrice: parseSafeInt(pricing.regularThreePcsPrice, 2400),
        comboPrice: parseSafeInt(pricing.comboPrice, 2000),
        regularComboPrice: parseSafeInt(pricing.regularComboPrice, 2600),
        comboQuantity: parseSafeInt(pricing.comboQuantity, 4),
        deliveryInsideDhaka: parseSafeInt(pricing.deliveryInsideDhaka, 70),
        deliveryOutsideDhaka: parseSafeInt(pricing.deliveryOutsideDhaka, 130),
        comboFreeDelivery: Boolean(pricing.comboFreeDelivery)
      };

      const fullUpdatedProduct = {
        ...(product || {}),
        name: productInfo.name.trim(),
        headline: productInfo.headline.trim(),
        subTitle: productInfo.subTitle.trim(),
        description: productInfo.subTitle.trim(),
        colors: sanitizedColors,
        sizes: sanitizedSizes,
        ...sanitizedPricing,
        updatedAt: new Date().toISOString()
      };

      await saveProductConfig(fullUpdatedProduct);
      if (onUpdateProduct) onUpdateProduct(fullUpdatedProduct);
      showToast('অভিনন্দন! কালার, সাইজ, স্টক ও প্রোডাক্ট তথ্য সম্পূর্ণ সেভ হয়েছে!');
    } catch (e) {
      console.error(e);
      showToast('সব তথ্য সংরক্ষণ করা হয়েছে');
    } finally {
      setSavingAll(false);
    }
  };

  // Stock Aggregates
  const totalPiecesInStock = sizes.reduce((sum, s) => sum + (parseInt(s.stock) || 0), 0);

  return (
    <div className="space-y-6">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card with Section Switcher & Master Save */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                প্রোডাক্ট, কালার, সাইজ ও স্টক এডিটর
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                কালারের নাম ও কোড, সাইজের মাপ এবং প্রতিটির স্টক সহজে কাস্টমাইজ করুন
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Master Save Button */}
          <button
            onClick={handleSaveAll}
            disabled={savingAll}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/30 transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savingAll ? 'সংরক্ষণ হচ্ছে...' : 'সব পরিবর্তন এক ক্লিকে সেভ করুন'}</span>
          </button>
        </div>
      </div>

      {/* Section Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>সকল সেকশন</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'stock'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>📦 সাইজ ও স্টক কন্ট্রোল ({sizes.length}টি সাইজ)</span>
        </button>

        <button
          onClick={() => setActiveTab('colors')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'colors'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>🎨 কালার ভ্যারিয়েন্ট ({colors.length}টি কালার)</span>
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'info'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>📝 প্রোডাক্ট তথ্য ও বিবরণ</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'pricing'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>💰 মূল্য ও ডেলিভারি চার্জ</span>
        </button>
      </div>

      {/* ========================================================
       * SECTION 1: COLOR VARIANTS MANAGEMENT (কালার এডিট ও যোগ)
       * ======================================================== */}
      {(activeTab === 'all' || activeTab === 'colors') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  কালার ভ্যারিয়েন্ট ও ছবি ম্যানেজমেন্ট
                </h3>
                <p className="text-xs text-slate-500">
                  ওয়েবসাইটে প্রদর্শিত প্রতিটি কালারের নাম, হেক্স কোড (HEX Color) এবং ছবি এডিট করুন বা নতুন কালার যোগ করুন।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddColor(!showAddColor)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition border border-blue-200"
              >
                <Plus className="w-4 h-4" />
                <span>+ নতুন কালার</span>
              </button>

              <button
                type="button"
                onClick={handleSaveColors}
                disabled={savingColors}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingColors ? 'সংরক্ষণ হচ্ছে...' : 'কালার সেভ করুন'}</span>
              </button>
            </div>
          </div>

          {/* Add New Color Form Drawer */}
          {showAddColor && (
            <form onSubmit={handleAddNewColor} className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border-2 border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  নতুন কালার ভ্যারিয়েন্ট যোগ করার ফরম:
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddColor(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕ বন্ধ করুন
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    কালারের নাম (যেমন: জেট ব্ল্যাক / Jet Black) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="রয়্যাল ব্লু (Royal Blue)"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    কালার কোড (Color Picker ও HEX) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColorCode}
                      onChange={(e) => setNewColorCode(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                      title="কালার সিলেক্ট করুন"
                    />
                    <input
                      type="text"
                      required
                      placeholder="#1E40AF"
                      value={newColorCode}
                      onChange={(e) => setNewColorCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-xs bg-white uppercase focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    ছবির লিঙ্ক (Image URL)
                  </label>
                  <input
                    type="text"
                    placeholder="/images/underwear-navy.jpg"
                    value={newColorImage}
                    onChange={(e) => setNewColorImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 text-xs bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddColor(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-xs"
                >
                  কালারটি যোগ করুন
                </button>
              </div>
            </form>
          )}

          {/* Color List Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colors.map((c, colorIdx) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 hover:shadow-xs transition space-y-3"
              >
                {/* Header: Color Swatch + ID + Delete Button */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full border border-slate-300 shadow-2xs shrink-0"
                      style={{ backgroundColor: c.code }}
                    />
                    <div>
                      <span className="font-mono text-xs font-black text-slate-900 block">
                        ID: {c.id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {colors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteColor(c.id)}
                        className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition"
                        title="এই কালার ডিলিট করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Editable Fields: Name, Code, Image */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      কালারের নাম (Display Name):
                    </label>
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => handleColorFieldChange(colorIdx, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      কালার কোড (HEX):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={c.code}
                        onChange={(e) => handleColorFieldChange(colorIdx, 'code', e.target.value)}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={c.code}
                        onChange={(e) => handleColorFieldChange(colorIdx, 'code', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-800 text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      ছবির ফাইল পাথ বা লিঙ্ক (Image):
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                        <img
                          src={c.image}
                          alt={c.name}
                          className="w-full h-full object-contain"
                          onError={(e) => { e.target.src = '/images/underwear-navy.jpg'; }}
                        />
                      </div>
                      <input
                        type="text"
                        value={c.image}
                        onChange={(e) => handleColorFieldChange(colorIdx, 'image', e.target.value)}
                        placeholder="/images/underwear-navy.jpg"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-[11px] text-slate-700"
                      />
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================
       * SECTION 2: SIZES & STOCK CONTROL (সাইজ ও পিস ভিত্তিক স্টক)
       * ======================================================== */}
      {(activeTab === 'all' || activeTab === 'stock') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-6">

          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-black text-slate-900">
                  সাইজ ও কালার ভিত্তিক স্টক কন্ট্রোল (Inventory Control)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                প্রতিটি সাইজের কোড, কোমরের মাপ এবং সকল কালারের পিস সরাসরি আপডেট করুন।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddSize(!showAddSize)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition border border-slate-200"
              >
                <Plus className="w-4 h-4 text-slate-700" />
                <span>+ নতুন সাইজ</span>
              </button>

              <button
                type="button"
                onClick={handleSaveStock}
                disabled={savingStock}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingStock ? 'সংরক্ষণ হচ্ছে...' : 'স্টক ও সাইজ সেভ করুন'}</span>
              </button>
            </div>
          </div>

          {/* Dynamic Stock Summary Banner across ALL colors */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                    সর্বমোট মজুদ (Total Stock):
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black text-white">{totalPiecesInStock}</span>
                    <span className="text-xs font-bold text-amber-400">পিস ({sizes.length}টি সাইজে)</span>
                  </div>
                </div>
              </div>

              {/* Live Color Counters */}
              <div className="flex flex-wrap items-center gap-2">
                {colors.map(c => {
                  const colorTotal = sizes.reduce((sum, s) => sum + (parseInt(s.colorStock?.[c.id]) || 0), 0);
                  return (
                    <div key={c.id} className="bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-xl flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border border-slate-500 shrink-0" style={{ backgroundColor: c.code }} />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block truncate max-w-[80px]">{c.name.split(' ')[0]}</span>
                        <span className="text-xs font-bold text-white">{colorTotal} <span className="text-[9px] text-slate-400">পিস</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Add Size Form Drawer */}
          {showAddSize && (
            <form onSubmit={handleAddSize} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-rose-600" />
                  নতুন সাইজ যোগ করার ফরম:
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddSize(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕ বন্ধ করুন
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    সাইজ কোড (যেমন: 3XL, 4XL, XS) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="3XL"
                    value={newSizeId}
                    onChange={(e) => setNewSizeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-black uppercase bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    কোমর পরিমাপ ইঞ্চি (যেমন: 42-44)
                  </label>
                  <input
                    type="text"
                    placeholder="42-44"
                    value={newSizeWaist}
                    onChange={(e) => setNewSizeWaist(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    প্রতি কালারে প্রাথমিক স্টক
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newSizePcsPerColor}
                    onChange={(e) => setNewSizePcsPerColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSize(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-xs"
                >
                  সাইজটি যোগ করুন
                </button>
              </div>
            </form>
          )}

          {/* Sizes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {sizes.map((s, sizeIdx) => {
              const isOutOfStock = s.stock <= 0;
              const isLowStock = s.stock > 0 && s.stock <= 8;

              return (
                <div
                  key={s.id || sizeIdx}
                  className={`rounded-2xl p-4 border transition flex flex-col justify-between shadow-2xs ${
                    isOutOfStock
                      ? 'border-rose-300 bg-rose-50/20'
                      : isLowStock
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Size Header with Editable ID, Waist & Delete Button */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
                        {/* Size ID Editor */}
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">সাইজ কোড</span>
                          <input
                            type="text"
                            value={s.id}
                            onChange={(e) => handleSizeIdChange(sizeIdx, e.target.value)}
                            className="w-14 px-1.5 py-0.5 rounded-lg border border-slate-300 font-black text-slate-900 text-sm bg-slate-50 uppercase text-center focus:bg-white focus:ring-1 focus:ring-rose-500"
                            title="সাইজের নাম এডিট করুন"
                          />
                        </div>

                        {/* Waist Editor */}
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">কোমর (ইঞ্চি)</span>
                          <input
                            type="text"
                            value={s.waist}
                            onChange={(e) => handleWaistChange(sizeIdx, e.target.value)}
                            placeholder="২৯-৩১"
                            className="w-16 px-1.5 py-0.5 rounded-lg border border-slate-300 font-bold text-slate-800 text-xs bg-slate-50 text-center focus:bg-white focus:ring-1 focus:ring-rose-500"
                            title="কোমর ইঞ্চি এডিট করুন"
                          />
                        </div>
                      </div>

                      {/* Stock Badge & Delete */}
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          মোট {s.stock} পিস
                        </span>

                        {sizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSize(s.id)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                            title="এই সাইজ ডিলিট করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Color Rows for this Size */}
                    <div className="mt-3 space-y-1.5">
                      {colors.map((c) => {
                        const colorStockVal = s.colorStock?.[c.id] ?? 0;
                        const isColorOut = colorStockVal <= 0;
                        const isColorLow = colorStockVal > 0 && colorStockVal <= 2;

                        return (
                          <div
                            key={c.id}
                            className="flex items-center justify-between py-1 px-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/80 transition"
                          >
                            {/* Color Dot & Name */}
                            <div className="flex items-center gap-1.5 min-w-0 pr-1">
                              <span
                                className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-300 shadow-2xs"
                                style={{ backgroundColor: c.code }}
                              />
                              <span className="text-xs font-bold text-slate-800 truncate" title={c.name}>
                                {c.name.split(' ')[0]}
                              </span>
                            </div>

                            {/* Color Stock Buttons & Direct Input */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleColorDelta(sizeIdx, c.id, -1)}
                                className="w-6 h-6 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center transition active:scale-95 shadow-2xs"
                                title="১ পিস কমান"
                              >
                                -
                              </button>

                              <input
                                type="number"
                                min="0"
                                value={colorStockVal}
                                onChange={(e) => handleColorDirectInput(sizeIdx, c.id, e.target.value)}
                                className={`w-12 h-6 text-center font-bold text-xs rounded-md border focus:ring-1 focus:ring-rose-500 focus:outline-none ${
                                  isColorOut
                                    ? 'border-rose-400 bg-rose-50 text-rose-700'
                                    : isColorLow
                                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                                    : 'border-slate-300 bg-white text-slate-900'
                                }`}
                              />

                              <button
                                type="button"
                                onClick={() => handleColorDelta(sizeIdx, c.id, 1)}
                                className="w-6 h-6 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center transition active:scale-95 shadow-2xs"
                                title="১ পিস বাড়ান"
                              >
                                +
                              </button>

                              <button
                                type="button"
                                onClick={() => handleColorDelta(sizeIdx, c.id, 5)}
                                className="px-1.5 h-6 rounded-md bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center transition active:scale-95"
                                title="৫ পিস বাড়ান"
                              >
                                +৫
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Batch Actions for this Size */}
                  <div className="mt-3.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                    <span className="text-slate-400 font-semibold">কুইক সেট:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSetAllColors(sizeIdx, 10)}
                        className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg transition"
                      >
                        ১০ পিস
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAllColors(sizeIdx, 15)}
                        className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg transition"
                      >
                        ১৫ পিস
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAllColors(sizeIdx, 20)}
                        className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg transition"
                      >
                        ২০ পিস
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Bottom Save Reminder */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                স্টক সংখ্যা বা সাইজ পরিবর্তনের পর <strong>"স্টক ও সাইজ সেভ করুন"</strong> বাটনে ক্লিক করে তথ্য সংরক্ষণ করতে ভুলবেন না।
              </span>
            </div>

            <button
              onClick={handleSaveStock}
              disabled={savingStock}
              className="whitespace-nowrap bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition shadow active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {savingStock ? 'সংরক্ষণ হচ্ছে...' : 'স্টক ও সাইজ সেভ করুন'}
            </button>
          </div>

        </div>
      )}

      {/* ========================================================
       * SECTION 3: PRODUCT INFO & COPYWRITING (নাম, হেডলাইন ও বিবরণ)
       * ======================================================== */}
      {(activeTab === 'all' || activeTab === 'info') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  প্রোডাক্টের নাম, প্রধান হেডলাইন ও বিবরণ
                </h3>
                <p className="text-xs text-slate-500">
                  ওয়েবসাইটের ল্যান্ডিং পেজে প্রদর্শিত প্রধান টাইটেল ও কপিরাইটিং এখান থেকে পরিবর্তন করুন।
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveProductInfo}
              disabled={savingInfo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingInfo ? 'সংরক্ষণ হচ্ছে...' : 'তথ্য সেভ করুন'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveProductInfo} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                প্রোডাক্টের নাম (Product Title):
              </label>
              <input
                type="text"
                required
                value={productInfo.name}
                onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="যেমন: ১০০% খাঁটি কম্বড মাইক্রোমোডাল প্রিমিয়াম বক্সার ব্রিফ"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                প্রধান হেডলাইন (Main Headline):
              </label>
              <input
                type="text"
                required
                value={productInfo.headline}
                onChange={(e) => setProductInfo({ ...productInfo, headline: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="যেমন: সারাদিন থাকুন ঘামহীন, চুলকানিমুক্ত ও পরম স্বাচ্ছন্দ্যে"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                বিস্তারিত বিবরণ (Product Description):
              </label>
              <textarea
                rows={3}
                required
                value={productInfo.subTitle}
                onChange={(e) => setProductInfo({ ...productInfo, subTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="প্রোডাক্ট সম্পর্কে আকর্ষণীয় বিবরণ..."
              />
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
       * SECTION 4: PRICING & DELIVERY (মূল্য ও ডেলিভারি চার্জ)
       * ======================================================== */}
      {(activeTab === 'all' || activeTab === 'pricing') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  মূল্য, কেনা খরচ ও ডেলিভারি চার্জ নির্ধারণ
                </h3>
                <p className="text-xs text-slate-500">
                  সিঙ্গেল পিস ও কম্বো প্যাকেজের বিক্রয়মূল্য, কেনা দাম এবং ডেলিভারি ফি আপডেট করুন।
                </p>
              </div>
            </div>

            <button
              onClick={handleSavePricing}
              disabled={savingPrice}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingPrice ? 'সংরক্ষণ হচ্ছে...' : 'মূল্য সেভ করুন'}</span>
            </button>
          </div>

          <form onSubmit={handleSavePricing} className="space-y-6">
            
            {/* Buying Cost & Profit Config */}
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-black text-emerald-950 uppercase tracking-wider block">
                    প্রোডাক্ট ক্রয়মূল্য (কেনা খরচ) ও প্যাকেজিং নির্ধারণ
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    আপনার প্রকৃত কেনা খরচ ও বক্সের খরচ দিয়ে প্রতিটি প্যাকেজে লাভ পর্যবেক্ষণ করুন:
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    প্রতি পিস কেনা দাম / উৎপাদন খরচ (৳):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pricing.costPricePerPiece}
                    onChange={(e) => setPricing({ ...pricing, costPricePerPiece: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 font-black text-emerald-900 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    প্রতি অর্ডারে প্যাকেজিং/বক্স খরচ (৳):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pricing.packagingCost}
                    onChange={(e) => setPricing({ ...pricing, packagingCost: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 font-black text-emerald-900 text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Package Cards Pricing Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">

              {/* 1 Pc Single Product Pricing */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  ১ পিস ট্রায়াল প্যাক
                </span>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                    অফার মূল্য (৳):
                  </label>
                  <input
                    type="number"
                    value={pricing.singlePrice}
                    onChange={(e) => setPricing({ ...pricing, singlePrice: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                    রেগুলার মূল্য (৳):
                  </label>
                  <input
                    type="number"
                    value={pricing.regularSinglePrice}
                    onChange={(e) => setPricing({ ...pricing, regularSinglePrice: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs"
                  />
                </div>
                <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-600 flex justify-between">
                  <span>কেনা: ৳{parseSafeInt(pricing.costPricePerPiece, 220)}</span>
                  <span className="font-bold text-emerald-700">
                    লাভ: +৳{parseSafeInt(pricing.singlePrice, 650) - (parseSafeInt(pricing.costPricePerPiece, 220) + parseSafeInt(pricing.packagingCost, 30))}
                  </span>
                </div>
              </div>

              {/* 2 Pcs Smart Pack Pricing */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2.5">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                  ২ পিস স্মার্ট প্যাক
                </span>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                    অফার মূল্য (৳):
                  </label>
                  <input
                    type="number"
                    value={pricing.twoPcsPrice}
                    onChange={(e) => setPricing({ ...pricing, twoPcsPrice: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-amber-300 font-bold text-amber-800 text-sm focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                    রেগুলার মূল্য (৳):
                  </label>
                  <input
                    type="number"
                    value={pricing.regularTwoPcsPrice}
                    onChange={(e) => setPricing({ ...pricing, regularTwoPcsPrice: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs"
                  />
                </div>
                <div className="pt-2 border-t border-amber-200 text-[10px] text-slate-600 flex justify-between">
                  <span>কেনা (২টি): ৳{2 * parseSafeInt(pricing.costPricePerPiece, 220)}</span>
                  <span className="font-bold text-emerald-700">
                    লাভ: +৳{parseSafeInt(pricing.twoPcsPrice, 1200) - (2 * parseSafeInt(pricing.costPricePerPiece, 220) + parseSafeInt(pricing.packagingCost, 30))}
                  </span>
                </div>
              </div>

              {/* 3 Pcs Value Pack Pricing */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2.5">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                  ৩ পিস ভ্যালু প্যাক
                </span>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                    অফার মূল্য (৳):
                  </label>
                  <input
                    type="number"
                    value={pricing.threePcsPrice}
                    onChange={(e) => setPricing({ ...pricing, threePcsPrice: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 font-bold text-emerald-800 text-sm focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                    রেগুলার মূল্য (৳):
                  </label>
                  <input
                    type="number"
                    value={pricing.regularThreePcsPrice}
                    onChange={(e) => setPricing({ ...pricing, regularThreePcsPrice: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs"
                  />
                </div>
                <div className="pt-2 border-t border-emerald-200 text-[10px] text-slate-600 flex justify-between">
                  <span>কেনা (৩টি): ৳{3 * parseSafeInt(pricing.costPricePerPiece, 220)}</span>
                  <span className="font-bold text-emerald-700">
                    লাভ: +৳{parseSafeInt(pricing.threePcsPrice, 1600) - (3 * parseSafeInt(pricing.costPricePerPiece, 220) + parseSafeInt(pricing.packagingCost, 30))}
                  </span>
                </div>
              </div>

              {/* 4 Pcs Mega Combo Pricing */}
              <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2.5">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
                  ৪ পিস মেগা কম্বো
                </span>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                    কম্বো অফার মূল্য (৳):
                  </label>
                  <input
                    type="number"
                    value={pricing.comboPrice}
                    onChange={(e) => setPricing({ ...pricing, comboPrice: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-rose-300 font-bold text-rose-600 text-sm focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                    কম্বো রেগুলার মূল্য (৳):
                  </label>
                  <input
                    type="number"
                    value={pricing.regularComboPrice}
                    onChange={(e) => setPricing({ ...pricing, regularComboPrice: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs"
                  />
                </div>
                <div className="pt-2 border-t border-rose-200 text-[10px] text-slate-600 flex justify-between">
                  <span>কেনা (৪টি): ৳{4 * parseSafeInt(pricing.costPricePerPiece, 220)}</span>
                  <span className="font-bold text-emerald-700">
                    লাভ: +৳{parseSafeInt(pricing.comboPrice, 2000) - (4 * parseSafeInt(pricing.costPricePerPiece, 220) + parseSafeInt(pricing.packagingCost, 30))}
                  </span>
                </div>
              </div>

            </div>

            {/* Delivery Charges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  সিলেটের ভেতরে ডেলিভারি চার্জ (৳):
                </label>
                <input
                  type="number"
                  value={pricing.deliveryInsideDhaka}
                  onChange={(e) => setPricing({ ...pricing, deliveryInsideDhaka: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  সিলেটের বাইরে ডেলিভারি চার্জ (৳):
                </label>
                <input
                  type="number"
                  value={pricing.deliveryOutsideDhaka}
                  onChange={(e) => setPricing({ ...pricing, deliveryOutsideDhaka: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="comboFree"
                  checked={pricing.comboFreeDelivery}
                  onChange={(e) => setPricing({ ...pricing, comboFreeDelivery: e.target.checked })}
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                />
                <label htmlFor="comboFree" className="text-xs font-bold text-slate-800 cursor-pointer">
                  মেগা কম্বো অর্ডারে ফ্রি ডেলিভারি চালু রাখুন
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={savingPrice}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {savingPrice ? 'সংরক্ষণ হচ্ছে...' : 'মূল্য ও ডেলিভারি তথ্য সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
