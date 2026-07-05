"use client";
import React from 'react';
import {
  ClipboardList, Clock, CreditCard, Coins, Database, Search, MapPin,
  Train, Phone, Utensils, ShoppingBag, Gift, IndianRupee, ChefHat, Send, Check, X, Printer, Truck, User, Calendar
} from 'lucide-react';

const isToday = (dojStr) => {
  if (!dojStr) return true;
  const cleanDoj = dojStr.replace(/\//g, '-').trim();
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const todayStr = `${dd}-${mm}-${yyyy}`;

  if (cleanDoj.includes('-')) {
    const parts = cleanDoj.split('-');
    if (parts[0].length === 4) {
      const parsedYYYY = parseInt(parts[0], 10);
      const parsedMM = parseInt(parts[1], 10);
      const parsedDD = parseInt(parts[2], 10);
      return parsedDD === today.getDate() && parsedMM === (today.getMonth() + 1) && parsedYYYY === today.getFullYear();
    } else if (parts[2].length === 4) {
      const parsedDD = parseInt(parts[0], 10);
      const parsedMM = parseInt(parts[1], 10);
      const parsedYYYY = parseInt(parts[2], 10);
      return parsedDD === today.getDate() && parsedMM === (today.getMonth() + 1) && parsedYYYY === today.getFullYear();
    }
  }
  return cleanDoj === todayStr || cleanDoj.toLowerCase() === 'today';
};

export default function OrdersTab({
  adminType,
  selectedStationCode,
  baseOrders,
  orders,
  stations,
  ordersStationFilter,
  setOrdersStationFilter,
  ordersSearchQuery,
  setOrdersSearchQuery,
  ordersSortBy,
  setOrdersSortBy,
  ordersFilterStatus,
  setOrdersFilterStatus,
  displayOrders,
  trainTrackInfo,
  trackingLoadingId,
  handleTrackTrain,
  getRevisedETA,
  updateOnDemandStatus,
  handleAssignRider,
  updateOrderStatus,
  setPrintingOrder
}) {
  const [deliveryTimelineFilter, setDeliveryTimelineFilter] = React.useState('live');

  const filteredDisplayOrders = displayOrders.filter(o => {
    const isOrderToday = isToday(o.doj);
    return deliveryTimelineFilter === 'live' ? isOrderToday : !isOrderToday;
  });

  return (
    <div className="space-y-6">

      {/* KPI Summary Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
            <span className="text-lg md:text-2xl font-black text-slate-800">{baseOrders.length}</span>
          </div>
          <div className="bg-rose-50 text-rose-600 p-2 md:p-3 rounded-xl">
            <ClipboardList className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kitchen Queue</span>
            <span className="text-lg md:text-2xl font-black text-amber-600">
              {baseOrders.filter(o => o.status === 'Placed' || o.status === 'Preparing').length}
            </span>
          </div>
          <div className="bg-amber-50 text-amber-600 p-2 md:p-3 rounded-xl animate-pulse">
            <Clock className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prepaid Revenue</span>
            <span className="text-lg md:text-2xl font-black text-emerald-650">
              ₹{baseOrders.filter(o => o.status !== 'Cancelled' && String(o.paymentMode).toUpperCase() === 'ONLINE').reduce((s, o) => s + (Number(o.total) || 0), 0)}
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2 md:p-3 rounded-xl">
            <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">COD to Collect</span>
            <span className="text-lg md:text-2xl font-black text-indigo-650">
              ₹{baseOrders.filter(o => o.status !== 'Cancelled' && String(o.paymentMode).toUpperCase() !== 'ONLINE').reduce((s, o) => s + (Number(o.total) || 0), 0)}
            </span>
          </div>
          <div className="bg-indigo-50 text-indigo-650 p-2 md:p-3 rounded-xl">
            <Coins className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
      </div>

      {/* Operational Hubs Live Breakdown Widget for Global Head Admin */}
      {adminType === 'global' && (
        <div className="bg-white border border-slate-200 p-4 md:p-6 rounded-3xl shadow-sm space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <Database className="w-4 h-4 text-rose-550" /> Operational Hubs Live Breakdown
              </h3>
              <p className="text-[10px] text-slate-550 font-medium">Real-time stats across delivery junctions. Click any hub to filter the live dispatch feed below.</p>
            </div>
            {ordersStationFilter !== 'All' && (
              <button
                onClick={() => setOrdersStationFilter('All')}
                className="text-[9px] text-rose-655 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider transition-all"
              >
                Clear Filter (All)
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {stations.map(st => {
              const stOrders = orders.filter(o => {
                const code = o.stationCode || o.station_code || o.stationcode || '';
                return code.toUpperCase() === st.code.toUpperCase();
              });
              const activeQueue = stOrders.filter(o => o.status === 'Placed' || o.status === 'Preparing').length;
              const totalNonCancelled = stOrders.filter(o => o.status !== 'Cancelled').length;
              const deliveredCount = stOrders.filter(o => o.status === 'Delivered').length;
              const revenue = stOrders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + (Number(o.total) || 0), 0);
              const isCurrentFilter = ordersStationFilter.toUpperCase() === st.code.toUpperCase();

              return (
                <div
                  key={st.id}
                  onClick={() => setOrdersStationFilter(st.code)}
                  className={`border p-3 rounded-xl flex flex-col justify-between transition-all shadow-sm hover:shadow-md cursor-pointer ${isCurrentFilter
                    ? 'bg-rose-50/40 border-rose-450 ring-2 ring-rose-500/20'
                    : 'bg-slate-50/50 border-slate-150 hover:bg-white hover:border-rose-200'
                    }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <div className="min-w-0">
                      <span className={`text-[9px] font-black uppercase tracking-wider ${isCurrentFilter ? 'text-rose-600' : 'text-slate-400'}`}>{st.code}</span>
                      <h4 className="font-extrabold text-slate-808 text-xs truncate mt-0.5" title={st.name}>{st.name}</h4>
                    </div>
                    <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-105 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                      ₹{revenue}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold">Queue</span>
                      <span className={`font-black ${activeQueue > 0 ? 'text-amber-605 animate-pulse' : 'text-slate-550'}`}>{activeQueue} Act</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block font-bold">Done</span>
                      <span className="font-black text-slate-700">{deliveredCount}/{totalNonCancelled}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
            {adminType === 'station' ? `Live Orders Hub: ${selectedStationCode}` : 'Live Passenger Orders'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {adminType === 'station' ? `Managing real-time kitchen queue & delivery boys for ${selectedStationCode} station.` : 'HQ global order overview and dispatch terminal.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={ordersSearchQuery}
              onChange={(e) => setOrdersSearchQuery(e.target.value)}
              placeholder="Search PNR, seat, train..."
              className="pl-9 pr-4 py-2 w-full sm:w-60 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500 shadow-sm"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {adminType === 'global' && (
              <select
                value={ordersStationFilter}
                onChange={(e) => setOrdersStationFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500 shadow-sm cursor-pointer flex-1 sm:flex-initial"
              >
                <option value="All">🏢 All Stations</option>
                {stations.map(st => (
                  <option key={st.code} value={st.code}>📍 {st.name}</option>
                ))}
              </select>
            )}
            <select
              value={ordersSortBy}
              onChange={(e) => setOrdersSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500 shadow-sm cursor-pointer flex-1 sm:flex-initial"
            >
              <option value="timeSoonest">⏱ Arrival Soon</option>
              <option value="newestOrder">🆕 Newest</option>
              <option value="oldestOrder">⏳ Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master Delivery Timeline Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-fit border border-slate-200 gap-1">
        <button
          onClick={() => setDeliveryTimelineFilter('live')}
          className={`flex-1 md:flex-initial px-3 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${deliveryTimelineFilter === 'live'
            ? 'bg-rose-600 text-white shadow-md'
            : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <span className={`w-2 h-2 rounded-full ${deliveryTimelineFilter === 'live' ? 'bg-white animate-ping' : 'bg-rose-500'}`} />
          <span className="truncate">Live (Today)</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${deliveryTimelineFilter === 'live' ? 'bg-rose-800 text-rose-100' : 'bg-slate-250 text-slate-700'}`}>
            {baseOrders.filter(o => isToday(o.doj)).length}
          </span>
        </button>
        <button
          onClick={() => setDeliveryTimelineFilter('scheduled')}
          className={`flex-1 md:flex-initial px-3 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${deliveryTimelineFilter === 'scheduled'
            ? 'bg-rose-600 text-white shadow-md'
            : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="truncate">Scheduled</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${deliveryTimelineFilter === 'scheduled' ? 'bg-rose-800 text-rose-100' : 'bg-slate-250 text-slate-700'}`}>
            {baseOrders.filter(o => !isToday(o.doj)).length}
          </span>
        </button>
      </div>

      {/* Quick Status Tabs Filters (Horizontally scrollable on mobile) */}
      <div className="flex gap-2 pb-3 border-b border-slate-100 overflow-x-auto scrollbar-none -mx-6 px-6 sm:mx-0 sm:px-0">
        {['All', 'Placed', 'Preparing', 'Dispatched', 'Delivered', 'Cancelled'].map(status => {
          const count = baseOrders.filter(o => {
            const matchesStatus = status === 'All' ? true : o.status === status;
            const matchesTimeline = deliveryTimelineFilter === 'live' ? isToday(o.doj) : !isToday(o.doj);
            return matchesStatus && matchesTimeline;
          }).length;
          return (
            <button
              key={status}
              onClick={() => setOrdersFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border shrink-0 ${ordersFilterStatus === status
                ? 'bg-rose-600 border-rose-650 text-white shadow-md'
                : 'bg-white border-slate-200 text-slate-550 hover:bg-slate-50'
                }`}
            >
              <span>{status}</span>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${ordersFilterStatus === status ? 'bg-rose-800 text-rose-100' : 'bg-slate-100 text-slate-605'
                }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Active Orders List */}
      <div className="space-y-4">
        {filteredDisplayOrders.length > 0 ? (
          filteredDisplayOrders.map(order => {
            const oStationCode = order.stationCode || order.station_code || order.stationcode || '';
            const targetStation = stations.find(st => st.code.toUpperCase() === oStationCode.toUpperCase());
            const stationDisplayName = targetStation ? `${targetStation.name} (${targetStation.code})` : (oStationCode || 'Global/ALL');
            const isArrivingSoon = order.arrTime && (order.status === 'Placed' || order.status === 'Preparing');
            const orderItems = Array.isArray(order.items)
              ? order.items
              : (typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items); } catch (e) { return []; } })() : []);
            const orderOnDemand = Array.isArray(order.onDemandRequests)
              ? order.onDemandRequests
              : (typeof order.onDemandRequests === 'string' ? (() => { try { return JSON.parse(order.onDemandRequests); } catch (e) { return []; } })() : []);

            return (
              <div key={order.id} className={`bg-white border border-slate-200/80 rounded-[32px] p-6 md:p-8 space-y-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden ${order.status === 'Cancelled' ? 'opacity-70 bg-slate-50/50' : ''}`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === 'Placed' ? 'bg-rose-500' :
                  order.status === 'Preparing' ? 'bg-amber-500' :
                    order.status === 'Dispatched' ? 'bg-indigo-500' :
                      order.status === 'Delivered' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`} />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-rose-650 bg-rose-55 border border-rose-100 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                        <ClipboardList className="w-3.5 h-3.5 text-rose-555" /> #{order.id}
                      </span>
                      <span className="text-xs text-indigo-750 font-black uppercase bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-505" /> Junction: {stationDisplayName}
                      </span>
                      {order.platform && order.platform !== 'N/A' && (
                        <span className="text-xs text-amber-750 font-black uppercase bg-amber-50 border border-amber-100 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                          <Train className="w-3.5 h-3.5 text-amber-600 shrink-0" /> PF: {order.platform}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                  {order.status !== 'Cancelled' ? (
                    <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                      {[
                        { label: 'Placed', color: 'bg-rose-500' },
                        { label: 'Preparing', color: 'bg-amber-500' },
                        { label: 'Dispatched', color: 'bg-indigo-500' },
                        { label: 'Delivered', color: 'bg-emerald-500' }
                      ].map((step, idx, arr) => {
                        const statuses = ['Placed', 'Preparing', 'Dispatched', 'Delivered'];
                        const currentIdx = statuses.indexOf(order.status);
                        const isCompleted = idx <= currentIdx;
                        const isActive = idx === currentIdx;

                        return (
                          <React.Fragment key={step.label}>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${isCompleted ? step.color : 'bg-slate-200'} ${isActive ? 'ring-4 ring-offset-1 ' + (order.status === 'Placed' ? 'ring-rose-200' : order.status === 'Preparing' ? 'ring-amber-200' : order.status === 'Dispatched' ? 'ring-indigo-200' : 'ring-emerald-200') : ''}`} />
                              <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-slate-800 block' : 'text-slate-400 hidden sm:inline'}`}>
                                {step.label}
                              </span>
                            </div>
                            {idx < arr.length - 1 && (
                              <div className={`w-2 sm:w-6 h-[2px] ${isCompleted && idx < currentIdx ? 'bg-slate-450' : 'bg-slate-200'}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs font-black bg-slate-100 text-slate-500 border border-slate-205 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                      Cancelled / Refunded
                    </span>
                  )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Train & Passenger Info */}
                  <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-widest block mb-2.5">Passenger Compartment</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-rose-600 text-white text-xs font-black uppercase px-3 py-2 rounded-xl shadow-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Coach {order.coach} · Seat {order.seat}
                        </span>
                        <span className="text-xs font-black text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-xl uppercase tracking-wider font-mono">
                          PNR: {order.pnr}
                        </span>
                      </div>
                      {order.doj && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-black text-rose-700 bg-rose-55 border border-rose-100 px-3 py-1.5 rounded-xl uppercase tracking-wider w-fit">
                          <Calendar className="w-3.5 h-3.5 text-rose-600" /> Delivery: {order.doj}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-widest block">Transit Details</span>
                      {order.trainNumber && order.trainNumber !== 'N/A' && (
                        <div className="flex items-center gap-2 bg-white border border-slate-200 p-2.5 rounded-xl">
                          <Train className="w-4 h-4 text-rose-600 animate-bounce" />
                          <div className="text-xs font-bold text-slate-805 leading-tight">
                            <p className="font-black text-slate-900">{order.trainNumber}</p>
                            <p className="text-[11px] text-slate-555 truncate max-w-[180px]">{order.trainName}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {order.phone}
                        </span>
                        <button
                          onClick={() => handleTrackTrain(order.id, order.pnr)}
                          disabled={trackingLoadingId === order.id}
                          className="text-[9px] text-rose-655 bg-rose-50 border border-rose-100 hover:bg-rose-100 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider transition-all flex items-center gap-1 shrink-0"
                        >
                          🛰 {trackingLoadingId === order.id ? 'Tracking...' : 'Track Train'}
                        </button>
                      </div>

                      {trainTrackInfo[order.id]?.tracked ? (
                        <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-200">
                          <span className={`inline-flex items-center gap-1.5 text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider border ${trainTrackInfo[order.id].delay > 0 ? 'text-red-700 bg-red-50 border-red-200 animate-pulse' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {trainTrackInfo[order.id].delay > 0
                              ? `Delay: ${trainTrackInfo[order.id].delay}m (ETA: ${getRevisedETA(order.arrTime || order.arrivalTime, trainTrackInfo[order.id].delay)})`
                              : 'On Time'
                            }
                          </span>
                          <p className="text-[9px] text-slate-550 font-extrabold uppercase bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60 block">
                            Current Station: {trainTrackInfo[order.id].nextStation}
                          </p>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-[10px] text-amber-705 bg-amber-50 border border-amber-150 px-2.5 py-1 rounded-xl font-black uppercase tracking-wider mt-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-650" /> Scheduled: {order.arrTime || order.arrivalTime || 'N/A'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items (Invoice style) */}
                  <div className="border border-slate-200 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-widest block mb-2.5">Menu Items</span>
                      <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-150 divide-y divide-slate-150/60 max-h-[160px] overflow-y-auto space-y-2">
                        {orderItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs py-2 first:pt-0 last:pb-0 font-extrabold text-slate-800">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>{item.name}</span>
                              <strong className="text-rose-600 font-black bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded text-[10px]">&times; {item.quantity}</strong>
                            </span>
                            <span className="font-black text-slate-905">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400">Total Items:</span>
                      <span className="font-black text-slate-700">{orderItems.reduce((acc, curr) => acc + curr.quantity, 0)} Items</span>
                    </div>
                  </div>

                  {/* Passenger Requests & Custom Alerts */}
                  <div className="border border-slate-200 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-widest block mb-2.5">Custom Requests</span>
                      {orderOnDemand && orderOnDemand.length > 0 ? (
                        <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                          {orderOnDemand.map((req, idx) => (
                            <div key={idx} className="text-[11px] p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col justify-between gap-2">
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-extrabold text-slate-850 leading-snug">
                                  {req.name}
                                  {(!req.name.startsWith('Custom MRP Request:') && !req.name.startsWith('Alert:')) && (
                                    req.price > 0 ? (
                                      <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded ml-1.5 font-black uppercase tracking-wider">
                                        ₹{req.price} MRP
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-emerald-755 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded ml-1.5 font-black uppercase tracking-wider">
                                        Free
                                      </span>
                                    )
                                  )}
                                </span>

                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${req.status === 'Accepted' ? 'bg-emerald-50 text-emerald-750 border-emerald-150' :
                                  req.status === 'Rejected' ? 'bg-rose-50 text-rose-750 border-rose-150' : 'bg-amber-50 text-amber-750 border-amber-200 animate-pulse'
                                  }`}>
                                  {req.status}
                                </span>
                              </div>

                              {req.status === 'Pending' && (
                                <div className="flex gap-1.5 justify-end mt-1 border-t border-slate-200/50 pt-2">
                                  <button
                                    onClick={() => updateOnDemandStatus(order.id, idx, 'Accepted')}
                                    className="bg-emerald-55 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md border border-emerald-250 transition-all text-[9px] font-black uppercase tracking-wider"
                                  >
                                    ✓ Accept
                                  </button>
                                  <button
                                    onClick={() => updateOnDemandStatus(order.id, idx, 'Rejected')}
                                    className="bg-rose-55 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded-md border border-rose-250 transition-all text-[9px] font-black uppercase tracking-wider"
                                  >
                                    ✕ Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[100px]">
                          <ClipboardList className="w-6 h-6 text-slate-350 mb-1" />
                          <span className="text-[10px] text-slate-400 font-bold">No custom requests.</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                      Updates reflect instantly in real-time.
                    </div>
                  </div>
                </div>

                {/* Footer Section: Billing details, rider and operational actions */}
                <div className="border-t border-slate-150 pt-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
                  {/* Rider allocation */}
                  <div className="flex items-center gap-2.5 w-full lg:w-auto">
                    <span className="font-extrabold text-slate-700 text-xs shrink-0 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-rose-550" /> Assigned Rider:
                    </span>
                    <div className="relative w-full sm:w-60">
                      <input
                        type="text"
                        defaultValue={order.rider_name || ''}
                        placeholder="Rider Name & Mobile"
                        onBlur={(e) => handleAssignRider(order.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-805 placeholder-slate-400 focus:outline-none focus:border-rose-500 w-full shadow-inner"
                      />
                      {order.rider_name && (
                        <span className="absolute right-2.5 top-2.5 bg-emerald-50 text-emerald-700 border border-emerald-150 px-1 rounded font-black text-[8px] uppercase tracking-wider animate-pulse">
                          OK
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-start sm:items-end">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Payment Status</span>
                        {String(order.paymentMode).toUpperCase() === 'ONLINE' ? (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-250 px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1">
                            ✓ Paid Online
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-250 px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1">
                            ⚠ Collect Cash (COD)
                          </span>
                        )}
                      </div>

                      {order.isFreeGiftAdded && (
                        <div className="flex flex-col items-start sm:items-end">
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Promo Incentive</span>
                          <span className="text-amber-700 bg-amber-50 border border-amber-205 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider shadow-sm">
                            <Gift className="w-3.5 h-3.5 text-amber-500" /> Gift: {order.freeGiftProduct}
                          </span>
                        </div>
                      )}

                      <div className="text-right pl-3 border-l border-slate-200">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Grand Total</span>
                        <span className="text-rose-600 font-black text-lg flex items-center">
                          <IndianRupee className="w-4 h-4 text-rose-650 inline" />{order.total}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
                      {order.status === 'Placed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'Preparing')}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider transition-all shadow-md shadow-amber-100 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                        >
                          <ChefHat className="w-3.5 h-3.5" /> Start Preparing
                        </button>
                      )}
                      {order.status === 'Preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'Dispatched')}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                        >
                          <Send className="w-3.5 h-3.5" /> Handover to Rider
                        </button>
                      )}
                      {order.status === 'Dispatched' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'Delivered')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                        >
                          <Check className="w-3.5 h-3.5" /> Confirm Delivery
                        </button>
                      )}

                      {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to cancel Order #${order.id}?`)) {
                              updateOrderStatus(order.id, 'Cancelled');
                            }
                          }}
                          className="bg-slate-50 hover:bg-rose-55 text-rose-600 font-extrabold text-[10px] px-3.5 py-2.5 rounded-xl uppercase tracking-wider transition-all border border-slate-200 hover:border-rose-100 flex items-center justify-center gap-1 flex-1 sm:flex-initial"
                          title="Cancel Order"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                      )}

                      <button
                        onClick={() => setPrintingOrder(order)}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 p-2.5 rounded-xl border border-slate-200 transition-all flex items-center justify-center shrink-0"
                        title="Print KOT Slip"
                      >
                        <Printer className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs shadow-sm">
            No active orders matching this selection. Live passenger bookings will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
