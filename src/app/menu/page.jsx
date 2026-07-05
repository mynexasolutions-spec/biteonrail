"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import {
  ShoppingCart, ShoppingBag, Plus, Minus, Trash2, HeartHandshake, Gift,
  MapPin, Search, Sparkles, Check, Info, Utensils, ShieldCheck, Flame, Coffee, Pizza,
  Train, BellRing, Compass, Ticket, Tag, X, IndianRupee, ArrowLeft, Calendar, Cookie,
  ChevronLeft, ChevronRight
} from 'lucide-react';

/* ── Inline railway-track SVG divider ── */
function TrackDivider({ light = false }) {
  const rail = light ? "#cbd5e1" : "#e2e8f0";
  const sleeper = light ? "#94a3b8" : "#cbd5e1";
  return (
    <div className="w-full overflow-hidden py-3 select-none pointer-events-none" aria-hidden>
      <svg viewBox="0 0 800 12" className="w-full h-3" preserveAspectRatio="none">
        <rect y="3" width="800" height="2" fill={rail} rx="1" />
        <rect y="7" width="800" height="2" fill={rail} rx="1" />
        {Array.from({ length: 50 }).map((_, i) => (
          <rect key={i} x={i * 16} y="1" width="8" height="10" rx="1" fill={sleeper} />
        ))}
      </svg>
    </div>
  );
}

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stationCode = searchParams.get('station') || '';
  const categoryScrollRef = React.useRef(null);
 
  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = 150;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  const pnr = searchParams.get('pnr') || '';
  const arrTime = searchParams.get('arrTime') || '';
  const trainName = searchParams.get('trainName') || '';
  const trainNumber = searchParams.get('trainNumber') || '';

  const { menuItems, stations, freeProduct, deliveryCharge, giftThreshold } = useApp();
  const [selectedStation, setSelectedStation] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [foodTypeFilter, setFoodTypeFilter] = useState('all'); // 'all', 'veg', 'nonveg'
  const [searchQuery, setSearchQuery] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [cutoffBufferUsed, setCutoffBufferUsed] = useState(60);

  // On-demand custom request inputs
  const [onDemandItems, setOnDemandItems] = useState([
    { name: 'Warm Blanket', price: 50, checked: false, description: 'Freshly washed warm blanket delivered to your berth.' },
    { name: 'Emergency Medical Kit', price: 120, checked: false, description: 'Essential emergency medicines, painkillers, and bandages.' },
    { name: 'Warm Drinking Water', price: 0, checked: false, description: 'Thermos flask containing hot water for kids/elderly.' }
  ]);
  const [customOnDemand, setCustomOnDemand] = useState('');
  const [variantSelectModalItem, setVariantSelectModalItem] = useState(null);

  const getClosedReason = () => {
    if (selectedStation) {
      if (selectedStation.is_active === false) {
        return "Kitchen Suspended: Sorry, food ordering is temporarily suspended by the kitchen manager at this station.";
      }

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      const openTime = selectedStation.open_time || '00:00';
      const closeTime = selectedStation.close_time || '23:59';

      const isTimeInWindow = (current, open, close) => {
        if (open === close) return true;
        if (open < close) {
          return current >= open && current <= close;
        } else {
          return current >= open || current <= close;
        }
      };

      if (!isTimeInWindow(currentTimeStr, openTime, closeTime)) {
        return `Closed Hours: Sorry, the kitchen at this station operates between ${openTime} and ${closeTime}. Current time is outside operation hours.`;
      }
    }
    return `Delivery Cutoff Reached: Sorry! Kitchen has stopped accepting orders for this hub because the train is scheduled to arrive in less than ${cutoffBufferUsed} minutes (or has already departed).`;
  };

  // Fetch station details
  useEffect(() => {
    if (stationCode) {
      const found = stations.find(s => s.code.toLowerCase() === stationCode.toLowerCase());
      if (found) setSelectedStation(found);
    }
  }, [stationCode, stations]);

  // Check station cutoff buffer time and status
  useEffect(() => {
    if (selectedStation) {
      if (selectedStation.is_active === false) {
        setIsClosed(true);
        return;
      }

      // Check operation hours
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      const openTime = selectedStation.open_time || '00:00';
      const closeTime = selectedStation.close_time || '23:59';

      const isTimeInWindow = (current, open, close) => {
        if (open === close) return true;
        if (open < close) {
          return current >= open && current <= close;
        } else {
          // Overnight window (e.g. 10:00 AM to 02:00 AM next day)
          return current >= open || current <= close;
        }
      };

      console.log("DEBUG STATION TIMING WINDOW:", {
        station: selectedStation.name,
        isActive: selectedStation.is_active,
        openTime,
        closeTime,
        currentTimeStr,
        inWindow: isTimeInWindow(currentTimeStr, openTime, closeTime)
      });

      if (!isTimeInWindow(currentTimeStr, openTime, closeTime)) {
        setIsClosed(true);
        return;
      }

      // Buffer cutoff check
      if (arrTime) {
        const bufferMins = selectedStation.buffer_minutes || 60;
        setCutoffBufferUsed(bufferMins);

        const isBookingClosed = (arrivalTimeStr, bufferLimit) => {
          if (!arrivalTimeStr || arrivalTimeStr === '--:--') return false;
          try {
            const [arrHrs, arrMins] = arrivalTimeStr.split(':').map(Number);
            let arrDate = new Date();

            const savedDoj = typeof window !== 'undefined' ? localStorage.getItem("checkout_doj") : '';
            if (savedDoj) {
              let parsedDOJ = null;
              if (savedDoj.includes('-')) {
                const parts = savedDoj.split('-');
                if (parts.length === 3) {
                  if (parts[0].length === 4) {
                    parsedDOJ = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                  } else {
                    parsedDOJ = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                  }
                }
              }
              if (!parsedDOJ || isNaN(parsedDOJ.getTime())) {
                parsedDOJ = new Date(savedDoj);
              }
              if (parsedDOJ && !isNaN(parsedDOJ.getTime())) {
                arrDate = parsedDOJ;
              }
            }
            arrDate.setHours(arrHrs, arrMins, 0, 0);

            const diffMs = arrDate.getTime() - now.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            console.log("DEBUG CUTOFF MINUTES CALCULATION:", {
              now: now.toISOString(),
              arrDate: arrDate.toISOString(),
              diffMins,
              bufferLimit,
              isClosedResult: diffMins < bufferLimit
            });
            return diffMins < bufferLimit;
          } catch (e) {
            console.error("isBookingClosed parsing error:", e);
            return false;
          }
        };

        if (isBookingClosed(arrTime, bufferMins)) {
          setIsClosed(true);
          return;
        }
      }
      setIsClosed(false);
    }
  }, [selectedStation, arrTime]);

  // Client-Side Countdown Timer State & Hook
  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    if (!selectedStation || !arrTime || isClosed) return;

    const calculateCountdown = () => {
      const bufferMins = selectedStation.buffer_minutes || 60;
      const now = new Date();
      const [arrHrs, arrMins] = arrTime.split(':').map(Number);
      let arrDate = new Date();

      const savedDoj = localStorage.getItem("checkout_doj") || '';
      if (savedDoj) {
        let parsedDOJ = null;
        if (savedDoj.includes('-')) {
          const parts = savedDoj.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              parsedDOJ = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            } else {
              parsedDOJ = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
          }
        }
        if (!parsedDOJ || isNaN(parsedDOJ.getTime())) {
          parsedDOJ = new Date(savedDoj);
        }
        if (parsedDOJ && !isNaN(parsedDOJ.getTime())) {
          arrDate = parsedDOJ;
        }
      }
      arrDate.setHours(arrHrs, arrMins, 0, 0);

      // Cutoff time = expected arrival - buffer minutes
      const cutoffTime = new Date(arrDate.getTime() - bufferMins * 60000);
      const diffMs = cutoffTime.getTime() - now.getTime();

      if (diffMs <= 0) {
        setIsClosed(true);
        setTimeLeftStr('Ordering Closed');
        return false;
      }

      const totalSecs = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      // Dynamic Display String according to specifications
      if (totalSecs > 7200) { // More than 2 hours left
        // Format cutoffTime as HH:MM AM/PM
        const timeStr = cutoffTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setTimeLeftStr(`Place order before ${timeStr}`);
      } else {
        // Less than 2 hours left: show active countdown timer
        let displayStr = '';
        if (hrs > 0) {
          displayStr += `${String(hrs).padStart(2, '0')}:`;
        }
        displayStr += `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        setTimeLeftStr(displayStr);
      }
      return true;
    };

    const hasTime = calculateCountdown();
    if (!hasTime) return;

    const timer = setInterval(() => {
      const active = calculateCountdown();
      if (!active) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedStation, arrTime, isClosed]);

  // Load cart from LocalStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("s_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.warn("Failed to parse saved cart:", e);
      }
    }
  }, []);

  const saveCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("s_cart", JSON.stringify(updatedCart));
  };

  const addToCart = (item, selectedVariant = null) => {
    if (item.variants && item.variants.length > 0 && !selectedVariant) {
      setVariantSelectModalItem(item);
      return;
    }

    const productId = selectedVariant ? `${item.id}_${selectedVariant.name.replace(/\s+/g, '')}` : item.id;
    const productName = selectedVariant ? `${item.name} (${selectedVariant.name})` : item.name;
    const productPrice = selectedVariant ? selectedVariant.price : item.price;

    const cartItem = {
      id: productId,
      name: productName,
      price: Number(productPrice),
      mrp: Number(productPrice),
      category: item.category,
      image_url: item.image_url
    };

    const existing = cart.find(c => c.id === cartItem.id);
    if (existing) {
      const updated = cart.map(c => c.id === cartItem.id ? { ...c, quantity: c.quantity + 1 } : c);
      saveCart(updated);
    } else {
      const updated = [...cart, { ...cartItem, quantity: 1 }];
      saveCart(updated);
    }
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find(c => c.id === itemId);
    if (!existing) return;
    if (existing.quantity === 1) {
      const updated = cart.filter(c => c.id !== itemId);
      saveCart(updated);
    } else {
      const updated = cart.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
      saveCart(updated);
    }
  };

  const clearCart = () => {
    saveCart([]);
  };

  // Cart total calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const activeDeliveryFee = subtotal > 0 ? (Number(deliveryCharge) || 0) : 0;
  const total = subtotal + activeDeliveryFee;

  // On-demand selected items
  const selectedOnDemand = onDemandItems.filter(i => i.checked);

  const handleCheckoutProceed = () => {
    if (cart.length === 0) {
      alert("Your cart is empty! Please select some food items.");
      return;
    }

    // Read resolved train details from localStorage as fallbacks
    const resolvedName = trainName || localStorage.getItem("checkout_train_name") || 'N/A';
    const resolvedNumber = trainNumber || localStorage.getItem("checkout_train_number") || 'N/A';

    localStorage.setItem("checkout_subtotal", subtotal.toString());
    localStorage.setItem("checkout_delivery", activeDeliveryFee.toString());
    localStorage.setItem("checkout_total", total.toString());
    localStorage.setItem("checkout_train_name", resolvedName);
    localStorage.setItem("checkout_train_number", resolvedNumber);
    localStorage.setItem("checkout_arr_time", arrTime);

    const onDemandPayload = [
      ...selectedOnDemand.map(item => ({ name: item.name, price: item.price, status: 'Pending' })),
      ...(customOnDemand.trim() ? [{ name: `Alert: ${customOnDemand}`, price: 0, status: 'Pending' }] : [])
    ];
    localStorage.setItem("checkout_ondemand", JSON.stringify(onDemandPayload));

    router.push(`/checkout?station=${stationCode}&pnr=${pnr}&arrTime=${encodeURIComponent(arrTime)}&trainName=${encodeURIComponent(resolvedName)}&trainNumber=${encodeURIComponent(resolvedNumber)}`);
  };

  // Filter Menu list
  const filteredMenu = menuItems.filter(item => {
    const matchesStation = item.station_code && item.station_code.toLowerCase() === stationCode.toLowerCase();
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Veg/Non-Veg filter matching
    const isVeg = item.food_type
      ? (item.food_type === 'veg')
      : (!item.name.toLowerCase().includes('chicken') &&
        !item.name.toLowerCase().includes('mutton') &&
        !item.name.toLowerCase().includes('non veg') &&
        !item.name.toLowerCase().includes('non-veg') &&
        !item.name.toLowerCase().includes('meat') &&
        !item.name.toLowerCase().includes('egg') &&
        !item.name.toLowerCase().includes('fish'));

    let matchesFoodType = true;
    if (foodTypeFilter === 'veg') {
      matchesFoodType = isVeg && item.food_type !== '';
    } else if (foodTypeFilter === 'nonveg') {
      matchesFoodType = !isVeg && item.food_type !== '';
    } else if (foodTypeFilter === 'standard') {
      matchesFoodType = item.food_type === '';
    }

    return matchesStation && matchesCategory && matchesSearch && matchesFoodType && item.available;
  });

  // Get active categories for this station dynamically
  const stationCategories = React.useMemo(() => {
    if (!menuItems) return ['All'];
    const activeCats = menuItems
      .filter(item => item.station_code && item.station_code.toLowerCase() === stationCode.toLowerCase() && item.available)
      .map(item => item.category);
    return ['All', ...Array.from(new Set(activeCats))];
  }, [menuItems, stationCode]);

  // Helper to render Category Icons
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'All': return <Sparkles className="w-4 h-4" />;
      case 'Meals': return <Pizza className="w-4 h-4" />;
      case 'Fast Food': return <Flame className="w-4 h-4" />;
      case 'Snacks': return <Cookie className="w-4 h-4" />;
      case 'Drinks': return <Coffee className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  const getCategoryCount = (category) => {
    if (!menuItems) return 0;
    const stationItems = menuItems.filter(item => item.station_code && item.station_code.toLowerCase() === stationCode.toLowerCase() && item.available);
    if (category === 'All') {
      return stationItems.length;
    }
    return stationItems.filter(item => item.category === category).length;
  };

  const getCategoryColor = (category, isActive) => {
    if (!isActive) return 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm';

    switch (category) {
      case 'All':
        return 'bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white shadow-md shadow-indigo-600/25';
      case 'Meals':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 border-transparent text-white shadow-md shadow-orange-500/25';
      case 'Fast Food':
        return 'bg-gradient-to-r from-red-600 to-rose-500 border-transparent text-white shadow-md shadow-red-500/25';
      case 'Snacks':
        return 'bg-gradient-to-r from-yellow-500 to-amber-500 border-transparent text-white shadow-md shadow-amber-500/25';
      case 'Drinks':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 border-transparent text-white shadow-md shadow-blue-500/25';
      default:
        return 'bg-gradient-to-r from-rose-600 to-pink-500 border-transparent text-white shadow-md shadow-rose-600/25';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[74px] md:pt-8 pb-40 md:pb-8 min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/10 to-slate-50 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-none::-webkit-scrollbar {
          display: none !important;
        }
        .scrollbar-none {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />      {/* 📱 Mobile Sticky Top Navbar (Visible only on mobile) */}
      <div className="md:hidden bg-white border-b border-slate-200 p-3 shadow-xs fixed top-0 left-0 right-0 z-50 flex flex-row items-center gap-3 w-full">
        {/* Back Button */}
        <Link
          href="/"
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-655 hover:text-slate-800 transition-colors shrink-0 flex items-center justify-center border border-slate-205"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700" />
        </Link>
        {/* Station Details */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="bg-rose-50 text-rose-600 p-1.5 rounded-lg border border-rose-100 shrink-0 shadow-xs">
            <Train className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="space-y-1 min-w-0">
            <h1 className="text-sm font-black text-slate-900 truncate">
              {selectedStation ? selectedStation.name : 'Station Hub'}
            </h1>
            <div className="flex flex-col gap-1 items-start">
              <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                <span className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono uppercase border border-slate-205">
                  {stationCode || 'N/A'}
                </span>
                {arrTime && (
                  <span className="text-rose-650 bg-rose-50 border border-rose-150 px-1 py-0.5 rounded uppercase">
                    ETA: {arrTime}
                  </span>
                )}
              </div>
              {timeLeftStr && (
                <span className={`px-1.5 py-0.5 rounded uppercase text-[8px] font-black tracking-wider flex items-center gap-0.5 border ${
                  isClosed ? 'bg-red-50 text-red-655 border-red-100' : 'bg-amber-50 text-amber-800 border-amber-200/60'
                }`}>
                  ⏱ {isClosed ? 'Ordering Closed' : (timeLeftStr.startsWith('Place') ? timeLeftStr : `Closes in: ${timeLeftStr}`)}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* PNR Details / Delivery Status Badge */}
        <div className="shrink-0">
          {pnr ? (
            <div className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl text-left shadow-xs">
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">PNR</span>
              <span className="font-mono text-[10px] font-black text-slate-800 tracking-wider block mt-0.5">{pnr}</span>
            </div>
          ) : (
            <div className="bg-emerald-50/60 border border-emerald-250 px-2 py-1 rounded-xl text-center shadow-xs">
              <span className="text-[7px] text-emerald-800 font-black uppercase tracking-wider block">Direct Delivery</span>
            </div>
          )}
        </div>
      </div>

      {/* 💻 Desktop Station Header Card (Visible only on desktop/tablets) */}
      <div className="hidden md:flex bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Background ambient glow */}
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4 flex-1">
          <div className="bg-rose-50 text-rose-600 p-3.5 rounded-2xl border border-rose-100 shrink-0 shadow-xs">
            <Train className="w-6 h-6 text-rose-600" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {selectedStation ? selectedStation.name : 'Station Hub'}
            </h1>
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 font-bold">
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono uppercase border border-slate-200">
                {stationCode || 'N/A'}
              </span>
              {selectedStation && (
                <span className="text-slate-400">
                  • {selectedStation.state}
                </span>
              )}
              {arrTime && (
                <span className="text-rose-600 bg-rose-50 border border-rose-150 px-2 py-0.5 rounded uppercase ml-1">
                  ETA: {arrTime}
                </span>
              )}
              {timeLeftStr && (
                <span className={`px-2.5 py-0.5 rounded uppercase font-black text-[10px] tracking-wider flex items-center gap-1 border ${
                  isClosed ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-550/10 text-amber-800 border-amber-500/20'
                }`}>
                  ⏱ {isClosed ? 'Ordering Closed' : (timeLeftStr.startsWith('Place') ? timeLeftStr : `Order Closes in: ${timeLeftStr}`)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* PNR Details / Delivery Status Badge */}
        <div className="shrink-0 flex items-center">
          {pnr ? (
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-left min-w-[180px] shadow-xs">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">PASSENGER PNR</span>
              <span className="font-mono text-sm font-black text-slate-800 tracking-wider block mt-0.5">{pnr}</span>
            </div>
          ) : (
            <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-2xl text-left min-w-[180px] shadow-xs">
              <span className="text-[9px] text-emerald-800 font-black uppercase tracking-wider block">Delivery Status</span>
              <span className="text-xs font-bold text-emerald-800 block mt-0.5">Direct Station Delivery</span>
            </div>
          )}
        </div>
      </div>

      {/* Railway Track divider */}
      <TrackDivider light />

      {/* MRP Packaged Items Info Banner */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 mb-6 text-xs text-amber-900 font-semibold flex items-center gap-2.5 shadow-xs">
        <span className="bg-amber-500 text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shrink-0 flex items-center justify-center">
          <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </span>
        <div className="text-[10px] sm:text-xs leading-snug">
          <span className="font-extrabold text-amber-955 mr-1">Packaged Items:</span>
          <span className="text-amber-800 font-bold">Drinks, water, and snacks are delivered strictly at printed MRP.</span>
        </div>
      </div>

      {isClosed && (() => {
        const reasonText = getClosedReason();
        const isSuspended = reasonText.startsWith("Kitchen Suspended");
        const isHours = reasonText.startsWith("Closed Hours");
        return (
          <div className="bg-rose-50 border border-rose-250 text-rose-950 px-6 py-4 rounded-3xl mb-6 flex items-start gap-3.5 shadow-sm">
            <div className="bg-rose-100 text-rose-700 p-2.5 rounded-2xl border border-rose-150 shrink-0">
              <Info className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-wider text-rose-700">
                {isSuspended ? '🛑 Kitchen Suspended' : isHours ? '🕒 Operational Hours Closed' : '⏱ Delivery Cutoff Reached'}
              </h4>
              <p className="text-xs text-rose-800 font-semibold mt-0.5 leading-relaxed">
                {reasonText.substring(reasonText.indexOf(':') + 2)}
              </p>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">

        {/* Left Side: Categories & Menu list */}
        <div className="lg:col-span-8 space-y-8">

          {/* Category Filters & Search */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">

            {/* Row 1: Horizontal Categories Scrolling Pills */}
            <div className="relative flex items-center">
              {/* Left Arrow Icon for laptop */}
              <button
                onClick={() => scrollCategories('left')}
                className="hidden md:flex items-center justify-center p-2 rounded-full bg-slate-100/90 border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shrink-0 mr-2 active:scale-90"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
 
              <div ref={categoryScrollRef} className="flex-1 flex gap-2 overflow-x-auto w-full pb-1 scrollbar-none relative z-10">
                {stationCategories.map(cat => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`group px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-xs sm:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 flex items-center gap-2.5 border transform active:scale-98 shrink-0 ${getCategoryColor(cat, isActive)}`}
                    >
                      <span className="transition-transform duration-300 group-hover:scale-115 shrink-0">
                        {getCategoryIcon(cat)}
                      </span>
                      <span>{cat}</span>
                      <span className={`ml-0.5 px-2 py-0.5 text-[10px] font-black rounded-full transition-all duration-300 ${isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                        }`}>
                        {getCategoryCount(cat)}
                      </span>
                    </button>
                  );
                })}
              </div>
 
              {/* Right Arrow Icon for laptop */}
              <button
                onClick={() => scrollCategories('right')}
                className="hidden md:flex items-center justify-center p-2 rounded-full bg-slate-100/90 border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shrink-0 ml-2 active:scale-90"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Row 2: Search Bar + Food Type filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">

              {/* Search input */}
              <div className="relative flex-1 z-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pantry menu..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder-slate-400 font-bold bg-slate-50/50 focus:bg-white"
                />
              </div>

              {/* Veg / Non-veg Quick Toggles */}
              <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0">

                <button
                  onClick={() => setFoodTypeFilter(foodTypeFilter === 'veg' ? 'all' : 'veg')}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 shrink-0 ${foodTypeFilter === 'veg'
                    ? 'bg-emerald-600 border-emerald-655 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                    }`}
                >
                  <span className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${foodTypeFilter === 'veg' ? 'border-white' : 'border-emerald-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full block ${foodTypeFilter === 'veg' ? 'bg-white' : 'bg-emerald-600'}`} />
                  </span>
                  Veg Only
                </button>

                <button
                  onClick={() => setFoodTypeFilter(foodTypeFilter === 'nonveg' ? 'all' : 'nonveg')}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 shrink-0 ${foodTypeFilter === 'nonveg'
                    ? 'bg-amber-900 border-amber-955 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                    }`}
                >
                  <span className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${foodTypeFilter === 'nonveg' ? 'border-white' : 'border-amber-800'}`}>
                    <svg className={`w-1.5 h-1.5 ${foodTypeFilter === 'nonveg' ? 'fill-white' : 'fill-amber-900'}`} viewBox="0 0 100 100">
                      <polygon points="50,15 90,85 10,85" />
                    </svg>
                  </span>
                  Non-Veg
                </button>

                <button
                  onClick={() => setFoodTypeFilter(foodTypeFilter === 'standard' ? 'all' : 'standard')}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 shrink-0 ${foodTypeFilter === 'standard'
                    ? 'bg-slate-700 border-slate-750 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                    }`}
                >
                  <span className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${foodTypeFilter === 'standard' ? 'border-white' : 'border-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full block ${foodTypeFilter === 'standard' ? 'bg-white' : 'bg-slate-400'}`} />
                  </span>
                  Standard
                </button>

              </div>
            </div>

          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {filteredMenu.map(item => {
              const hasVariants = item.variants && item.variants.length > 0;
              const cartItemsForThisProduct = cart.filter(c => c.id === item.id || (c.id && c.id.toString().startsWith(`${item.id}_`)));
              const totalQuantity = cartItemsForThisProduct.reduce((sum, c) => sum + c.quantity, 0);
              const cartItem = totalQuantity > 0 ? { quantity: totalQuantity } : null;
              const hasType = item.food_type !== '';
              const isVeg = item.food_type
                ? (item.food_type === 'veg')
                : (!item.name.toLowerCase().includes('chicken') &&
                  !item.name.toLowerCase().includes('mutton') &&
                  !item.name.toLowerCase().includes('non veg') &&
                  !item.name.toLowerCase().includes('non-veg') &&
                  !item.name.toLowerCase().includes('meat') &&
                  !item.name.toLowerCase().includes('egg') &&
                  !item.name.toLowerCase().includes('fish'));
              return (
                <div key={item.id} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-150 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-row sm:flex-col justify-between overflow-hidden relative group">
                  {/* Aspect Ratio square layout image top/left */}
                  <div className="relative w-24 h-24 sm:w-full sm:h-auto sm:aspect-square bg-slate-100 overflow-hidden shrink-0 rounded-xl sm:rounded-none m-3 sm:m-0 shadow-xs sm:shadow-none self-center sm:self-auto">
                    {item.image_url || item.image ? (
                      <img
                        src={item.image_url || item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="text-slate-355 bg-gradient-to-br from-rose-500/5 to-amber-500/5 w-full h-full flex flex-col items-center justify-center gap-2">
                        <Utensils className="w-6 h-6 sm:w-8 sm:h-8 text-rose-200/80" />
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">{item.category}</span>
                      </div>
                    )}

                    {/* Floating Indicators for Desktop */}
                    <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 hidden sm:flex items-center gap-1 z-10">
                      <span className="text-[9px] bg-slate-900/80 text-white font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-sm">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Info details */}
                  <div className="p-3 pl-1.5 sm:p-5 flex-1 flex flex-col justify-between gap-2 sm:gap-3 min-w-0">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-800 text-sm sm:text-sm tracking-tight leading-snug group-hover:text-rose-600 transition-colors flex items-center gap-1.5">
                        {hasType && (
                          <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${isVeg ? 'border-emerald-600' : 'border-amber-800'}`}>
                            {isVeg ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
                            ) : (
                              <svg className="w-1.5 h-1.5 fill-amber-800" viewBox="0 0 100 100">
                                <polygon points="50,15 90,85 10,85" />
                              </svg>
                            )}
                          </span>
                        )}
                        <span className="line-clamp-1 sm:line-clamp-2">{item.name}</span>
                      </h3>
                      <p className="text-xs sm:text-[11px] text-slate-450 leading-normal sm:leading-relaxed line-clamp-2 font-medium mt-0.5">
                        {item.description || 'Tasty meal prepared with standard safety guidelines.'}
                      </p>
                    </div>

                    <div className="flex flex-row items-center justify-between pt-1.5 sm:pt-2 sm:border-t border-slate-100 text-xs gap-2">
                      <span className="font-black text-slate-905 text-sm sm:text-sm font-mono shrink-0">
                        {item.variants && item.variants.length > 0 ? `₹${item.variants[0].price}+` : `₹${item.price}`}
                      </span>

                      {isClosed ? (
                        <button
                          disabled
                          className="bg-slate-50 text-slate-400 text-xs sm:text-xs font-black uppercase tracking-wider py-1.5 rounded-xl cursor-not-allowed border border-slate-200 w-20 sm:w-24 text-center shrink-0"
                        >
                          Closed
                        </button>
                      ) : cartItem ? (
                        <div className="flex items-center justify-between bg-rose-600 text-white rounded-xl py-1 px-1.5 sm:py-1.5 sm:px-2.5 shadow-md shadow-rose-600/10 animate-scaleIn w-20 sm:w-24 shrink-0">
                          <button
                            onClick={() => {
                              if (hasVariants) {
                                const lastAdded = cartItemsForThisProduct[cartItemsForThisProduct.length - 1];
                                if (lastAdded) removeFromCart(lastAdded.id);
                              } else {
                                removeFromCart(item.id);
                              }
                            }}
                            className="p-0.5 hover:bg-rose-700/50 rounded transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
                          </button>
                          <span className="text-xs sm:text-xs font-black min-w-3 text-center">{cartItem.quantity}</span>
                          <button onClick={() => addToCart(item)} className="p-0.5 hover:bg-rose-700/50 rounded transition-colors">
                            <Plus className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-rose-550/5 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-200/80 text-xs sm:text-xs font-black uppercase tracking-wider py-1.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-0.5 shadow-xs w-20 sm:w-24 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 shrink-0" /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Side: Perforated Invoice Cart */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-visible sticky top-24">

            {/* Ticket upper header */}
            <div className="bg-slate-900 text-white rounded-t-3xl p-5 flex justify-between items-center border-b border-slate-800">
              <h2 className="font-black text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-405" /> PANTRY ORDER CART
              </h2>
              <span className="font-mono text-xs text-slate-400 font-bold">STATION: {stationCode || 'ALL'}</span>
            </div>

            {/* Perforated ticket notch */}
            <div className="flex items-center gap-0 -my-0.5 bg-white relative z-10">
              <div className="w-3 h-3 rounded-full bg-slate-50 border border-slate-200 shrink-0 -ml-1.5 shadow-inner" />
              <div className="flex-1 border-t border-dashed border-slate-200" />
              <div className="w-3 h-3 rounded-full bg-slate-50 border border-slate-200 shrink-0 -mr-1.5 shadow-inner" />
            </div>

            <div className="p-6 space-y-6">
              {/* Cart Items List */}
              {cart.length > 0 ? (
                <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex-1 pr-3">
                        <h4 className="font-bold text-slate-800 tracking-tight">{item.name}</h4>
                        <span className="text-[10px] text-slate-450 font-medium">₹{item.price} &times; {item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white border border-slate-250 rounded-lg px-1.5 py-0.5 shadow-sm">
                        <button onClick={() => removeFromCart(item.id)} className="p-0.5 hover:bg-slate-100 rounded text-slate-550 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-black text-slate-700 min-w-3 text-center">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="p-0.5 hover:bg-slate-100 rounded text-slate-550 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border border-slate-150">
                    <ShoppingBag className="w-6 h-6 text-slate-350" />
                  </div>
                  <p className="font-medium text-slate-500">Pantry cart is empty.<br />Add hot snacks to start ordering!</p>
                </div>
              )}

              {/* Progress bar towards Free Gift */}
              {subtotal > 0 && subtotal < (giftThreshold || 300) && (
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-slate-650">
                    <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5 text-rose-500" /> Free Gift Progress</span>
                    <span>₹{subtotal} / ₹{giftThreshold || 300}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min((subtotal / (giftThreshold || 300)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-450 font-semibold">Add ₹{(giftThreshold || 300) - subtotal} more to unlock a free <strong className="text-rose-600">{freeProduct}</strong>!</p>
                </div>
              )}

              {/* Special Free Gift Alert */}
              {subtotal >= (giftThreshold || 300) && (
                <div className="bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent border border-amber-200 rounded-2xl p-4 text-slate-800 text-xs flex gap-3 items-start animate-pulse">
                  <Gift className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-amber-700 uppercase tracking-wider block">Eligible for Free Gift! 🎁</span>
                    <p className="text-slate-650 font-medium mt-0.5">Delivery partner will bring your free <strong className="text-rose-650">{freeProduct}</strong> free of charge.</p>
                  </div>
                </div>
              )}

              {/* Price Calculations */}
              <div className="space-y-3 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                <div className="flex justify-between">
                  <span>Pantry Subtotal</span>
                  <span className="text-slate-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Berth Delivery Fee</span>
                  <span className={`font-black ${activeDeliveryFee === 0 ? 'text-emerald-600 font-bold' : 'text-slate-800'}`}>
                    {activeDeliveryFee === 0 ? 'Free' : `₹${activeDeliveryFee}`}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-black text-slate-800 border-t border-slate-150 pt-3">
                  <span>Total Payable</span>
                  <span className="text-rose-600 text-base">₹{total}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleCheckoutProceed}
                  disabled={cart.length === 0 || isClosed}
                  className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black uppercase tracking-wider py-3 rounded-2xl transition-all shadow-md text-xs flex items-center justify-center gap-1.5"
                >
                  {isClosed ? 'Ordering Closed' : 'PROCEED TO SEAT DETAILS'}
                </button>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Dynamic Sizing Variant Selection Modal */}
      {variantSelectModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-250 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl space-y-5 animate-scaleIn">

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded font-black uppercase tracking-wider">
                  Select Size
                </span>
                <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1">{variantSelectModalItem.name}</h3>
              </div>
              <button
                onClick={() => setVariantSelectModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-550 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-normal font-semibold">
              {variantSelectModalItem.description || 'Tasty meal prepared with standard safety guidelines.'}
            </p>

            <div className="space-y-2.5 pt-1">
              {variantSelectModalItem.variants && variantSelectModalItem.variants.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    addToCart(variantSelectModalItem, v);
                    setVariantSelectModalItem(null);
                  }}
                  className="w-full flex justify-between items-center bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 p-4 rounded-2xl transition-all text-xs font-bold text-slate-800 hover:text-rose-700 hover:scale-[1.01] shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{v.name}</span>
                  </span>
                  <span className="text-rose-600 font-black text-sm">₹{v.price}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 text-center">
              <button
                onClick={() => setVariantSelectModalItem(null)}
                className="text-[10px] text-slate-450 hover:text-slate-650 font-black uppercase tracking-wider"
              >
                Go Back
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Sticky Bottom Checkout Bar for Mobile (Premium Light Theme style) */}
      {cart.length > 0 && !isClosed && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md text-slate-800 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] border-t border-slate-150 animate-slideUp flex flex-col">

          {/* Free Gift Promo Strip */}
          <div className="bg-amber-500/10 border-b border-amber-500/5 px-5 py-1.5 text-xs font-bold text-amber-800 text-center flex items-center justify-center gap-1">
            <Gift className="w-3 h-3 text-amber-600 shrink-0" />
            {subtotal < (giftThreshold || 300) ? (
              <span>Add <strong className="font-black">₹{(giftThreshold || 300) - subtotal}</strong> more to unlock a free <strong className="text-rose-600 font-black">{freeProduct}</strong>!</span>
            ) : (
              <span className="text-emerald-700"><strong className="font-black text-emerald-800">FREE GIFT UNLOCKED!</strong> Delivery partner will bring your free <strong className="text-rose-600 font-black">{freeProduct}</strong>. 🎁</span>
            )}
          </div>

          <div className="p-4 px-5 pb-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-550 font-extrabold uppercase tracking-wider">Total Payable</span>
              <span className="text-rose-600 font-black text-base font-mono">₹{total}</span>
            </div>
            <button
              onClick={handleCheckoutProceed}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Proceed ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Menu() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest animate-pulse">Loading Menu...</p>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
