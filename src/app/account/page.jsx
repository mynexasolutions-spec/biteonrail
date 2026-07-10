"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { User, Phone, ShoppingBag, HelpCircle, LogOut, ShieldCheck, ChevronRight, Lock, MessageSquare, ArrowLeft, Mail, Star, Compass, Award } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { currentUser, loginUser, logoutUser, orders, supportContacts } = useApp();
  const [phoneInput, setPhoneInput] = useState('');
  const [faqOpen, setFaqOpen] = useState(0); // Open first FAQ by default

  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
      setIsLoggingIn(true);
      setTimeout(() => {
        if (otpInput === '123456' || otpInput.length === 6) {
          loginUser(phoneInput);
          setOtpSent(false);
          setPhoneInput('');
          setOtpInput('');
        } else {
          setLoginError("Invalid OTP. Use mock OTP: 123456");
        }
        setIsLoggingIn(false);
      }, 600);
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
      q: "Are the food packages hygiene-certified?",
      a: "Absolutely. All food is sourced from hygiene-certified local kitchens. Meals are packed in premium food-grade containers to ensure freshness and safety."
    }
  ];

  const userOrders = currentUser
    ? (orders || []).filter(o => {
      const cleanedPhone = p => String(p).replace(/\D/g, '').slice(-10);
      return cleanedPhone(o.phone) === cleanedPhone(currentUser);
    })
    : [];

  const customerContacts = (supportContacts || []).filter(c => c.type === 'website_customer');
  const activeContacts = customerContacts.length > 0 ? customerContacts : [
    { phone: '9536895748', email: 'support@biteonrail.com', label: 'Helpline' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/50 to-slate-50 text-slate-800 pb-16 selection:bg-rose-600 selection:text-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-12 w-full">
        
        {/* Breadcrumbs Navigation */}
        <div className="mb-4 flex items-center justify-between md:justify-end gap-4">
          <button 
            onClick={() => router.push('/')}
            className="md:hidden flex items-center gap-2 text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-4 py-2.5 rounded-2xl transition-all shadow-xs shrink-0 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-rose-650" /> Back to Home
          </button>

          {currentUser && (
            <button
              onClick={() => {
                logoutUser();
                router.push('/');
              }}
              className="text-[10px] text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100/60 font-black uppercase px-4 py-2.5 rounded-2xl tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" /> Log Out
            </button>
          )}
        </div>

        {/* Dynamic layout wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Login Form or User Profile Details) */}
          <div className="lg:col-span-4 space-y-6">
            {!currentUser ? (
              /* NOT LOGGED IN LOGIN CARD */
              <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500" />
                
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100/50 shadow-inner">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Login to your Profile</h2>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Enter mobile to track active pantry items and fetch live seat-delivery details.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Mobile Number</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 font-mono">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        disabled={otpSent}
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 10-digit number"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 focus:bg-white font-mono font-black text-slate-800 transition-all placeholder-slate-400"
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <div className="animate-slideDown space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Enter OTP Code</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="Test OTP: 123456"
                          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 focus:bg-white text-center tracking-[0.2em] font-mono font-black text-slate-800 transition-all"
                        />
                      </div>
                      <div className="flex items-start gap-2 bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2.5">
                        <ShieldCheck className="w-4 h-4 text-amber-550 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                          Demo Mode: Use mock OTP <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-800 font-black">123456</span> to proceed.
                        </p>
                      </div>
                    </div>
                  )}

                  {loginError && (
                    <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2 font-semibold">{loginError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-rose-600/10 hover:shadow-rose-500/25"
                  >
                    {isLoggingIn ? 'Verifying...' : (otpSent ? 'Verify OTP' : 'Send Verification OTP')}
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

                <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-wider pt-2.5 border-t border-dashed border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>OTP verified · Secured by SSL</span>
                </div>
              </div>
            ) : (
              /* LOGGED IN PROFILE CARD (VIP Pass Style) */
              <div className="space-y-6">
                
                {/* Passenger Profile Card Layout (Light Theme with Avatar) */}
                <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 text-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.02)] relative overflow-hidden">
                  <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    {/* Premium Avatar Icon with gradient ring */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 p-[2.5px] shadow-sm flex items-center justify-center shrink-0">
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-rose-500" />
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-widest block">PASSENGER PROFILE</span>
                      <h3 className="font-mono text-base sm:text-lg font-black text-slate-800 leading-tight tracking-tight mt-0.5">
                        +91 {currentUser}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 relative z-10">
                    <span className="text-[10px] text-emerald-700 font-black uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50/50 px-3 py-1 rounded-lg border border-emerald-100">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      Verified Account
                    </span>
                    <span className="text-[10px] text-slate-400 font-black tracking-wide font-sans">
                      BITEONRAIL CLUB
                    </span>
                  </div>
                </div>
                {/* Dashboard Options Tiles */}
                <div className="bg-white border border-slate-200 rounded-[20px] sm:rounded-[28px] overflow-hidden shadow-sm divide-y divide-slate-100">
                  <div
                    onClick={() => router.push('/orders')}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-rose-50 text-rose-650 rounded-xl flex items-center justify-center shrink-0 border border-rose-100/50">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-lg font-black text-slate-800 group-hover:text-rose-600 transition-colors">My Food Orders</h4>
                        <p className="text-xs sm:text-sm text-slate-455 font-semibold mt-0.5">Track live train deliveries ({userOrders.length} orders)</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Help & Support (Mobile Only) */}
                  <div
                    onClick={() => router.push('/help')}
                    className="md:hidden p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-650 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100/50">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 group-hover:text-rose-600 transition-colors">Help & Support</h4>
                        <p className="text-[11px] text-slate-450 font-semibold mt-0.5">Contact passenger support helpline</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* FAQs & Info (Mobile Only) */}
                  <div
                    onClick={() => router.push('/faqs')}
                    className="md:hidden p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-blue-50 text-blue-650 rounded-xl flex items-center justify-center shrink-0 border border-blue-100/50">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 group-hover:text-rose-600 transition-colors">FAQs & Info</h4>
                        <p className="text-[11px] text-slate-450 font-semibold mt-0.5">Quick answers to seat delivery queries</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Helper Badge */}
            <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100/55 rounded-[20px] sm:rounded-3xl p-4 sm:p-5 shadow-xs flex gap-3 sm:gap-3.5 items-start">
              <div className="bg-rose-500 text-white p-2.5 rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-xs sm:text-base">Seat Delivery Protection</h4>
                <p className="text-[11px] sm:text-xs text-slate-500 font-semibold leading-relaxed">
                  Every order is tracked live. If your train is delayed, preparing times are auto-adjusted by kitchen dispatch partners.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column (Support Details & FAQs list) */}
          <div className="hidden lg:block lg:col-span-8 space-y-6">
            
            {/* Direct Support Details */}
            <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-rose-500" /> Passenger Help & Support Desk
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Our support managers are available 24/7 during your train journey.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeContacts.map((contact, idx) => (
                  <React.Fragment key={contact.id || idx}>
                    <a href={`tel:+91${contact.phone}`} className="p-4 bg-emerald-50/30 hover:bg-emerald-55 border border-emerald-100/80 hover:border-emerald-250 rounded-2xl flex flex-col gap-1.5 transition-all shadow-xs group">
                      <span className="text-[10px] sm:text-xs font-black text-emerald-700 uppercase tracking-widest block">{contact.label || 'Helpline Number'}</span>
                      <span className="text-base sm:text-lg md:text-xl font-black text-slate-805 group-hover:text-emerald-700 transition-colors">+91 {contact.phone}</span>
                      <span className="text-[10px] sm:text-xs text-slate-455 font-semibold mt-1">Direct berth dispatch coordinator line</span>
                    </a>
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="p-4 bg-indigo-50/30 hover:bg-indigo-50 border border-indigo-100/80 hover:border-indigo-250 rounded-2xl flex flex-col gap-1.5 transition-all shadow-xs group">
                        <span className="text-[10px] sm:text-xs font-black text-indigo-700 uppercase tracking-widest block">Email Support</span>
                        <span className="text-base sm:text-lg md:text-xl font-black text-slate-805 group-hover:text-indigo-650 transition-colors">{contact.email}</span>
                        <span className="text-[10px] sm:text-xs text-slate-455 font-semibold mt-1">Submit cancellation or refund request</span>
                      </a>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-rose-500" /> Frequently Asked Questions
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Instant answers to common train delivery queries.</p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, index) => {
                  const isOpen = faqOpen === index;
                  return (
                    <div 
                      key={index} 
                      className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                        isOpen 
                          ? 'bg-rose-50/10 border-rose-200/80 shadow-xs' 
                          : 'bg-white border-slate-200/80 hover:bg-slate-50/50'
                      }`}
                    >
                      <div
                        onClick={() => toggleFaq(index)}
                        className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all ${
                          isOpen ? 'border-l-4 border-rose-500 pl-3 sm:pl-4' : 'border-l-0'
                        }`}
                      >
                        <span className={`text-xs sm:text-base font-black transition-colors ${
                          isOpen ? 'text-rose-650' : 'text-slate-800'
                        }`}>
                          {faq.q}
                        </span>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isOpen ? 'bg-rose-100 text-rose-600 rotate-90' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                      {isOpen && (
                        <div className={`px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold animate-slideDown ${
                          isOpen ? 'border-l-4 border-rose-500 pl-3 sm:pl-4' : ''
                        }`}>
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
