// client/src/services/trackingService.js

let fbInitializedId = null;
let ttInitializedId = null;

/**
 * Initialize Meta (Facebook) Pixel dynamically
 */
export function initFacebookPixel(pixelId) {
  if (!pixelId || typeof window === 'undefined') return;
  const cleanId = String(pixelId).trim();
  if (!cleanId) return;

  if (fbInitializedId === cleanId && window.fbq) {
    return;
  }

  try {
    if (!window.fbq) {
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }

    window.fbq('init', cleanId);
    window.fbq('track', 'PageView');
    fbInitializedId = cleanId;
    console.log('[Pixel] Meta (Facebook) Pixel initialized:', cleanId);
  } catch (err) {
    console.warn('[Pixel] Meta Pixel init error:', err);
  }
}

/**
 * Initialize TikTok Pixel dynamically
 */
export function initTikTokPixel(pixelId) {
  if (!pixelId || typeof window === 'undefined') return;
  const cleanId = String(pixelId).trim();
  if (!cleanId) return;

  if (ttInitializedId === cleanId && window.ttq) {
    return;
  }

  try {
    if (!window.ttq) {
      (function (w, d, t) {
        w.TiktokAnalyticsObject = t;
        var ttq = (w[t] = w[t] || []);
        ttq.methods = [
          'page',
          'track',
          'identify',
          'instances',
          'debug',
          'on',
          'off',
          'once',
          'ready',
          'alias',
          'group',
          'enableCookie',
          'disableCookie',
          'holdConsent',
          'revokeConsent',
          'grantConsent'
        ];
        ttq.setAndDefer = function (t, e) {
          t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function (t) {
          for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
          return e;
        };
        ttq.load = function (e, n) {
          var r = 'https://analytics.tiktok.com/i18n/pixel/events.js',
            o = n && n.partner;
          ttq._i = ttq._i || {};
          ttq._i[e] = [];
          ttq._i[e]._u = r;
          ttq._t = ttq._t || {};
          ttq._t[e] = +new Date();
          ttq._o = ttq._o || {};
          ttq._o[e] = n || {};
          var a = document.createElement('script');
          a.type = 'text/javascript';
          a.async = !0;
          a.src = r + '?sdkid=' + e + '&lib=' + t;
          var c = document.getElementsByTagName('script')[0];
          c.parentNode.insertBefore(a, c);
        };
      })(window, document, 'ttq');
    }

    if (window.ttq && typeof window.ttq.load === 'function') {
      window.ttq.load(cleanId);
      window.ttq.page();
      ttInitializedId = cleanId;
      console.log('[Pixel] TikTok Pixel initialized:', cleanId);
    }
  } catch (err) {
    console.warn('[Pixel] TikTok Pixel init error:', err);
  }
}

/**
 * Track ViewContent event on product showcase
 */
export function trackViewContent(product) {
  if (typeof window === 'undefined') return;
  const price = product?.comboPrice || product?.singlePrice || 650;
  const name = product?.name || 'প্রিমিয়াম সিমলেস বক্সার ব্রিফ';

  // Meta Pixel ViewContent
  if (window.fbq) {
    try {
      window.fbq('track', 'ViewContent', {
        content_name: name,
        content_category: 'Men Underwear',
        content_type: 'product',
        value: price,
        currency: 'BDT'
      });
    } catch (e) {}
  }

  // TikTok Pixel ViewContent
  if (window.ttq && typeof window.ttq.track === 'function') {
    try {
      window.ttq.track('ViewContent', {
        content_id: 'boxer-brief-01',
        content_type: 'product',
        content_name: name,
        value: price,
        currency: 'BDT'
      });
    } catch (e) {}
  }
}

/**
 * Track InitiateCheckout event (when customer clicks order CTA / starts order)
 */
export function trackInitiateCheckout(pkg = 'combo', value = 2000) {
  if (typeof window === 'undefined') return;

  const pkgName =
    pkg === 'combo'
      ? '4 Pcs Mega Combo'
      : pkg === 'three_pcs'
      ? '3 Pcs Pack'
      : pkg === 'two_pcs'
      ? '2 Pcs Pack'
      : '1 Pc Trial';

  // Meta Pixel InitiateCheckout
  if (window.fbq) {
    try {
      window.fbq('track', 'InitiateCheckout', {
        content_name: pkgName,
        currency: 'BDT',
        value: value
      });
    } catch (e) {}
  }

  // TikTok Pixel InitiateCheckout
  if (window.ttq && typeof window.ttq.track === 'function') {
    try {
      window.ttq.track('InitiateCheckout', {
        content_name: pkgName,
        currency: 'BDT',
        value: value
      });
    } catch (e) {}
  }
}

/**
 * Track Purchase event on order success
 */
export function trackPurchase(order) {
  if (!order || typeof window === 'undefined') return;

  const value = Number(order.totalPrice) || 0;
  const pkgName =
    order.packageType === 'combo'
      ? '4 Pcs Mega Combo'
      : order.packageType === 'three_pcs'
      ? '3 Pcs Pack'
      : order.packageType === 'two_pcs'
      ? '2 Pcs Pack'
      : '1 Pc Trial';

  // Meta (Facebook) Purchase Event
  if (window.fbq) {
    try {
      window.fbq('track', 'Purchase', {
        value: value,
        currency: 'BDT',
        content_name: pkgName,
        content_type: 'product',
        content_ids: [String(order.id)],
        num_items: order.quantity || 1
      });
      console.log('[Pixel] Meta Purchase tracked successfully:', order.id, value);
    } catch (e) {
      console.warn('[Pixel] Meta Purchase track error:', e);
    }
  }

  // TikTok CompletePayment & PlaceAnOrder Event
  if (window.ttq && typeof window.ttq.track === 'function') {
    try {
      window.ttq.track('CompletePayment', {
        content_id: String(order.id),
        content_type: 'product',
        content_name: pkgName,
        quantity: order.quantity || 1,
        value: value,
        currency: 'BDT'
      });
      window.ttq.track('PlaceAnOrder', {
        content_id: String(order.id),
        content_type: 'product',
        content_name: pkgName,
        quantity: order.quantity || 1,
        value: value,
        currency: 'BDT'
      });
      console.log('[Pixel] TikTok CompletePayment tracked successfully:', order.id, value);
    } catch (e) {
      console.warn('[Pixel] TikTok CompletePayment track error:', e);
    }
  }
}

