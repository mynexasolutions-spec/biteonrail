"use client";
import React from 'react';
import {
  MapPin, CheckCircle2, AlertTriangle, Clock, Search, Pencil, Trash, Check, X, Plus, Phone, Mail
} from 'lucide-react';

export default function StationsTab({
  adminType,
  selectedStationCode,
  stations,
  stationSearchQuery,
  setStationSearchQuery,
  stationStateFilter,
  setStationStateFilter,
  stationStatusFilter,
  setStationStatusFilter,
  stationPageSize,
  stationCurrentPage,
  setStationCurrentPage,
  newStationName,
  setNewStationName,
  newStationCode,
  setNewStationCode,
  newStationState,
  setNewStationState,
  newStationBuffer,
  setNewStationBuffer,
  newStationManagerName,
  setNewStationManagerName,
  newStationManagerPhone,
  setNewStationManagerPhone,
  availableStates,
  addAvailableState,
  removeAvailableState,
  renameAvailableState,
  supportPhone,
  supportEmail,
  supportContacts,
  newStateName,
  setNewStateName,
  editingStation,
  startEditStation,
  cancelEditStation,
  handleEditStationSubmit,
  handleRemoveStation,
  handleAddStation,
  handleUpdateStationSettings
}) {
  const [isStationModalOpen, setIsStationModalOpen] = React.useState(false);
  const [isStatesModalOpen, setIsStatesModalOpen] = React.useState(false);
  const [editingStateName, setEditingStateName] = React.useState(null);
  const [tempStateName, setTempStateName] = React.useState('');
  const filteredStations = stations.filter(station => {
    const matchesSearch =
      station.name.toLowerCase().includes(stationSearchQuery.toLowerCase()) ||
      station.code.toLowerCase().includes(stationSearchQuery.toLowerCase()) ||
      (station.state || '').toLowerCase().includes(stationSearchQuery.toLowerCase());

    const matchesState = stationStateFilter === 'All' || station.state === stationStateFilter;

    const isActive = station.is_active !== false;
    const matchesStatus =
      stationStatusFilter === 'All' ||
      (stationStatusFilter === 'Online' && isActive) ||
      (stationStatusFilter === 'Closed' && !isActive);

    return (adminType === 'global' || station.code.toUpperCase() === selectedStationCode.toUpperCase()) &&
      matchesSearch && matchesState && matchesStatus;
  });

  const activeCount = stations.filter(s => s.is_active !== false).length;
  const closedCount = stations.filter(s => s.is_active === false).length;
  const uniqueStates = [...new Set(stations.map(s => s.state).filter(Boolean))];

  const totalStationFilteredCount = filteredStations.length;
  const maxStationPages = Math.ceil(totalStationFilteredCount / stationPageSize) || 1;
  const currentStationPageSafe = Math.min(stationCurrentPage, maxStationPages);

  const displayStations = filteredStations.slice(
    (currentStationPageSafe - 1) * stationPageSize,
    currentStationPageSafe * stationPageSize
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-805 tracking-tight uppercase flex items-center gap-2">
              <MapPin className="w-5.5 h-5.5 text-rose-550" /> Delivery Junction Hubs
            </h1>
            <p className="text-slate-500 text-xs mt-1">Configure active junction hubs, service timing boundaries, and location parameters.</p>
          </div>
          {adminType === 'global' && (
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  cancelEditStation();
                  setIsStationModalOpen(true);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md uppercase tracking-wider shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Delivery Hub
              </button>
              <button
                onClick={() => {
                  setIsStatesModalOpen(true);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md uppercase tracking-wider shrink-0"
              >
                <MapPin className="w-4 h-4" /> Manage States
              </button>
            </div>
          )}
        </div>
      {/* Station HQ Summary Statistics */}
      {adminType === 'global' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Total Hubs</span>
              <span className="text-xl font-black text-slate-800">{stations.length} Junctions</span>
            </div>
            <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Active Kitchens</span>
              <span className="text-xl font-black text-emerald-655">{activeCount} Online</span>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Suspended</span>
              <span className="text-xl font-black text-rose-650">{closedCount} Hubs</span>
            </div>
            <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-rose-550" />
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side */}
        <div className={adminType === 'global' ? "lg:col-span-12 space-y-5" : "lg:col-span-8 space-y-5"}>
          {adminType === 'station' ? (() => {
            const myStation = stations.find(s => s.code.toUpperCase() === selectedStationCode.toUpperCase());
            if (!myStation) return null;

            return (
              <div className="space-y-6">
                {/* Clean Theme-matching Station Card */}
                <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-8 rounded-[32px] text-white shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 translate-x-6 translate-y-6">
                    <MapPin className="w-48 h-48" />
                  </div>

                  <div className="space-y-3 relative z-10">
                    <span className="text-[9px] bg-white/20 text-white px-2.5 py-1 rounded-md font-extrabold uppercase tracking-widest inline-block">
                      Assigned Junction Hub
                    </span>
                    <h2 className="font-black text-2xl md:text-3xl tracking-tight block leading-tight">
                      {myStation.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-100 font-mono mt-1">
                      <span>STATION CODE:</span>
                      <span className="bg-white text-rose-600 px-2 py-0.5 rounded font-black">{myStation.code}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center gap-4">
                    <div className="bg-indigo-50 text-indigo-650 p-3 rounded-2xl">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Operational State</span>
                      <span className="text-sm font-black text-slate-800">{myStation.state || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center gap-4">
                    <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ordering Cutoff Buffer</span>
                      <span className="text-sm font-black text-slate-800">{myStation.buffer_minutes || 60} Minutes before ETA</span>
                    </div>
                  </div>
                </div>

                {/* Active timing info box */}
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-3">
                  <h4 className="text-xs font-black text-slate-805 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Clock className="w-4.5 h-4.5 text-rose-550" /> Station Active Timing Rules
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Your kitchen currently processes orders from passengers whose trains arrive between
                    <strong className="text-slate-800 font-black font-mono mx-1">{myStation.open_time || '00:00'}</strong>
                    and
                    <strong className="text-slate-800 font-black font-mono mx-1">{myStation.close_time || '23:59'}</strong>.
                    Orders outside this timeframe are suspended automatically to prevent service delays.
                  </p>
                </div>
              </div>
            );
          })() : (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="w-4.5 h-4.5 text-rose-550" />
                      Active Delivery Junctions
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">Manage operational window timings, buffers, and active kitchen status.</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-black uppercase bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
                    Matches: {filteredStations.length} Junctions
                  </span>
                </div>

                {/* Interactive Filters (HQ Admin Only) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                  <div className="relative md:col-span-6">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={stationSearchQuery}
                      onChange={(e) => setStationSearchQuery(e.target.value)}
                      placeholder="Search stations by name, code, state..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 font-bold text-slate-850 placeholder-slate-400"
                    />
                  </div>

                  <select
                    value={stationStateFilter}
                    onChange={(e) => setStationStateFilter(e.target.value)}
                    className="md:col-span-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-705 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="All">All States</option>
                    {uniqueStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>

                  <select
                    value={stationStatusFilter}
                    onChange={(e) => setStationStatusFilter(e.target.value)}
                    className="md:col-span-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-750 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Online">Online Only</option>
                    <option value="Closed">Suspended Only</option>
                  </select>
                </div>
              </div>

              {/* Production Stations Table */}
              <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-450 uppercase tracking-widest">
                        <th className="py-4 px-5">Junction Info</th>
                        <th className="py-4 px-5 w-40">Operating Hours</th>
                        <th className="py-4 px-5 w-48">Manager / Contact</th>
                        <th className="py-4 px-5 w-32 text-center">Order Buffer</th>
                        <th className="py-4 px-5 w-36 text-center">Status</th>
                        <th className="py-4 px-5 w-20 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayStations.length > 0 ? (
                        displayStations.map(station => {
                          const isActive = station.is_active !== false;
                          return (
                            <tr key={station.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                              <td className="py-3.5 px-5">
                                <div>
                                  <span className="font-extrabold text-slate-800 text-sm block leading-tight">{station.name}</span>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="bg-rose-50 text-rose-707 border border-rose-100 px-2 py-0.5 rounded font-mono text-[10px] font-black uppercase">
                                      {station.code}
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold">{station.state}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-5 font-mono text-slate-655">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="font-bold text-xs">{station.open_time || '00:00'} - {station.close_time || '23:59'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-5 text-slate-700">
                                {station.manager_phone ? (
                                  <div className="space-y-0.5">
                                    <span className="text-slate-800 text-xs font-extrabold block">{station.manager_name || 'N/A'}</span>
                                    <a href={`tel:${station.manager_phone}`} className="text-rose-600 hover:text-rose-750 font-mono text-xs flex items-center gap-1.5 w-fit font-black">
                                      <Phone className="w-3 h-3 text-rose-500" /> {station.manager_phone}
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">No contact added</span>
                                )}
                              </td>
                              <td className="py-3.5 px-5 text-center font-bold">
                                <span className="text-xs text-indigo-650 bg-indigo-50 border border-indigo-105 px-2.5 py-1 rounded-lg">
                                  {station.buffer_minutes || 60} mins
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-center">
                                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider border ${isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                                  }`}>
                                  {isActive ? '● Active' : '○ Closed'}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      startEditStation(station);
                                      setIsStationModalOpen(true);
                                    }}
                                    className="text-slate-400 hover:text-indigo-650 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 hover:border-indigo-150"
                                    title="Edit Hub"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to remove station "${station.name}"?`)) {
                                        handleRemoveStation(station.id);
                                      }
                                    }}
                                    className="text-slate-400 hover:text-rose-650 p-1.5 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 hover:border-rose-150"
                                    title="Delete Hub"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-bold text-xs">
                            No matching station delivery hubs found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Station List Pagination controls */}
                {totalStationFilteredCount > stationPageSize && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 bg-white px-5 py-4">
                    <span className="text-[11px] text-slate-500 font-bold">
                      Showing <strong className="text-slate-808">{(currentStationPageSafe - 1) * stationPageSize + 1}</strong> to <strong className="text-slate-808">{Math.min(currentStationPageSafe * stationPageSize, totalStationFilteredCount)}</strong> of <strong className="text-slate-808">{totalStationFilteredCount}</strong> delivery hubs
                    </span>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setStationCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentStationPageSafe === 1}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[11px]"
                      >
                        Previous
                      </button>

                      {Array.from({ length: Math.ceil(totalStationFilteredCount / stationPageSize) }).map((_, idx) => {
                        const pageNum = idx + 1;
                        const isNearCurrent = Math.abs(pageNum - currentStationPageSafe) <= 1;
                        const isFirstOrLast = pageNum === 1 || pageNum === Math.ceil(totalStationFilteredCount / stationPageSize);
                        if (!isNearCurrent && !isFirstOrLast) return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setStationCurrentPage(pageNum)}
                            className={`px-3 py-1.5 rounded-xl border transition-all font-black text-[11px] ${currentStationPageSafe === pageNum
                              ? 'bg-rose-600 border-rose-650 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setStationCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalStationFilteredCount / stationPageSize)))}
                        disabled={currentStationPageSafe === Math.ceil(totalStationFilteredCount / stationPageSize)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[11px]"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
                  {/* Right Side: Operations Forms (Station Manager Only) */}
        {adminType === 'station' && (
          <div className="hidden lg:block lg:col-span-4 space-y-6">
            {(() => {
              const myStation = stations.find(s => s.code.toUpperCase() === selectedStationCode.toUpperCase());
              if (!myStation) return null;
              return (
                <div className="bg-white border border-slate-200 p-6 rounded-[32px] space-y-6 shadow-sm">
                  <div>
                    <h3 className="font-black text-slate-808 text-sm border-b border-slate-100 pb-2">Hub Operational Settings</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1 font-medium">Configure live ordering window, delivery times, and kitchen availability status for your station.</p>
                  </div>

                  {/* Master Switch */}
                  <div className="flex flex-col gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Kitchen Status</span>
                        <span className="text-[10px] text-slate-500 block">Accept or suspend all passenger orders instantly.</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${myStation.is_active !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                        : 'bg-rose-50 text-rose-700 border-rose-250'
                        }`}>
                        {myStation.is_active !== false ? '● ONLINE' : '○ OFFLINE'}
                      </span>
                    </div>

                    {/* Segmented toggle buttons */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-200/50 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleUpdateStationSettings(myStation.id, { is_active: true })}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider flex items-center justify-center gap-1.5 ${myStation.is_active !== false
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-white/40'
                          }`}
                      >
                        Online
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStationSettings(myStation.id, { is_active: false })}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider flex items-center justify-center gap-1.5 ${myStation.is_active === false
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-655 hover:bg-white/40'
                          }`}
                      >
                        Offline
                      </button>
                    </div>
                  </div>

                  {/* Hours of Operation Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      handleUpdateStationSettings(myStation.id, {
                        buffer_minutes: Number(formData.get('buffer_minutes')) || 60,
                        open_time: formData.get('open_time') || '00:00',
                        close_time: formData.get('close_time') || '23:59'
                      });
                    }}
                    className="space-y-4 pt-2"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Open Time</label>
                        <input
                          type="time"
                          name="open_time"
                          required
                          defaultValue={myStation.open_time || '00:00'}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-xs font-black focus:outline-none focus:border-rose-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Close Time</label>
                        <input
                          type="time"
                          name="close_time"
                          required
                          defaultValue={myStation.close_time || '23:59'}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-xs font-black focus:outline-none focus:border-rose-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Cutoff Buffer (Minutes)</label>
                      <input
                        type="number"
                        name="buffer_minutes"
                        min={1}
                        required
                        defaultValue={myStation.buffer_minutes || 60}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-xs font-black focus:outline-none focus:border-rose-500 font-mono"
                      />
                      <span className="text-[9px] text-slate-450 mt-1 block">Minutes before train arrival when ordering closes.</span>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3 rounded-xl text-xs transition-colors shadow-md uppercase tracking-wider"
                    >
                      Save Configuration
                    </button>
                  </form>
                </div>
              );
            })()}
          </div>
        )}
      </div>
          {/* Unified Create/Edit Station Modal */}
      {isStationModalOpen && adminType === 'global' && (
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
                  {editingStation ? <Pencil className="w-5 h-5 text-rose-550" /> : <Plus className="w-5 h-5 text-rose-550" />}
                </div>
                <div>
                  <h3 className="font-black text-slate-855 text-sm">{editingStation ? 'Edit Delivery Hub' : 'Add Delivery Hub'}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Junction Settings</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsStationModalOpen(false);
                  cancelEditStation();
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Container */}
            <div className="flex-grow overflow-y-auto py-2">
              <form 
                onSubmit={(e) => {
                  if (editingStation) {
                    handleEditStationSubmit(e);
                  } else {
                    handleAddStation(e);
                  }
                  setIsStationModalOpen(false);
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Station Name</label>
                  <input
                    type="text"
                    required
                    value={newStationName}
                    onChange={(e) => setNewStationName(e.target.value)}
                    placeholder="e.g. Pune Junction"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Station Code</label>
                  <input
                    type="text"
                    required
                    value={newStationCode}
                    onChange={(e) => setNewStationCode(e.target.value)}
                    placeholder="e.g. PUNE"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-rose-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">State</label>
                  <input
                    type="text"
                    required
                    list="existing-states-modal"
                    value={newStationState}
                    onChange={(e) => setNewStationState(e.target.value)}
                    placeholder="e.g. Maharashtra, Karnataka..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-rose-500"
                  />
                  <datalist id="existing-states-modal">
                    {(availableStates || []).map(st => (
                      <option key={st} value={st} />
                    ))}
                  </datalist>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsStationModalOpen(false);
                      cancelEditStation();
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-rose-600 hover:bg-rose-550 text-white font-extrabold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-wider"
                  >
                    {editingStation ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingStation ? 'Save Changes' : 'Add Hub'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Unified Manage States Dialog Modal */}
      {isStatesModalOpen && adminType === 'global' && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
          style={{ top: '-150px', bottom: '-150px' }}
          onClick={() => setIsStatesModalOpen(false)}
        >
          <div 
            className="bg-white rounded-[32px] p-6 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl relative z-10 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar inside Centered Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-rose-50 text-rose-600 p-2 rounded-xl">
                  <MapPin className="w-5 h-5 text-rose-550" />
                </div>
                <div>
                  <h3 className="font-black text-slate-855 text-sm">Manage Available States</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-sans">State Settings</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatesModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* States Management Form/List */}
            <div className="flex-grow overflow-y-auto py-2 space-y-4">
              <form onSubmit={(e) => {
                e.preventDefault();
                if (newStateName.trim()) {
                  addAvailableState(newStateName.trim());
                  setNewStateName('');
                }
              }} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  placeholder="e.g. Gujarat"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>

              <div className="space-y-2 max-h-64 overflow-y-auto pt-2">
                {availableStates && availableStates.length > 0 ? (
                  availableStates.map(state => (
                    <div key={state} className="flex justify-between items-center bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700">
                      {editingStateName === state ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={tempStateName}
                            onChange={(e) => setTempStateName(e.target.value)}
                            className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              renameAvailableState(state, tempStateName);
                              setEditingStateName(null);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-[10px] transition-colors"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStateName(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-655 font-bold px-2.5 py-1 rounded text-[10px] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-extrabold">{state}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStateName(state);
                                setTempStateName(state);
                              }}
                              className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                              title="Edit State Name"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAvailableState(state)}
                              className="text-slate-400 hover:text-rose-650 transition-colors p-1"
                              title="Delete State"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">No states added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </>
  );
}
