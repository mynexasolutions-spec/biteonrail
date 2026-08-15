"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, HelpCircle, ChevronRight, ShieldCheck } from 'lucide-react';

export default function FaqsPage() {
  const router = useRouter();
  const [faqOpen, setFaqOpen] = useState(null);

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
    },
    {
      q: "How do I cancel my order?",
      a: "You can cancel your order up to 1 hour before the scheduled arrival at the delivery station. Just call our customer hotline at +91 9528932927 to request cancellation."
    },
    {
      q: "Is there a minimum order value?",
      a: "Minimum order limits vary by restaurant partners but generally range from ₹99 to ₹150. You can check the cart threshold during menu selection."
    }
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
              <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-rose-500 shrink-0" />
              <span>FAQs</span>
            </h1>
            <p className="text-xs md:text-xs text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Frequently Asked Questions</p>
          </div>
        </header>
      </div>

      <div className="max-w-md md:max-w-6xl mx-auto px-4 pt-4 md:pt-10 pb-12 w-full">

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Intro Card (Left side on laptop) */}
          <div className="md:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
            <h2 className="text-sm md:text-base font-black text-slate-400 uppercase tracking-widest">Help Center</h2>
            <p className="text-sm md:text-base text-slate-500 leading-relaxed font-semibold">
              Find quick answers to common questions about ordering, timings, PNR tracking, and payments on BiteOnRail.
            </p>
          </div>

          {/* FAQs List (Right side on laptop) */}
          <div className="md:col-span-8 bg-white border border-slate-200 rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-sm">
            {faqs.map((faq, index) => {
              const isOpen = faqOpen === index;
              return (
                <div key={index} className="overflow-hidden">
                  <div
                    onClick={() => toggleFaq(index)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm md:text-base font-black text-slate-850 flex items-center gap-2.5 pr-2">
                      <HelpCircle className="w-4 h-4 md:w-4.5 md:h-4.5 text-rose-500 shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-90 text-rose-600' : ''}`} />
                  </div>
                  {isOpen && (
                    <div className="px-5 pb-5 pl-11 text-xs md:text-sm text-slate-500 leading-relaxed font-semibold bg-slate-50 border-t border-dashed border-slate-100">
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
  );
}
