"use client";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider, useApp } from '../context/AppContext';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { sendFirebaseOtp, verifyFirebaseOtp } from '../lib/firebaseAuth';
import OtpBoxInput from '../components/OtpBoxInput';
import './globals.css';
import Link from 'next/link';
import { Phone, LogIn, LogOut, ShieldAlert, ShoppingBag, Mail, MapPin, ShieldCheck, Train, ExternalLink, ClipboardList, Home, Search, User, Gift, Truck, X, Instagram, Facebook, Twitter, Coffee, Loader2 } from 'lucide-react';

function PromoPopup({ isOpen, onClose }) {
  const { giftThreshold, freeProduct } = useApp();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden relative border border-slate-100/60 animate-in zoom-in-95 duration-250 mx-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white hover:bg-slate-50 text-slate-800 hover:text-rose-600 rounded-full transition-all z-20 shadow-lg border border-slate-100/60 hover:scale-105 active:scale-95"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 hover:text-rose-600" />
        </button>

        {/* Header Art banner */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 px-5 py-8 sm:px-6 sm:py-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] select-none pointer-events-none"
            style={{ backgroundImage: `repeating-linear-gradient(45deg,#000,#000 2px,transparent 2px,transparent 12px)` }} />

          <div className="bg-white/15 backdrop-blur-md w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Gift className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-bounce" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Special Offer For You!</h3>
          <p className="text-xs sm:text-sm text-rose-50 font-bold mt-1">Exclusive train catering deals</p>
        </div>

        {/* Content list */}
        <div className="p-5 sm:p-7 space-y-4 sm:space-y-5">

          {/* Feature 1 */}
          <div className="flex gap-3.5 items-start bg-rose-50/40 hover:bg-rose-50/60 border border-rose-100/50 p-3.5 rounded-2xl transition-colors">
            <div className="bg-rose-500 text-white p-2 sm:p-2.5 rounded-xl shrink-0 shadow-sm shadow-rose-500/20">
              <Gift className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-850 text-sm sm:text-base">Free Train Gift Added</h4>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold mt-0.5">
                Get a delicious free <strong className="text-rose-600">{freeProduct}</strong> added automatically to your cart on all orders above ₹{giftThreshold}!
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex gap-3.5 items-start bg-amber-50/40 hover:bg-amber-50/60 border border-amber-100/50 p-3.5 rounded-2xl transition-colors">
            <div className="bg-amber-500 text-white p-2 sm:p-2.5 rounded-xl shrink-0 shadow-sm shadow-amber-500/20">
              <Truck className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-850 text-sm sm:text-base">Berth-side Free Shipping</h4>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold mt-0.5">
                Zero shipping or convenience charges. Hot food delivered directly to your train seat for free!
              </p>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={onClose}
            className="w-full mt-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm uppercase tracking-widest transition-all shadow-lg shadow-rose-600/10 active:scale-[0.99] hover:shadow-rose-650/20"
          >
            Claim Offer
          </button>
        </div>

      </div>
    </div>
  );
}

function Header() {
  const { currentUser, logoutUser, loginUser, homepageLogo } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    let interval = null;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, resendTimer]);

  const [showNotice, setShowNotice] = useState(true);

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;
    setError('');
    setIsLoading(true);
    setShowNotice(false);

    const res = await sendFirebaseOtp(phone, 'global-recaptcha-container');
    setIsLoading(false);

    if (res.success) {
      setError('');
      setConfirmationResult(res.confirmationResult);
      setResendTimer(60);
      setShowNotice(true);
    } else {
      setError(res.error);
      setShowNotice(true);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpSent) {
      if (phone.length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
      setIsLoading(true);
      const res = await sendFirebaseOtp(phone, 'global-recaptcha-container');
      setIsLoading(false);

      if (res.success) {
        setConfirmationResult(res.confirmationResult);
        setOtpSent(true);
        setResendTimer(60);
      } else {
        setError(res.error);
      }
    } else {
      if (otp.length < 6) {
        setError('Please enter complete 6-digit OTP code.');
        return;
      }
      setIsLoading(true);
      const res = await verifyFirebaseOtp(confirmationResult, otp);
      setIsLoading(false);

      if (res.success) {
        loginUser(phone, res.idToken);
        setOtpSent(false);
        setConfirmationResult(null);
        setShowLoginModal(false);
        setPhone('');
        setOtp('');
      } else {
        setError(res.error);
      }
    }
  };

  return (
    <>
      <header className="hidden md:block sticky top-0 z-40 bg-white border-b border-rose-100 shadow-sm backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <img src={homepageLogo || "/logo-white.png"} alt="BiteOnRail Logo" className="h-10 w-auto hover:scale-105 transition-transform" />
          </Link>

          {/* Desktop Navigation — hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-9">
            <Link href="/" className="text-slate-600 hover:text-rose-600 font-bold text-base transition-colors">
              Home
            </Link>
            <Link href="/menu" className="text-slate-600 hover:text-rose-600 font-bold text-base transition-colors flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-rose-550" /> Menu
            </Link>
            <Link href="/search" className="text-slate-600 hover:text-rose-600 font-bold text-base transition-colors flex items-center gap-1.5">
              <Search className="w-4 h-4 text-rose-550" /> Search
            </Link>
            {currentUser && (
              <Link href="/orders" className="text-slate-600 hover:text-rose-600 font-bold text-base transition-colors flex items-center gap-1">
                <ClipboardList className="w-4 h-4 text-rose-500" /> My Orders
              </Link>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <Link href="/account" className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-full transition-all group">
                  <div className="w-7 h-7 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center shadow-sm">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-rose-600 transition-colors">My Account</span>
                </Link>
                <button
                  onClick={logoutUser}
                  className="text-slate-400 hover:text-rose-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold px-6 py-3 rounded-full transition-all flex items-center gap-2 shadow-sm shadow-rose-200"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
            )}
          </nav>

          {/* Mobile Navigation Controls */}
          <div className="flex md:hidden items-center gap-3">
            {currentUser ? (
              <Link href="/account" className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full transition-all">
                <div className="w-6 h-6 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center shadow-sm">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-[11px] font-black text-slate-750 uppercase tracking-wider">Account</span>
              </Link>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black px-4.5 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-sm shadow-rose-200 uppercase tracking-wider"
              >
                <LogIn className="w-3 h-3" /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal — rendered OUTSIDE header for true viewport centering */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 pb-16 sm:pb-4 animate-in fade-in duration-200"
        >
          <div
            className="bg-white rounded-[28px] sm:rounded-[36px] shadow-2xl w-full max-w-md max-h-[85vh] sm:max-h-none overflow-y-auto relative border border-slate-100 animate-in zoom-in-95 duration-200"
          >
            {/* Modal Top Header Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 px-5 py-6 sm:px-7 sm:py-8 text-center relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => { setShowLoginModal(false); setOtpSent(false); setError(''); }}
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 bg-white/10 hover:bg-white/20 text-white/90 hover:text-white rounded-full transition-all border border-white/15 hover:scale-110 active:scale-95 z-20 shadow-md backdrop-blur-md"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon Badge */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-2.5 sm:mb-3.5 shadow-inner group">
                <Train className="w-6 h-6 sm:w-7 sm:h-7 text-rose-400 animate-pulse" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Track Your Train Orders</h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5 sm:mt-1">Enter your phone number to sign in & view live bookings</p>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-7 space-y-4 sm:space-y-5">
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 sm:mb-2">Mobile Number</label>
                  <div className="flex items-center border-2 border-slate-200 rounded-xl sm:rounded-2xl focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10 bg-white transition-all shadow-xs overflow-hidden">
                    <div className="bg-slate-100/90 border-r border-slate-200 text-slate-700 text-sm sm:text-base font-black px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-center gap-1 shrink-0 select-none">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      disabled={otpSent}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit number"
                      className="w-full px-3 py-2.5 sm:py-3 text-base font-mono font-black text-slate-900 focus:outline-none bg-transparent disabled:bg-slate-50 disabled:text-slate-400 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 sm:mb-2">Enter Verification Code</label>
                      <OtpBoxInput value={otp} onChange={setOtp} />
                    </div>
                    {showNotice && (
                      <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200/90 text-emerald-900 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-xs animate-in fade-in duration-200">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <p className="text-sm sm:text-base text-emerald-850 font-extrabold leading-snug">
                          Verification code sent to <span className="font-mono text-emerald-950 font-black">+91-{phone}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="p-3 sm:p-3.5 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl text-sm text-rose-600 font-bold leading-relaxed shadow-xs">
                    {error}
                  </div>
                )}

                <div id="header-recaptcha-container"></div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs uppercase tracking-widest rounded-xl sm:rounded-2xl shadow-lg shadow-rose-600/25 hover:shadow-rose-600/35 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{otpSent ? 'Verifying OTP...' : 'Sending OTP...'}</span>
                    </>
                  ) : (
                    <span>{otpSent ? 'Verify OTP & Sign In' : 'Send OTP'}</span>
                  )}
                </button>

                {otpSent && (
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] pt-1.5 border-t border-slate-100/80 gap-2">
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(''); setError(''); setResendTimer(60); }}
                      className="text-slate-400 hover:text-rose-600 font-extrabold uppercase tracking-wider transition-colors text-left"
                    >
                      Change Mobile Number
                    </button>

                    <button
                      type="button"
                      disabled={resendTimer > 0 || isLoading}
                      onClick={handleResendOtp}
                      className={`font-extrabold uppercase tracking-wider transition-colors text-right ${
                        resendTimer > 0 || isLoading
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-rose-600 hover:text-rose-700 underline cursor-pointer'
                      }`}
                    >
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Footer() {
  const { stations, supportContacts, socialInstagram, socialFacebook, socialTwitter, homepageLogo } = useApp();
  const pathname = usePathname();
  const isAdminRoute = pathname && (pathname.startsWith('/admin') || pathname.startsWith('/dashboard'));

  if (isAdminRoute) return null;

  const customerContacts = (supportContacts || []).filter(c => c.type === 'website_customer');
  const activeContacts = customerContacts.length > 0 ? customerContacts : [
    { phone: '9536895748', email: 'support@biteonrail.com', label: 'Helpline' }
  ];

  return (
    <footer className="bg-slate-50 text-slate-500 py-16 border-t border-slate-200/80 text-base md:text-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-200/80">

          {/* Brand Block */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-2">
              <img src={homepageLogo || "/logo-white.png"} alt="BiteOnRail Logo" className="h-9 w-auto" />
            </div>
            <p className="text-slate-500 leading-relaxed max-w-sm font-semibold">
              Premium e-catering platform bringing hygiene-certified, hot restaurant meals directly to your train berth at exact retail MRP.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl w-fit font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Hygiene Certified Train Food Partner</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-1">
              {[
                { icon: Instagram, href: socialInstagram || "https://instagram.com", label: "Instagram", color: "hover:text-pink-600 hover:bg-pink-50/50 hover:border-pink-200" },
                { icon: Facebook, href: socialFacebook || "https://facebook.com", label: "Facebook", color: "hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200" },
                { icon: Twitter, href: socialTwitter || "https://twitter.com", label: "Twitter / X", color: "hover:text-slate-900 hover:bg-slate-100/50 hover:border-slate-350" }
              ].map(({ icon: Icon, href, label, color }, idx) => (
                <a
                  key={idx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 transition-all duration-300 shadow-xs hover:scale-105 active:scale-95 ${color}`}
                >
                  <Icon className="w-4.5 h-4.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-slate-900 font-extrabold uppercase tracking-widest text-xs">Quick Links</h4>
            <ul className="space-y-2.5 font-bold text-slate-500">
              <li>
                <Link href="/orders" className="hover:text-rose-600 transition-colors">Track Orders</Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-rose-600 transition-colors">Help &amp; Support</Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-rose-600 transition-colors">FAQs &amp; Info</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-rose-600 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-rose-600 transition-colors">Terms of Service</Link>
              </li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-slate-900 font-extrabold uppercase tracking-widest text-xs">Passenger Support</h4>
            <ul className="space-y-2.5 font-bold text-slate-500">
              {activeContacts.map((contact, idx) => (
                <React.Fragment key={contact.id || idx}>
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-rose-500" />
                    <span>{contact.label || 'Helpline'}: <a href={`tel:${contact.phone}`} className="text-slate-700 hover:text-rose-600 transition-colors font-extrabold">+{contact.phone}</a></span>
                  </li>
                  {contact.email && (
                    <li className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-rose-500" />
                      <span>Email: <a href={`mailto:${contact.email}`} className="text-slate-700 hover:text-rose-600 transition-colors">{contact.email}</a></span>
                    </li>
                  )}
                </React.Fragment>
              ))}
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Active Terminals: {stations.length || 17} Junction Hubs</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 font-bold text-sm">
          <p>© {new Date().getFullYear()} BiteOnRail Food Delivery. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const { currentUser } = useApp();

  const tabs = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/menu', icon: Coffee, label: 'Menu' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/cart', icon: ShoppingBag, label: 'Cart' },
    { href: '/account', icon: User, label: 'Account' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center gap-0 px-4 py-0.5 rounded-xl transition-all ${isActive
                ? 'text-rose-600'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <span className={`p-1 rounded-lg transition-all ${isActive ? 'bg-rose-50' : ''
                }`}>
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
              </span>
              <span className={`text-[11px] font-black tracking-wide uppercase ${isActive ? 'text-rose-600' : 'text-slate-400'
                }`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname && (pathname.startsWith('/admin') || pathname.startsWith('/dashboard'));
  const [showPromoPopup, setShowPromoPopup] = useState(false);

  useEffect(() => {
    if (pathname === '/') {
      const alreadyShown = localStorage.getItem('promo_popup_shown');
      if (!alreadyShown) {
        const timer = setTimeout(() => {
          setShowPromoPopup(true);
        }, 1000); // 1 second delay for a smooth entry
        return () => clearTimeout(timer);
      }
    }
  }, [pathname]);

  const handleClosePromo = () => {
    setShowPromoPopup(false);
    localStorage.setItem('promo_popup_shown', 'true');
  };

  return (
    <html lang="en">
      <head>
        <title>BiteOnRail - Railway Food Delivery at Berth</title>
        <meta name="description" content="Order fresh, tasty fast food at your railway berth. High quality food delivered instantly across Maha, Karnataka & Telangana stations." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col">
        <AppProvider>
          <div id="global-recaptcha-container"></div>
          <PromoPopup isOpen={showPromoPopup} onClose={handleClosePromo} />
          {!isAdminRoute && (
            <div className={pathname === '/pnr-route' ? 'hidden md:block sticky top-0 z-40' : (pathname && (pathname.startsWith('/menu') || pathname === '/search') ? 'hidden md:block sticky top-0 z-40' : 'sticky top-0 z-40')}>
              <Header />
            </div>
          )}
          <main className={`flex-grow ${(pathname === '/pnr-route' || pathname === '/search' || pathname === '/help' || pathname === '/account' || pathname === '/orders' || pathname === '/faqs' || (pathname && (pathname.startsWith('/menu') || pathname.startsWith('/checkout') || pathname.startsWith('/cart')))) ? '' : 'pb-20 md:pb-0'}`}>
            {children}
          </main>
          {(!isAdminRoute && pathname !== '/pnr-route' && pathname !== '/train-route' && pathname !== '/search' && pathname !== '/account' && pathname !== '/orders' && pathname !== '/help' && pathname !== '/faqs' && !(pathname && (pathname.startsWith('/menu') || pathname.startsWith('/checkout') || pathname.startsWith('/cart')))) && <Footer />}
          {(!isAdminRoute && pathname !== '/pnr-route' && pathname !== '/orders' && pathname !== '/help' && pathname !== '/faqs' && !(pathname && (pathname.startsWith('/menu') || pathname.startsWith('/checkout') || pathname.startsWith('/cart')))) && <MobileBottomNav />}
        </AppProvider>
      </body>
    </html>
  );
}
