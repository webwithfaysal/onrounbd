import React, { useState, useRef } from 'react';
import { Eye, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductGallery({ product, onSelectProductColor, onScrollToOrder }) {
  const [selectedModalImage, setSelectedModalImage] = useState(null);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const carouselRef = useRef(null);

  const comboPrice = product?.comboPrice || 2000;
  const regularComboPrice = product?.regularComboPrice || 2600;
  const comboSavings = Math.max(0, regularComboPrice - comboPrice);
  const comboQty = product?.comboQuantity || 4;
  const freeDeliveryText = product?.comboFreeDelivery ? ' সাথে পাচ্ছেন ফ্রি হোম ডেলিভারি ও প্রিমিয়াম বক্স প্যাকেজিং।' : ' সাথে প্রিমিয়াম প্যাকেজিং।';

  const colors = product?.colors || [
    { id: "navy", name: "ক্লাসিক নেভি ব্লু (Navy Blue)", image: "/images/underwear-navy.jpg", code: "#2B3A4A" },
    { id: "mint", name: "সতেজ মিন্ট গ্রিন (Mint Green)", image: "/images/underwear-mint.jpg", code: "#8FB7A5" },
    { id: "grey", name: "চারকোল গ্রে (Charcoal Grey)", image: "/images/underwear-grey.jpg", code: "#68727A" },
    { id: "lightgrey", name: "লাইট অ্যাশ গ্রে (Light Ash Grey)", image: "/images/underwear-lightgrey.jpg", code: "#9E9C99" }
  ];

  // Handle scroll event to update active dot in mobile view
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.offsetWidth * 0.82;
    const newIndex = Math.round(scrollLeft / (itemWidth + 14));
    const clamped = Math.max(0, Math.min(colors.length - 1, newIndex));
    setActiveMobileIndex(clamped);
  };

  const scrollToIndex = (index) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const cards = container.children;
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
      setActiveMobileIndex(index);
    }
  };

  const handlePrev = () => {
    const nextIdx = Math.max(0, activeMobileIndex - 1);
    scrollToIndex(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = Math.min(colors.length - 1, activeMobileIndex + 1);
    scrollToIndex(nextIdx);
  };

  return (
    <section className="py-10 sm:py-14 md:py-20 bg-white border-b border-slate-100 overflow-hidden">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold mb-2.5 border border-slate-200/60">
            <span>কালার কালেকশন</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
            মার্জিত {colors.length}টি কালার ভ্যারিয়েন্ট
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            প্রতিটি কালার তৈরি করা হয়েছে আধুনিক রুচিশীল পুরুষের জন্য।
          </p>
        </div>

        {/* 1. MOBILE CAROUSEL VIEW (< md) */}
        <div className="md:hidden relative">
          
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar gap-3.5 pb-3 px-2 -mx-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {colors.map((item, idx) => (
              <div
                key={item.id}
                className="w-[82vw] max-w-[290px] shrink-0 snap-center bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between"
              >
                {/* Image Container */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F8F9FA] p-3 mb-2.5 flex items-center justify-center border border-slate-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Zoom button */}
                  <button
                    onClick={() => setSelectedModalImage(item)}
                    className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-slate-900/60 text-white flex items-center justify-center shadow-2xs cursor-pointer"
                    title="বড় করে দেখুন"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Color Dot & Index Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-white/95 px-2 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-300"
                      style={{ backgroundColor: item.code }}
                    />
                    <span className="text-[10px] font-semibold text-slate-700">কালার {idx + 1}/৪</span>
                  </div>
                </div>

                {/* Title & Info */}
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm text-center mb-0.5 truncate">
                  {item.name}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 text-center mb-2.5">
                  ১০০% মাইক্রোমোডাল কটন • ব্রিদেবল
                </p>

                {/* Price & Action */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block line-through">৳{product?.regularSinglePrice || 850}</span>
                    <span className="text-sm sm:text-base font-black text-slate-950">৳{product?.singlePrice || 650}</span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectProductColor(item.id);
                      onScrollToOrder();
                    }}
                    className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <span>সিলেক্ট করুন</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Navigation Controls (Arrows + Dots) */}
          <div className="flex items-center justify-between mt-2.5 px-2">
            <button
              onClick={handlePrev}
              disabled={activeMobileIndex === 0}
              className={`w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center transition shadow-2xs ${
                activeMobileIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800 active:scale-95'
              }`}
              title="পূর্ববর্তী"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {colors.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => scrollToIndex(idx)}
                  className={`transition-all duration-300 rounded-full flex items-center justify-center ${
                    activeMobileIndex === idx
                      ? 'w-5 h-1.5 bg-slate-950 shadow-2xs'
                      : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={c.name}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={activeMobileIndex === colors.length - 1}
              className={`w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center transition shadow-2xs ${
                activeMobileIndex === colors.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800 active:scale-95'
              }`}
              title="পরবর্তী"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
            সোয়াইপ করে সব কালার দেখুন
          </p>

        </div>

        {/* 2. DESKTOP GRID VIEW (>= md) */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {colors.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col group"
            >
              {/* Image Container */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F8F9FA] p-4 mb-4 flex items-center justify-center border border-slate-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Zoom button */}
                <button
                  onClick={() => setSelectedModalImage(item)}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-2xs cursor-pointer"
                  title="বড় করে দেখুন"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Color Dot */}
                <div
                  className="absolute top-3 left-3 w-3.5 h-3.5 rounded-full border-2 border-white shadow-2xs"
                  style={{ backgroundColor: item.code }}
                />
              </div>

              {/* Title & Info */}
              <h3 className="font-bold text-slate-900 text-sm text-center mb-1">
                {item.name}
              </h3>
              <p className="text-xs text-slate-500 text-center mb-4">
                আল্ট্রা-সফট ব্রিদেবল মাইক্রোমোডাল
              </p>

              {/* Price & Action */}
              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block line-through">৳{product?.regularSinglePrice || 850}</span>
                  <span className="text-base font-black text-slate-950">৳{product?.singlePrice || 650}</span>
                </div>

                <button
                  onClick={() => {
                    onSelectProductColor(item.id);
                    onScrollToOrder();
                  }}
                  className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
                >
                  <span>সিলেক্ট করুন</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Combo Spotlight Architectural Banner */}
        <div className="mt-8 sm:mt-12 bg-slate-950 rounded-3xl p-5 sm:p-8 md:p-10 text-white relative overflow-hidden border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full mb-2 sm:mb-3 border border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>কম্বো সেভিং অফার</span>
              </div>
              <h3 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight">
                {comboQty}টি প্রিমিয়াম কালারের মেগা বক্স প্যাক নিলে {comboSavings > 0 ? <span className="text-amber-300">৳{comboSavings} নিশ্চিত ছাড়!</span> : null}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 sm:mt-1.5 max-w-xl leading-relaxed">
                একসাথে {comboQty}টি কালার পান মাত্র ৳{comboPrice} টাকায় (পূর্বমূল্য ৳{regularComboPrice})।{freeDeliveryText}
              </p>
            </div>

            <button
              onClick={() => {
                onSelectProductColor('all');
                onScrollToOrder();
              }}
              className="w-full md:w-auto whitespace-nowrap bg-white hover:bg-slate-100 text-slate-950 font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-xs active:scale-95 shrink-0 flex items-center justify-center gap-2"
            >
              <span>মেগা কম্বো বুক করুন (৳{comboPrice})</span>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

      </div>

      {/* Fullscreen Image Preview Modal */}
      {selectedModalImage && (
        <div
          onClick={() => setSelectedModalImage(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-5 relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{selectedModalImage.name}</h4>
              <button
                onClick={() => setSelectedModalImage(null)}
                className="text-slate-400 hover:text-slate-800 text-lg font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="aspect-square bg-[#F8F9FA] rounded-2xl flex items-center justify-center overflow-hidden p-3 sm:p-4">
              <img
                src={selectedModalImage.image}
                alt={selectedModalImage.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] sm:text-xs text-slate-400 block line-through">৳{product?.regularSinglePrice || 850}</span>
                <span className="font-black text-base sm:text-lg text-slate-900">৳{product?.singlePrice || 650}</span>
              </div>
              <button
                onClick={() => {
                  onSelectProductColor(selectedModalImage.id);
                  setSelectedModalImage(null);
                  onScrollToOrder();
                }}
                className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
              >
                এই কালারটি অর্ডার করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
