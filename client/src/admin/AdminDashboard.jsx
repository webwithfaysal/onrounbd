import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Package,
  Layers,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  Truck,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Flame
} from 'lucide-react';
import StockManagement from './StockManagement';
import OrderManagement from './OrderManagement';
import AdminSettings from './AdminSettings';
import ProfitLossReport from './ProfitLossReport';
import ExpenseManagement from './ExpenseManagement';
import { Settings } from 'lucide-react';
import {
  subscribeOrders,
  getOrders,
  getProductConfig,
  subscribeProductConfig,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  getExpenses,
  subscribeExpenses
} from '../services/firebaseDb';

export default function AdminDashboard({
  onBackToLanding,
  onLogout,
  product: propProduct,
  onUpdateProduct: propOnUpdateProduct
}) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'stock', 'profit', 'expenses', 'settings'
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [product, setProduct] = useState(propProduct || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  // Sync with propProduct if supplied by App
  useEffect(() => {
    if (propProduct) {
      setProduct(propProduct);
    }
  }, [propProduct]);

  // Play a pleasant two-tone chime when a new order arrives
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // Audio playback restrictions
    }
  };

  // Helper function to calculate all analytics stats
  const calculateStats = (ordersList, prodObj = product, expensesList = expenses) => {
    const list = Array.isArray(ordersList) ? ordersList : [];
    const pendingOrders = list.filter(o => o.status === 'pending').length;
    const confirmedOrders = list.filter(o => o.status === 'confirmed').length;
    const shippingOrders = list.filter(o => o.status === 'shipping').length;
    const deliveredOrders = list.filter(o => o.status === 'delivered').length;
    const returnedOrders = list.filter(o => o.status === 'returned').length;
    const cancelledOrders = list.filter(o => o.status === 'cancelled').length;
    const deliveredRevenue = list.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const totalSales = list.filter(o => o.status !== 'cancelled' && o.status !== 'returned').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const totalStock = prodObj?.sizes?.reduce((sum, s) => sum + (Number(s.stock) || 0), 0) || 0;

    // Financial Profit & Loss Calculations
    const costPerPiece = prodObj?.costPricePerPiece ?? 220;
    const packagingCost = prodObj?.packagingCost ?? 30;
    const courierInside = prodObj?.deliveryRealCostInside ?? 60;
    const courierOutside = prodObj?.deliveryRealCostOutside ?? 120;
    const returnLossCharge = prodObj?.returnLossCharge ?? 100;

    const isManualOrder = (ord) => {
      if (!ord) return false;
      if (ord.isManual === true || ord.orderSource === 'manual') return true;
      const n = (ord.notes || '').toLowerCase();
      return n.includes('ম্যানুয়াল') || n.includes('manual') || n.includes('এডমিন');
    };

    const deliveredItems = list.filter(o => o.status === 'delivered');
    const totalDeliveredCost = deliveredItems.reduce((sum, o) => {
      const qty = Math.max(1, parseInt(o.quantity) || 1);
      const units = o.packageType === 'combo' ? (4 * qty) : o.packageType === 'three_pcs' ? (3 * qty) : o.packageType === 'two_pcs' ? (2 * qty) : qty;
      const cogs = units * costPerPiece;
      const isManual = isManualOrder(o);
      const pack = isManual ? 0 : packagingCost;
      const courier = isManual ? 0 : (o.deliveryZone === 'outside' ? courierOutside : courierInside);
      return sum + cogs + pack + courier;
    }, 0);

    const onlineReturnedCount = list.filter(o => o.status === 'returned' && !isManualOrder(o)).length;
    const totalReturnLosses = onlineReturnedCount * returnLossCharge;
    const totalExpAmt = (Array.isArray(expensesList) ? expensesList : []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const grossProfit = deliveredRevenue - totalDeliveredCost - totalReturnLosses;
    const netProfit = grossProfit - totalExpAmt;
    const profitMargin = deliveredRevenue > 0 ? Math.round((netProfit / deliveredRevenue) * 100) : 0;

    const onlineOrdersCount = list.filter(o => !isManualOrder(o)).length;
    const manualOrdersCount = list.filter(o => isManualOrder(o)).length;

    return {
      totalOrders: list.length,
      onlineOrdersCount,
      manualOrdersCount,
      pendingOrders,
      confirmedOrders,
      shippingOrders,
      deliveredOrders,
      returnedOrders,
      cancelledOrders,
      totalRevenue: deliveredRevenue,
      totalSales,
      totalStock,
      totalExpenses: totalExpAmt,
      grossProfit,
      netProfit,
      profitMargin
    };
  };

  const fetchData = async (isBackgroundPoll = false) => {
    try {
      let ordersList = null;
      let productData = null;
      let expensesList = [];

      // Fetch expenses
      try {
        const fbExpenses = await getExpenses();
        if (Array.isArray(fbExpenses)) {
          expensesList = fbExpenses;
        }
      } catch (e) {}

      // 1. Try Firebase Firestore for orders
      try {
        const fbOrders = await getOrders();
        if (Array.isArray(fbOrders)) {
          ordersList = fbOrders;
        }
      } catch (e) {}

      // 2. Try server orders (only if Firestore didn't return an array)
      if (ordersList === null) {
        try {
          const oRes = await fetch('/api/orders');
          const oCt = oRes.headers.get('content-type');
          if (oRes.ok && oCt && oCt.includes('application/json')) {
            const d = await oRes.json();
            if (d.success && Array.isArray(d.orders)) ordersList = d.orders;
          }
        } catch (e) {}
      }

      // 3. Fallback orders from localStorage
      if (ordersList === null) {
        ordersList = JSON.parse(localStorage.getItem('onroun_orders') || '[]');
      }

      // Try Firebase Firestore for product
      try {
        const fbProd = await getProductConfig();
        if (fbProd) productData = fbProd;
      } catch (e) {}

      if (!productData) {
        try {
          const pRes = await fetch('/api/product');
          const pCt = pRes.headers.get('content-type');
          if (pRes.ok && pCt && pCt.includes('application/json')) {
            const d = await pRes.json();
            if (d.success && d.product) productData = d.product;
          }
        } catch (e) {}
      }

      if (!productData) {
        const localStock = localStorage.getItem('onroun_product_stock');
        if (localStock) {
          try { productData = JSON.parse(localStock); } catch (e) {}
        }
      }

      if (!productData) {
        try {
          const fb = await fetch('/data/product.json');
          const d = await fb.json();
          if (d.success && d.product) productData = d.product;
        } catch (e) {}
      }

      // Compute live stats
      const statsData = calculateStats(ordersList, productData || product, expensesList);

      if (isBackgroundPoll && orders.length > 0 && ordersList.length > orders.length) {
        const newest = ordersList[0];
        playChime();
        setNewOrderAlert(newest);
        setTimeout(() => setNewOrderAlert(null), 6000);
      }

      setOrders(ordersList);
      setExpenses(expensesList);
      setStats(statsData);
      if (productData) setProduct(productData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(false);

    // Realtime listener for Orders from Firebase Firestore
    const unsubscribeOrders = subscribeOrders((liveOrders) => {
      if (Array.isArray(liveOrders)) {
        setStats(prevStats => calculateStats(liveOrders, product, expenses));

        setOrders(prev => {
          if (prev.length > 0 && liveOrders.length > prev.length) {
            playChime();
            setNewOrderAlert(liveOrders[0]);
            setTimeout(() => setNewOrderAlert(null), 6000);
          }
          return liveOrders;
        });
      }
    });

    // Realtime listener for Product & Stock from Firebase Firestore
    const unsubscribeProduct = subscribeProductConfig((liveProduct) => {
      if (liveProduct && liveProduct.sizes) {
        setProduct(liveProduct);
        setStats(prev => calculateStats(orders, liveProduct, expenses));
      }
    });

    // Realtime listener for Expenses from Firebase Firestore
    const unsubscribeExpenses = subscribeExpenses((liveExpenses) => {
      if (Array.isArray(liveExpenses)) {
        setExpenses(liveExpenses);
        setStats(prev => calculateStats(orders, product, liveExpenses));
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProduct();
      unsubscribeExpenses();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Instant optimistic update for status changes (no page reload or waiting needed)
  const handleOrderStatusChange = async (orderId, newStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      setStats(calculateStats(updated, product));
      return updated;
    });

    try {
      const res = await updateOrderStatus(orderId, newStatus, targetOrder);
      if (res && res.updatedProduct) {
        setProduct(res.updatedProduct);
        if (propOnUpdateProduct) propOnUpdateProduct(res.updatedProduct);
      }
    } catch (e) {
      console.error('Firebase status update error:', e);
    }
  };

  // Instant optimistic update for full order updates (edited customer details, sizes, pricing)
  const handleOrderUpdate = async (updatedOrder) => {
    if (!updatedOrder || !updatedOrder.id) return;
    const prevOrder = orders.find(o => o.id === updatedOrder.id);
    setOrders(prev => {
      const updated = prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o);
      setStats(calculateStats(updated, product));
      return updated;
    });

    try {
      const res = await updateOrder(updatedOrder, prevOrder);
      if (res && res.updatedProduct) {
        setProduct(res.updatedProduct);
        if (propOnUpdateProduct) propOnUpdateProduct(res.updatedProduct);
      }
    } catch (e) {
      console.error('Firebase update order error:', e);
    }
  };

  // Instant optimistic update for order deletion
  const handleOrderDelete = async (orderId) => {
    const targetOrder = orders.find(o => o.id === orderId);
    setOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId);
      setStats(calculateStats(updated, product));
      return updated;
    });

    try {
      await deleteOrder(orderId, targetOrder);
    } catch (e) {
      console.error('Firebase delete order error:', e);
    }
  };

  // Instant optimistic update for newly created manual orders
  const handleManualOrderCreated = (newOrder) => {
    if (!newOrder) return;
    setOrders(prev => {
      const exists = prev.some(o => o.id === newOrder.id);
      if (exists) return prev;
      const updated = [newOrder, ...prev];
      setStats(calculateStats(updated, product));
      return updated;
    });
  };

  const handleUpdateProduct = (updatedProduct) => {
    if (updatedProduct) {
      setProduct(updatedProduct);
      localStorage.setItem('onroun_product_stock', JSON.stringify(updatedProduct));
      setStats(calculateStats(orders, updatedProduct));
      if (propOnUpdateProduct) propOnUpdateProduct(updatedProduct);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-16">
      
      {/* Top Admin Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ল্যান্ডিং পেজ দেখুন</span>
            </button>

            <div className="h-4 w-px bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center font-black text-sm">
                OB
              </span>
              <div>
                <h1 className="font-extrabold text-sm sm:text-base leading-tight">
                  অ্যাডমিন ড্যাশবোর্ড
                </h1>
                <span className="text-[10px] text-slate-400">অনরাউন বিডি কন্ট্রোল প্যানেল</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        
        {/* Realtime New Order Audio & Visual Alert */}
        {newOrderAlert && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                🔔
              </span>
              <div>
                <span className="font-black text-sm block text-yellow-300">একটি নতুন অর্ডার এসেছে!</span>
                <span className="text-xs text-emerald-100 font-medium">
                  {newOrderAlert.customerName} ({newOrderAlert.phone}) — {newOrderAlert.packageType === 'combo' ? '৪ পিস মেগা কম্বো' : '১ পিস ট্রায়াল'} | মোট: ৳{newOrderAlert.totalPrice}
                </span>
              </div>
            </div>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition"
            >
              বন্ধ করুন
            </button>
          </div>
        )}

        {/* Analytics Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* Card 1: Total Orders */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase">মোট অর্ডার</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-1 block">
                {stats?.totalOrders || orders.length}
              </span>
              <span className="text-[10px] text-amber-600 font-semibold mt-1 block">
                পেন্ডিং: {stats?.pendingOrders || 0} টি
              </span>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Confirmed & Shipping */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase">প্রসেসিং ও কুরিয়ার</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-purple-600 mt-1 block">
                {(stats?.confirmedOrders || 0) + (stats?.shippingOrders || 0)}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                কুরিয়ারে: {stats?.shippingOrders || 0} টি
              </span>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Total Revenue */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase">ডেলিভার্ড রেভিনিউ</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 mt-1 block">
                ৳{(stats?.totalRevenue || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                ডেলিভার্ড: {stats?.deliveredOrders || 0} টি
              </span>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Net Profit */}
          <div
            onClick={() => setActiveTab('profit')}
            className={`rounded-3xl p-4 sm:p-5 shadow-xs border cursor-pointer hover:scale-[1.02] transition flex items-center justify-between ${
              (stats?.netProfit ?? 0) >= 0
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
                : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300'
            }`}
          >
            <div>
              <span className="text-[11px] font-black uppercase text-slate-600 block">
                নিট লাভ (Net Profit)
              </span>
              <span className={`text-xl sm:text-2xl lg:text-3xl font-black mt-1 block ${
                (stats?.netProfit ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {(stats?.netProfit ?? 0) >= 0 ? `+৳${(stats?.netProfit ?? 0).toLocaleString()}` : `-৳${Math.abs(stats?.netProfit ?? 0).toLocaleString()}`}
              </span>
              <span className="text-[10px] text-slate-600 font-bold mt-1 block">
                মার্জিন: <strong className="text-emerald-700">{stats?.profitMargin ?? 0}%</strong>
              </span>
            </div>
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              (stats?.netProfit ?? 0) >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Card 5: Total Stock */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase">মোট এভেইলেবল স্টক</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-1 block">
                {stats?.totalStock || product?.sizes?.reduce((a, b) => a + (b.stock || 0), 0) || 0} পিস
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                সকল সাইজ মিলিয়ে
              </span>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold transition ${
              activeTab === 'orders'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>অর্ডার ম্যানেজমেন্ট ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold transition ${
              activeTab === 'stock'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>স্টক, সাইজ ও মূল্য</span>
          </button>

          <button
            onClick={() => setActiveTab('profit')}
            className={`flex items-center gap-2 py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              activeTab === 'profit'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>লাভ-ক্ষতি (P&L)</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4 text-rose-500" />
            <span>খরচ হিসাব ({expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>পিক্সেল, শিট ও ব্যাকআপ</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'orders' ? (
          <OrderManagement
            orders={orders}
            product={product}
            onStatusChange={handleOrderStatusChange}
            onUpdateOrder={handleOrderUpdate}
            onDeleteOrder={handleOrderDelete}
            onOrderCreated={handleManualOrderCreated}
            onRefreshOrders={fetchData}
          />
        ) : activeTab === 'stock' ? (
          <StockManagement
            product={product}
            onUpdateProduct={handleUpdateProduct}
          />
        ) : activeTab === 'profit' ? (
          <ProfitLossReport
            orders={orders}
            expenses={expenses}
            product={product}
            onUpdateProduct={handleUpdateProduct}
            onNavigateToExpenses={() => setActiveTab('expenses')}
          />
        ) : activeTab === 'expenses' ? (
          <ExpenseManagement
            expenses={expenses}
            onRefreshExpenses={fetchData}
          />
        ) : (
          <AdminSettings
            orders={orders}
            expenses={expenses}
            product={product}
          />
        )}

      </main>

    </div>
  );
}

