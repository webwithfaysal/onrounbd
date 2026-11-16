import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { syncGoogleSheets } from './backupService';

const ORDERS_COL = 'orders';
const CONFIG_COL = 'config';
const EXPENSES_COL = 'expenses';

/**
 * Remove any undefined fields to prevent Firestore serialization crashes
 */
export function cleanFirestoreData(obj) {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)).filter(item => item !== undefined);
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Generate a unique order ID
 * Format: ORD-XXXXYYYY (timestamp slice + 4 random digits)
 */
export function generateOrderId() {
  const ts = Date.now().toString().slice(-4);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${ts}${rand}`;
}

/**
 * Save or create an order in Cloud Firestore & localStorage
 */
export async function saveOrder(orderData, shouldDeductStock = true) {
  if (!orderData || !orderData.id) return null;

  const cleanedOrder = cleanFirestoreData({
    ...orderData,
    updatedAt: new Date().toISOString()
  });

  // 1. Immediately store in localStorage as local cache
  try {
    const localOrders = JSON.parse(localStorage.getItem('onroun_orders') || '[]');
    const existsIdx = localOrders.findIndex(o => o.id === orderData.id);
    if (existsIdx >= 0) {
      localOrders[existsIdx] = cleanedOrder;
    } else {
      localOrders.unshift(cleanedOrder);
    }
    localStorage.setItem('onroun_orders', JSON.stringify(localOrders));
  } catch (e) {
    console.error('Local backup failed', e);
  }

  // 2. Save to Cloud Firestore using setDoc with merge: true (never crashes if doc doesn't exist)
  try {
    const orderRef = doc(db, ORDERS_COL, orderData.id);
    await setDoc(orderRef, cleanedOrder, { merge: true });

    // Deduct stock in Firestore config if requested
    if (shouldDeductStock) {
      try {
        const prodRef = doc(db, CONFIG_COL, 'product');
        const prodSnap = await getDoc(prodRef);
        if (prodSnap.exists()) {
          const prod = prodSnap.data();
          const targetSize = (orderData.selectedSize || '').toLowerCase();
          const pColors = orderData.selectedColors || [orderData.selectedColor || 'navy'];
          const qty = parseInt(orderData.quantity, 10) || 1;

          const updatedSizes = (prod.sizes || []).map(s => {
            if (s.id.toLowerCase() === targetSize) {
              const nextColorStock = { ...(s.colorStock || {}) };
              for (const cid of pColors) {
                const currentStock = parseInt(nextColorStock[cid], 10) || 0;
                nextColorStock[cid] = Math.max(0, currentStock - qty);
              }
              const nextTotal = Object.values(nextColorStock).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
              return { ...s, colorStock: nextColorStock, stock: nextTotal };
            }
            return s;
          });

          const updatedProduct = cleanFirestoreData({
            ...prod,
            sizes: updatedSizes,
            updatedAt: new Date().toISOString()
          });

          await setDoc(prodRef, updatedProduct, { merge: true });
          localStorage.setItem('onroun_product_stock', JSON.stringify(updatedProduct));
        }
      } catch (stockErr) {
        console.warn('Firestore stock deduction skipped:', stockErr.message);
      }
    }

    // Trigger real-time Google Sheets sync
    try {
      syncGoogleSheets('new_order', cleanedOrder);
    } catch (e) {}

    return cleanedOrder;
  } catch (err) {
    console.error('Firestore saveOrder error:', err);
    // Still trigger Google Sheets sync if local saved
    try {
      syncGoogleSheets('new_order', cleanedOrder);
    } catch (e) {}
    return cleanedOrder;
  }
}

/**
 * Extract items list with color IDs, size, and quantity from an order
 */
export function getOrderItemsDetails(orderData) {
  if (!orderData) return [];
  const targetSize = (orderData.selectedSize || 'L').toUpperCase();
  const packQty = Math.max(1, parseInt(orderData.quantity, 10) || 1);

  // If orderItems is present with explicit colors
  if (Array.isArray(orderData.orderItems) && orderData.orderItems.length > 0) {
    return orderData.orderItems.map(itm => {
      let cid = itm.cid || itm.id;
      if (!cid) {
        const n = (itm.name || '').toLowerCase();
        cid = n.includes('নেভি') || n.includes('navy') ? 'navy' :
              n.includes('মিন্ট') || n.includes('mint') ? 'mint' :
              n.includes('চারকোল') || n.includes('charcoal') || n.includes('grey') || n.includes('ধূসর') ? 'grey' :
              n.includes('লাইট') || n.includes('light') || n.includes('অ্যাশ') ? 'lightgrey' : 'navy';
      }
      return {
        colorId: cid,
        size: (itm.size || targetSize).toUpperCase(),
        qty: Math.max(1, parseInt(itm.qty, 10) || 1)
      };
    });
  }

  // Fallback to selectedColors or packageType
  let colors = [];
  if (orderData.packageType === 'combo') {
    colors = ['navy', 'mint', 'grey', 'lightgrey'];
  } else if (Array.isArray(orderData.selectedColors) && orderData.selectedColors.length > 0) {
    colors = orderData.selectedColors;
  } else if (orderData.selectedColor && orderData.selectedColor !== 'all') {
    colors = [orderData.selectedColor];
  } else {
    colors = ['navy', 'mint', 'grey', 'lightgrey'];
  }

  return colors.map(cid => ({
    colorId: cid,
    size: targetSize,
    qty: packQty
  }));
}

/**
 * Adjust stock for an order: 'restore' (+qty) or 'deduct' (-qty)
 * Updates both Firestore config/product and localStorage onroun_product_stock
 */
export async function adjustStockForOrder(orderData, action = 'restore') {
  if (!orderData) return null;

  try {
    const prodRef = doc(db, CONFIG_COL, 'product');
    const prodSnap = await getDoc(prodRef);
    if (!prodSnap.exists()) return null;

    const prod = prodSnap.data();
    const items = getOrderItemsDetails(orderData);
    if (items.length === 0) return null;

    // Clone sizes and apply adjustments
    const updatedSizes = (prod.sizes || []).map(s => {
      const sId = (s.id || '').toUpperCase();
      const matchingItems = items.filter(it => it.size === sId);
      if (matchingItems.length === 0) return s;

      const nextColorStock = { ...(s.colorStock || {}) };
      for (const itm of matchingItems) {
        const cid = itm.colorId;
        const currentQty = parseInt(nextColorStock[cid], 10) || 0;
        if (action === 'restore') {
          nextColorStock[cid] = currentQty + itm.qty;
        } else {
          nextColorStock[cid] = Math.max(0, currentQty - itm.qty);
        }
      }

      const nextTotal = Object.values(nextColorStock).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
      return {
        ...s,
        colorStock: nextColorStock,
        stock: nextTotal
      };
    });

    const updatedProduct = cleanFirestoreData({
      ...prod,
      sizes: updatedSizes,
      updatedAt: new Date().toISOString()
    });

    await setDoc(prodRef, updatedProduct, { merge: true });
    localStorage.setItem('onroun_product_stock', JSON.stringify(updatedProduct));
    return updatedProduct;
  } catch (err) {
    console.error(`adjustStockForOrder error (${action}):`, err);
    return null;
  }
}

/**
 * Update an existing order (customer details, size, price, etc.)
 */
export async function updateOrder(orderData, prevOrder = null) {
  if (!orderData || !orderData.id) return false;

  const timestamp = new Date().toISOString();
  let updatedProduct = null;

  // Check if status or size/qty changed to reconcile stock
  if (prevOrder) {
    const prevStatus = prevOrder.status || 'pending';
    const newStatus = orderData.status || prevStatus;

    const wasActive = (prevStatus !== 'cancelled' && prevStatus !== 'returned');
    const isNowInactive = (newStatus === 'cancelled' || newStatus === 'returned');
    const wasInactive = (prevStatus === 'cancelled' || prevStatus === 'returned');
    const isNowActive = (newStatus !== 'cancelled' && newStatus !== 'returned');

    if (wasActive && isNowInactive) {
      // Order cancelled or returned -> restore stock
      updatedProduct = await adjustStockForOrder(prevOrder, 'restore');
    } else if (wasInactive && isNowActive) {
      // Order reactivated -> deduct stock
      updatedProduct = await adjustStockForOrder(orderData, 'deduct');
    } else if (wasActive && isNowActive) {
      // Check if size, quantity, or package changed while active
      if (
        prevOrder.selectedSize !== orderData.selectedSize ||
        prevOrder.quantity !== orderData.quantity ||
        prevOrder.packageType !== orderData.packageType
      ) {
        await adjustStockForOrder(prevOrder, 'restore');
        updatedProduct = await adjustStockForOrder(orderData, 'deduct');
      }
    }
  }

  const cleanedOrder = cleanFirestoreData({
    ...orderData,
    updatedAt: timestamp
  });

  // 1. Update localStorage
  try {
    const localOrders = JSON.parse(localStorage.getItem('onroun_orders') || '[]');
    const updated = localOrders.map(o => o.id === orderData.id ? cleanedOrder : o);
    localStorage.setItem('onroun_orders', JSON.stringify(updated));
  } catch (e) {}

  // 2. Update Firestore with merge: true
  try {
    const orderRef = doc(db, ORDERS_COL, orderData.id);
    await setDoc(orderRef, cleanedOrder, { merge: true });

    // Trigger real-time Google Sheets sync
    try {
      syncGoogleSheets('update_order', cleanedOrder);
    } catch (e) {}

    return { success: true, updatedProduct };
  } catch (e) {
    console.error('Firestore updateOrder error:', e);
    // Trigger real-time Google Sheets sync
    try {
      syncGoogleSheets('update_order', cleanedOrder);
    } catch (err) {}
    return false;
  }
}

/**
 * Realtime subscription to all orders in Firestore
 */
export function subscribeOrders(onUpdate) {
  try {
    const unsubscribe = onSnapshot(collection(db, ORDERS_COL), (snapshot) => {
      const orders = [];
      snapshot.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sort newest first
      orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      localStorage.setItem('onroun_orders', JSON.stringify(orders));
      onUpdate(orders);
    }, (error) => {
      console.warn('Firestore orders subscription error:', error.message);
      const local = JSON.parse(localStorage.getItem('onroun_orders') || '[]');
      onUpdate(local);
    });

    return unsubscribe;
  } catch (e) {
    console.error('Firestore subscribeOrders failed:', e);
    const local = JSON.parse(localStorage.getItem('onroun_orders') || '[]');
    onUpdate(local);
    return () => {};
  }
}

/**
 * Fetch all orders once from Firestore
 */
export async function getOrders() {
  try {
    const snap = await getDocs(collection(db, ORDERS_COL));
    const orders = [];
    snap.forEach(d => orders.push({ id: d.id, ...d.data() }));

    orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    localStorage.setItem('onroun_orders', JSON.stringify(orders));
    return orders;
  } catch (e) {
    console.warn('Firestore getOrders fallback to localStorage:', e.message);
    const local = localStorage.getItem('onroun_orders');
    return local ? JSON.parse(local) : [];
  }
}

/**
 * Update Order Status in Firestore & localStorage
 * If status changes to 'cancelled' or 'returned', automatically RESTORES stock back to product.
 * If reactivated, automatically DEDUCTS stock.
 */
export async function updateOrderStatus(orderId, newStatus, orderObj = null) {
  const timestamp = new Date().toISOString();

  // Find order if not passed
  let targetOrder = orderObj;
  let localOrders = [];
  try {
    localOrders = JSON.parse(localStorage.getItem('onroun_orders') || '[]');
    if (!targetOrder) {
      targetOrder = localOrders.find(o => o.id === orderId);
    }
  } catch (e) {}

  if (!targetOrder) {
    try {
      const snap = await getDoc(doc(db, ORDERS_COL, orderId));
      if (snap.exists()) targetOrder = { id: snap.id, ...snap.data() };
    } catch (e) {}
  }

  const prevStatus = targetOrder?.status || 'pending';
  const isNowInactive = (newStatus === 'cancelled' || newStatus === 'returned');
  const wasActive = (prevStatus !== 'cancelled' && prevStatus !== 'returned');

  const isNowActive = (newStatus === 'pending' || newStatus === 'confirmed' || newStatus === 'shipping' || newStatus === 'delivered');
  const wasInactive = (prevStatus === 'cancelled' || prevStatus === 'returned');

  let updatedProduct = null;

  // Case 1: Order was active, now cancelled or returned -> RESTORE STOCK (+qty)!
  if (wasActive && isNowInactive && targetOrder) {
    updatedProduct = await adjustStockForOrder(targetOrder, 'restore');
  }
  // Case 2: Order was cancelled or returned, now reactivated -> DEDUCT STOCK (-qty)!
  else if (wasInactive && isNowActive && targetOrder) {
    updatedProduct = await adjustStockForOrder(targetOrder, 'deduct');
  }

  // 1. Update localStorage
  try {
    const updated = localOrders.map(o => o.id === orderId ? {
      ...o,
      status: newStatus,
      stockRestored: isNowInactive,
      updatedAt: timestamp
    } : o);
    localStorage.setItem('onroun_orders', JSON.stringify(updated));
  } catch (e) {}

  // 2. Update Firestore
  try {
    const orderRef = doc(db, ORDERS_COL, orderId);
    await setDoc(orderRef, {
      status: newStatus,
      stockRestored: isNowInactive,
      updatedAt: timestamp
    }, { merge: true });
  } catch (e) {
    console.error('Firestore updateOrderStatus error:', e);
  }

  // Trigger real-time Google Sheets sync
  try {
    const syncTarget = targetOrder ? { ...targetOrder, status: newStatus, updatedAt: timestamp } : { id: orderId, status: newStatus };
    syncGoogleSheets('update_order', syncTarget);
  } catch (e) {}

  return { success: true, updatedProduct };
}

/**
 * Delete Order from Firestore & localStorage
 * If deleted order was active, automatically RESTORES the reserved stock back to product.
 */
export async function deleteOrder(orderId, orderObj = null) {
  let targetOrder = orderObj;
  let localOrders = [];
  try {
    localOrders = JSON.parse(localStorage.getItem('onroun_orders') || '[]');
    if (!targetOrder) targetOrder = localOrders.find(o => o.id === orderId);
  } catch (e) {}

  // If order was active, restore stock when deleted
  if (targetOrder && targetOrder.status !== 'cancelled' && targetOrder.status !== 'returned') {
    try {
      await adjustStockForOrder(targetOrder, 'restore');
    } catch (e) {}
  }

  // 1. Delete from localStorage
  try {
    const updated = localOrders.filter(o => o.id !== orderId);
    localStorage.setItem('onroun_orders', JSON.stringify(updated));
  } catch (e) {}

  // 2. Delete from Firestore
  try {
    await deleteDoc(doc(db, ORDERS_COL, orderId));
    return true;
  } catch (e) {
    console.error('Firestore deleteOrder error:', e);
    return false;
  }
}

/**
 * Save Product & Stock to Firestore & localStorage
 */
export async function saveProductConfig(productData) {
  if (!productData) return false;

  const cleaned = cleanFirestoreData({
    ...productData,
    updatedAt: new Date().toISOString()
  });

  // 1. Local storage update
  try {
    localStorage.setItem('onroun_product_stock', JSON.stringify(cleaned));
  } catch (e) {}

  // 2. Firestore cloud update
  try {
    await setDoc(doc(db, CONFIG_COL, 'product'), cleaned, { merge: true });

    // Trigger real-time Google Sheets stock sync
    try {
      syncGoogleSheets('stock_update', cleaned);
    } catch (err) {}

    return true;
  } catch (e) {
    console.error('Firestore saveProductConfig error:', e);
    return false;
  }
}

/**
 * Fetch Product from Firestore or localStorage
 */
export async function getProductConfig() {
  try {
    const snap = await getDoc(doc(db, CONFIG_COL, 'product'));
    if (snap.exists()) {
      const data = snap.data();
      localStorage.setItem('onroun_product_stock', JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.warn('Firestore getProductConfig fallback:', e.message);
  }

  const local = localStorage.getItem('onroun_product_stock');
  if (local) {
    try { return JSON.parse(local); } catch (e) {}
  }
  return null;
}

/**
 * Realtime subscription to Product & Stock configuration
 */
export function subscribeProductConfig(onUpdate) {
  try {
    const unsub = onSnapshot(doc(db, CONFIG_COL, 'product'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        localStorage.setItem('onroun_product_stock', JSON.stringify(data));
        onUpdate(data);
      }
    }, (err) => {
      console.warn('Firestore product subscription error:', err.message);
    });
    return unsub;
  } catch (e) {
    console.error('Firestore subscribeProductConfig failed:', e);
    return () => {};
  }
}

/**
 * Save Settings (Pixel, Hotline, PIN) to Firestore & localStorage
 */
export async function saveSettingsConfig(settingsData) {
  if (!settingsData) return false;

  const cleaned = cleanFirestoreData({
    ...settingsData,
    updatedAt: new Date().toISOString()
  });

  try {
    localStorage.setItem('onroun_settings', JSON.stringify(cleaned));
  } catch (e) {}

  try {
    await setDoc(doc(db, CONFIG_COL, 'settings'), cleaned, { merge: true });
    return true;
  } catch (e) {
    console.error('Firestore saveSettingsConfig error:', e);
    return false;
  }
}

/**
 * Fetch Settings from Firestore or localStorage
 */
export async function getSettingsConfig() {
  try {
    const snap = await getDoc(doc(db, CONFIG_COL, 'settings'));
    if (snap.exists()) {
      const data = snap.data();
      localStorage.setItem('onroun_settings', JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.warn('Firestore getSettingsConfig fallback:', e.message);
  }

  const local = localStorage.getItem('onroun_settings');
  if (local) {
    try { return JSON.parse(local); } catch (e) {}
  }
  return null;
}

/**
 * Realtime subscription to Settings configuration (Hotline, Pixel, PIN)
 */
export function subscribeSettingsConfig(onUpdate) {
  try {
    const unsub = onSnapshot(doc(db, CONFIG_COL, 'settings'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        localStorage.setItem('onroun_settings', JSON.stringify(data));
        onUpdate(data);
      }
    }, (err) => {
      console.warn('Firestore settings subscription error:', err.message);
    });
    return unsub;
  } catch (e) {
    console.error('Firestore subscribeSettingsConfig failed:', e);
    return () => {};
  }
}

/**
 * ================================================================
 * EXPENSES MANAGEMENT (ব্যয় / খরচ ট্র্যাকিং)
 * ================================================================
 */

/**
 * Generate a unique expense ID (e.g. EXP-1001)
 */
export function generateExpenseId() {
  const ts = Date.now().toString().slice(-4);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `EXP-${ts}${rand}`;
}

/**
 * Save or update an Expense in Cloud Firestore & localStorage
 */
export async function saveExpense(expenseData) {
  if (!expenseData) return null;
  const expId = expenseData.id || generateExpenseId();
  const cleaned = cleanFirestoreData({
    ...expenseData,
    id: expId,
    amount: Math.max(0, Number(expenseData.amount) || 0),
    date: expenseData.date || new Date().toISOString().slice(0, 10),
    category: expenseData.category || 'অন্যান্য খরচ',
    title: (expenseData.title || '').trim(),
    paymentMethod: expenseData.paymentMethod || 'cash',
    addedBy: expenseData.addedBy || 'এডমিন',
    notes: (expenseData.notes || '').trim(),
    createdAt: expenseData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // 1. Immediately save to localStorage
  try {
    const local = JSON.parse(localStorage.getItem('onroun_expenses') || '[]');
    const idx = local.findIndex(e => e.id === expId);
    if (idx >= 0) {
      local[idx] = cleaned;
    } else {
      local.unshift(cleaned);
    }
    localStorage.setItem('onroun_expenses', JSON.stringify(local));
  } catch (e) {
    console.warn('Local expense save warning:', e);
  }

  // 2. Save to Firestore
  try {
    await setDoc(doc(db, EXPENSES_COL, expId), cleaned, { merge: true });
  } catch (err) {
    console.error('Firestore saveExpense error:', err);
  }

  // 3. Realtime Google Sheets Sync
  try {
    syncGoogleSheets('new_expense', cleaned);
  } catch (e) {}

  return cleaned;
}

/**
 * Fetch all expenses from Firestore with localStorage fallback
 */
export async function getExpenses() {
  try {
    const snap = await getDocs(collection(db, EXPENSES_COL));
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
    localStorage.setItem('onroun_expenses', JSON.stringify(list));
    return list;
  } catch (e) {
    console.warn('Firestore getExpenses fallback to localStorage:', e.message);
    const local = localStorage.getItem('onroun_expenses');
    return local ? JSON.parse(local) : [];
  }
}

/**
 * Delete an expense from Firestore & localStorage
 */
export async function deleteExpense(expenseId) {
  if (!expenseId) return false;

  // Local storage
  try {
    const local = JSON.parse(localStorage.getItem('onroun_expenses') || '[]');
    const filtered = local.filter(e => e.id !== expenseId);
    localStorage.setItem('onroun_expenses', JSON.stringify(filtered));
  } catch (e) {}

  // Firestore
  try {
    await deleteDoc(doc(db, EXPENSES_COL, expenseId));
  } catch (e) {
    console.error('Firestore deleteExpense error:', e);
  }

  // Google Sheets sync
  try {
    syncGoogleSheets('delete_expense', { id: expenseId });
  } catch (e) {}

  return true;
}

/**
 * Realtime subscription to expenses
 */
export function subscribeExpenses(onUpdate) {
  try {
    const unsub = onSnapshot(collection(db, EXPENSES_COL), (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
      localStorage.setItem('onroun_expenses', JSON.stringify(list));
      onUpdate(list);
    }, (err) => {
      console.warn('Firestore expenses subscription warning:', err.message);
      const local = JSON.parse(localStorage.getItem('onroun_expenses') || '[]');
      onUpdate(local);
    });
    return unsub;
  } catch (e) {
    console.error('Firestore subscribeExpenses error:', e);
    const local = JSON.parse(localStorage.getItem('onroun_expenses') || '[]');
    onUpdate(local);
    return () => {};
  }
}

