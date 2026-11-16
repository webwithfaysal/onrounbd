import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Sliders,
  Save,
  Check,
  Key,
  Share2,
  Download,
  AlertCircle,
  Link2,
  Copy,
  ExternalLink,
  Globe,
  Sparkles,
  FileSpreadsheet,
  Database,
  RefreshCw,
  Play
} from 'lucide-react';
import { saveSettingsConfig, getSettingsConfig } from '../services/firebaseDb';
import { exportMasterBackupExcel, batchSyncToGoogleSheets, GOOGLE_APPS_SCRIPT_CODE } from '../services/backupService';

export default function AdminSettings({ orders = [], expenses = [], product = {} }) {
  const [settings, setSettings] = useState({
    facebookPixelId: '',
    tikTokPixelId: '',
    hotline: '01711-223344',
    whatsapp: '01711223344',
    adminPath: 'admin2121',
    googleSheetsWebhookUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Google Sheets states
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [batchSyncing, setBatchSyncing] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptDrawer, setShowScriptDrawer] = useState(false);

  // Change PIN states
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [changingPin, setChangingPin] = useState(false);

  // Change Secret Admin URL states
  const [currentActivePath, setCurrentActivePath] = useState(
    (localStorage.getItem('admin_path') || 'admin2121').replace(/^\/+|\/+$/g, '')
  );
  const [newAdminPath, setNewAdminPath] = useState('');
  const [urlCurrentPin, setUrlCurrentPin] = useState('');
  const [urlError, setUrlError] = useState('');
  const [urlSuccess, setUrlSuccess] = useState('');
  const [changingUrl, setChangingUrl] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    async function load() {
      // 1. Try Firebase Firestore
      try {
        const fbSettings = await getSettingsConfig();
        if (fbSettings) {
          setSettings(fbSettings);
          if (fbSettings.adminPath) {
            const clean = fbSettings.adminPath.replace(/^\/+|\/+$/g, '');
            setCurrentActivePath(clean);
            localStorage.setItem('admin_path', clean);
          }
          return;
        }
      } catch (e) { }

      // 2. Try localStorage
      const local = localStorage.getItem('onroun_settings');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (parsed) {
            setSettings(parsed);
            if (parsed.adminPath) {
              const clean = parsed.adminPath.replace(/^\/+|\/+$/g, '');
              setCurrentActivePath(clean);
              localStorage.setItem('admin_path', clean);
            }
            return;
          }
        } catch (e) { }
      }

      // 3. Fallback server/static json
      fetch('/api/settings')
        .then(r => {
          const ct = r.headers.get('content-type');
          if (r.ok && ct && ct.includes('application/json')) return r.json();
          return fetch('/data/settings.json').then(r2 => r2.json());
        })
        .then(d => {
          if (d && d.success && d.settings) setSettings(d.settings);
        })
        .catch(console.error);
    }
    load();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Immediately save to localStorage
      localStorage.setItem('onroun_settings', JSON.stringify(settings));

      // 2. Save to Cloud Firestore
      try {
        await saveSettingsConfig(settings);
      } catch (fbErr) {
        console.error('Firebase saveSettingsConfig error:', fbErr);
      }

      // 3. Try server save
      try {
        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });
        const ct = res.headers.get('content-type');
        if (res.ok && ct && ct.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.settings) {
            localStorage.setItem('onroun_settings', JSON.stringify(data.settings));
          }
        }
      } catch (netErr) { }

      showToast('সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (e) {
      console.error(e);
      showToast('সংরক্ষণ সম্পন্ন');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (newPin !== confirmPin) {
      setPinError('নতুন পিন এবং নিশ্চিতকরণ পিন মেলেনি!');
      return;
    }

    if (newPin.length < 4) {
      setPinError('পিন কমপক্ষে ৪ সংখ্যার হতে হবে।');
      return;
    }

    setChangingPin(true);
    try {
      const storedPin = localStorage.getItem('admin_pin') || '123456';
      if (currentPin !== storedPin) {
        setPinError('বর্তমান পিনটি সঠিক নয়!');
        setChangingPin(false);
        return;
      }

      localStorage.setItem('admin_pin', newPin);

      // Save to Cloud Firestore so it syncs across all devices
      try {
        const curSettings = await getSettingsConfig() || {};
        await saveSettingsConfig({ ...curSettings, adminPin: newPin });
      } catch (fbErr) {
        console.warn('Firestore PIN sync failed:', fbErr);
      }

      try {
        await fetch('/api/admin/change-pin', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPin, newPin })
        });
      } catch (e) { }

      setPinSuccess('অ্যাডমিন পিন সফলভাবে পরিবর্তন হয়েছে!');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (e) {
      console.error(e);
      setPinError('পিন পরিবর্তন ব্যর্থ হয়েছে।');
    } finally {
      setChangingPin(false);
    }
  };

  const handleCopyAdminUrl = () => {
    const fullUrl = `${window.location.origin}/${currentActivePath}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }).catch(() => {
      showToast('লিংক কপি করা হয়েছে');
    });
  };

  const handleChangeAdminPath = async (e) => {
    e.preventDefault();
    setUrlError('');
    setUrlSuccess('');

    const cleanSlug = newAdminPath.trim().toLowerCase().replace(/^\/+|\/+$/g, '');

    if (!cleanSlug) {
      setUrlError('অনুগ্রহ করে নতুন অ্যাডমিন ইউআরএল স্লাগ লিখুন।');
      return;
    }

    if (cleanSlug.length < 3) {
      setUrlError('অ্যাডমিন ইউআরএল কমপক্ষে ৩ অক্ষরের হতে হবে।');
      return;
    }

    if (!/^[a-z0-9_-]+$/.test(cleanSlug)) {
      setUrlError('ইউআরএলে শুধুমাত্র ইংরেজি ছোট হাতের অক্ষর (a-z), সংখ্যা (0-9), হাইফেন (-) ও আন্ডারস্কোর (_) ব্যবহার করা যাবে।');
      return;
    }

    const forbiddenSlugs = ['api', 'data', 'images', 'assets', 'favicon', 'index', 'home', 'order'];
    if (forbiddenSlugs.includes(cleanSlug)) {
      setUrlError(`'${cleanSlug}' সিস্টেম সংরক্ষিত নাম, এটি ইউআরএল হিসেবে ব্যবহার করা যাবে না।`);
      return;
    }

    // Verify current PIN before allowing URL change
    const storedPin = localStorage.getItem('admin_pin') || '123456';
    let livePin = storedPin;
    try {
      const curSettings = await getSettingsConfig();
      if (curSettings?.adminPin) {
        livePin = curSettings.adminPin;
      }
    } catch (e) {}

    if (urlCurrentPin.trim() !== livePin.trim()) {
      setUrlError('বর্তমান পিনটি সঠিক নয়! সঠিক পিন প্রদান করে পুনরায় চেষ্টা করুন।');
      return;
    }

    setChangingUrl(true);
    try {
      // 1. Save to Cloud Firestore
      const curSettings = await getSettingsConfig() || {};
      const updatedSettings = {
        ...curSettings,
        adminPath: cleanSlug
      };
      await saveSettingsConfig(updatedSettings);

      // 2. Save to localStorage
      localStorage.setItem('admin_path', cleanSlug);
      localStorage.setItem('onroun_settings', JSON.stringify(updatedSettings));

      // 3. Update component state
      setCurrentActivePath(cleanSlug);
      setSettings(prev => ({ ...prev, adminPath: cleanSlug }));
      setNewAdminPath('');
      setUrlCurrentPin('');

      // 4. Update browser address bar seamlessly without full reload
      window.history.replaceState({}, '', '/' + cleanSlug);
      window.dispatchEvent(new Event('popstate'));

      setUrlSuccess(`অ্যাডমিন লিংক সফলভাবে পরিবর্তন হয়েছে! নতুন লিংক: ${window.location.origin}/${cleanSlug}`);
      showToast('অ্যাডমিন ইউআরএল সফলভাবে পরিবর্তন হয়েছে!');
    } catch (err) {
      console.error(err);
      setUrlError('ইউআরএল পরিবর্তন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setChangingUrl(false);
    }
  };

  // Steadfast Courier CSV Export Format:
  // Invoice, Consignee Name, Consignee Phone, Consignee Address, Cod Amount, Note
  const handleExportSteadfast = () => {
    const pendingOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'delivered');
    if (pendingOrders.length === 0) {
      alert('এক্সপোর্ট করার মতো কোনো ডেলিভারি অর্ডার নেই');
      return;
    }

    const headers = ['Invoice', 'Consignee Name', 'Consignee Phone', 'Consignee Address', 'Cod Amount', 'Note'];
    const rows = pendingOrders.map(o => [
      o.id,
      `"${o.customerName}"`,
      o.phone,
      `"${o.address.replace(/"/g, '""')}"`,
      o.totalPrice,
      `"${(o.packageType === 'combo' ? '4 Pcs Combo Box' : '1 Pc Trial') + (o.notes ? ' - ' + o.notes : '')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `steadfast_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pathao Courier Bulk CSV Format:
  // Merchant Order ID, Recipient Name, Recipient Phone, Recipient Address, Recipient City, Recipient Zone, Amount to Collect
  const handleExportPathao = () => {
    const pendingOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'delivered');
    if (pendingOrders.length === 0) {
      alert('এক্সপোর্ট করার মতো কোনো ডেলিভারি অর্ডার নেই');
      return;
    }

    const headers = ['Merchant Order ID', 'Recipient Name', 'Recipient Phone', 'Recipient Address', 'Amount to Collect'];
    const rows = pendingOrders.map(o => [
      o.id,
      `"${o.customerName}"`,
      o.phone,
      `"${o.address.replace(/"/g, '""')}"`,
      o.totalPrice
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pathao_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Part 1: Facebook Pixel & TikTok Pixel Integration */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
          <Share2 className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-black text-slate-900">
              বিজ্ঞাপন ট্র্যাকিং (Facebook & TikTok Pixel)
            </h3>
            <p className="text-xs text-slate-500">
              ফেসবুক ও টিকটক বিজ্ঞাপনের কনভার্সন ট্র্যাক করতে আপনার পিক্সেল আইডি দিন।
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  Facebook Pixel ID:
                </label>
                {settings.facebookPixelId?.trim() ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> সক্রিয় (Active)
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    খালি (Not Set)
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="যেমন: 123456789012345"
                value={settings.facebookPixelId}
                onChange={(e) => setSettings({ ...settings, facebookPixelId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono text-slate-900 focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                আইডি দিলে স্বয়ংক্রিয়ভাবে PageView, ViewContent, InitiateCheckout ও Purchase ট্র্যাক হবে।
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  TikTok Pixel ID:
                </label>
                {settings.tikTokPixelId?.trim() ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> সক্রিয় (Active)
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    খালি (Not Set)
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="যেমন: C1234567890ABC"
                value={settings.tikTokPixelId}
                onChange={(e) => setSettings({ ...settings, tikTokPixelId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono text-slate-900 focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                আইডি দিলে স্বয়ংক্রিয়ভাবে PageView, ViewContent, InitiateCheckout ও CompletePayment ট্র্যাক হবে।
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                হটলাইন মোবাইল নম্বর:
              </label>
              <input
                type="text"
                placeholder="01711-223344"
                value={settings.hotline}
                onChange={(e) => setSettings({ ...settings, hotline: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                WhatsApp সাপোর্ট নম্বর:
              </label>
              <input
                type="text"
                placeholder="01711223344"
                value={settings.whatsapp}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900"
              />
            </div>
          </div>

          {/* Pixel Setup & Testing Guide */}
          <div className="mt-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-950 space-y-2.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-900 text-sm">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>পিক্সেল আইডি যোগ ও কনভার্সন ট্র্যাকিং নির্দেশিকা:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white/80 p-3 rounded-xl border border-blue-200/60">
                <strong className="text-blue-900 block mb-1">📘 ফেসবুক পিক্সেল আইডি যেভাবে পাবেন:</strong>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  ১. <strong>Meta Events Manager</strong>-এ প্রবেশ করুন।<br/>
                  ২. Data Sources থেকে আপনার Pixel / Dataset নির্বাচন করুন।<br/>
                  ৩. Settings-এ থাকা ১৫-১৬ ডিজিটের <strong>Pixel ID / Dataset ID</strong> কপি করে ওপরের ঘরে পেস্ট করুন।
                </p>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-blue-200/60">
                <strong className="text-blue-900 block mb-1">🎵 টিকটক পিক্সেল আইডি যেভাবে পাবেন:</strong>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  ১. <strong>TikTok Ads Manager</strong>-এ যান।<br/>
                  ২. Assets &rarr; Events &rarr; Web Events নির্বাচন করুন।<br/>
                  ৩. আপনার পিক্সেলের <strong>Pixel ID</strong> (সাধারণত 'C' দিয়ে শুরু) কপি করে ওপরের ঘরে পেস্ট করুন।
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-blue-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-blue-900 font-medium">
              <span>
                ⚡ <strong>অটোমেটিক ট্র্যাকিং:</strong> পেজ ভিজিট (<code>PageView</code>), প্রোডাক্ট ভিউ (<code>ViewContent</code>), অর্ডার শুরু (<code>InitiateCheckout</code>) এবং অর্ডার সম্পন্ন (<code>Purchase / CompletePayment</code>)।
              </span>
              <span className="text-slate-600 shrink-0">
                🔎 টেস্ট করতে Chrome-এ <strong>"Meta Pixel Helper"</strong> ও <strong>"TikTok Pixel Helper"</strong> এক্সটেনশন ব্যবহার করুন।
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow transition disabled:opacity-50"
            >
              {loading ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>

      {/* Part 2: Realtime Google Sheets Sync & Master Excel Backup */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  গুগল শিট ও এক্সেল লাইভ অটো-ব্যাকআপ (Google Sheets & Excel Sync)
                </h3>
                {settings.googleSheetsWebhookUrl && settings.googleSheetsWebhookUrl.startsWith('http') ? (
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>লাইভ কানেক্টেড</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                    ⚪ নট কানেক্টেড
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                নতুন অর্ডার, কাস্টমার তথ্য, সাইজ-কালার স্টক, বকেয়া আদায় বা খরচ আপডেট হলেই রিয়েল-টাইমে গুগল শিটে এন্ট্রি হবে।
              </p>
            </div>
          </div>

          <button
            onClick={() => exportMasterBackupExcel({ orders, expenses, product })}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            title="৫টি শিট সম্বলিত সম্পূর্ণ মাস্টার এক্সেল ফাইল ডাউনলোড করুন"
          >
            <Download className="w-4 h-4" />
            <span>📥 সম্পূর্ণ মাস্টার এক্সেল (.XLSX)</span>
          </button>
        </div>

        <div className="space-y-5">
          
          {/* Webhook URL Input */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Google Apps Script Webhook URL:
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={settings.googleSheetsWebhookUrl || ''}
                onChange={(e) => setSettings({ ...settings, googleSheetsWebhookUrl: e.target.value.trim() })}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-50 shrink-0"
              >
                URL সেভ করুন
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!settings.googleSheetsWebhookUrl || !settings.googleSheetsWebhookUrl.startsWith('http')) {
                    alert('আগে Webhook URL ইনপুট বক্সে বসিয়ে সেভ করুন।');
                    return;
                  }
                  setTestingWebhook(true);
                  setTestResult(null);
                  try {
                    await fetch(settings.googleSheetsWebhookUrl, {
                      method: 'POST',
                      mode: 'no-cors',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        event: 'test_connection',
                        payload: { message: 'Onroun Webhook Connected Successfully!', time: new Date().toISOString() },
                        timestamp: new Date().toISOString()
                      })
                    });
                    setTestResult({ success: true, message: '✓ টেস্ট সফল! গুগল শিটে টেস্ট পিং পাঠানো হয়েছে।' });
                  } catch (e) {
                    setTestResult({ success: false, message: 'টেস্ট ব্যর্থ হয়েছে। URL যাচাই করুন।' });
                  } finally {
                    setTestingWebhook(false);
                  }
                }}
                disabled={testingWebhook}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3.5 py-2.5 rounded-xl transition disabled:opacity-50 shrink-0"
              >
                {testingWebhook ? 'টেস্টিং...' : '⚡ টেস্ট কানেকশন'}
              </button>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              একবার এই Webhook URL দিয়ে সেভ করলে, ওয়েবসাইট বা অ্যাডমিন থেকে প্রতিটি নতুন অর্ডার ও খরচের রেকর্ড স্বয়ংক্রিয়ভাবে আপনার গুগল শিটে জমা হবে।
            </span>
          </div>

          {/* Test connection message */}
          {testResult && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Batch Sync Action */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                আগের সব ডাটা গুগল শিটে পাঠানো (One-Click Batch Sync)
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                আপনার বর্তমান <strong>{orders.length}টি অর্ডার</strong>, <strong>{expenses.length}টি খরচ</strong> ও <strong>স্টকের পূর্ণ তথ্য</strong> এখনই গুগল শিটে পাঠাতে এই বাটনে ক্লিক করুন।
              </p>
            </div>
            <button
              type="button"
              disabled={batchSyncing || !settings.googleSheetsWebhookUrl}
              onClick={async () => {
                if (!settings.googleSheetsWebhookUrl || !settings.googleSheetsWebhookUrl.startsWith('http')) {
                  alert('প্রথমে Google Sheets Webhook URL সেভ করুন।');
                  return;
                }
                setBatchSyncing(true);
                setBatchResult(null);
                try {
                  const res = await batchSyncToGoogleSheets({
                    orders: orders || [],
                    expenses: expenses || [],
                    product: product || {}
                  });
                  if (res.success) {
                    setBatchResult({ success: true, message: `সফল! ${orders.length}টি অর্ডার, ${expenses.length}টি খরচ ও বর্তমান স্টক আপনার গুগল শিটে সিঙ্ক হয়েছে।` });
                  } else {
                    setBatchResult({ success: false, message: res.error || 'সিঙ্ক করতে সমস্যা হয়েছে।' });
                  }
                } catch (err) {
                  setBatchResult({ success: false, message: err.message });
                } finally {
                  setBatchSyncing(false);
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${batchSyncing ? 'animate-spin' : ''}`} />
              <span>{batchSyncing ? 'সিঙ্ক হচ্ছে...' : '🚀 সব ডাটা শিটে সিঙ্ক করুন'}</span>
            </button>
          </div>

          {batchResult && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              batchResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{batchResult.message}</span>
            </div>
          )}

          {/* Setup Guide Accordion */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowScriptDrawer(!showScriptDrawer)}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 transition flex items-center justify-between text-left text-xs font-bold text-slate-800 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>গুগল শিট কানেক্ট করার সহজ ৪-ধাপের নির্দেশিকা ও রেডিমেড কোড</span>
              </div>
              <span className="text-emerald-700 font-extrabold text-[11px] underline">
                {showScriptDrawer ? 'লুকান ▲' : 'কোড ও নির্দেশিকা দেখুন ▼'}
              </span>
            </button>

            {showScriptDrawer && (
              <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-4 text-xs">
                
                <div className="space-y-2 text-slate-700 leading-relaxed">
                  <p><strong>১ মিনিটেই গুগল শিট কানেক্ট করুন:</strong></p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-[11px]">
                    <li>আপনার Google Drive থেকে একটি নতুন <strong>Google Sheet</strong> ফাইল খুলুন (নাম দিন যেমন: <code>Onroun Business Sheet</code>)।</li>
                    <li>শিটের ওপরের মেনু থেকে <strong>Extensions &gt; Apps Script</strong>-এ ক্লিক করুন।</li>
                    <li>সেখানে আগে থেকে থাকা কোড মুছে দিয়ে নিচের <strong>"কোড কপি করুন"</strong> বাটনে ক্লিক করে পুরো কোডটি পেস্ট করুন।</li>
                    <li>ওপরের ডানপাশের <strong>Deploy &gt; New deployment</strong> বাটনে ক্লিক করুন।</li>
                    <li>Select type (গিয়ার আইকন) থেকে <strong>Web app</strong> নির্বাচন করুন, Description দিন <code>Onroun Sync</code>, এবং <strong>"Who has access"</strong>-এ অবশ্যই <strong>"Anyone"</strong> নির্বাচন করে <strong>Deploy</strong> চাপুন।</li>
                    <li>এরপর তৈরি হওয়া <strong>Web app URL</strong> টি কপি করে ওপরের ঘরে পেস্ট করে <strong>"URL সেভ করুন"</strong> চাপুন। ব্যাস!</li>
                  </ol>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-600">গুগল অ্যাপস স্ক্রিপ্ট কোড (Ready Apps Script Code):</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
                        setCopiedScript(true);
                        setTimeout(() => setCopiedScript(false), 2500);
                      }}
                      className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition active:scale-95 cursor-pointer"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? 'কপি সম্পন্ন!' : '📋 পুরো কোড কপি করুন'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[10px] max-h-56 overflow-y-auto leading-relaxed border border-slate-800">
                    {GOOGLE_APPS_SCRIPT_CODE}
                  </pre>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>

      {/* Part 3: Courier Bulk Export Presets */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
          <Download className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-lg font-black text-slate-900">
              কুরিয়ার বাল্ক আপলোড এক্সপোর্ট (Courier Presets)
            </h3>
            <p className="text-xs text-slate-500">
              কুরিয়ার পোর্টালে সরাসরি ফাইল আপলোড করার জন্য বিশেষ ফরম্যাটে ডেটা ডাউনলোড করুন।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900 text-sm block">Steadfast Courier CSV</span>
              <p className="text-xs text-slate-500 mt-1">
                স্টিডফাস্ট পোর্টালে বাল্ক পার্সেল বুকিংয়ের জন্য তৈরি প্রস্তুতকৃত ফাইল।
              </p>
            </div>
            <button
              onClick={handleExportSteadfast}
              className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" />
              <span>Steadfast ফরম্যাটে ডাউনলোড</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900 text-sm block">Pathao Courier CSV</span>
              <p className="text-xs text-slate-500 mt-1">
                পাঠাও মার্চেন্ট প্যানেলের জন্য স্ট্যান্ডার্ড বাল্ক আপলোড ফাইল।
              </p>
            </div>
            <button
              onClick={handleExportPathao}
              className="mt-4 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" />
              <span>Pathao ফরম্যাটে ডাউনলোড</span>
            </button>
          </div>
        </div>
      </div>

      {/* Part 3: Change Admin Security PIN */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
          <Key className="w-5 h-5 text-rose-600" />
          <div>
            <h3 className="text-lg font-black text-slate-900">
              অ্যাডমিন সিকিউরিটি পিন পরিবর্তন
            </h3>
            <p className="text-xs text-slate-500">
              প্যানেলে প্রবেশের বর্তমান পিন পরিবর্তন করে আপনার নিজস্ব গোপন পিন সেট করুন।
            </p>
          </div>
        </div>

        {pinError && (
          <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{pinError}</span>
          </div>
        )}

        {pinSuccess && (
          <div className="mb-4 bg-emerald-50 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2 border border-emerald-200">
            <Check className="w-4 h-4 shrink-0" />
            <span>{pinSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangePin} className="max-w-md space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              বর্তমান পিন (Current PIN):
            </label>
            <input
              type="password"
              required
              placeholder="বর্তমান পিন লিখুন"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              নতুন পিন (New PIN):
            </label>
            <input
              type="password"
              required
              placeholder="কমপক্ষে ৪ ডিজিটের নতুন পিন"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              নতুন পিন নিশ্চিত করুন (Confirm PIN):
            </label>
            <input
              type="password"
              required
              placeholder="নতুন পিন আবার লিখুন"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={changingPin}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition disabled:opacity-50"
          >
            {changingPin ? 'পরিবর্তন হচ্ছে...' : 'পিন পরিবর্তন করুন'}
          </button>
        </form>
      </div>

      {/* Part 4: Change Secret Admin URL */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
          <Link2 className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-lg font-black text-slate-900">
              অ্যাডমিন গোপন লিংক (Secret URL) পরিবর্তন
            </h3>
            <p className="text-xs text-slate-500">
              প্যানেলে প্রবেশের বর্তমান গোপন ইউআরএল (/admin2121) পরিবর্তন করে আপনার নিজস্ব পছন্দের লিংক নির্ধারণ করুন।
            </p>
          </div>
        </div>

        {/* Current Active URL Banner with Copy Button */}
        <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
              বর্তমান সক্রিয় অ্যাডমিন লিংক:
            </span>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
              <code className="text-xs sm:text-sm font-mono font-black text-indigo-950 break-all select-all">
                {window.location.origin}/{currentActivePath}
              </code>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyAdminUrl}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-indigo-100/70 text-indigo-900 text-xs font-bold rounded-xl border border-indigo-300 transition shadow-2xs cursor-pointer shrink-0"
          >
            {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-indigo-700" />}
            <span>{copiedUrl ? 'কপি হয়েছে!' : 'লিংক কপি করুন'}</span>
          </button>
        </div>

        {urlError && (
          <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{urlError}</span>
          </div>
        )}

        {urlSuccess && (
          <div className="mb-4 bg-emerald-50 text-emerald-700 text-xs p-3.5 rounded-xl border border-emerald-200 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{urlSuccess}</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              💡 নতুন লিংকটি বুকমার্ক বা কপি করে রাখুন। পরবর্তীতে এই লিংক দিয়েই অ্যাডমিন প্যানেলে প্রবেশ করতে হবে।
            </p>
          </div>
        )}

        <form onSubmit={handleChangeAdminPath} className="max-w-md space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              নতুন অ্যাডমিন ইউআরএল স্লাগ (New Admin Slug):
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 bg-white">
              <span className="bg-slate-100 px-3 py-2.5 text-xs text-slate-500 font-mono select-none border-r border-slate-300 shrink-0">
                /
              </span>
              <input
                type="text"
                required
                placeholder="যেমন: mysecret2026, bossadmin, mypanel"
                value={newAdminPath}
                onChange={(e) => {
                  setNewAdminPath(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                  if (urlError) setUrlError('');
                  if (urlSuccess) setUrlSuccess('');
                }}
                className="w-full px-3 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none"
              />
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              শুধুমাত্র ছোট হাতের ইংরেজি অক্ষর (a-z), সংখ্যা (0-9), হাইফেন (-) বা আন্ডারস্কোর (_) ব্যবহার করুন।
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              নিরাপত্তা নিশ্চিতকরণে বর্তমান পিন (Current PIN):
            </label>
            <input
              type="password"
              required
              placeholder="বর্তমান সিকিউরিটি পিন লিখুন"
              value={urlCurrentPin}
              onChange={(e) => {
                setUrlCurrentPin(e.target.value);
                if (urlError) setUrlError('');
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={changingUrl}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition disabled:opacity-50 shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            {changingUrl ? 'পরিবর্তন হচ্ছে...' : 'ইউআরএল পরিবর্তন ও সংরক্ষণ করুন'}
          </button>
        </form>
      </div>

    </div>
  );
}

