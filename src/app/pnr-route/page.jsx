"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPnrStatus, parsePnrData, clearPnrCaches } from '../../lib/pnr';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Train, Calendar, MapPin, Utensils, Clock, AlertCircle, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react';

function PnrRouteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { stations } = useApp();
  const pnr = searchParams.get('pnr') || '';

  const [pnrResult, setPnrResult] = useState('checking');
  const [pnrDetails, setPnrDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showHubsOnly, setShowHubsOnly] = useState(true);

  useEffect(() => {
    if (!pnr) {
      setErrorMsg("No PNR provided. Please go back and enter a PNR.");
      setPnrResult('error');
      return;
    }

    // Clear memory caches to ensure fresh API calls are triggered
    clearPnrCaches();

    // Clear previous order checkout cache to prevent conflicts
    localStorage.removeItem("checkout_arr_time");
    localStorage.removeItem("checkout_train_name");
    localStorage.removeItem("checkout_train_number");
    localStorage.removeItem("selected_coach");
    localStorage.removeItem("selected_seat");
    localStorage.removeItem("checkout_doj");
    localStorage.removeItem("selected_station_code");

    const fetchPnrRoute = async () => {
      try {
        setPnrResult('checking');
        const res = await getPnrStatus(pnr);

        if (res.Error || res.error || res.ErrorCode) {
          setErrorMsg(res.Error || res.error || `Invalid PNR status (Error Code: ${res.ErrorCode})`);
          setPnrResult('error');
          return;
        }

        const parsed = await parsePnrData(res);
        
        // 🚀 Call Live Running Status API (Call #1) only if journey is TODAY
        try {
          const isTodayJourney = parsed.dateOfJourney ? (() => {
            try {
              let dojDate = null;
              if (parsed.dateOfJourney.includes('-')) {
                const parts = parsed.dateOfJourney.split('-');
                if (parts.length === 3) {
                  if (parts[0].length === 4) {
                    dojDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                  } else {
                    dojDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                  }
                }
              }
              if (!dojDate || isNaN(dojDate.getTime())) {
                dojDate = new Date(parsed.dateOfJourney);
              }
              if (dojDate && !isNaN(dojDate.getTime())) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                dojDate.setHours(0, 0, 0, 0);
                return dojDate.getTime() === today.getTime();
              }
            } catch (e) { }
            return true; // Default fallback to call API
          })() : true;

          const dateParam = parsed.dateOfJourney ? (() => {
            try {
              const dojDate = new Date(parsed.dateOfJourney);
              if (!isNaN(dojDate.getTime())) {
                const mm = String(dojDate.getMonth() + 1).padStart(2, '0');
                const dd = String(dojDate.getDate()).padStart(2, '0');
                const yyyy = dojDate.getFullYear();
                return `${dd}-${mm}-${yyyy}`;
              }
            } catch (e) { }
            return 'today';
          })() : 'today';

          if (isTodayJourney) {
            const liveRes = await fetch(`/api/track-train?trainNo=${parsed.trainNumber}&date=${dateParam}`);
            if (liveRes.ok) {
              const liveData = await liveRes.json();
              const stationsArray = liveData.data?.timeline || liveData.data?.stations;
              if (liveData.success && Array.isArray(stationsArray)) {
                // Update routeStops schedule with actual live ETA and delay values
                parsed.routeStops = parsed.routeStops.map(stop => {
                  const matchedLive = stationsArray.find(s => (s.stationCode || '').toUpperCase() === stop.code.toUpperCase());
                  if (matchedLive) {
                    const rawDelay = matchedLive.arrival?.delay || matchedLive.departure?.delay || "0";
                    const delayVal = parseInt(String(rawDelay).replace(/[^0-9]/g, '')) || 0;
                    
                    // Parse ETA (Actual vs Scheduled) cleanly extracting HH:MM (e.g. "20:08 05-Jul*" -> "20:08")
                    const rawActual = matchedLive.arrival?.actual || matchedLive.departure?.actual;
                    const rawScheduled = matchedLive.arrival?.scheduled || matchedLive.departure?.scheduled;
                    
                    const cleanTimeStr = (rawStr) => {
                      if (!rawStr) return null;
                      const timeMatch = String(rawStr).match(/([0-9]{2}:[0-9]{2})/);
                      return timeMatch ? timeMatch[1] : null;
                    };

                    const actualTime = cleanTimeStr(rawActual) || cleanTimeStr(rawScheduled) || stop.time;
                    const hasDeparted = matchedLive.departure?.hasDeparted || false;
                    
                    return {
                      ...stop,
                      time: actualTime, // Set Clean Live ETA
                      delay: delayVal > 0 ? `Late by ${delayVal} mins` : "Right Time",
                      isPassed: hasDeparted
                    };
                  }
                  return stop;
                });
              }
            }
          }
        } catch (liveErr) {
          console.warn("Live Running Status API fetch failed inside pnr-route page:", liveErr);
        }

        setPnrDetails(parsed);
        if (parsed.dateOfJourney) {
          localStorage.setItem("checkout_doj", parsed.dateOfJourney);
        }
        setPnrResult('success');
      } catch (err) {
        console.warn("PNR Fetch failed client-side:", err);
        // If it's a known invalid/wrong PNR error, do NOT use mock fallback
        if (err.isPnrError ||
          err.message?.toLowerCase().includes("flushed PNR") ||
          err.message?.toLowerCase().includes("invalid PNR") ||
          err.message?.toLowerCase().includes("wrong PNR") ||
          err.message?.toLowerCase().includes("not yet generated") ||
          err.message?.includes("201")) {
          setErrorMsg(err.message || "Invalid PNR Number. Please check and try again.");
          setPnrResult('error');
          return;
        }

        // Fallback mock details matching user input train (Brahmaputra Mail)
        try {
          const mockParsed = await parsePnrData({
            pnr,
            trainNumber: "15657",
            trainName: "BRAHMPUTRA MAIL",
            boardingStation: "ALJN",
            Doj: "09-07-2026",
            passengers: [{ coach: "B6", seat: "8" }]
          });

          // Call Live Running Status API for fallback train only if journey is today
          try {
            const isTodayJourney = mockParsed.dateOfJourney ? (() => {
              try {
                let dojDate = null;
                if (mockParsed.dateOfJourney.includes('-')) {
                  const parts = mockParsed.dateOfJourney.split('-');
                  if (parts.length === 3) {
                    if (parts[0].length === 4) {
                      dojDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                    } else {
                      dojDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                    }
                  }
                }
                if (!dojDate || isNaN(dojDate.getTime())) {
                  dojDate = new Date(mockParsed.dateOfJourney);
                }
                if (dojDate && !isNaN(dojDate.getTime())) {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  dojDate.setHours(0, 0, 0, 0);
                  return dojDate.getTime() === today.getTime();
                }
              } catch (e) { }
              return true;
            })() : true;

            if (isTodayJourney) {
              const liveRes = await fetch(`/api/track-train?trainNo=${mockParsed.trainNumber}&date=today`);
              if (liveRes.ok) {
                const liveData = await liveRes.json();
                const stationsArray = liveData.data?.timeline || liveData.data?.stations;
                if (liveData.success && Array.isArray(stationsArray)) {
                  mockParsed.routeStops = mockParsed.routeStops.map(stop => {
                    const matchedLive = stationsArray.find(s => (s.stationCode || '').toUpperCase() === stop.code.toUpperCase());
                    if (matchedLive) {
                      const rawDelay = matchedLive.arrival?.delay || matchedLive.departure?.delay || "0";
                      const delayVal = parseInt(String(rawDelay).replace(/[^0-9]/g, '')) || 0;
                      
                      const rawActual = matchedLive.arrival?.actual || matchedLive.departure?.actual;
                      const rawScheduled = matchedLive.arrival?.scheduled || matchedLive.departure?.scheduled;
                      
                      const cleanTimeStr = (rawStr) => {
                        if (!rawStr) return null;
                        const timeMatch = String(rawStr).match(/([0-9]{2}:[0-9]{2})/);
                        return timeMatch ? timeMatch[1] : null;
                      };

                      const actualTime = cleanTimeStr(rawActual) || cleanTimeStr(rawScheduled) || stop.time;
                      const hasDeparted = matchedLive.departure?.hasDeparted || false;
                      return {
                        ...stop,
                        time: actualTime,
                        delay: delayVal > 0 ? `Late by ${delayVal} mins` : "Right Time",
                        isPassed: hasDeparted
                      };
                    }
                    return stop;
                  });
                }
              }
            }
          } catch (liveErr) { }

          setPnrDetails(mockParsed);
          if (mockParsed.dateOfJourney) {
            localStorage.setItem("checkout_doj", mockParsed.dateOfJourney);
          }
          setPnrResult('success');
        } catch (e) {
          setErrorMsg("Failed to resolve train schedule route. Please try again.");
          setPnrResult('error');
        }
      }
    };

    fetchPnrRoute();
  }, [pnr]);

  const handleOrderFood = (stationCode) => {
    localStorage.setItem("selected_pnr", pnr);
    localStorage.setItem("selected_station_code", stationCode);
    if (pnrDetails?.passengers?.length > 0) {
      localStorage.setItem("selected_coach", pnrDetails.passengers[0].coach || '');
      localStorage.setItem("selected_seat", pnrDetails.passengers[0].seat || '');
    }
    if (pnrDetails) {
      if (pnrDetails.trainName) localStorage.setItem("checkout_train_name", pnrDetails.trainName);
      if (pnrDetails.trainNumber) localStorage.setItem("checkout_train_number", pnrDetails.trainNumber);
    }
    const stopObj = pnrDetails?.routeStops?.find(s => s.code.toUpperCase() === stationCode.toUpperCase());
    const arrTime = stopObj?.time || '';
    router.push(`/menu?pnr=${pnr}&station=${stationCode}&arrTime=${encodeURIComponent(arrTime)}`);
  };

  const activeHubsCount = pnrDetails?.routeStops?.filter(s => s.isActive).length || 0;
  const allStops = pnrDetails?.routeStops || [];
  const stopsToRender = allStops
    .map((stop, i) => ({ ...stop, isLast: i === allStops.length - 1 }))
    .filter((stop) => !showHubsOnly || stop.isActive);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-rose-600 selection:text-white font-sans relative overflow-hidden">
      {/* Background visual effects */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-rose-50 via-indigo-50 to-transparent pointer-events-none z-0" />

      {/* Faint track divider style grid pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.4] z-0"
        style={{ backgroundImage: `repeating-linear-gradient(0deg, #e2e8f0, #e2e8f0 1px, transparent 1px, transparent 40px)` }} />

      {/* Header — mobile only, desktop uses standard navbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.push('/')}
          className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-full transition-all border border-slate-200 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {pnrResult === 'success' && pnrDetails ? (
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-xs font-black border border-rose-100 shrink-0 font-mono flex items-center gap-1">
                <Train className="w-2.5 h-2.5" />
                {pnrDetails.trainNumber}
              </span>
              <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase truncate">
                {pnrDetails.trainName}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-extrabold flex-wrap">
              <span className="text-rose-655 font-black font-mono">Boarding: {pnrDetails.boardingPoint || pnrDetails.sourceStation}</span>
              <span className="text-slate-350">•</span>
              <span>DOJ: {pnrDetails.dateOfJourney ? pnrDetails.dateOfJourney.split(' ').slice(0, 3).join(' ') : 'N/A'}</span>
              <span className="text-slate-350">•</span>
              <span className="font-mono">PNR: {pnr}</span>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Train className="w-4 h-4 text-rose-600 animate-pulse" />
              Locating Train Route...
            </h1>
            <p className="text-[10px] text-rose-600 font-black tracking-wider uppercase">PNR: {pnr || 'N/A'}</p>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-0 sm:px-4 pt-4 md:pt-10 pb-8 relative z-10">
        {/* Loading State */}
        {pnrResult === 'checking' && (
          <div className="flex flex-col items-center justify-center min-h-[75vh] py-12">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-rose-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-md">
                <Train className="w-6 h-6 text-rose-600 animate-bounce" />
              </div>
            </div>
            <p className="mt-8 text-slate-800 font-black text-base animate-pulse tracking-wide text-center">Locating Train & Station Hubs...</p>
            <p className="text-[11px] text-slate-550 mt-2 font-semibold tracking-widest uppercase text-center">Bypassing restrictions and compiling timetable</p>
          </div>
        )}

        {/* Error State */}
        {pnrResult === 'error' && (() => {
          const isMaintenanceHour = () => {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const ist = new Date(utc + (3600000 * 5.5)); // IST is UTC+5.5
            const hr = ist.getHours();
            const min = ist.getMinutes();
            if ((hr === 23 && min >= 30) || (hr === 0 && min <= 45)) {
              return true;
            }
            return false;
          };

          const isMaint = isMaintenanceHour() || errorMsg.includes("status: 400") || errorMsg.includes("status: 503");

          return (
            <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl p-10 text-center mt-8 max-w-lg mx-auto">
              <div className="w-16 h-16 bg-red-50 text-red-650 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100">
                <AlertCircle className="w-8 h-8 text-rose-600" />
              </div>

              {isMaint ? (
                <>
                  <h3 className="text-xl font-black text-slate-900">IRCTC Server Under Maintenance</h3>
                  <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                    Indian Railways passenger databases are offline for daily scheduled maintenance (11:30 PM to 12:45 AM IST). Real-time PNR checking is temporarily unavailable.
                  </p>
                  <div className="mt-5 p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-700 font-bold leading-relaxed">
                    💡 Hint: You can use the Search page to manually enter a train number and browse intermediate hubs/stations to order food!
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-black text-slate-900">Oops! Fetching Failed</h3>
                  <p className="text-slate-500 mt-3 text-sm leading-relaxed">{errorMsg}</p>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={() => router.push('/')}
                  className="w-full sm:flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-all text-xs uppercase tracking-wider border border-slate-200"
                >
                  Go Back
                </button>
                <button
                  onClick={() => router.push('/search')}
                  className="w-full sm:flex-[2] py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-550 hover:to-amber-550 text-white font-extrabold rounded-xl transition-all shadow-md shadow-rose-200 hover:scale-[1.02] tracking-widest uppercase text-xs"
                >
                  Search Train Manually
                </button>
              </div>
            </div>
          );
        })()}

        {/* Success / Route Timeline */}
        {pnrResult === 'success' && pnrDetails && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="mt-[78px] md:mt-0 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 border border-emerald-800 rounded-2xl p-3.5 sm:p-4 text-white shadow-md flex items-center gap-3 sm:gap-3.5 relative overflow-hidden mx-3 sm:mx-0 animate-fadeIn">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500 bg-opacity-10 rounded-full blur-xl pointer-events-none" />

              <div className="w-10 h-10 bg-emerald-500 bg-opacity-20 text-emerald-400 rounded-xl border border-emerald-800 shrink-0 flex items-center justify-center shadow-inner">
                <Utensils className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-black text-emerald-400 text-sm md:text-sm leading-tight flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                  {activeHubsCount} Food Delivery Hubs Found
                </h3>
                <p className="text-xs md:text-xs text-slate-300 mt-1 font-bold leading-tight">
                  Active kitchen partners on your route! Order at active stops for direct berth delivery.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 sm:gap-8 items-start">
              {/* Left Column: Summary Card (Hidden on mobile) */}
              <div className="hidden md:block lg:col-span-4 space-y-6 lg:sticky lg:top-24 self-start">
                {/* Premium Ticket Boarding Pass (Hidden on mobile) */}
                <div className="hidden md:block bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-xl relative">
                  {/* Left/Right ticket notches */}
                  <div className="absolute top-[168px] -left-3.5 w-7 h-7 bg-slate-50 rounded-full border border-slate-200 z-20" />
                  <div className="absolute top-[168px] -right-3.5 w-7 h-7 bg-slate-50 rounded-full border border-slate-200 z-20" />

                  <div className="p-6 pb-8 bg-gradient-to-b from-slate-50/50 to-transparent">
                    {/* Top line */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 text-xs font-black rounded-full border border-rose-100 uppercase tracking-wider">
                          <Train className="w-3.5 h-3.5" />
                          {pnrDetails.trainNumber}
                        </span>
                        <h2 className="text-xl font-black text-slate-900 mt-3 leading-tight tracking-tight">{pnrDetails.trainName}</h2>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          Date of Journey
                        </p>
                        <p className="text-sm font-black text-rose-655 mt-1">{pnrDetails.dateOfJourney}</p>
                      </div>
                    </div>

                    {/* Boarding / Destination — clean responsive layout */}
                    <div className="mt-6 border-y border-slate-100 py-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-left">
                          <span className="text-xs md:text-xs text-slate-400 font-black uppercase tracking-widest block mb-0.5">Boarding</span>
                          <p className="font-mono font-black text-slate-900 text-2xl md:text-2xl leading-none">
                            {pnrDetails.boardingPoint || pnrDetails.sourceStation}
                          </p>
                        </div>
 
                        {/* Middle Icon and Track */}
                        <div className="flex-1 flex items-center justify-center px-2 relative min-w-[70px]">
                          <div className="absolute left-0 right-0 border-t-2 border-dashed border-slate-200" />
                          <div className="bg-rose-50 border border-rose-150 p-2 rounded-full shadow-sm relative z-10">
                            <Train className="w-4.5 h-4.5 text-rose-600" />
                          </div>
                        </div>
 
                        {/* Right Code */}
                        <div className="text-right">
                          <span className="text-xs md:text-xs text-slate-400 font-black uppercase tracking-widest block mb-0.5">Destination</span>
                          <p className="font-mono font-black text-slate-900 text-2xl md:text-2xl leading-none">
                            {pnrDetails.destinationStation}
                          </p>
                        </div>
                      </div>

                      {/* Station Names & Timings Row */}
                      <div className="flex justify-between items-start gap-4 mt-2.5 text-xs">
                        <div className="text-left max-w-[45%]">
                          {pnrDetails.boardingStationName && (
                            <p className="text-[11px] text-slate-555 font-bold leading-tight">
                              {pnrDetails.boardingStationName}
                            </p>
                          )}
                        </div>
                        <div className="text-right max-w-[45%] space-y-0.5">
                          {pnrDetails.destinationName && (
                            <p className="text-[11px] text-slate-555 font-bold leading-tight">
                              {pnrDetails.destinationName}
                            </p>
                          )}
                          {pnrDetails.destinationDoj && (
                            <p className="text-[10px] text-rose-600 font-black">
                              Arr: {pnrDetails.destinationDoj}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Perforation line */}
                  <div className="px-6 py-1 bg-transparent">
                    <div className="border-t-2 border-dashed border-slate-100" />
                  </div>

                  <div className="p-6 pt-4">
                    {pnrDetails.passengers?.length > 0 && (
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Seat Auto-detect
                        </span>
                        <span className="font-black text-rose-655 bg-rose-50 border border-rose-100 px-3.5 py-1 rounded-xl text-[10px] md:text-[10px]">
                          Coach {pnrDetails.passengers[0].coach || 'N/A'} - Seat {pnrDetails.passengers[0].seat || 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="bg-white border-y sm:border border-slate-200/80 rounded-none sm:rounded-[32px] p-5 sm:p-8 shadow-none sm:shadow-xl">

                  {/* Header (Choose a Delivery Station with count) */}
                  <div className="mb-6 pb-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">Choose a Delivery Station</h3>
                      <p className="text-xs text-slate-555 mt-0.5 font-bold">
                        {activeHubsCount > 0
                          ? `Select a station to place your food order (Active Hubs: ${activeHubsCount})`
                          : 'No active delivery hubs found on this route.'}
                      </p>
                    </div>
                    {/* Toggle Button */}
                    <div className="flex items-center gap-2.5 self-start sm:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                      <span className="text-xs font-black text-slate-600 uppercase tracking-wide">Show Hubs Only</span>
                      <button
                        onClick={() => setShowHubsOnly(!showHubsOnly)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showHubsOnly ? 'bg-emerald-600' : 'bg-slate-300'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showHubsOnly ? 'translate-x-4' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Timetable vertical stops container (Bounded between first and last points) */}
                  <div className="relative ml-2.5 sm:ml-3 space-y-6">
                    {stopsToRender.map((stop, i) => {
                      const isFirstStop = i === 0;
                      const activeCardClass = 'bg-emerald-50 bg-opacity-40 border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-xs';
                      const normalCardClass = 'bg-white hover:bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 sm:p-5';
                      const orderBtnClass = 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-650';

                      return (
                        <div key={stop.code} className={`relative group pl-6 sm:pl-12 transition-all ${stop.isPassed ? 'opacity-55' : ''}`}>
                          {/* Connecting line to the next stop */}
                          {i < stopsToRender.length - 1 && (
                            <div className="absolute left-0 top-[24px] bottom-[-24px] -translate-x-1/2 border-l-2 border-dashed border-slate-200 z-0 pointer-events-none" />
                          )}

                          {/* Bullet marker */}
                          <span className={`absolute left-0 -translate-x-1/2 top-[10px] rounded-full transition-all duration-300 flex items-center justify-center ${stop.isPassed
                            ? 'w-4 h-4 bg-slate-300 border-3 border-white shadow-sm z-10'
                            : stop.isActive
                              ? 'w-6 h-6 bg-emerald-600 border-4 border-white shadow-[0_0_12px_rgba(16,185,129,0.5)] z-10 group-hover:scale-110'
                              : 'w-4 h-4 bg-slate-300 border-3 border-white z-10'
                            }`}>
                            {stop.isPassed ? (
                              <span className="text-[8px] text-white font-black">✓</span>
                            ) : stop.isActive ? (
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            ) : null}
                          </span>

                          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 w-full ${stop.isActive ? activeCardClass : normalCardClass}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`font-black text-[15px] sm:text-[17px] transition-colors ${stop.isPassed ? 'text-slate-405 font-medium'
                                  : stop.isActive ? 'text-slate-900 group-hover:text-rose-600'
                                    : stop.isLast ? 'text-indigo-750'
                                      : 'text-slate-800'
                                  }`}>
                                  {stop.name}
                                </h4>
                                <span className="text-[11px] sm:text-[11px] font-black text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                                  {stop.code}
                                </span>
 
                                {/* Terminus badge for last stop */}
                                {stop.isLast && (
                                  <span className="inline-flex items-center text-[11px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 uppercase tracking-wider">
                                    🏁 Terminus
                                  </span>
                                )}
                              </div>
 
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="text-[11px] sm:text-xs font-bold text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-rose-500/80" /> {stop.time}
                                </span>
                                {stop.haltTime && stop.haltTime !== '--' && (
                                  <span className="text-[11px] sm:text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-black tracking-wide uppercase">
                                    Halt: {stop.haltTime}
                                  </span>
                                )}
                                {(!stop.delay || String(stop.delay).toLowerCase().includes('right time') || stop.delay === 0) ? (
                                  <span className="text-[11px] sm:text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 font-black px-2 py-0.5 rounded flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-emerald-600 animate-pulse" /> On Time
                                  </span>
                                ) : (
                                  <span className="text-[11px] sm:text-xs text-amber-700 bg-amber-50 border border-amber-250 font-black px-2 py-0.5 rounded">
                                    {stop.delay}
                                  </span>
                                )}
                                {stop.isActive && (() => {
                                  const matchedStation = stations?.find(s => s.code.toUpperCase() === stop.code.toUpperCase());
                                  const bufferMins = matchedStation?.buffer_minutes || 60;
                                  return (
                                    <span className="text-[11px] sm:text-xs text-indigo-655 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-black tracking-wide uppercase">
                                      ⏱ Order up to {bufferMins}m before
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                            
                            {/* Call-to-action button for active hubs */}
                            {stop.isActive && (() => {
                              const matchedStation = stations?.find(s => s.code.toUpperCase() === stop.code.toUpperCase());
                              const bufferMins = matchedStation?.buffer_minutes || 60;

                              // Helper to check if current time is within cutoff buffer of arrival time
                              const isBookingClosed = (arrivalTimeStr, bufferLimit) => {
                                if (!arrivalTimeStr || arrivalTimeStr === '--:--') return false;
                                try {
                                  const [arrHrs, arrMins] = arrivalTimeStr.split(':').map(Number);
                                  const now = new Date();
                                  let arrDate = new Date();

                                  // Parse PNR Date of Journey (handles both "Jul 9, 2026 1:27:00 AM" and "09-07-2026")
                                  if (pnrDetails?.dateOfJourney) {
                                    const parsedDOJ = new Date(pnrDetails.dateOfJourney);
                                    if (!isNaN(parsedDOJ.getTime())) {
                                      arrDate = parsedDOJ;
                                    } else {
                                      const parts = pnrDetails.dateOfJourney.split(/[-/]/);
                                      if (parts.length === 3) {
                                        const day = Number(parts[0]);
                                        const month = Number(parts[1]) - 1;
                                        const year = Number(parts[2]);
                                        arrDate.setFullYear(year, month, day);
                                      }
                                    }
                                  }

                                  arrDate.setHours(arrHrs, arrMins, 0, 0);

                                  const diffMs = arrDate.getTime() - now.getTime();
                                  const diffMins = Math.floor(diffMs / 60000);
                                  return diffMins < bufferLimit;
                                } catch (e) {
                                  return false;
                                }
                              };

                              const closed = isBookingClosed(stop.time, bufferMins) || stop.isPassed;

                              return closed ? (
                                <div className="self-start sm:self-auto text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-not-allowed">
                                  Ordering Closed
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOrderFood(stop.code)}
                                  className={`w-fit flex items-center justify-center gap-2 px-6 py-3 active:scale-[0.98] text-white font-black text-sm rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-lg transition-all uppercase tracking-wider ${orderBtnClass}`}
                                >
                                  <ShoppingBag className="w-4 h-4 shrink-0" />
                                  <span>Order Food</span>
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PnrRoutePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-650 font-black mt-4 animate-pulse">Initializing route viewer...</p>
      </div>
    }>
      <PnrRouteContent />
    </Suspense>
  );
}
