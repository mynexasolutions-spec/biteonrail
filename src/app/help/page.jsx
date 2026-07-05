"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Phone, Mail, Clock, ShieldCheck, HelpCircle, MessageSquare, Headphones } from 'lucide-react';

export default function HelpPage() {
  const router = useRouter();
  const { supportContacts } = useApp();

  const customerContacts = (supportContacts || []).filter(c => c.type === 'website_customer');
  const activeContacts = customerContacts.length > 0 ? customerContacts : [
    { phone: '9536895748', email: 'support@biteonrail.com', label: 'Helpline' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 selection:bg-rose-600 selection:text-white font-sans relative flex flex-col">
      {/* Sticky/Fixed Header Title on Mobile */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 md:relative md:top-auto md:z-0 md:bg-transparent md:border-b-0 md:px-0 md:py-0 md:max-w-md md:max-w-6xl md:mx-auto md:w-full">
        <header className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="md:hidden p-2 hover:bg-slate-150 text-slate-600 hover:text-slate-900 rounded-full transition-all border border-slate-200 bg-white shrink-0 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-black text-slate-900 leading-tight flex items-center gap-1.5">
              <Headphones className="w-4 h-4 md:w-5 md:h-5 text-rose-500 shrink-0" />
              <span>Help & Support</span>
            </h1>
            <p className="text-xs md:text-xs text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Passenger Helpdesk</p>
          </div>
        </header>
      </div>

      <div className="max-w-md md:max-w-6xl mx-auto px-4 pt-4 md:pt-10 pb-12 w-full">

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Quick Contact Banner (Left side on laptop) */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base md:text-lg font-black text-slate-955">How can we help you today?</h2>
            <p className="text-sm md:text-base text-slate-500 leading-relaxed font-semibold">
              If you have any issues with food quality, delivery delays, payment status, or cancellation, feel free to contact us. Our team is active 24/7 during train run hours.
            </p>
            <div className="flex items-center gap-1.5 text-xs md:text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5 w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>We monitor live train timetables</span>
            </div>
          </div>

          {/* Contact Methods (Right side on laptop) */}
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
            
            {activeContacts.map((contact, idx) => (
              <React.Fragment key={contact.id || idx}>
                {/* Phone Support */}
                <a
                  href={`tel:${contact.phone}`}
                  className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors block"
                >
                  <div className="w-10 h-10 md:w-11 md:h-11 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0 border border-rose-100 shadow-xs">
                    <Phone className="w-5 h-5 md:w-5.5 md:h-5.5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider">{contact.label || 'Call Helpline'}</h3>
                    <p className="text-base md:text-lg font-black text-rose-600 font-mono">+{contact.phone}</p>
                    <p className="text-xs md:text-sm text-slate-400 font-medium">Tap to call our active delivery helpline</p>
                  </div>
                </a>

                {/* Email Support */}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors block"
                  >
                    <div className="w-10 h-10 md:w-11 md:h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100 shadow-xs">
                      <Mail className="w-5 h-5 md:w-5.5 md:h-5.5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider">Write to Email</h3>
                      <p className="text-base md:text-lg font-black text-slate-800 font-mono">{contact.email}</p>
                      <p className="text-xs md:text-xs text-slate-400 font-medium">Send queries for refund, bulk orders or feedback</p>
                    </div>
                  </a>
                )}
              </React.Fragment>
            ))}

            {/* Timings Information */}
            <div className="p-5 flex items-start gap-4 bg-slate-50/50">
              <div className="w-10 h-10 md:w-11 md:h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
                <Clock className="w-5 h-5 md:w-5.5 md:h-5.5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider">Support Timings</h3>
                <p className="text-sm md:text-base text-slate-700 font-extrabold">06:00 AM — 11:30 PM (Daily)</p>
                <p className="text-xs md:text-xs text-slate-400 font-medium">Our customer support works round-the-clock synced with train halt slots.</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
