"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `When you sign in, we collect your mobile number to send you a one-time password (OTP) via Firebase Phone Authentication and verify your identity. When you place an order, we collect your PNR number, train number, coach/berth details, delivery station, and order/payment information (processed securely via Razorpay). We do not store your card or UPI credentials — payments are handled directly by our payment partner.`
  },
  {
    title: '2. How We Use Your Information',
    body: `Your phone number and OTP verification are used solely to authenticate your account and secure your session. Your PNR, train, and seat details are used to coordinate live delivery of your food order to the correct berth. Your order history is used to let you track and re-order past orders from your account.`
  },
  {
    title: '3. OTP & Authentication',
    body: `Sign-in on BiteOnRail uses real Firebase Phone Authentication. When you request an OTP, Firebase sends a one-time verification code by SMS to the mobile number you provide. We never see or store the OTP code itself — verification happens directly between your device and Firebase's secure servers.`
  },
  {
    title: '4. Data Sharing',
    body: `We share your delivery coordinates (train, PNR, berth, station) with our on-ground delivery/kitchen dispatch partners solely to fulfil your order. We do not sell your personal information to third parties. Payment details are processed by Razorpay under their own security and privacy standards.`
  },
  {
    title: '5. Data Storage & Security',
    body: `Your account and order data is stored securely using Supabase, with access restricted to authorized systems only. We use industry-standard practices to protect your data from unauthorized access.`
  },
  {
    title: '6. Your Choices',
    body: `You can log out at any time from the Account page, which clears your session from this device. To request deletion of your account data, contact our support team using the details below.`
  },
  {
    title: '7. Contact Us',
    body: `For any privacy-related questions, reach us at support@biteonrail.com or call our helpline at +91 9536895748.`
  }
];

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 selection:bg-rose-600 selection:text-white font-sans relative flex flex-col">
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 md:relative md:top-auto md:z-0 md:bg-transparent md:border-b-0 md:px-0 md:py-0 md:max-w-3xl md:mx-auto md:w-full">
        <header className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="md:hidden p-2 hover:bg-slate-150 text-slate-600 hover:text-slate-900 rounded-full transition-all border border-slate-200 bg-white shrink-0 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-rose-500 shrink-0" />
              <span>Privacy Policy</span>
            </h1>
            <p className="text-xs md:text-xs text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">BiteOnRail Food Delivery</p>
          </div>
        </header>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4 md:pt-10 pb-12 w-full space-y-6">
        <p className="text-sm md:text-base text-slate-400 font-semibold">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.title} className="space-y-2">
              <h2 className="text-base md:text-lg font-black text-slate-900">{section.title}</h2>
              <p className="text-base md:text-lg text-slate-500 leading-relaxed font-semibold">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
