"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, officialSupabase } from '../lib/supabase';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [stations, setStations] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [freeProduct, setFreeProduct] = useState("");
  const [codPolicy, setCodPolicy] = useState('always_allow');
  const [codCutoffHour, setCodCutoffHour] = useState(21);
  const [availableStates, setAvailableStates] = useState([]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [giftThreshold, setGiftThreshold] = useState(0);
  const [supportPhone, setSupportPhone] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportContacts, setSupportContacts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Database load/save and Supabase sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem("s_user");
        if (storedUser && storedUser !== "undefined") setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }


    }

    const parseOrderObj = (o) => {
      if (!o) return o;
      return {
        ...o,
        items: typeof o.items === 'string' ? (() => { try { return JSON.parse(o.items); } catch (e) { return []; } })() : (o.items || []),
        onDemandRequests: typeof o.onDemandRequests === 'string'
          ? (() => { try { return JSON.parse(o.onDemandRequests); } catch (e) { return []; } })()
          : (o.onDemandRequests || [])
      };
    };

    if (isSupabaseConfigured()) {
      const syncFromSupabase = async () => {
        try {
          const { data: stationsData } = await supabase.from('stations').select('*');
          if (stationsData) {
            const formattedStations = stationsData.map(s => ({
              ...s,
              buffer_minutes: Number(s.buffer_minutes) || 60
            }));
            setStations(formattedStations);
          }

          const { data: menuData } = await supabase.from('menu_items').select('*');
          if (menuData) {
            const formattedMenu = menuData.map(item => ({
              ...item,
              price: Number(item.price),
              mrp: Number(item.mrp)
            }));
            setMenuItems(formattedMenu);
          }

          const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (ordersData) {
            setOrders(ordersData.map(parseOrderObj));
          }

          const { data: categoriesData } = await supabase.from('categories').select('*');
          if (categoriesData) {
            setCategories(categoriesData);
          }

          const { data: configData } = await supabase.from('config').select('*').eq('key', 'free_product').single();
          if (configData) {
            setFreeProduct(configData.value);
          }

          const { data: codPolicyData } = await supabase.from('config').select('*').eq('key', 'cod_policy').single();
          if (codPolicyData) {
            setCodPolicy(codPolicyData.value);
          }

          const { data: cutoffHourData } = await supabase.from('config').select('*').eq('key', 'cod_cutoff_hour').single();
          if (cutoffHourData) {
            const hr = Number(cutoffHourData.value);
            setCodCutoffHour(hr);
          }

          const { data: deliveryData } = await supabase.from('config').select('*').eq('key', 'delivery_charge').single();
          if (deliveryData) {
            const charge = Number(deliveryData.value);
            setDeliveryCharge(charge);
          }

          const { data: thresholdData } = await supabase.from('config').select('*').eq('key', 'gift_threshold').single();
          if (thresholdData) {
            const limit = Number(thresholdData.value);
            setGiftThreshold(limit);
          }

          const { data: statesConfig } = await supabase.from('config').select('*').eq('key', 'available_states').single();
          if (statesConfig) {
            try {
              const parsedStates = JSON.parse(statesConfig.value);
              setAvailableStates(parsedStates);
            } catch (e) {
              console.error("Error parsing available_states config:", e);
            }
          }

          const { data: supportPhoneData } = await supabase.from('config').select('*').eq('key', 'support_phone').single();
          if (supportPhoneData) {
            setSupportPhone(supportPhoneData.value);
          }

          const { data: supportEmailData } = await supabase.from('config').select('*').eq('key', 'support_email').single();
          if (supportEmailData) {
            setSupportEmail(supportEmailData.value);
          }

          const { data: supportContactsData } = await supabase.from('config').select('*').eq('key', 'hq_support_contacts').single();
          if (supportContactsData) {
            try {
              const parsed = JSON.parse(supportContactsData.value);
              setSupportContacts(parsed);
            } catch (e) {
              console.error("Error parsing support contacts:", e);
            }
          }
        } catch (err) {
          console.warn("Supabase load fallback:", err);
        }
      };
      syncFromSupabase();

      // Set up Realtime WebSockets listener for orders
      const channel = officialSupabase
        .channel('orders-realtime-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          console.log('Realtime Order Event:', payload);
          if (payload.eventType === 'INSERT') {
            setOrders(prev => {
              if (prev.some(o => o.id === payload.new.id)) return prev;
              const updated = [parseOrderObj(payload.new), ...prev];
              localStorage.setItem("s_orders", JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => {
              const updated = prev.map(o => o.id === payload.new.id ? parseOrderObj(payload.new) : o);
              localStorage.setItem("s_orders", JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => {
              const updated = prev.filter(o => o.id !== payload.old.id);
              localStorage.setItem("s_orders", JSON.stringify(updated));
              return updated;
            });
          }
        })
        .subscribe();

      // Set up Realtime WebSockets listener for stations
      const stationsChannel = officialSupabase
        .channel('stations-realtime-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stations' }, (payload) => {
          console.log('Realtime Station Event:', payload);
          if (payload.eventType === 'UPDATE') {
            setStations(prev => {
              const updated = prev.map(s => s.id === payload.new.id ? {
                ...s,
                ...payload.new,
                buffer_minutes: Number(payload.new.buffer_minutes) || 60
              } : s);
              localStorage.setItem("s_stations", JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'INSERT') {
            setStations(prev => {
              if (prev.some(s => s.id === payload.new.id)) return prev;
              const formatted = {
                ...payload.new,
                buffer_minutes: Number(payload.new.buffer_minutes) || 60
              };
              const updated = [...prev, formatted];
              localStorage.setItem("s_stations", JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            setStations(prev => {
              const updated = prev.filter(s => s.id !== payload.old.id);
              localStorage.setItem("s_stations", JSON.stringify(updated));
              return updated;
            });
          }
        })
        .subscribe();

      // Poll stations every 5 seconds for real-time fallback
      const pollInterval = setInterval(() => {
        const fetchLatestStations = async () => {
          try {
            const { data: stationsData } = await supabase.from('stations').select('*');
            if (stationsData) {
              const formattedStations = stationsData.map(s => ({
                ...s,
                buffer_minutes: Number(s.buffer_minutes) || 60
              }));
              setStations(prev => {
                const isSame = JSON.stringify(prev) === JSON.stringify(formattedStations);
                if (isSame) return prev;
                localStorage.setItem("s_stations", JSON.stringify(formattedStations));
                return formattedStations;
              });
            }
          } catch (e) {
            console.warn("Poll stations failed:", e);
          }
        };
        fetchLatestStations();
      }, 5000);

      return () => {
        officialSupabase.removeChannel(channel);
        officialSupabase.removeChannel(stationsChannel);
        clearInterval(pollInterval);
      };
    }
  }, []);

  const saveStations = async (newStations) => {
    // Find deleted stations by comparing previous state with new array
    const currentIds = stations.map(s => s.id);
    const newIds = newStations.map(s => s.id);
    const deletedIds = currentIds.filter(id => !newIds.includes(id));

    setStations(newStations);
    localStorage.setItem("s_stations", JSON.stringify(newStations));

    if (isSupabaseConfigured()) {
      try {
        // 1. Delete removed stations
        if (deletedIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('stations')
            .delete()
            .in('id', deletedIds);
          if (deleteError) {
            console.error("Supabase Stations Delete Error:", deleteError);
          }
        }

        // 2. Upsert remaining stations (only if there are stations to upsert)
        if (newStations.length > 0) {
          const cleanStations = newStations.map(({ created_at, ...rest }) => rest);
          const { error: upsertError } = await supabase.from('stations').upsert(cleanStations);
          if (upsertError) {
            console.error("Supabase Stations Upsert Error:", upsertError);
          }
        }
      } catch (err) {
        console.error("Supabase Stations Catch Error:", err);
      }
    }
  };

  const saveMenuItems = async (newMenu) => {
    // Find deleted menu items by comparing previous state with new array
    const currentIds = menuItems.map(item => item.id);
    const newIds = newMenu.map(item => item.id);
    const deletedIds = currentIds.filter(id => !newIds.includes(id));

    setMenuItems(newMenu);
    localStorage.setItem("s_menu", JSON.stringify(newMenu));

    if (isSupabaseConfigured()) {
      try {
        // 1. Delete removed menu items
        if (deletedIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('menu_items')
            .delete()
            .in('id', deletedIds);
          if (deleteError) {
            console.error("Supabase MenuItems Delete Error:", deleteError);
          }
        }

        // 2. Upsert remaining menu items
        if (newMenu.length > 0) {
          const cleanMenu = newMenu.map(({ created_at, ...rest }) => rest);
          const { error: upsertError } = await supabase.from('menu_items').upsert(cleanMenu);
          if (upsertError) {
            console.error("Supabase MenuItems Upsert Error:", upsertError);
          }
        }
      } catch (err) {
        console.error("Supabase MenuItems Catch Error:", err);
      }
    }
  };

  const addOrder = async (order) => {
    const updated = [order, ...orders];
    setOrders(updated);
    localStorage.setItem("s_orders", JSON.stringify(updated));
    if (isSupabaseConfigured()) {
      try {
        const { 
          stationCode, 
          items, 
          onDemandRequests, 
          isFreeGiftAdded, 
          freeGiftProduct, 
          paymentMode, 
          paymentId,
          platform,
          ...restOrder 
        } = order;

        const payload = {
          ...restOrder,
          stationCode: stationCode,
          items: typeof items !== 'string' ? JSON.stringify(items) : items,
          onDemandRequests: typeof onDemandRequests !== 'string' ? JSON.stringify(onDemandRequests) : onDemandRequests,
          isFreeGiftAdded: !!isFreeGiftAdded,
          freeGiftProduct: freeGiftProduct || null,
          paymentMode: paymentMode || 'COD',
          paymentId: paymentId || null,
          platform: platform || null
        };

        const { error } = await supabase.from('orders').insert([payload]);
        if (error) {
          console.error("Supabase Order Insert Error Detail:", error);
        } else if (order.phone) {
          // Automatically upsert customer record in users table upon successful order placement
          const cleanPhone = String(order.phone).replace(/[^\d+]/g, '');
          await supabase.from('users').upsert({
            phone: cleanPhone,
            last_login: new Date().toISOString()
          }, { onConflict: 'phone' });
        }
      } catch (err) {
        console.error("Supabase Order Insert Catch Error:", err);
      }
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
    setOrders(updated);
    localStorage.setItem("s_orders", JSON.stringify(updated));
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('orders').update({ status }).eq('id', orderId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateOrderRider = async (orderId, riderName) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, rider_name: riderName } : o);
    setOrders(updated);
    localStorage.setItem("s_orders", JSON.stringify(updated));
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('orders').update({ rider_name: riderName }).eq('id', orderId);
      } catch (err) {
        console.warn("Failed to update rider in Supabase. Make sure rider_name column exists:", err);
      }
    }
  };

  const updateOnDemandStatus = async (orderId, reqIndex, status) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        const reqs = [...o.onDemandRequests];
        reqs[reqIndex] = { ...reqs[reqIndex], status };
        return { ...o, onDemandRequests: reqs };
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem("s_orders", JSON.stringify(updated));
    if (isSupabaseConfigured()) {
      try {
        const targetOrder = updated.find(o => o.id === orderId);
        if (targetOrder) {
          await supabase.from('orders').update({ onDemandRequests: targetOrder.onDemandRequests }).eq('id', orderId);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const loginUser = async (phone) => {
    const cleanPhone = String(phone).replace(/[^\d+]/g, '');
    setCurrentUser(cleanPhone);
    localStorage.setItem("s_user", JSON.stringify(cleanPhone));
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('users').upsert({
          phone: cleanPhone,
          last_login: new Date().toISOString()
        }, { onConflict: 'phone' });
        if (error) {
          console.error("Supabase User Upsert Error:", error);
        }
      } catch (err) {
        console.error("Supabase User Upsert Catch Error:", err);
      }
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem("s_user");
  };

  const updateFreeProduct = async (prod) => {
    setFreeProduct(prod);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert([{ key: 'free_product', value: prod }]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateCodPolicy = async (val) => {
    setCodPolicy(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert([{ key: 'cod_policy', value: val }]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateCodCutoffHour = async (val) => {
    const hr = Number(val);
    setCodCutoffHour(hr);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert([{ key: 'cod_cutoff_hour', value: String(hr) }]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateAvailableStates = async (newStates) => {
    setAvailableStates(newStates);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert([{ key: 'available_states', value: JSON.stringify(newStates) }]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const addAvailableState = (stateName) => {
    const trimmed = stateName.trim();
    if (!trimmed) return;
    if (availableStates.includes(trimmed)) return;
    updateAvailableStates([...availableStates, trimmed]);
  };

  const removeAvailableState = (stateName) => {
    updateAvailableStates(availableStates.filter(s => s !== stateName));
  };

  const renameAvailableState = (oldName, newName) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedNew === oldName) return;
    updateAvailableStates(availableStates.map(s => s === oldName ? trimmedNew : s));
  };

  const updateSupportPhone = async (newValue) => {
    const val = String(newValue).trim();
    setSupportPhone(val);
    try {
      if (isSupabaseConfigured()) {
        await supabase.from('config').upsert({ key: 'support_phone', value: val }, { onConflict: 'key' });
      }
    } catch (e) {
      console.warn("Failed to save support phone in Supabase:", e);
    }
  };

  const updateSupportEmail = async (newValue) => {
    const val = String(newValue).trim();
    setSupportEmail(val);
    try {
      if (isSupabaseConfigured()) {
        await supabase.from('config').upsert({ key: 'support_email', value: val }, { onConflict: 'key' });
      }
    } catch (e) {
      console.warn("Failed to save support email in Supabase:", e);
    }
  };

  const updateSupportContacts = async (newList) => {
    setSupportContacts(newList);
    try {
      if (isSupabaseConfigured()) {
        await supabase.from('config').upsert({ key: 'hq_support_contacts', value: JSON.stringify(newList) }, { onConflict: 'key' });
      }
    } catch (e) {
      console.warn("Failed to save support contacts in Supabase:", e);
    }
  };

  const updateDeliveryCharge = async (newValue) => {
    const val = Number(newValue) || 0;
    setDeliveryCharge(val);
    try {
      if (isSupabaseConfigured()) {
        await supabase.from('config').upsert({ key: 'delivery_charge', value: String(val) }, { onConflict: 'key' });
      }
    } catch (e) {
      console.warn("Failed to save delivery charge in Supabase:", e);
    }
  };

  const updateGiftThreshold = async (newValue) => {
    const val = Number(newValue) || 0;
    setGiftThreshold(val);
    try {
      if (isSupabaseConfigured()) {
        await supabase.from('config').upsert({ key: 'gift_threshold', value: String(val) }, { onConflict: 'key' });
      }
    } catch (e) {
      console.warn("Failed to save gift threshold in Supabase:", e);
    }
  };

  const addCategory = async (name, stationCode = 'ALL') => {
    if (!name) return;
    const code = (stationCode || 'ALL').toUpperCase();
    const exists = categories.some(c => (c.name || '').toLowerCase() === name.toLowerCase() && (c.station_code || 'ALL').toUpperCase() === code);
    if (exists) return;
    
    const newCat = { name, station_code: code };
    const updated = [...categories, newCat];
    setCategories(updated);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('categories').insert([newCat]);
      } catch (e) {
        console.error("Error inserting category:", e);
      }
    }
  };

  const removeCategory = async (name, stationCode = 'ALL') => {
    const code = (stationCode || 'ALL').toUpperCase();
    const legacyName = `${code}:${name}`;

    const updatedCats = categories.filter(c => {
      const matchExact = (c.name || '').toLowerCase() === name.toLowerCase() && (c.station_code || 'ALL').toUpperCase() === code;
      const matchLegacy = c.name && c.name.includes(':') && c.name.split(':')[1].toLowerCase() === name.toLowerCase() && c.name.split(':')[0].toUpperCase() === code;
      return !(matchExact || matchLegacy);
    });
    setCategories(updatedCats);

    const updatedMenu = menuItems.map(item => {
      const isThisStation = item.station_code && item.station_code.toUpperCase() === code;
      const matchesCategory = item.category === name || item.category === legacyName;
      if (isThisStation && matchesCategory) {
        return { ...item, category: 'Uncategorized' };
      }
      return item;
    });
    setMenuItems(updatedMenu);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('categories').delete().eq('name', name).eq('station_code', code);
        await supabase.from('categories').delete().eq('name', legacyName);

        await supabase.from('menu_items').update({ category: 'Uncategorized' }).eq('category', name).eq('station_code', code);
        await supabase.from('menu_items').update({ category: 'Uncategorized' }).eq('category', legacyName).eq('station_code', code);
      } catch (e) {
        console.error("Error deleting category and updating items:", e);
      }
    }
  };

  const updateCategory = async (oldName, newName, stationCode = 'ALL') => {
    if (!newName) return;
    const code = (stationCode || 'ALL').toUpperCase();
    const exists = categories.some(c => (c.name || '').toLowerCase() === newName.toLowerCase() && (c.station_code || 'ALL').toUpperCase() === code);
    if (exists) return;
    
    const updated = categories.map(c => {
      const matchExact = (c.name || '').toLowerCase() === oldName.toLowerCase() && (c.station_code || 'ALL').toUpperCase() === code;
      const matchLegacy = c.name && c.name.includes(':') && c.name.split(':')[1].toLowerCase() === oldName.toLowerCase() && c.name.split(':')[0].toUpperCase() === code;
      if (matchExact || matchLegacy) {
        return { ...c, name: newName };
      }
      return c;
    });
    setCategories(updated);
    if (isSupabaseConfigured()) {
      try {
        // Try update clean schema format
        await supabase.from('categories').update({ name: newName }).eq('name', oldName).eq('station_code', code);
        // Fallback: update legacy prefix format
        const legacyOldName = `${code}:${oldName}`;
        const legacyNewName = `${code}:${newName}`;
        await supabase.from('categories').update({ name: legacyNewName }).eq('name', legacyOldName);
      } catch (e) {
        console.error("Error updating category:", e);
      }
    }
  };

  // Dynamically compute disableCod based on selected policy
  const disableCod = codPolicy === 'always_disable' ||
    (codPolicy === 'disable_after_hour' && new Date().getHours() >= Number(codCutoffHour));

  return (
    <AppContext.Provider value={{
      stations,
      setStations: saveStations,
      menuItems,
      setMenuItems: saveMenuItems,
      orders,
      addOrder,
      updateOrderStatus,
      updateOrderRider,
      updateOnDemandStatus,
      currentUser,
      loginUser,
      logoutUser,
      freeProduct,
      updateFreeProduct,
      disableCod,
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
      updateCategory
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
