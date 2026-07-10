"use client";
import React, { useState } from 'react';
import { Phone, Mail, Plus, Trash, Pencil, Check, X, ShieldAlert, Users } from 'lucide-react';

export default function SupportDirectoryTab({
  adminType,
  supportContacts,
  updateSupportContacts
}) {
  // Input state for creation
  const [newLabel, setNewLabel] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newType, setNewType] = useState('website_customer'); // 'website_customer' or 'station_manager'

  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editType, setEditType] = useState('website_customer');

  // Mobile modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddContact = (e) => {
    if (e) e.preventDefault();
    if (!newLabel.trim() || !newPhone.trim()) return;

    const newContact = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || null,
      type: newType
    };

    updateSupportContacts([...(supportContacts || []), newContact]);
    setNewLabel('');
    setNewPhone('');
    setNewEmail('');
    setNewType('website_customer');
    setIsModalOpen(false);
  };

  const handleSaveEdit = (id) => {
    if (!editLabel.trim() || !editPhone.trim()) return;

    const updated = (supportContacts || []).map(contact => {
      if (contact.id === id) {
        return {
          ...contact,
          label: editLabel.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim() || null,
          type: editType
        };
      }
      return contact;
    });

    updateSupportContacts(updated);
    setEditingId(null);
  };

  const handleStartEdit = (contact) => {
    setEditingId(contact.id);
    setEditLabel(contact.label);
    setEditPhone(contact.phone);
    setEditEmail(contact.email || '');
    setEditType(contact.type || 'website_customer');
  };

  const renderForm = (isModal = false) => (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        handleAddContact();
      }} 
      className="space-y-4"
    >
      <div>
        <label className="block text-[10px] font-black text-slate-455 uppercase tracking-wider mb-1">Contact Label / Role</label>
        <input
          type="text"
          required
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="e.g. HEAD Admin, Operations Team"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-bold"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-455 uppercase tracking-wider mb-1">Visibility / Target Audience</label>
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-bold"
        >
          <option value="website_customer">Website Customer (Footer, Help Page, etc.)</option>
          <option value="station_manager">Station Manager (HQ Internal Support)</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-455 uppercase tracking-wider mb-1">Phone Number (Required)</label>
        <input
          type="tel"
          required
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          placeholder="e.g. 9536895748"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-bold font-mono"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-455 uppercase tracking-wider mb-1">Email Address (Optional)</label>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="e.g. admin@biteonrail.com"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-bold font-mono"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-rose-600 hover:bg-rose-550 text-white font-extrabold py-3.5 rounded-xl text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-rose-100"
      >
        <Plus className="w-4 h-4" /> Save Support Contact
      </button>
    </form>
  );

  // Head Admin View (Manager Interface)
  if (adminType === 'global') {
    return (
      <div className="space-y-6 max-w-5xl animate-fadeIn">
        
        {/* Header Block with Add Button for Mobile/Tablet */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-slate-805 tracking-tight uppercase flex items-center gap-2">
              <Phone className="w-5.5 h-5.5 text-rose-550" /> Support Contact Directory
            </h1>
            <p className="text-slate-555 text-xs lg:text-sm mt-1">
              Configure contact details for both public customers and station managers.
            </p>
          </div>
          
          {/* Mobile/Tablet Trigger Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="lg:hidden w-full sm:w-auto bg-rose-600 hover:bg-rose-555 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-rose-100"
          >
            <Plus className="w-4 h-4" /> Add Support Profile
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Add New Profile Form (Visible inline ONLY on desktop screens) */}
          <div className="hidden lg:block lg:col-span-5 bg-white border border-slate-200 p-6 rounded-[32px] space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2.5">
              Add Support Profile
            </h3>
            {renderForm(false)}
          </div>

          {/* Directory Listings (Visible on all viewports) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-[32px] space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2.5">
              Active Directory Profiles ({supportContacts?.length || 0})
            </h3>
            <div className="space-y-4 lg:max-h-[78vh] lg:overflow-y-auto pr-1">
              {supportContacts && supportContacts.length > 0 ? (
                supportContacts.map(contact => (
                  <div 
                    key={contact.id} 
                    className={`border p-4 rounded-2xl transition-all ${
                      editingId === contact.id 
                        ? 'border-rose-300 bg-rose-50/20' 
                        : 'border-slate-150 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {editingId === contact.id ? (
                      /* Inline Edit Form Mode */
                      <div className="space-y-3">
                        <div className="text-[9px] text-rose-600 font-extrabold uppercase tracking-wider">Editing Contact Details</div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            required
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            placeholder="Contact Label/Role"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500"
                          />
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500"
                          >
                            <option value="website_customer">Website Customer</option>
                            <option value="station_manager">Station Manager</option>
                          </select>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="tel"
                              required
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              placeholder="Phone (Required)"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold font-mono text-slate-800 focus:outline-none focus:border-rose-500"
                            />
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              placeholder="Email (Optional)"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold font-mono text-slate-800 focus:outline-none focus:border-rose-500"
                            />
                          </div>
                        </div>
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
                            onClick={() => handleSaveEdit(contact.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Row Mode */
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-black text-slate-800 break-words">{contact.label}</h4>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                              contact.type === 'station_manager'
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                              {contact.type === 'station_manager' ? 'Station Manager' : 'Website Public'}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-sm font-bold text-slate-500">
                            <div className="flex items-center gap-1.5 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="break-all">{contact.phone}</span>
                            </div>
                            {contact.email && (
                              <div className="flex items-center gap-1.5 font-mono text-slate-455">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="break-all">{contact.email}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-1 shrink-0 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0 justify-end w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(contact)}
                            className="text-slate-400 hover:text-indigo-650 hover:bg-slate-200 p-2 rounded-xl transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                            title="Edit Contact"
                          >
                            <Pencil className="w-3.5 h-3.5" /> <span className="sm:hidden">Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSupportContacts(supportContacts.filter(c => c.id !== contact.id))}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2.5 rounded-xl transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                            title="Remove Contact"
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
                  <p className="text-xs text-slate-400 font-bold">No active support contacts configured yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet overlay Backdrop Modal */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-slate-955/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
            style={{ top: '-150px', bottom: '-150px' }}
          >
            <div 
              className="bg-white rounded-[32px] p-6 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl relative z-10 animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
                    <Plus className="w-5 h-5 text-rose-555" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-850 text-sm">Add Support Profile</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Support Directory</p>
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

              {/* Scrollable Form Content */}
              <div className="overflow-y-auto pr-1">
                {renderForm(true)}
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // Station Manager View (Display ONLY their specific internal HQ support contacts)
  const managerContacts = (supportContacts || []).filter(c => c.type === 'station_manager');

  return (
    <div className="space-y-6 max-w-5xl animate-fadeIn">
      <div>
        <h1 className="text-xl font-black text-slate-805 tracking-tight uppercase flex items-center gap-2">
          <Phone className="w-5.5 h-5.5 text-rose-550 animate-pulse" /> Contact HQ Admin Support
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Need assistance or have operational queries? Connect with the HQ admin support coordinators:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {managerContacts && managerContacts.length > 0 ? (
          managerContacts.map(contact => (
            <div key={contact.id} className="bg-white border border-slate-200 p-5 rounded-[28px] shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div>
                <span className="text-[10px] bg-rose-55 text-rose-600 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md border border-rose-100/60 inline-block mb-2 font-sans">HQ Internal Support</span>
                <h3 className="text-base font-black text-slate-800">{contact.label}</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Operations Desk Coordinator</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5 border-t border-slate-100">
                <a 
                  href={`tel:${contact.phone}`} 
                  className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 px-3.5 py-3 rounded-2xl transition-colors group"
                >
                  <div className="bg-rose-500/10 text-rose-650 p-2 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                    <Phone className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-extrabold uppercase tracking-wide">Call Phone</span>
                    <span className="text-sm font-black text-slate-805 font-mono truncate block">{contact.phone}</span>
                  </div>
                </a>

                {contact.email ? (
                  <a 
                    href={`mailto:${contact.email}`} 
                    className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 px-3.5 py-3 rounded-2xl transition-colors group"
                  >
                    <div className="bg-indigo-500/10 text-indigo-650 p-2 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                      <Mail className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-extrabold uppercase tracking-wide">Mail Support</span>
                      <span className="text-sm font-black text-slate-805 font-mono truncate block">{contact.email}</span>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-2.5 bg-slate-100/50 border border-slate-150/40 px-3.5 py-3 rounded-2xl select-none opacity-60">
                    <div className="bg-slate-200 text-slate-400 p-2 rounded-xl shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-extrabold uppercase tracking-wide">Mail Support</span>
                      <span className="text-sm font-black text-slate-400 italic truncate block">No Email Added</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 bg-white border border-slate-200 p-10 rounded-[32px] text-center shadow-sm">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3 animate-pulse" />
            <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">No Station Manager Contacts Configured</p>
          </div>
        )}
      </div>
    </div>
  );
}
