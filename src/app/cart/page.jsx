"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { 
  ShoppingBag, Plus, Minus, Trash2, ArrowLeft, ArrowRight, Gift, 
  MapPin, Clock, Train, ClipboardList, ShieldCheck, Ticket 
} from 'lucide-react';

function CartPageContent() {
  const router = useRouter();
  const { stations, freeProduct, deliveryCharge, giftThreshold } = useApp();

  const [cart, setCart] = useState([]);
  const [stationCode, setStationCode] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);
  const [trainNo, setTrainNo] = useState('');
  const [trainName, setTrainName] = useState('');
  const [arrTime, setArrTime] = useState('');
  const [doj, setDoj] = useState('');

  // Load cart and details from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCart = localStorage.getItem("s_cart");
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
        
        const code = localStorage.getItem("selected_station_code") || '';
        setStationCode(code);
        
        setTrainNo(localStorage.getItem("checkout_train_number") || '');
        setTrainName(localStorage.getItem("checkout_train_name") || '');
        setArrTime(localStorage.getItem("checkout_arr_time") || '');
        setDoj(localStorage.getItem("checkout_doj") || '');
      } catch (e) {
        console.error("Failed to load cart data:", e);
      }
    }
  }, []);

  // Update selected station details when stationCode or stations list loads
  useEffect(() => {
    if (stationCode && stations?.length > 0) {
      const match = stations.find(s => s.code.toUpperCase() === stationCode.toUpperCase());
      setSelectedStation(match || null);
    }
  }, [stationCode, stations]);

  // Sync cart helper
  const syncCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("s_cart", JSON.stringify(updatedCart));
    
    // Calculate subtotal
    const sub = updatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const activeDelivery = sub > 0 ? (deliveryCharge || 30) : 0;
    const tot = sub + activeDelivery;
    
    localStorage.setItem("checkout_subtotal", String(sub));
    localStorage.setItem("checkout_delivery", String(activeDelivery));
    localStorage.setItem("checkout_total", String(tot));
  };

  const updateQuantity = (index, delta) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    syncCart(updated);
  };

  const removeItem = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    syncCart(updated);
  };

  const clearCart = () => {
    syncCart([]);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const activeDeliveryFee = subtotal > 0 ? (deliveryCharge || 30) : 0;
  const total = subtotal + activeDeliveryFee;
  const isFreeGiftUnlocked = subtotal >= (giftThreshold || 300);

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    
    // Check if station code is configured
    if (!stationCode) {
      router.push('/search');
      return;
    }

    router.push(`/checkout?station=${stationCode}&arrTime=${encodeURIComponent(arrTime)}&trainName=${encodeURIComponent(trainName)}&trainNumber=${encodeURIComponent(trainNo)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 pt-16 md:pt-8 font-sans relative overflow-hidden">
      {/* Decorative ambient background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-rose-100/50 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] bg-amber-50/60 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* 📱 Mobile Sticky Top Navbar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 shadow-xs fixed top-0 left-0 right-0 z-50 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-800 transition-colors border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-black tracking-tight text-slate-900">Your Basket</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            {cart.length} Items Selected
          </p>
        </div>
        {cart.length > 0 && (
          <button 
            onClick={clearCart}
            className="text-[10px] font-black text-rose-650 uppercase tracking-wider bg-rose-50 border border-rose-100 px-2.5 py-1.5 rounded-lg"
          >
            Clear
          </button>
        )}
      </div>
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-9 h-9 text-rose-600" /> Shopping Basket
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-bold">Review items selected from train pantry hubs before checking out.</p>
          </div>
          <button
            onClick={() => router.push(stationCode ? `/menu?station=${stationCode}` : '/')}
            className="inline-flex items-center gap-1.5 text-xs md:text-sm font-black text-rose-600 hover:text-rose-700 bg-white border border-slate-200 px-5 py-3 rounded-xl shadow-xs transition-all hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Add More Items
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 md:p-16 text-center space-y-6 shadow-sm mt-8 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight">Your Basket is Empty</h3>
              <p className="text-xs md:text-sm text-slate-550 font-semibold leading-relaxed max-w-xs mx-auto">
                No delicious meals added yet. Explore active stations along your train route to order fresh food.
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-550 active:scale-95 text-white font-black text-xs md:text-sm uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-md shadow-rose-200"
            >
              Browse Stations <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 md:mt-0">
            {/* Left Column: Basket Items List */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Active station header banner */}
              {selectedStation && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm flex items-center gap-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 md:w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">Junction Selection</p>
                      <h4 className="text-xs sm:text-sm md:text-base font-black text-slate-800 truncate leading-tight mt-0.5">{selectedStation.name} ({selectedStation.code})</h4>
                    </div>
                  </div>
                </div>
              )}

              {/* Free Gift Promo Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-xs flex items-center gap-3.5">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                  isFreeGiftUnlocked ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                }`}>
                  <Gift className="w-5 h-5 md:w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm md:text-base font-black text-slate-800 tracking-tight">
                    {isFreeGiftUnlocked ? 'Free Gift Unlocked! 🎁' : 'Free Gift Incentive'}
                  </h4>
                  <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5 leading-relaxed">
                    {isFreeGiftUnlocked 
                      ? `Our delivery partner will bring your free ${freeProduct} with this order!` 
                      : `Add ₹${(giftThreshold || 300) - subtotal} more worth of items to unlock a free ${freeProduct}!`
                    }
                  </p>
                </div>
              </div>

              {/* Items Card List */}
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm divide-y divide-slate-100 overflow-hidden">
                {cart.map((item, index) => (
                  <div key={item.id} className="p-4 sm:p-5 md:p-6 flex items-center gap-4 hover:bg-slate-50/30 transition-colors">
                    
                    {/* Item Image */}
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 object-cover rounded-2xl border border-slate-200 shrink-0 shadow-sm" 
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-slate-100 text-slate-450 border border-slate-200 rounded-2xl flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] md:text-xs text-slate-450 font-bold uppercase tracking-wider block">{item.category}</span>
                      <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm md:text-base truncate mt-0.5 leading-snug">{item.name}</h4>
                      <p className="font-black text-rose-600 text-xs sm:text-sm md:text-base mt-1">₹{item.price}</p>
                    </div>

                    {/* Quantity selectors */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/50 p-1 md:p-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, -1)}
                          className="p-1 hover:bg-white text-slate-655 hover:text-slate-900 rounded-lg transition-all"
                        >
                          <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                        <span className="px-3 text-xs sm:text-sm md:text-base font-black text-slate-800 font-mono w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, 1)}
                          className="p-1 hover:bg-white text-slate-655 hover:text-slate-900 rounded-lg transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-slate-400 hover:text-rose-600 border border-slate-100 hover:border-rose-100 hover:bg-rose-50/50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Invoice / Checkout Details */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Billing Summary Box */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 md:p-7 shadow-sm space-y-5">
                <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">Bill Details</h3>
                
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs md:text-sm font-bold text-slate-550">
                    <span>Items Subtotal</span>
                    <span className="font-mono text-slate-700">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs md:text-sm font-bold text-slate-550">
                    <span>Berth Delivery Fee</span>
                    <span className="font-mono text-slate-700">₹{activeDeliveryFee}</span>
                  </div>
                  {isFreeGiftUnlocked && (
                    <div className="flex justify-between items-center text-xs md:text-sm font-bold text-emerald-600">
                      <span>Free Gift ({freeProduct})</span>
                      <span className="uppercase text-[9px] md:text-xs bg-emerald-50 px-2 py-0.5 rounded font-black border border-emerald-100">Unlocked</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-wider">Grand Total</span>
                  <span className="text-lg md:text-2xl font-black text-rose-600 font-mono">₹{total}</span>
                </div>

                {/* Secure checkout info */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 md:p-4 text-[10px] md:text-xs text-slate-500 font-bold flex gap-2 leading-relaxed">
                  <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-rose-600 shrink-0 mt-0.5" />
                  <span>Your payment options are fully secure. Pay via Cash on Delivery (COD) or UPI at checkout.</span>
                </div>

                {/* Main Action Button */}
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="w-full bg-rose-600 hover:bg-rose-550 active:scale-95 text-white font-black py-4 rounded-2xl text-xs sm:text-sm md:text-base uppercase tracking-wider transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-1.5"
                >
                  <span>Proceed to Seat Details</span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              {/* Back to Pantry Link */}
              <button
                onClick={() => router.push(stationCode ? `/menu?station=${stationCode}` : '/')}
                className="w-full bg-white border border-slate-200 hover:bg-slate-50/50 text-slate-700 font-extrabold py-3.5 rounded-2xl text-xs md:text-sm uppercase tracking-wider transition-all text-center block shadow-xs"
              >
                Back to Pantry Menu
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest animate-pulse">Loading Basket...</p>
      </div>
    }>
      <CartPageContent />
    </Suspense>
  );
}
