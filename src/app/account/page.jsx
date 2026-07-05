"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { User, Phone, ShoppingBag, HelpCircle, LogOut, ShieldCheck, ChevronRight, Lock, MessageSquare } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { currentUser, loginUser, logoutUser } = useApp();
  const [phoneInput, setPhoneInput] = useState('');
  const [faqOpen, setFaqOpen] = useState(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!otpSent) {
      if (phoneInput.length < 10) {
        setLoginError("Please enter a valid 10-digit mobile number");
        return;
      }
      setOtpSent(true);
    } else {
      if (otpInput === '123456' || otpInput.length === 6) {
        loginUser(phoneInput);
        setOtpSent(false);
        setPhoneInput('');
        setOtpInput('');
      } else {
        setLoginError("Invalid OTP. Use mock OTP: 123456");
      }
    }
  };

  const toggleFaq = (index) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const faqs = [
    {
      q: "How does seat delivery work?",
      a: "Our delivery partner receives your live coach/berth details via your PNR or checkout inputs and brings the hot food directly to your train berth when the train reaches the platform."
    },
    {
      q: "What if the train is running delayed?",
      a: "No worries! Our backend system is synchronized with live train status. We monitor platform arrival times in real-time and prepare/deliver food accordingly."
    },
    {
      q: "Can I pay Cash on Delivery (COD)?",
      a: "Yes, COD is fully supported. You can pay our delivery partner via Cash, UPI, or Cards once the food is successfully delivered to your seat."
    },
    {
      q: "Are the food packages hygienic?",
      a: "Absolutely. All food is sourced from hygiene-certified local kitchens. Meals are packed in premium food-grade containers to ensure freshness and safety."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12 selection:bg-rose-600 selection:text-white font-sans">
      <div className="max-w-md md:max-w-6xl mx-auto px-4 pt-10 md:pt-24 pb-12">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Profile</h1>
          {currentUser ? (
            <button
              onClick={() => {
                logoutUser();
                router.push('/');
              }}
              className="md:hidden text-[10px] text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100/60 font-black uppercase px-3.5 py-1.5 rounded-full tracking-wider transition-all flex items-center gap-1 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" /> Log Out
            </button>
          ) : (
            <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider">
              BiteOnRail App
            </span>
          )}
        </div>

        {/* Dynamic layout wrapper */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (Login Form or User Profile details) */}
          <div className="md:col-span-4 space-y-5">
            {!currentUser ? (
              /* NOT LOGGED IN LOGIN CARD */
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 max-w-md mx-auto">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Login to your Account</h2>
                  <p className="text-[13px] md:text-sm text-slate-550 max-w-xs mx-auto">
                    Enter your mobile number to view active orders, request support, and unlock fast checkouts.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-1 tracking-wider">Mobile Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400 font-mono">+91</span>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        disabled={otpSent}
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 10-digit number"
                        className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:border-rose-500 font-sans font-bold text-slate-800 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-1 tracking-wider">Enter OTP</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 6-digit OTP"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:border-rose-500 font-mono font-bold text-slate-800 placeholder-slate-400"
                        />
                      </div>
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                        <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 font-bold leading-relaxed">
                          Demo Mode: Use mock OTP <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-800">123456</span> to proceed.
                        </p>
                      </div>
                    </>
                  )}

                  {loginError && (
                    <p className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{loginError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-550 active:scale-[0.99] text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-rose-600/10"
                  >
                    {otpSent ? 'Verify OTP' : 'Send OTP'}
                  </button>

                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpInput(''); setLoginError(''); }}
                      className="w-full text-center text-[10px] text-slate-400 hover:text-rose-600 font-bold uppercase tracking-wider transition-colors"
                    >
                      ← Change Number
                    </button>
                  )}
                </form>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold pt-2 border-t border-dashed border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>OTP verified · Secured by SSL</span>
                </div>
              </div>
            ) : (
              /* LOGGED IN PROFILE CARD */
              <>
                {/* User Profile Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 text-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shrink-0 flex items-center justify-center shadow-inner">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-mono text-lg font-black text-slate-800 leading-tight">
                        +91 {currentUser}
                      </h3>
                      <p className="text-xs text-emerald-600 font-extrabold uppercase tracking-widest mt-1 flex items-center gap-1">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        Verified Passenger
                      </p>
                    </div>
                  </div>
                </div>

                {/* Laptop Navigation Links */}
                <div className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
                  <div
                    onClick={() => router.push('/orders')}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 group-hover:text-rose-600 transition-colors">My Food Orders</h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Track live train deliveries</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Desktop Logout Button */}
                <div className="hidden md:block pt-2">
                  <button
                    onClick={() => {
                      logoutUser();
                      router.push('/');
                    }}
                    className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black rounded-2xl text-xs uppercase tracking-widest transition-all border border-rose-100 flex items-center justify-center gap-2 shadow-xs"
                  >
                    <LogOut className="w-4 h-4 shrink-0" /> Log Out
                  </button>
                </div>
              </>
            )}

            {/* Mobile Navigation List (Visible ONLY on mobile for Help & FAQs + My Orders if logged in) */}
            <div className="block md:hidden bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
              {currentUser && (
                <div
                  onClick={() => router.push('/orders')}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 group-hover:text-rose-600 transition-colors">My Food Orders</h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Track live train deliveries & history</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              )}

              <div
                onClick={() => router.push('/help')}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 group-hover:text-rose-600 transition-colors">Help & Support</h4>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Contact passenger support helpline</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>

              <div
                onClick={() => router.push('/faqs')}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 group-hover:text-rose-600 transition-colors">FAQs & Info</h4>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Quick answers to seat delivery queries</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

          </div>

          {/* Right Column (Help details & FAQs list for Laptop only) - ALWAYS visible */}
          <div className="hidden md:block md:col-span-8 space-y-6">
            
            {/* Direct Support Details */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-500" /> Passenger Help & Support Desk
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <a href="tel:+919528932927" className="p-4 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col gap-1 transition-colors">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Helpline Number</span>
                  <span className="text-base font-black text-slate-800 font-mono">+91 9528932927</span>
                  <span className="text-[10px] text-slate-400 font-bold mt-1">Tap to dial directly</span>
                </a>
                <a href="mailto:support@saferail.in" className="p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-2xl flex flex-col gap-1 transition-colors">
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Email Support</span>
                  <span className="text-base font-black text-slate-800 font-mono">support@saferail.in</span>
                  <span className="text-[10px] text-slate-400 font-bold mt-1">Submit cancellation/refund request</span>
                </a>
              </div>
            </div>

            {/* FAQs List */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-rose-500" /> Frequently Asked Questions
              </h3>
              <div className="divide-y divide-slate-100">
                {faqs.map((faq, index) => {
                  const isOpen = faqOpen === index;
                  return (
                    <div key={index} className="py-3.5 first:pt-0 last:pb-0">
                      <div
                        onClick={() => toggleFaq(index)}
                        className="flex items-center justify-between cursor-pointer group"
                      >
                        <span className="text-sm font-black text-slate-850 group-hover:text-rose-600 transition-colors flex items-center gap-2">
                          <HelpCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          {faq.q}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-rose-600' : ''}`} />
                      </div>
                      {isOpen && (
                        <div className="mt-2 pl-6 text-xs text-slate-500 leading-relaxed font-semibold">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
          
        </div>
      </div>
    </div>
  );
}
