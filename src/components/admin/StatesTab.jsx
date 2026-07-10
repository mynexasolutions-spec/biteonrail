"use client";
import React, { useState } from 'react';
import { MapPin, Plus, Trash, Pencil, Check, X, Globe } from 'lucide-react';

export default function StatesTab({
  availableStates = [],
  addAvailableState,
  removeAvailableState,
  renameAvailableState,
  stations = []
}) {
  const [newStateName, setNewStateName] = useState('');
  const [editingStateName, setEditingStateName] = useState(null);
  const [tempStateName, setTempStateName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = newStateName.trim();
    if (name) {
      addAvailableState(name);
      setNewStateName('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
          <Globe className="w-5.5 h-5.5 text-rose-550" /> Manage Available States
        </h1>
        <p className="text-slate-500 text-xs lg:text-sm mt-1">
          Configure states where train food delivery services are operational.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left List: States Showcase */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <span className="text-xs lg:text-sm font-black text-slate-800 uppercase tracking-widest">
                Active States ({availableStates.length})
              </span>
            </div>

            {availableStates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {availableStates.map((state) => {
                  const isEditing = editingStateName === state;
                  const stationCount = stations.filter(st => (st.state || '').toUpperCase() === state.toUpperCase()).length;
                  return (
                    <div
                      key={state}
                      className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/70 p-4 rounded-2xl flex items-center justify-between transition-all group"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={tempStateName}
                            onChange={(e) => setTempStateName(e.target.value)}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs lg:text-sm text-slate-800 focus:outline-none focus:border-rose-500 font-black"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (tempStateName.trim()) {
                                renameAvailableState(state, tempStateName.trim());
                                setEditingStateName(null);
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-1.5 rounded-lg transition-colors shadow-sm"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStateName(null)}
                            className="bg-slate-200 hover:bg-slate-355 text-slate-700 font-bold p-1.5 rounded-lg transition-colors border border-slate-300"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5">
                            <div className="bg-rose-50 text-rose-600 p-2 rounded-xl group-hover:bg-rose-100 transition-colors">
                              <MapPin className="w-4.5 h-4.5 text-rose-550" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs lg:text-sm font-black text-slate-805">
                                {state}
                              </span>
                              <span className="text-[10px] text-slate-400 font-black uppercase mt-0.5">
                                {stationCount} operational {stationCount === 1 ? 'hub' : 'hubs'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 opacity-80 md:opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStateName(state);
                                setTempStateName(state);
                              }}
                              className="text-slate-455 hover:text-indigo-650 hover:bg-white p-2 rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm hover:shadow-xs"
                              title="Edit State Name"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAvailableState(state)}
                              className="text-slate-455 hover:text-rose-600 hover:bg-white p-2 rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm hover:shadow-xs"
                              title="Delete State"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="bg-rose-50 text-rose-555 p-4 rounded-full mb-3.5">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="text-slate-700 text-sm lg:text-base font-black uppercase tracking-wider">
                  No states added yet
                </h3>
                <p className="text-slate-400 text-[11px] lg:text-xs font-bold uppercase tracking-widest mt-1">
                  Add states on the right to activate hubs.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Form: Add State */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm lg:text-base font-black text-slate-850 uppercase tracking-wider mb-1">
                Add New State
              </h2>
              <p className="text-[11px] lg:text-xs text-slate-400 font-bold uppercase tracking-widest">
                State Settings
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] lg:text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  State Name
                </label>
                <input
                  type="text"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  placeholder="e.g. Gujarat"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs lg:text-sm text-slate-800 placeholder-slate-450 focus:outline-none focus:border-rose-500 font-semibold transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3.5 rounded-xl text-xs lg:text-sm transition-colors flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" /> Add State
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
