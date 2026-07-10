"use client";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider, useApp } from '../context/AppContext';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, isFirebaseConfigured } from '../lib/firebase';
import './globals.css';
import Link from 'next/link';
import { Phone, LogIn, LogOut, ShieldAlert, ShoppingBag, Mail, MapPin, ShieldCheck, Train, ExternalLink, ClipboardList, Home, Search, User, Gift, Truck, X, Instagram, Facebook, Twitter, Coffee } from 'lucide-react';

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
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">Special Offer For You!</h3>
          <p className="text-[10px] sm:text-xs text-rose-50 font-bold mt-1">Exclusive train catering deals</p>
        </div>

        {/* Content list */}
        <div className="p-5 sm:p-7 space-y-4 sm:space-y-5">

          {/* Feature 1 */}
          <div className="flex gap-3.5 items-start bg-rose-50/40 hover:bg-rose-50/60 border border-rose-100/50 p-3.5 rounded-2xl transition-colors">
            <div className="bg-rose-500 text-white p-2 sm:p-2.5 rounded-xl shrink-0 shadow-sm shadow-rose-500/20">
              <Gift className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-850 text-xs sm:text-sm">Free Train Gift Added</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-semibold mt-0.5">
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
              <h4 className="font-extrabold text-slate-850 text-xs sm:text-sm">Berth-side Free Shipping</h4>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-semibold mt-0.5">
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
  const [error, setError] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!otpSent) {
      if (phone.length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
      setOtpSent(true);
    } else {
      if (otp === '123456' || otp.length === 6) {
        loginUser(phone);
        setOtpSent(false);
        setShowLoginModal(false);
        setPhone('');
        setOtp('');
      } else {
        setError("Invalid OTP. Use mock OTP: 123456");
      }
    }
  };

  return (
    <>
      <header className="hidden md:block sticky top-0 z-40 bg-white border-b border-rose-100 shadow-sm backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <img src={homepageLogo || "/logo.png"} alt="BiteOnRail Logo" className="h-10 w-auto hover:scale-105 transition-transform" />
          </Link>

          {/* Desktop Navigation — hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-9">
            <Link href="/" className="text-slate-600 hover:text-rose-600 font-bold text-sm transition-colors">
              Home
            </Link>
            <Link href="/menu" className="text-slate-600 hover:text-rose-600 font-bold text-sm transition-colors flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-rose-550" /> Menu
            </Link>
            <Link href="/search" className="text-slate-600 hover:text-rose-600 font-bold text-sm transition-colors flex items-center gap-1.5">
              <Search className="w-4 h-4 text-rose-550" /> Search
            </Link>
            {currentUser && (
              <Link href="/orders" className="text-slate-600 hover:text-rose-600 font-bold text-sm transition-colors flex items-center gap-1">
                <ClipboardList className="w-4 h-4 text-rose-500" /> My Orders
              </Link>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <Link href="/account" className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-full transition-all group">
                  <div className="w-7 h-7 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center shadow-sm">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-rose-600 transition-colors">My Account</span>
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
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-6 py-3 rounded-full transition-all flex items-center gap-2 shadow-sm shadow-rose-200"
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
                <span className="text-[10px] font-black text-slate-750 uppercase tracking-wider">Account</span>
              </Link>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-4.5 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-sm shadow-rose-200 uppercase tracking-wider"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4"
          onClick={() => { setShowLoginModal(false); setOtpSent(false); setError(''); }}
        >
          <div
            className="bg-white rounded-[28px] shadow-2xl w-full max-w-md p-7 relative border border-rose-50 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-black text-slate-800 mb-2">Track Your Orders</h2>
            <p className="text-xs text-slate-500 mb-6 font-medium">Enter your mobile number to sign in and view your previous bookings.</p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    disabled={otpSent}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit number"
                    className="pl-12 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 disabled:bg-slate-50 disabled:text-slate-500 font-mono"
                  />
                </div>
              </div>

              {otpSent && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Enter OTP</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                      Demo Mode: Use mock OTP <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-800">123456</span> to proceed.
                    </p>
                  </div>
                </>
              )}

              {error && <p className="text-xs text-rose-500 font-semibold bg-rose-50 p-2.5 rounded-xl">{error}</p>}

              <div id="recaptcha-container"></div>

              <button
                type="submit"

                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl text-sm transition-all disabled:bg-slate-300 shadow-md uppercase tracking-wider"
              >
                {otpSent ? 'Verify OTP' : 'Send OTP'}
              </button>

              {otpSent && (
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                  className="w-full text-center text-[10px] text-slate-400 hover:text-rose-600 font-bold uppercase tracking-wider transition-colors"
                >
                  ← Change Number
                </button>
              )}
            </form>
            <button
              onClick={() => { setShowLoginModal(false); setOtpSent(false); setError(''); }}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
            >
              ✕
            </button>
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
    <footer className="bg-slate-50 text-slate-500 py-16 border-t border-slate-200/80 text-sm md:text-[15px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-200/80">

          {/* Brand Block */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-2">
              <img src={homepageLogo || "/logo.png"} alt="BiteOnRail Logo" className="h-9 w-auto" />
            </div>
            <p className="text-slate-500 leading-relaxed max-w-sm font-semibold">
              Premium e-catering platform bringing hygiene-certified, hot restaurant meals directly to your train berth at exact retail MRP.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl w-fit font-bold text-xs">
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
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 font-bold text-xs">
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
              <span className={`text-[9px] font-black tracking-wide uppercase ${isActive ? 'text-rose-600' : 'text-slate-400'
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
