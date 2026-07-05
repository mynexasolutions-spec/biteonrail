"use client";
import React from 'react';
import {
  Pencil, Plus, Check, Key, Search, EyeOff, Eye, Trash, X, Phone
} from 'lucide-react';

export default function CredentialsTab({
  activeSubTab,
  adminType,
  adminsList,
  adminsSearchQuery,
  setAdminsSearchQuery,
  stations,
  newAdminEmail,
  setNewAdminEmail,
  newAdminPassword,
  setNewAdminPassword,
  newAdminStationCode,
  setNewAdminStationCode,
  newAdminName,
  setNewAdminName,
  newAdminPhone,
  setNewAdminPhone,
  editingAdmin,
  setEditingAdmin,
  isAdminModalOpen,
  setIsAdminModalOpen,
  handleCreateStationAdmin,
  adminsLoading,
  visiblePasswords,
  setVisiblePasswords,
  handleDeleteAdmin
}) {
  if (activeSubTab !== 'admins' || adminType !== 'global') return null;

  const filteredAdmins = adminsList.filter(a => a.type === 'station').filter(admin => {
    const q = adminsSearchQuery.toLowerCase();
    const email = (admin.email || '').toLowerCase();
    const station = (admin.station_code || '').toLowerCase();
    const stationObj = stations.find(st => st.code.toUpperCase() === admin.station_code?.toUpperCase());
    const stationName = stationObj ? stationObj.name.toLowerCase() : '';
    const managerName = (admin.manager_name || admin.name || stationObj?.manager_name || '').toLowerCase();
    return email.includes(q) || station.includes(q) || stationName.includes(q) || managerName.includes(q);
  });

  const renderCredentialsForm = (isModal = false) => (
    <div className="space-y-4">
      {!isModal && (
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-2">
          <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
            {editingAdmin ? <Pencil className="w-5 h-5 text-rose-550" /> : <Plus className="w-5 h-5 text-rose-550" />}
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-sm">{editingAdmin ? 'Edit Credentials' : 'Create Credentials'}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Access Controls</p>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          handleCreateStationAdmin(e);
          if (isModal) setIsAdminModalOpen(false);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">Manager Name</label>
          <input
            type="text"
            required
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
            placeholder="e.g. Rajesh Sharma"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-855 placeholder-slate-400 text-xs font-bold focus:outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">Manager Contact Phone</label>
          <input
            type="tel"
            required
            value={newAdminPhone}
            onChange={(e) => setNewAdminPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-855 placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">Login Email</label>
          <input
            type="email"
            required
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="e.g. kanpur@saferail.in"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-855 placeholder-slate-400 text-xs font-bold focus:outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 flex justify-between items-center">
            <span>Login Password</span>
            <button
              type="button"
              onClick={() => {
                const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
                let pwd = "";
                for (let i = 0; i < 8; i++) {
                  pwd += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                setNewAdminPassword(pwd);
              }}
              className="text-[10px] text-indigo-650 hover:text-indigo-700 font-black uppercase tracking-wider font-sans"
            >
              Auto Generate
            </button>
          </label>
          <input
            type="text"
            required
            value={newAdminPassword}
            onChange={(e) => setNewAdminPassword(e.target.value)}
            placeholder="Set password key"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-855 placeholder-slate-400 text-xs font-mono font-black focus:outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">Assigned Junction Hub</label>
          <select
            value={newAdminStationCode}
            onChange={(e) => setNewAdminStationCode(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-855 text-xs font-bold focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            {stations.map(st => (
              <option key={st.id} value={st.code}>
                {st.name} ({st.code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          {(!isModal && editingAdmin) ? (
            <button
              type="button"
              onClick={() => {
                setEditingAdmin(null);
                setNewAdminEmail('');
                setNewAdminPassword('');
                setNewAdminName('');
                setNewAdminPhone('');
              }}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 border border-slate-200"
            >
              Cancel
            </button>
          ) : null}
          {isModal && (
            <button
              type="button"
              onClick={() => {
                setIsAdminModalOpen(false);
                setEditingAdmin(null);
                setNewAdminEmail('');
                setNewAdminPassword('');
                setNewAdminName('');
                setNewAdminPhone('');
              }}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 border border-slate-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="flex-[2] bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider"
          >
            {editingAdmin ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingAdmin ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <div className="space-y-6 max-w-6xl animate-fadeIn">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-808 tracking-tight uppercase flex items-center gap-2">
            <Key className="w-5.5 h-5.5 text-rose-550" /> Station Managers Logins
          </h1>
          <p className="text-slate-500 text-xs mt-1">Create, view and manage administrative access for delivery hubs. Managers only see orders matching their station.</p>
        </div>
        <button
          onClick={() => {
            setEditingAdmin(null);
            setNewAdminEmail('');
            setNewAdminPassword('');
            if (stations.length > 0) setNewAdminStationCode(stations[0].code);
            setIsAdminModalOpen(true);
          }}
          className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md uppercase tracking-wider shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Manager Account
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Search & Credentials Table */}
        <div className="lg:col-span-12 space-y-5">

          {/* Search Bar Card */}
          <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={adminsSearchQuery}
                onChange={(e) => setAdminsSearchQuery(e.target.value)}
                placeholder="Search by station code, station name, email, manager name..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 font-bold text-slate-855 placeholder-slate-400"
              />
            </div>
            <span className="text-[10px] text-slate-550 font-black uppercase bg-slate-50 border border-slate-150 px-3.5 py-2.5 rounded-xl text-center shrink-0">
              Managers: {filteredAdmins.length} Accounts
            </span>
          </div>

          {/* Table Card */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            {adminsLoading ? (
              <div className="p-12 text-center text-slate-400 font-bold text-xs animate-pulse">Loading credentials from DB...</div>
            ) : (
              <>
                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-black text-slate-450 uppercase tracking-widest border-b border-slate-200">
                        <th className="py-4 px-5">Assigned Hub</th>
                        <th className="py-4 px-5 font-bold">Login Email</th>
                        <th className="py-4 px-5">Manager Contact</th>
                        <th className="py-4 px-5 w-44">Password Key</th>
                        <th className="py-4 px-5 w-32 text-center">Created At</th>
                        <th className="py-4 px-5 w-24 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-705 font-bold">
                      {filteredAdmins.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400 font-bold">No station manager accounts found matching query.</td>
                        </tr>
                      ) : (
                        filteredAdmins.map(admin => {
                          const stationObj = stations.find(st => st.code.toUpperCase() === admin.station_code?.toUpperCase());
                          return (
                            <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-5 font-black text-slate-800">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-slate-800 text-xs">{stationObj ? stationObj.name : 'Unknown Hub'}</span>
                                  <span className="text-[10px] text-rose-707 font-mono font-black uppercase">{admin.station_code}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-5 font-mono text-slate-655 font-medium max-w-[160px] truncate" title={admin.email}>{admin.email}</td>
                              <td className="py-3.5 px-5 text-slate-700">
                                {(() => {
                                  const dispName = admin.manager_name || admin.name || stationObj?.manager_name || '';
                                  const dispPhone = admin.manager_phone || admin.phone || stationObj?.manager_phone || '';
                                  if (dispName || dispPhone) {
                                    return (
                                      <div className="space-y-0.5">
                                        {dispName && (
                                          <span className="text-slate-800 text-xs font-extrabold block">{dispName}</span>
                                        )}
                                        {dispPhone && (
                                          <a href={`tel:${dispPhone}`} className="text-rose-600 hover:text-rose-750 font-mono text-xs flex items-center gap-1.5 w-fit font-black">
                                            <Phone className="w-3 h-3 text-rose-500" /> {dispPhone}
                                          </a>
                                        )}
                                      </div>
                                    );
                                  }
                                  return (
                                    <span className="text-slate-400 text-xs italic">No contact added</span>
                                  );
                                })()}
                              </td>
                              <td className="py-3.5 px-5 font-mono font-black text-slate-855">
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-2.5 py-1.5 rounded-lg w-fit">
                                  <span className="tracking-wider text-xs">{visiblePasswords[admin.id] ? admin.password : '••••••••'}</span>
                                  <button
                                    type="button"
                                    onClick={() => setVisiblePasswords(prev => ({ ...prev, [admin.id]: !prev[admin.id] }))}
                                    className="text-slate-400 hover:text-slate-655 p-0.5 rounded-md hover:bg-slate-200 transition-colors"
                                    title={visiblePasswords[admin.id] ? "Hide Password" : "Show Password"}
                                  >
                                    {visiblePasswords[admin.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3.5 px-5 text-center text-slate-400 font-bold">
                                {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="py-3.5 px-5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingAdmin(admin);
                                      setNewAdminEmail(admin.email);
                                      setNewAdminPassword(admin.password);
                                      setNewAdminStationCode(admin.station_code || '');
                                      setNewAdminName(admin.manager_name || admin.name || '');
                                      setNewAdminPhone(admin.manager_phone || admin.phone || '');
                                      setIsAdminModalOpen(true);
                                    }}
                                    className="text-slate-400 hover:text-indigo-650 p-1.5 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-150 rounded-lg transition-colors"
                                    title="Edit Credentials"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    className="text-slate-400 hover:text-rose-655 p-1.5 hover:bg-rose-50 border border-slate-200 hover:border-rose-150 rounded-lg transition-colors"
                                    title="Delete Login"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View (Cards) */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {filteredAdmins.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 font-bold text-xs">No station manager accounts found matching query.</div>
                  ) : (
                    filteredAdmins.map(admin => {
                      const stationObj = stations.find(st => st.code.toUpperCase() === admin.station_code?.toUpperCase());
                      const dispName = admin.manager_name || admin.name || stationObj?.manager_name || '';
                      const dispPhone = admin.manager_phone || admin.phone || stationObj?.manager_phone || '';
                      return (
                        <div key={admin.id} className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] text-rose-700 bg-rose-50 border border-rose-150 px-2 py-0.5 rounded font-mono font-black uppercase tracking-wider">
                                {admin.station_code}
                              </span>
                              <h4 className="font-extrabold text-slate-800 text-xs mt-1">{stationObj ? stationObj.name : 'Unknown Hub'}</h4>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingAdmin(admin);
                                  setNewAdminEmail(admin.email);
                                  setNewAdminPassword(admin.password);
                                  setNewAdminStationCode(admin.station_code || '');
                                  setNewAdminName(admin.manager_name || admin.name || '');
                                  setNewAdminPhone(admin.manager_phone || admin.phone || '');
                                  setIsAdminModalOpen(true);
                                }}
                                className="text-slate-400 hover:text-indigo-650 p-1.5 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-150 rounded-lg transition-colors"
                                title="Edit Credentials"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(admin.id)}
                                className="text-slate-400 hover:text-rose-655 p-1.5 hover:bg-rose-50 border border-slate-200 hover:border-rose-150 rounded-lg transition-colors"
                                title="Delete Login"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100">
                            <div>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Manager Contact</span>
                              {dispName || dispPhone ? (
                                <div className="mt-0.5 space-y-0.5">
                                  {dispName && <span className="font-extrabold text-slate-800 text-[11px] block">{dispName}</span>}
                                  {dispPhone && (
                                    <a href={`tel:${dispPhone}`} className="text-rose-605 hover:text-rose-700 font-mono text-[10px] flex items-center gap-1 font-black">
                                      <Phone className="w-2.5 h-2.5 text-rose-500" /> {dispPhone}
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">No contact added</span>
                              )}
                            </div>

                            <div>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Login Email</span>
                              <span className="font-mono text-slate-700 text-[11px] block truncate mt-0.5" title={admin.email}>{admin.email}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2 rounded-xl">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest">Password Key</span>
                              <span className="font-mono font-black text-slate-800 text-xs mt-0.5 tracking-wider">
                                {visiblePasswords[admin.id] ? admin.password : '••••••••'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setVisiblePasswords(prev => ({ ...prev, [admin.id]: !prev[admin.id] }))}
                              className="text-slate-400 hover:text-slate-655 p-1 rounded-md hover:bg-slate-200 transition-colors"
                            >
                              {visiblePasswords[admin.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Unified Create/Edit Credentials Dialog Modal */}
      {isAdminModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
          style={{ top: '-150px', bottom: '-150px' }}
        >
          <div 
            className="bg-white rounded-[32px] p-6 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl relative z-10 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar inside Centered Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
                  {editingAdmin ? <Pencil className="w-5 h-5 text-rose-555" /> : <Plus className="w-5 h-5 text-rose-555" />}
                </div>
                <div>
                  <h3 className="font-black text-slate-850 text-sm">{editingAdmin ? 'Edit Credentials' : 'Create Credentials'}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Access Controls</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdminModalOpen(false);
                  setEditingAdmin(null);
                  setNewAdminEmail('');
                  setNewAdminPassword('');
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Container */}
            <div className="flex-grow overflow-y-auto py-2">
              {renderCredentialsForm(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
