import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  PlusCircle,
  Search,
  Calendar,
  Tag,
  Trash2,
  Edit3,
  Download,
  Check,
  X,
  CreditCard,
  PieChart,
  FileSpreadsheet,
  AlertCircle,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { saveExpense, deleteExpense } from '../services/firebaseDb';
import * as XLSX from 'xlsx';

const EXPENSE_CATEGORIES = [
  { id: 'ads', name: 'মেটা / ফেসবুক অ্যাড (Meta Ads)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'rent', name: 'অফিস / দোকান ভাড়া (Rent)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'salary', name: 'কর্মচারী বেতন / পারিশ্রমিক', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'packaging', name: 'প্যাকেজিং ও স্টিকার সামগ্রী', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'entertainment', name: 'চা / নাস্তা / আপ্যায়ন', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'transport', name: 'যাতায়াত ও পরিবহন খরচ', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  { id: 'utility', name: 'বিদ্যুৎ / ওয়াইফাই বিল', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'others', name: 'অন্যান্য সাধারণ খরচ', color: 'bg-slate-100 text-slate-800 border-slate-200' }
];

export default function ExpenseManagement({
  expenses = [],
  onRefreshExpenses
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'মেটা / ফেসবুক অ্যাড (Meta Ads)',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'cash',
    addedBy: 'এডমিন',
    notes: ''
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      amount: '',
      category: 'মেটা / ফেসবুক অ্যাড (Meta Ads)',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'cash',
      addedBy: 'এডমিন',
      notes: ''
    });
    setShowAddModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (exp) => {
    setEditingExpense(exp);
    setFormData({
      title: exp.title || '',
      amount: exp.amount || '',
      category: exp.category || 'মেটা / ফেসবুক অ্যাড (Meta Ads)',
      date: exp.date || new Date().toISOString().slice(0, 10),
      paymentMethod: exp.paymentMethod || 'cash',
      addedBy: exp.addedBy || 'এডমিন',
      notes: exp.notes || ''
    });
    setShowAddModal(true);
  };

  // Save Expense (Create or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) {
      alert('খরচের বিবরণ ও টাকার পরিমাণ আবশ্যক।');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...(editingExpense || {}),
        title: formData.title.trim(),
        amount: Math.max(0, parseInt(formData.amount, 10) || 0),
        category: formData.category,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        addedBy: formData.addedBy.trim() || 'এডমিন',
        notes: formData.notes.trim()
      };

      await saveExpense(payload);
      setShowAddModal(false);
      showToast(editingExpense ? 'খরচের তথ্য সফলভাবে আপডেট হয়েছে!' : 'নতুন খরচ সফলভাবে যোগ হয়েছে এবং লাইভ ব্যাকআপে যুক্ত হয়েছে!');
      if (onRefreshExpenses) onRefreshExpenses();
    } catch (err) {
      console.error(err);
      alert('খরচ সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Expense
  const handleDelete = async (expId, title) => {
    if (!window.confirm(`আপনি কি সত্যিই "${title}" খরচটি ডিলিট করতে চান?`)) return;

    try {
      await deleteExpense(expId);
      showToast('খরচটি সফলভাবে ডিলিট করা হয়েছে।');
      if (onRefreshExpenses) onRefreshExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const list = Array.isArray(expenses) ? expenses : [];
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayStr = now.toISOString().slice(0, 10);

    const totalExpense = list.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const thisMonthExpense = list.filter(e => (e.date || '').startsWith(currentMonthStr)).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const todayExpense = list.filter(e => (e.date || '').startsWith(todayStr)).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Group by category
    const catMap = {};
    list.forEach(e => {
      const cat = e.category || 'অন্যান্য';
      catMap[cat] = (catMap[cat] || 0) + (Number(e.amount) || 0);
    });

    let topCategory = { name: 'কোনো খরচ নেই', amount: 0 };
    Object.entries(catMap).forEach(([cat, amt]) => {
      if (amt > topCategory.amount) {
        topCategory = { name: cat, amount: amt };
      }
    });

    return {
      totalExpense,
      thisMonthExpense,
      todayExpense,
      topCategory,
      count: list.length
    };
  }, [expenses]);

  // Month options for filter
  const monthOptions = useMemo(() => {
    const set = new Set();
    (expenses || []).forEach(e => {
      if (e.date && e.date.length >= 7) {
        set.add(e.date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter(e => {
      const matchesSearch = !search ||
        (e.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.notes || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.id || '').toLowerCase().includes(search.toLowerCase());

      const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
      const matchesMonth = selectedMonth === 'all' || (e.date || '').startsWith(selectedMonth);

      return matchesSearch && matchesCat && matchesMonth;
    });
  }, [expenses, search, selectedCategory, selectedMonth]);

  // Export Expenses to Excel (.xlsx)
  const handleExportExpensesExcel = () => {
    if (filteredExpenses.length === 0) {
      alert('এক্সপোর্ট করার মতো কোনো খরচ নেই');
      return;
    }

    const rows = filteredExpenses.map(e => ({
      'খরচ আইডি': e.id,
      'তারিখ': e.date,
      'ক্যাটাগরি': e.category,
      'খরচের বিবরণ': e.title,
      'টাকার পরিমাণ (৳)': Number(e.amount) || 0,
      'পেমেন্ট মাধ্যম': e.paymentMethod === 'bkash' ? 'বিকাশ' : e.paymentMethod === 'nagad' ? 'নগদ' : e.paymentMethod === 'bank' ? 'ব্যাংক' : 'ক্যাশ',
      'যুক্তকারী': e.addedBy,
      'মন্তব্য': e.notes || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'খরচ_হিসাব');
    XLSX.writeFile(wb, `Onroun_Expenses_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner & Action */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shadow-xs">
              ৳
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                দোকান ও ব্যবসা খরচ ট্র্যাকার (Expense Management)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ফেসবুক অ্যাড, দোকান ভাড়া, কর্মচারীর বেতন ও যাবতীয় খরচের সঠিক হিসাব ও অটো-রেকর্ড
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExpensesExcel}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 transition active:scale-95"
            title="খরচের তালিকা এক্সেল ফাইলে ডাউনলোড করুন"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>খরচ এক্সেল (.xlsx)</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ নতুন খরচ যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Expense */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
            সর্বমোট ব্যয় / খরচ
          </span>
          <span className="text-2xl sm:text-3xl font-black text-rose-600 mt-1 block">
            ৳{metrics.totalExpense.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">
            মোট এন্ট্রি: {metrics.count} টি
          </span>
        </div>

        {/* This Month Expense */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
            চলতি মাসের খরচ
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            ৳{metrics.thisMonthExpense.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">
            {new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Today Expense */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
            আজকের খরচ
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-800 mt-1 block">
            ৳{metrics.todayExpense.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium mt-1 block">
            {new Date().toLocaleDateString('bn-BD')}
          </span>
        </div>

        {/* Top Expense Category */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-4 sm:p-5 shadow-xs border border-amber-200/80">
          <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider block">
            শীর্ষ ব্যয়ের খাত
          </span>
          <span className="text-sm sm:text-base font-extrabold text-amber-950 mt-1 block truncate">
            {metrics.topCategory.name}
          </span>
          <span className="text-sm font-black text-rose-600 mt-0.5 block">
            ৳{metrics.topCategory.amount.toLocaleString()}
          </span>
        </div>

      </div>

      {/* Auto Google Sheets Sync Badge */}
      <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-950">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <span className="font-semibold">
            <strong>লাইভ এক্সেল ও শিট সিঙ্ক চালু:</strong> এখানে খরচ এন্ট্রি করলেই বা এডিট করলে স্বয়ংক্রিয়ভাবে Google Sheets-এর <code>Expenses</code> ট্যাবে রেকর্ড জমা হয় এবং নিট লাভ সমন্বয় হয়।
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="খরচের নাম বা বিবরণ খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            {/* Month Select */}
            {monthOptions.length > 0 && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700"
              >
                <option value="all">সকল মাস</option>
                {monthOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}

            {(search || selectedCategory !== 'all' || selectedMonth !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSelectedMonth('all');
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1"
              >
                রিসেট
              </button>
            )}
          </div>

        </div>

        {/* Expenses Table */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">কোনো খরচ রেকর্ড পাওয়া যায়নি।</p>
            <p className="text-xs text-slate-400 mt-1">
              {expenses.length === 0 ? 'ওপরের "+ নতুন খরচ যোগ করুন" বাটনে ক্লিক করে খরচ যুক্ত করুন।' : 'ফিল্টারের সাথে মিলছে না।'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="pb-3 pl-2">তারিখ</th>
                  <th className="pb-3">খরচের বিবরণ</th>
                  <th className="pb-3">ক্যাটাগরি</th>
                  <th className="pb-3">পেমেন্ট মেথড</th>
                  <th className="pb-3 text-right">পরিমাণ (টাকা)</th>
                  <th className="pb-3 text-right pr-2">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const catObj = EXPENSE_CATEGORIES.find(c => c.name === exp.category) || { color: 'bg-slate-100 text-slate-700 border-slate-200' };

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 pl-2 text-slate-600 font-mono">
                        {exp.date ? new Date(exp.date).toLocaleDateString('bn-BD') : ''}
                      </td>
                      <td className="py-3 font-semibold text-slate-900">
                        <div>{exp.title}</div>
                        {exp.notes && (
                          <div className="text-[11px] text-slate-400 font-normal italic mt-0.5">
                            {exp.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg border ${catObj.color}`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">
                        <span className="capitalize bg-slate-100 px-2 py-0.5 rounded font-medium text-[11px]">
                          {exp.paymentMethod === 'bkash' ? 'বিকাশ' : exp.paymentMethod === 'nagad' ? 'নগদ' : exp.paymentMethod === 'bank' ? 'ব্যাংক' : 'ক্যাশ'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-black text-rose-600 text-sm">
                        ৳{Number(exp.amount).toLocaleString()}
                      </td>
                      <td className="py-3 text-right pr-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                            title="এডিট করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id, exp.title)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Add / Edit Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-sm">
                  ৳
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingExpense ? 'খরচ পরিবর্তন / এডিট' : 'নতুন খরচ যুক্ত করুন'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
              
              {/* Title */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  খরচের বিবরণ / টাইটেল *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মেটা ফেসবুক অ্যাড ক্যাম্পেইন - ১ম কিস্তি"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    টাকার পরিমাণ (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="যেমন: 1500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-black text-rose-600 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  খরচের খাত / ক্যাটাগরি *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Payment Method & Added By */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="cash">ক্যাশ (Cash)</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                    <option value="bank">ব্যাংক (Bank)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    যুক্তকারী
                  </label>
                  <input
                    type="text"
                    value={formData.addedBy}
                    onChange={(e) => setFormData({ ...formData, addedBy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  অতিরিক্ত মন্তব্য / নোট (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  placeholder="যেমন: মানি রিসিট নম্বর বা ট্রানজেকশন আইডি"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                ✓ সেভ করার সাথে সাথে এই খরচটি ডাটাবেস ও লাইভ গুগল শিটে সংরক্ষিত হবে এবং নিট লাভ স্বয়ংক্রিয়ভাবে হিসাব হবে।
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-xs transition disabled:opacity-50"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : editingExpense ? 'আপডেট করুন' : 'খরচ সংরক্ষণ করুন'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
