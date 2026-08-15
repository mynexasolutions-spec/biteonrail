"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ScrollText } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. About BiteOnRail',
    body: `BiteOnRail is an e-catering platform that delivers hygiene-certified restaurant food directly to your train berth using your PNR, train number, and coach/seat details.`
  },
  {
    title: '2. Account & Sign-In',
    body: `To place an order, you must sign in with a valid mobile number. We verify your number using a real OTP sent via Firebase Phone Authentication. You are responsible for keeping your device and phone number secure, as your account is tied to it.`
  },
  {
    title: '3. Orders & Delivery',
    body: `Delivery is coordinated using the PNR/train/berth details you provide at checkout. Please ensure these details are accurate — incorrect PNR or seat information may cause delivery delays or failures. Delivery timing is synced to your train's live schedule and may shift if your train is delayed.`
  },
  {
    title: '4. Payments',
    body: `Payments are processed securely through Razorpay. Cash on Delivery (COD) may be available for select routes. All prices shown are inclusive of applicable taxes unless stated otherwise.`
  },
  {
    title: '5. Cancellations & Refunds',
    body: `Orders can be cancelled before the kitchen dispatch cut-off shown at checkout. For refund or cancellation requests after this point, contact our support team — refunds are processed as per our support team's assessment on a case-by-case basis.`
  },
  {
    title: '6. Limitation of Liability',
    body: `While we make every effort to ensure timely, accurate delivery, BiteOnRail is not liable for delays caused by train schedule changes, incorrect passenger-provided details, or events outside our reasonable control.`
  },
  {
    title: '7. Changes to These Terms',
    body: `We may update these Terms from time to time. Continued use of BiteOnRail after changes are posted constitutes acceptance of the revised Terms.`
  },
  {
    title: '8. Contact Us',
    body: `For any questions about these Terms, reach us at support@biteonrail.com or call our helpline at +91 9536895748.`
  }
];

export default function TermsOfServicePage() {
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
              <ScrollText className="w-4 h-4 md:w-5 md:h-5 text-rose-500 shrink-0" />
              <span>Terms of Service</span>
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
