import React, { useState, useEffect } from 'react';
import { Search, Phone, FileText, Trash2, Download, CheckCircle, Clock, Truck, XCircle, AlertTriangle, RotateCcw, PlusCircle, Eye, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import InvoiceModal from './InvoiceModal';
import ManualOrderModal from './ManualOrderModal';
import OrderDetailsModal from './OrderDetailsModal';
import { updateOrderStatus, deleteOrder, updateOrder, getExpenses } from '../services/firebaseDb';
import { exportMasterBackupExcel } from '../services/backupService';

export default function OrderManagement({
  orders = [],
  product,
  onStatusChange,
  onDeleteOrder,
  onOrderCreated,
  onRefreshOrders,
  onUpdateOrder
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'online', 'manual'
  const [dueOnlyFilter, setDueOnlyFilter] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sourceFilter, dueOnlyFilter]);

  const isManualOrder = (ord) => {
    if (!ord) return false;
    if (ord.isManual === true || ord.orderSource === 'manual') return true;
    const n = (ord.notes || '').toLowerCase();
    return n.includes('ম্যানুয়াল') || n.includes('manual') || n.includes('এডমিন');
  };

  const getOrderDue = (ord) => {
    if (!ord) return 0;
    if (ord.dueAmount !== undefined && ord.dueAmount !== null) {
      return Math.max(0, parseInt(ord.dueAmount) || 0);
    }
    const match = (ord.notes || '').match(/\[বকেয়া:\s*৳?(\d+)\]/);
    if (match) {
      return parseInt(match[1]) || 0;
    }
    return 0;
  };

  const getOrderPaid = (ord) => {
    if (!ord) return 0;
    if (ord.paidAmount !== undefined && ord.paidAmount !== null) {
      return Math.max(0, parseInt(ord.paidAmount) || 0);
    }
    const due = getOrderDue(ord);
    if (due > 0) {
      return Math.max(0, (ord.totalPrice || 0) - due);
    }
    return ord.totalPrice || 0;
  };

  const statusMap = {
    pending: { label: 'নতুন অর্ডার (পেন্ডিং)', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
    confirmed: { label: 'কনফার্মড', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
    shipping: { label: 'কুরিয়ারে পাঠানো হয়েছে', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Truck },
    delivered: { label: 'সফল ডেলিভারি', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
    cancelled: { label: 'বাতিল (ক্যানসেল)', color: 'bg-rose-100 text-rose-800 border-rose-300', icon: XCircle },
    returned: { label: 'রিটার্ন (পার্সেল ফেরত)', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: RotateCcw }
  };

  const normalizeDigits = (str) => {
    if (!str) return '';
    const bnToEn = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
    return String(str).replace(/[০-৯]/g, d => bnToEn[d] || d);
  };

  // Filter orders with Bengali & English digit support + source filter (Online vs Manual) + Due filter
  const filteredOrders = (Array.isArray(orders) ? orders : []).filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const isManual = isManualOrder(o);
    const matchesSource = sourceFilter === 'all' || (sourceFilter === 'online' && !isManual) || (sourceFilter === 'manual' && isManual);
    const matchesDue = !dueOnlyFilter || getOrderDue(o) > 0;
    const rawQ = search.trim().toLowerCase();
    const normQ = normalizeDigits(rawQ);
    const matchesSearch = !rawQ ||
      o.customerName?.toLowerCase().includes(rawQ) ||
      o.phone?.includes(rawQ) ||
      normalizeDigits(o.phone)?.includes(normQ) ||
      o.id?.toLowerCase().includes(rawQ) ||
      normalizeDigits(o.id)?.includes(normQ) ||
      o.address?.toLowerCase().includes(rawQ);
    return matchesStatus && matchesSource && matchesDue && matchesSearch;
  });

  const dueOrdersList = (Array.isArray(orders) ? orders : []).filter(o => getOrderDue(o) > 0);
  const dueOrdersCount = dueOrdersList.length;
  const totalDueAmount = dueOrdersList.reduce((sum, o) => sum + getOrderDue(o), 0);

  const handleStatusChange = async (orderId, newStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    setUpdatingId(orderId);
    if (viewingOrder && viewingOrder.id === orderId) {
      setViewingOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }

    if (onStatusChange) {
      await onStatusChange(orderId, newStatus, targetOrder);
    } else {
      try {
        await updateOrderStatus(orderId, newStatus, targetOrder);
        if (onRefreshOrders) onRefreshOrders();
      } catch (e) {
        console.error(e);
      }
    }
    setUpdatingId(null);
  };

  const handleOrderUpdate = async (updatedOrder) => {
    setViewingOrder(updatedOrder);
    if (onUpdateOrder) {
      await onUpdateOrder(updatedOrder);
    } else {
      try {
        await updateOrder(updatedOrder);
        if (onRefreshOrders) onRefreshOrders();
      } catch (e) {
        console.error('Order update error:', e);
      }
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!window.confirm(`আপনি কি সত্যিই অর্ডার ${orderId} ডিলিট করতে চান?`)) return;

    if (viewingOrder && viewingOrder.id === orderId) {
      setViewingOrder(null);
    }

    if (onDeleteOrder) {
      await onDeleteOrder(orderId, targetOrder);
    } else {
      try {
        await deleteOrder(orderId, targetOrder);
        if (onRefreshOrders) onRefreshOrders();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 1. Export ONLY online orders for courier (Pathao / Steadfast / RedX)
  const handleExportCourierCSV = () => {
    const onlineOrders = filteredOrders.filter(o => !isManualOrder(o));
    if (onlineOrders.length === 0) {
      alert('কুরিয়ারে পাঠানোর মতো কোনো অনলাইন অর্ডার নেই (ম্যানুয়াল অর্ডারে কুরিয়ার প্রয়োজন নেই)।');
      return;
    }

    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Zone', 'Package', 'Size', 'Color', 'Quantity', 'COD Amount (৳)', 'Paid (৳)', 'Due (৳)', 'Payment Status', 'Notes'];
    const rows = onlineOrders.map(o => {
      const packageLabel = o.packageType === 'combo' 
        ? '৪ পিস মেগা কম্বো' 
        : o.packageType === 'three_pcs'
        ? '৩ পিস ভ্যালু প্যাক'
        : o.packageType === 'two_pcs'
        ? '২ পিস স্মার্ট প্যাক'
        : '১ পিস ট্রায়াল';
      const colorLabel = o.packageType === 'combo' ? 'সব কালার (৪ পিস সেট)' : (o.selectedColor || 'নেভি ব্লু');
      const zoneLabel = o.deliveryZone === 'outside' ? 'সিলেটের বাইরে' : 'সিলেটের ভেতরে';
      const due = getOrderDue(o);
      const paid = getOrderPaid(o);
      const payStatus = due > 0 ? (paid > 0 ? 'Partial Due' : 'Full Due') : 'Paid';

      return [
        o.id,
        new Date(o.createdAt).toLocaleDateString(),
        `"${o.customerName}"`,
        `'${o.phone}`,
        `"${(o.address || '').replace(/"/g, '""')}"`,
        zoneLabel,
        packageLabel,
        o.selectedSize,
        colorLabel,
        o.quantity,
        o.totalPrice,
        paid,
        due,
        payStatus,
        `"${(o.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `onroun_courier_online_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export all orders backup (including manual & due details)
  const handleExportAllOrdersCSV = () => {
    if (filteredOrders.length === 0) {
      alert('এক্সপোর্ট করার মতো কোনো অর্ডার নেই');
      return;
    }

    const headers = ['Order ID', 'Source', 'Date', 'Customer Name', 'Phone', 'Address', 'Zone', 'Package', 'Size', 'Color', 'Quantity', 'Total Amount', 'Paid (৳)', 'Due (৳)', 'Payment Status', 'Payment Method', 'Status', 'Notes'];
    const rows = filteredOrders.map(o => {
      const packageLabel = o.packageType === 'combo' 
        ? '৪ পিস মেগা কম্বো' 
        : o.packageType === 'three_pcs'
        ? '৩ পিস ভ্যালু প্যাক'
        : o.packageType === 'two_pcs'
        ? '২ পিস স্মার্ট প্যাক'
        : '১ পিস ট্রায়াল';
      const colorLabel = o.packageType === 'combo' ? 'সব কালার (৪ পিস সেট)' : (o.selectedColor || 'নেভি ব্লু');
      const zoneLabel = o.deliveryZone === 'outside' ? 'সিলেটের বাইরে' : 'সিলেটের ভেতরে';
      const sourceLabel = isManualOrder(o) ? 'ম্যানুয়াল (কুরিয়ার নেই)' : 'অনলাইন (কুরিয়ার)';
      const due = getOrderDue(o);
      const paid = getOrderPaid(o);
      const payStatus = due > 0 ? (paid > 0 ? 'Partial Due' : 'Full Due') : 'Paid';
      const payMethod = o.paymentMethod || 'cash';

      return [
        o.id,
        sourceLabel,
        new Date(o.createdAt).toLocaleDateString(),
        `"${o.customerName}"`,
        `'${o.phone}`,
        `"${(o.address || '').replace(/"/g, '""')}"`,
        zoneLabel,
        packageLabel,
        o.selectedSize,
        colorLabel,
        o.quantity,
        o.totalPrice,
        paid,
        due,
        payStatus,
        payMethod,
        o.status,
        `"${(o.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `onroun_all_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCount = (st) => orders.filter(o => o.status === st).length;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
      
      {/* Header & CSV export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-black text-slate-900">
            অর্ডার তালিকা ও ডেলিভারি ম্যানেজমেন্ট
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            মোট অর্ডার: {orders.length} টি | অনলাইন: {orders.filter(o => !isManualOrder(o)).length} টি | ম্যানুয়াল: {orders.filter(o => isManualOrder(o)).length} টি
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ ম্যানুয়াল অর্ডার</span>
          </button>

          <button
            onClick={handleExportCourierCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95"
            title="শুধু অনলাইন অর্ডার কুরিয়ারের (Steadfast/Pathao) জন্য এক্সপোর্ট করুন"
          >
            <Truck className="w-4 h-4" />
            <span>কুরিয়ার CSV (অনলাইন)</span>
          </button>

          <button
            onClick={handleExportAllOrdersCSV}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 border border-slate-300 transition active:scale-95"
            title="সকল অর্ডার (অনলাইন ও ম্যানুয়াল) ব্যাকআপ"
          >
            <Download className="w-4 h-4" />
            <span>সব অর্ডার CSV</span>
          </button>

          <button
            onClick={async () => {
              try {
                const exps = await getExpenses();
                exportMasterBackupExcel({ orders, expenses: exps, product });
              } catch (e) {
                exportMasterBackupExcel({ orders, expenses: [], product });
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            title="৫টি শিট সম্বলিত সম্পূর্ণ মাস্টার এক্সেল ফাইল ডাউনলোড"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>মাস্টার এক্সেল (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Auto Stock Reconciliation Notice */}
      <div className="mt-4 bg-emerald-50/80 border border-emerald-200 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
        <span className="text-base shrink-0">📦</span>
        <span className="font-semibold leading-relaxed">
          <strong>অটো স্টক সমন্বয় চালু রয়েছে:</strong> নতুন অর্ডার বা ডেলিভারিতে স্টক কমে যায়, আর কাস্টমার <strong>বাতিল (Cancel)</strong> বা <strong>রিটার্ন (Return)</strong> করলে পণ্যগুলো স্বয়ংক্রিয়ভাবে মূল ইনভেন্টরি স্টকে ফেরত জমা হয়।
        </span>
      </div>

      {/* Source Filter Tabs: All, Online (Courier), Manual (Direct) */}
      <div className="flex flex-wrap items-center gap-2 pt-4 pb-1">
        <span className="text-xs font-bold text-slate-500 mr-1">অর্ডার উৎস:</span>
        <button
          onClick={() => setSourceFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            sourceFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>সকল ({orders.length})</span>
        </button>

        <button
          onClick={() => setSourceFilter('online')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            sourceFilter === 'online'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
          }`}
        >
          <span>🌐 অনলাইন (কুরিয়ার যাবে)</span>
          <span className="bg-sky-200/60 text-sky-950 px-1.5 py-0.2 rounded-full text-[10px]">
            {orders.filter(o => !isManualOrder(o)).length}
          </span>
        </button>

        <button
          onClick={() => setSourceFilter('manual')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            sourceFilter === 'manual'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <span>📝 ম্যানুয়াল (কুরিয়ার ছাড়া)</span>
          <span className="bg-indigo-200/60 text-indigo-950 px-1.5 py-0.2 rounded-full text-[10px]">
            {orders.filter(o => isManualOrder(o)).length}
          </span>
        </button>

        <button
          onClick={() => setDueOnlyFilter(!dueOnlyFilter)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0 ${
            dueOnlyFilter
              ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400'
              : dueOrdersCount > 0
              ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
              : 'bg-slate-100 text-slate-400 opacity-60'
          }`}
          title="শুধুমাত্র বকেয়া থাকা অর্ডারগুলো ফিল্টার করুন"
        >
          <span>⚠️ বকেয়া অর্ডার</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            dueOnlyFilter ? 'bg-rose-800 text-white' : 'bg-amber-200 text-amber-950 font-black'
          }`}>
            {dueOrdersCount}টি {totalDueAmount > 0 ? `(৳${totalDueAmount})` : ''}
          </span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none border-b border-slate-100">
        <button
          onClick={() => setStatusFilter('all')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          সকল ({orders.length})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            statusFilter === 'pending'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
          }`}
        >
          <span>পেন্ডিং</span>
          <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{getCount('pending')}</span>
        </button>
        <button
          onClick={() => setStatusFilter('confirmed')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            statusFilter === 'confirmed'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
          }`}
        >
          <span>কনফার্মড</span>
          <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{getCount('confirmed')}</span>
        </button>
        <button
          onClick={() => setStatusFilter('shipping')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            statusFilter === 'shipping'
              ? 'bg-purple-600 text-white shadow'
              : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
          }`}
        >
          <span>কুরিয়ারে</span>
          <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{getCount('shipping')}</span>
        </button>
        <button
          onClick={() => setStatusFilter('delivered')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            statusFilter === 'delivered'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <span>ডেলিভার্ড</span>
          <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{getCount('delivered')}</span>
        </button>
        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            statusFilter === 'cancelled'
              ? 'bg-rose-600 text-white shadow'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
          }`}
        >
          <span>বাতিল</span>
          <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{getCount('cancelled')}</span>
        </button>
        <button
          onClick={() => setStatusFilter('returned')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            statusFilter === 'returned'
              ? 'bg-orange-600 text-white shadow'
              : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
          }`}
        >
          <span>রিটার্ন</span>
          <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{getCount('returned')}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="py-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="নাম, ফোন নম্বর, ঠিকানা বা অর্ডার আইডি দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Pagination & Orders Display (10 items per page) */}
      {(() => {
        const totalOrdersCount = filteredOrders.length;
        const totalPages = Math.ceil(totalOrdersCount / PAGE_SIZE) || 1;
        const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
        const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
        const endIndex = Math.min(startIndex + PAGE_SIZE, totalOrdersCount);
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

        return (
          <>
            {/* Orders List / Cards */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">কোনো অর্ডার পাওয়া যায়নি।</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paginatedOrders.map((order) => {
                  const stObj = statusMap[order.status] || statusMap.pending;
                  const StatusIcon = stObj.icon;

                  const packageShort = order.packageType === 'combo'
                    ? '৪ পিস কম্বো'
                    : order.packageType === 'three_pcs'
                    ? '৩ পিস ভ্যালু'
                    : order.packageType === 'two_pcs'
                    ? '২ পিস স্মার্ট'
                    : '১ পিস';

                  return (
                    <div
                      key={order.id}
                      className="bg-white hover:bg-slate-50/90 rounded-2xl p-3 sm:py-3 sm:px-4 border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      {/* 1. ID & Timestamp */}
                      <div className="flex items-center gap-2.5 shrink-0 min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-extrabold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              {order.id}
                            </span>
                            {isManualOrder(order) ? (
                              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border border-indigo-200">
                                📝 ম্যানুয়াল
                              </span>
                            ) : (
                              <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border border-sky-200">
                                🌐 অনলাইন
                              </span>
                            )}
                            {(() => {
                              const due = getOrderDue(order);
                              const isMan = isManualOrder(order);
                              if (due > 0) {
                                return (
                                  <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-rose-300 flex items-center gap-0.5">
                                    ⚠️ বকেয়া: ৳{due}
                                  </span>
                                );
                              }
                              if (isMan) {
                                return (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-200">
                                    ✓ পেইড
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            <span className="block font-medium">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' }) : 'তারিখ নেই'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Customer Name, Phone & Address snippet */}
                      <div className="min-w-[180px] flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{order.customerName}</span>
                          <a
                            href={`tel:${order.phone}`}
                            className="font-mono text-rose-600 font-bold hover:underline flex items-center gap-0.5 text-xs bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100"
                            title="কল করুন"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{order.phone}</span>
                          </a>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-[260px] sm:max-w-[340px] mt-0.5" title={order.address}>
                          {order.address}
                        </p>
                      </div>

                      {/* 3. Package, Size, Total Price & Profit */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px]">
                          {packageShort} ({order.quantity || 1}টি)
                        </span>
                        <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-mono text-xs">
                          {order.selectedSize}
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="font-black text-slate-900 text-xs sm:text-sm shrink-0 ml-0.5">
                            ৳{order.totalPrice}
                          </span>
                          {getOrderDue(order) > 0 && (
                            <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-1 rounded border border-rose-200">
                              বকেয়া ৳{getOrderDue(order)}
                            </span>
                          )}
                        </div>

                        {/* Real-time Profit Badge */}
                        {(() => {
                          const isManual = isManualOrder(order);
                          const costPerPcs = product?.costPricePerPiece ?? 220;
                          const packCost = isManual ? 0 : (product?.packagingCost ?? 30);
                          const courierFee = isManual ? 0 : (order.deliveryZone === 'outside' ? (product?.deliveryRealCostOutside ?? 120) : (product?.deliveryRealCostInside ?? 60));
                          const qtyNum = Math.max(1, parseInt(order.quantity) || 1);
                          const units = order.packageType === 'combo' ? (4 * qtyNum) : order.packageType === 'three_pcs' ? (3 * qtyNum) : order.packageType === 'two_pcs' ? (2 * qtyNum) : qtyNum;
                          const estOrderCost = (units * costPerPcs) + packCost + courierFee;
                          const estProfit = (order.totalPrice || 0) - estOrderCost;

                          if (order.status === 'delivered') {
                            return (
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                +৳{estProfit} লাভ
                              </span>
                            );
                          }
                          if (order.status === 'returned') {
                            return (
                              <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                {isManual ? '৳০ (ফেরত)' : `-৳${product?.returnLossCharge ?? 100} ক্ষতি`}
                              </span>
                            );
                          }
                          if (order.status === 'cancelled') {
                            return (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                ৳০
                              </span>
                            );
                          }
                          return (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200" title={isManual ? 'ম্যানুয়াল বিক্রয়ে কুরিয়ার খরচ নেই' : 'ডেলিভারি সফল হলে সম্ভাব্য নিট লাভ'}>
                              ~+৳{estProfit}
                            </span>
                          );
                        })()}
                      </div>

                      {/* 4. Status Selector & Action Buttons */}
                      <div className="flex items-center justify-between md:justify-end gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {/* Status Select */}
                        <div className="relative">
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border appearance-none pr-6 cursor-pointer ${stObj.color}`}
                          >
                            <option value="pending">পেন্ডিং</option>
                            <option value="confirmed">কনফার্মড</option>
                            <option value="shipping">কুরিয়ারে</option>
                            <option value="delivered">ডেলিভার্ড</option>
                            <option value="cancelled">বাতিল</option>
                            <option value="returned">রিটার্ন</option>
                          </select>
                          <StatusIcon className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Order View Details Button */}
                        <button
                          onClick={() => setViewingOrder(order)}
                          className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1.5 rounded-xl text-xs transition border border-blue-200"
                          title="অর্ডারের বিস্তারিত দেখুন"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ভিউ</span>
                        </button>

                        {/* Invoice Button */}
                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 transition"
                          title="চালান / ইনভয়েস প্রিন্ট করুন"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition"
                          title="অর্ডার ডিলিট"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls (10 items per page) */}
            {filteredOrders.length > PAGE_SIZE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 mt-4 border-t border-slate-100 text-xs">
                <div className="text-slate-500 font-medium">
                  প্রদর্শিত হচ্ছে <strong className="text-slate-800">{startIndex + 1}–{endIndex}</strong> (মোট <strong>{totalOrdersCount}</strong> টি অর্ডারের মধ্যে)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={validCurrentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>পূর্ববর্তী</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-bold transition flex items-center justify-center text-xs ${
                          validCurrentPage === pageNum
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={validCurrentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
                  >
                    <span>পরবর্তী</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Order Details View & Edit Modal */}
      {viewingOrder && (
        <OrderDetailsModal
          order={viewingOrder}
          product={product}
          onClose={() => setViewingOrder(null)}
          onOpenInvoice={(ord) => setSelectedInvoiceOrder(ord)}
          onStatusChange={handleStatusChange}
          onUpdateOrder={handleOrderUpdate}
          updatingId={updatingId}
        />
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* Manual Order Modal */}
      {showManualModal && (
        <ManualOrderModal
          product={product}
          onClose={() => setShowManualModal(false)}
          onOrderCreated={(newOrder) => {
            setShowManualModal(false);
            if (onOrderCreated) {
              onOrderCreated(newOrder);
            } else if (onRefreshOrders) {
              onRefreshOrders();
            }
            setSelectedInvoiceOrder(newOrder);
          }}
        />
      )}

    </div>
  );
}

