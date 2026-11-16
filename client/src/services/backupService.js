import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Clean data before sending
 */
function cleanObj(obj) {
  if (!obj) return {};
  const cleaned = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

/**
 * Google Apps Script Template for User to copy-paste into Google Sheets
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ================================================================
 * ONROUN BD - Realtime Google Sheets Sync Webhook Script
 * ================================================================
 * কিভাবে চালু করবেন:
 * ১. গুগল ড্রাইভে একটি নতুন Google Sheet তৈরি করুন।
 * ২. মেনু থেকে Extensions > Apps Script -এ ক্লিক করুন।
 * ৩. আগের সব কোড মুছে দিয়ে নিচের পুরো কোডটি পেস্ট করুন।
 * ৪. ওপরের Deploy > New deployment বাটনে ক্লিক করুন।
 * ৫. Select type (গিয়ার আইকন) থেকে "Web app" সিলেক্ট করুন।
 * ৬. Description: "Onroun Sync" দিন।
 * ৭. Execute as: "Me" নির্বাচন করুন।
 * ৮. "Who has access": অবশ্যই "Anyone" নির্বাচন করুন।
 * ৯. Deploy ক্লিক করে "Web app URL" কপি করুন এবং Onroun অ্যাডমিন প্যানেলে বসিয়ে দিন।
 * ================================================================
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var contents = e.postData ? e.postData.contents : "{}";
    var payload = JSON.parse(contents);
    var event = payload.event;
    var data = payload.payload;

    if (event === 'new_order' || event === 'update_order') {
      recordOrder(ss, data);
    } else if (event === 'new_expense' || event === 'update_expense') {
      recordExpense(ss, data);
    } else if (event === 'delete_expense') {
      deleteExpense(ss, data);
    } else if (event === 'stock_update') {
      recordStock(ss, data);
    } else if (event === 'batch_sync') {
      if (data.orders && Array.isArray(data.orders)) {
        data.orders.forEach(function(o) { recordOrder(ss, o); });
      }
      if (data.expenses && Array.isArray(data.expenses)) {
        data.expenses.forEach(function(ex) { recordExpense(ss, ex); });
      }
      if (data.stock) {
        recordStock(ss, data.stock);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", timestamp: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "ok", app: "Onroun BD Realtime Sync Active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, sheetName, headers, headerColor) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    var sheets = ss.getSheets();
    if (sheets.length === 1 && (sheets[0].getName() === "Sheet1" || sheets[0].getName() === "পাতা ১") && sheets[0].getLastRow() === 0) {
      sheet = sheets[0];
      sheet.setName(sheetName);
    } else {
      sheet = ss.insertSheet(sheetName);
    }
    sheet.appendRow(headers);
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setFontWeight("bold")
         .setBackground(headerColor || "#0f172a")
         .setFontColor("#ffffff")
         .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function recordOrder(ss, order) {
  if (!order || !order.id) return;
  var headers = [
    "Order ID", "Date", "Customer Name", "Phone", "Address", "Delivery Zone",
    "Package Type", "Selected Size", "Colors", "Quantity", "Total Bill (Tk)",
    "Paid Amount (Tk)", "Due Amount (Tk)", "Payment Status", "Payment Method",
    "Estimated Profit (Tk)", "Order Source", "Status", "Notes"
  ];
  var sheet = getOrCreateSheet(ss, "Orders", headers, "#0f172a");

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(order.id)) {
      rowIndex = i + 1;
      break;
    }
  }

  var due = order.dueAmount !== undefined ? Number(order.dueAmount) : 0;
  var paid = order.paidAmount !== undefined ? Number(order.paidAmount) : (due > 0 ? Math.max(0, (order.totalPrice || 0) - due) : (order.totalPrice || 0));
  var payStatus = due > 0 ? (paid > 0 ? "Partial Due (বকেয়া)" : "Full Due (সম্পূর্ণ বকেয়া)") : "Paid (পরিশোধিত)";

  var packageLabel = order.packageType === "combo" ? "৪ পিস মেগা কম্বো" :
                     order.packageType === "three_pcs" ? "৩ পিস ভ্যালু প্যাক" :
                     order.packageType === "two_pcs" ? "২ পিস স্মার্ট প্যাক" : "১ পিস ট্রায়াল";

  var row = [
    order.id,
    order.createdAt ? new Date(order.createdAt).toLocaleString("en-US", { timeZone: "Asia/Dhaka" }) : new Date().toLocaleString(),
    order.customerName || "",
    "'" + (order.phone || ""),
    order.address || "",
    order.deliveryZone === "outside" ? "সিলেটের বাইরে" : "সিলেটের ভেতরে",
    packageLabel,
    order.selectedSize || "L",
    order.selectedColor || (order.selectedColors ? order.selectedColors.join(", ") : "All"),
    order.quantity || 1,
    order.totalPrice || 0,
    paid,
    due,
    payStatus,
    order.paymentMethod || "cash",
    order.estProfit || 0,
    order.isManual ? "ম্যানুয়াল অর্ডার" : "অনলাইন ওয়েবসাইট",
    order.status || "pending",
    order.notes || ""
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function recordExpense(ss, exp) {
  if (!exp || !exp.id) return;
  var headers = ["Expense ID", "Date", "Category", "Description", "Amount (Tk)", "Payment Method", "Added By", "Notes"];
  var sheet = getOrCreateSheet(ss, "Expenses", headers, "#be123c");

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(exp.id)) {
      rowIndex = i + 1;
      break;
    }
  }

  var row = [
    exp.id,
    exp.date || new Date().toISOString().slice(0, 10),
    exp.category || "অন্যান্য খরচ",
    exp.title || "",
    Number(exp.amount) || 0,
    exp.paymentMethod || "cash",
    exp.addedBy || "Admin",
    exp.notes || ""
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function deleteExpense(ss, exp) {
  if (!exp || !exp.id) return;
  var sheet = ss.getSheetByName("Expenses");
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(exp.id)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function recordStock(ss, prod) {
  var headers = ["Size Code", "Waist Size", "Color Name", "Available Stock (Pcs)", "Last Sync"];
  var sheet = getOrCreateSheet(ss, "Stock", headers, "#047857");
  sheet.clearContents();
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#047857").setFontColor("#ffffff");
  sheet.setFrozenRows(1);

  if (!prod || !prod.sizes) return;
  var colors = prod.colors || [
    { id: 'navy', name: 'ক্লাসিক নেভি ব্লু' },
    { id: 'mint', name: 'সতেজ মিন্ট গ্রিন' },
    { id: 'grey', name: 'চারকোল গ্রে' },
    { id: 'lightgrey', name: 'লাইট অ্যাশ গ্রে' }
  ];

  var rows = [];
  prod.sizes.forEach(function(s) {
    colors.forEach(function(c) {
      var st = (s.colorStock && s.colorStock[c.id] !== undefined) ? Number(s.colorStock[c.id]) : 0;
      rows.push([
        s.id,
        s.waist || "",
        c.name,
        st,
        new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
      ]);
    });
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}
`;

/**
 * Send real-time webhook payload to Google Sheets Apps Script
 */
export async function syncGoogleSheets(event, payload) {
  try {
    let webhookUrl = '';
    const local = localStorage.getItem('onroun_settings');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        webhookUrl = parsed.googleSheetsWebhookUrl || '';
      } catch (e) {}
    }

    // Cloud Firestore Fallback: If not found in localStorage (e.g. fresh customer device), fetch from Firestore
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      try {
        const snap = await getDoc(doc(db, 'config', 'settings'));
        if (snap.exists()) {
          const data = snap.data();
          webhookUrl = data?.googleSheetsWebhookUrl || '';
          try {
            localStorage.setItem('onroun_settings', JSON.stringify(data));
          } catch (e) {}
        }
      } catch (e) {
        console.warn('Firestore settings fetch fallback error in syncGoogleSheets:', e);
      }
    }

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return false;
    }

    // Google Apps Script requires no-cors when called directly from client browsers to avoid CORS preflight blocks
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event,
        payload: cleanObj(payload),
        timestamp: new Date().toISOString()
      })
    });

    localStorage.setItem('onroun_last_sheets_sync', new Date().toISOString());
    return true;
  } catch (err) {
    console.warn('Google Sheets sync warning:', err.message);
    return false;
  }
}

/**
 * Perform full batch sync of all orders, expenses, and stock to Google Sheets
 */
export async function batchSyncToGoogleSheets({ orders = [], expenses = [], product = {} }) {
  try {
    let webhookUrl = '';
    const local = localStorage.getItem('onroun_settings');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        webhookUrl = parsed.googleSheetsWebhookUrl || '';
      } catch (e) {}
    }

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      try {
        const snap = await getDoc(doc(db, 'config', 'settings'));
        if (snap.exists()) {
          const data = snap.data();
          webhookUrl = data?.googleSheetsWebhookUrl || '';
          try {
            localStorage.setItem('onroun_settings', JSON.stringify(data));
          } catch (e) {}
        }
      } catch (e) {}
    }

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return { success: false, error: 'গুগল শিট Webhook URL সেটিংস এ দেওয়া নেই।' };
    }

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'batch_sync',
        payload: {
          orders: orders.map(cleanObj),
          expenses: expenses.map(cleanObj),
          stock: cleanObj(product)
        },
        timestamp: new Date().toISOString()
      })
    });

    localStorage.setItem('onroun_last_sheets_sync', new Date().toISOString());
    return { success: true, count: orders.length };
  } catch (err) {
    console.error('Batch sync error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Export Master Backup Excel Workbook (.xlsx) with 5 structured sheets
 */
export function exportMasterBackupExcel({ orders = [], expenses = [], product = {} }) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);

  // Helper for isManual
  const isManualOrder = (ord) => {
    if (!ord) return false;
    if (ord.isManual === true || ord.orderSource === 'manual') return true;
    const n = (ord.notes || '').toLowerCase();
    return n.includes('ম্যানুয়াল') || n.includes('manual') || n.includes('এডমিন');
  };

  // Helper for units
  const getOrderUnits = (ord) => {
    const qty = Math.max(1, parseInt(ord.quantity) || 1);
    if (ord.packageType === 'combo') return 4 * qty;
    if (ord.packageType === 'three_pcs') return 3 * qty;
    if (ord.packageType === 'two_pcs') return 2 * qty;
    return 1 * qty;
  };

  // -------------------------------------------------------------
  // Sheet 1: Orders (সব অর্ডার ও গ্রাহকের পূর্ণ বিবরণ)
  // -------------------------------------------------------------
  const costPerPcs = product?.costPricePerPiece ?? 220;
  const packCost = product?.packagingCost ?? 30;
  const courierIn = product?.deliveryRealCostInside ?? 60;
  const courierOut = product?.deliveryRealCostOutside ?? 120;
  const retLoss = product?.returnLossCharge ?? 100;

  const ordersData = orders.map((o) => {
    const isMan = isManualOrder(o);
    const units = getOrderUnits(o);
    const buying = units * costPerPcs;
    const pCost = isMan ? 0 : packCost;
    const cCost = isMan ? 0 : (o.deliveryZone === 'outside' ? courierOut : courierIn);
    const totCost = buying + pCost + cCost;

    let netProfit = 0;
    if (o.status === 'delivered') {
      netProfit = (o.totalPrice || 0) - totCost;
    } else if (o.status === 'returned') {
      netProfit = isMan ? 0 : -retLoss;
    } else if (o.status === 'cancelled') {
      netProfit = 0;
    } else {
      netProfit = (o.totalPrice || 0) - totCost; // estimated
    }

    const due = o.dueAmount !== undefined ? Number(o.dueAmount) : 0;
    const paid = o.paidAmount !== undefined ? Number(o.paidAmount) : (due > 0 ? Math.max(0, (o.totalPrice || 0) - due) : (o.totalPrice || 0));
    const payStatus = due > 0 ? (paid > 0 ? 'আংশিক বকেয়া' : 'সম্পূর্ণ বকেয়া') : 'সম্পূর্ণ পেইড';

    const packageLabel = o.packageType === 'combo' ? '৪ পিস মেগা কম্বো' :
                         o.packageType === 'three_pcs' ? '৩ পিস ভ্যালু প্যাক' :
                         o.packageType === 'two_pcs' ? '২ পিস স্মার্ট প্যাক' : '১ পিস ট্রায়াল';

    return {
      'অর্ডার আইডি': o.id,
      'তারিখ ও সময়': o.createdAt ? new Date(o.createdAt).toLocaleString('bn-BD') : '',
      'গ্রাহকের নাম': o.customerName || '',
      'মোবাইল নম্বর': o.phone || '',
      'ঠিকানা': o.address || '',
      'ডেলিভারি এলাকা': o.deliveryZone === 'outside' ? 'সিলেটের বাইরে (সারাদেশ)' : 'সিলেটের ভেতরে',
      'প্যাকেজ': packageLabel,
      'সাইজ': o.selectedSize || 'L',
      'কালার': o.selectedColor || (o.selectedColors ? o.selectedColors.join(', ') : 'সকল ৪ কালার'),
      'পরিমাণ (প্যাক)': o.quantity || 1,
      'মোট পিস': units,
      'পণ্য মূল্য (৳)': o.itemPrice || 0,
      'ডেলিভারি চার্জ (৳)': o.deliveryCharge || 0,
      'সর্বমোট বিল (৳)': o.totalPrice || 0,
      'পরিশোধিত টাকা (৳)': paid,
      'অবশিষ্ট বকেয়া (৳)': due,
      'পেমেন্ট স্ট্যাটাস': payStatus,
      'পেমেন্ট মাধ্যম': o.paymentMethod || 'cash',
      'আনুমানিক লাভ (৳)': netProfit,
      'অর্ডার সোর্স': isMan ? 'ম্যানুয়াল অর্ডার' : 'অনলাইন ওয়েবসাইট',
      'অর্ডার স্ট্যাটাস': o.status || 'pending',
      'নোট': o.notes || ''
    };
  });

  const wsOrders = XLSX.utils.json_to_sheet(ordersData);
  XLSX.utils.book_append_sheet(wb, wsOrders, 'সব_অর্ডার');

  // -------------------------------------------------------------
  // Sheet 2: Due Ledger (বকেয়া খাতা)
  // -------------------------------------------------------------
  const dueOrders = orders.filter(o => {
    const due = o.dueAmount !== undefined ? Number(o.dueAmount) : 0;
    return due > 0;
  });

  const dueData = dueOrders.map(o => {
    const due = Number(o.dueAmount) || 0;
    const paid = o.paidAmount !== undefined ? Number(o.paidAmount) : Math.max(0, (o.totalPrice || 0) - due);
    return {
      'অর্ডার আইডি': o.id,
      'তারিখ': o.createdAt ? new Date(o.createdAt).toLocaleDateString('bn-BD') : '',
      'গ্রাহকের নাম': o.customerName || '',
      'ফোন নম্বর': o.phone || '',
      'ঠিকানা': o.address || '',
      'মোট বিল (৳)': o.totalPrice || 0,
      'পরিশোধিত জমা (৳)': paid,
      'অবশিষ্ট বকেয়া (৳)': due,
      'পেমেন্ট মাধ্যম': o.paymentMethod || 'cash',
      'বর্তমান অবস্থা': o.status || 'pending',
      'মন্তব্য': o.notes || ''
    };
  });

  const wsDue = XLSX.utils.json_to_sheet(dueData.length > 0 ? dueData : [{ 'তথ্য': 'বর্তমানে কোনো বকেয়া অর্ডার নেই' }]);
  XLSX.utils.book_append_sheet(wb, wsDue, 'বকেয়া_খাতা');

  // -------------------------------------------------------------
  // Sheet 3: Stock Inventory (স্টক ইনভেন্টরি)
  // -------------------------------------------------------------
  const colors = product?.colors || [
    { id: 'navy', name: 'ক্লাসিক নেভি ব্লু' },
    { id: 'mint', name: 'সতেজ মিন্ট গ্রিন' },
    { id: 'grey', name: 'চারকোল গ্রে' },
    { id: 'lightgrey', name: 'লাইট অ্যাশ গ্রে' }
  ];

  const stockRows = [];
  (product?.sizes || []).forEach(s => {
    colors.forEach(c => {
      const pcs = (s.colorStock && s.colorStock[c.id] !== undefined) ? Number(s.colorStock[c.id]) : 0;
      stockRows.push({
        'সাইজ কোড': s.id,
        'কোমর মাপ (ইঞ্চি)': s.waist || '',
        'কালার ভ্যারিয়েন্ট': c.name,
        'কালার আইডি': c.id,
        'মজুদ স্টক (পিস)': pcs,
        'সাইজের মোট স্টক': s.stock || 0
      });
    });
  });

  const wsStock = XLSX.utils.json_to_sheet(stockRows);
  XLSX.utils.book_append_sheet(wb, wsStock, 'স্টক_ইনভেন্টরি');

  // -------------------------------------------------------------
  // Sheet 4: Expenses Ledger (দোকান ও ব্যবসা খরচ খাতা)
  // -------------------------------------------------------------
  const expenseData = expenses.map(ex => ({
    'খরচ আইডি': ex.id,
    'তারিখ': ex.date || '',
    'ক্যাটাগরি': ex.category || 'অন্যান্য খরচ',
    'খরচের বিবরণ': ex.title || '',
    'টাকার পরিমাণ (৳)': Number(ex.amount) || 0,
    'পেমেন্ট মাধ্যম': ex.paymentMethod || 'cash',
    'যুক্তকারী': ex.addedBy || 'এডমিন',
    'নোট': ex.notes || ''
  }));

  const wsExpenses = XLSX.utils.json_to_sheet(expenseData.length > 0 ? expenseData : [{ 'তথ্য': 'এখনো কোনো খরচ এন্ট্রি করা হয়নি' }]);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'খরচ_হিসাব');

  // -------------------------------------------------------------
  // Sheet 5: Profit & Loss Statement (লাভ-ক্ষতি ও সার্বিক সারসংক্ষেপ)
  // -------------------------------------------------------------
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const deliveredOnline = deliveredOrders.filter(o => !isManualOrder(o));
  const returnedOnline = orders.filter(o => o.status === 'returned' && !isManualOrder(o));

  const totalDeliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalDeliveredBuyingCost = deliveredOrders.reduce((sum, o) => sum + (getOrderUnits(o) * costPerPcs), 0);
  const totalPackagingCost = deliveredOnline.length * packCost;
  const totalCourierCost = deliveredOnline.reduce((sum, o) => sum + (o.deliveryZone === 'outside' ? courierOut : courierIn), 0);
  const totalReturnLosses = returnedOnline.length * retLoss;

  const grossProfit = totalDeliveredRevenue - (totalDeliveredBuyingCost + totalPackagingCost + totalCourierCost) - totalReturnLosses;
  const totalExpenses = expenses.reduce((sum, ex) => sum + (Number(ex.amount) || 0), 0);
  const netBottomlineProfit = grossProfit - totalExpenses;
  const totalDueReceivable = dueOrders.reduce((sum, o) => sum + (Number(o.dueAmount) || 0), 0);
  const totalAvailableStock = (product?.sizes || []).reduce((sum, s) => sum + (Number(s.stock) || 0), 0);

  const summaryData = [
    { 'বিষয় / সূচক': 'মোট অর্ডার সংখ্যা', 'পরিমাণ': `${orders.length} টি`, 'বিবরণ': 'সকল অনলাইন ও ম্যানুয়াল অর্ডার' },
    { 'বিষয় / সূচক': 'সফল ডেলিভারি সম্পন্ন', 'পরিমাণ': `${deliveredOrders.length} টি`, 'বিবরণ': 'ডেলিভার্ড অর্ডার' },
    { 'বিষয় / সূচক': 'মোট বিক্রয় রেভিনিউ', 'পরিমাণ': `৳${totalDeliveredRevenue.toLocaleString()}`, 'বিবরণ': 'সফলভাবে ক্যাশ প্রাপ্তি' },
    { 'বিষয় / সূচক': 'পণ্যের ক্রয়মূল্য (COGS)', 'পরিমাণ': `-৳${totalDeliveredBuyingCost.toLocaleString()}`, 'বিবরণ': `প্রতি পিস ৳${costPerPcs} ক্রয়মূল্য` },
    { 'বিষয় / সূচক': 'প্যাকেজিং সামগ্রী ব্যয়', 'পরিমাণ': `-৳${totalPackagingCost.toLocaleString()}`, 'বিবরণ': `প্রতি বক্স ৳${packCost} (শুধু অনলাইন)` },
    { 'বিষয় / সূচক': 'কুরিয়ার ডেলিভারি খরচ', 'পরিমাণ': `-৳${totalCourierCost.toLocaleString()}`, 'বিবরণ': 'কুরিয়ার চার্জ প্রদান' },
    { 'বিষয় / সূচক': 'রিটার্ন পার্সেল ক্ষতি', 'পরিমাণ': `-৳${totalReturnLosses.toLocaleString()}`, 'বিবরণ': `${returnedOnline.length} টি অনলাইন রিটার্ন কুরিয়ার ক্ষতি` },
    { 'বিষয় / সূচক': 'গ্রস মোট লাভ (Gross Profit)', 'পরিমাণ': `৳${grossProfit.toLocaleString()}`, 'বিবরণ': 'অর্ডার থেকে মোট অর্জিত লাভ' },
    { 'বিষয় / সূচক': 'দোকান ও ব্যবসা খরচ (Expenses)', 'পরিমাণ': `-৳${totalExpenses.toLocaleString()}`, 'বিবরণ': 'ফেসবুক অ্যাড, অফিস ও অন্যান্য ব্যয়' },
    { 'বিষয় / সূচক': 'প্রকৃত নিট লাভ (Net Profit)', 'পরিমাণ': `৳${netBottomlineProfit.toLocaleString()}`, 'বিবরণ': 'সব খরচ বাদ দিয়ে চূড়ান্ত ব্যবসায়িক লাভ' },
    { 'বিষয় / সূচক': 'গ্রাহকদের কাছে বর্তমান মোট বকেয়া', 'পরিমাণ': `৳${totalDueReceivable.toLocaleString()}`, 'বিবরণ': `${dueOrders.length} টি অর্ডারে বকেয়া পাওনা রয়েছে` },
    { 'বিষয় / সূচক': 'মজুদ বর্তমান স্টক', 'পরিমাণ': `${totalAvailableStock} পিস`, 'বিবরণ': 'সকল সাইজ ও কালার মিলিয়ে' }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'লাভ_ক্ষতি_সারসংক্ষেপ');

  // Trigger file download
  XLSX.writeFile(wb, `ONROUN_BD_Master_Backup_${dateStr}.xlsx`);
  return true;
}
