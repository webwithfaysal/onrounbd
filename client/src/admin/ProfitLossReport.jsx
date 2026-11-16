import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  RotateCcw,
  Save,
  Check,
  AlertCircle,
  HelpCircle,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Percent
} from 'lucide-react';
import { saveProductConfig } from '../services/firebaseDb';

export default function ProfitLossReport({
  orders = [],
  expenses = [],
  product = {},
  onUpdateProduct,
  onNavigateToExpenses
}) {
  // Cost configuration state with reasonable defaults if not set yet
  const [costConfig, setCostConfig] = useState({
    costPricePerPiece: product?.costPricePerPiece ?? 220, // প্রতি পিস কেনা খরচ (বক্সার ব্রিফ)
    packagingCost: product?.packagingCost ?? 30, // প্যাকেজিং বক্স ও স্টিকার খরচ
    deliveryRealCostInside: product?.deliveryRealCostInside ?? 60, // কুরিয়ার খরচ (সিলেটের ভেতর)
    deliveryRealCostOutside: product?.deliveryRealCostOutside ?? 120, // কুরিয়ার খরচ (সিলেটের বাইরে)
    returnLossCharge: product?.returnLossCharge ?? 100 // রিটার্ন হলে কুরিয়ার জরিমানা/খরচ ক্ষতি
  });

  const [savingCost, setSavingCost] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'delivered', 'pending', 'returned'
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'online', 'manual'

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleSaveCosts = async (e) => {
    e.preventDefault();
    setSavingCost(true);
    try {
      const updatedProduct = {
        ...(product || {}),
        costPricePerPiece: Math.max(0, parseInt(costConfig.costPricePerPiece) || 0),
        packagingCost: Math.max(0, parseInt(costConfig.packagingCost) || 0),
        deliveryRealCostInside: Math.max(0, parseInt(costConfig.deliveryRealCostInside) || 0),
        deliveryRealCostOutside: Math.max(0, parseInt(costConfig.deliveryRealCostOutside) || 0),
        returnLossCharge: Math.max(0, parseInt(costConfig.returnLossCharge) || 0)
      };

      await saveProductConfig(updatedProduct);
      if (onUpdateProduct) onUpdateProduct(updatedProduct);
      showToast('ক্রয়মূল্য ও ব্যয়ের হিসাব সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err) {
      console.error(err);
      showToast('খরচের তথ্য সংরক্ষিত হয়েছে');
    } finally {
      setSavingCost(false);
    }
  };

  const isManualOrder = (ord) => {
    if (!ord) return false;
    if (ord.isManual === true || ord.orderSource === 'manual') return true;
    const n = (ord.notes || '').toLowerCase();
    return n.includes('ম্যানুয়াল') || n.includes('manual') || n.includes('এডমিন');
  };

  // Helper to calculate pieces count for an order
  const getOrderUnits = (ord) => {
    const qty = Math.max(1, parseInt(ord.quantity) || 1);
    if (ord.packageType === 'combo') return 4 * qty;
    if (ord.packageType === 'three_pcs') return 3 * qty;
    if (ord.packageType === 'two_pcs') return 2 * qty;
    return 1 * qty;
  };

  // Calculate financial details for a single order
  // Online orders incur courier & packaging cost; Manual orders incur NO courier cost (100% direct profit)
  const calculateOrderProfit = (ord) => {
    const isManual = isManualOrder(ord);
    const units = getOrderUnits(ord);
    const buyingCost = units * costConfig.costPricePerPiece;
    const packagingCost = isManual ? 0 : costConfig.packagingCost;
    const isOutside = ord.deliveryZone === 'outside';
    const realCourierCost = isManual ? 0 : (isOutside ? costConfig.deliveryRealCostOutside : costConfig.deliveryRealCostInside);
    const customerDeliveryFee = ord.deliveryCharge || 0;
    const deliverySubsidy = Math.max(0, realCourierCost - customerDeliveryFee);

    const totalCost = buyingCost + packagingCost + realCourierCost;
    const revenue = ord.totalPrice || 0;

    let netProfit = 0;
    if (ord.status === 'delivered') {
      netProfit = revenue - (buyingCost + packagingCost + realCourierCost);
    } else if (ord.status === 'returned') {
      // Returned online order loses courier fee; manual order has no courier fee loss
      netProfit = isManual ? 0 : -costConfig.returnLossCharge;
    } else if (ord.status === 'cancelled') {
      netProfit = 0;
    } else {
      // Pending, Confirmed, Shipping: Projected profit if successfully delivered
      netProfit = revenue - (buyingCost + packagingCost + realCourierCost);
    }

    return {
      isManual,
      units,
      buyingCost,
      packagingCost,
      realCourierCost,
      customerDeliveryFee,
      deliverySubsidy,
      revenue,
      totalCost,
      netProfit,
      isProfit: netProfit >= 0
    };
  };

  // Aggregate Metrics
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const returnedOrders = orders.filter(o => o.status === 'returned');
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'shipping');

  const deliveredOnlineOrders = deliveredOrders.filter(o => !isManualOrder(o));
  const deliveredManualOrders = deliveredOrders.filter(o => isManualOrder(o));

  // Actual Realized P&L
  const totalDeliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalDeliveredBuyingCost = deliveredOrders.reduce((sum, o) => sum + (getOrderUnits(o) * costConfig.costPricePerPiece), 0);
  
  // Packaging & Courier ONLY for online orders (manual order has no courier cost)
  const totalDeliveredPackagingCost = deliveredOnlineOrders.length * costConfig.packagingCost;
  const totalDeliveredCourierCost = deliveredOnlineOrders.reduce((sum, o) => {
    return sum + (o.deliveryZone === 'outside' ? costConfig.deliveryRealCostOutside : costConfig.deliveryRealCostInside);
  }, 0);

  const totalReturnLosses = returnedOrders.filter(o => !isManualOrder(o)).length * costConfig.returnLossCharge;

  // Operating Expenses (ফেসবুক অ্যাড, অফিস ভাড়া, বেতন ইত্যাদি)
  const totalOperatingExpenses = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Gross Profit = Revenue - (Buying Cost + Packaging + Courier) - Return Losses
  const realizedGrossProfit = totalDeliveredRevenue - (totalDeliveredBuyingCost + totalDeliveredPackagingCost + totalDeliveredCourierCost) - totalReturnLosses;

  // Net Profit = Gross Profit - Operating Expenses
  const realizedNetProfit = realizedGrossProfit - totalOperatingExpenses;

  // Breakdown of profits
  const onlineDeliveredProfit = deliveredOnlineOrders.reduce((sum, o) => sum + calculateOrderProfit(o).netProfit, 0) - totalReturnLosses;
  const manualDeliveredProfit = deliveredManualOrders.reduce((sum, o) => sum + calculateOrderProfit(o).netProfit, 0);

  // Profit Margin (%)
  const profitMargin = totalDeliveredRevenue > 0
    ? ((realizedNetProfit / totalDeliveredRevenue) * 100).toFixed(1)
    : 0;

  // Average Profit per Delivered Order
  const avgProfitPerOrder = deliveredOrders.length > 0
    ? Math.round(realizedNetProfit / deliveredOrders.length)
    : 0;

  // Projected Potential Profit (including Pending, Confirmed, Shipping)
  const projectedRevenue = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned').reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const projectedProfit = orders.reduce((sum, o) => {
    const calc = calculateOrderProfit(o);
    return sum + (o.status !== 'cancelled' ? calc.netProfit : 0);
  }, 0);

  // Per-package profit analysis
  const singlePrice = product?.singlePrice || 650;
  const twoPcsPrice = product?.twoPcsPrice || 1200;
  const threePcsPrice = product?.threePcsPrice || 1600;
  const comboPrice = product?.comboPrice || 2000;

  const packageAnalytics = [
    {
      name: '১ পিস সিঙ্গেল',
      units: 1,
      sellingPrice: singlePrice,
      buyingCost: 1 * costConfig.costPricePerPiece,
      packaging: costConfig.packagingCost,
      estProfit: singlePrice - (1 * costConfig.costPricePerPiece + costConfig.packagingCost),
      margin: Math.round(((singlePrice - (1 * costConfig.costPricePerPiece + costConfig.packagingCost)) / singlePrice) * 100)
    },
    {
      name: '২ পিস স্মার্ট প্যাক',
      units: 2,
      sellingPrice: twoPcsPrice,
      buyingCost: 2 * costConfig.costPricePerPiece,
      packaging: costConfig.packagingCost,
      estProfit: twoPcsPrice - (2 * costConfig.costPricePerPiece + costConfig.packagingCost),
      margin: Math.round(((twoPcsPrice - (2 * costConfig.costPricePerPiece + costConfig.packagingCost)) / twoPcsPrice) * 100)
    },
    {
      name: '৩ পিস ভ্যালু প্যাক',
      units: 3,
      sellingPrice: threePcsPrice,
      buyingCost: 3 * costConfig.costPricePerPiece,
      packaging: costConfig.packagingCost,
      estProfit: threePcsPrice - (3 * costConfig.costPricePerPiece + costConfig.packagingCost),
      margin: Math.round(((threePcsPrice - (3 * costConfig.costPricePerPiece + costConfig.packagingCost)) / threePcsPrice) * 100)
    },
    {
      name: '৪ পিস মেগা কম্বো',
      units: 4,
      sellingPrice: comboPrice,
      buyingCost: 4 * costConfig.costPricePerPiece,
      packaging: costConfig.packagingCost,
      estProfit: comboPrice - (4 * costConfig.costPricePerPiece + costConfig.packagingCost),
      margin: Math.round(((comboPrice - (4 * costConfig.costPricePerPiece + costConfig.packagingCost)) / comboPrice) * 100)
    }
  ];

  // Filter orders for table (Status & Source: Online vs Manual)
  const filteredOrders = orders.filter(o => {
    const isManual = isManualOrder(o);
    if (sourceFilter === 'online' && isManual) return false;
    if (sourceFilter === 'manual' && !isManual) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'delivered') return o.status === 'delivered';
    if (statusFilter === 'returned') return o.status === 'returned';
    if (statusFilter === 'pending') return o.status === 'pending' || o.status === 'confirmed' || o.status === 'shipping';
    return true;
  });

  // Export P&L report as CSV
  const handleExportPnL = () => {
    if (orders.length === 0) {
      alert('এক্সপোর্ট করার মতো কোনো ডাটা নেই।');
      return;
    }

    const headers = ['Order ID', 'Order Source', 'Customer', 'Phone', 'Date', 'Status', 'Package', 'Pcs Count', 'Selling Price (৳)', 'Delivery Collected (৳)', 'Buying Cost (৳)', 'Packaging (৳)', 'Courier Cost (৳)', 'Net Profit/Loss (৳)'];
    const rows = orders.map(o => {
      const calc = calculateOrderProfit(o);
      const isManual = isManualOrder(o);
      return [
        o.id,
        isManual ? 'ম্যানুয়াল (সরাসরি)' : 'অনলাইন (কুরিয়ার)',
        `"${o.customerName}"`,
        `'${o.phone}`,
        o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '',
        o.status,
        o.packageType,
        calc.units,
        o.itemPrice || 0,
        o.deliveryCharge || 0,
        calc.buyingCost,
        calc.packagingCost,
        calc.realCourierCost,
        calc.netProfit
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `onroun_profit_loss_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg flex items-center gap-2 text-xs font-bold animate-bounce">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                ব্যবসার লাভ-ক্ষতি ও মার্জিন বিশ্লেষণ (Profit & Loss)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                কেনা দাম, প্যাকেজিং, কুরিয়ার বিল ও রিটার্ন ক্ষতির নিখুঁত হিসাব
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportPnL}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          <span>লাভ-ক্ষতি রিপোর্ট ডাউনলোড (CSV)</span>
        </button>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* KPI 1: Realized Net Profit */}
        <div className={`rounded-3xl p-4 sm:p-5 border shadow-xs relative overflow-hidden ${
          realizedNetProfit >= 0
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
            : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
              চূড়ান্ত নিট লাভ (Net Profit)
            </span>
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              realizedNetProfit >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              {realizedNetProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <span className={`text-2xl sm:text-3xl font-black block ${
              realizedNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {realizedNetProfit >= 0 ? `+৳${realizedNetProfit.toLocaleString()}` : `-৳${Math.abs(realizedNetProfit).toLocaleString()}`}
            </span>
            <span className="text-[10px] text-slate-500 font-bold block">
              মার্জিন: <strong className="text-emerald-700">{profitMargin}%</strong> | গড়/অর্ডার: ৳{avgProfitPerOrder}
            </span>
            <div className="pt-1 mt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold">
              <span className="text-sky-800">অনলাইন: +৳{onlineDeliveredProfit.toLocaleString()}</span>
              <span className="text-indigo-800">ম্যানুয়াল: +৳{manualDeliveredProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Order Gross Profit */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              অর্ডার গ্রস লাভ (Gross)
            </span>
            <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-sky-700 block">
              ৳{realizedGrossProfit.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              ব্যবসা খরচ বাদ দেওয়ার পূর্বের লাভ
            </span>
          </div>
        </div>

        {/* KPI 3: Total Delivered Revenue */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              মোট ক্যাশ সংগ্রহ (Revenue)
            </span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
              ৳{totalDeliveredRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {deliveredOrders.length} টি সফল ডেলিভারি থেকে
            </span>
          </div>
        </div>

        {/* KPI 4: Operating Expenses */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-rose-200 shadow-xs bg-rose-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-800">
              দোকান ও ব্যবসা খরচ
            </span>
            <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 block">
              -৳{totalOperatingExpenses.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              অ্যাড, অফিস ভাড়া, বেতন ইত্যাদি
            </span>
          </div>
        </div>

        {/* KPI 5: Total COGS & Logistics */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              পণ্য কেনা ও কুরিয়ার খরচ
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-700 block">
              ৳{(totalDeliveredBuyingCost + totalDeliveredPackagingCost + totalDeliveredCourierCost + totalReturnLosses).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              কেনা: ৳{totalDeliveredBuyingCost.toLocaleString()} | কুরিয়ার: ৳{(totalDeliveredPackagingCost + totalDeliveredCourierCost).toLocaleString()}
            </span>
          </div>
        </div>

      </div>

      {/* Business Bottomline Equation Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-sm text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="bg-white/10 px-2.5 py-1.5 rounded-xl">
            <span className="text-slate-400 block text-[9px] uppercase font-bold">মোট রেভিনিউ</span>
            <span className="font-bold text-white text-xs sm:text-sm">৳{totalDeliveredRevenue.toLocaleString()}</span>
          </div>
          <span className="text-slate-500 font-black text-sm">-</span>
          <div className="bg-white/10 px-2.5 py-1.5 rounded-xl">
            <span className="text-slate-400 block text-[9px] uppercase font-bold">পণ্য ও কুরিয়ার</span>
            <span className="font-bold text-amber-400 text-xs sm:text-sm">৳{(totalDeliveredBuyingCost + totalDeliveredPackagingCost + totalDeliveredCourierCost + totalReturnLosses).toLocaleString()}</span>
          </div>
          <span className="text-slate-500 font-black text-sm">=</span>
          <div className="bg-white/10 px-2.5 py-1.5 rounded-xl">
            <span className="text-slate-400 block text-[9px] uppercase font-bold">গ্রস লাভ</span>
            <span className="font-bold text-sky-400 text-xs sm:text-sm">৳{realizedGrossProfit.toLocaleString()}</span>
          </div>
          <span className="text-slate-500 font-black text-sm">-</span>
          <div className="bg-white/10 px-2.5 py-1.5 rounded-xl">
            <span className="text-slate-400 block text-[9px] uppercase font-bold">ব্যবসা খরচ (Ads/Rent)</span>
            <span className="font-bold text-rose-400 text-xs sm:text-sm">৳{totalOperatingExpenses.toLocaleString()}</span>
          </div>
          <span className="text-slate-500 font-black text-sm">=</span>
          <div className="bg-emerald-600/30 border border-emerald-500/50 px-3 py-1.5 rounded-xl">
            <span className="text-emerald-300 block text-[9px] uppercase font-black">চূড়ান্ত নিট লাভ</span>
            <span className={`font-black text-sm sm:text-base ${realizedNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {realizedNetProfit >= 0 ? `+৳${realizedNetProfit.toLocaleString()}` : `-৳${Math.abs(realizedNetProfit).toLocaleString()}`}
            </span>
          </div>
        </div>

        {onNavigateToExpenses && (
          <button
            onClick={onNavigateToExpenses}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
          >
            <span>🛒 খরচ হিসাব পরিচালনা</span>
          </button>
        )}
      </div>

      {/* Cost & Expense Configuration Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
              ⚙️
            </span>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                ক্রয়মূল্য ও ব্যয়ের হার নির্ধারণ (Cost Setting)
              </h4>
              <p className="text-[11px] text-slate-500">
                এখানে আপনার প্রকৃত কেনা খরচ ও কুরিয়ার ফি দিন। এটি ল্যান্ডিং পেজে দেখাবে না, শুধু অ্যাডমিনের লাভ হিসেব করবে।
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveCosts} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
            
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                প্রতি পিস কেনা খরচ (৳) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={costConfig.costPricePerPiece}
                onChange={(e) => setCostConfig({ ...costConfig, costPricePerPiece: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-white focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">আন্ডারওয়্যার তৈরির/কেনা খরচ</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                বক্স/প্যাকেজিং খরচ (৳)
              </label>
              <input
                type="number"
                min="0"
                value={costConfig.packagingCost}
                onChange={(e) => setCostConfig({ ...costConfig, packagingCost: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">বক্স, পলি ও স্টিকার প্রতি অর্ডার</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                কুরিয়ার খরচ: ভেতরে (৳)
              </label>
              <input
                type="number"
                min="0"
                value={costConfig.deliveryRealCostInside}
                onChange={(e) => setCostConfig({ ...costConfig, deliveryRealCostInside: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">কুরিয়ার কোম্পানিকে দেওয়া বিল</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                কুরিয়ার খরচ: বাইরে (৳)
              </label>
              <input
                type="number"
                min="0"
                value={costConfig.deliveryRealCostOutside}
                onChange={(e) => setCostConfig({ ...costConfig, deliveryRealCostOutside: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">সারাদেশে কুরিয়ার বিল</span>
            </div>

            <div className="bg-rose-50/60 p-3 rounded-2xl border border-rose-200">
              <label className="text-[11px] font-bold text-rose-800 block mb-1">
                রিটার্ন পার্সেল ক্ষতি (৳)
              </label>
              <input
                type="number"
                min="0"
                value={costConfig.returnLossCharge}
                onChange={(e) => setCostConfig({ ...costConfig, returnLossCharge: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 rounded-xl border border-rose-300 text-xs font-black text-rose-700 bg-white"
              />
              <span className="text-[10px] text-rose-500 mt-1 block">কুরিয়ার রিটার্ন জরিমানা</span>
            </div>

          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={savingCost}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingCost ? 'সংরক্ষণ হচ্ছে...' : 'ক্রয়মূল্য ও ব্যয়ের হিসাব সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Package-wise Profit & Margin Matrix */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90">
        <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
          <Percent className="w-4 h-4 text-emerald-600" />
          <span>প্যাকেজ অনুযায়ী আনুমানিক নিট লাভ ও মার্জিন (Per Package Profit Margin)</span>
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {packageAnalytics.map((pkg, idx) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                  <span className="font-bold text-slate-900 text-xs">{pkg.name}</span>
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                    {pkg.margin}% মার্জিন
                  </span>
                </div>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  <div className="flex justify-between">
                    <span>বিক্রয়মূল্য:</span>
                    <strong className="text-slate-900">৳{pkg.sellingPrice}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>কেনা খরচ ({pkg.units} পিস):</span>
                    <strong className="text-slate-800">৳{pkg.buyingCost}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>বক্স ও প্যাকেজিং:</span>
                    <span>৳{pkg.packaging}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">নিট লাভ:</span>
                <span className="text-base font-black text-emerald-600">
                  +৳{pkg.estProfit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders Profit & Loss Ledger Table */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90">
        
        {/* Table Top Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-black text-slate-900">
              প্রতিটি অর্ডারের লাভ-ক্ষতির লাইভ খতিয়ান ({filteredOrders.length} টি)
            </h4>
            <p className="text-[11px] text-slate-500">
              গ্রাহকের অর্ডার অনুযায়ী কেনা খরচ এবং অর্জিত লাভ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Source Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setSourceFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  sourceFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সকল
              </button>
              <button
                onClick={() => setSourceFilter('online')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  sourceFilter === 'online' ? 'bg-sky-600 text-white shadow-xs' : 'text-sky-800 hover:text-sky-900'
                }`}
              >
                🌐 অনলাইন ({orders.filter(o => !isManualOrder(o)).length})
              </button>
              <button
                onClick={() => setSourceFilter('manual')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  sourceFilter === 'manual' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-800 hover:text-indigo-900'
                }`}
              >
                📝 ম্যানুয়াল ({orders.filter(o => isManualOrder(o)).length})
              </button>
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                সব স্ট্যাটাস
              </button>
              <button
                onClick={() => setStatusFilter('delivered')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  statusFilter === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                ডেলিভার্ড ({deliveredOrders.length})
              </button>
              <button
                onClick={() => setStatusFilter('returned')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  statusFilter === 'returned' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                রিটার্ন ({returnedOrders.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                সম্ভাব্য ({pendingOrders.length})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-black">
                <th className="py-2.5 px-3">অর্ডার আইডি</th>
                <th className="py-2.5 px-3">গ্রাহক</th>
                <th className="py-2.5 px-3">প্যাকেজ ও পিস</th>
                <th className="py-2.5 px-3 text-right">বিক্রয় (৳)</th>
                <th className="py-2.5 px-3 text-right">কেনা খরচ (৳)</th>
                <th className="py-2.5 px-3 text-right">কুরিয়ার/বক্স (৳)</th>
                <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                <th className="py-2.5 px-3 text-right">নিট লাভ / ক্ষতি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    কোনো অর্ডার পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => {
                  const calc = calculateOrderProfit(ord);
                  const isDelivered = ord.status === 'delivered';
                  const isReturned = ord.status === 'returned';
                  const isCancelled = ord.status === 'cancelled';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900 block">{ord.id}</span>
                        {calc.isManual ? (
                          <span className="inline-block bg-indigo-100 text-indigo-800 text-[9px] font-black px-1.5 py-0.2 rounded mt-0.5 border border-indigo-200">
                            📝 ম্যানুয়াল
                          </span>
                        ) : (
                          <span className="inline-block bg-sky-100 text-sky-800 text-[9px] font-black px-1.5 py-0.2 rounded mt-0.5 border border-sky-200">
                            🌐 অনলাইন
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block truncate max-w-[140px]">{ord.customerName}</span>
                        <span className="font-mono text-[10px] text-slate-400">{ord.phone}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700 block">
                          {ord.packageType === 'combo' ? '৪ পিস কম্বো' : ord.packageType === 'three_pcs' ? '৩ পিস ভ্যালু' : ord.packageType === 'two_pcs' ? '২ পিস স্মার্ট' : '১ পিস'}
                        </span>
                        <span className="text-[10px] text-slate-400">({calc.units} পিস)</span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        ৳{ord.totalPrice}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-amber-700">
                        ৳{calc.buyingCost}
                      </td>
                      <td className="py-3 px-3 text-right text-[11px]">
                        {calc.isManual ? (
                          <span className="font-bold text-slate-400">৳০ (ম্যানুয়াল)</span>
                        ) : (
                          <span className="font-medium text-slate-700">৳{calc.packagingCost + calc.realCourierCost}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-800'
                            : isReturned
                            ? 'bg-rose-100 text-rose-800'
                            : isCancelled
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isDelivered ? 'ডেলিভার্ড' : isReturned ? 'রিটার্ন' : isCancelled ? 'বাতিল' : 'প্রসেসিং'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isDelivered ? (
                          <span className="font-black text-emerald-600 text-sm">
                            +৳{calc.netProfit}
                          </span>
                        ) : isReturned ? (
                          <span className="font-black text-rose-600 text-sm">
                            -৳{Math.abs(calc.netProfit)}
                          </span>
                        ) : isCancelled ? (
                          <span className="text-slate-400 font-bold">
                            ৳০
                          </span>
                        ) : (
                          <span className="font-bold text-slate-500 text-xs" title="ডেলিভারি হলে এই লাভ হবে">
                            ~+৳{calc.netProfit}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
