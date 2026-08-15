"use client";
import React from 'react';
import {
  ClipboardList, Clock, CreditCard, Coins, Database, Search, MapPin,
  Train, Phone, Utensils, ShoppingBag, Gift, IndianRupee, ChefHat, Send, Check, X, Printer, Truck, User, Calendar, Compass, Locate,
  CheckCircle2, AlertTriangle
} from 'lucide-react';

const isToday = (dojStr) => {
  if (!dojStr) return true;
  const cleanDoj = dojStr.replace(/\//g, '-').trim();

  // Calculate today strictly in Indian Standard Time (IST)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const today = new Date(utc + (3600000 * 5.5));

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
  setPrintingOrder,
  selectedOrderDetails,
  setSelectedOrderDetails
}) {
  const [deliveryTimelineFilter, setDeliveryTimelineFilter] = React.useState('live');
  const [stationOrdersViewMode, setStationOrdersViewMode] = React.useState('table');
  const [globalStatusFilter, setGlobalStatusFilter] = React.useState('All');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [globalDateFilter, setGlobalDateFilter] = React.useState('All');
  const [globalPaymentFilter, setGlobalPaymentFilter] = React.useState('All');
  const [globalSortBy, setGlobalSortBy] = React.useState('newest');

  const filteredDisplayOrders = displayOrders;

  return (
    <div className="space-y-6">

      {/* KPI Summary Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-rose-250 transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[10px] md:text-xs lg:text-[13px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
            <span className="text-lg md:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight mt-1 block">{baseOrders.length}</span>
          </div>
          <div className="bg-rose-50 text-rose-600 p-3 md:p-4 rounded-xl group-hover:scale-105 transition-transform duration-300">
            <ClipboardList className="w-6 h-6 md:w-7 md:h-7" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-rose-250 transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[10px] md:text-xs lg:text-[13px] font-bold text-slate-400 uppercase tracking-wider block">Kitchen Queue</span>
            <span className="text-lg md:text-2xl lg:text-3xl font-black text-amber-600 tracking-tight mt-1 block">
              {baseOrders.filter(o => o.status === 'Placed' || o.status === 'Preparing').length}
            </span>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 md:p-4 rounded-xl animate-pulse group-hover:scale-105 transition-transform duration-300">
            <Clock className="w-6 h-6 md:w-7 md:h-7" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-rose-250 transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[10px] md:text-xs lg:text-[13px] font-bold text-slate-400 uppercase tracking-wider block">Prepaid Revenue</span>
            <span className="text-lg md:text-2xl lg:text-3xl font-black text-emerald-650 tracking-tight mt-1 block">
              ₹{baseOrders.filter(o => o.status !== 'Cancelled' && String(o.paymentMode).toUpperCase() === 'ONLINE').reduce((s, o) => s + (Number(o.total) || 0), 0)}
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 md:p-4 rounded-xl group-hover:scale-105 transition-transform duration-300">
            <CreditCard className="w-6 h-6 md:w-7 md:h-7" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-rose-250 transition-all duration-300 flex items-center justify-between group">
          <div>
            <span className="text-[10px] md:text-xs lg:text-[13px] font-bold text-slate-400 uppercase tracking-wider block">COD to Collect</span>
            <span className="text-lg md:text-2xl lg:text-3xl font-black text-indigo-650 tracking-tight mt-1 block">
              ₹{baseOrders.filter(o => o.status !== 'Cancelled' && String(o.paymentMode).toUpperCase() !== 'ONLINE').reduce((s, o) => s + (Number(o.total) || 0), 0)}
            </span>
          </div>
          <div className="bg-indigo-50 text-indigo-650 p-3 md:p-4 rounded-xl group-hover:scale-105 transition-transform duration-300">
            <Coins className="w-6 h-6 md:w-7 md:h-7" />
          </div>
        </div>
      </div>

      {/* Global Analytics, Leaders & Tables dashboard view for Global Head Admin */}
      {adminType === 'global' && (() => {
        // check yesterday helper
        const isYesterday = (dojStr) => {
          if (!dojStr) return false;
          const cleanDoj = dojStr.replace(/\//g, '-').trim();
          const now = new Date();
          const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
          const yesterday = new Date(utc + (3600000 * 5.5) - 86400000);
          const dd = String(yesterday.getDate()).padStart(2, '0');
          const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
          const yyyy = yesterday.getFullYear();
          const yesterdayStr = `${dd}-${mm}-${yyyy}`;
          return cleanDoj === yesterdayStr;
        };

        // filter orders
        const filteredGlobalOrders = orders.filter(o => {
          if (ordersStationFilter !== 'All') {
            const sCode = o.stationCode || o.station_code || o.stationcode || '';
            if (sCode.toUpperCase() !== ordersStationFilter.toUpperCase()) return false;
          }
          if (globalStatusFilter !== 'All' && o.status !== globalStatusFilter) return false;
          if (globalDateFilter === 'Today' && !isToday(o.doj)) return false;
          if (globalDateFilter === 'Yesterday' && !isYesterday(o.doj)) return false;
          if (globalPaymentFilter === 'Online' && String(o.paymentMode).toUpperCase() !== 'ONLINE') return false;
          if (globalPaymentFilter === 'COD' && String(o.paymentMode).toUpperCase() === 'ONLINE') return false;
          if (ordersSearchQuery) {
            const query = ordersSearchQuery.toLowerCase();
            const pnr = String(o.pnr || '').toLowerCase();
            const seat = String(o.seat || '').toLowerCase();
            const coach = String(o.coach || '').toLowerCase();
            const trainNum = String(o.trainNumber || '').toLowerCase();
            const orderId = String(o.id || '').toLowerCase();
            const phone = String(o.phone || o.customerPhone || '').toLowerCase();
            if (!pnr.includes(query) && !seat.includes(query) && !coach.includes(query) && !trainNum.includes(query) && !orderId.includes(query) && !phone.includes(query)) {
              return false;
            }
          }
          return true;
        }).sort((a, b) => {
          if (globalSortBy === 'newest') return b.id - a.id;
          if (globalSortBy === 'oldest') return a.id - b.id;
          if (globalSortBy === 'amountDesc') return Number(b.total || 0) - Number(a.total || 0);
          if (globalSortBy === 'amountAsc') return Number(a.total || 0) - Number(b.total || 0);
          return b.id - a.id;
        });

        // Safe self-correcting pagination values
        const totalPages = Math.max(1, Math.ceil(filteredGlobalOrders.length / rowsPerPage));
        const activePage = Math.min(currentPage, totalPages);
        const startIndex = (activePage - 1) * rowsPerPage;
        const paginatedOrders = filteredGlobalOrders.slice(startIndex, startIndex + rowsPerPage);

        // revenue calculations
        const onlineRevenue = orders.filter(o => o.status !== 'Cancelled' && String(o.paymentMode).toUpperCase() === 'ONLINE').reduce((s, o) => s + (Number(o.total) || 0), 0);
        const codRevenue = orders.filter(o => o.status !== 'Cancelled' && String(o.paymentMode).toUpperCase() !== 'ONLINE').reduce((s, o) => s + (Number(o.total) || 0), 0);
        const totalRevenue = onlineRevenue + codRevenue;
        const onlinePct = totalRevenue > 0 ? Math.round((onlineRevenue / totalRevenue) * 100) : 50;

        // leaderboard
        const stationLeaderboard = [...stations].map(st => {
          const stOrders = orders.filter(o => {
            const code = o.stationCode || o.station_code || o.stationcode || '';
            return code.toUpperCase() === st.code.toUpperCase();
          });
          const revenue = stOrders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + (Number(o.total) || 0), 0);
          return { code: st.code, name: st.name, revenue, count: stOrders.length };
        }).sort((a, b) => b.revenue - a.revenue).slice(0, 4);

        // activity feed simulation based on latest orders
        const recentActivities = orders.slice(0, 5).map((o, idx) => {
          const actions = {
            Placed: 'New order placed',
            Preparing: 'Kitchen started cooking',
            Dispatched: 'Handed over to rider',
            Delivered: 'Successfully delivered',
            Cancelled: 'Order cancelled'
          };
          return {
            id: o.id,
            action: actions[o.status] || 'Order updated',
            station: o.stationCode || o.station_code || o.stationcode || 'NDLS',
            time: o.timestamp || 'Just now',
            status: o.status
          };
        });

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Hubs Breakdown Widget */}
            <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 bg-white border border-slate-200 p-5 md:p-6 rounded-3xl shadow-sm space-y-5">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h3 className="text-sm lg:text-base font-black text-slate-850 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-5 h-5 text-rose-550" /> Junction Hubs Live Breakdown
                  </h3>
                  <p className="text-xs lg:text-sm text-slate-500 font-medium mt-0.5">Real-time stats across delivery junctions. Click any hub to filter the live dispatch feed below.</p>
                </div>
                {ordersStationFilter !== 'All' && (
                  <button
                    onClick={() => {
                      setOrdersStationFilter('All');
                      setCurrentPage(1);
                    }}
                    className="text-[10px] lg:text-xs text-rose-655 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all"
                  >
                    Clear Filter (All)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
                      onClick={() => {
                        setOrdersStationFilter(st.code);
                        setCurrentPage(1);
                      }}
                      className={`border p-4 rounded-2xl flex flex-col justify-between transition-all shadow-sm hover:shadow-md cursor-pointer ${isCurrentFilter
                        ? 'bg-rose-50/40 border-rose-450 ring-2 ring-rose-500/20'
                        : 'bg-slate-50/50 border-slate-150 hover:bg-white hover:border-rose-200'
                        }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="min-w-0">
                          <span className={`text-[10px] lg:text-xs font-black uppercase tracking-wider ${isCurrentFilter ? 'text-rose-600' : 'text-slate-400'}`}>{st.code}</span>
                          <h4 className="font-extrabold text-slate-800 text-xs lg:text-sm mt-0.5 break-words leading-tight" title={st.name}>{st.name}</h4>
                        </div>
                        <span className="text-[10px] lg:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-mono shrink-0">
                          ₹{revenue}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] lg:text-xs">
                        <div>
                          <span className="text-[10px] lg:text-xs text-slate-400 block font-bold">Queue</span>
                          <span className={`font-black ${activeQueue > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-500'}`}>{activeQueue} Act</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] lg:text-xs text-slate-400 block font-bold">Done</span>
                          <span className="font-black text-slate-700">{deliveredCount}/{totalNonCancelled}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Global Monitor Terminal */}
            <div className="lg:col-span-3 lg:col-start-1 lg:row-start-2 bg-white border border-slate-200 p-5 md:p-6 rounded-3xl shadow-sm space-y-5 font-sans">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-sm lg:text-base font-black text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-5 h-5 text-rose-550" /> Global Dispatch Monitor Terminal
                  </h3>
                  <p className="text-xs lg:text-sm text-slate-500 font-medium mt-0.5">Enterprise overview of all passenger orders across junctions.</p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => {
                      const headers = ["Order ID", "Station", "Train", "Seat", "PNR", "Phone", "Amount", "Status", "Payment", "Date"];
                      const rows = filteredGlobalOrders.map(o => [
                        o.id,
                        o.stationCode || o.station_code || o.stationcode || '',
                        o.trainNumber,
                        `${o.coach}-${o.seat}`,
                        o.pnr,
                        o.phone || o.customerPhone || '',
                        o.total,
                        o.status,
                        o.paymentMode,
                        o.doj || ''
                      ]);
                      const csvContent = "data:text/csv;charset=utf-8,"
                        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `Global_Orders_${ordersStationFilter}_Export.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    Export CSV
                  </button>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={ordersSearchQuery}
                      onChange={(e) => {
                        setOrdersSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search train, seat, pnr..."
                      className="pl-9 pr-3 py-2 w-52 bg-slate-50 border border-slate-200 rounded-xl text-xs lg:text-sm font-semibold focus:outline-none focus:border-rose-500 transition-all shadow-inner"
                    />
                  </div>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs lg:text-sm font-black text-slate-700 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="10">10 / page</option>
                    <option value="25">25 / page</option>
                    <option value="50">50 / page</option>
                    <option value="100">100 / page</option>
                  </select>
                </div>
              </div>

              {/* Advanced Filters Control Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-slate-700">
                <div className="space-y-1">
                  <span className="text-[10px] lg:text-xs text-slate-400 font-black uppercase tracking-wider block">Date Range</span>
                  <select
                    value={globalDateFilter}
                    onChange={(e) => {
                      setGlobalDateFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs lg:text-sm font-black text-slate-700 focus:outline-none focus:border-rose-500 w-full cursor-pointer"
                  >
                    <option value="All">🗓 All Dates</option>
                    <option value="Today">Today (Strict IST)</option>
                    <option value="Yesterday">Yesterday</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] lg:text-xs text-slate-400 font-black uppercase tracking-wider block">Payment Mode</span>
                  <select
                    value={globalPaymentFilter}
                    onChange={(e) => {
                      setGlobalPaymentFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs lg:text-sm font-black text-slate-700 focus:outline-none focus:border-rose-500 w-full cursor-pointer"
                  >
                    <option value="All">💳 All Payments</option>
                    <option value="Online">Prepaid (Online)</option>
                    <option value="COD">Cash On Delivery</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] lg:text-xs text-slate-400 font-black uppercase tracking-wider block">Sort Orders</span>
                  <select
                    value={globalSortBy}
                    onChange={(e) => {
                      setGlobalSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs lg:text-sm font-black text-slate-700 focus:outline-none focus:border-rose-500 w-full cursor-pointer"
                  >
                    <option value="newest">🆕 Newest First</option>
                    <option value="oldest">⏳ Oldest First</option>
                    <option value="amountDesc">📈 Price: High to Low</option>
                    <option value="amountAsc">📉 Price: Low to High</option>
                  </select>
                </div>

                <div className="space-y-1 flex items-end">
                  <button
                    onClick={() => {
                      setOrdersStationFilter('All');
                      setGlobalStatusFilter('All');
                      setOrdersSearchQuery('');
                      setGlobalDateFilter('All');
                      setGlobalPaymentFilter('All');
                      setGlobalSortBy('newest');
                      setCurrentPage(1);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all w-full flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <X className="w-4 h-4" /> Clear Filters
                  </button>
                </div>
              </div>

              {/* Filter statistics strip */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-150 text-slate-700">
                <div>
                  <span className="text-[10px] lg:text-xs text-slate-400 font-black uppercase tracking-wider block">Filtered Orders</span>
                  <span className="text-xs lg:text-sm font-black text-slate-800">{filteredGlobalOrders.length} bookings</span>
                </div>
                <div>
                  <span className="text-[10px] lg:text-xs text-slate-400 font-black uppercase tracking-wider block">Filtered Volume</span>
                  <span className="text-xs lg:text-sm font-black text-slate-800">₹{filteredGlobalOrders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + (Number(o.total) || 0), 0)}</span>
                </div>
                <div>
                  <span className="text-[10px] lg:text-xs text-slate-400 font-black uppercase tracking-wider block">Active Queue (Hubs)</span>
                  <span className="text-xs lg:text-sm font-black text-amber-600">
                    {filteredGlobalOrders.filter(o => o.status === 'Placed' || o.status === 'Preparing' || o.status === 'Dispatched').length} active
                  </span>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex gap-2.5 pb-2 border-b border-slate-100 overflow-x-auto scrollbar-none">
                {['All', 'Placed', 'Preparing', 'Dispatched', 'Delivered', 'Cancelled'].map(status => {
                  const count = orders.filter(o => {
                    const matchesStatus = status === 'All' ? true : o.status === status;
                    const matchesStation = ordersStationFilter === 'All' ? true : (o.stationCode || o.station_code || o.stationcode || '').toUpperCase() === ordersStationFilter.toUpperCase();
                    const matchesDate = globalDateFilter === 'All' ? true : (globalDateFilter === 'Today' ? isToday(o.doj) : isYesterday(o.doj));
                    const matchesPayment = globalPaymentFilter === 'All' ? true : (globalPaymentFilter === 'Online' ? String(o.paymentMode).toUpperCase() === 'ONLINE' : String(o.paymentMode).toUpperCase() !== 'ONLINE');
                    return matchesStatus && matchesStation && matchesDate && matchesPayment;
                  }).length;
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        setGlobalStatusFilter(status);
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs lg:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border shrink-0 ${globalStatusFilter === status
                        ? 'bg-rose-600 border-rose-650 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <span>{status}</span>
                      <span className={`text-[10px] lg:text-xs font-black px-2 py-0.5 rounded-full ${globalStatusFilter === status ? 'bg-rose-800 text-rose-100' : 'bg-slate-100 text-slate-500'
                        }`}>{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Table Layout */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-[11px] lg:text-xs uppercase text-slate-400 font-black tracking-wider bg-slate-50/50">
                      <th className="py-4 px-4">Order</th>
                      <th className="py-4 px-4">Junction</th>
                      <th className="py-4 px-4">Transit Details</th>
                      <th className="py-4 px-4">Customer</th>
                      <th className="py-4 px-4">Amount</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Payment</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs lg:text-sm font-semibold text-slate-700">
                    {paginatedOrders.length > 0 ? (
                      paginatedOrders.map(order => {
                        const oStationCode = order.stationCode || order.station_code || order.stationcode || '';
                        return (
                          <tr key={order.id} className="hover:bg-slate-50/55 transition-all">
                            <td className="py-4 px-4 font-black text-slate-900">#{order.id}</td>
                            <td className="py-4 px-4">
                              <span className="bg-rose-55 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-md font-black uppercase text-[10px] lg:text-xs">{oStationCode}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="leading-tight">
                                <p className="font-extrabold text-slate-800 flex items-center gap-1"><Train className="w-3.5 h-3.5 text-slate-400" /> {order.trainNumber}</p>
                                <p className="text-[10px] lg:text-xs text-slate-450 mt-0.5">Seat {order.coach}-{order.seat}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4 leading-tight">
                              <p className="font-extrabold text-slate-805">{order.phone || order.customerPhone || 'N/A'}</p>
                              <p className="text-[10px] lg:text-xs text-slate-400 font-bold uppercase mt-0.5">PNR: {order.pnr}</p>
                            </td>
                            <td className="py-4 px-4 font-black text-rose-655 text-sm lg:text-base">₹{order.total}</td>
                            <td className="py-4 px-4">
                              <span className={`text-[9px] lg:text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${order.status === 'Placed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                order.status === 'Preparing' ? 'bg-amber-50 text-amber-705 border-amber-105 animate-pulse' :
                                  order.status === 'Dispatched' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                    order.status === 'Delivered' ? 'bg-emerald-55 text-emerald-700 border-emerald-100' :
                                      'bg-slate-100 text-slate-550 border-slate-200'
                                }`}>{order.status}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`text-[10px] lg:text-xs font-black uppercase tracking-wider ${String(order.paymentMode).toUpperCase() === 'ONLINE' ? 'text-emerald-700' : 'text-amber-700'
                                }`}>{order.paymentMode || 'COD'}</span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => setSelectedOrderDetails(order)}
                                className="bg-slate-50 hover:bg-rose-600 hover:text-white px-3.5 py-2 rounded-xl border border-slate-200 hover:border-rose-600 text-slate-605 transition-all text-[11px] lg:text-xs font-black uppercase tracking-wider"
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-400 text-xs lg:text-sm font-bold bg-slate-50/50">
                          No matching global orders found for this selection.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-150">
                  <div className="text-[11px] lg:text-xs text-slate-400 font-black uppercase tracking-wider">
                    Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredGlobalOrders.length)} of {filteredGlobalOrders.length} bookings
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, activePage - 1))}
                      disabled={activePage === 1}
                      className="bg-slate-50 hover:bg-slate-100 disabled:opacity-40 px-3 py-2 rounded-xl border border-slate-200 text-[11px] lg:text-xs font-black uppercase transition-all cursor-pointer"
                    >
                      Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-xl text-[11px] lg:text-xs font-black transition-all flex items-center justify-center border cursor-pointer ${activePage === p
                          ? 'bg-rose-600 border-rose-650 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, activePage + 1))}
                      disabled={activePage === totalPages}
                      className="bg-slate-50 hover:bg-slate-100 disabled:opacity-40 px-3 py-2 rounded-xl border border-slate-200 text-[11px] lg:text-xs font-black uppercase transition-all cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: Leaders & Network Heartbeat */}
            <div className="lg:col-span-1 lg:col-start-3 lg:row-start-1 space-y-6">
              {/* Live Operations Heartbeat */}
              <div className="bg-white border border-slate-200 p-5 md:p-6 rounded-3xl shadow-sm space-y-4">
                <h3 className="text-xs lg:text-sm font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Clock className="w-5 h-5 text-rose-550" /> System Operational Heartbeat
                </h3>

                <div className="space-y-4">
                  {/* Revenue Distribution */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs lg:text-sm font-bold uppercase tracking-wider text-slate-400">
                      <span>Online Paid ({onlinePct}%)</span>
                      <span>COD ({100 - onlinePct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: `${onlinePct}%` }} />
                      <div className="bg-amber-500 h-full" style={{ width: `${100 - onlinePct}%` }} />
                    </div>
                  </div>

                  {/* Operational Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                      <span className="text-[10px] lg:text-xs text-slate-400 font-black uppercase tracking-wider block">Success Rate</span>
                      <span className="text-base lg:text-lg font-black text-slate-800">98.6%</span>
                      <span className="text-[10px] lg:text-xs text-emerald-600 font-bold block mt-0.5">✦ Optimal status</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                      <span className="text-[10px] lg:text-xs text-slate-400 font-black uppercase tracking-wider block">Avg Prep Time</span>
                      <span className="text-base lg:text-lg font-black text-slate-800">18.4 min</span>
                      <span className="text-[10px] lg:text-xs text-emerald-600 font-bold block mt-0.5">⏱ Under target (20m)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Junction Leaderboard */}
              <div className="bg-white border border-slate-200 p-5 md:p-6 rounded-3xl shadow-sm space-y-4">
                <h3 className="text-xs lg:text-sm font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Utensils className="w-5 h-5 text-rose-550" /> Junction Sales Leaderboard
                </h3>

                <div className="space-y-4.5">
                  {stationLeaderboard.map((st, idx) => (
                    <div key={st.code} className="flex justify-between items-center text-xs lg:text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] lg:text-xs text-slate-500 shrink-0">#{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-800 truncate">{st.name}</p>
                          <p className="text-[10px] lg:text-xs text-slate-400 font-black uppercase">{st.count} bookings</p>
                        </div>
                      </div>
                      <span className="font-black text-rose-600 shrink-0 text-sm lg:text-base">₹{st.revenue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Logs Feed */}
              <div className="bg-white border border-slate-200 p-5 md:p-6 rounded-3xl shadow-sm space-y-4">
                <h3 className="text-xs lg:text-sm font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Database className="w-5 h-5 text-rose-550" /> Network Activity logs
                </h3>

                <div className="space-y-4">
                  {recentActivities.map((act, idx) => (
                    <div key={idx} className="flex gap-2.5 text-xs lg:text-sm leading-tight">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0 animate-ping" />
                      <div>
                        <p className="font-extrabold text-slate-705">
                          {act.action} <span className="text-rose-600 font-black">#{act.id}</span>
                        </p>
                        <p className="text-[10px] lg:text-xs text-slate-400 font-black uppercase mt-0.5">{act.station} · {act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {adminType === 'station' && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-5 gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                Live Orders Hub: {selectedStationCode}
              </h1>
              <p className="text-xs lg:text-sm text-slate-500 mt-1">
                Managing real-time kitchen queue & delivery boys for {selectedStationCode} station.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto items-stretch sm:items-center">
              {/* View Switcher Toggle */}
              <div className="flex bg-slate-100 p-2 rounded-[20px] border border-slate-205 gap-2 self-start sm:self-auto shadow-inner">
                <button
                  onClick={() => setStationOrdersViewMode('grid')}
                  className={`px-6 py-3 rounded-2xl text-xs lg:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 ${stationOrdersViewMode === 'grid'
                      ? 'bg-white text-rose-600 shadow-sm border border-slate-150'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <ClipboardList className="w-4 h-4 text-rose-500" /> Grid
                </button>
                <button
                  onClick={() => setStationOrdersViewMode('table')}
                  className={`px-6 py-3 rounded-2xl text-xs lg:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 ${stationOrdersViewMode === 'table'
                      ? 'bg-white text-rose-600 shadow-sm border border-slate-150'
                      : 'text-slate-505 hover:text-slate-800'
                    }`}
                >
                  <Database className="w-4 h-4 text-rose-500" /> Table
                </button>
              </div>

              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={ordersSearchQuery}
                  onChange={(e) => setOrdersSearchQuery(e.target.value)}
                  placeholder="Search PNR, seat, train..."
                  className="pl-9 pr-4 py-2 w-full sm:w-60 bg-white border border-slate-200 rounded-xl text-xs lg:text-sm font-semibold focus:outline-none focus:border-rose-500 shadow-sm"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={ordersSortBy}
                  onChange={(e) => setOrdersSortBy(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs lg:text-sm font-bold text-slate-700 focus:outline-none focus:border-rose-500 shadow-sm cursor-pointer flex-1 sm:flex-initial"
                >
                  <option value="timeSoonest">⏱ Arrival Soon</option>
                  <option value="newestOrder">🆕 Newest</option>
                  <option value="oldestOrder">⏳ Oldest</option>
                </select>
              </div>
            </div>
          </div>
          {/* Quick Status Tabs Filters */}
          <div className="flex gap-3 py-4 border-b border-slate-100 overflow-x-auto scrollbar-none -mx-6 px-6 sm:mx-0 sm:px-0">
            {['All', 'Placed', 'Preparing', 'Dispatched', 'Delivered', 'Cancelled'].map(status => {
              const count = baseOrders.filter(o => {
                return status === 'All' ? true : o.status === status;
              }).length;
              return (
                <button
                  key={status}
                  onClick={() => setOrdersFilterStatus(status)}
                  className={`px-6 py-3 rounded-2xl text-xs lg:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 border shrink-0 ${ordersFilterStatus === status
                    ? 'bg-rose-600 border-rose-650 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <span>{status}</span>
                  <span className={`text-[10px] lg:text-xs font-black px-2 py-0.5 rounded-full ${ordersFilterStatus === status ? 'bg-rose-800 text-rose-105' : 'bg-slate-105 text-slate-600'
                    }`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Active Orders List */}
          {stationOrdersViewMode === 'grid' ? (
            <div className="space-y-6">
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
                    <div key={order.id} className={`bg-white border border-slate-200/80 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden ${order.status === 'Cancelled' ? 'opacity-70 bg-slate-50/50' : ''}`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === 'Placed' ? 'bg-rose-500' :
                        order.status === 'Preparing' ? 'bg-amber-500' :
                          order.status === 'Dispatched' ? 'bg-indigo-500' :
                            order.status === 'Delivered' ? 'bg-emerald-500' : 'bg-slate-300'}`} />

                      {/* Order Details Header */}
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-slate-808 text-base lg:text-lg font-black">Order #{order.id}</span>
                            <span className={`text-[11px] lg:text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${order.status === 'Placed' ? 'bg-rose-50 text-rose-600 border border-rose-105' :
                              order.status === 'Preparing' ? 'bg-amber-50 text-amber-705 border border-amber-105' :
                                order.status === 'Dispatched' ? 'bg-indigo-55 text-indigo-600 border border-indigo-105' :
                                  order.status === 'Delivered' ? 'bg-emerald-55 text-emerald-700 border border-emerald-105' :
                                    'bg-slate-100 text-slate-550 border border-slate-200'
                              }`}>{order.status}</span>

                            {String(order.paymentMode).toUpperCase() === 'ONLINE' ? (
                              <span className="text-[11px] lg:text-xs text-emerald-700 bg-emerald-50 border border-emerald-105 px-2.5 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PAID (Online)
                              </span>
                            ) : (
                              <span className="text-[11px] lg:text-xs text-amber-755 bg-amber-50 border border-amber-105 px-2.5 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-0.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Cash On Delivery (COD)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          {order.timestamp && (
                            <span className="text-xs lg:text-sm text-slate-550 font-black bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" /> Placed: {order.timestamp}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
                        {/* Train & Passenger Info */}
                        <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-xs lg:text-[13px] text-slate-455 font-black uppercase tracking-wider block mb-3">Passenger Compartment</span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-rose-600 text-white text-xs lg:text-sm font-black uppercase px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 animate-pulse-slow">
                                <User className="w-4 h-4" /> Coach {order.coach} · Seat {order.seat}
                              </span>
                              <span className="bg-slate-800 text-white text-xs lg:text-sm font-black uppercase px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5">
                                <Compass className="w-4 h-4" /> PF: {order.platform || 'TBD'}
                              </span>
                              <span className="text-xs lg:text-sm font-black text-slate-555 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl uppercase tracking-wider font-mono">
                                PNR: {order.pnr}
                              </span>
                            </div>
                            {order.doj && (
                              <div className="mt-3 flex items-center gap-1.5 text-xs lg:text-sm font-black text-rose-700 bg-rose-50 border border-rose-100 px-3.5 py-2 rounded-xl uppercase tracking-wider w-fit">
                                <Calendar className="w-4 h-4 text-rose-600" /> Delivery: {order.doj}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2 pt-3 border-t border-slate-200/60">
                            <span className="text-[10px] lg:text-xs text-slate-455 font-black uppercase tracking-wider block mb-1">Transit Details</span>
                            {order.trainNumber && order.trainNumber !== 'N/A' && (
                              <div className="flex items-center gap-2.5 bg-white border border-slate-200 p-3 rounded-xl">
                                <Train className="w-5 h-5 text-rose-600 animate-bounce" />
                                <div className="text-xs lg:text-sm font-bold text-slate-805 leading-tight">
                                  <p className="font-black text-slate-900 text-sm lg:text-base">{order.trainNumber}</p>
                                  <p className="text-[11px] lg:text-xs text-slate-550 truncate max-w-[180px] mt-0.5">{order.trainName}</p>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs lg:text-sm font-bold text-slate-600 pt-1.5">
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4 text-slate-400" /> {order.phone || order.customerPhone}
                              </span>
                              <button
                                onClick={() => handleTrackTrain(order.id, order.pnr)}
                                disabled={trackingLoadingId === order.id}
                                className="text-[10px] lg:text-xs text-rose-655 bg-rose-50 border border-rose-105 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0"
                              >
                                <Locate className="w-4 h-4" /> {trackingLoadingId === order.id ? 'Tracking...' : 'Track Train'}
                              </button>
                            </div>

                            {trainTrackInfo[order.id]?.tracked ? (
                              <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-205">
                                <div className="flex flex-wrap gap-1.5">
                                  <span className={`inline-flex items-center gap-1 text-[10px] lg:text-xs px-2.5 py-1 rounded-md font-black uppercase tracking-wider border ${trainTrackInfo[order.id].delay > 0 ? 'text-red-700 bg-red-50 border-red-200 animate-pulse' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                    }`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {trainTrackInfo[order.id].delay > 0
                                      ? `Delay: ${trainTrackInfo[order.id].delay}m`
                                      : 'On Time'
                                    }
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[10px] lg:text-xs px-2.5 py-1 rounded-md font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200">
                                    Scheduled: {order.arrTime || order.arrivalTime || 'N/A'}
                                  </span>
                                  {order.arrTime && (
                                    <span className={`inline-flex items-center gap-1 text-[10px] lg:text-xs px-2.5 py-1 rounded-md font-black uppercase tracking-wider border ${trainTrackInfo[order.id].delay > 0
                                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                                      : 'bg-emerald-50 text-emerald-705 border-emerald-100'
                                      }`}>
                                      ETA: {getRevisedETA(order.arrTime || order.arrivalTime, trainTrackInfo[order.id].delay)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs lg:text-sm text-slate-700 font-extrabold bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60 block leading-tight">
                                  {trainTrackInfo[order.id].statusNote || trainTrackInfo[order.id].nextStation}
                                </p>
                                {trainTrackInfo[order.id].lastUpdate && (
                                  <p className="text-[10px] lg:text-xs text-slate-405 font-black uppercase tracking-wider block mt-0.5">
                                    Last Updated: {trainTrackInfo[order.id].lastUpdate}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 text-[10px] lg:text-xs text-amber-705 bg-amber-50 border border-amber-150 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider mt-1.5">
                                <Clock className="w-4 h-4 text-amber-650" /> Scheduled: {order.arrTime || order.arrivalTime || 'N/A'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order Items (Invoice style) */}
                        <div className="border border-slate-200 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-xs lg:text-[13px] text-slate-455 font-black uppercase tracking-wider block mb-3">Menu Items</span>
                            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-150 divide-y divide-slate-150/60 max-h-[170px] overflow-y-auto space-y-2">
                              {orderItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs lg:text-sm py-2.5 first:pt-0 last:pb-0 font-extrabold text-slate-800">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span>{item.name}</span>
                                    <strong className="text-rose-600 font-black bg-rose-50 border border-rose-100 px-2 py-0.5 rounded text-[10px] lg:text-xs">&times; {item.quantity || item.qty || 1}</strong>
                                  </span>
                                  <span className="font-black text-slate-900 text-sm lg:text-base">₹{(item.price || 0) * (item.quantity || item.qty || 1)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs lg:text-sm">
                            <span className="font-bold text-slate-400">Total Items:</span>
                            <span className="font-black text-slate-700">{orderItems.reduce((acc, curr) => acc + (curr.quantity || curr.qty || 1), 0)} Items</span>
                          </div>
                        </div>

                        {/* Passenger Requests & Custom Alerts */}
                        <div className="border border-slate-200 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-xs lg:text-[13px] text-slate-455 font-black uppercase tracking-wider block mb-3">Custom Requests</span>
                            {orderOnDemand && orderOnDemand.length > 0 ? (
                              <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                                {orderOnDemand.map((req, idx) => (
                                  <div key={idx} className="text-xs lg:text-sm p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col justify-between gap-2">
                                    <div className="flex justify-between items-start gap-1">
                                      <span className="font-extrabold text-slate-850 leading-snug">
                                        {req.item || req.name}
                                        {(!String(req.item || req.name).startsWith('Custom MRP Request:') && !String(req.item || req.name).startsWith('Alert:')) && (
                                          req.price > 0 ? (
                                            <span className="text-[10px] lg:text-xs text-amber-700 bg-amber-50 border border-amber-205 px-1.5 py-0.5 rounded ml-1.5 font-black uppercase tracking-wider">
                                              ₹{req.price} MRP
                                            </span>
                                          ) : (
                                            <span className="text-[10px] lg:text-xs text-emerald-755 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded ml-1.5 font-black uppercase tracking-wider">
                                              Free
                                            </span>
                                          )
                                        )}
                                      </span>

                                      <span className={`text-[9px] lg:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${req.status === 'Accepted' ? 'bg-emerald-50 text-emerald-750 border-emerald-150' :
                                        req.status === 'Rejected' ? 'bg-rose-50 text-rose-750 border-rose-150' : 'bg-amber-50 text-amber-755 border-amber-205 animate-pulse'
                                        }`}>
                                        {req.status}
                                      </span>
                                    </div>

                                    {req.status === 'Pending' && (
                                      <div className="flex gap-2 justify-end mt-1 border-t border-slate-200/50 pt-2.5">
                                        <button
                                          onClick={() => updateOnDemandStatus(order.id, idx, 'Accepted')}
                                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-250 transition-all text-[10px] lg:text-xs font-black uppercase tracking-wider"
                                        >
                                          ✓ Accept
                                        </button>
                                        <button
                                          onClick={() => updateOnDemandStatus(order.id, idx, 'Rejected')}
                                          className="bg-rose-55 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-250 transition-all text-[10px] lg:text-xs font-black uppercase tracking-wider"
                                        >
                                          ✕ Reject
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[110px]">
                                <ClipboardList className="w-7 h-7 text-slate-350 mb-1" />
                                <span className="text-[10px] lg:text-xs text-slate-400 font-bold">No custom requests.</span>
                              </div>
                            )}
                          </div>
                          <div className="pt-2 border-t border-slate-100 text-[10px] lg:text-xs font-bold text-slate-400">
                            Updates reflect instantly in real-time.
                          </div>
                        </div>
                      </div>

                      {/* Footer Section: Billing details, rider and operational actions */}
                      <div className="border-t border-slate-150 pt-5 sm:pt-6 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-5">
                        {/* Rider allocation */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                          <span className="font-extrabold text-slate-700 text-xs lg:text-sm shrink-0 flex items-center gap-1.5">
                            <Truck className="w-5 h-5 text-rose-550" /> Assigned Rider:
                          </span>
                          <div className="relative w-full sm:w-64">
                            <input
                              type="text"
                              defaultValue={order.rider_name || ''}
                              placeholder="Rider Name & Mobile"
                              onBlur={(e) => handleAssignRider(order.id, e.target.value)}
                              className="bg-slate-50 border border-slate-205 rounded-xl pl-3 pr-8 py-2.5 text-xs lg:text-sm font-semibold text-slate-805 placeholder-slate-400 focus:outline-none focus:border-rose-500 w-full shadow-inner"
                            />
                            {order.rider_name && (
                              <span className="absolute right-2.5 top-3 bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider animate-pulse">
                                OK
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 flex-grow border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                          <div className="flex flex-wrap items-center gap-6 justify-start lg:justify-start lg:pl-4">
                            <div className="flex flex-col items-start">
                              <span className="text-[10px] lg:text-xs text-slate-400 font-black uppercase tracking-wider">Payment Status</span>
                              {String(order.paymentMode).toUpperCase() === 'ONLINE' ? (
                                <span className="text-xs lg:text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-250 px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1">
                                  ✓ Paid Online
                                </span>
                              ) : (
                                <span className="text-xs lg:text-sm font-black text-amber-705 bg-amber-50 border border-amber-250 px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1">
                                  ⚠ Collect Cash (COD)
                                </span>
                              )}
                            </div>

                            {order.isFreeGiftAdded && (
                              <div className="flex flex-col items-start">
                                <span className="text-[10px] lg:text-xs text-slate-400 font-black uppercase tracking-wider">Promo Incentive</span>
                                <span className="text-amber-700 bg-amber-50 border border-amber-205 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 text-[10px] lg:text-xs font-black uppercase tracking-wider shadow-sm">
                                  <Gift className="w-4 h-4 text-amber-500" /> Gift: {order.freeGiftProduct}
                                </span>
                              </div>
                            )}

                            <div className="text-left pl-3 border-l border-slate-205">
                              <span className="text-[10px] lg:text-xs text-slate-400 font-black uppercase tracking-wider block">Grand Total</span>
                              <span className="text-rose-600 font-black text-xl lg:text-2xl flex items-center">
                                <IndianRupee className="w-5 h-5 text-rose-655 inline" />{order.total}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-105 w-full lg:w-auto justify-end flex-wrap sm:flex-nowrap">
                            {order.status === 'Placed' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'Preparing')}
                                className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs lg:text-sm px-6 py-3.5 rounded-2xl uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-md shadow-amber-600/20 hover:shadow-lg hover:shadow-amber-600/30 flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap"
                              >
                                <ChefHat className="w-5 h-5" /> Start Preparing
                              </button>
                            )}
                            {order.status === 'Preparing' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'Dispatched')}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs lg:text-sm px-6 py-3.5 rounded-2xl uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap"
                              >
                                <Send className="w-5 h-5" /> Handover to Rider
                              </button>
                            )}
                            {order.status === 'Dispatched' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'Delivered')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs lg:text-sm px-6 py-3.5 rounded-2xl uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap"
                              >
                                <Check className="w-5 h-5" /> Confirm Delivery
                              </button>
                            )}

                            {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to cancel Order #${order.id}?`)) {
                                    updateOrderStatus(order.id, 'Cancelled');
                                  }
                                }}
                                className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-extrabold text-xs lg:text-sm px-6 py-3.5 rounded-2xl uppercase tracking-wider transition-all duration-200 active:scale-[0.98] border border-rose-200 hover:border-rose-600 flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap"
                                title="Cancel Order"
                              >
                                <X className="w-5 h-5" /> Cancel
                              </button>
                            )}

                            <button
                              onClick={() => setPrintingOrder(order)}
                              className="bg-slate-50 hover:bg-slate-100 text-slate-700 p-3 rounded-xl border border-slate-200 transition-all flex items-center justify-center shrink-0"
                              title="Print KOT Slip"
                            >
                              <Printer className="w-5 h-5 text-slate-500" />
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
          ) : (
            /* Table View */
            <div className="bg-white border border-slate-200 p-5 md:p-6 rounded-[24px] sm:rounded-[32px] shadow-sm space-y-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-[11px] lg:text-xs uppercase text-slate-400 font-black tracking-wider bg-slate-50/50">
                      <th className="py-4 px-4">Order</th>
                      <th className="py-4 px-4">Transit Details</th>
                      <th className="py-4 px-4">Berth Info</th>
                      <th className="py-4 px-4">Customer</th>
                      <th className="py-4 px-4">Amount</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Payment</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs lg:text-sm font-semibold text-slate-700">
                    {filteredDisplayOrders.length > 0 ? (
                      filteredDisplayOrders.map(order => {
                        return (
                          <tr key={order.id} className="hover:bg-slate-50/55 transition-all">
                            <td className="py-4 px-4 font-black text-slate-900">#{order.id}</td>
                            <td className="py-4 px-4">
                              <div className="leading-tight">
                                <p className="font-extrabold text-slate-800 flex items-center gap-1"><Train className="w-3.5 h-3.5 text-slate-400" /> {order.trainNumber}</p>
                                <p className="text-[10px] lg:text-xs text-slate-505 truncate max-w-[150px] mt-0.5">{order.trainName}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="leading-tight">
                                <p className="font-extrabold text-slate-800 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" />Coach {order.coach} · Seat {order.seat}</p>
                                <p className="text-[10px] lg:text-xs text-slate-455 mt-0.5 flex items-center gap-1"><Compass className="w-3.5 h-3.5 text-slate-400" />PF: {order.platform || 'TBD'}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4 leading-tight">
                              <p className="font-extrabold text-slate-805">{order.phone || order.customerPhone || 'N/A'}</p>
                              <p className="text-[10px] lg:text-xs text-slate-400 font-bold uppercase mt-0.5">PNR: {order.pnr}</p>
                            </td>
                            <td className="py-4 px-4 font-black text-rose-655 text-sm lg:text-base">₹{order.total}</td>
                            <td className="py-4 px-4">
                              <span className={`text-[9px] lg:text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${order.status === 'Placed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                  order.status === 'Preparing' ? 'bg-amber-50 text-amber-705 border-amber-105 animate-pulse' :
                                    order.status === 'Dispatched' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                      order.status === 'Delivered' ? 'bg-emerald-55 text-emerald-700 border-emerald-100' :
                                        'bg-slate-100 text-slate-550 border-slate-200'
                                }`}>{order.status}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`text-[10px] lg:text-xs font-black uppercase tracking-wider ${String(order.paymentMode).toUpperCase() === 'ONLINE' ? 'text-emerald-700' : 'text-amber-705'
                                }`}>{order.paymentMode || 'COD'}</span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedOrderDetails(order)}
                                  className="bg-slate-50 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-600 text-slate-605 transition-all text-[11px] lg:text-xs font-black uppercase tracking-wider"
                                >
                                  See Details
                                </button>
                                <button
                                  onClick={() => setPrintingOrder(order)}
                                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 p-2 rounded-lg border border-slate-200 transition-all flex items-center justify-center"
                                  title="Print KOT Slip"
                                >
                                  <Printer className="w-4 h-4 text-slate-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-400 text-xs lg:text-sm font-bold bg-slate-50/50 rounded-b-2xl">
                          No orders found for this filter. Live passenger bookings will appear here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
