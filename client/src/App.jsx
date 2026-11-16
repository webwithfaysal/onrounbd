import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CountdownTimer from './components/CountdownTimer';
import Hero from './components/Hero';
import ProductGallery from './components/ProductGallery';
import Features from './components/Features';
import SizeChart from './components/SizeChart';
import CustomerReviews from './components/CustomerReviews';
import OrderForm from './components/OrderForm';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import FloatingCTA from './components/FloatingCTA';
import OrderSuccessModal from './components/OrderSuccessModal';
import OrderTrackModal from './components/OrderTrackModal';
import WhatsAppButton from './components/WhatsAppButton';
import AdminDashboard from './admin/AdminDashboard';
import AdminLoginModal from './admin/AdminLoginModal';
import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';
import { getProductConfig, getSettingsConfig, subscribeProductConfig, subscribeSettingsConfig } from './services/firebaseDb';
import { initFacebookPixel, initTikTokPixel, trackViewContent, trackInitiateCheckout, trackPurchase } from './services/trackingService';

const DEFAULT_PRODUCT = {
  name: "প্রিমিয়াম আল্ট্রা-সফট ব্রিদেবল সিমলেস বক্সার ব্রিফ",
  subTitle: "১০০% মাইক্রোমোডাল পিওর কম্বড কটন | অ্যান্টি-ব্যাকটেরিয়াল ও নো-সুইট টেকনোলজি",
  singlePrice: 650,
  regularSinglePrice: 850,
  twoPcsPrice: 1200,
  regularTwoPcsPrice: 1300,
  threePcsPrice: 1500,
  regularThreePcsPrice: 1950,
  comboPrice: 2000,
  regularComboPrice: 2600,
  comboQuantity: 4,
  deliveryInsideDhaka: 70,
  deliveryOutsideDhaka: 130,
  comboFreeDelivery: true,
  colors: [
    { id: "navy", name: "ক্লাসিক নেভি ব্লু (Navy Blue)", image: "/images/underwear-navy.jpg", code: "#2B3A4A" },
    { id: "mint", name: "সতেজ মিন্ট গ্রিন (Mint Green)", image: "/images/underwear-mint.jpg", code: "#8FB7A5" },
    { id: "grey", name: "চারকোল গ্রে (Charcoal Grey)", image: "/images/underwear-grey.jpg", code: "#68727A" },
    { id: "lightgrey", name: "লাইট অ্যাশ গ্রে (Light Ash Grey)", image: "/images/underwear-lightgrey.jpg", code: "#9E9C99" }
  ],
  sizes: [
    { id: "M", label: "M (কোমর: 29-31 ইঞ্চি)", waist: "29-31", stock: 60, colorStock: { navy: 15, mint: 15, grey: 15, lightgrey: 15 } },
    { id: "L", label: "L (কোমর: 32-34 ইঞ্চি)", waist: "32-34", stock: 80, colorStock: { navy: 20, mint: 20, grey: 20, lightgrey: 20 } },
    { id: "XL", label: "XL (কোমর: 35-37 ইঞ্চি)", waist: "35-37", stock: 40, colorStock: { navy: 10, mint: 10, grey: 10, lightgrey: 10 } },
    { id: "XXL", label: "XXL (কোমর: 38-40 ইঞ্চি)", waist: "38-40", stock: 20, colorStock: { navy: 5, mint: 5, grey: 5, lightgrey: 5 } }
  ]
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mb-4 text-3xl font-black">
            !
          </div>
          <h2 className="text-xl font-bold mb-2">কোনো সমস্যা হয়েছে</h2>
          <p className="text-sm text-slate-400 mb-6 max-w-md">
            স্ক্রিন লোড হতে সাময়িক সমস্যা হয়েছে। নিচের বাটনে ক্লিক করে আবার চেষ্টা করুন।
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow"
          >
            পেজ পুনরায় লোড করুন
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [product, setProduct] = useState(DEFAULT_PRODUCT);
  const [loading, setLoading] = useState(false);

  // Routing state based on secret URL /admin2121
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Customer selections
  const [selectedPackage, setSelectedPackage] = useState('combo');
  const [selectedColor, setSelectedColor] = useState('navy');
  const [selectedSize, setSelectedSize] = useState('L');
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [showTrackOrder, setShowTrackOrder] = useState(false);
  const [settings, setSettings] = useState(null);

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Load shop & pixel settings
  const fetchSettings = async () => {
    try {
      let activeSettings = null;

      // 1. Try Firebase Firestore
      try {
        const fbSettings = await getSettingsConfig();
        if (fbSettings) {
          activeSettings = fbSettings;
          setSettings(fbSettings);
        }
      } catch (e) {}

      // 2. Try localStorage
      if (!activeSettings) {
        const localSettings = localStorage.getItem('onroun_settings');
        if (localSettings) {
          try {
            const parsed = JSON.parse(localSettings);
            if (parsed) {
              activeSettings = parsed;
              setSettings(parsed);
            }
          } catch (e) {}
        }
      }

      // 3. Try server or fallback json
      if (!activeSettings) {
        let res = await fetch('/api/settings');
        let ct = res.headers.get('content-type');
        if (!res.ok || !ct || !ct.includes('application/json')) {
          res = await fetch('/data/settings.json');
          ct = res.headers.get('content-type');
        }
        if (res.ok && ct && ct.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.settings) {
            activeSettings = data.settings;
            setSettings(data.settings);
          }
        }
      }

      // Initialize Facebook & TikTok Pixels if configured
      if (activeSettings?.facebookPixelId) {
        initFacebookPixel(activeSettings.facebookPixelId);
      }
      if (activeSettings?.tikTokPixelId) {
        initTikTokPixel(activeSettings.tikTokPixelId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Listen to browser navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check stored admin token on load
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAdminLoggedIn(true);
    }
  }, []);

  // Load product settings from Firebase Firestore, backend or static fallback
  const fetchProduct = async () => {
    try {
      let activeProduct = null;

      // 1. Try Firebase Firestore
      try {
        const fbProduct = await getProductConfig();
        if (fbProduct && fbProduct.sizes) {
          activeProduct = fbProduct;
          setProduct(fbProduct);
        }
      } catch (e) {}

      // 2. Check if localStorage has updated product stock
      if (!activeProduct) {
        const localStock = localStorage.getItem('onroun_product_stock');
        if (localStock) {
          try {
            const parsed = JSON.parse(localStock);
            if (parsed && parsed.sizes) {
              activeProduct = parsed;
              setProduct(parsed);
            }
          } catch (e) {}
        }
      }

      // 3. Try server or fallback json
      if (!activeProduct) {
        let res = await fetch('/api/product');
        let ct = res.headers.get('content-type');
        if (!res.ok || !ct || !ct.includes('application/json')) {
          res = await fetch('/data/product.json');
          ct = res.headers.get('content-type');
        }
        if (res.ok && ct && ct.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.product) {
            activeProduct = data.product;
            setProduct(data.product);
          }
        }
      }

      if (activeProduct && activeProduct.sizes?.length > 0) {
        const lSize = activeProduct.sizes.find(s => s.id === 'L' && s.stock > 0);
        if (lSize) {
          setSelectedSize('L');
        } else {
          const anyInStock = activeProduct.sizes.find(s => s.stock > 0);
          if (anyInStock) setSelectedSize(anyInStock.id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchSettings();

    // Live realtime listeners: updates landing page immediately when Admin saves anything
    const unsubProduct = subscribeProductConfig((liveProduct) => {
      if (liveProduct && liveProduct.sizes) {
        setProduct(liveProduct);
      }
    });

    const unsubSettings = subscribeSettingsConfig((liveSettings) => {
      if (liveSettings) {
        setSettings(liveSettings);
        if (liveSettings.adminPath) {
          localStorage.setItem('admin_path', liveSettings.adminPath);
        }
      }
    });

    return () => {
      unsubProduct();
      unsubSettings();
    };
  }, []);

  // Reactively initialize Facebook & TikTok Pixels whenever settings change or arrive from Firestore
  useEffect(() => {
    if (settings?.facebookPixelId) {
      initFacebookPixel(settings.facebookPixelId);
    }
    if (settings?.tikTokPixelId) {
      initTikTokPixel(settings.tikTokPixelId);
    }
  }, [settings?.facebookPixelId, settings?.tikTokPixelId]);

  // Track ViewContent event when product details are available
  useEffect(() => {
    if (product) {
      trackViewContent(product);
    }
  }, [product?.name, product?.comboPrice]);

  const scrollToOrder = () => {
    const el = document.getElementById('order-form-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    // Track InitiateCheckout on Facebook & TikTok Pixels
    const val = selectedPackage === 'combo' ? (product?.comboPrice || 2000) : (product?.singlePrice || 650);
    trackInitiateCheckout(selectedPackage, val);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
  };

  const handleBackToLanding = () => {
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
    fetchProduct();
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAdminLoggedIn(false);
    window.history.pushState({}, '', '/');
    setCurrentPath('/');
  };

  // Dynamic secret admin URL routing (configurable via Admin Settings)
  const configuredAdminPath = (settings?.adminPath || localStorage.getItem('admin_path') || 'admin2121')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();

  const cleanCurrentPath = currentPath.replace(/^\/+|\/+$/g, '').toLowerCase();

  // If a subpath was visited (e.g. /myadmin) on a fresh device and settings haven't arrived yet from Firestore,
  // show a quick loading state so the landing page doesn't flash before AdminLoginModal renders.
  if (cleanCurrentPath !== '' && !settings && !localStorage.getItem('admin_path')) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  // Check if current URL matches the configured secret admin path
  const isAdminRoute = cleanCurrentPath === configuredAdminPath ||
                       cleanCurrentPath.startsWith(configuredAdminPath + '/') ||
                       (configuredAdminPath === 'admin2121' && cleanCurrentPath.startsWith('admin2121'));

  if (isAdminRoute) {
    if (isAdminLoggedIn) {
      return (
        <ErrorBoundary>
          <AdminDashboard
            product={product}
            onUpdateProduct={(p) => setProduct(p)}
            onBackToLanding={handleBackToLanding}
            onLogout={handleAdminLogout}
          />
        </ErrorBoundary>
      );
    } else {
      return (
        <ErrorBoundary>
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <AdminLoginModal
              onLoginSuccess={handleAdminLoginSuccess}
              onClose={handleBackToLanding}
            />
          </div>
        </ErrorBoundary>
      );
    }
  }

  // PUBLIC FRONT LANDING PAGE (No Admin button visible!)
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* 1. Top Minimal Announcement & Urgency Countdown */}
      <CountdownTimer product={product} />

      {/* 2. Clean Sticky Navbar */}
      <Header
        product={product}
        settings={settings}
        onScrollToOrder={scrollToOrder}
        onOpenTrackOrder={() => setShowTrackOrder(true)}
      />

      {/* Main Landing Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          product={product}
          onScrollToOrder={scrollToOrder}
          onSelectPackage={setSelectedPackage}
        />

        {/* 4 Colors Showcase Gallery */}
        <ProductGallery
          product={product}
          onSelectProductColor={(colorId) => {
            if (colorId === 'all') {
              setSelectedPackage('combo');
            } else {
              setSelectedPackage('single');
              setSelectedColor(colorId);
            }
          }}
          onScrollToOrder={scrollToOrder}
        />

        {/* Product Features */}
        <Features />

        {/* Size Chart Guide */}
        <SizeChart
          sizes={product?.sizes}
          selectedSize={selectedSize}
          onSelectSize={setSelectedSize}
          onScrollToOrder={scrollToOrder}
        />

        {/* Real Customer Reviews */}
        <CustomerReviews />

        {/* Cash On Delivery Order Checkout Form */}
        <OrderForm
          product={product}
          selectedPackage={selectedPackage}
          setSelectedPackage={setSelectedPackage}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          onOrderSuccess={(order) => {
            setSubmittedOrder(order);
            fetchProduct();
            // Fire Meta (Facebook) & TikTok Purchase / CompletePayment events
            trackPurchase(order);

            // Fire Google Analytics / Firebase event
            if (analytics) {
              try {
                logEvent(analytics, 'purchase', {
                  transaction_id: order.id,
                  value: order.totalPrice,
                  currency: 'BDT',
                  coupon: order.packageType,
                  items: (order.orderItems || []).map(itm => ({
                    item_name: itm.name,
                    item_variant: itm.size,
                    quantity: itm.qty
                  }))
                });
              } catch (e) {
                // ignore
              }
            }
          }}
        />

        {/* Frequently Asked Questions */}
        <FAQ product={product} />
      </main>

      {/* Footer */}
      <Footer settings={settings} onOpenTrackOrder={() => setShowTrackOrder(true)} />

      {/* Mobile Floating Sticky CTA */}
      <FloatingCTA
        product={product}
        settings={settings}
        onScrollToOrder={scrollToOrder}
      />

      {/* Floating WhatsApp Live Chat */}
      <WhatsAppButton phone={settings?.whatsapp || settings?.hotline || "01711223344"} />

      {/* Order Confirmed Modal with Confetti */}
      {submittedOrder && (
        <OrderSuccessModal
          order={submittedOrder}
          onClose={() => setSubmittedOrder(null)}
        />
      )}

      {/* Order Tracking Modal for Customers */}
      {showTrackOrder && (
        <OrderTrackModal
          onClose={() => setShowTrackOrder(false)}
        />
      )}
    </div>
  );
}
