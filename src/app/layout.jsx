"use client";
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider, useApp } from '../context/AppContext';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, isFirebaseConfigured } from '../lib/firebase';
import './globals.css';
import Link from 'next/link';
import { Phone, LogIn, LogOut, ShieldAlert, ShoppingBag, Mail, MapPin, ShieldCheck, Train, ExternalLink, ClipboardList, Home, Search, User, Gift, Truck } from 'lucide-react';

function PromoBanner() {
  const { giftThreshold, freeProduct } = useApp();
  return (
    <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white text-[11px] sm:text-xs font-black py-2 sm:py-2.5 px-4 text-center tracking-wide flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 shadow-inner select-none transition-all duration-300">
      <span className="flex items-center gap-1.5">
        <Gift className="w-3.5 h-3.5 text-amber-205 shrink-0" />
        <span>Get Free {freeProduct} on orders above ₹{giftThreshold}!</span>
      </span>
      <span className="hidden sm:inline opacity-50 font-normal">|</span>
      <span className="flex items-center gap-1.5">
        <Truck className="w-3.5 h-3.5 text-amber-205 shrink-0" />
        <span>Free Shipping on all orders!</span>
      </span>
    </div>
  );
}

function Header() {
  const { currentUser, logoutUser, loginUser } = useApp();
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
          <div className="bg-rose-600 text-white font-black text-2xl px-4 py-1.5 rounded-xl flex items-center tracking-wider hover:scale-105 transition-transform">
            <span>Bite</span>
            <span className="bg-white text-rose-600 px-1.5 ml-1 rounded-md text-lg">OnRail</span>
          </div>
        </Link>

        {/* Desktop Navigation — hidden on mobile */}
        <nav className="hidden md:flex items-center space-x-9">
          <Link href="/" className="text-slate-600 hover:text-rose-600 font-bold text-sm transition-colors">
            Home
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
} function Footer() {
  const { stations, supportContacts } = useApp();
  const pathname = usePathname();
  const isAdminRoute = pathname && (pathname.startsWith('/admin') || pathname.startsWith('/dashboard'));

  if (isAdminRoute) return null;

  const customerContacts = (supportContacts || []).filter(c => c.type === 'website_customer');
  const activeContacts = customerContacts.length > 0 ? customerContacts : [
    { phone: '9536895748', email: 'support@biteonrail.com', label: 'Helpline' }
  ];

  return (
    <footer className="bg-slate-50 text-slate-500 py-16 border-t border-slate-200 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-200">

          {/* Brand Block */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-rose-600 text-white font-black text-base px-3 py-1.5 rounded flex items-center tracking-wider">
                <span>Bite</span>
                <span className="bg-white text-rose-600 px-1.5 ml-1 rounded-sm text-sm">OnRail</span>
              </div>
            </div>
            <p className="text-slate-550 leading-relaxed max-w-sm font-medium">
              Premium e-catering platform bringing hygiene-certified, hot restaurant meals directly to your train berth at exact retail MRP.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl w-fit font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Hygiene Certified Train Food Partner</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-slate-900 font-extrabold uppercase tracking-widest text-xs">Quick Links</h4>
            <ul className="space-y-2.5 font-semibold text-slate-500">
              <li>
                <Link href="/orders" className="hover:text-rose-650 transition-colors">Track Orders</Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-rose-650 transition-colors">Help &amp; Support</Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-rose-650 transition-colors">FAQs &amp; Info</Link>
              </li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-slate-900 font-extrabold uppercase tracking-widest text-xs">Passenger Support</h4>
            <ul className="space-y-2.5 font-semibold text-slate-500">
              {activeContacts.map((contact, idx) => (
                <React.Fragment key={contact.id || idx}>
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-rose-500" />
                    <span>{contact.label || 'Helpline'}: <a href={`tel:${contact.phone}`} className="text-slate-700 hover:text-rose-655 transition-colors font-bold">+{contact.phone}</a></span>
                  </li>
                  {contact.email && (
                    <li className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-rose-500" />
                      <span>Email: <a href={`mailto:${contact.email}`} className="text-slate-700 hover:text-rose-655 transition-colors">{contact.email}</a></span>
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
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 font-semibold text-xs">
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
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/checkout', icon: ShoppingBag, label: 'Cart' },
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
          {pathname === '/' && <PromoBanner />}
           {!isAdminRoute && (
            <div className={pathname === '/pnr-route' ? 'hidden md:block sticky top-0 z-40' : (pathname && (pathname.startsWith('/menu') || pathname === '/search') ? 'hidden md:block sticky top-0 z-40' : 'sticky top-0 z-40')}>
              <Header />
            </div>
          )}
          <main className={`flex-grow ${(pathname === '/pnr-route' || pathname === '/search' || pathname === '/help' || pathname === '/account' || pathname === '/orders' || pathname === '/faqs' || (pathname && (pathname.startsWith('/menu') || pathname.startsWith('/checkout')))) ? '' : 'pb-20 md:pb-0'}`}>
            {children}
          </main>
          {(!isAdminRoute && pathname !== '/pnr-route' && pathname !== '/search' && pathname !== '/account' && pathname !== '/orders' && pathname !== '/help' && pathname !== '/faqs' && !(pathname && (pathname.startsWith('/menu') || pathname.startsWith('/checkout')))) && <Footer />}
          {(!isAdminRoute && pathname !== '/pnr-route' && pathname !== '/orders' && pathname !== '/help' && pathname !== '/faqs' && !(pathname && (pathname.startsWith('/menu') || pathname.startsWith('/checkout')))) && <MobileBottomNav />}
        </AppProvider>
      </body>
    </html>
  );
}
