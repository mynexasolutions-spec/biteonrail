"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Train, MapPin, Utensils, Clock, AlertCircle, ShieldCheck, Sparkles, ShoppingBag } from 'lucide-react';

function TrainRouteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { stations } = useApp();
  
  const trainNo = searchParams.get('trainNo') || '';
  const trainName = searchParams.get('trainName') || 'Train';

  const [loading, setLoading] = useState(true);
  const [rawStops, setRawStops] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [showHubsOnly, setShowHubsOnly] = useState(true);
  const [displayDoj, setDisplayDoj] = useState('TODAY');
  const [lastUpdated, setLastUpdated] = useState('');
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    if (!trainNo) {
      setErrorMsg("No train number provided. Please search and select a train.");
      setLoading(false);
      return;
    }

    const dateParam = searchParams.get('date') || '';

    // Clear previous order checkout cache to prevent conflicts
    localStorage.removeItem("checkout_arr_time");
    localStorage.removeItem("checkout_train_name");
    localStorage.removeItem("checkout_train_number");
    localStorage.removeItem("selected_coach");
    localStorage.removeItem("selected_seat");
    localStorage.removeItem("selected_station_code");

    if (dateParam) {
      localStorage.setItem("checkout_doj", dateParam);
      try {
        const parts = dateParam.split('-');
        if (parts.length === 3) {
          setDisplayDoj(`${parts[2]}-${parts[1]}-${parts[0]}`); // Format: DD-MM-YYYY
        } else {
          setDisplayDoj(dateParam);
        }
      } catch (e) {
        setDisplayDoj(dateParam);
      }
    } else {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const formattedToday = `${dd}-${mm}-${yyyy}`;
      localStorage.setItem("checkout_doj", formattedToday);
      setDisplayDoj(formattedToday);
    }

    const fetchTrainRoute = async () => {
      try {
        setLoading(true);
        const resSched = await fetch(`/api/train-schedule?trainNo=${trainNo}`);
        if (!resSched.ok) {
          throw new Error("Unable to fetch train route database.");
        }
        const schedData = await resSched.json();
        const stops = schedData.data?.route || [];
        
        if (stops.length === 0) {
          throw new Error("Train route details not found in schedule database.");
        }

        let mapped = stops.map((stop, idx) => {
          const code = (stop.stationCode || stop.stnCode || stop.code || '').toUpperCase();
          const name = stop.stationName || stop.stnName || stop.name || 'Station';
          
          const arrTime = stop.arrivalTime || stop.arrival || '--';
          const depTime = stop.departureTime || stop.departure || '--';
          const stopTime = arrTime !== '--' ? arrTime : (depTime !== '--' ? depTime : 'N/A');

          const haltVal = stop.halt || stop.haltTime || stop.haltDuration || '';
          const isFirst = idx === 0;
          const isLast = idx === stops.length - 1;
          const haltTime = isFirst ? 'First Stop' : (isLast ? 'Last Stop' : haltVal);

          return {
            id: idx + 1,
            code,
            name,
            time: stopTime,
            haltTime,
            isLast,
            delay: "Right Time",
            isPassed: false,
            day: parseInt(stop.day || 1, 10),
            depTime: stop.departure || stop.departureTime || '--'
          };
        });

        // Fetch live tracking if date is present and merge timings
        if (dateParam) {
          try {
            // Determine active/boarding station for day-offset subtraction
            let activeStation = localStorage.getItem("selected_station_code") || '';
            if (!activeStation && stations && stations.length > 0) {
              const firstHub = mapped.find(stop =>
                stations.some(s => s.code.toUpperCase() === stop.code.toUpperCase())
              );
              if (firstHub) {
                activeStation = firstHub.code;
              }
            }

            let dayOffset = 0;
            if (activeStation && mapped.length > 0) {
              const match = mapped.find(s => s.code.toUpperCase() === activeStation.toUpperCase());
              if (match && match.day) {
                dayOffset = Math.max(0, parseInt(match.day, 10) - 1);
              }
            }

            let dojParam = dateParam;
            if (dateParam && dayOffset > 0) {
              try {
                let dojDate = null;
                if (dateParam.includes('-')) {
                  const parts = dateParam.split('-');
                  if (parts.length === 3) {
                    if (parts[0].length === 4) {
                      dojDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                    } else {
                      dojDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                    }
                  }
                } else {
                  dojDate = new Date(dateParam);
                }
                if (dojDate && !isNaN(dojDate.getTime())) {
                  dojDate.setDate(dojDate.getDate() - dayOffset);
                  const yyyy = dojDate.getFullYear();
                  const mm = String(dojDate.getMonth() + 1).padStart(2, '0');
                  const dd = String(dojDate.getDate()).padStart(2, '0');
                  dojParam = `${yyyy}-${mm}-${dd}`;
                }
              } catch (dateErr) {
                console.warn("Date subtraction failed:", dateErr);
              }
            }

            const resLive = await fetch(`/api/track-train?trainNo=${trainNo}&date=${dojParam}`);
            if (resLive.ok) {
              const liveData = await resLive.json();
              if (liveData.success && liveData.data?.lastUpdate) {
                setLastUpdated(liveData.data.lastUpdate);
              }
              if (liveData.success && liveData.data?.statusNote) {
                setStatusNote(liveData.data.statusNote);
              }
              if (liveData.success === false && liveData.error && String(liveData.error).toLowerCase().includes('greater than today')) {
                setStatusNote("Yet to start from its source");
                setLastUpdated("");
              }
              const stationsArray = liveData.data?.timeline || liveData.data?.stations || [];
              if (stationsArray.length > 0) {
                mapped = mapped.map(stop => {
                  const matchedLive = stationsArray.find(s => (s.stationCode || s.code || '').toUpperCase() === stop.code.toUpperCase());
                  if (matchedLive) {
                    const rawActual = matchedLive.arrival?.actual || matchedLive.departure?.actual;
                    const rawScheduled = matchedLive.arrival?.scheduled || matchedLive.departure?.scheduled;
                    
                    const parseLiveDateTime = (timeStr, baseYear = new Date().getFullYear()) => {
                      if (!timeStr || timeStr === 'SRC' || timeStr === 'DST' || timeStr === '--') return null;
                      const cleanStr = timeStr.replace('*', '').trim();
                      const parts = cleanStr.split(' ');
                      if (parts.length < 2) return null;
                      const [timePart, datePart] = parts;
                      const [hrs, mins] = timePart.split(':').map(Number);
                      
                      const dateParts = datePart.split('-');
                      let day = 1;
                      let month = 0;
                      let year = baseYear;
                      
                      if (dateParts.length >= 2) {
                        day = parseInt(dateParts[0], 10);
                        const monthStr = dateParts[1];
                        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
                        const idx = months.findIndex(m => monthStr.toLowerCase().startsWith(m));
                        if (idx !== -1) {
                          month = idx;
                        } else {
                          month = parseInt(monthStr, 10) - 1;
                        }
                      }
                      if (dateParts.length === 3) {
                        year = parseInt(dateParts[2], 10);
                      }
                      
                      return new Date(year, month, day, hrs, mins, 0, 0);
                    };

                    const depDate = parseLiveDateTime(matchedLive.departure?.actual || matchedLive.departure?.scheduled);
                    const isPassed = depDate ? (depDate.getTime() < new Date().getTime()) : (matchedLive.status === 'departed' || matchedLive.status === 'passed' || matchedLive.departure?.hasDeparted || false);

                    const cleanTimeStr = (rawStr) => {
                      if (!rawStr) return null;
                      const timeMatch = String(rawStr).match(/([0-9]{2}:[0-9]{2})/);
                      return timeMatch ? timeMatch[1] : null;
                    };

                    const actualTime = cleanTimeStr(rawActual) || cleanTimeStr(rawScheduled) || stop.time;
                    const rawDelay = matchedLive.arrival?.delay || matchedLive.departure?.delay || "0";
                    const delayVal = parseInt(String(rawDelay).replace(/[^0-9]/g, '')) || 0;

                    return {
                      ...stop,
                      time: actualTime,
                      delay: delayVal > 0 ? `Late by ${delayVal} mins` : "Right Time",
                      isPassed
                    };
                  }
                  return stop;
                });
              }
            }
          } catch (liveErr) {
            console.warn("Live status merge failed inside train-route:", liveErr);
          }
        }

        setRawStops(mapped);
        setLoading(false);
      } catch (err) {
        console.warn("Train Route Fetch failed:", err);
        setErrorMsg(err.message || "Failed to load train route. Please try again later.");
        setLoading(false);
      }
    };

    fetchTrainRoute();
  }, [trainNo]);

  // Compute active hubs and match stops against database dynamically without re-triggering API calls
  const routeStops = React.useMemo(() => {
    return rawStops.map(stop => {
      const dbStation = stations.find(s => s.code.toUpperCase() === stop.code.toUpperCase());
      return {
        ...stop,
        isHub: !!dbStation,
        dbStation
      };
    });
  }, [rawStops, stations]);

  const activeHubs = routeStops.filter(stop => stop.isHub);
  const displayStops = showHubsOnly ? activeHubs : routeStops;

  const isBookingClosed = (stop, bufferLimit) => {
    const arrivalTimeStr = stop.time;
    if (!arrivalTimeStr || arrivalTimeStr === '--:--' || arrivalTimeStr === 'N/A') return true;
    try {
      const [arrHrs, arrMins] = arrivalTimeStr.split(':').map(Number);
      const now = new Date();
      let arrDate = new Date();

      const dateParam = searchParams.get('date') || '';
      if (dateParam) {
        let parsedDOJ = null;
        if (dateParam.includes('-')) {
          const parts = dateParam.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              parsedDOJ = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            } else {
              parsedDOJ = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
          }
        }
        if (!parsedDOJ || isNaN(parsedDOJ.getTime())) {
          parsedDOJ = new Date(dateParam);
        }
        if (parsedDOJ && !isNaN(parsedDOJ.getTime())) {
          arrDate = new Date(parsedDOJ);
        }
      }

      // Apply the stop day offset (e.g. stop.day = 2 implies Day 2, so offset is stop.day - 1)
      const dayOffset = Math.max(0, (stop.day || 1) - 1);
      arrDate.setDate(arrDate.getDate() + dayOffset);

      arrDate.setHours(arrHrs, arrMins, 0, 0);

      const diffMs = arrDate.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      return diffMins < bufferLimit;
    } catch (e) {
      return false;
    }
  };

  const handleStationSelect = (stop) => {
    if (!stop.isHub) return;
    localStorage.setItem("selected_station_code", stop.code);
    localStorage.setItem("checkout_arr_time", stop.time);
    localStorage.setItem("checkout_train_name", trainName);
    localStorage.setItem("checkout_train_number", trainNo);
    router.push(`/menu?station=${stop.code}&trainName=${encodeURIComponent(trainName)}&trainNumber=${trainNo}&arrTime=${encodeURIComponent(stop.time)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-4 border-rose-600 border-t-transparent animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-black text-slate-800 text-sm tracking-tight uppercase">Loading Train Route</h3>
          <p className="text-xs text-slate-400 font-bold">Matching database delivery junctions...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Error Loading Route</h3>
        <p className="text-xs text-slate-555 max-w-xs mx-auto mt-1 font-bold">{errorMsg}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-full transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 pb-16 pt-[78px] md:pt-8 font-sans">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
        
        {/* Navigation header - Sticky Mobile Navbar (Hidden on Desktop) */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 py-3.5 px-4 flex items-center gap-3 md:hidden animate-slideDown">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-xs shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[10px] md:text-sm font-black text-slate-450 uppercase tracking-widest leading-none">Train Live Route</h1>
            <p className="text-sm md:text-lg font-black text-slate-900 mt-0.5 md:mt-1 truncate">{trainName} ({trainNo})</p>
          </div>
        </div>

        {/* Info Header Banner exactly like PNR route success banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 border border-emerald-800 rounded-2xl p-3.5 sm:p-4 text-white shadow-md flex items-center gap-3 sm:gap-3.5 relative overflow-hidden mb-6 animate-fadeIn mx-3 sm:mx-0">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500 bg-opacity-10 rounded-full blur-xl pointer-events-none" />

          <div className="w-10 h-10 bg-emerald-500 bg-opacity-20 text-emerald-400 rounded-xl border border-emerald-800 shrink-0 flex items-center justify-center shadow-inner">
            <Utensils className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-black text-emerald-400 text-sm md:text-base leading-tight flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              {activeHubs.length} Food Delivery Hubs Found
            </h3>
            <p className="text-xs md:text-sm text-slate-300 mt-1 font-semibold leading-tight">
              Active kitchen partners on your route! Order at active stops for direct berth delivery.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 sm:gap-8 items-start">
          {/* Left Column: Premium Ticket Boarding Pass */}
          <div className="hidden md:block lg:col-span-4 space-y-6 lg:sticky lg:top-24 self-start">
            <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-xl relative">
              {/* Left/Right ticket notches */}
              <div className="absolute top-[168px] -left-3.5 w-7 h-7 bg-slate-50 rounded-full border border-slate-200 z-20" />
              <div className="absolute top-[168px] -right-3.5 w-7 h-7 bg-slate-50 rounded-full border border-slate-200 z-20" />

              <div className="p-6 pb-8 bg-gradient-to-b from-slate-50/50 to-transparent">
                {/* Top line */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 text-xs font-black rounded-full border border-rose-100 uppercase tracking-wider">
                      <Train className="w-3.5 h-3.5" />
                      {trainNo}
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-3 leading-tight tracking-tight">{trainName}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Date of Journey
                    </p>
                    <p className="text-sm font-black text-rose-655 mt-1">{displayDoj}</p>
                  </div>
                </div>

                {/* Boarding / Destination — clean responsive layout */}
                <div className="mt-6 border-y border-slate-100 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-left">
                      <span className="text-xs md:text-xs text-slate-400 font-black uppercase tracking-widest block mb-0.5">Origin</span>
                      <p className="font-mono font-black text-slate-900 text-2xl md:text-3xl leading-none">
                        {rawStops[0]?.code || 'SRC'}
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
                      <p className="font-mono font-black text-slate-900 text-2xl md:text-3xl leading-none">
                        {rawStops[rawStops.length - 1]?.code || 'DST'}
                      </p>
                    </div>
                  </div>

                  {/* Station Names & Timings Row */}
                  <div className="flex justify-between items-start gap-4 mt-2.5 text-xs">
                    <div className="text-left max-w-[45%]">
                      <p className="text-[11px] md:text-sm text-slate-555 font-bold leading-tight">
                        {rawStops[0]?.name}
                      </p>
                    </div>
                    <div className="text-right max-w-[45%]">
                      <p className="text-[11px] md:text-sm text-slate-555 font-bold leading-tight">
                        {rawStops[rawStops.length - 1]?.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Perforation line */}
              <div className="px-6 py-1 bg-transparent">
                <div className="border-t-2 border-dashed border-slate-100" />
              </div>

              <div className="p-6 pt-4">
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex justify-between items-center text-xs md:text-sm">
                  <span className="text-slate-600 font-bold flex items-center gap-1.5 md:text-[13px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Direct Station Match
                  </span>
                  <span className="font-black text-rose-655 bg-rose-50 border border-rose-100 px-4 py-1.5 rounded-xl text-[10px] md:text-xs">
                    Active Route
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Route Timeline Stops */}
          <div className="lg:col-span-8 bg-white border-y sm:border border-slate-200/80 rounded-none sm:rounded-[32px] p-5 sm:p-8 shadow-none sm:shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 mb-6 gap-4">
              <div>
                <h3 className="text-base sm:text-2xl font-black text-slate-900 leading-tight">Choose a Delivery Station</h3>
                <p className="text-xs sm:text-sm text-slate-555 mt-1 font-semibold">
                  {activeHubs.length > 0
                    ? `Select a station to place your food order (Active Hubs: ${activeHubs.length})`
                    : 'No active delivery hubs found on this route.'}
                </p>
                {lastUpdated && (
                  <p className="text-[10px] sm:text-xs md:text-sm text-slate-400 font-extrabold mt-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    Last Updated: {lastUpdated}
                  </p>
                )}
                {statusNote && (
                  <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-150 px-3 py-1.5 rounded-xl font-bold mt-2 w-fit flex items-center gap-1.5 shadow-xs">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-650"></span>
                    </span>
                    {statusNote}
                  </p>
                )}
              </div>
              
              {/* Toggle hubs only filter */}
              <div className="flex items-center justify-between gap-2.5 shrink-0 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto w-full sm:w-auto">
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

            {/* Timeline Wrapper exactly matching pnr-route dot connectors */}
            <div className="relative ml-2.5 sm:ml-3 space-y-6">
              {displayStops.map((stop, i) => {
                const activeCardClass = 'bg-emerald-50 bg-opacity-40 border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-xs';
                const normalCardClass = 'bg-white hover:bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 sm:p-5';

                return (
                  <div key={stop.code} className={`relative group pl-6 sm:pl-12 transition-all ${stop.isPassed ? 'opacity-55' : ''}`}>
                    {/* Connecting line to the next stop */}
                    {i < displayStops.length - 1 && (
                      <div className="absolute left-0 top-[24px] bottom-[-24px] -translate-x-1/2 border-l-2 border-dashed border-slate-200 z-0 pointer-events-none" />
                    )}

                    {/* Timeline bullet node */}
                    <span className={`absolute left-0 -translate-x-1/2 top-[10px] rounded-full transition-all duration-300 flex items-center justify-center ${
                      stop.isPassed
                        ? 'w-4 h-4 bg-slate-300 border-3 border-white shadow-sm z-10'
                        : stop.isHub
                          ? 'w-6 h-6 bg-emerald-600 border-4 border-white shadow-[0_0_12px_rgba(16,185,129,0.5)] z-10 group-hover:scale-110'
                          : 'w-4 h-4 bg-slate-300 border-3 border-white z-10'
                    }`}>
                      {stop.isPassed ? (
                        <span className="text-[8px] text-white font-black">✓</span>
                      ) : stop.isHub ? (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      ) : null}
                    </span>

                    {/* Stop detail card */}
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 w-full ${stop.isHub ? activeCardClass : normalCardClass}`}>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-black text-[15px] sm:text-[19px] transition-colors ${
                            stop.isPassed
                              ? 'text-slate-405 font-medium'
                              : stop.isHub
                                ? 'text-slate-900 group-hover:text-rose-600'
                                : 'text-slate-800'
                          }`}>
                            {stop.name}
                          </h4>
                          <span className="text-[11px] sm:text-xs font-black text-slate-500 uppercase bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 font-mono">
                            {stop.code}
                          </span>
                          {stop.day && (
                            <span className="text-[10px] sm:text-[11px] font-black text-indigo-700 uppercase bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100 font-mono tracking-wider">
                              Day {stop.day}
                            </span>
                          )}
                          {stop.isHub && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black rounded-md border border-rose-100 uppercase tracking-widest shrink-0">
                              <Utensils className="w-2.5 h-2.5" /> Food Hub
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs md:text-sm">
                           <span className="font-bold text-slate-655 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" /> Arrival: <span className="font-extrabold text-slate-900">{stop.time}</span>
                          </span>
                          {stop.haltTime && stop.haltTime !== '--' && (
                            <span className="text-slate-550 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Halt: {stop.haltTime}
                            </span>
                          )}
                          {stop.isLast && (
                            <span className="inline-flex items-center text-[11px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 uppercase tracking-wider">
                              🏁 Terminus
                            </span>
                          )}
                          {(!stop.delay || String(stop.delay).toLowerCase().includes('right time') || stop.delay === 0) ? (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 font-black px-2 py-0.5 rounded flex items-center gap-1 text-[11px] md:text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> On Time
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 border border-amber-250 font-black px-2 py-0.5 rounded text-[11px] md:text-xs">
                              {stop.delay}
                            </span>
                          )}
                        </div>

                        {stop.isHub && (() => {
                          const matchedStation = stations?.find(s => s.code.toUpperCase() === stop.code.toUpperCase());
                          const bufferMins = matchedStation?.buffer_minutes || 60;
                          return (
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50/70 border border-indigo-100 rounded-xl px-3 py-1.5 w-fit font-bold">
                              <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>Order up to <strong className="text-indigo-900 font-black">{bufferMins} mins</strong> before arrival</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Call-to-action button for active hubs */}
                      {stop.isHub && (() => {
                        const matchedStation = stations?.find(s => s.code.toUpperCase() === stop.code.toUpperCase());
                        const bufferMins = matchedStation?.buffer_minutes || 60;
                        const isClosed = isBookingClosed(stop, bufferMins) || stop.isPassed;

                        return isClosed ? (
                          <div className="self-start sm:self-auto text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-not-allowed shrink-0">
                            Ordering Closed
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStationSelect(stop)}
                            className="bg-emerald-600 hover:bg-emerald-500 border border-emerald-650 text-white px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 w-fit shrink-0 flex items-center justify-center gap-1 shadow-sm active:scale-[0.98]"
                          >
                            <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Order Food
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}

              {displayStops.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                  No stops found matching your selection.
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default function TrainRoutePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider animate-pulse">Loading Route View...</p>
      </div>
    }>
      <TrainRouteContent />
    </Suspense>
  );
}
