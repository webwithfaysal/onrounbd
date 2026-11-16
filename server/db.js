const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'store.json');

const defaultData = {
  product: {
    name: "প্রিমিয়াম আল্ট্রা-সফট ব্রিদেবল সিমলেস বক্সার ব্রিফ",
    subTitle: "১০০% মাইক্রোমোডাল পিওর কম্বড কটন | অ্যান্টি-ব্যাকটেরিয়াল ও নো-সুইট টেকনোলজি",
    singlePrice: 650,
    regularSinglePrice: 850,
    twoPcsPrice: 1200,
    regularTwoPcsPrice: 1700,
    threePcsPrice: 1600,
    regularThreePcsPrice: 2400,
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
      {
        id: "M",
        label: "M (কোমর: ২৯ - ৩১ ইঞ্চি)",
        waist: "29-31",
        stock: 60,
        colorStock: { navy: 15, mint: 15, grey: 15, lightgrey: 15 }
      },
      {
        id: "L",
        label: "L (কোমর: ৩২ - ৩৪ ইঞ্চি)",
        waist: "32-34",
        stock: 76,
        colorStock: { navy: 19, mint: 19, grey: 19, lightgrey: 19 }
      },
      {
        id: "XL",
        label: "XL (কোমর: ৩৫ - ৩৭ ইঞ্চি)",
        waist: "35-37",
        stock: 40,
        colorStock: { navy: 10, mint: 10, grey: 10, lightgrey: 10 }
      },
      {
        id: "XXL",
        label: "XXL (কোমর: ৩৮ - ৪০ ইঞ্চি)",
        waist: "38-40",
        stock: 20,
        colorStock: { navy: 5, mint: 5, grey: 5, lightgrey: 5 }
      }
    ]
  },
  orders: [
    {
      id: "ORD-1001",
      customerName: "তানভীর আহমেদ",
      phone: "01711223344",
      address: "বাড়ি-১২, রোড-০৫, সেক্টর-৩, উত্তরা, ঢাকা",
      deliveryZone: "inside",
      packageType: "combo",
      selectedColor: "all",
      selectedSize: "L",
      quantity: 1,
      itemPrice: 2000,
      deliveryCharge: 0,
      totalPrice: 2000,
      status: "delivered",
      notes: "বিকাল ৫টার পর ডেলিভারি দেবেন।",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: "ORD-1002",
      customerName: "রাকিবুল হাসান",
      phone: "01822334455",
      address: "জিইসি মোড়, নাসিরাবাদ, চট্টগ্রাম",
      deliveryZone: "outside",
      packageType: "single",
      selectedColor: "navy",
      selectedSize: "XL",
      quantity: 1,
      itemPrice: 650,
      deliveryCharge: 130,
      totalPrice: 780,
      status: "shipping",
      notes: "কল দিয়ে আসবেন।",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "ORD-1003",
      customerName: "মাহমুদুর রহমান",
      phone: "01933445566",
      address: "হাউজ-৪৫, রোড-৭, ধানমন্ডি, ঢাকা",
      deliveryZone: "inside",
      packageType: "combo",
      selectedColor: "all",
      selectedSize: "M",
      quantity: 1,
      itemPrice: 2000,
      deliveryCharge: 0,
      totalPrice: 2000,
      status: "pending",
      notes: "",
      createdAt: new Date().toISOString()
    }
  ],
  adminPin: "123456",
  settings: {
    facebookPixelId: "",
    tikTokPixelId: "",
    hotline: "01711-223344",
    whatsapp: "01711223344"
  }
};

function ensureDbExists() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

function getDb() {
  ensureDbExists();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading DB:", err);
    return defaultData;
  }
}

function saveDb(data) {
  ensureDbExists();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
  getDb,
  saveDb
};

