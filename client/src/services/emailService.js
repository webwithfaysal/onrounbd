import { jsPDF } from 'jspdf';

const TARGET_EMAIL = 'onrounbd@gmail.com';

/**
 * Draw a clean, high-resolution invoice on an HTML5 canvas
 * (Supports all native Bengali Unicode scripts, currency symbols, and styling)
 */
function drawInvoiceCanvas(order) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1700;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1200, 1700);

  // Top Dark Banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1200, 140);

  // Brand Logo
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.fillText('ONROUN', 50, 65);

  ctx.fillStyle = '#f43f5e';
  ctx.fillText('BD', 225, 65);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '15px system-ui, -apple-system, sans-serif';
  ctx.fillText('প্রিমিয়াম মেনস ইনারওয়্যার | ১০০% কম্বড কটন', 50, 100);

  // Invoice Title Right
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('চালান / INVOICE', 1150, 60);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(`#${order.id || 'ORD-1001'}`, 1150, 96);
  ctx.textAlign = 'left';

  // Helper for rounded rectangle
  const drawRoundRect = (x, y, w, h, r, fillColor, strokeColor) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  // Helper for word wrapping
  const wrapText = (text, x, y, maxWidth, lineHeight) => {
    const words = (text || '').split(/\s+/);
    let line = '';
    let yPos = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, yPos);
        line = words[n] + ' ';
        yPos += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, yPos);
    return yPos + lineHeight;
  };

  // Details Cards
  let curY = 180;

  // Left Card: Order Details
  drawRoundRect(50, curY, 520, 185, 16, '#f8fafc', '#e2e8f0');
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('অর্ডারের বিবরণ (Order Details)', 75, curY + 35);

  ctx.fillStyle = '#1e293b';
  ctx.font = '15px system-ui, -apple-system, sans-serif';
  const orderDateStr = order.createdAt 
    ? new Date(order.createdAt).toLocaleString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('bn-BD');
  ctx.fillText(`তারিখ: ${orderDateStr}`, 75, curY + 70);
  ctx.fillText('পেমেন্ট পদ্ধতি: ক্যাশ অন ডেলিভারি (COD)', 75, curY + 105);
  const zoneText = order.deliveryZone === 'outside' ? 'সিলেটের বাইরে (সারাদেশ)' : 'সিলেটের ভেতরে';
  ctx.fillText(`ডেলিভারি এলাকা: ${zoneText}`, 75, curY + 140);

  // Right Card: Customer Information
  drawRoundRect(630, curY, 520, 185, 16, '#f8fafc', '#e2e8f0');
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('গ্রাহকের বিবরণ (Customer Details)', 655, curY + 35);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText(order.customerName || 'গ্রাহকের নাম', 655, curY + 70);

  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`মোবাইল: ${order.phone || ''}`, 655, curY + 102);

  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#334155';
  const cleanAddr = (order.address || '').replace(/\n+/g, ', ');
  wrapText(`ঠিকানা: ${cleanAddr}`, 655, curY + 132, 470, 22);

  // Products Table
  curY = 405;

  // Table Header
  drawRoundRect(50, curY, 1100, 50, 12, '#0f172a', null);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('পণ্য ও প্যাকেজের বিবরণ', 75, curY + 32);
  ctx.textAlign = 'center';
  ctx.fillText('সাইজ', 700, curY + 32);
  ctx.fillText('পরিমাণ', 870, curY + 32);
  ctx.textAlign = 'right';
  ctx.fillText('মূল্য', 1125, curY + 32);
  ctx.textAlign = 'left';

  curY += 50;

  // Table Item Row
  const rowHeight = 190;
  drawRoundRect(50, curY, 1100, rowHeight, 12, '#ffffff', '#e2e8f0');

  const pkgName = order.packageType === 'combo'
    ? 'প্রিমিয়াম বক্সার ব্রিফ (৪ পিস মেগা কম্বো প্যাক)'
    : order.packageType === 'three_pcs'
    ? 'প্রিমিয়াম বক্সার ব্রিফ (৩ পিস ভ্যালু প্যাক)'
    : order.packageType === 'two_pcs'
    ? 'প্রিমিয়াম বক্সার ব্রিফ (২ পিস স্মার্ট প্যাক)'
    : 'প্রিমিয়াম বক্সার ব্রিফ (১ পিস ট্রায়াল প্যাক)';

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText(pkgName, 75, curY + 45);

  // Item details breakdown
  ctx.fillStyle = '#64748b';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  let itemY = curY + 75;

  if (order.orderItems && order.orderItems.length > 0) {
    order.orderItems.forEach(itm => {
      ctx.fillText(`• ${itm.name} — সাইজ ${itm.size} (×${itm.qty})`, 75, itemY);
      itemY += 24;
    });
  } else if (order.packageType === 'combo') {
    ctx.fillText(`• ১টি ক্লাসিক নেভি ব্লু, ১টি সতেজ মিন্ট গ্রিন, ১টি চারকোল গ্রে, ১টি লাইট অ্যাশ গ্রে`, 75, itemY);
    itemY += 24;
  } else {
    ctx.fillText(`• কালার: ${order.selectedColor || 'নেভি ব্লু'}`, 75, itemY);
    itemY += 24;
  }

  // Size Badge
  drawRoundRect(670, curY + 30, 60, 36, 8, '#f1f5f9', '#cbd5e1');
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(order.selectedSize || 'L', 700, curY + 54);

  // Quantity
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  const qtyText = order.packageType === 'combo'
    ? `${order.quantity || 1} বক্স (${(order.quantity || 1) * 4} পিস)`
    : `${order.quantity || 1} টি`;
  ctx.fillText(qtyText, 870, curY + 54);

  // Price
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(`৳${order.itemPrice || 0}`, 1125, curY + 54);
  ctx.textAlign = 'left';

  curY += rowHeight + 25;

  // Calculation Box
  const subtotal = order.itemPrice || 0;
  const delivery = order.deliveryCharge ?? (order.deliveryZone === 'outside' ? 130 : 70);
  const grandTotal = order.totalPrice || (subtotal + delivery);
  const due = order.dueAmount !== undefined ? order.dueAmount : ((order.notes || '').match(/\[বকেয়া:\s*৳?(\d+)\]/) ? parseInt((order.notes || '').match(/\[বকেয়া:\s*৳?(\d+)\]/)[1]) : 0);
  const paid = order.paidAmount !== undefined ? order.paidAmount : Math.max(0, grandTotal - due);

  const calcX = 630;
  const calcW = 520;
  const calcH = due > 0 ? 215 : 160;
  drawRoundRect(calcX, curY, calcW, calcH, 16, '#f8fafc', '#e2e8f0');

  // Subtotal line
  ctx.fillStyle = '#64748b';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText('সাবটোটাল:', calcX + 30, curY + 38);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(`৳${subtotal}`, calcX + calcW - 30, curY + 38);
  ctx.textAlign = 'left';

  // Delivery line
  ctx.fillStyle = '#64748b';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText('ডেলিভারি চার্জ:', calcX + 30, curY + 75);
  ctx.textAlign = 'right';
  ctx.fillStyle = delivery === 0 ? '#059669' : '#0f172a';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(delivery === 0 ? 'ফ্রি (৳০)' : `৳${delivery}`, calcX + calcW - 30, curY + 75);
  ctx.textAlign = 'left';

  // Divider line
  ctx.strokeStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(calcX + 30, curY + 98);
  ctx.lineTo(calcX + calcW - 30, curY + 98);
  ctx.stroke();

  // Grand total line
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
  ctx.fillText('মোট অর্ডারের মূল্য:', calcX + 30, curY + 130);
  ctx.textAlign = 'right';
  ctx.fillStyle = due > 0 ? '#0f172a' : '#e11d48';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(`৳${grandTotal}`, calcX + calcW - 30, curY + 130);
  ctx.textAlign = 'left';

  if (due > 0) {
    // Paid line
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('পরিশোধিত / অগ্রিম জমা:', calcX + 30, curY + 165);
    ctx.textAlign = 'right';
    ctx.fillText(`৳${paid}`, calcX + calcW - 30, curY + 165);
    ctx.textAlign = 'left';

    // Due line
    ctx.fillStyle = '#be123c';
    ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
    ctx.fillText('অবশিষ্ট বকেয়া (Due):', calcX + 30, curY + 198);
    ctx.textAlign = 'right';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(`৳${due}`, calcX + calcW - 30, curY + 198);
    ctx.textAlign = 'left';
  }

  // Customer Note on Left (if any)
  if (order.notes) {
    drawRoundRect(50, curY, 550, calcH, 16, '#fffbeb', '#fef3c7');
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText('গ্রাহকের বিশেষ নোট:', 75, curY + 35);

    ctx.fillStyle = '#78350f';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    wrapText(order.notes, 75, curY + 65, 500, 22);
  }

  // Security badges
  const badgeY = curY + calcH + 25;
  drawRoundRect(50, badgeY, 1100, 70, 12, '#f1f5f9', '#e2e8f0');
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText('✓ ১০০% অরিজিনাল কম্বড কটন', 90, badgeY + 42);
  ctx.fillText('✓ পার্সেল চেক করে পেমেন্ট', 470, badgeY + 42);
  ctx.fillText('✓ ৭ দিনের সহজ রিপ্লেসমেন্ট গ্যারান্টি', 820, badgeY + 42);

  // Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ধন্যবাদ অনরাউন বিডি থেকে কেনাকাটা করার জন্য। পার্সেল সংক্রান্ত যেকোনো প্রয়োজনে কল করুন: 01711-223344', 600, 1620);
  ctx.fillText('অনলাইন শপ: onroun-uw.web.app | ইমেইল: onrounbd@gmail.com', 600, 1650);

  return canvas;
}

/**
 * Generate a clean, high-quality PDF Invoice
 * @param {Object} order 
 * @returns {Blob} PDF blob
 */
export function generateInvoicePdf(order) {
  // 1. High-fidelity Canvas Render (preserves native Bengali typography & branding)
  if (typeof document !== 'undefined') {
    try {
      const canvas = drawInvoiceCanvas(order);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      return doc.output('blob');
    } catch (canvasErr) {
      console.warn('Canvas PDF generator fallback to standard text:', canvasErr);
    }
  }

  // 2. Safe Text Fallback
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header Brand
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('ONROUN BD', 15, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text("Premium Men's Innerwear | Cash On Delivery", 15, 21);

  // Invoice Title on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('INVOICE / RECEIPT', pageWidth - 15, 14, { align: 'right' });
  doc.setFontSize(10);
  doc.text(`#${order.id || 'ORD-1001'}`, pageWidth - 15, 21, { align: 'right' });

  y = 38;

  // Metadata Box
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Details', 15, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : new Date().toLocaleString();

  doc.text(`Date: ${orderDate}`, 15, y + 6);
  doc.text(`Payment: Cash On Delivery (COD)`, 15, y + 11);
  doc.text(`Delivery Zone: ${order.deliveryZone === 'outside' ? 'Outside Sylhet' : 'Inside Sylhet'}`, 15, y + 16);

  // Customer Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Customer Information', 110, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Name: ${order.customerName || 'N/A'}`, 110, y + 6);
  doc.text(`Phone: ${order.phone || 'N/A'}`, 110, y + 11);

  const addressLines = doc.splitTextToSize(`Address: ${order.address || 'N/A'}`, 85);
  doc.text(addressLines, 110, y + 16);

  y = y + 22 + (addressLines.length * 4);

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, y, pageWidth - 30, 8, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Item Description', 18, y + 5.5);
  doc.text('Size', 115, y + 5.5, { align: 'center' });
  doc.text('Color', 140, y + 5.5, { align: 'center' });
  doc.text('Qty', 165, y + 5.5, { align: 'center' });
  doc.text('Total', pageWidth - 18, y + 5.5, { align: 'right' });

  y += 8;

  const pkgName = order.packageType === 'combo'
    ? '4 Pcs Mega Combo Pack (Boxer Briefs)'
    : order.packageType === 'three_pcs'
    ? '3 Pcs Value Pack'
    : order.packageType === 'two_pcs'
    ? '2 Pcs Smart Pack'
    : '1 Pc Trial Pack';

  const itemColor = order.packageType === 'combo' ? 'All 4 Colors Set' : (order.selectedColor || 'Classic Navy');

  doc.rect(15, y, pageWidth - 30, 12, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(pkgName, 18, y + 7.5);
  doc.text(order.selectedSize || 'L', 115, y + 7.5, { align: 'center' });
  doc.text(itemColor, 140, y + 7.5, { align: 'center' });
  doc.text(String(order.quantity || 1), 165, y + 7.5, { align: 'center' });
  doc.text(`BDT ${order.itemPrice || 0}`, pageWidth - 18, y + 7.5, { align: 'right' });

  y += 18;

  const subtotal = order.itemPrice || 0;
  const delivery = order.deliveryCharge ?? 70;
  const total = order.totalPrice || (subtotal + delivery);

  const sumX = pageWidth - 80;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Subtotal:', sumX, y);
  doc.text(`BDT ${subtotal}`, pageWidth - 18, y, { align: 'right' });

  doc.text('Delivery Charge:', sumX, y + 6);
  doc.text(delivery === 0 ? 'FREE' : `BDT ${delivery}`, pageWidth - 18, y + 6, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(sumX, y + 9, pageWidth - 15, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(225, 29, 72);
  doc.text('Total Payable:', sumX, y + 16);
  doc.text(`BDT ${total}`, pageWidth - 18, y + 16, { align: 'right' });

  return doc.output('blob');
}

/**
 * Send order details and PDF invoice to onrounbd@gmail.com
 * @param {Object} order 
 */
export async function sendOrderEmailNotification(order) {
  if (!order) return;

  try {
    // 1. Generate PDF Invoice Blob
    const pdfBlob = generateInvoicePdf(order);
    const pdfFile = new File([pdfBlob], `Invoice-${order.id}.pdf`, { type: 'application/pdf' });

    // 2. Prepare FormData with invoice details and attachment
    const formData = new FormData();
    formData.append('_subject', `[নতুন অর্ডার] #${order.id} - ${order.customerName} (৳${order.totalPrice})`);
    formData.append('_template', 'table');
    formData.append('_captcha', 'false');
    formData.append('_replyto', TARGET_EMAIL);

    // Customer & Order Info
    formData.append('অর্ডার আইডি (Invoice #)', order.id);
    formData.append('তারিখ ও সময়', new Date(order.createdAt || Date.now()).toLocaleString('bn-BD'));
    formData.append('গ্রাহকের নাম', order.customerName);
    formData.append('মোবাইল নম্বর', order.phone);
    formData.append('ডেলিভারি ঠিকানা', order.address);
    formData.append('ডেলিভারি এলাকা', order.deliveryZone === 'outside' ? 'সিলেটের বাইরে' : 'সিলেটের ভেতরে');
    formData.append('প্যাকেজ', order.packageType === 'combo' ? '৪ পিস মেগা কম্বো' : order.packageType === 'three_pcs' ? '৩ পিস ভ্যালু প্যাক' : order.packageType === 'two_pcs' ? '২ পিস স্মার্ট প্যাক' : '১ পিস ট্রায়াল');
    formData.append('সাইজ', order.selectedSize);
    formData.append('কালার', order.selectedColor || 'সব কালার');
    formData.append('পরিমাণ', `${order.quantity || 1} টি`);
    formData.append('পণ্য মূল্য', `৳${order.itemPrice}`);
    formData.append('ডেলিভারি চার্জ', order.deliveryCharge === 0 ? 'ফ্রি' : `৳${order.deliveryCharge}`);
    formData.append('সর্বমোট প্রদেয় মূল্য (ক্যাশ অন ডেলিভারি)', `৳${order.totalPrice}`);
    if (order.notes) {
      formData.append('গ্রাহকের বিশেষ নোট', order.notes);
    }
    const currentAdminSlug = (localStorage.getItem('admin_path') || 'admin2121').replace(/^\/+|\/+$/g, '');
    formData.append('অনলাইন ইনভয়েস লিংক', `https://onroun-uw.web.app/${currentAdminSlug}`);

    // Attach the generated PDF
    formData.append('attachment', pdfFile, `Invoice-${order.id}.pdf`);

    // 3. Dispatch to FormSubmit.co
    const res = await fetch(`https://formsubmit.co/ajax/${TARGET_EMAIL}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      body: formData
    });

    const data = await res.json();
    console.log('Order email notification result:', data);
    return data;
  } catch (err) {
    console.warn('Order email notification error (non-fatal):', err);
    return null;
  }
}

