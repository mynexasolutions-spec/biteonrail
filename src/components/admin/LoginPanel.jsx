"use client";
import React from 'react';
import { ShieldAlert, User, Key, Eye, EyeOff } from 'lucide-react';

export default function LoginPanel({
  adminType,
  setAdminType,
  selectedStationCode,
  setSelectedStationCode,
  passcode,
  setPasscode,
  showPasscode,
  setShowPasscode,
  loginError,
  setLoginError,
  adminEmail,
  setAdminEmail,
  handleAdminLogin,
  stations
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-md shadow-xl">
        <div className="text-center mb-6">
          <div className="bg-rose-50 text-rose-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">BiteOnRail Admin Portal</h1>
          <p className="text-slate-500 text-xs mt-1">Enter credentials to access kitchen and dispatch control panels.</p>
        </div>

        {/* Admin Type Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setAdminType('global'); setLoginError(''); setShowPasscode(false); }}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${adminType === 'global' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-750'}`}
          >
            HQ Main Admin
          </button>
          <button
            type="button"
            onClick={() => { setAdminType('station'); setLoginError(''); setShowPasscode(false); }}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${adminType === 'station' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-750'}`}
          >
            Station Manager
          </button>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-5">
          {adminType === 'station' && (
            <div className="animate-fadeIn">
              <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Station Manager Email</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400"><User className="w-4 h-4" /></span>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="e.g. manager@biteonrail.in"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>
          )}

          {adminType === 'global' && (
            <div className="animate-fadeIn">
              <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">Admin Email</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400"><User className="w-4 h-4" /></span>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="e.g. admin@biteonrail.in"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-600 text-xs font-bold mb-1.5 uppercase tracking-wider">
              {adminType === 'global' ? 'Admin Password' : 'Security Passcode'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400"><Key className="w-4 h-4" /></span>
              <input
                type={showPasscode ? "text" : "password"}
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={adminType === 'global' ? "Enter admin password (e.g. admin123)" : `Enter passcode (e.g. station123 or ${selectedStationCode})`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-rose-500 transition-colors [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-650 transition-colors focus:outline-none"
              >
                {showPasscode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {loginError && <p className="text-rose-600 text-xs font-semibold mt-2">{loginError}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3 rounded-xl text-xs transition-colors tracking-widest uppercase shadow-md hover:shadow-rose-100"
          >
            Unlock Terminal
          </button>
        </form>
      </div>
    </div>
  );
}
