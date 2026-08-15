"use client";
import React, { useState } from 'react';
import { HelpCircle, Plus, Trash, Pencil, Check, X, ShieldAlert, ArrowUp, ArrowDown } from 'lucide-react';

export default function FaqsTab({ siteFaqs, updateSiteFaqs }) {
  const faqs = siteFaqs || [];

  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddFaq = (e) => {
    if (e) e.preventDefault();
    if (!newQ.trim() || !newA.trim()) return;

    const newFaq = {
      id: Date.now().toString(),
      q: newQ.trim(),
      a: newA.trim()
    };

    updateSiteFaqs([...faqs, newFaq]);
    setNewQ('');
    setNewA('');
    setIsModalOpen(false);
  };

  const handleStartEdit = (faq) => {
    setEditingId(faq.id);
    setEditQ(faq.q);
    setEditA(faq.a);
  };

  const handleSaveEdit = (id) => {
    if (!editQ.trim() || !editA.trim()) return;
    updateSiteFaqs(faqs.map(f => f.id === id ? { ...f, q: editQ.trim(), a: editA.trim() } : f));
    setEditingId(null);
  };

  const handleDelete = (id) => {
    updateSiteFaqs(faqs.filter(f => f.id !== id));
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;
    const updated = [...faqs];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    updateSiteFaqs(updated);
  };

  const renderForm = () => (
    <form onSubmit={handleAddFaq} className="space-y-4">
      <div>
        <label className="block text-[10px] font-black text-slate-455 uppercase tracking-wider mb-1">Question</label>
        <input
          type="text"
          required
          value={newQ}
          onChange={(e) => setNewQ(e.target.value)}
          placeholder="e.g. How does seat delivery work?"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-rose-500 font-bold"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-455 uppercase tracking-wider mb-1">Answer</label>
        <textarea
          required
          rows={4}
          value={newA}
          onChange={(e) => setNewA(e.target.value)}
          placeholder="e.g. Our delivery partner receives your live coach/berth details..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-rose-500 font-semibold leading-relaxed resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-rose-600 hover:bg-rose-550 text-white font-extrabold py-3.5 rounded-xl text-sm transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-rose-100"
      >
        <Plus className="w-4 h-4" /> Save FAQ
      </button>
    </form>
  );

  return (
    <>
      <div className="space-y-6 max-w-5xl animate-fadeIn">

        {/* Header Block with Add Button for Mobile/Tablet */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-slate-805 tracking-tight uppercase flex items-center gap-2">
              <HelpCircle className="w-5.5 h-5.5 text-rose-550" /> FAQs Manage
            </h1>
            <p className="text-slate-555 text-sm lg:text-base mt-1">
              Manage the questions & answers shown on the FAQs page and account page across the website.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="lg:hidden w-full sm:w-auto bg-rose-600 hover:bg-rose-555 text-white font-extrabold px-5 py-3 rounded-xl text-sm transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-rose-100"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Add New FAQ Form (Visible inline ONLY on desktop screens) */}
          <div className="hidden lg:block lg:col-span-5 bg-white border border-slate-200 p-6 rounded-[32px] space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2.5">
              Add New FAQ
            </h3>
            {renderForm()}
          </div>

          {/* FAQ Listings (Visible on all viewports) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-[32px] space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2.5">
              Active FAQs ({faqs.length})
            </h3>
            <div className="space-y-4 lg:max-h-[78vh] lg:overflow-y-auto pr-1">
              {faqs.length > 0 ? (
                faqs.map((faq, index) => (
                  <div
                    key={faq.id}
                    className={`border p-4 rounded-2xl transition-all ${
                      editingId === faq.id
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-slate-150 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {editingId === faq.id ? (
                      /* Inline Edit Form Mode */
                      <div className="space-y-3">
                        <div className="text-[9px] text-rose-600 font-extrabold uppercase tracking-wider">Editing FAQ</div>
                        <input
                          type="text"
                          required
                          value={editQ}
                          onChange={(e) => setEditQ(e.target.value)}
                          placeholder="Question"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-rose-500"
                        />
                        <textarea
                          required
                          rows={3}
                          value={editA}
                          onChange={(e) => setEditA(e.target.value)}
                          placeholder="Answer"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-rose-500 resize-none"
                        />
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-655 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(faq.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Row Mode */
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <h4 className="text-base font-black text-slate-800 break-words">{faq.q}</h4>
                          <p className="text-sm font-semibold text-slate-500 leading-relaxed break-words">{faq.a}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0 justify-end w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleMove(index, -1)}
                            disabled={index === 0}
                            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(index, 1)}
                            disabled={index === faqs.length - 1}
                            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(faq)}
                            className="text-slate-400 hover:text-indigo-650 hover:bg-slate-200 p-2 rounded-xl transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                            title="Edit FAQ"
                          >
                            <Pencil className="w-3.5 h-3.5" /> <span className="sm:hidden">Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(faq.id)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2.5 rounded-xl transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                            title="Remove FAQ"
                          >
                            <Trash className="w-3.5 h-3.5" /> <span className="sm:hidden">Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <ShieldAlert className="w-8 h-8 text-slate-305 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-slate-400 font-bold">No FAQs configured yet — the website is showing its built-in default FAQs.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet overlay Backdrop Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
        >
          <div
            className="bg-white rounded-[32px] p-6 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl relative z-10 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
                  <Plus className="w-5 h-5 text-rose-555" />
                </div>
                <div>
                  <h3 className="font-black text-slate-850 text-sm">Add New FAQ</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">FAQs Manage</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1">
              {renderForm()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
