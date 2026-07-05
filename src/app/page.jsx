"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { getPnrStatus, parsePnrData } from '../lib/pnr';
import {
  Search, MapPin, Train, ShieldCheck, Clock, Award, Coffee,
  ChevronRight, Check, Star, ArrowRight, Zap, Utensils, ShoppingBag
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
  const { stations, availableStates, freeProduct, giftThreshold, currentUser, orders } = useApp();

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
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />



      {/* ══ HERO ═════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-slate-200 md:min-h-[calc(100vh-104px)] md:flex md:items-center">

        {/* ── MOBILE LAYOUT ── */}
        <div className="lg:hidden relative w-full">
          {/* Natural-ratio image — no crop, no stretch */}
          <img
            src="/mobile_hero.png"
            alt="Railway food delivery"
            className="w-full h-auto block"
          />
          {/* Bottom gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />

          {/* Text content pinned to bottom of image */}
          <div className="absolute bottom-8 left-0 right-0 z-10 px-4 pb-2 text-center">
            {/* Logo */}
            <div
              className="flex items-center justify-center gap-2 mb-4"
              style={{ filter: 'drop-shadow(1px 2px 4px rgba(0, 0, 0, 0.6))' }}
            >
              <div className="bg-rose-600 text-white font-black text-xl px-3 py-1 rounded-xl flex items-center tracking-wider">
                <span>Bite</span>
                <span className="bg-white text-rose-600 px-1.5 ml-1 rounded-md text-base">OnRail</span>
              </div>
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
                <div key={pos} className={`absolute ${pos} w-2 h-2 rounded-full bg-slate-200 border border-slate-300`} />
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
        <div className="lg:hidden h-14 w-full"></div>

        {/* ── DESKTOP LAYOUT (Original Left-Aligned Sidebar Style) ── */}
        <div className="hidden lg:block absolute inset-0 z-0">
          <img
            src="/herobanner.png"
            alt="Vande Bharat Express train background"
            className="w-full h-full object-cover object-center lg:object-right scale-105"
          />
          {/* Dark overlay for desktop view */}
          <div className="absolute inset-0 bg-black/15" />
        </div>

        {/* Subtle grid on top */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-[1]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px'
          }}
        />

        {/* Desktop text content */}
        <div className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-16">
          <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-3xl mx-auto">

            {/* Route badge */}
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 bg-slate-900 text-amber-400 px-4 py-2 rounded-full border border-slate-800 shadow-md">
                <Train className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">BiteOnRail Express Delivery</span>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white"
                style={{ filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.95)) drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.8))' }}
              >
                Hot Food <span className="bg-gradient-to-r from-rose-400 via-rose-450 to-amber-400 bg-clip-text text-transparent">At Your Berth!</span>
              </h1>
              <p
                className="text-slate-200 text-base max-w-xl mx-auto font-bold leading-relaxed"
                style={{ textShadow: '1px 1px 4px rgba(0, 0, 0, 0.95)' }}
              >
                Hygiene-certified fresh meals delivered to your train seat at the next station halt.
                MRP pricing across <strong className="text-white">{stations.length} major junctions.</strong>
              </p>
            </div>

            {/* Search Card */}
            <div className="bg-white border border-slate-200 rounded-[28px] shadow-lg p-6 w-full max-w-md relative">
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
                    placeholder="Search order, station, brand..."
                    className="pl-11 pr-4 py-4 w-full bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 font-sans font-bold text-slate-800 placeholder-slate-400"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && stationSearch.trim()) {
                        router.push(`/menu?search=${encodeURIComponent(stationSearch)}`);
                      }
                    }}
                  />
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
                      className="pl-11 pr-28 py-4 w-full bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 font-sans font-bold text-slate-800 placeholder-slate-400"
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
        </div>

      </section>

      {/* Rail track section divider */}
      <TrackDivider />

      {/* ══ HOW IT WORKS ═════════════════════════════════════ */}
      <section className="pt-6 pb-12 md:py-24 bg-white relative overflow-hidden border-b border-slate-100">
        {/* Faint vertical track lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: `repeating-linear-gradient(90deg, #0f172a, #0f172a 2px, transparent 2px, transparent 56px)` }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-xl mx-auto mb-8 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-slate-900 text-amber-400 px-4 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest mb-4">
              <Train className="w-3.5 h-3.5" /> 3-Step Process
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              How BiteOnRail Works
            </h2>
            <p className="text-slate-500 text-[15px] sm:text-sm lg:text-base mt-2.5 leading-relaxed">
              Live-tracked hot food delivered from local hygiene-certified kitchens directly to your train seat.
            </p>
          </div>

          {/* Connector rail */}
          <div className="relative">
            {/* Horizontal Track for Desktop */}
            <div className="absolute top-[52px] left-[18%] right-[18%] h-[3px] bg-slate-200 hidden md:block rounded-full" />
            <div className="absolute top-[46px] left-[18%] right-[18%] hidden md:flex justify-around">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="w-3 h-[14px] bg-slate-100 border border-slate-200 rounded-sm" />
              ))}
            </div>

            {/* Vertical Track for Mobile (connects cards vertically through gaps) */}
            <div className="absolute top-[80px] bottom-[80px] left-1/2 -translate-x-1/2 w-[3px] bg-slate-200 md:hidden z-0 rounded-full" />
            <div className="absolute top-[80px] bottom-[80px] left-1/2 -translate-x-1/2 w-3.5 md:hidden flex flex-col justify-between items-center pointer-events-none z-0">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="w-3 h-1 bg-slate-300 border border-slate-200 rounded-xs" />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
              {[
                {
                  num: '01', iconBg: 'bg-slate-900', iconColor: 'text-amber-400',
                  icon: Search, accentFrom: 'from-slate-700', accentTo: 'to-slate-900',
                  title: 'Identify Station', sub: MapPin, subColor: 'text-slate-500',
                  desc: 'Enter your PNR to track your live route and auto-detect all available delivery hubs on your journey.',
                },
                {
                  num: '02', iconBg: 'bg-rose-600', iconColor: 'text-white',
                  icon: Utensils, accentFrom: 'from-rose-500', accentTo: 'to-rose-600',
                  title: 'Browse & Order', sub: ShoppingBag, subColor: 'text-rose-500',
                  desc: `Choose from regional thalis, fast food & snacks — all at exact retail MRP. Free ${freeProduct || 'gift'} on ₹${giftThreshold || 300}+!`,
                },
                {
                  num: '03', iconBg: 'bg-amber-500', iconColor: 'text-white',
                  icon: Train, accentFrom: 'from-amber-400', accentTo: 'to-amber-500',
                  title: 'Berth Delivery', sub: Clock, subColor: 'text-amber-500',
                  desc: 'Our delivery partner will reach your exact seat with hot food. OTP-secured and synchronized with live train status.',
                },
              ].map(({ num, iconBg, iconColor, icon: Icon, accentFrom, accentTo, title, sub: Sub, subColor, desc }) => (
                <div key={num}
                  className="bg-slate-50 border-2 border-slate-200 p-5 sm:p-8 rounded-3xl sm:rounded-[32px] text-center flex flex-col items-center gap-3 sm:gap-4 hover:bg-white hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 relative z-10 group overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentFrom} ${accentTo} opacity-0 group-hover:opacity-100 transition-opacity rounded-t-[30px]`} />
                  <div className="absolute top-4 right-5 text-slate-300 font-black text-xs font-mono tracking-widest group-hover:text-slate-600 transition-colors">{num}</div>
                  <div className={`${iconBg} ${iconColor} p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                    <Icon className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
                  </div>
                  <h4 className="text-sm sm:text-sm md:text-base font-black text-slate-800 flex items-center gap-1.5 justify-center group-hover:text-rose-600 transition-colors">
                    <Sub className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${subColor}`} /> {title}
                  </h4>
                  <p className="text-xs sm:text-xs md:text-sm text-slate-500 leading-relaxed font-semibold">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rail track divider */}
      <TrackDivider light />

      {/* ══ ACTIVE STATIONS ══════════════════════════════════ */}
      <section className="py-12 md:py-24 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-px bg-rose-500" />
                <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-rose-600">Platform Delivery Hubs</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Active Rail Stations</h2>
              <p className="text-slate-500 text-[15px] sm:text-sm lg:text-base mt-1.5">
                Warm meals at <strong className="text-slate-700">{stations.length || 14}</strong> major junctions across India.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center shrink-0 w-full sm:w-auto">
              {/* Search bar for stations */}
              <div className="relative">
                <input
                  type="text"
                  value={stationSearch}
                  onChange={(e) => {
                    setStationSearch(e.target.value);
                    setShowAllStations(false);
                  }}
                  placeholder="Search station name/code..."
                  className="pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 w-full sm:w-56 bg-white font-semibold text-slate-800 shadow-xs"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>

              {/* State Filter Buttons */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1.5 max-w-full shrink-0">
                {['All', ...(availableStates || [])].map(state => (
                  <button key={state} onClick={() => { setSelectedState(state); setShowAllStations(false); }}
                    className={`px-3.5 py-1.5 rounded-lg text-[9px] uppercase tracking-widest font-black border transition-all whitespace-nowrap
                      ${selectedState === state ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-100'}`}
                  >{state}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Boarding-pass station grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
            {displayStations.map(station => (
              <div key={station.id} onClick={() => setShowPnrModal(true)}
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
                      <h3 className="font-black text-slate-800 text-[13px] sm:text-sm group-hover:text-rose-600 transition-colors leading-tight whitespace-normal">{station.name}</h3>
                      <span className="text-[9px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5 truncate">{station.state}</span>
                    </div>
                    <span className="text-sm sm:text-2xl font-black text-slate-900 group-hover:text-rose-600 transition-colors font-mono shrink-0">{station.code}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[10px] font-bold text-emerald-600">
                      <span className="relative flex h-1 sm:h-1.5 w-1 sm:w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1 sm:h-1.5 w-1 sm:w-1.5 bg-emerald-500" />
                      </span>
                      Active
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[10px] font-black text-slate-400 group-hover:text-rose-600 transition-colors uppercase tracking-wider">
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

      {/* ══ FEATURES ═════════════════════════════════════════ */}
      <section className="pt-12 pb-4 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

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
                <button onClick={() => setShowPnrModal(true)}
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
