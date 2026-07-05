"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Search as SearchIcon, MapPin, Train, ArrowRight, Utensils, Star, AlertCircle } from 'lucide-react';

const POPULAR_TRAINS = [
  { name: "Vande Bharat Express", number: "22436", route: "NDLS - BSB" },
  { name: "Rajdhani Express", number: "12430", route: "NDLS - LKO" },
  { name: "Shatabdi Express", number: "12002", route: "NDLS - HBJ" },
  { name: "Kerala Express", number: "12626", route: "NDLS - TVC" },
  { name: "Brahmaputra Mail", number: "15657", route: "DLI - KYQ" }
];

export default function SearchPage() {
  const router = useRouter();
  const { stations, menuItems } = useApp();
  const [query, setQuery] = useState('');
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [pnrInput, setPnrInput] = useState('');
  const [apiTrains, setApiTrains] = useState([]);
  const [loadingTrains, setLoadingTrains] = useState(false);

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (query.trim().length < 2) {
      setApiTrains([]);
      return;
    }

    setLoadingTrains(true);
    try {
      const res = await fetch(`/api/train-search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setApiTrains(data);
      }
    } catch (err) {
      console.error("Error fetching trains:", err);
    } finally {
      setLoadingTrains(false);
    }
  };

  // Filter stations based on query
  const filteredStations = stations.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.code.toLowerCase().includes(query.toLowerCase())
  );

  // Filter food items based on query
  const filteredFood = menuItems.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
  );

  const handleStationSelect = (code) => {
    localStorage.setItem("selected_station_code", code);
    router.push(`/menu?station=${code}`);
  };

  const handleFoodSelect = (item) => {
    router.push(`/menu?search=${encodeURIComponent(item.name)}`);
  };

  const handleTrainSelect = (train) => {
    setSelectedTrain(train);
    setPnrInput('');
  };

  const handlePnrSubmit = (e) => {
    e.preventDefault();
    if (pnrInput.length < 10) {
      alert("Bhai sahi 10-digit PNR enter karo!");
      return;
    }
    router.push(`/pnr-route?pnr=${pnrInput}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-8 selection:bg-rose-600 selection:text-white font-sans relative">
      <div className="max-w-2xl mx-auto px-4 pt-0 md:pt-6">

        {/* Search Header */}
        <div className="mb-6 text-center hidden md:block">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Explore BiteOnRail</h1>
          <p className="text-slate-500 text-xs mt-1">Search trains, stations, foods or brand partners</p>
        </div>

        {/* Floating Search Box */}
        <div className="sticky top-0 md:top-[68px] z-30 bg-slate-50/95 backdrop-blur-md py-3 -mx-4 px-4 mb-4">
          <form onSubmit={handleSearchSubmit} className="relative bg-white border border-slate-200 rounded-2xl shadow-md p-2 flex items-center gap-2">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Train No. or Station..."
                className="pl-11 pr-4 py-3.5 w-full bg-slate-50 border border-slate-100 rounded-xl text-[15px] md:text-base focus:outline-none focus:border-rose-500 font-sans font-bold text-slate-800 placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-550 active:scale-95 text-white p-3.5 rounded-xl transition-all shrink-0 flex items-center justify-center"
              aria-label="Search"
            >
              <SearchIcon className="w-5 h-5 text-white" />
            </button>
          </form>
        </div>

        {/* Results / Suggestions */}
        {query.trim() === '' ? (
          <div className="space-y-6">
            {/* Popular Trains */}
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                <Train className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Popular Trains
              </h3>
              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                {POPULAR_TRAINS.map(train => (
                  <div
                    key={train.number}
                    onClick={() => handleTrainSelect(train)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-extrabold text-slate-800 text-[13px] md:text-sm">{train.name}</p>
                      <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">{train.route}</span>
                    </div>
                    <span className="text-xs md:text-sm font-black text-rose-655 bg-rose-50 px-2.5 py-1 rounded-lg">{train.number}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Junctions */}
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> Popular Junctions
              </h3>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {stations.slice(0, 4).map(station => (
                  <div
                    key={station.id}
                    onClick={() => handleStationSelect(station.code)}
                    className="bg-white border border-slate-200/80 p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer hover:border-rose-300 hover:shadow-md transition-all flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-1">
                      <p className="font-extrabold text-slate-800 text-[12px] sm:text-sm whitespace-normal">{station.name}</p>
                      <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block whitespace-normal">{station.state}</span>
                    </div>
                    <span className="text-[10px] sm:text-sm font-black text-rose-600 bg-rose-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg shrink-0">{station.code}</span>
                  </div>
                ))}
              </div>
            </div>


          </div>
        ) : (
          <div className="space-y-6">
            {/* Loading status */}
            {loadingTrains && (
              <div className="text-center py-4 text-xs font-bold text-rose-500 animate-pulse">
                Fetching trains running status database...
              </div>
            )}

            {/* Trains Matching */}
            {apiTrains.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Matching Trains</h3>
                <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
                  {apiTrains.map(train => (
                    <div
                      key={train.number}
                      onClick={() => handleTrainSelect(train)}
                      className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Train className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <p className="text-[13px] md:text-sm font-black text-slate-800">{train.name}</p>
                          <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">{train.route}</span>
                        </div>
                      </div>
                      <span className="text-xs md:text-sm font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">{train.number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stations Matching */}
            {filteredStations.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Matching Stations</h3>
                <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
                  {filteredStations.map(station => (
                    <div
                      key={station.id}
                      onClick={() => handleStationSelect(station.code)}
                      className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <p className="text-[13px] md:text-sm font-black text-slate-800">{station.name}</p>
                          <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">{station.state}</span>
                        </div>
                      </div>
                      <span className="text-xs md:text-sm font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">{station.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredStations.length === 0 && apiTrains.length === 0 && (
              <div className="text-center py-16 bg-white border border-slate-250 rounded-2xl">
                <p className="text-sm font-black text-slate-800">No match found</p>
                <p className="text-xs text-slate-500 mt-1">Try searching for other trains or stations.</p>
              </div>
            )}
          </div>
        )}

        {/* PNR Prompt Modal */}
        {selectedTrain && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative border border-rose-50 animate-in fade-in zoom-in-95 duration-200">
              <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-1.5">
                <Train className="w-5 h-5 text-rose-600 animate-pulse" /> {selectedTrain.name}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-5">Train No: {selectedTrain.number}</p>

              <form onSubmit={handlePnrSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Enter your PNR to track route</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={pnrInput}
                    onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit PNR"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 font-sans font-bold text-slate-800 placeholder-slate-400"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTrain(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wide transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
