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
  const [homepageHeroDesktop, setHomepageHeroDesktop] = useState("/herobanner.png");
  const [homepageHeroMobile, setHomepageHeroMobile] = useState("/vande_bharat.png");
  const [homepageShowcase1, setHomepageShowcase1] = useState("/vande_bharat.png");
  const [homepageShowcase2, setHomepageShowcase2] = useState("/train_food_delivery.png");
  const [homepagePopularDishes, setHomepagePopularDishes] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem("s_homepage_popular_dishes");
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [socialInstagram, setSocialInstagram] = useState("https://instagram.com");
  const [socialFacebook, setSocialFacebook] = useState("https://facebook.com");
  const [socialTwitter, setSocialTwitter] = useState("https://twitter.com");
  const [statsPassengers, setStatsPassengers] = useState("5k+");
  const [statsEateries, setStatsEateries] = useState("80+");
  const [statsRating, setStatsRating] = useState("4.8");
  const [statsJunctions, setStatsJunctions] = useState("");
  const [homepageLogo, setHomepageLogo] = useState("/logo.png");
  const [homepageLogoWhite, setHomepageLogoWhite] = useState("/logo-white.png");
  const [loading, setLoading] = useState(true);
  const [globalOverrides, setGlobalOverrides] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem("s_global_overrides");
        return local ? JSON.parse(local) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

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
          // Fetch critical menu & category data in parallel first
          const [
            stationsDataRes,
            menuDataRes,
            categoriesDataRes,
            overridesDataRes,
            statesDataRes
          ] = await Promise.all([
            supabase.from('stations').select('*'),
            supabase.from('menu_items').select('*'),
            supabase.from('categories').select('*'),
            supabase.from('global_item_overrides').select('*'),
            supabase.from('states').select('*')
          ]);

          if (stationsDataRes.data) {
            setStations(stationsDataRes.data.map(s => ({ ...s, buffer_minutes: Number(s.buffer_minutes) || 60 })));
          }
          if (menuDataRes.data) {
            setMenuItems(menuDataRes.data.map(item => ({ ...item, price: Number(item.price), mrp: Number(item.mrp) })));
          }
          if (categoriesDataRes.data) {
            setCategories(categoriesDataRes.data);
          }
          if (statesDataRes && statesDataRes.data) {
            const loadedStates = statesDataRes.data.map(s => s.name);
            setAvailableStates(loadedStates);
          }
          if (overridesDataRes && overridesDataRes.data && !overridesDataRes.error) {
            setGlobalOverrides(overridesDataRes.data);
            localStorage.setItem("s_global_overrides", JSON.stringify(overridesDataRes.data));
          }
          // Note: If global_item_overrides table doesn't exist yet, overrides fall back to localStorage

          // Toggle loading off immediately after critical data is loaded!
          setLoading(false);

          // Fetch other configurations asynchronously in the background
          Promise.all([
            supabase.from('orders').select('*').order('created_at', { ascending: false }),
            supabase.from('config').select('*')
          ]).then(([ordersRes, configRes]) => {
            if (ordersRes.data) {
              setOrders(ordersRes.data.map(parseOrderObj));
            }
            if (configRes.data) {
              configRes.data.forEach(cfg => {
                switch (cfg.key) {
                  case 'free_product': setFreeProduct(cfg.value); break;
                  case 'cod_policy': setCodPolicy(cfg.value); break;
                  case 'cod_cutoff_hour': setCodCutoffHour(Number(cfg.value)); break;
                  case 'delivery_charge': setDeliveryCharge(Number(cfg.value)); break;
                  case 'gift_threshold': setGiftThreshold(Number(cfg.value)); break;
                  case 'support_phone': setSupportPhone(cfg.value); break;
                  case 'support_email': setSupportEmail(cfg.value); break;
                  case 'homepage_hero_desktop': setHomepageHeroDesktop(cfg.value); break;
                  case 'homepage_hero_mobile': setHomepageHeroMobile(cfg.value); break;
                  case 'homepage_showcase_1': setHomepageShowcase1(cfg.value); break;
                  case 'homepage_showcase_2': setHomepageShowcase2(cfg.value); break;
                  case 'social_instagram': setSocialInstagram(cfg.value); break;
                  case 'social_facebook': setSocialFacebook(cfg.value); break;
                  case 'social_twitter': setSocialTwitter(cfg.value); break;
                  case 'stats_passengers': setStatsPassengers(cfg.value); break;
                  case 'stats_eateries': setStatsEateries(cfg.value); break;
                  case 'stats_rating': setStatsRating(cfg.value); break;
                  case 'stats_junctions': setStatsJunctions(cfg.value); break;
                  case 'homepage_logo': setHomepageLogo(cfg.value); break;
                  case 'homepage_logo_white': setHomepageLogoWhite(cfg.value); break;
                  case 'homepage_popular_dishes':
                    try {
                      const parsed = JSON.parse(cfg.value);
                      setHomepagePopularDishes(parsed);
                      localStorage.setItem("s_homepage_popular_dishes", JSON.stringify(parsed));
                    } catch (e) { }
                    break;

                  case 'hq_support_contacts':
                    try { setSupportContacts(JSON.parse(cfg.value)); } catch (e) { }
                    break;
                }
              });
            }
          }).catch(err => console.warn("Background config fetch failed:", err));

        } catch (err) {
          console.warn("Supabase load fallback:", err);
          setLoading(false);
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

  const updateHomepageHeroDesktop = async (val) => {
    setHomepageHeroDesktop(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'homepage_hero_desktop', value: val }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateHomepageHeroMobile = async (val) => {
    setHomepageHeroMobile(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'homepage_hero_mobile', value: val }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateHomepageShowcase1 = async (val) => {
    setHomepageShowcase1(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'homepage_showcase_1', value: val }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateHomepageShowcase2 = async (val) => {
    setHomepageShowcase2(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'homepage_showcase_2', value: val }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateHomepagePopularDishes = async (val) => {
    setHomepagePopularDishes(val);
    localStorage.setItem("s_homepage_popular_dishes", JSON.stringify(val));
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'homepage_popular_dishes', value: JSON.stringify(val) }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateSocialInstagram = async (val) => {
    setSocialInstagram(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'social_instagram', value: val }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateSocialFacebook = async (val) => {
    setSocialFacebook(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'social_facebook', value: val }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateSocialTwitter = async (val) => {
    setSocialTwitter(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'social_twitter', value: val }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateStatsPassengers = async (val) => {
    setStatsPassengers(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'stats_passengers', value: val }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateStatsEateries = async (val) => {
    setStatsEateries(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'stats_eateries', value: val }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateStatsRating = async (val) => {
    setStatsRating(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'stats_rating', value: val }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateStatsJunctions = async (val) => {
    setStatsJunctions(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'stats_junctions', value: val }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateHomepageLogo = async (val) => {
    setHomepageLogo(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'homepage_logo', value: val }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateHomepageLogoWhite = async (val) => {
    setHomepageLogoWhite(val);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('config').upsert({ key: 'homepage_logo_white', value: val }, { onConflict: 'key' });
      } catch (err) {
        console.error(err);
      }
    }
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

  const addAvailableState = async (stateName) => {
    const trimmed = stateName.trim();
    if (!trimmed) return;
    if (availableStates.includes(trimmed)) return;

    const updated = [...availableStates, trimmed];
    setAvailableStates(updated);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('states').insert([{ name: trimmed }]);
        if (error) {
          console.error("Error adding state to DB:", error);
        }
      } catch (err) {
        console.error("Error adding state to DB catch:", err);
      }
    }
  };

  const removeAvailableState = async (stateName) => {
    const updated = availableStates.filter(s => s !== stateName);
    setAvailableStates(updated);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('states').delete().eq('name', stateName);
        if (error) {
          console.error("Error deleting state from DB:", error);
        }
      } catch (err) {
        console.error("Error deleting state from DB catch:", err);
      }
    }
  };

  const renameAvailableState = async (oldName, newName) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedNew === oldName) return;

    const updated = availableStates.map(s => s === oldName ? trimmedNew : s);
    setAvailableStates(updated);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('states').update({ name: trimmedNew }).eq('name', oldName);
        if (error) {
          console.error("Error renaming state in DB:", error);
        }
      } catch (err) {
        console.error("Error renaming state in DB catch:", err);
      }
    }
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

  const addCategory = async (name, stationCode = 'ALL', image = '') => {
    const code = (stationCode || 'ALL').toUpperCase();
    const exists = categories.some(c => (c.name || '').toLowerCase() === name.toLowerCase() && (c.station_code || 'ALL').toUpperCase() === code);
    if (exists) return;

    const newCat = { name, station_code: code, image };
    const updated = [...categories, newCat];
    setCategories(updated);
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('categories').insert([newCat]);
        if (error) {
          console.error("Supabase insert category error:", error);
          alert("Database insert error: " + error.message);
        }
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

  const updateCategory = async (oldName, newName, stationCode = 'ALL', image = null) => {
    if (!newName) return;
    const code = (stationCode || 'ALL').toUpperCase();

    const getCleanName = (n) => {
      if (!n) return '';
      return n.includes(':') ? n.split(':')[1] : n;
    };

    const cleanOldName = getCleanName(oldName);
    const cleanNewName = getCleanName(newName);
    const legacyOldName = `${code}:${cleanOldName}`;

    // 1. Update categories in local state
    const updatedCats = categories.map(c => {
      const cClean = getCleanName(c.name).toLowerCase();
      const match = cClean === cleanOldName.toLowerCase() && (c.station_code || 'ALL').toUpperCase() === code;
      if (match) {
        const newObj = { ...c, name: newName };
        if (image !== null) newObj.image = image;
        return newObj;
      }
      return c;
    });
    setCategories(updatedCats);

    // 2. Update menuItems category reference in local state
    const updatedMenu = menuItems.map(item => {
      const isThisStation = (item.station_code || 'ALL').toUpperCase() === code;
      const itemCleanCat = getCleanName(item.category).toLowerCase();
      if (isThisStation && (item.category === oldName || itemCleanCat === cleanOldName.toLowerCase() || item.category === legacyOldName)) {
        return { ...item, category: newName };
      }
      return item;
    });
    setMenuItems(updatedMenu);

    // 3. Database operations
    if (isSupabaseConfigured()) {
      try {
        const updatePayload = { name: newName };
        if (image !== null) updatePayload.image = image;

        // Update in categories table
        await supabase.from('categories').update(updatePayload).eq('name', oldName).eq('station_code', code);
        await supabase.from('categories').update(updatePayload).eq('name', cleanOldName).eq('station_code', code);
        await supabase.from('categories').update(updatePayload).eq('name', legacyOldName);

        // Update in menu_items table
        await supabase.from('menu_items').update({ category: newName }).eq('category', oldName).eq('station_code', code);
        await supabase.from('menu_items').update({ category: newName }).eq('category', cleanOldName).eq('station_code', code);
        await supabase.from('menu_items').update({ category: newName }).eq('category', legacyOldName).eq('station_code', code);

      } catch (e) {
        console.error("Error updating category details:", e);
      }
    }
  };

  // ─── Global Item Overrides ────────────────────────────────────────────────
  // toggleGlobalItemAvailability: Station admins can toggle global items on/off
  // for their own station without editing the master record.
  const toggleGlobalItemAvailability = async (itemId, stationCode, available) => {
    const code = String(stationCode).toUpperCase();
    const itemStr = String(itemId);

    setGlobalOverrides(prev => {
      const existingIdx = prev.findIndex(
        o => String(o.item_id) === itemStr && String(o.station_code).toUpperCase() === code
      );
      let updated;
      if (existingIdx !== -1) {
        updated = prev.map((o, i) => i === existingIdx ? { ...o, available } : o);
      } else {
        updated = [...prev, { item_id: itemStr, station_code: code, available }];
      }
      localStorage.setItem('s_global_overrides', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      try {
        const { data: existingRows } = await supabase
          .from('global_item_overrides')
          .select('*')
          .eq('item_id', itemStr)
          .eq('station_code', code);
        if (existingRows && existingRows.length > 0) {
          await supabase.from('global_item_overrides').update({ available }).eq('item_id', itemStr).eq('station_code', code);
        } else {
          await supabase.from('global_item_overrides').insert([{ item_id: itemStr, station_code: code, available }]);
        }
      } catch (e) {
        console.error('Error saving global item override:', e);
      }
    }
  };

  // resolveItemAvailability: Returns effective availability of a menu item for a station.
  // Global items (station_code = 'ALL') check for a station-specific override first.
  const resolveItemAvailability = (item, stationCode) => {
    if (!item.station_code || item.station_code.toUpperCase() !== 'ALL') {
      return item.available !== false;
    }
    const code = String(stationCode || '').toUpperCase();
    const override = globalOverrides.find(
      o => String(o.item_id) === String(item.id) && String(o.station_code).toUpperCase() === code
    );
    if (override !== undefined) return override.available !== false;
    return item.available !== false;
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
      updateCategory,
      homepageHeroDesktop,
      updateHomepageHeroDesktop,
      homepageHeroMobile,
      updateHomepageHeroMobile,
      homepageShowcase1,
      updateHomepageShowcase1,
      homepageShowcase2,
      updateHomepageShowcase2,
      homepagePopularDishes,
      updateHomepagePopularDishes,
      socialInstagram,
      updateSocialInstagram,
      socialFacebook,
      updateSocialFacebook,
      socialTwitter,
      updateSocialTwitter,
      statsPassengers,
      updateStatsPassengers,
      statsEateries,
      updateStatsEateries,
      statsRating,
      updateStatsRating,
      statsJunctions,
      updateStatsJunctions,
      homepageLogo,
      updateHomepageLogo,
      homepageLogoWhite,
      updateHomepageLogoWhite,
      globalOverrides,
      toggleGlobalItemAvailability,
      resolveItemAvailability,
      loading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
