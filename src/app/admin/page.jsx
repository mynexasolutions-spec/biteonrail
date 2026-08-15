"use client";
import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { uploadToCloudinary, isCloudinaryConfigured } from '../../lib/cloudinary';
import { X, Printer, Clock, Compass, User, Calendar, Train, Phone, Locate, Truck, Gift, IndianRupee, ChefHat, Send, Check, CheckCircle2, AlertTriangle, ClipboardList } from 'lucide-react';

// Sub-components import
import Sidebar from '../../components/admin/Sidebar';
import LoginPanel from '../../components/admin/LoginPanel';
import OrdersTab from '../../components/admin/OrdersTab';
import MenuCatalogTab from '../../components/admin/MenuCatalogTab';
import StationsTab from '../../components/admin/StationsTab';
import CredentialsTab from '../../components/admin/CredentialsTab';
import PlatformSettingsTab from '../../components/admin/PlatformSettingsTab';
import SupportDirectoryTab from '../../components/admin/SupportDirectoryTab';
import HomeCustomizeTab from '../../components/admin/HomeCustomizeTab';
import StatesTab from '../../components/admin/StatesTab';

function AdminPageContent() {
  const {
    orders,
    stations,
    setStations,
    menuItems,
    setMenuItems,
    updateOrderStatus,
    updateOrderRider,
    updateOnDemandStatus,
    freeProduct,
    updateFreeProduct,
    codPolicy,
    updateCodPolicy,
    codCutoffHour,
    updateCodCutoffHour,
    availableStates,
    addAvailableState,
    removeAvailableState,
    renameAvailableState,
    deliveryCharge,
    updateDeliveryCharge,
    giftThreshold,
    updateGiftThreshold,
    supportPhone,
    updateSupportPhone,
    supportEmail,
    updateSupportEmail,
    supportContacts,
    updateSupportContacts,
    categories,
    addCategory,
    removeCategory,
    updateCategory,
    socialInstagram,
    updateSocialInstagram,
    socialFacebook,
    updateSocialFacebook,
    socialTwitter,
    updateSocialTwitter,
    toggleGlobalItemAvailability
  } = useApp();

  // Admin access control state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [adminType, setAdminType] = useState('global'); // 'global' | 'station'
  const [selectedStationCode, setSelectedStationCode] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Load session from Server HttpOnly Session on mount
  React.useEffect(() => {
    const checkServerSession = async () => {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAdminType(data.type);
          if (data.station_code) {
            setSelectedStationCode(data.station_code);
          }
        }
      } catch (err) {
        console.warn("Server session validation failed:", err);
      } finally {
        setSessionChecking(false);
      }
    };
    checkServerSession();
  }, []);

  // Set default station code once stations load
  React.useEffect(() => {
    if (stations && stations.length > 0 && !selectedStationCode) {
      setSelectedStationCode(stations[0].code);
    }
  }, [stations]);

  // Active sub-tab synced with URL query parameters (?tab=...)
  const searchParams = useSearchParams();
  const [activeSubTab, setActiveSubTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('tab') || 'orders';
    }
    return 'orders';
  });

  const setActiveSubTab = (newTab) => {
    setActiveSubTabState(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.pushState({}, '', url.pathname + url.search);
    }
  };

  React.useEffect(() => {
    const tab = searchParams.get('tab') || 'orders';
    if (tab !== activeSubTab) {
      setActiveSubTabState(tab);
    }
  }, [searchParams]);

  const [ordersFilterStatus, setOrdersFilterStatus] = useState('All');

  // Menu tab filters
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [menuActiveCategory, setMenuActiveCategory] = useState('All');
  const [menuOriginFilter, setMenuOriginFilter] = useState('All'); // 'All' | 'Local' | 'Global'
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Live orders dashboard states
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');
  const [ordersSortBy, setOrdersSortBy] = useState('timeSoonest'); // 'timeSoonest' | 'newestOrder' | 'oldestOrder'
  const [printingOrder, setPrintingOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [ordersStationFilter, setOrdersStationFilter] = useState('All');
  const [stationSearchQuery, setStationSearchQuery] = useState('');
  const [stationStateFilter, setStationStateFilter] = useState('All');
  const [stationStatusFilter, setStationStatusFilter] = useState('All');
  const [stationCurrentPage, setStationCurrentPage] = useState(1);
  const [stationPageSize, setStationPageSize] = useState(10);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [trainTrackInfo, setTrainTrackInfo] = useState({});
  const [trackingLoadingId, setTrackingLoadingId] = useState(null);

  const getRevisedETA = (scheduledTime, delayMins) => {
    if (!scheduledTime || scheduledTime === 'N/A') return 'N/A';
    if (!delayMins) return scheduledTime;
    const clean = scheduledTime.replace(/[^0-9:]/g, '');
    const parts = clean.split(':');
    if (parts.length < 2) return scheduledTime;
    let hr = parseInt(parts[0], 10);
    let min = parseInt(parts[1], 10);
    if (isNaN(hr) || isNaN(min)) return scheduledTime;

    let totalMins = hr * 60 + min + delayMins;
    let newHr = Math.floor(totalMins / 60) % 24;
    let newMin = totalMins % 60;
    return `${String(newHr).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
  };

  const parseDojDate = (dojStr) => {
    if (!dojStr) return null;
    const clean = dojStr.replace(/\//g, '-').trim();
    if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) { // YYYY-MM-DD
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          return new Date(y, m, d);
        } else if (parts[2].length === 4) { // DD-MM-YYYY or DD-MMM-YYYY
          const d = parseInt(parts[0], 10);
          let m = parseInt(parts[1], 10) - 1;
          if (isNaN(m)) {
            const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
            const monthShort = parts[1].toLowerCase().substring(0, 3);
            m = monthNames.indexOf(monthShort);
          }
          const y = parseInt(parts[2], 10);
          return new Date(y, m, d);
        }
      }
    }
    const parsed = new Date(dojStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return null;
  };

  const handleTrackTrain = async (orderId, pnr) => {
    const orderObj = orders.find(o => o.id === orderId);

    try {
      setTrackingLoadingId(orderId);

      let trainNo = orderObj?.trainNumber;
      let doj = orderObj?.doj || 'today';
      let stationCode = orderObj?.stationCode || '';

      if (!trainNo || trainNo === 'N/A' || !pnr) {
        const pnrRes = await fetch(`/api/pnr-status?pnr=${pnr}`);
        if (pnrRes.ok) {
          const pnrData = await pnrRes.json();
          if (pnrData.success && pnrData.data) {
            trainNo = pnrData.data.train?.number || pnrData.data.trainNumber || pnrData.data.TrainNo;
            doj = pnrData.data.journey?.dateOfJourney || pnrData.data.date || pnrData.data.Doj || doj;
          }
        }
      }

      if (!trainNo || trainNo === 'N/A') {
        throw new Error("Train number not found");
      }

      // Fetch train schedule to get day offset
      let dayOffset = 0;
      if (stationCode) {
        try {
          const schedRes = await fetch(`/api/train-schedule?trainNo=${trainNo}`);
          if (schedRes.ok) {
            const schedData = await schedRes.json();
            const routeStops = schedData.data?.route || [];
            const match = routeStops.find(s => (s.stationCode || s.stnCode || s.code || '').toUpperCase() === stationCode.toUpperCase());
            if (match && match.day) {
              dayOffset = Math.max(0, parseInt(match.day, 10) - 1);
            }
          }
        } catch (schedErr) {
          console.warn("Failed to determine day offset for admin track train:", schedErr);
        }
      }

      const cleanDoj = doj.replace(/\//g, '-').trim();
      let dateParam = 'today';
      let dojDate = null;
      if (cleanDoj.includes('-')) {
        const parts = cleanDoj.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            dojDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          } else {
            dojDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          }
        }
      } else {
        dojDate = new Date(doj);
      }

      if (dojDate && !isNaN(dojDate.getTime())) {
        if (dayOffset > 0) {
          dojDate.setDate(dojDate.getDate() - dayOffset);
        }
        const yyyy = dojDate.getFullYear();
        const mm = String(dojDate.getMonth() + 1).padStart(2, '0');
        const dd = String(dojDate.getDate()).padStart(2, '0');
        dateParam = `${dd}-${mm}-${yyyy}`;
      }

      const liveRes = await fetch(`/api/track-train?trainNo=${trainNo}&date=${dateParam}`);
      if (!liveRes.ok) throw new Error("Tracking API failed");
      const trackingData = await liveRes.json();

      if (!trackingData.success || !trackingData.data) {
        throw new Error("No tracking data available");
      }

      const stationsArray = trackingData.data.timeline || trackingData.data.stations || [];
      const currentStationText = trackingData.data.statusNote || trackingData.data.currentStationName || "In Transit";

      let delayMins = 0;
      let targetStationCode = String(stationCode || '').toUpperCase().trim();

      const matchedStop = stationsArray.find(s => String(s.stationCode || '').toUpperCase().trim() === targetStationCode);
      if (matchedStop) {
        const rawDelay = matchedStop.arrival?.delay || matchedStop.departure?.delay || "0";
        delayMins = parseInt(String(rawDelay).replace(/[^0-9]/g, '')) || 0;
      } else {
        const delayedStop = stationsArray.find(s => s.arrival?.delay || s.departure?.delay);
        if (delayedStop) {
          const rawDelay = delayedStop.arrival?.delay || delayedStop.departure?.delay || "0";
          delayMins = parseInt(String(rawDelay).replace(/[^0-9]/g, '')) || 0;
        }
      }

      setTrainTrackInfo(prev => ({
        ...prev,
        [orderId]: {
          trainName: trackingData.data.trainName || orderObj?.trainName || "Express Train",
          trainNo,
          delay: delayMins,
          nextStation: currentStationText,
          statusNote: trackingData.data.statusNote || currentStationText,
          lastUpdate: trackingData.data.lastUpdate || '',
          tracked: true
        }
      }));
    } catch (e) {
      console.warn("Live tracking failed:", e);
      alert(`Could not fetch live tracking: ${e.message}. Using default schedule.`);
      setTrainTrackInfo(prev => ({
        ...prev,
        [orderId]: {
          trainName: orderObj?.trainName || "Express Train",
          trainNo: orderObj?.trainNumber || "12001",
          delay: 0,
          nextStation: "Schedule Confirmed (No Live Update)",
          statusNote: "Schedule Confirmed (No Live Update)",
          lastUpdate: "",
          tracked: true
        }
      }));
    } finally {
      setTrackingLoadingId(null);
    }
  };

  const handleAssignRider = (orderId, riderInfo) => {
    updateOrderRider(orderId, riderInfo);
  };

  // Menu Catalog pagination, filter, sorting, bulk actions, and inline edit states
  const [menuCurrentPage, setMenuCurrentPage] = useState(1);
  const [menuPageSize, setMenuPageSize] = useState(10);
  const [menuSortBy, setMenuSortBy] = useState('nameAsc'); // 'nameAsc' | 'nameDesc' | 'priceLow' | 'priceHigh' | 'statusStock'
  const [menuAvailabilityFilter, setMenuAvailabilityFilter] = useState('All'); // 'All' | 'InStock' | 'SoldOut'
  const [menuSelectedIds, setMenuSelectedIds] = useState([]);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');
  const [menuViewMode, setMenuViewMode] = useState('list'); // 'list' | 'grid'

  const handleUpdatePriceInline = async (itemId, newPrice) => {
    const updatedPrice = Number(newPrice) || 0;
    const updated = menuItems.map(item =>
      item.id === itemId ? { ...item, price: updatedPrice, mrp: updatedPrice } : item
    );
    setMenuItems(updated);
    setEditingPriceId(null);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('menu_items').update({ price: updatedPrice, mrp: updatedPrice }).eq('id', itemId);
      } catch (err) {
        console.error("Error updating price inline:", err);
      }
    }
  };

  const handleBulkAvailability = async (statusVal) => {
    if (menuSelectedIds.length === 0) return;
    const updated = menuItems.map(item =>
      menuSelectedIds.includes(item.id) ? { ...item, available: statusVal } : item
    );
    setMenuItems(updated);
    const count = menuSelectedIds.length;
    const targetIds = [...menuSelectedIds];
    setMenuSelectedIds([]);
    alert(`Bulk updated ${count} items to ${statusVal ? 'In Stock' : 'Sold Out'}!`);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('menu_items').update({ available: statusVal }).in('id', targetIds);
      } catch (err) {
        console.error("Error bulk updating status:", err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (menuSelectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${menuSelectedIds.length} items from the catalog?`)) return;
    const updated = menuItems.filter(item => !menuSelectedIds.includes(item.id));
    setMenuItems(updated);
    const count = menuSelectedIds.length;
    const targetIds = [...menuSelectedIds];
    setMenuSelectedIds([]);
    alert(`Successfully deleted ${count} selected items.`);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('menu_items').delete().in('id', targetIds);
      } catch (err) {
        console.error("Error bulk deleting items:", err);
      }
    }
  };

  // Add station form states
  const [newStationName, setNewStationName] = useState('');
  const [newStationCode, setNewStationCode] = useState('');
  const [newStationState, setNewStationState] = useState('');
  const [newStationBuffer, setNewStationBuffer] = useState(60);
  const [newStationManagerName, setNewStationManagerName] = useState('');
  const [newStationManagerPhone, setNewStationManagerPhone] = useState('');
  const [editingStation, setEditingStation] = useState(null);

  // Menu variants states
  const [hasVariants, setHasVariants] = useState(false);
  const [itemVariants, setItemVariants] = useState([{ name: 'Half Plate', price: '' }, { name: 'Full Plate', price: '' }]);
  const [newStateName, setNewStateName] = useState('');

  // Add menu item form states
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Fast Food');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemStationCode, setNewItemStationCode] = useState('ALL');
  const [newItemFoodType, setNewItemFoodType] = useState('veg'); // 'veg' | 'non-veg' | ''

  // Image Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [editingMenuItem, setEditingMenuItem] = useState(null);

  // Station Credentials sub-tab states
  const [adminsList, setAdminsList] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminStationCode, setNewAdminStationCode] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [adminsSearchQuery, setAdminsSearchQuery] = useState('');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Registered Customer Users states
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearchQuery, setUsersSearchQuery] = useState('');

  // Filtered lists for multi-tenant station hub view
  const baseOrders = adminType === 'station'
    ? orders.filter(o => {
      const orderStation = o.stationCode || o.station_code || o.stationcode || '';
      return orderStation.toUpperCase() === selectedStationCode.toUpperCase();
    })
    : (ordersStationFilter === 'All'
      ? orders
      : orders.filter(o => {
        const orderStation = o.stationCode || o.station_code || o.stationcode || '';
        return orderStation.toUpperCase() === ordersStationFilter.toUpperCase();
      })
    );

  const statusFilteredOrders = ordersFilterStatus === 'All'
    ? baseOrders
    : baseOrders.filter(o => o.status === ordersFilterStatus);

  const searchFilteredOrders = ordersSearchQuery.trim() === ''
    ? statusFilteredOrders
    : statusFilteredOrders.filter(o => {
      const q = ordersSearchQuery.toLowerCase();
      const pnr = (o.pnr || '').toLowerCase();
      const coach = (o.coach || '').toLowerCase();
      const seat = String(o.seat || '').toLowerCase();
      const phone = (o.phone || '').toLowerCase();
      const trainNo = (o.trainNumber || '').toLowerCase();
      const trainName = (o.trainName || '').toLowerCase();
      const orderId = String(o.id).toLowerCase();
      return pnr.includes(q) || coach.includes(q) || seat.includes(q) || phone.includes(q) || trainNo.includes(q) || trainName.includes(q) || orderId.includes(q);
    });

  const displayOrders = [...searchFilteredOrders].sort((a, b) => {
    if (ordersSortBy === 'timeSoonest') {
      const parseTime = (timeStr) => {
        if (!timeStr) return 9999;
        const clean = timeStr.replace(/[^0-9:]/g, ''); // Extract hh:mm
        const parts = clean.split(':');
        if (parts.length < 2) return 9999;
        const hr = parseInt(parts[0], 10);
        const min = parseInt(parts[1], 10);
        if (isNaN(hr) || isNaN(min)) return 9999;
        return hr * 60 + min;
      };
      const tA = parseTime(a.arrTime || a.arrivalTime);
      const tB = parseTime(b.arrTime || b.arrivalTime);
      return tA - tB;
    } else if (ordersSortBy === 'oldestOrder') {
      return a.id - b.id;
    } else {
      return b.id - a.id;
    }
  });

  const filteredCategories = React.useMemo(() => {
    if (!categories) return [];
    // Station specific categories
    const stationSpecific = categories
      .filter(cat => cat.station_code && cat.station_code.toUpperCase() === selectedStationCode.toUpperCase())
      .map(cat => cat.name);

    // Global categories
    const globalCats = categories
      .filter(cat => !cat.station_code || cat.station_code.toUpperCase() === 'ALL')
      .map(cat => cat.name);

    // Merge both and remove duplicates using a Set
    return Array.from(new Set([...stationSpecific, ...globalCats]));
  }, [categories, selectedStationCode]);

  const baseMenuItems = React.useMemo(() => {
    if (adminType === 'station') {
      // Station admin sees their own items + global items
      return menuItems.filter(item =>
        (item.station_code && item.station_code.toUpperCase() === selectedStationCode.toUpperCase()) ||
        (!item.station_code || item.station_code.toUpperCase() === 'ALL')
      );
    }
    if (activeSubTab === 'global_menu') {
      // Head admin on Global Menu tab: only show global items (station_code = 'ALL' or null)
      return menuItems.filter(item =>
        !item.station_code || item.station_code.toUpperCase() === 'ALL'
      );
    }
    return menuItems;
  }, [menuItems, adminType, selectedStationCode, activeSubTab]);

  const sortedMenuItems = React.useMemo(() => {
    const filtered = baseMenuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(menuSearchQuery.toLowerCase());
      const matchesCategory = menuActiveCategory === 'All' || item.category === menuActiveCategory;
      const matchesAvailability = menuAvailabilityFilter === 'All'
        ? true
        : menuAvailabilityFilter === 'InStock'
          ? item.available
          : !item.available;

      // Filter by Origin (Local vs Global)
      let matchesOrigin = true;
      if (menuOriginFilter === 'Global') {
        matchesOrigin = !item.station_code || item.station_code.toUpperCase() === 'ALL';
      } else if (menuOriginFilter === 'Local') {
        matchesOrigin = item.station_code && item.station_code.toUpperCase() !== 'ALL';
      }

      return matchesSearch && matchesCategory && matchesAvailability && matchesOrigin;
    });

    return [...filtered].sort((a, b) => {
      if (menuSortBy === 'priceLow') {
        const getPrice = (item) => item.variants && item.variants.length > 0 ? Number(item.variants[0].price) : Number(item.price);
        return getPrice(a) - getPrice(b);
      } else if (menuSortBy === 'priceHigh') {
        const getPrice = (item) => item.variants && item.variants.length > 0 ? Number(item.variants[0].price) : Number(item.price);
        return getPrice(b) - getPrice(a);
      } else if (menuSortBy === 'nameDesc') {
        return b.name.localeCompare(a.name);
      } else if (menuSortBy === 'statusStock') {
        return (b.available ? 1 : 0) - (a.available ? 1 : 0);
      } else {
        return a.name.localeCompare(b.name);
      }
    });
  }, [baseMenuItems, menuSearchQuery, menuActiveCategory, menuAvailabilityFilter, menuSortBy, menuOriginFilter]);

  const totalMenuFilteredCount = sortedMenuItems.length;
  const menuStartIndex = (menuCurrentPage - 1) * menuPageSize;
  const displayMenuItems = React.useMemo(() => {
    return sortedMenuItems.slice(menuStartIndex, menuStartIndex + menuPageSize);
  }, [sortedMenuItems, menuStartIndex, menuPageSize]);

  // Dynamically default the category input field to the first available category name in the list
  React.useEffect(() => {
    const list = adminType === 'global'
      ? categories.filter(c => !c.station_code || c.station_code.toUpperCase() === 'ALL').map(c => c.name)
      : filteredCategories;
    
    if (list.length > 0) {
      if (!list.includes(newItemCategory)) {
        setNewItemCategory(list[0]);
      }
    }
  }, [adminType, categories, filteredCategories, activeSubTab]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          passcode: passcode,
          adminType,
          selectedStationCode
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoginError(data.error || 'Authentication failed. Please check credentials.');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setAdminType(data.type || 'global');
        if (data.station_code) {
          setSelectedStationCode(data.station_code);
        }
      }
    } catch (err) {
      console.error("Login verification failed:", err);
      setLoginError("Server authentication connection failed. Please try again.");
    }
  };

  const fetchAdmins = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      setAdminsLoading(true);
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setAdminsList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleCreateStationAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminPassword.trim() || !newAdminStationCode) {
      alert("Please fill all fields.");
      return;
    }

    if (!isSupabaseConfigured()) {
      alert("Supabase not configured!");
      return;
    }

    try {
      if (editingAdmin) {
        const { error } = await supabase
          .from('admins')
          .update({
            email: newAdminEmail.trim().toLowerCase(),
            password: newAdminPassword.trim(),
            station_code: newAdminStationCode.toUpperCase(),
            manager_name: newAdminName.trim(),
            manager_phone: newAdminPhone.trim()
          })
          .eq('id', editingAdmin.id);

        if (error) {
          alert("Error updating station manager: " + error.message);
        } else {
          // Also update stations table to keep in sync
          await supabase
            .from('stations')
            .update({
              manager_name: newAdminName.trim(),
              manager_phone: newAdminPhone.trim()
            })
            .eq('code', newAdminStationCode.toUpperCase());

          alert("Station Manager credentials updated successfully!");
          setNewAdminEmail('');
          setNewAdminPassword('');
          setNewAdminName('');
          setNewAdminPhone('');
          setEditingAdmin(null);
          fetchAdmins();
        }
      } else {
        const { error } = await supabase
          .from('admins')
          .insert([{
            email: newAdminEmail.trim().toLowerCase(),
            password: newAdminPassword.trim(),
            type: 'station',
            station_code: newAdminStationCode.toUpperCase(),
            manager_name: newAdminName.trim(),
            manager_phone: newAdminPhone.trim()
          }]);

        if (error) {
          alert("Error creating station manager: " + error.message);
        } else {
          // Also update stations table to keep in sync
          await supabase
            .from('stations')
            .update({
              manager_name: newAdminName.trim(),
              manager_phone: newAdminPhone.trim()
            })
            .eq('code', newAdminStationCode.toUpperCase());

          alert("Station Manager credentials created successfully!");
          setNewAdminEmail('');
          setNewAdminPassword('');
          setNewAdminName('');
          setNewAdminPhone('');
          fetchAdmins();
        }
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!confirm("Are you sure you want to delete these credentials?")) return;
    if (!isSupabaseConfigured()) return;
    try {
      const { error } = await supabase.from('admins').delete().eq('id', id);
      if (error) {
        alert("Error deleting admin: " + error.message);
      } else {
        fetchAdmins();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      setUsersLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setUsersList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async (phone) => {
    if (!confirm(`Are you sure you want to delete customer account ${phone}?`)) return;
    if (!isSupabaseConfigured()) return;
    try {
      const { error } = await supabase.from('users').delete().eq('phone', phone);
      if (error) {
        alert("Error deleting user: " + error.message);
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'admins' && isAuthenticated) {
      fetchAdmins();
      if (stations && stations.length > 0 && !newAdminStationCode) {
        setNewAdminStationCode(stations[0].code);
      }
    } else if (activeSubTab === 'users' && isAuthenticated) {
      fetchUsers();
    }
  }, [activeSubTab, isAuthenticated, stations]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isCloudinaryConfigured()) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedUrl(reader.result);
        setUploading(false);
      };
      reader.onerror = () => {
        alert("Failed to read image locally.");
        setUploading(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      setUploading(true);
      const url = await uploadToCloudinary(file);
      setUploadedUrl(url);
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error.message);
      alert("Cloudinary Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddStation = async (e) => {
    e.preventDefault();
    if (!newStationName || !newStationCode || !newStationState) return;
    const newHub = {
      id: Date.now(),
      name: newStationName,
      code: newStationCode.toUpperCase(),
      state: newStationState,
      buffer_minutes: Number(newStationBuffer) || 60,
      manager_name: newStationManagerName || '',
      manager_phone: newStationManagerPhone || ''
    };
    const updated = [...stations, newHub];
    setStations(updated);
    setNewStationName('');
    setNewStationCode('');
    setNewStationState('');
    setNewStationBuffer(60);
    setNewStationManagerName('');
    setNewStationManagerPhone('');

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('stations').insert({
          id: newHub.id,
          name: newHub.name,
          code: newHub.code,
          state: newHub.state,
          buffer_minutes: newHub.buffer_minutes,
          manager_name: newHub.manager_name,
          manager_phone: newHub.manager_phone
        });
        if (error) console.error("Error inserting station to Supabase:", error);
      } catch (err) {
        console.error("Error adding station:", err);
      }
    }
  };

  const handleRemoveStation = async (id) => {
    const updated = stations.filter(s => s.id !== id);
    setStations(updated);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('stations').delete().eq('id', id);
        if (error) console.error("Error deleting station from Supabase:", error);
      } catch (err) {
        console.error("Error removing station:", err);
      }
    }
  };

  const startEditStation = (station) => {
    setEditingStation(station);
    setNewStationName(station.name);
    setNewStationCode(station.code);
    setNewStationState(station.state);
    setNewStationBuffer(station.buffer_minutes || 60);
    setNewStationManagerName(station.manager_name || '');
    setNewStationManagerPhone(station.manager_phone || '');
  };

  const cancelEditStation = () => {
    setEditingStation(null);
    setNewStationName('');
    setNewStationCode('');
    setNewStationState('');
    setNewStationBuffer(60);
    setNewStationManagerName('');
    setNewStationManagerPhone('');
  };

  const handleEditStationSubmit = async (e) => {
    e.preventDefault();
    if (!newStationName || !newStationCode || !newStationState || !editingStation) return;

    const updatedHub = {
      ...editingStation,
      name: newStationName,
      code: newStationCode.toUpperCase(),
      state: newStationState,
      buffer_minutes: Number(newStationBuffer) || 60,
      manager_name: newStationManagerName || '',
      manager_phone: newStationManagerPhone || ''
    };

    const updated = stations.map(s => s.id === editingStation.id ? updatedHub : s);
    setStations(updated);
    cancelEditStation();

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('stations').update({
          name: updatedHub.name,
          code: updatedHub.code,
          state: updatedHub.state,
          buffer_minutes: updatedHub.buffer_minutes,
          manager_name: updatedHub.manager_name,
          manager_phone: updatedHub.manager_phone
        }).eq('id', editingStation.id);
        if (error) console.error("Error updating station in Supabase:", error);
      } catch (err) {
        console.error("Error editing station:", err);
      }
    }
  };

  const handleUpdateStationSettings = async (stationId, settingsObj) => {
    const updated = stations.map(s => s.id === stationId ? { ...s, ...settingsObj } : s);
    setStations(updated);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('stations').update(settingsObj).eq('id', stationId);
        if (error) {
          console.error("Error updating station settings in Supabase:", error);
          alert("Database error: " + error.message);
        } else {
          alert("Station settings updated successfully!");
        }
      } catch (err) {
        console.error("Error updating settings:", err);
      }
    } else {
      alert("Local state updated successfully!");
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!newItemName) return;
    const assignedCode = adminType === 'station' ? selectedStationCode : newItemStationCode;

    let finalPrice = Number(newItemPrice) || 0;
    let finalVariants = [];

    if (hasVariants) {
      const activeVariants = itemVariants.filter(v => v.name.trim() !== '' && v.price !== '');
      if (activeVariants.length > 0) {
        finalVariants = activeVariants.map(v => ({ name: v.name, price: Number(v.price) }));
        finalPrice = Number(activeVariants[0].price);
      }
    }

    const newItem = {
      id: Date.now(),
      name: newItemName,
      price: finalPrice,
      mrp: finalPrice,
      category: newItemCategory,
      available: true,
      description: newItemDescription || 'No description provided.',
      image_url: uploadedUrl || '',
      station_code: assignedCode,
      variants: finalVariants,
      food_type: newItemFoodType
    };

    const updated = [...menuItems, newItem];
    setMenuItems(updated);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemDescription('');
    setUploadedUrl('');
    setNewItemFoodType('veg');
    setHasVariants(false);
    setItemVariants([{ name: 'Half Plate', price: '' }, { name: 'Full Plate', price: '' }]);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('menu_items').insert({
          id: newItem.id,
          name: newItem.name,
          price: newItem.price,
          category: newItem.category,
          mrp: newItem.mrp,
          available: newItem.available,
          description: newItem.description,
          image: newItem.image_url,
          station_code: newItem.station_code,
          variants: newItem.variants,
          food_type: newItem.food_type
        });
        if (error) console.error("Error inserting menu item to Supabase:", error);
      } catch (err) {
        console.error("Error adding menu item:", err);
      }
    }
  };

  const startEditMenuItem = (item) => {
    setEditingMenuItem(item);
    setNewItemName(item.name);
    setNewItemPrice(item.price);

    // Validate if the item's category is in the currently active category list, otherwise default to the first option
    const list = adminType === 'global'
      ? categories.filter(c => !c.station_code || c.station_code.toUpperCase() === 'ALL').map(c => c.name)
      : filteredCategories;

    if (list.includes(item.category)) {
      setNewItemCategory(item.category);
    } else if (list.length > 0) {
      setNewItemCategory(list[0]);
    } else {
      setNewItemCategory(item.category || 'Uncategorized');
    }

    setNewItemDescription(item.description || '');
    setUploadedUrl(item.image_url || item.image || '');
    setNewItemStationCode(item.station_code || 'ALL');
    setNewItemFoodType(item.food_type || '');
    if (item.variants && item.variants.length > 0) {
      setHasVariants(true);
      setItemVariants(item.variants);
    } else {
      setHasVariants(false);
      setItemVariants([{ name: 'Half Plate', price: '' }, { name: 'Full Plate', price: '' }]);
    }
  };

  const cancelEditMenuItem = () => {
    setEditingMenuItem(null);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemCategory('Fast Food');
    setNewItemDescription('');
    setUploadedUrl('');
    setNewItemStationCode('ALL');
    setNewItemFoodType('veg');
    setHasVariants(false);
    setItemVariants([{ name: 'Half Plate', price: '' }, { name: 'Full Plate', price: '' }]);
  };

  const handleEditMenuItemSubmit = async (e) => {
    e.preventDefault();
    if (!newItemName || !editingMenuItem) return;

    let finalPrice = Number(newItemPrice) || 0;
    let finalVariants = [];

    if (hasVariants) {
      const activeVariants = itemVariants.filter(v => v.name.trim() !== '' && v.price !== '');
      if (activeVariants.length > 0) {
        finalVariants = activeVariants.map(v => ({ name: v.name, price: Number(v.price) }));
        finalPrice = Number(activeVariants[0].price);
      }
    }

    const updatedItem = {
      ...editingMenuItem,
      name: newItemName,
      price: finalPrice,
      mrp: finalPrice,
      category: newItemCategory,
      description: newItemDescription || 'No description provided.',
      image_url: uploadedUrl || '',
      station_code: adminType === 'station' ? selectedStationCode : newItemStationCode,
      variants: finalVariants,
      food_type: newItemFoodType
    };

    const updatedList = menuItems.map(item => item.id === editingMenuItem.id ? updatedItem : item);
    setMenuItems(updatedList);
    cancelEditMenuItem();

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('menu_items').update({
          name: updatedItem.name,
          price: updatedItem.price,
          category: updatedItem.category,
          mrp: updatedItem.mrp,
          description: updatedItem.description,
          image: updatedItem.image_url,
          station_code: updatedItem.station_code,
          variants: updatedItem.variants,
          food_type: updatedItem.food_type
        }).eq('id', editingMenuItem.id);
        if (error) console.error("Error updating menu item in Supabase:", error);
      } catch (err) {
        console.error("Error editing menu item:", err);
      }
    }
  };

  const handleToggleItemAvailability = async (id) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    const newStatus = !item.available;
    const updated = menuItems.map(item =>
      item.id === id ? { ...item, available: newStatus } : item
    );
    setMenuItems(updated);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('menu_items').update({ available: newStatus }).eq('id', id);
        if (error) console.error("Error updating item availability in Supabase:", error);
      } catch (err) {
        console.error("Error toggling status:", err);
      }
    }
  };

  const handleRemoveMenuItem = async (id) => {
    const updated = menuItems.filter(item => item.id !== id);
    setMenuItems(updated);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('menu_items').delete().eq('id', id);
        if (error) console.error("Error deleting item from Supabase:", error);
      } catch (err) {
        console.error("Error removing item:", err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      console.warn(e);
    }
    setIsAuthenticated(false);
    setIsMobileMenuOpen(false);
  };

  if (sessionChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-rose-600 rounded-full animate-ping"></div>
          </div>
        </div>
        <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest animate-pulse">Refreshing Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        adminType={adminType}
        setAdminType={setAdminType}
        selectedStationCode={selectedStationCode}
        setSelectedStationCode={setSelectedStationCode}
        passcode={passcode}
        setPasscode={setPasscode}
        showPasscode={showPasscode}
        setShowPasscode={setShowPasscode}
        loginError={loginError}
        setLoginError={setLoginError}
        adminEmail={adminEmail}
        setAdminEmail={setAdminEmail}
        handleAdminLogin={handleAdminLogin}
        stations={stations}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-805 flex flex-col md:flex-row font-sans">
      <Sidebar
        adminType={adminType}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleLogout={handleLogout}
        selectedStationCode={selectedStationCode}
      />

      <main className="flex-grow p-6 md:p-10 md:max-h-screen md:overflow-y-auto overflow-x-hidden">
        {activeSubTab === 'orders' && (
          <OrdersTab
            adminType={adminType}
            selectedStationCode={selectedStationCode}
            baseOrders={baseOrders}
            orders={orders}
            stations={stations}
            ordersStationFilter={ordersStationFilter}
            setOrdersStationFilter={setOrdersStationFilter}
            ordersSearchQuery={ordersSearchQuery}
            setOrdersSearchQuery={setOrdersSearchQuery}
            ordersSortBy={ordersSortBy}
            setOrdersSortBy={setOrdersSortBy}
            ordersFilterStatus={ordersFilterStatus}
            setOrdersFilterStatus={setOrdersFilterStatus}
            displayOrders={displayOrders}
            trainTrackInfo={trainTrackInfo}
            trackingLoadingId={trackingLoadingId}
            handleTrackTrain={handleTrackTrain}
            getRevisedETA={getRevisedETA}
            updateOnDemandStatus={updateOnDemandStatus}
            handleAssignRider={handleAssignRider}
            updateOrderStatus={updateOrderStatus}
            setPrintingOrder={setPrintingOrder}
            selectedOrderDetails={selectedOrderDetails}
            setSelectedOrderDetails={setSelectedOrderDetails}
          />
        )}

        {(activeSubTab === 'menu' || activeSubTab === 'categories') && adminType === 'station' && (
          <MenuCatalogTab
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
            adminType={adminType}
            selectedStationCode={selectedStationCode}
            baseMenuItems={baseMenuItems}
            menuItems={menuItems}
            categories={filteredCategories}
            addCategory={(name, image) => addCategory(name, selectedStationCode, image)}
            removeCategory={(name) => removeCategory(name, selectedStationCode)}
            updateCategory={(oldName, newName, image) => updateCategory(oldName, newName, selectedStationCode, image)}
            menuSearchQuery={menuSearchQuery}
            setMenuSearchQuery={setMenuSearchQuery}
            menuSortBy={menuSortBy}
            setMenuSortBy={setMenuSortBy}
            menuAvailabilityFilter={menuAvailabilityFilter}
            setMenuAvailabilityFilter={setMenuAvailabilityFilter}
            menuActiveCategory={menuActiveCategory}
            setMenuActiveCategory={setMenuActiveCategory}
            menuViewMode={menuViewMode}
            setMenuViewMode={setMenuViewMode}
            menuPageSize={menuPageSize}
            setMenuPageSize={setMenuPageSize}
            menuSelectedIds={menuSelectedIds}
            setMenuSelectedIds={setMenuSelectedIds}
            displayMenuItems={displayMenuItems}
            totalMenuFilteredCount={totalMenuFilteredCount}
            menuStartIndex={menuStartIndex}
            menuCurrentPage={menuCurrentPage}
            setMenuCurrentPage={setMenuCurrentPage}
            newItemName={newItemName}
            setNewItemName={setNewItemName}
            newItemPrice={newItemPrice}
            setNewItemPrice={setNewItemPrice}
            newItemCategory={newItemCategory}
            setNewItemCategory={setNewItemCategory}
            newItemStationCode={newItemStationCode}
            setNewItemStationCode={setNewItemStationCode}
            newItemFoodType={newItemFoodType}
            setNewItemFoodType={setNewItemFoodType}
            uploadedUrl={uploadedUrl}
            setUploadedUrl={setUploadedUrl}
            newItemDescription={newItemDescription}
            setNewItemDescription={setNewItemDescription}
            hasVariants={hasVariants}
            setHasVariants={setHasVariants}
            itemVariants={itemVariants}
            setItemVariants={setItemVariants}
            stations={stations}
            uploading={uploading}
            handleImageUpload={handleImageUpload}
            handleAddMenuItem={handleAddMenuItem}
            startEditMenuItem={startEditMenuItem}
            cancelEditMenuItem={cancelEditMenuItem}
            handleEditMenuItemSubmit={handleEditMenuItemSubmit}
            handleBulkAvailability={handleBulkAvailability}
            handleBulkDelete={handleBulkDelete}
            handleUpdatePriceInline={handleUpdatePriceInline}
            handleToggleItemAvailability={handleToggleItemAvailability}
            handleRemoveMenuItem={handleRemoveMenuItem}
            editingMenuItem={editingMenuItem}
            editingPriceId={editingPriceId}
            setEditingPriceId={setEditingPriceId}
            editingPriceValue={editingPriceValue}
            setEditingPriceValue={setEditingPriceValue}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            editingCategory={editingCategory}
            setEditingCategory={setEditingCategory}
            editCategoryName={editCategoryName}
            setEditCategoryName={setEditCategoryName}
            toggleGlobalItemAvailability={toggleGlobalItemAvailability}
            menuOriginFilter={menuOriginFilter}
            setMenuOriginFilter={setMenuOriginFilter}
          />
        )}

        {(activeSubTab === 'global_menu' || activeSubTab === 'global_categories') && adminType === 'global' && (
          <MenuCatalogTab
            activeSubTab={activeSubTab === 'global_menu' ? 'menu' : 'categories'}
            setActiveSubTab={(tab) => setActiveSubTab(tab === 'menu' ? 'global_menu' : 'global_categories')}
            adminType={'global'}
            selectedStationCode={'ALL'}
            baseMenuItems={baseMenuItems}
            menuItems={menuItems}
            categories={categories.filter(c => !c.station_code || c.station_code.toUpperCase() === 'ALL').map(c => c.name)}
            addCategory={(name, image) => addCategory(name, 'ALL', image)}
            removeCategory={(name) => removeCategory(name, 'ALL')}
            updateCategory={(oldName, newName, image) => updateCategory(oldName, newName, 'ALL', image)}
            menuSearchQuery={menuSearchQuery}
            setMenuSearchQuery={setMenuSearchQuery}
            menuSortBy={menuSortBy}
            setMenuSortBy={setMenuSortBy}
            menuAvailabilityFilter={menuAvailabilityFilter}
            setMenuAvailabilityFilter={setMenuAvailabilityFilter}
            menuActiveCategory={menuActiveCategory}
            setMenuActiveCategory={setMenuActiveCategory}
            menuViewMode={menuViewMode}
            setMenuViewMode={setMenuViewMode}
            menuPageSize={menuPageSize}
            setMenuPageSize={setMenuPageSize}
            menuSelectedIds={menuSelectedIds}
            setMenuSelectedIds={setMenuSelectedIds}
            displayMenuItems={displayMenuItems}
            totalMenuFilteredCount={totalMenuFilteredCount}
            menuStartIndex={menuStartIndex}
            menuCurrentPage={menuCurrentPage}
            setMenuCurrentPage={setMenuCurrentPage}
            newItemName={newItemName}
            setNewItemName={setNewItemName}
            newItemPrice={newItemPrice}
            setNewItemPrice={setNewItemPrice}
            newItemCategory={newItemCategory}
            setNewItemCategory={setNewItemCategory}
            newItemStationCode={newItemStationCode}
            setNewItemStationCode={setNewItemStationCode}
            newItemFoodType={newItemFoodType}
            setNewItemFoodType={setNewItemFoodType}
            uploadedUrl={uploadedUrl}
            setUploadedUrl={setUploadedUrl}
            newItemDescription={newItemDescription}
            setNewItemDescription={setNewItemDescription}
            hasVariants={hasVariants}
            setHasVariants={setHasVariants}
            itemVariants={itemVariants}
            setItemVariants={setItemVariants}
            stations={stations}
            uploading={uploading}
            handleImageUpload={handleImageUpload}
            handleAddMenuItem={handleAddMenuItem}
            startEditMenuItem={startEditMenuItem}
            cancelEditMenuItem={cancelEditMenuItem}
            handleEditMenuItemSubmit={handleEditMenuItemSubmit}
            handleBulkAvailability={handleBulkAvailability}
            handleBulkDelete={handleBulkDelete}
            handleUpdatePriceInline={handleUpdatePriceInline}
            handleToggleItemAvailability={handleToggleItemAvailability}
            handleRemoveMenuItem={handleRemoveMenuItem}
            editingMenuItem={editingMenuItem}
            editingPriceId={editingPriceId}
            setEditingPriceId={setEditingPriceId}
            editingPriceValue={editingPriceValue}
            setEditingPriceValue={setEditingPriceValue}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            editingCategory={editingCategory}
            setEditingCategory={setEditingCategory}
            editCategoryName={editCategoryName}
            setEditCategoryName={setEditCategoryName}
            toggleGlobalItemAvailability={toggleGlobalItemAvailability}
          />
        )}

        {activeSubTab === 'stations' && (
          <StationsTab
            adminType={adminType}
            selectedStationCode={selectedStationCode}
            stations={stations}
            stationSearchQuery={stationSearchQuery}
            setStationSearchQuery={setStationSearchQuery}
            stationStateFilter={stationStateFilter}
            setStationStateFilter={setStationStateFilter}
            stationStatusFilter={stationStatusFilter}
            setStationStatusFilter={setStationStatusFilter}
            stationPageSize={stationPageSize}
            stationCurrentPage={stationCurrentPage}
            setStationCurrentPage={setStationCurrentPage}
            newStationName={newStationName}
            setNewStationName={setNewStationName}
            newStationCode={newStationCode}
            setNewStationCode={setNewStationCode}
            newStationState={newStationState}
            setNewStationState={setNewStationState}
            newStationBuffer={newStationBuffer}
            setNewStationBuffer={setNewStationBuffer}
            newStationManagerName={newStationManagerName}
            setNewStationManagerName={setNewStationManagerName}
            newStationManagerPhone={newStationManagerPhone}
            setNewStationManagerPhone={setNewStationManagerPhone}
            availableStates={availableStates}
            addAvailableState={addAvailableState}
            removeAvailableState={removeAvailableState}
            renameAvailableState={renameAvailableState}
            supportPhone={supportPhone}
            supportEmail={supportEmail}
            supportContacts={supportContacts}
            newStateName={newStateName}
            setNewStateName={setNewStateName}
            editingStation={editingStation}
            startEditStation={startEditStation}
            cancelEditStation={cancelEditStation}
            handleEditStationSubmit={handleEditStationSubmit}
            handleRemoveStation={handleRemoveStation}
            handleAddStation={handleAddStation}
            handleUpdateStationSettings={handleUpdateStationSettings}
          />
        )}

        {activeSubTab === 'states' && adminType === 'global' && (
          <StatesTab
            availableStates={availableStates}
            addAvailableState={addAvailableState}
            removeAvailableState={removeAvailableState}
            renameAvailableState={renameAvailableState}
            stations={stations}
          />
        )}

        {activeSubTab === 'admins' && adminType === 'global' && (
          <CredentialsTab
            activeSubTab={activeSubTab}
            adminType={adminType}
            adminsList={adminsList}
            adminsSearchQuery={adminsSearchQuery}
            setAdminsSearchQuery={setAdminsSearchQuery}
            stations={stations}
            newAdminEmail={newAdminEmail}
            setNewAdminEmail={setNewAdminEmail}
            newAdminPassword={newAdminPassword}
            setNewAdminPassword={setNewAdminPassword}
            newAdminStationCode={newAdminStationCode}
            setNewAdminStationCode={setNewAdminStationCode}
            newAdminName={newAdminName}
            setNewAdminName={setNewAdminName}
            newAdminPhone={newAdminPhone}
            setNewAdminPhone={setNewAdminPhone}
            editingAdmin={editingAdmin}
            setEditingAdmin={setEditingAdmin}
            isAdminModalOpen={isAdminModalOpen}
            setIsAdminModalOpen={setIsAdminModalOpen}
            handleCreateStationAdmin={handleCreateStationAdmin}
            adminsLoading={adminsLoading}
            visiblePasswords={visiblePasswords}
            setVisiblePasswords={setVisiblePasswords}
            handleDeleteAdmin={handleDeleteAdmin}
          />
        )}

        {activeSubTab === 'users' && adminType === 'global' && (
          <PlatformSettingsTab
            activeSubTab={activeSubTab}
            adminType={adminType}
            usersList={usersList}
            usersSearchQuery={usersSearchQuery}
            setUsersSearchQuery={setUsersSearchQuery}
            usersLoading={usersLoading}
            handleDeleteUser={handleDeleteUser}
            codPolicy={codPolicy}
            updateCodPolicy={updateCodPolicy}
            codCutoffHour={codCutoffHour}
            updateCodCutoffHour={updateCodCutoffHour}
            deliveryCharge={deliveryCharge}
            updateDeliveryCharge={updateDeliveryCharge}
            freeProduct={freeProduct}
            updateFreeProduct={updateFreeProduct}
            giftThreshold={giftThreshold}
            updateGiftThreshold={updateGiftThreshold}
            supportPhone={supportPhone}
            updateSupportPhone={updateSupportPhone}
            supportEmail={supportEmail}
            updateSupportEmail={updateSupportEmail}
            supportContacts={supportContacts}
            updateSupportContacts={updateSupportContacts}
          />
        )}

        {activeSubTab === 'config' && adminType === 'global' && (
          <PlatformSettingsTab
            activeSubTab={activeSubTab}
            adminType={adminType}
            usersList={usersList}
            usersSearchQuery={usersSearchQuery}
            setUsersSearchQuery={setUsersSearchQuery}
            usersLoading={usersLoading}
            handleDeleteUser={handleDeleteUser}
            codPolicy={codPolicy}
            updateCodPolicy={updateCodPolicy}
            codCutoffHour={codCutoffHour}
            updateCodCutoffHour={updateCodCutoffHour}
            deliveryCharge={deliveryCharge}
            updateDeliveryCharge={updateDeliveryCharge}
            freeProduct={freeProduct}
            updateFreeProduct={updateFreeProduct}
            giftThreshold={giftThreshold}
            updateGiftThreshold={updateGiftThreshold}
            supportPhone={supportPhone}
            updateSupportPhone={updateSupportPhone}
            supportEmail={supportEmail}
            updateSupportEmail={updateSupportEmail}
            supportContacts={supportContacts}
            updateSupportContacts={updateSupportContacts}
            socialInstagram={socialInstagram}
            updateSocialInstagram={updateSocialInstagram}
            socialFacebook={socialFacebook}
            updateSocialFacebook={updateSocialFacebook}
            socialTwitter={socialTwitter}
            updateSocialTwitter={updateSocialTwitter}
          />
        )}

        {activeSubTab === 'contacts' && (
          <SupportDirectoryTab
            adminType={adminType}
            supportContacts={supportContacts}
            updateSupportContacts={updateSupportContacts}
          />
        )}

        {activeSubTab === 'home_custom' && adminType === 'global' && (
          <HomeCustomizeTab />
        )}

        {/* KOT Printer Dialog Overlay */}
        {printingOrder && (
          <div className="fixed inset-0 w-full h-full z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative border border-slate-200 shadow-2xl flex flex-col">
              <button
                onClick={() => setPrintingOrder(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex-grow space-y-4 font-mono text-xs text-slate-800 p-2" id="kot-print-area">
                <div className="text-center border-b border-dashed border-slate-350 pb-3">
                  <h3 className="font-black text-sm tracking-wider text-slate-900">SAFERAIL FASTFOOD</h3>
                  <p className="text-[10px] text-slate-500">Platform Delivery Service</p>
                  <p className="text-[10px] font-bold mt-1 text-slate-808">Station Hub: {printingOrder.stationCode || printingOrder.station_code || printingOrder.stationcode || 'N/A'}</p>
                </div>

                <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 text-[11px]">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-bold">{printingOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PNR:</span>
                    <span className="font-bold">{printingOrder.pnr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Train No/Name:</span>
                    <span className="font-bold">{printingOrder.trainNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Arrival:</span>
                    <span className="font-bold">{printingOrder.arrTime || printingOrder.arrivalTime || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coach / Berth:</span>
                    <span className="font-black text-rose-600 bg-rose-50 px-1 rounded">Coach {printingOrder.coach} - Seat {printingOrder.seat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Mob:</span>
                    <span className="font-bold">{printingOrder.phone}</span>
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-300 pb-3">
                  <div className="font-bold text-[10px] text-slate-400 uppercase mb-2">Items Summary</div>
                  {printingOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="font-bold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between">
                    <span>Payment Mode:</span>
                    <span className="font-black uppercase text-rose-600">
                      {String(printingOrder.paymentMode).toUpperCase() === 'ONLINE' ? '✓ PAID ONLINE' : '⏱ COLLECT COD'}
                    </span>
                  </div>
                  {printingOrder.isFreeGiftAdded && (
                    <div className="flex justify-between text-amber-600 font-bold">
                      <span>Free Gift:</span>
                      <span>{printingOrder.freeGiftProduct}</span>
                    </div>
                  )}
                  {printingOrder.rider_name && (
                    <div className="flex justify-between">
                      <span>Assigned Rider:</span>
                      <span className="font-bold">{printingOrder.rider_name}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-sm font-black border-t border-double border-slate-400 pt-2 text-slate-900">
                  <span>TOTAL PAYABLE:</span>
                  <span>₹{printingOrder.total}</span>
                </div>

                <div className="text-center text-[9px] text-slate-400 pt-2 border-t border-dashed border-slate-200">
                  Thank you for choosing SafeRail!<br />
                  FSSAI Partnered Kitchen
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    const printContent = document.getElementById('kot-print-area').innerHTML;
                    document.body.innerHTML = `
                    <div style="font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto;">
                      ${printContent}
                    </div>
                  `;
                    window.print();
                    window.location.reload();
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print KOT
                </button>
                <button
                  onClick={() => setPrintingOrder(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-655 font-bold py-2.5 rounded-xl text-xs border border-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Detailed Order View Modal - EXACT Card Layout */}
      {selectedOrderDetails && (() => {
        const order = selectedOrderDetails;
        const oStationCode = order.stationCode || order.station_code || order.stationcode || '';
        const targetStation = stations.find(st => st.code.toUpperCase() === oStationCode.toUpperCase());
        const stationDisplayName = targetStation ? `${targetStation.name} (${targetStation.code})` : (oStationCode || 'Global/ALL');
        const orderItems = Array.isArray(order.items)
          ? order.items
          : (typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items); } catch (e) { return []; } })() : []);
        const orderOnDemand = Array.isArray(order.onDemandRequests)
          ? order.onDemandRequests
          : (typeof order.onDemandRequests === 'string' ? (() => { try { return JSON.parse(order.onDemandRequests); } catch (e) { return []; } })() : []);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-2 sm:p-4 min-h-screen h-full w-full overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-6xl w-full p-4 sm:p-6 md:p-8 space-y-6 shadow-2xl relative border border-slate-105 max-h-[90vh] overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2.5 rounded-full transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Exact Card Header inside Modal */}
              <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-150 pb-4">
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

                <div className="text-right mr-10 sm:mr-0">
                  {order.timestamp && (
                    <span className="text-xs lg:text-sm text-slate-555 font-black bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" /> Placed: {order.timestamp}
                    </span>
                  )}
                </div>
              </div>

              {/* Exact Card Body columns inside Modal */}
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
                          <span className={`inline-flex items-center gap-1 text-[10px] lg:text-xs px-2.5 py-1 rounded-md font-black uppercase tracking-wider border ${trainTrackInfo[order.id].delay > 0 ? 'text-red-700 bg-red-55 border-red-200 animate-pulse' : 'text-emerald-700 bg-emerald-55 border-emerald-200'
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

                {/* Order Items */}
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

                {/* Custom Requests */}
                <div className="border border-slate-200 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs lg:text-[13px] text-slate-455 font-black uppercase tracking-wider block mb-3">Custom Requests</span>
                    {orderOnDemand && orderOnDemand.length > 0 ? (
                      <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                        {orderOnDemand.map((req, idx) => (
                          <div key={idx} className="text-xs lg:text-sm p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col justify-between gap-2">
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-extrabold text-slate-855 leading-snug">
                                {req.item || req.name}
                                {(!String(req.item || req.name).startsWith('Custom MRP Request:') && !String(req.item || req.name).startsWith('Alert:')) && (
                                  req.price > 0 ? (
                                    <span className="text-[10px] lg:text-xs text-amber-700 bg-amber-50 border border-amber-205 px-1.5 py-0.5 rounded ml-1.5 font-black uppercase tracking-wider">
                                      ₹{req.price} MRP
                                    </span>
                                  ) : (
                                    <span className="text-[10px] lg:text-xs text-emerald-755 bg-emerald-50 border border-emerald-105 px-2 py-0.5 rounded ml-1.5 font-black uppercase tracking-wider">
                                      Free
                                    </span>
                                  )
                                )}
                              </span>

                              <span className={`text-[9px] lg:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${req.status === 'Accepted' ? 'bg-emerald-55 text-emerald-700 border-emerald-150' :
                                req.status === 'Rejected' ? 'bg-rose-50 text-rose-750 border-rose-150' : 'bg-amber-50 text-amber-755 border-amber-205 animate-pulse'
                                }`}>
                                {req.status}
                              </span>
                            </div>

                            {req.status === 'Pending' && (
                              <div className="flex gap-2 justify-end mt-1 border-t border-slate-200/50 pt-2.5">
                                <button
                                  onClick={() => {
                                    updateOnDemandStatus(order.id, idx, 'Accepted');
                                    setSelectedOrderDetails(prev => {
                                      const updatedOnDemand = [...prev.onDemandRequests];
                                      updatedOnDemand[idx].status = 'Accepted';
                                      return { ...prev, onDemandRequests: updatedOnDemand };
                                    });
                                  }}
                                  className="bg-emerald-55 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-250 transition-all text-[10px] lg:text-xs font-black uppercase tracking-wider"
                                >
                                  ✓ Accept
                                </button>
                                <button
                                  onClick={() => {
                                    updateOnDemandStatus(order.id, idx, 'Rejected');
                                    setSelectedOrderDetails(prev => {
                                      const updatedOnDemand = [...prev.onDemandRequests];
                                      updatedOnDemand[idx].status = 'Rejected';
                                      return { ...prev, onDemandRequests: updatedOnDemand };
                                    });
                                  }}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-250 transition-all text-[10px] lg:text-xs font-black uppercase tracking-wider"
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

              {/* Exact Card Footer inside Modal */}
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
                      onBlur={(e) => {
                        handleAssignRider(order.id, e.target.value);
                        setSelectedOrderDetails(prev => ({ ...prev, rider_name: e.target.value }));
                      }}
                      className="bg-slate-50 border border-slate-205 rounded-xl pl-3 pr-8 py-2.5 text-xs lg:text-sm font-semibold text-slate-805 placeholder-slate-400 focus:outline-none focus:border-rose-500 w-full shadow-inner"
                    />
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
                        onClick={() => {
                          updateOrderStatus(order.id, 'Preparing');
                          setSelectedOrderDetails(prev => ({ ...prev, status: 'Preparing' }));
                        }}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs lg:text-sm px-6 py-3.5 rounded-2xl uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-md shadow-amber-600/20 hover:shadow-lg hover:shadow-amber-600/30 flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap"
                      >
                        <ChefHat className="w-5 h-5" /> Start Preparing
                      </button>
                    )}
                    {order.status === 'Preparing' && (
                      <button
                        onClick={() => {
                          updateOrderStatus(order.id, 'Dispatched');
                          setSelectedOrderDetails(prev => ({ ...prev, status: 'Dispatched' }));
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs lg:text-sm px-6 py-3.5 rounded-2xl uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap"
                      >
                        <Send className="w-5 h-5" /> Handover to Rider
                      </button>
                    )}
                    {order.status === 'Dispatched' && (
                      <button
                        onClick={() => {
                          updateOrderStatus(order.id, 'Delivered');
                          setSelectedOrderDetails(prev => ({ ...prev, status: 'Delivered' }));
                        }}
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
                            setSelectedOrderDetails(prev => ({ ...prev, status: 'Cancelled' }));
                          }
                        }}
                        className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-extrabold text-xs lg:text-sm px-6 py-3.5 rounded-2xl uppercase tracking-wider transition-all duration-200 active:scale-[0.98] border border-rose-200 hover:border-rose-600 flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap"
                        title="Cancel Order"
                      >
                        <X className="w-5 h-5" /> Cancel
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setPrintingOrder(order);
                        setSelectedOrderDetails(null);
                      }}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 p-3 rounded-xl border border-slate-200 transition-all flex items-center justify-center shrink-0"
                      title="Print KOT Slip"
                    >
                      <Printer className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest animate-pulse">Loading Admin Portal...</p>
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  );
}
