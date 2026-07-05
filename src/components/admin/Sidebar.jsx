"use client";
import React from 'react';
import { ChefHat, ClipboardList, Coffee, MapPin, Key, Database, User, Menu, X, LogOut, Phone, Layers } from 'lucide-react';

export default function Sidebar({
  adminType,
  activeSubTab,
  setActiveSubTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleLogout,
  selectedStationCode
}) {
  const tabs = adminType === 'global' ? [
    { id: 'orders', label: 'Live Orders', icon: ClipboardList },
    { id: 'stations', label: 'Station Manage', icon: MapPin },
    { id: 'admins', label: 'Station Logins', icon: Key },
    { id: 'users', label: 'Customers', icon: User },
    { id: 'contacts', label: 'Support Directory', icon: Phone },
    { id: 'config', label: 'Platform Settings', icon: Database },
  ] : [
    { id: 'orders', label: 'Live Orders Dispatch', icon: ClipboardList },
    { id: 'menu', label: 'Manage Menu', icon: Coffee },
    { id: 'categories', label: 'Manage Categories', icon: Layers },
    { id: 'stations', label: 'Station Settings', icon: MapPin },
    { id: 'contacts', label: 'Contact HQ Support', icon: Phone },
  ];

  return (
    <>
      {/* Mobile Top Bar Header */}
      <header className="md:hidden w-full bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-rose-600 text-white font-black text-[13px] px-2.5 py-1 rounded-lg flex items-center tracking-wider">
            <span>Bite</span>
            <span className="bg-white text-rose-600 px-1.5 ml-1 rounded-md text-[10px]">OnRail</span>
          </div>
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
            {adminType === 'global' ? 'HQ' : `${selectedStationCode || 'STATION'} Admin`}
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          title="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile drawer backdrop overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 animate-fadeIn"
        />
      )}

      {/* Sidebar Nav */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 md:relative md:transform-none transition-transform duration-300 ease-in-out`}
      >
        <div>
          {/* Header */}
          <div className="p-6 border-b border-slate-150 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-rose-600 text-white font-black text-sm px-3 py-1 rounded-xl flex items-center tracking-wider">
                <span>Bite</span>
                <span className="bg-white text-rose-600 px-1.5 ml-1 rounded-md text-xs">OnRail</span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {adminType === 'global' ? 'HQ' : `${selectedStationCode || 'STATION'} Admin`}
              </span>
            </div>
            {/* Close Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-655"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSubTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-xs font-black uppercase tracking-wider transition-all border ${isActive
                    ? 'bg-rose-50 border-rose-100 text-rose-655 shadow-sm shadow-rose-100/50'
                    : 'bg-transparent border-transparent text-slate-550 hover:bg-slate-50 hover:text-slate-750'
                    }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin Info */}
        <div className="p-4 border-t border-slate-150 bg-slate-50/50">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="bg-slate-250 text-slate-650 p-2.5 rounded-2xl flex items-center justify-center border border-slate-300 shadow-sm shrink-0">
              {adminType === 'global' ? <ChefHat className="w-5.5 h-5.5" /> : <MapPin className="w-5.5 h-5.5 text-rose-550" />}
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Role Level</span>
              <span className="text-xs font-black text-slate-800 uppercase block truncate leading-snug">
                {adminType === 'global' ? 'HQ Main Admin' : `Station Mgr (${selectedStationCode || 'STATION'})`}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3.5 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-md hover:shadow-rose-100 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
