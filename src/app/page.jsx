"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { getPnrStatus, parsePnrData } from '../lib/pnr';
import {
  Search, MapPin, Train, ShieldCheck, Clock, Award, Coffee,
  ChevronRight, Check, Star, ArrowRight, Zap, Utensils, ShoppingBag,
  Ticket, Bike, Smile
} from 'lucide-react';

const POPULAR_STATIONS = [
  { name: "Pune Junction", code: "PUNE" },
  { name: "Mumbai CSMT", code: "CSMT" },
  { name: "Nagpur Jn.", code: "NGP" },
  { name: "Bengaluru City", code: "SBC" },
];

const MOCK_TICKERS = [
  "🚂 Order Delivered: Chole Bhature & Cold Coffee at Secunderabad (SC) — Coach B2",
  "🔥 Order Placed: 2x Vada Pav & Masala Chai at Kalyan Junction (KYN) — Coach S3",
  "🚆 Fresh Delivery: Veg Deluxe Thali delivered to Berth 42, Pune Junction (PUNE)",
  "🎁 Promo Applied: Free Mineral Water added to Order #SR-9028",
  "🟢 Live Status: Kerala Express (12626) running on-time near Nagpur (NGP)",
];

/* ── Inline railway-track SVG divider ── */
function TrackDivider({ light = false }) {
  const rail = light ? "#cbd5e1" : "#94a3b8";
  const sleeper = light ? "#e2e8f0" : "#cbd5e1";
  return (
    <div className="w-full overflow-hidden py-1 select-none pointer-events-none" aria-hidden>
      <svg viewBox="0 0 800 18" className="w-full" preserveAspectRatio="none">
        <rect y="5" width="800" height="3" fill={rail} rx="1" />
        <rect y="10" width="800" height="3" fill={rail} rx="1" />
        {Array.from({ length: 40 }).map((_, i) => (
          <rect key={i} x={i * 21} y="2" width="12" height="14" rx="2" fill={sleeper} />
        ))}
      </svg>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const {
    stations, availableStates, freeProduct, giftThreshold, currentUser, orders, menuItems,
    homepageHeroDesktop, homepageHeroMobile, homepageShowcase1, homepageShowcase2, homepagePopularDishes,
    statsPassengers, statsEateries, statsRating, statsJunctions, homepageLogo
  } = useApp();

  const popularDishes = menuItems && menuItems.length > 0
    ? (() => {
      const itemsToShow = homepagePopularDishes && homepagePopularDishes.length > 0
        ? menuItems.filter(item => homepagePopularDishes.includes(item.id))
        : menuItems.slice(0, 4);

      return itemsToShow.slice(0, 4).map((item, idx) => ({
        name: item.name,
        price: `₹${item.price}`,
        rating: idx % 2 === 0 ? "4.9" : "4.8",
        reviews: idx % 2 === 0 ? "1.8k" : "950",
        tag: item.category || "Best Seller",
        tagColor: item.category === 'Meals' ? 'bg-rose-500' : 'bg-amber-500',
        desc: item.description || "Fresh and hot delicious meal served directly at your seat.",
        img: item.image || (
          item.name.toLowerCase().includes('biryani') ? "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80" :
            item.name.toLowerCase().includes('paneer') ? "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80" :
              item.name.toLowerCase().includes('vada') ? "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&q=80" :
                "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80"
        )
      }));
    })()
    : [];

  const [pnr, setPnr] = useState('');
  const [pnrResult, setPnrResult] = useState(null);
  const [pnrDetails, setPnrDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('station');
  const [stationSearch, setStationSearch] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [showAllStations, setShowAllStations] = useState(false);
  const [showPnrModal, setShowPnrModal] = useState(false);
  const [modalPnr, setModalPnr] = useState('');

  /* ── PNR ── */
  const handlePnrCheck = (e) => {
    e.preventDefault();
    if (pnr.length < 10) { alert("Please enter a valid 10-digit PNR"); return; }
    router.push(`/pnr-route?pnr=${pnr}`);
  };

  const handleProceedWithStation = (code) => {
    localStorage.setItem("selected_station_code", code);
    router.push(`/menu?station=${code}`);
  };

  const handleProceedWithPnr = () => {
    localStorage.setItem("selected_pnr", pnr);
    let target = null;
    if (pnrDetails?.boardingStation) {
      target = stations.find(s =>
        s.code.toUpperCase() === pnrDetails.boardingStation.toUpperCase() ||
        s.name.toLowerCase().includes(pnrDetails.boardingStation.toLowerCase())
      );
    }
    const station = target || stations[Math.floor(Math.random() * stations.length)];
    localStorage.setItem("selected_station_code", station.code);
    if (pnrDetails?.passengers?.length > 0) {
      localStorage.setItem("selected_coach", pnrDetails.passengers[0].coach);
      localStorage.setItem("selected_seat", pnrDetails.passengers[0].seat);
    }
    router.push(`/menu?pnr=${pnr}&station=${station.code}`);
  };

  const filteredStations = stations.filter(s => {
    const q = stationSearch.toLowerCase();
    const ok = s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
    return ok && (selectedState === 'All' || s.state === selectedState);
  });

  const displayStations = showAllStations ? filteredStations : filteredStations.slice(0, 20);

  /* ════════════════════════════════════════════ RENDER ═══ */
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800 font-sans selection:bg-rose-600 selection:text-white">
      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}} />

      {/* ══ HERO ═════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-slate-200 md:min-h-[calc(100vh-40px)] md:flex md:items-center">

        {/* ── MOBILE LAYOUT ── */}
        <div className="md:hidden relative w-full">
          {/* Natural-ratio image — no crop, no stretch */}
          <img
            src={homepageHeroMobile || "/mobile_hero.png"}
            alt="Railway food delivery"
            className="w-full h-auto block"
          />
          {/* Bottom gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />

          {/* Text content pinned to bottom of image */}
          <div className="absolute bottom-8 left-0 right-0 z-10 px-4 pb-2 text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-4">
              <img src={homepageLogo || "/logo.png"} alt="BiteOnRail Logo" className="h-10 w-auto filter drop-shadow-[1px_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            {/* Heading */}
            <div className="pb-16">
              <h1
                className="text-4xl font-black tracking-tight leading-tight text-white"
                style={{ filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.95)) drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.8))' }}
              >
                Hot Food<br />
                <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                  At Your Berth!
                </span>
              </h1>
              <p
                className="text-slate-200 text-base mt-2 font-bold leading-relaxed"
                style={{ textShadow: '1px 1px 4px rgba(0, 0, 0, 0.95)' }}
              >
                Fresh meals delivered to your seat at the next station halt.
              </p>
            </div>
          </div>

          {/* ── MOBILE PNR CARD OVERLAP (Exactly 50% split) ── */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 z-25 px-4">
            <div className="bg-white border border-slate-200 rounded-[24px] shadow-xl p-4 relative">
              {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map(pos => (
                <div key={pos} className={`absolute ${pos} w-2 h-2 rounded-full bg-slate-200 border border-slate-350`} />
              ))}
              <form onSubmit={handlePnrCheck}>
                <div className="relative">
                  <Train className="absolute left-4 top-[18px] w-4 h-4 text-slate-400" />
                  <input
                    type="text" required maxLength={10} value={pnr}
                    onChange={e => { setPnr(e.target.value.replace(/\D/g, '')); setPnrResult(null); }}
                    placeholder="Enter PNR to order"
                    className="pl-11 pr-28 py-4 w-full bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-rose-500 font-sans font-bold text-slate-800 placeholder-slate-400"
                  />
                  <button type="submit" disabled={pnrResult === 'checking'}
                    className="absolute right-2.5 top-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow disabled:opacity-50"
                  >
                    {pnrResult === 'checking' ? '…' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Space compensator below mobile hero to account for overflow */}
        <div className="md:hidden h-14 w-full"></div>

        {/* ── DESKTOP LAYOUT (Original Left-Aligned Sidebar Style) ── */}
        <div className="hidden md:block absolute inset-0 z-0">
          <img
            src={homepageHeroDesktop || "/herobanner.png"}
            alt="Vande Bharat Express train background"
            className="w-full h-full object-cover object-center"
          />
          {/* Dark overlay for desktop view */}
          <div className="absolute inset-0 bg-black/15" />
        </div>

        {/* Subtle grid on top */}
        <div className="hidden md:block absolute inset-0 pointer-events-none z-[1]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px'
          }}
        />

        {/* Desktop text content */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-24">
          <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-3xl mx-auto">

            {/* Route badge */}
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 bg-slate-900 text-amber-400 px-4 py-2 rounded-full border border-slate-800 shadow-md">
                <Train className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-[11px] md:text-xs font-black uppercase tracking-widest">BiteOnRail Express Delivery</span>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1
                className="text-4xl sm:text-5xl lg:text-[64px] font-black tracking-tight leading-tight text-white"
                style={{ filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.95)) drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.8))' }}
              >
                Hot Food <span className="bg-gradient-to-r from-rose-400 via-rose-450 to-amber-400 bg-clip-text text-transparent">At Your Berth!</span>
              </h1>
              <p
                className="text-white text-base md:text-xl lg:text-2xl max-w-3xl mx-auto font-bold leading-relaxed"
                style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.98), 0px 0px 12px rgba(0, 0, 0, 0.85)' }}
              >
                Hygiene-certified fresh meals delivered to your train seat at the next station halt.
                MRP pricing across <strong className="text-white">{stations.length} major junctions.</strong>
              </p>
            </div>

            {/* Search Card */}
            <div className="bg-white border border-slate-200 rounded-[28px] shadow-lg p-6 sm:p-7 w-full max-w-md md:max-w-lg relative">
              {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map(pos => (
                <div key={pos} className={`absolute ${pos} w-2 h-2 rounded-full bg-slate-200 border border-slate-350`} />
              ))}

              <div className="space-y-4">
                {/* Station/Brand/Order general Search Input */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={stationSearch}
                    onChange={e => setStationSearch(e.target.value)}
                    placeholder="Search train, station, food..."
                    className="pl-11 pr-28 sm:pr-32 py-4 sm:py-4.5 w-full bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 font-sans font-bold text-slate-800 placeholder-slate-400"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && stationSearch.trim()) {
                        router.push(`/search?q=${encodeURIComponent(stationSearch)}`);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (stationSearch.trim()) {
                        router.push(`/search?q=${encodeURIComponent(stationSearch)}`);
                      }
                    }}
                    className="absolute right-2.5 top-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-black px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Search
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center my-2 select-none">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="px-3 text-xs text-slate-400 font-bold uppercase tracking-wider">OR</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Direct PNR Form */}
                <form onSubmit={handlePnrCheck}>
                  <div className="relative">
                    <Train className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text" required maxLength={10} value={pnr}
                      onChange={e => { setPnr(e.target.value.replace(/\D/g, '')); setPnrResult(null); }}
                      placeholder="Enter PNR to order"
                      className="pl-11 pr-28 sm:pr-32 py-4 sm:py-4.5 w-full bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 font-sans font-bold text-slate-800 placeholder-slate-400"
                    />
                    <button type="submit" disabled={pnrResult === 'checking'}
                      className="absolute right-2.5 top-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs sm:text-sm font-black px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all shadow disabled:opacity-50"
                    >
                      {pnrResult === 'checking' ? '…' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* Rail track section divider */}
      <TrackDivider />

      {/* ══ HOW IT WORKS ═════════════════════════════════════ */}
      <section className="pt-16 pb-12 md:py-28 bg-slate-50/60 relative overflow-hidden border-b border-slate-100">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none select-none"
          style={{ backgroundImage: `repeating-linear-gradient(90deg, #000, #000 1px, transparent 1px, transparent 40px), repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 40px)` }} />
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes trackLight {
            0% {
              left: 0%;
              transform: translate(-50%, -50%);
              color: #ea580c; /* orange-600 */
            }
            33% {
              color: #ea580c; /* orange-600 */
            }
            38% {
              color: #e11d48; /* rose-600 */
            }
            66% {
              color: #e11d48; /* rose-600 */
            }
            71% {
              color: #0284c7; /* sky-600 */
            }
            100% {
              left: 100%;
              transform: translate(-50%, -50%);
              color: #0284c7; /* sky-600 */
            }
          }
          .animate-track-light {
            animation: trackLight 6s linear infinite;
          }
          @keyframes mobileTrack1 {
            0% { left: 0%; transform: translate(-50%, -50%); opacity: 1; color: #ea580c; }
            30% { left: 100%; transform: translate(-50%, -50%); opacity: 1; color: #ea580c; }
            30.1% { opacity: 0; }
            100% { left: 100%; opacity: 0; }
          }
          @keyframes mobileTrack2 {
            0% { top: 0%; transform: translate(-50%, 0%); opacity: 0; color: #e11d48; }
            30% { top: 0%; transform: translate(-50%, 0%); opacity: 0; color: #e11d48; }
            33% { top: 0%; transform: translate(-50%, 0%); opacity: 1; color: #e11d48; }
            63% { top: 100%; transform: translate(-50%, 0%); opacity: 1; color: #e11d48; }
            63.1% { opacity: 0; }
            100% { top: 100%; opacity: 0; }
          }
          @keyframes mobileTrack3 {
            0% { right: 0%; transform: translate(50%, -50%); opacity: 0; color: #0284c7; }
            63% { right: 0%; transform: translate(50%, -50%); opacity: 0; color: #0284c7; }
            66% { right: 0%; transform: translate(50%, -50%); opacity: 1; color: #0284c7; }
            96% { right: 100%; transform: translate(50%, -50%); opacity: 1; color: #0284c7; }
            96.1% { opacity: 0; }
            100% { right: 100%; opacity: 0; }
          }
          .animate-mobile-track-1 {
            animation: mobileTrack1 6s linear infinite;
          }
          .animate-mobile-track-2 {
            animation: mobileTrack2 6s linear infinite;
          }
          .animate-mobile-track-3 {
            animation: mobileTrack3 6s linear infinite;
          }
        `}} />

        {/* Decorative Grid backdrop */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{ backgroundImage: `repeating-linear-gradient(90deg, #0f172a, #0f172a 2px, transparent 2px, transparent 56px)` }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

          {/* Section Header */}
          <div className="text-center max-w-xl mx-auto mb-16 md:mb-24">
            <span className="text-xs font-black uppercase tracking-widest text-orange-600 mb-3 block">
              How BiteOnRail Works
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Just 4 Simple Steps
            </h2>
            <p className="text-slate-550 text-sm sm:text-base mt-3 leading-relaxed font-semibold">
              Ordering food in train is now easier than ever
            </p>
          </div>

          {/* Steps Wrapper */}
          <div className="relative max-w-7xl mx-auto">

            {/* Single Continuous Connecting Track (Desktop only) */}
            <div className="absolute top-[64px] left-[12%] right-[12%] h-[5px] hidden md:block z-0"
              style={{
                backgroundImage: 'linear-gradient(to bottom, #94a3b8 0px, #94a3b8 1px, transparent 1px, transparent 3px, #94a3b8 3px, #94a3b8 4px), repeating-linear-gradient(to right, transparent, transparent 2px, #cbd5e1 2px, #cbd5e1 4px, transparent 4px, transparent 10px)'
              }}>
              {/* Literal Train Icon Badge */}
              <div className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-current animate-track-light hover:scale-110 transition-transform">
                <Train className="w-4.5 h-4.5 text-current drop-shadow-[0_0_4px_currentColor]" />
              </div>
            </div>

            {/* Steps Columns */}
            <div className="flex flex-col md:flex-row justify-between items-start relative z-10 w-full gap-16 md:gap-0">

              {/* Group 1: Step 1 & 2 */}
              <div className="relative grid grid-cols-2 gap-6 md:flex md:flex-row md:justify-between w-full md:w-[49%]">
                {/* Horizontal Connector Line for Step 1 -> 2 (Mobile only, Orange) */}
                <div className="absolute top-[56px] left-[25%] right-[25%] h-[4px] md:hidden z-0"
                  style={{
                    backgroundImage: 'linear-gradient(to bottom, #94a3b8 0px, #94a3b8 1px, transparent 1px, transparent 2px, #94a3b8 2px, #94a3b8 3px), repeating-linear-gradient(to right, transparent, transparent 2px, #cbd5e1 2px, #cbd5e1 4px, transparent 4px, transparent 8px)'
                  }}>
                  <div className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-current animate-mobile-track-1">
                    <Train className="w-4 h-4 text-current" />
                  </div>
                </div>

                {/* Vertical Connector Line from Step 2 -> 3 (Mobile only, Red/Rose) */}
                <div className="absolute top-[100%] h-[120px] right-[25%] w-[4px] md:hidden z-0"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #94a3b8 0px, #94a3b8 1px, transparent 1px, transparent 2px, #94a3b8 2px, #94a3b8 3px), repeating-linear-gradient(to bottom, transparent, transparent 2px, #cbd5e1 2px, #cbd5e1 4px, transparent 4px, transparent 8px)'
                  }}>
                  <div className="absolute left-1/2 -translate-x-1/2 w-7 h-7 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-current animate-mobile-track-2 rotate-90">
                    <Train className="w-4.5 h-4.5 text-current" />
                  </div>
                </div>

                {/* Step 1 */}
                <div className="flex flex-col items-center text-center group w-full md:w-[48%]">
                  {/* Circle */}
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-orange-50/50 border border-slate-200 flex items-center justify-center relative z-10 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/20 hover:border-orange-400">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center shadow-inner">
                      <Utensils className="w-9 h-9 md:w-11 md:h-11 text-orange-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                      1
                    </div>
                  </div>
                  <h3 className="font-black text-slate-800 text-sm sm:text-base md:text-lg mt-5 group-hover:text-slate-950 transition-colors">
                    Choose Your Food
                  </h3>
                  <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-semibold leading-relaxed mt-2 max-w-[145px] sm:max-w-[180px] md:max-w-[200px] mx-auto">
                    Browse menus from top restaurants available at your station.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center group w-full md:w-[48%]">
                  {/* Circle */}
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-rose-50/50 border border-slate-200 flex items-center justify-center relative z-10 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-500/20 hover:border-rose-400">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center shadow-inner">
                      <Ticket className="w-9 h-9 md:w-11 md:h-11 text-rose-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                      2
                    </div>
                  </div>
                  <h3 className="font-black text-slate-800 text-sm sm:text-base md:text-lg mt-5 group-hover:text-slate-950 transition-colors">
                    Enter PNR
                  </h3>
                  <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-semibold leading-relaxed mt-2 max-w-[145px] sm:max-w-[180px] md:max-w-[200px] mx-auto">
                    Enter your 10 digit PNR number to find your journey details.
                  </p>
                </div>
              </div>

              {/* Group 2: Step 3 & 4 (Note: order swapped on mobile to place 3 on right, 4 on left) */}
              <div className="relative grid grid-cols-2 gap-6 md:flex md:flex-row md:justify-between w-full md:w-[49%]">
                {/* Horizontal Connector Line for Step 3 -> 4 (Mobile only, Blue) */}
                <div className="absolute top-[56px] left-[25%] right-[25%] h-[4px] md:hidden z-0"
                  style={{
                    backgroundImage: 'linear-gradient(to bottom, #94a3b8 0px, #94a3b8 1px, transparent 1px, transparent 2px, #94a3b8 2px, #94a3b8 3px), repeating-linear-gradient(to right, transparent, transparent 2px, #cbd5e1 2px, #cbd5e1 4px, transparent 4px, transparent 8px)'
                  }}>
                  <div className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-current animate-mobile-track-3 -rotate-180">
                    <Train className="w-4 h-4 text-current" />
                  </div>
                </div>

                {/* Step 3 (Renders on the right side on mobile, but 3rd on desktop) */}
                <div className="flex flex-col items-center text-center group w-full md:w-[48%] order-2 md:order-1">
                  {/* Circle */}
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-sky-50/50 border border-slate-200 flex items-center justify-center relative z-10 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-sky-500/20 hover:border-sky-400">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center shadow-inner">
                      <Bike className="w-9 h-9 md:w-11 md:h-11 text-sky-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                      3
                    </div>
                  </div>
                  <h3 className="font-black text-slate-800 text-sm sm:text-base md:text-lg mt-5 group-hover:text-slate-950 transition-colors">
                    We Prepare & Deliver
                  </h3>
                  <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-semibold leading-relaxed mt-2 max-w-[145px] sm:max-w-[180px] md:max-w-[200px] mx-auto">
                    We'll prepare your order and deliver it fresh on your berth.
                  </p>
                </div>

                {/* Step 4 (Renders on the left side on mobile, but 4th on desktop) */}
                <div className="flex flex-col items-center text-center group w-full md:w-[48%] order-1 md:order-2">
                  {/* Circle */}
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-emerald-50/50 border border-slate-200 flex items-center justify-center relative z-10 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-400">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center shadow-inner">
                      <Smile className="w-9 h-9 md:w-11 md:h-11 text-emerald-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                      4
                    </div>
                  </div>
                  <h3 className="font-black text-slate-800 text-sm sm:text-base md:text-lg mt-5 group-hover:text-slate-950 transition-colors">
                    Enjoy Your Meal
                  </h3>
                  <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-semibold leading-relaxed mt-2 max-w-[145px] sm:max-w-[180px] md:max-w-[200px] mx-auto">
                    Sit back, relax and enjoy delicious food during your journey.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-8 md:mt-20">
            <button
              onClick={() => setShowPnrModal(true)}
              className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:scale-[0.98] text-white hover:text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-lg shadow-rose-500/25 hover:shadow-rose-500/35 relative overflow-hidden group/btn"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                Order Now with PNR
              </span>
            </button>
          </div>

        </div>
      </section>

      {/* ══ PREMIUM DINING SHOWCASE ═════════════════════════ */}
      <section className="pt-16 pb-4 md:pt-24 md:pb-44 bg-white relative overflow-hidden border-b border-slate-100">
        {/* Glow backdrop bubbles */}
        <div className="absolute top-[20%] left-[-10%] w-[380px] h-[380px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[380px] h-[380px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none select-none"
          style={{ backgroundImage: `repeating-linear-gradient(90deg, #000, #000 1px, transparent 1px, transparent 40px), repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 40px)` }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
            <span className="text-xs font-black uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-100 px-3.5 py-1.5 rounded-full w-fit mx-auto mb-4 flex items-center justify-center gap-1.5 shadow-sm">
              <Star className="w-3.5 h-3.5 text-rose-600 fill-rose-650" /> Premium Train Dining
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Delicious Food, <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">Served at Your Berth</span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base md:text-lg mt-3.5 leading-relaxed font-semibold">
              We bring high-quality, hygiene-certified restaurant meals right to your train seat. Enjoy a delightful and completely hassle-free dining experience during your journey.
            </p>
          </div>

          {/* Image Showcase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 lg:gap-14 pb-0 md:pb-12">

            {/* Card 1: Vande Bharat */}
            <div className="group relative h-auto rounded-[40px] overflow-hidden border border-slate-200/80 bg-white p-3 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_30px_60px_-15px_rgba(244,63,94,0.1)] transition-all duration-500 md:-rotate-1 hover:rotate-0 hover:-translate-y-3">
              <div className="relative w-full aspect-square rounded-[30px] overflow-hidden">
                {/* Image */}
                <img
                  src={homepageShowcase1 || "/vande_bharat.png"}
                  alt="Vande Bharat Express Food Delivery"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

              </div>
            </div>

            {/* Card 2: Food on Train Seat */}
            <div className="group relative h-auto rounded-[40px] overflow-hidden border border-slate-200/80 bg-white p-3 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_30px_60px_-15px_rgba(245,158,11,0.1)] transition-all duration-500 md:rotate-1 hover:rotate-0 md:translate-y-12 hover:translate-y-9">
              <div className="relative w-full aspect-square rounded-[30px] overflow-hidden">
                {/* Image */}
                <img
                  src={homepageShowcase2 || "/train_food_delivery.png"}
                  alt="Hygienic Train Meal Box Delivery"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />


              </div>
            </div>

          </div>

        </div>
      </section>

      {popularDishes.length > 0 && (
        <>
          {/* Rail track divider */}
          <TrackDivider light />

          {/* ══ POPULAR MENU SHOWCASE ══════════════════════════ */}
          <section className="py-16 md:py-24 bg-slate-50/60 relative overflow-hidden border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

              {/* Header */}
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-xs font-black uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-100 px-3.5 py-1.5 rounded-full w-fit mx-auto mb-4 flex items-center gap-1.5 shadow-sm">
                  <Smile className="w-4.5 h-4.5 text-orange-600 shrink-0" /> Passenger Favorites
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Popular Dishes on the Track
                </h2>
                <p className="text-slate-550 text-sm sm:text-base md:text-lg mt-3.5 leading-relaxed font-semibold">
                  Loved by thousands of passengers. Order these hot and delicious items delivered right at your seat.
                </p>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {popularDishes.map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/80 rounded-[28px] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                    <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className={`${item.tagColor} text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm`}>
                          {item.tag}
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm md:text-base font-black text-slate-800 font-mono">{item.price}</span>
                        </div>
                        <h3 className="font-black text-slate-800 text-xs sm:text-sm md:text-base leading-tight group-hover:text-rose-600 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-450 font-semibold leading-relaxed mt-1 line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/menu?add_item=${encodeURIComponent(item.name)}`)}
                        className="w-full mt-3 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 font-black text-[10px] md:text-xs uppercase tracking-wider py-2 md:py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>
        </>
      )}

      {/* ══ HYGIENE & SAFETY STANDARDS ═══════════════════════ */}
      <section className="py-16 md:py-28 bg-white relative overflow-hidden border-b border-slate-100">
        {/* Glow backdrop bubbles */}
        <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-15%] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Text details */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-black uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-100 px-3.5 py-1.5 rounded-full w-fit flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-rose-600" /> Zero-Compromise Safety
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Our Triple-Check <br />
                <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">Hygiene & Trust Promise</span>
              </h2>
              <p className="text-slate-500 text-sm sm:text-base md:text-lg mt-3.5 leading-relaxed font-semibold">
                Your health is our ultimate priority. We partner exclusively with premium restaurants that follow strict government sanitization guidelines to cook, pack, and deliver fresh food.
              </p>

              {/* Bullet details */}
              <div className="space-y-4 pt-2">
                {[
                  {
                    title: "100% FSSAI Certified Kitchens",
                    desc: "Every dish is prepared in kitchens audited and verified for high cleanliness standards.",
                    icon: ShieldCheck,
                    color: "bg-rose-50 border border-rose-100 text-rose-600 shadow-sm shadow-rose-500/5",
                    iconColor: "text-rose-600"
                  },
                  {
                    title: "Triple-Sealed Thermal Packaging",
                    desc: "Food is secured in leak-proof containers and thermal bags to retain heat and prevent external contact.",
                    icon: Award,
                    color: "bg-amber-50 border border-amber-100 text-amber-600 shadow-sm shadow-amber-500/5",
                    iconColor: "text-amber-600"
                  },
                  {
                    title: "Contactless Berth Delivery",
                    desc: "Our delivery agents sanitize hands before and after halts, ensuring a safe transfer straight at your seat.",
                    icon: Bike,
                    color: "bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-500/5",
                    iconColor: "text-emerald-600"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-slate-50/50 hover:bg-slate-50 border border-slate-150 p-4 sm:p-5 rounded-[24px] transition-all duration-300 group/item">
                    <div className={`${item.color} p-3 rounded-xl shrink-0 flex items-center justify-center transition-transform duration-300 group-hover/item:scale-110`}>
                      <item.icon className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm sm:text-base md:text-lg transition-colors group-hover/item:text-rose-600">{item.title}</h4>
                      <p className="text-xs sm:text-sm md:text-[14px] text-slate-500 font-semibold leading-relaxed mt-1.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual element on right */}
            <div className="lg:col-span-6 relative flex justify-center">
              {/* Backglow panel */}
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/10 via-rose-450/5 to-amber-500/10 rounded-[48px] blur-xl opacity-80 pointer-events-none" />

              <div className="relative w-full max-w-[460px] aspect-square rounded-[44px] overflow-hidden bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_70px_rgba(244,63,94,0.06)] transition-all duration-500 hover:-translate-y-1 group">
                {/* Background overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 to-transparent pointer-events-none" />

                {/* Decorative Elements */}
                <div className="flex justify-between items-center relative z-10">
                  <div className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-2xl shadow-xs flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Live Sanitized</span>
                  </div>
                  <div className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-2xl shadow-xs flex items-center gap-1 text-amber-500">
                    ★ <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider font-mono">100% Safe</span>
                  </div>
                </div>

                {/* Central Stamp */}
                <div className="my-8 text-center relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-500/25 mb-5 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-6">
                    <ShieldCheck className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">BiteOnRail Certified</h3>
                  <p className="text-xs sm:text-sm md:text-[14px] text-slate-500 font-semibold max-w-sm mx-auto mt-2 leading-relaxed">
                    Look for our safety audit sticker on packaging to guarantee hygiene, warmth, and FSSAI-inspected quality.
                  </p>
                </div>

                {/* Footer Tag */}
                <div className="border-t border-dashed border-slate-200 pt-4 flex justify-center items-center relative z-10 text-[9px] sm:text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">
                  <span>Safety audited daily</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ══ ACTIVE STATIONS ══════════════════════════════════ */}
      <section className="py-12 md:py-24 bg-white border-b border-slate-100 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.012] pointer-events-none select-none"
          style={{ backgroundImage: `repeating-linear-gradient(90deg, #000, #000 1px, transparent 1px, transparent 40px), repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 40px)` }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-px bg-rose-500" />
                <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-rose-600">Platform Delivery Hubs</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">Active Rail Stations</h2>
              <p className="text-slate-500 text-sm sm:text-base md:text-lg mt-3 leading-relaxed font-semibold">
                Warm meals at <strong className="text-slate-700">{stations.length || 17}</strong> major junctions across India.
              </p>
            </div>

            {/* Search bar for stations */}
            <div className="relative shrink-0 w-full md:w-auto">
              <input
                type="text"
                value={stationSearch}
                onChange={(e) => {
                  setStationSearch(e.target.value);
                  setShowAllStations(false);
                }}
                placeholder="Search station name/code..."
                className="pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 w-full md:w-64 bg-white font-semibold text-slate-800 shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
            </div>
          </div>

          {/* State Filter Row - full width & highly accessible */}
          <div className="mb-8 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-xs text-slate-450 font-bold uppercase tracking-wider mb-2.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Filter by State:
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
              {['All', ...Array.from(new Set(stations.map(s => s.state).filter(Boolean))).sort()].map(state => (
                <button
                  key={state}
                  onClick={() => { setSelectedState(state); setShowAllStations(false); }}
                  className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-black border transition-all duration-200 whitespace-nowrap
                    ${selectedState === state
                      ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/20 scale-[1.02]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          {/* Boarding-pass station grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
            {displayStations.map(station => (
              <div key={station.id} onClick={() => handleProceedWithStation(station.code)}
                className="bg-white border border-slate-200 rounded-xl sm:rounded-[20px] cursor-pointer hover:border-rose-400/60 hover:shadow-xl hover:shadow-rose-100/50 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Top accent bar */}
                <div className="h-0.5 sm:h-1 bg-gradient-to-r from-slate-900 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl sm:rounded-t-[20px]" />
                {/* Ticket notches */}
                <div className="absolute top-1/2 -left-2.5 w-4 h-4 sm:w-5 sm:h-5 bg-slate-50 border border-slate-200 rounded-full -translate-y-1/2 z-10" />
                <div className="absolute top-1/2 -right-2.5 w-4 h-4 sm:w-5 sm:h-5 bg-slate-50 border border-slate-200 rounded-full -translate-y-1/2 z-10" />

                <div className="p-3 sm:p-5">
                  <div className="flex justify-between items-start pb-2 sm:pb-3 border-b border-dashed border-slate-100 mb-2 sm:mb-3">
                    <div className="min-w-0 pr-1">
                      <h3 className="font-black text-slate-800 text-[13px] sm:text-sm md:text-base group-hover:text-rose-600 transition-colors leading-tight whitespace-normal">{station.name}</h3>
                      <span className="text-[9px] sm:text-[9px] md:text-xs text-slate-400 font-bold uppercase tracking-widest block mt-0.5 truncate">{station.state}</span>
                    </div>
                    <span className="text-sm sm:text-2xl md:text-3xl font-black text-slate-900 group-hover:text-rose-600 transition-colors font-mono shrink-0">{station.code}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[10px] md:text-xs font-bold text-emerald-600">
                      <span className="relative flex h-1 sm:h-1.5 w-1 sm:w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1 sm:h-1.5 w-1 sm:w-1.5 bg-emerald-500" />
                      </span>
                      Active
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[10px] md:text-xs font-black text-slate-400 group-hover:text-rose-600 transition-colors uppercase tracking-wider">
                      Order <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredStations.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 text-sm font-bold border-2 border-dashed border-slate-200 rounded-[20px] bg-white">
                No stations found.
              </div>
            )}
          </div>

          {/* Show More / Less Pagination Button */}
          {filteredStations.length > 20 && (
            <div className="text-center mt-10">
              <button
                onClick={() => setShowAllStations(!showAllStations)}
                className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest px-7 py-3.5 rounded-full transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                {showAllStations ? 'Show Less Stations' : `Show All ${filteredStations.length} Stations`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Rail track divider */}
      <TrackDivider light />

      {/* ══ WHO WE ARE & WHAT WE DO ═════════════════════════ */}
      <section className="py-16 md:py-28 bg-slate-50/60 relative overflow-hidden border-b border-slate-100">
        {/* Glow backdrop bubbles */}
        <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

             {/* Left Column: Who We Are & What We Do */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-black uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-100 px-3.5 py-1.5 rounded-full w-fit flex items-center gap-1.5 shadow-sm">
                <Award className="w-4 h-4 text-rose-600" /> Our Story & Mission
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Who We Are & <br />
                <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">What We Do</span>
              </h2>
              <p className="text-slate-500 text-sm sm:text-base md:text-lg mt-3.5 leading-relaxed font-semibold">
                BiteOnRail is a next-generation train travel dining platform. We are dedicated to transforming your rail journeys by delivering hot, fresh, and hygienic food right to your train berth.
              </p>
 
              {/* Detail Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="bg-white border border-slate-200/80 p-5 rounded-[24px] hover:shadow-lg hover:border-rose-200 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="bg-rose-50 w-10 h-10 rounded-xl flex items-center justify-center text-rose-600 mb-3.5 shadow-sm shadow-rose-500/5 transition-transform duration-300 group-hover:scale-110">
                    <Smile className="w-5.5 h-5.5" />
                  </div>
                  <h4 className="font-black text-slate-800 text-sm sm:text-base md:text-lg group-hover:text-rose-600 transition-colors">Who We Are?</h4>
                  <p className="text-[11px] md:text-sm text-slate-500 font-semibold leading-relaxed mt-1.5">
                    A team of passionate foodies and railway innovators who believe train travel should always come with delightful meals.
                  </p>
                </div>
 
                <div className="bg-white border border-slate-200/80 p-5 rounded-[24px] hover:shadow-lg hover:border-amber-200 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="bg-amber-50 w-10 h-10 rounded-xl flex items-center justify-center text-amber-600 mb-3.5 shadow-sm shadow-amber-500/5 transition-transform duration-300 group-hover:scale-110">
                    <Train className="w-5.5 h-5.5" />
                  </div>
                  <h4 className="font-black text-slate-800 text-sm sm:text-base md:text-lg group-hover:text-amber-600 transition-colors">What We Do?</h4>
                  <p className="text-[11px] md:text-sm text-slate-500 font-semibold leading-relaxed mt-1.5">
                    We track your train live, coordinate with hygiene-approved local restaurants, and deliver warm food directly to your seat.
                  </p>
                </div>
              </div>
            </div>
 
            {/* Right Column: Key Trust Metrics Grid */}
            <div className="lg:col-span-6 relative">
              {/* Backglow panel */}
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/10 via-rose-450/5 to-amber-500/10 rounded-[48px] blur-xl opacity-80 pointer-events-none" />
 
              <div className="relative bg-white border border-slate-200 rounded-[28px] sm:rounded-[44px] p-3 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div className="pb-1 mb-1.5 sm:pb-4 sm:mb-4 border-b border-slate-100 flex justify-between items-center gap-2">
                  <h3 className="font-black text-slate-800 text-xs sm:text-base uppercase tracking-wider">Our Trust & Scale</h3>
                  <span className="text-[9px] sm:text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500" />
                    </span>
                    Live Tracker
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                  {[
                    {
                      val: statsPassengers || "5k+",
                      label: "Happy Passengers",
                      desc: "Delivered at berth",
                      color: "text-rose-650",
                      cardBg: "bg-rose-50/30 hover:bg-rose-50/60 border-rose-100/70 hover:border-rose-300 hover:shadow-rose-100/60",
                      iconBg: "bg-white text-rose-600 border border-rose-100",
                      icon: <Smile className="w-4.5 h-4.5" />
                    },
                    {
                      val: statsEateries || "80+",
                      label: "Eateries Partners",
                      desc: "Audited kitchens",
                      color: "text-amber-650",
                      cardBg: "bg-amber-50/30 hover:bg-amber-50/60 border-amber-100/70 hover:border-amber-300 hover:shadow-amber-100/60",
                      iconBg: "bg-white text-amber-600 border border-amber-100",
                      icon: <Utensils className="w-4.5 h-4.5" />
                    },
                    {
                      val: statsRating || "4.8",
                      label: "Average Rating",
                      desc: "Passenger satisfaction",
                      color: "text-emerald-650",
                      cardBg: "bg-emerald-50/30 hover:bg-emerald-50/60 border-emerald-100/70 hover:border-emerald-300 hover:shadow-emerald-100/60",
                      iconBg: "bg-white text-emerald-600 border border-emerald-100",
                      icon: <Star className="w-4.5 h-4.5 fill-emerald-500 text-emerald-500" />
                    },
                    {
                      val: statsJunctions || `${stations.length}+`,
                      label: "Active Junctions",
                      desc: "Major train routes",
                      color: "text-sky-650",
                      cardBg: "bg-sky-50/30 hover:bg-sky-50/60 border-sky-100/70 hover:border-sky-300 hover:shadow-sky-100/60",
                      iconBg: "bg-white text-sky-600 border border-sky-100",
                      icon: <MapPin className="w-4.5 h-4.5" />
                    }
                  ].map((metric, idx) => (
                    <div
                      key={idx}
                      className={`border p-3.5 sm:p-5 rounded-[20px] sm:rounded-[24px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5 flex flex-col justify-between group ${metric.cardBg}`}
                    >
                      <div className="flex items-center justify-between mb-2.5 sm:mb-3.5">
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110 ${metric.iconBg}`}>
                          {React.cloneElement(metric.icon, { className: 'w-4 h-4 sm:w-4.5 sm:h-4.5' })}
                        </div>
                      </div>
                      <div>
                        <span className={`text-xl sm:text-3xl md:text-4xl font-extrabold font-mono block tracking-tight leading-none ${metric.color}`}>
                          {metric.val}
                        </span>
                        <span className="text-[9px] sm:text-xs font-black text-slate-800 uppercase tracking-wider block mt-1.5 leading-tight">
                          {metric.label}
                        </span>
                        <span className="text-[8px] sm:text-[11px] text-slate-450 font-bold block mt-0.5 leading-tight">
                          {metric.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════ */}
      <section className="pt-12 pb-4 md:py-20 bg-slate-50/60 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none select-none"
          style={{ backgroundImage: `repeating-linear-gradient(90deg, #000, #000 1px, transparent 1px, transparent 40px), repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 40px)` }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

          {/* CTA Banner — premium light style */}
          <div className="bg-gradient-to-br from-slate-50 to-rose-50/20 rounded-[32px] p-6 md:p-12 mb-10 md:mb-16 relative overflow-hidden border border-slate-150 shadow-sm">
            <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
              style={{ backgroundImage: `repeating-linear-gradient(0deg,#000,#000 2px,transparent 2px,transparent 40px),repeating-linear-gradient(90deg,#000,#000 2px,transparent 2px,transparent 40px)` }} />
            <div className="absolute top-[-40px] right-[-40px] w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-[80px]" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full w-fit text-[10px] font-black uppercase tracking-widest mb-4">
                  <Train className="w-3.5 h-3.5" /> Now Boarding — All Classes
                </div>
                <h3 className="text-3xl sm:text-3xl font-black text-slate-800 leading-tight">
                  Hungry on the Train?<br />
                  <span className="text-rose-600">Order in 60 Seconds.</span>
                </h3>
                <p className="text-slate-500 text-base sm:text-sm mt-3 max-w-md font-semibold">
                  Fresh, hot, hygienic meals delivered to your seat at the next station halt. No fuss, no wait.
                </p>
              </div>
              <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
                <button onClick={() => router.push('/menu')}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black text-sm px-8 py-4 rounded-2xl transition-all shadow-lg shadow-rose-600/10 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 group w-full md:w-auto"
                >
                  Order Now
                </button>
                <p className="text-center text-slate-400 text-[10px] font-bold">No login needed · MRP prices</p>
              </div>
            </div>
          </div>

          {/* Feature cards — light */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                bg: 'bg-rose-50', border: 'border-rose-100', iconBg: 'bg-rose-100', icon: Award, iconColor: 'text-rose-600',
                title: 'MRP Price Match',
                desc: 'No hidden markups. Packaged items (water, cold drinks) & meals are delivered exactly at printed retail MRP.',
              },
              {
                bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', icon: Clock, iconColor: 'text-amber-600',
                title: 'Live Train Sync',
                desc: 'We track your train in real-time using NTES data for pinpoint-accurate delivery timing.',
              },
              {
                bg: 'bg-slate-50', border: 'border-slate-200', iconBg: 'bg-slate-100', icon: Coffee, iconColor: 'text-slate-700',
                title: 'Emergency Essentials',
                desc: 'Request hot water, ORS, or baby milk alongside your meals — safety always comes first.',
              },
            ].map(({ bg, border, iconBg, icon: Icon, iconColor, title, desc }) => (
              <div key={title} className={`${bg} border ${border} p-5 sm:p-7 rounded-[24px] flex gap-4 sm:gap-5 hover:shadow-lg hover:-translate-y-0.5 transition-all group`}>
                <div className={`${iconBg} p-3 rounded-2xl h-fit group-hover:scale-110 transition-transform shrink-0`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-800 text-base sm:text-base">{title}</h3>
                  <p className="text-xs sm:text-xs text-slate-550 leading-relaxed font-bold">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PNR INPUT MODAL ── */}
      {showPnrModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-250"
          onClick={() => { setShowPnrModal(false); setModalPnr(''); }}
        >
          <div
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 relative border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => { setShowPnrModal(false); setModalPnr(''); }}
              className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-rose-50 text-rose-600 p-4 rounded-3xl mb-4 shadow-sm">
                <Train className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Enter Your PNR</h2>
              <p className="text-xs text-slate-500 mt-1.5 font-bold max-w-xs">
                To check live stations and display available dining options on your journey.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const cleanPnr = modalPnr.replace(/\D/g, '');
              if (cleanPnr.length !== 10) {
                alert("Please enter a valid 10-digit PNR number.");
                return;
              }
              setShowPnrModal(false);
              setModalPnr('');
              router.push(`/pnr-route?pnr=${cleanPnr}`);
            }} className="space-y-4">
              <div className="relative">
                <Train className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={modalPnr}
                  onChange={(e) => setModalPnr(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit PNR"
                  className="pl-11 pr-4 py-4 w-full bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 font-bold text-slate-800 placeholder-slate-400 text-center tracking-widest text-lg"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-rose-600/10 hover:scale-[1.01] active:scale-[0.99]"
              >
                Proceed &amp; Order
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
