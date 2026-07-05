"use client";
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Train, Clock, Gift, Phone, LogIn, ArrowRight, ShieldCheck, X, Compass, ArrowLeft, User, MapPin } from 'lucide-react';

export default function UserOrdersPage() {
  const router = useRouter();
  const { orders, currentUser, loginUser } = useApp();

  // Local login states (for guest view fallback)
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifyingLogin, setIsVerifyingLogin] = useState(false);

  const handleMockLogin = (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      alert("Please enter a valid 10-digit number.");
      return;
    }
    if (!otpSent) {
      setOtpSent(true);
    } else {
      setIsVerifyingLogin(true);
      setTimeout(() => {
        if (otp === '123456' || otp.length === 6) {
          loginUser(phone);
          setOtpSent(false);
          setPhone('');
          setOtp('');
        } else {
          alert("Verification OTP: 123456");
        }
        setIsVerifyingLogin(false);
      }, 600);
    }
  };

  const userOrders = currentUser
    ? (orders || []).filter(o => {
      const cleanedPhone = p => String(p).replace(/\D/g, '').slice(-10);
      return cleanedPhone(o.phone) === cleanedPhone(currentUser);
    })
    : [];

  return (
    <div className="min-h-screen bg-slate-50 md:py-12 font-sans flex flex-col">
      {/* Sticky/Fixed Header Title with Back Button on Mobile */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 md:relative md:top-auto md:z-0 md:bg-transparent md:border-b-0 md:px-0 md:py-0 md:max-w-4xl md:mx-auto md:w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="md:hidden p-2 hover:bg-slate-105 text-slate-600 hover:text-slate-900 rounded-full transition-all border border-slate-200 bg-white shrink-0 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-left flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 md:gap-2">
              <ShoppingBag className="w-5 h-5 md:w-8 md:h-8 text-rose-600 shrink-0" />
              <span>Track Your Orders</span>
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5 font-semibold leading-tight">
              Real-time status updates from our kitchen dispatch hubs.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-8 pt-4 pb-12 w-full">

        {/* Guest / Not Logged In screen */}
        {!currentUser ? (
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 md:p-12 shadow-xl text-center space-y-6 max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
              <Train className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Login to View Orders</h2>
              <p className="text-[13px] md:text-sm text-slate-550 font-semibold mt-1.5">Enter your registered mobile number to check active bookings.</p>
            </div>

            <form onSubmit={handleMockLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400 text-xs font-bold font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    disabled={otpSent}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit number"
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Enter OTP Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Test OTP: 123456"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 text-center tracking-[0.2em] font-mono font-black text-slate-800"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifyingLogin}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-md transition-colors disabled:bg-slate-300"
              >
                {isVerifyingLogin ? "Verifying..." : (otpSent ? "Verify & Track Orders" : "Send OTP")}
              </button>
            </form>
          </div>
        ) : (
          /* Active orders history grid */
          <div className="space-y-6 animate-fadeIn">
            {userOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-[32px] p-12 text-center space-y-4 shadow-sm">
                <p className="text-slate-455 text-sm font-semibold">No active orders found for +91 {currentUser}.</p>
                <button
                  onClick={() => router.push('/menu')}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow"
                >
                  View Food Menu Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:gap-6">
                {userOrders.map(order => {
                  const steps = ['Placed', 'Preparing', 'Dispatched', 'Delivered'];
                  const activeIdx = steps.indexOf(order.status);

                  return (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">

                      {/* Order Header Bar */}
                      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-rose-400 bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-800/30 uppercase tracking-wider">{order.id}</span>
                          <span className="text-xs text-slate-400 font-bold">{order.timestamp}</span>
                        </div>
                        <span className="text-lg md:text-xl font-black text-white">₹{order.total}</span>
                      </div>

                      <div className="p-4 md:p-6 space-y-5">

                        {/* Coach & Station Info */}
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 uppercase tracking-wider flex items-center gap-1">
                            <Train className="w-3.5 h-3.5 text-slate-500" /> Coach {order.coach}
                          </span>
                          <span className="text-xs font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 uppercase tracking-wider flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-500" /> Berth {order.seat}
                          </span>
                          <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-600" /> {order.stationCode || 'N/A'}
                          </span>
                        </div>

                        {/* Live Tracker Timeline — Mobile Optimized */}
                        <div className="relative pt-2 pb-1">
                          {/* Track line bg */}
                          <div className="absolute top-[22px] md:top-[26px] left-4 right-4 h-[3px] bg-slate-100 rounded-full z-0" />
                          <div
                            className="absolute top-[22px] md:top-[26px] left-4 h-[3px] bg-emerald-500 rounded-full z-0 transition-all duration-500"
                            style={{ width: `calc(${(activeIdx / (steps.length - 1)) * 100}% - 32px)` }}
                          />

                          <div className="relative z-10 flex justify-between px-1">
                            {steps.map((st, idx) => {
                              const isDone = idx <= activeIdx;
                              const isCurrent = idx === activeIdx;
                              return (
                                <div key={st} className="flex flex-col items-center gap-1">
                                  <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center border-2 transition-all ${isDone
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                    : 'bg-white border-slate-200 text-slate-400'
                                    }`}>
                                    {isDone ? (
                                      <span className="text-[9px] md:text-xs font-black">✓</span>
                                    ) : (
                                      <span className="text-[8px] md:text-[10px] font-black">{idx + 1}</span>
                                    )}
                                  </div>
                                  <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider text-center leading-tight ${isCurrent ? 'text-rose-600' : isDone ? 'text-slate-700' : 'text-slate-400'
                                    }`}>
                                    {st}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Items & Requests — stacked on mobile, side by side on desktop */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                          {/* Left Side: Pantry Items */}
                          <div className="space-y-3">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Ordered Items</span>
                            <div className="space-y-1.5 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs md:text-sm font-semibold text-slate-700 py-0.5">
                                  <span className="truncate mr-2">{item.name} × {item.quantity}</span>
                                  <span className="text-slate-900 font-extrabold whitespace-nowrap">₹{item.price * item.quantity}</span>
                                </div>
                              ))}

                              <div className="border-t border-slate-200/60 pt-2 mt-1.5 space-y-1 text-xs md:text-sm">
                                <div className="flex justify-between text-slate-500 font-bold">
                                  <span>Subtotal</span>
                                  <span>₹{order.subtotal || (order.total - (order.delivery || 30))}</span>
                                </div>
                                <div className="flex justify-between text-slate-500 font-bold">
                                  <span>Delivery Fee</span>
                                  <span>₹{order.delivery !== undefined ? order.delivery : 30}</span>
                                </div>
                                {order.isFreeGiftAdded && (
                                  <div className="flex justify-between text-amber-600 font-black items-center">
                                    <span className="flex items-center gap-1.5"><Gift className="w-3.5 h-3.5 text-amber-500" /> {order.freeGiftProduct}</span>
                                    <span>Free</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Payment Badge */}
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 px-3 py-2.5 rounded-xl">
                              <div>
                                <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-wider block">Payment</span>
                                <span className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-wider">{order.paymentMode || 'COD'}</span>
                              </div>
                              {String(order.paymentMode).toUpperCase() === 'ONLINE' ? (
                                <span className="text-xs md:text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-250 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                  ✓ Paid
                                </span>
                              ) : (
                                <span className="text-xs md:text-sm font-black text-amber-700 bg-amber-50 border border-amber-250 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                  ⏱ Pay on Delivery
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Side: Comfort Requests */}
                          <div className="space-y-3">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Comfort Requests</span>
                            {order.onDemandRequests?.length > 0 ? (
                              <div className="space-y-2">
                                {order.onDemandRequests.map((req, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs md:text-sm">
                                    <div className="min-w-0 mr-2">
                                      <span className="font-extrabold text-slate-750 block truncate">{req.name}</span>
                                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{req.price > 0 ? `₹${req.price}` : 'MRP / Free'}</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider border shrink-0 ${req.status === 'Accepted'
                                      ? 'bg-emerald-50 text-emerald-650 border-emerald-150'
                                      : req.status === 'Rejected'
                                        ? 'bg-rose-50 text-rose-650 border-rose-150'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                      }`}>
                                      {req.status || 'Pending'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs md:text-sm text-slate-400 font-bold bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">No comfort requests added.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
