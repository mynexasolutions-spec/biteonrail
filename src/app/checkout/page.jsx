"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, isFirebaseConfigured } from '../../lib/firebase';
import { Phone, CheckCircle, Clock, CreditCard, Gift, AlertCircle, Coins, User, Train, MapPin, ArrowRight, ArrowLeft, Lock, Ticket, ClipboardList } from 'lucide-react';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stationCode = searchParams.get('station') || '';
  const pnrParam = searchParams.get('pnr') || '';

  const { addOrder, loginUser, currentUser, freeProduct, disableCod, codPolicy, codCutoffHour, stations, deliveryCharge, giftThreshold } = useApp();

  const [subtotal, setSubtotal] = useState(0);
  const [delivery, setDelivery] = useState(deliveryCharge || 30);
  const [total, setTotal] = useState(0);
  const [cart, setCart] = useState([]);
  const [onDemand, setOnDemand] = useState([]);
  // Form states
  const [pnr, setPnr] = useState(pnrParam);
  const [phone, setPhone] = useState('');
  const [seat, setSeat] = useState('');
  const [coach, setCoach] = useState('');
  const [paymentMode, setPaymentMode] = useState('online');
  const [isClosed, setIsClosed] = useState(false);
  const [customMgetRequest, setCustomMgetRequest] = useState('');
  const [liveDelay, setLiveDelay] = useState(null);
  const [calculatedArrTime, setCalculatedArrTime] = useState('');
  const [trackingTimeline, setTrackingTimeline] = useState(null);
  const [fullTrackingData, setFullTrackingData] = useState(null);
  const [showTestFields, setShowTestFields] = useState(false);
  const [dojVal, setDojVal] = useState('');
  const getParam = (key) => {
    const val = searchParams.get(key);
    return val && val.trim() !== '' ? val : null;
  };

  const [arrTimeVal, setArrTimeVal] = useState(getParam('arrTime') || '');
  const [trainNameVal, setTrainNameVal] = useState(getParam('trainName') || '');
  const [trainNumberVal, setTrainNumberVal] = useState(getParam('trainNumber') || '');

  // OTP flow states
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isManualTracking, setIsManualTracking] = useState(false);
  const [mobileStep, setMobileStep] = useState(1); // 1 = passenger info, 2 = bill + payment

  const handleManualTrack = async () => {
    if (!trainNumberVal) {
      alert("Please enter a valid Train Number first!");
      return;
    }
    const activeStation = stationCode || localStorage.getItem("selected_station_code") || '';
    if (!activeStation) {
      alert("No active delivery station hub selected!");
      return;
    }

    try {
      setIsManualTracking(true);
      const { getLiveTrainDelay, getPnrStatus } = await import('../../lib/pnr');
      const dateParam = dojVal ? (() => {
        try {
          let parsedDOJ = null;
          if (dojVal.includes('-')) {
            const parts = dojVal.split('-');
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                parsedDOJ = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              } else {
                parsedDOJ = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
              }
            }
          }
          if (!parsedDOJ || isNaN(parsedDOJ.getTime())) {
            parsedDOJ = new Date(dojVal);
          }
          if (parsedDOJ && !isNaN(parsedDOJ.getTime())) {
            const mm = String(parsedDOJ.getMonth() + 1).padStart(2, '0');
            const dd = String(parsedDOJ.getDate()).padStart(2, '0');
            const yyyy = parsedDOJ.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
          }
        } catch (e) { }
        return 'today';
      })() : 'today';

      const delayData = await getLiveTrainDelay(trainNumberVal, dateParam, activeStation);
      if (delayData) {
        setLiveDelay(delayData);
        if (delayData.actualTime && delayData.actualTime !== '--:--') {
          setCalculatedArrTime(delayData.actualTime);
          localStorage.setItem("checkout_arr_time", delayData.actualTime);
        }
      }

      const res = await fetch(`/api/track-train?trainNo=${trainNumberVal}&date=${dateParam}`);
      const resData = await res.json();
      if (resData.success && resData.data) {
        setTrackingTimeline(resData.data.timeline || resData.data.stations || null);
        setFullTrackingData(resData.data);
      }
      alert(`Success! Live track status for Train #${trainNumberVal} updated successfully.`);
    } catch (err) {
      console.warn("Manual track error:", err);
      alert("Tracking failed: " + err.message);
    } finally {
      setIsManualTracking(false);
    }
  };

  const getClosedReason = () => {
    const code = stationCode || (typeof window !== 'undefined' ? localStorage.getItem("selected_station_code") : '') || '';
    if (code && stations?.length > 0) {
      const matched = stations.find(s => s.code.toLowerCase() === code.toLowerCase());
      if (matched) {
        if (matched.is_active === false) {
          return "Kitchen Suspended: Sorry, food ordering is temporarily suspended by the kitchen manager at this station.";
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        const openTime = matched.open_time || '00:00';
        const closeTime = matched.close_time || '23:59';

        const isTimeInWindow = (current, open, close) => {
          if (open === close) return true;
          if (open < close) {
            return current >= open && current <= close;
          } else {
            return current >= open || current <= close;
          }
        };

        if (!isTimeInWindow(currentTimeStr, openTime, closeTime)) {
          return `Closed Hours: Sorry, the kitchen at this station operates between ${openTime} and ${closeTime}. Current time is outside operation hours.`;
        }
      }
    }
    return "Delivery Cutoff Reached: Sorry, food ordering has been closed for this station hub because the train is arriving soon (or has already passed). You cannot proceed with this booking.";
  };

  // Disable COD if the policy is active
  useEffect(() => {
    if (disableCod) {
      setPaymentMode('online');
    }
  }, [disableCod]);

  // Sync dynamic delivery charge from context and update state & grand total
  useEffect(() => {
    const charge = Number(deliveryCharge) || 0;
    setDelivery(charge);
    setTotal(subtotal + charge);
  }, [deliveryCharge, subtotal]);

  // Load cart data from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("s_cart");
    const savedSubtotal = localStorage.getItem("checkout_subtotal");
    const savedOndemand = localStorage.getItem("checkout_ondemand");

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.warn("Failed to parse saved cart:", e);
      }
    }
    if (savedSubtotal) {
      const sub = Number(savedSubtotal);
      setSubtotal(sub);
    }
    if (savedOndemand) {
      try {
        setOnDemand(JSON.parse(savedOndemand));
      } catch (e) {
        console.warn("Failed to parse saved ondemand:", e);
      }
    }

    // Autofill coach & seat if selected on the homepage
    const savedCoach = localStorage.getItem("selected_coach");
    const savedSeat = localStorage.getItem("selected_seat");
    if (savedCoach) setCoach(savedCoach.toUpperCase());
    if (savedSeat) setSeat(savedSeat.toUpperCase());

    // Read details from localStorage on mount (client-side only) to prevent hydration mismatches
    const savedTime = localStorage.getItem("checkout_arr_time") || '';
    const savedName = localStorage.getItem("checkout_train_name") || '';
    const savedNum = localStorage.getItem("checkout_train_number") || '';

    if (savedTime && !arrTimeVal) {
      setArrTimeVal(savedTime);
      setCalculatedArrTime(savedTime);
    } else if (arrTimeVal) {
      setCalculatedArrTime(arrTimeVal);
    }

    if (savedName && !trainNameVal) {
      setTrainNameVal(savedName);
    }
    if (savedNum && !trainNumberVal) {
      setTrainNumberVal(savedNum);
    }
    // Autofill registered user phone if logged in
    if (currentUser) {
      setPhone(currentUser);
    }

    const savedDoj = localStorage.getItem("checkout_doj") || '';
    if (savedDoj) {
      setDojVal(savedDoj);
    }
  }, [currentUser]);

  // Auto-detect coach, seat, and delay details from PNR status check
  useEffect(() => {
    if (pnr && pnr.length === 10) {
      const fetchAndSetPnrDetails = async () => {
        try {
          const { getPnrStatus, parsePnrData, getLiveTrainDelay } = await import('../../lib/pnr');
          const status = await getPnrStatus(pnr);
          const parsed = await parsePnrData(status);
          if (parsed) {
            if (parsed.passengers?.length > 0) {
              setCoach((parsed.passengers[0].coach || '').toUpperCase());
              setSeat((parsed.passengers[0].seat || '').toUpperCase());
            }

            let currentTrainNo = trainNumberVal;
            if (parsed.trainNumber) {
              currentTrainNo = parsed.trainNumber;
              setTrainNumberVal(parsed.trainNumber);
              localStorage.setItem("checkout_train_number", parsed.trainNumber);
            }
            if (parsed.trainName) {
              setTrainNameVal(parsed.trainName);
              localStorage.setItem("checkout_train_name", parsed.trainName);
            }
            if (parsed.dateOfJourney) {
              localStorage.setItem("checkout_doj", parsed.dateOfJourney);
            }

            // Immediately fetch live delay status using the resolved train number & date of journey only if TODAY
            const activeStation = stationCode || localStorage.getItem("selected_station_code") || '';
            if (currentTrainNo && activeStation) {
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
                return true;
              })() : true;

              if (isTodayJourney) {
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

                const delayData = await getLiveTrainDelay(currentTrainNo, dateParam, activeStation);
                if (delayData) {
                  setLiveDelay(delayData);
                  if (delayData.actualTime && delayData.actualTime !== '--:--') {
                    setCalculatedArrTime(delayData.actualTime);
                    localStorage.setItem("checkout_arr_time", delayData.actualTime);
                  }
                }
                // Immediately fetch full routing timeline
                fetch(`/api/track-train?trainNo=${currentTrainNo}&date=${dateParam}`)
                  .then(r => r.json())
                  .then(resData => {
                    if (resData.success && resData.data) {
                      setTrackingTimeline(resData.data.timeline || resData.data.stations || null);
                      setFullTrackingData(resData.data);
                    }
                  }).catch(e => console.warn("Timeline fetch failed:", e));
              }
            }
          }
        } catch (err) {
          console.warn("PNR auto-fill check failed:", err);
        }
      };
      fetchAndSetPnrDetails();
    }
  }, [pnr]);

  // Fetch live delay information only for non-PNR flow (direct search station)
  useEffect(() => {
    if (pnr) return; // Skip since PNR flow handles delay inside its own block
    const activeStation = stationCode || localStorage.getItem("selected_station_code") || '';
    if (trainNumberVal && activeStation) {
      const fetchDelay = async () => {
        try {
          const { getLiveTrainDelay } = await import('../../lib/pnr');
          const dateParam = dojVal ? (() => {
            try {
              let parsedDOJ = null;
              if (dojVal.includes('-')) {
                const parts = dojVal.split('-');
                if (parts.length === 3) {
                  if (parts[0].length === 4) {
                    parsedDOJ = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                  } else {
                    parsedDOJ = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                  }
                }
              }
              if (!parsedDOJ || isNaN(parsedDOJ.getTime())) {
                parsedDOJ = new Date(dojVal);
              }
              if (parsedDOJ && !isNaN(parsedDOJ.getTime())) {
                const mm = String(parsedDOJ.getMonth() + 1).padStart(2, '0');
                const dd = String(parsedDOJ.getDate()).padStart(2, '0');
                const yyyy = parsedDOJ.getFullYear();
                return `${dd}-${mm}-${yyyy}`;
              }
            } catch (e) { }
            return 'today';
          })() : 'today';

          const delayData = await getLiveTrainDelay(trainNumberVal, dateParam, activeStation);
          if (delayData) {
            setLiveDelay(delayData);
            if (delayData.actualTime && delayData.actualTime !== '--:--') {
              setCalculatedArrTime(delayData.actualTime);
              localStorage.setItem("checkout_arr_time", delayData.actualTime);
            }
          }
          // Fetch full routing timeline
          fetch(`/api/track-train?trainNo=${trainNumberVal}&date=${dateParam}`)
            .then(r => r.json())
            .then(resData => {
              if (resData.success && resData.data) {
                setTrackingTimeline(resData.data.timeline || resData.data.stations || null);
                setFullTrackingData(resData.data);
              }
            }).catch(e => console.warn("Timeline fetch failed in effect:", e));
        } catch (err) {
          console.warn("Failed to fetch live delay in effect:", err);
        }
      };
      fetchDelay();
    }
  }, [trainNumberVal, stationCode, pnr, dojVal]);

  // Check station cutoff buffer time and status on checkout
  useEffect(() => {
    const code = stationCode || localStorage.getItem("selected_station_code") || '';
    if (code && stations?.length > 0) {
      const matchedStation = stations.find(s => s.code.toLowerCase() === code.toLowerCase());
      const targetTime = calculatedArrTime || arrTimeVal;
      if (matchedStation) {
        // 1. Check if the station is suspended/inactive
        if (matchedStation.is_active === false) {
          setIsClosed(true);
          return;
        }

        // 2. Check if the current time is within open_time and close_time
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

        const openTime = matchedStation.open_time || '00:00';
        const closeTime = matchedStation.close_time || '23:59';

        const isTimeInWindow = (current, open, close) => {
          if (open === close) return true;
          if (open < close) {
            return current >= open && current <= close;
          } else {
            // Overnight window (e.g. 10:00 AM to 02:00 AM next day)
            return current >= open || current <= close;
          }
        };

        if (!isTimeInWindow(currentTimeStr, openTime, closeTime)) {
          setIsClosed(true);
          return;
        }

        // 3. Cutoff buffer check
        if (targetTime) {
          const bufferLimit = matchedStation.buffer_minutes || 60;
          const isBookingClosed = (arrivalTimeStr, bufferVal) => {
            if (!arrivalTimeStr || arrivalTimeStr === '--:--') return false;
            try {
              const [arrHrs, arrMins] = arrivalTimeStr.split(':').map(Number);
              let arrDate = new Date();
              const savedDoj = typeof window !== 'undefined' ? localStorage.getItem("checkout_doj") : '';
              if (savedDoj) {
                let parsedDOJ = null;
                if (savedDoj.includes('-')) {
                  const parts = savedDoj.split('-');
                  if (parts.length === 3) {
                    if (parts[0].length === 4) {
                      parsedDOJ = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                    } else {
                      parsedDOJ = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                    }
                  }
                }
                if (!parsedDOJ || isNaN(parsedDOJ.getTime())) {
                  parsedDOJ = new Date(savedDoj);
                }
                if (parsedDOJ && !isNaN(parsedDOJ.getTime())) {
                  arrDate = parsedDOJ;
                }
              }
              arrDate.setHours(arrHrs, arrMins, 0, 0);
              const diffMs = arrDate.getTime() - now.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              return diffMins < bufferVal;
            } catch (e) {
              return false;
            }
          };

          if (isBookingClosed(targetTime, bufferLimit)) {
            setIsClosed(true);
            return;
          }
        }
        setIsClosed(false);
      }
    }
  }, [stationCode, stations, calculatedArrTime, arrTimeVal]);

  const handlePlaceOrderSubmit = async (e) => {
    if (e) e.preventDefault();

    if (isClosed) {
      alert("Ordering has been closed for this station because the train is scheduled to arrive soon.");
      return;
    }

    if (phone.length < 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    if (pnr.length < 10) {
      alert("Please enter a valid 10-digit PNR");
      return;
    }

    if (currentUser && currentUser === phone) {
      if (mobileStep === 1) {
        setMobileStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        processOrderPlacement();
      }
      return;
    }

    setIsVerifying(true);
    // Bypass Firebase phone authentication and use local mock OTP (123456)
    setConfirmationResult(null);
    setOtpSent(true);
    setIsVerifying(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsVerifying(true);

    const onOtpVerified = () => {
      loginUser(phone);
      if (mobileStep === 1) {
        setOtpSent(false);
        setMobileStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsVerifying(false);
      } else {
        processOrderPlacement();
      }
    };

    if (confirmationResult) {
      try {
        const result = await confirmationResult.confirm(otp);
        onOtpVerified();
      } catch (err) {
        console.error("OTP Verification Error:", err);
        alert('Invalid OTP. Please check the code and try again.');
        setIsVerifying(false);
      }
    } else {
      if (otp === '123456' || otp.length === 6) {
        setTimeout(() => {
          onOtpVerified();
        }, 1000);
      } else {
        alert("Incorrect OTP. Enter the test OTP: 123456");
        setIsVerifying(false);
      }
    }
  };

  const processOrderPlacement = async () => {
    if (paymentMode === 'online') {
      setIsVerifying(true);
      // If no key in env, use standard Razorpay Test Key so it opens in Test Mode
      const razorpayKeyId = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.trim() !== '')
        ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        : 'rzp_test_5HwKNuLq7S2c2e'; // Standard public test key fallback for local testing

      const loaded = await loadRazorpay();
      if (!loaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setIsVerifying(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: Math.round(total * 100),
        currency: 'INR',
        name: 'BiteOnRail',
        description: 'Food Delivery at Berth - Station: ' + stationCode,
        handler: function (response) {
          finalizeOrder(response.razorpay_payment_id);
        },
        prefill: {
          contact: '+91' + phone,
          email: 'passenger@saferail.in',
        },
        theme: {
          color: '#e11d48',
        },
        modal: {
          ondismiss: function () {
            setIsVerifying(false);
          }
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          alert('Payment failed: ' + response.error.description);
          setIsVerifying(false);
        });
        rzp.open();
      } catch (err) {
        console.error('Razorpay initiation failed:', err);
        alert('Razorpay checkout failed to launch. Proceeding with COD flow.');
        setIsVerifying(false);
      }
    } else {
      finalizeOrder('COD');
    }
  };

  const finalizeOrder = (paymentId) => {
    const isFreeGiftAdded = subtotal >= (giftThreshold || 300);

    const finalOnDemand = [
      ...onDemand,
      ...(customMgetRequest.trim() ? [{ name: `Custom MRP Request: ${customMgetRequest}`, price: 0, status: 'Pending' }] : [])
    ];

    // Find platform number from live tracking timeline
    let platformNo = 'To Be Decided';
    if (trackingTimeline && trackingTimeline.length > 0) {
      const code = String(stationCode || '').toUpperCase().trim();
      const matchedStation = trackingTimeline.find(s => String(s.stationCode || '').toUpperCase().trim() === code);
      if (matchedStation && matchedStation.platform) {
        platformNo = matchedStation.platform;
      }
    }

    const newOrder = {
      id: "SRF-" + Math.floor(100000 + Math.random() * 900000),
      pnr,
      phone,
      seat: String(seat || '').toUpperCase(),
      coach: String(coach || '').toUpperCase(),
      stationCode,
      platform: platformNo,
      arrTime: arrTimeVal || getParam('arrTime') || localStorage.getItem("checkout_arr_time") || 'N/A',
      trainName: trainNameVal || getParam('trainName') || localStorage.getItem("checkout_train_name") || 'N/A',
      trainNumber: trainNumberVal || getParam('trainNumber') || localStorage.getItem("checkout_train_number") || 'N/A',
      doj: dojVal || localStorage.getItem("checkout_doj") || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      items: cart,
      onDemandRequests: finalOnDemand.map(r => ({ ...r, status: 'Pending' })),
      subtotal,
      delivery,
      total,
      paymentMode,
      isFreeGiftAdded,
      freeGiftProduct: isFreeGiftAdded ? freeProduct : null,
      status: 'Placed',
      paymentId: paymentId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString()
    };

    addOrder(newOrder);
    setPlacedOrderDetails(newOrder);
    setOrderSuccess(true);
    setIsVerifying(false);
    localStorage.removeItem("s_cart");
    localStorage.removeItem("selected_coach");
    localStorage.removeItem("selected_seat");
  };

  const isPrepaidOnly = disableCod;

  if (orderSuccess && placedOrderDetails) {
    const stationName = stations?.find(s => s.code === placedOrderDetails.stationCode)?.name || placedOrderDetails.stationCode || 'Station';
    const isOnline = placedOrderDetails.paymentMode === 'online';

    return (
      <div className="bg-slate-50 py-2 md:py-4 px-3 sm:px-6 flex items-center justify-center relative overflow-hidden">
        {/* Soft ambient blobs */}
        <div className="absolute top-[-60px] right-[-60px] w-[380px] h-[380px] bg-rose-100 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] bg-amber-100/50 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md md:max-w-4xl mx-auto space-y-4 md:space-y-6 animate-fadeIn">

          {/* Success Icon + Heading */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-emerald-500 shadow-md shadow-emerald-500/20 mb-0.5">
              <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">Order Confirmed! 🎉</h1>
              <p className="text-slate-500 text-[10px] md:text-sm mt-0.5 font-medium">
                Your food is being prepared · Delivery to <span className="text-rose-600 font-extrabold">Coach {placedOrderDetails.coach}, Seat {placedOrderDetails.seat}</span>
              </p>
            </div>
          </div>

          {/* 2-Column Layout for Desktop to fit in 100vh */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-stretch">
            
            {/* Left Side: Receipt Card details */}
            <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-lg overflow-visible flex flex-col justify-between">
              <div>
                {/* Rose gradient header */}
                <div className="bg-gradient-to-r from-rose-600 to-rose-500 rounded-t-[14px] px-4 py-3 md:py-4 flex justify-between items-center">
                  <div>
                    <p className="text-rose-200 text-[10px] md:text-[9px] font-bold uppercase tracking-widest">Order Reference</p>
                    <p className="text-white font-mono font-black text-base md:text-base tracking-wider mt-0.5">{placedOrderDetails.id}</p>
                  </div>
                  <span className="bg-white/20 border border-white/30 text-white text-[10px] md:text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                    ✓ {placedOrderDetails.status}
                  </span>
                </div>

                {/* Perforated ticket notch */}
                <div className="flex items-center gap-0 -my-0.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-50 border border-slate-200 shrink-0 -ml-1.5 shadow-inner" />
                  <div className="flex-1 border-t-2 border-dashed border-slate-200" />
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-50 border border-slate-200 shrink-0 -mr-1.5 shadow-inner" />
                </div>
                {/* Body details container */}
                <div className="px-4 py-3 md:py-5 space-y-3.5 md:space-y-4">
                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:gap-y-3.5">
                    <div>
                      <p className="text-slate-400 text-[10px] md:text-[10px] font-black uppercase tracking-widest mb-0.5">PNR Number</p>
                      <p className="text-slate-800 font-bold font-mono tracking-wider text-sm md:text-sm">{placedOrderDetails.pnr || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] md:text-[10px] font-black uppercase tracking-widest mb-0.5">Mobile Number</p>
                      <p className="text-slate-800 font-bold font-mono tracking-wider text-sm md:text-sm">{placedOrderDetails.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] md:text-[10px] font-black uppercase tracking-widest mb-0.5">Berth Details</p>
                      <p className="text-slate-800 font-bold text-sm md:text-sm">
                        Coach <span className="text-rose-600">{placedOrderDetails.coach}</span> · Seat <span className="text-rose-600">{placedOrderDetails.seat}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] md:text-[10px] font-black uppercase tracking-widest mb-0.5">Delivery Station</p>
                      <p className="text-slate-800 font-bold text-sm md:text-sm flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="truncate">{stationName}</span>
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400 text-[10px] md:text-[10px] font-black uppercase tracking-widest mb-0.5">Payment</p>
                      <p className={`font-black text-sm md:text-sm flex items-center gap-1 ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
                        <CreditCard className="w-3.5 h-3.5 shrink-0" />
                        {isOnline ? 'Paid Online ✓' : 'Cash on Delivery'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100" />

                  {/* Food Items */}
                  <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                    <p className="text-slate-400 text-[10px] md:text-[10px] font-black uppercase tracking-widest">Food Items</p>
                    <div className="space-y-1.5">
                      {placedOrderDetails.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="bg-rose-50 text-rose-600 text-[10px] md:text-[9px] font-black w-4.5 h-4.5 rounded flex items-center justify-center border border-rose-100 shrink-0">
                              {item.quantity}
                            </span>
                            <span className="text-slate-700 text-sm md:text-sm font-medium truncate">{item.name}</span>
                          </div>
                          <span className="text-slate-800 font-bold text-sm md:text-sm shrink-0">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {placedOrderDetails.onDemandRequests?.length > 0 && (
                    <>
                      <div className="border-t border-slate-100" />
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] md:text-[10px] font-black uppercase tracking-widest">On-Demand Requests</p>
                        {placedOrderDetails.onDemandRequests.map((req, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs md:text-xs">
                            <span className="text-slate-700 font-medium truncate mr-1">{req.name}</span>
                            <span className="text-amber-700 text-[9px] md:text-[9px] font-black bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 shrink-0">{req.status}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {placedOrderDetails.isFreeGiftAdded && (
                    <>
                      <div className="border-t border-slate-100" />
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                        <Gift className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-amber-900 text-xs md:text-sm font-bold truncate">{placedOrderDetails.freeGiftProduct} (Free Gift!)</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Total Paid Row */}
              <div className="bg-gradient-to-r from-rose-600 to-rose-500 rounded-b-[14px] px-4 py-3 md:py-4 flex justify-between items-center shadow-inner mt-auto">
                <span className="text-rose-200 text-[10px] md:text-[10px] font-black uppercase tracking-widest">Total Amount</span>
                <p className="text-xl md:text-2xl font-black text-white">₹{placedOrderDetails.total}</p>
              </div>
            </div>

            {/* Right Side: Tracking & Actions */}
            <div className="md:col-span-5 flex flex-col justify-between gap-4">
              
              {/* Order Tracking Timeline */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex-1 flex flex-col justify-center">
                <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-4 text-center">Order Tracking</p>
                <div className="flex flex-row md:flex-col justify-between md:justify-center md:gap-4 items-center md:items-start px-2">
                  {['Placed', 'Preparing', 'On the Way', 'Delivered'].map((step, idx) => (
                    <React.Fragment key={step}>
                      <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-3 flex-1 md:flex-none">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${idx === 0
                          ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-400'
                          }`}>
                          {idx === 0 ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[8px] md:text-xs font-black uppercase tracking-wider leading-tight ${idx === 0 ? 'text-rose-650' : 'text-slate-400'}`}>{step}</span>
                      </div>
                      {idx < 3 && (
                        <div className={`hidden md:block w-0.5 h-6 bg-slate-100 ml-3.5`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex justify-center w-full">
                  <button
                    onClick={() => router.push('/orders')}
                    className="w-fit bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <ClipboardList className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>View My Orders</span>
                  </button>
                </div>
                <p className="text-center text-slate-400 text-[8px] font-medium leading-none">
                  Placed at {placedOrderDetails.timestamp}
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-50 min-h-screen pb-28 md:pt-6 md:pb-24 relative overflow-hidden ${mobileStep === 1 ? 'pt-16' : 'pt-12'}`}>
      {/* 📱 Mobile Sticky Top Navbar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-3 py-2.5 shadow-sm fixed top-0 left-0 right-0 z-50 flex flex-row items-center gap-3 w-full">
        {/* Back Button */}
        <button
          onClick={() => {
            if (mobileStep === 3) { setMobileStep(2); }
            else if (mobileStep === 2) { setMobileStep(1); }
            else { router.back(); }
          }}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-800 transition-colors shrink-0 flex items-center justify-center border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        {/* Page Title & Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <h1 className="text-sm font-black tracking-tight text-slate-900 truncate">
              {mobileStep === 1 ? 'Personal & SEAT DETAILS' : mobileStep === 2 ? 'Order Summary' : 'Payment'}
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-bold tracking-wider mt-0.5 truncate">
            {mobileStep === 1 ? (stationCode ? `${stationCode} · Berth Delivery` : 'Step 1 of 3') : mobileStep === 2 ? `Step 2 of 3 · ₹${total} total` : `Step 3 of 3 · Choose payment`}
          </p>
        </div>
        {/* Step Indicator Pills */}
        <div className="flex items-center gap-1 shrink-0">
          <span className={`w-4 h-1.5 rounded-full transition-all ${mobileStep >= 1 ? 'bg-rose-500' : 'bg-slate-200'}`}></span>
          <span className={`w-4 h-1.5 rounded-full transition-all ${mobileStep >= 2 ? 'bg-rose-500' : 'bg-slate-200'}`}></span>
          <span className={`w-4 h-1.5 rounded-full transition-all ${mobileStep >= 3 ? 'bg-rose-500' : 'bg-slate-200'}`}></span>
        </div>
      </div>
      {/* Decorative Train Track Background Grid Accent */}
      <div className="absolute top-0 left-0 right-0 h-[300px] opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #e11d48 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <div className="hidden md:block mb-10 text-center sm:text-left">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-3">
            <Train className="w-3.5 h-3.5 text-indigo-650" /> SafeRail Berth Delivery
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Complete Booking</h1>
          <p className="text-slate-500 text-xs mt-2.5 font-bold">Verify your train ticket information for hot food delivery straight to your seat.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Form panel */}
          <div className="lg:col-span-8">
            {/* Mobile Step 1: Passenger Info */}
            <div className={`${mobileStep !== 1 ? 'hidden md:block' : 'block'}`}>
              {!otpSent ? (
                <form onSubmit={handlePlaceOrderSubmit} className="bg-white rounded-[32px] border-2 border-dashed border-slate-200 shadow-xl p-5 sm:p-8 space-y-6 relative overflow-hidden">
                  {/* Left Ticket Notch */}
                  <div className="w-4 h-8 bg-slate-50 border-r-2 border-dashed border-slate-200 rounded-r-full absolute left-0 top-1/2 -translate-y-1/2 z-10" />
                  {/* Right Ticket Notch */}
                  <div className="w-4 h-8 bg-slate-50 border-l-2 border-dashed border-slate-200 rounded-l-full absolute right-0 top-1/2 -translate-y-1/2 z-10" />

                  {isClosed && (() => {
                    const reasonText = getClosedReason();
                    const isSuspended = reasonText.startsWith("Kitchen Suspended");
                    const isHours = reasonText.startsWith("Closed Hours");
                    return (
                      <div className="bg-rose-50 border border-rose-250 text-rose-950 p-4 rounded-2xl text-xs font-semibold leading-relaxed flex gap-2.5 items-start">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block uppercase text-[10px] tracking-wider text-rose-700">
                            {isSuspended ? '🛑 Kitchen Suspended' : isHours ? '🕒 Operational Hours Closed' : '⏱ Delivery Cutoff Reached'}
                          </strong>
                          <span>{reasonText.substring(reasonText.indexOf(':') + 2)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                    <User className="w-4 h-4 text-rose-500" />
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Passenger Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs md:text-[11px] font-black uppercase tracking-wider text-slate-400">PNR Number</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-400">
                          <Ticket className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={pnr}
                          onChange={(e) => setPnr(e.target.value.replace(/\D/g, ''))}
                          placeholder="10-Digit PNR"
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm md:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 font-mono tracking-widest font-black text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs md:text-[11px] font-black uppercase tracking-wider text-slate-400">Mobile Number</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-400 text-xs md:text-sm font-bold font-mono">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="10-digit number"
                          className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm md:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 font-mono font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs md:text-[11px] font-black uppercase tracking-wider text-slate-400">Coach Number</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-400">
                          <Train className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          required
                          value={coach}
                          onChange={(e) => setCoach(e.target.value.toUpperCase())}
                          placeholder="e.g. S4, B1"
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm md:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 uppercase font-black text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs md:text-[11px] font-black uppercase tracking-wider text-slate-400">Seat / Berth Number</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-400">
                          <MapPin className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          required
                          value={seat}
                          onChange={(e) => setSeat(e.target.value)}
                          placeholder="e.g. 42, 17"
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm md:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 uppercase font-black text-slate-800"
                        />
                      </div>
                    </div>



                    <div className="md:col-span-2 space-y-1.5 pt-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400">Need anything else? (Delivered on MRP rate)</label>
                      <textarea
                        rows={2}
                        value={customMgetRequest}
                        onChange={(e) => setCustomMgetRequest(e.target.value)}
                        placeholder="e.g. Please bring 1 packet of Amul Gold Milk or specific brand tablet..."
                        className="w-full p-4 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 font-semibold text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>

                  {/* Payment selector - DESKTOP ONLY inline (mobile shows in step 2) */}
                  <div className="hidden md:block pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Payment Method</h3>
                      {isPrepaidOnly && (
                        <span className="text-[8px] bg-rose-50 text-rose-600 border border-rose-100 font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" /> Prepaid Only Active
                        </span>
                      )}
                    </div>

                    {isPrepaidOnly && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-[10px] flex items-start gap-2 leading-relaxed">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>COD Temporary Policy Warning:</strong> {
                            codPolicy === 'always_disable'
                              ? 'Cash on Delivery has been deactivated centrally for safety guidelines.'
                              : `Cash on Delivery is closed after ${Number(codCutoffHour) === 0 ? '12:00 AM' : Number(codCutoffHour) === 12 ? '12:00 PM' : Number(codCutoffHour) > 12 ? `${Number(codCutoffHour) - 12}:00 PM` : `${Number(codCutoffHour)}:00 AM`
                              } to coordinate safe dispatch operations.`
                          }
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMode('online')}
                        className={`p-5 rounded-2xl border-2 text-left flex items-start gap-4 transition-all duration-300 relative overflow-hidden ${paymentMode === 'online'
                            ? 'border-rose-500 bg-rose-50/10 shadow-md shadow-rose-500/5'
                            : 'border-slate-200 bg-white hover:bg-slate-50/50 shadow-sm'
                          }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 transition-all ${paymentMode === 'online' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25' : 'bg-slate-100 text-slate-400'}`}>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black block text-slate-800">Online UPI / Card</span>
                          <span className="text-[9px] text-slate-450 font-medium">Pay via QR, Cards, Netbanking</span>
                        </div>
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ml-auto transition-all ${paymentMode === 'online' ? 'border-rose-500 bg-rose-500' : 'border-slate-300'}`}>
                          {paymentMode === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isPrepaidOnly}
                        onClick={() => setPaymentMode('cod')}
                        className={`p-5 rounded-2xl border-2 text-left flex items-start gap-4 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${paymentMode === 'cod' && !isPrepaidOnly
                            ? 'border-slate-700 bg-slate-55/50 shadow-md'
                            : 'border-slate-200 bg-white hover:bg-slate-50/50 shadow-sm'
                          }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 transition-all ${paymentMode === 'cod' && !isPrepaidOnly ? 'bg-slate-800 text-white shadow-md shadow-slate-800/25' : 'bg-slate-100 text-slate-400'}`}>
                          <Coins className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black block text-slate-800">Cash on Delivery (COD)</span>
                          <span className="text-[9px] text-slate-400 font-medium">Pay directly to delivery agent</span>
                        </div>
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ml-auto transition-all ${paymentMode === 'cod' && !isPrepaidOnly ? 'border-slate-700 bg-slate-700' : 'border-slate-300'}`}>
                          {paymentMode === 'cod' && !isPrepaidOnly && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div id="recaptcha-container"></div>

                  {/* Desktop submit button */}
                  <button
                    type="submit"
                    disabled={isVerifying || isClosed}
                    className="hidden md:flex w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3.5 rounded-xl transition-all shadow-md shadow-rose-600/10 text-xs mt-4 items-center justify-center gap-1.5 disabled:bg-slate-350 disabled:cursor-not-allowed uppercase tracking-widest"
                  >
                    {isClosed ? 'Ordering Closed for Station' : (isVerifying ? 'Processing...' : (currentUser === phone ? 'Confirm & Place Order' : 'Verify Mobile & Place Order'))}
                  </button>
                </form>
              ) : (
                // OTP Entry Form
                <form onSubmit={handleVerifyOtp} className="bg-white rounded-[32px] border border-slate-200 shadow-md p-8 space-y-6 max-w-md mx-auto text-center animate-fadeIn">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl mb-2">
                    <Phone className="w-7 h-7 animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-black text-slate-800">Verify Phone Number</h2>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">We have sent a 6-digit OTP verification code to <strong className="text-slate-850">{phone}</strong>.</p>
                  </div>

                  <div className="py-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5">Enter Verification Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder={isFirebaseConfigured() ? "Enter 6-digit OTP" : "Enter test OTP: 123456"}
                      className="w-full max-w-[200px] px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 text-center tracking-[0.25em] text-lg font-black font-mono mx-auto text-slate-850"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-xs transition-colors"
                    >
                      Edit Details
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/10"
                    >
                      {isVerifying ? 'Verifying...' : (mobileStep === 1 ? 'Verify & Proceed' : 'Verify & Order')}
                    </button>
                  </div>
                </form>
              )}
            </div>{/* end mobile step 1 wrapper */}
          </div>

          {/* Invoice Summary - Desktop always visible, Mobile only in step 2 */}
          <div className={`lg:col-span-4 ${mobileStep === 2 ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-md p-6 space-y-5 relative overflow-hidden">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-3 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-405" /> Secure Order Bill
              </h3>

              {/* Food items summary */}
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs md:text-sm">
                    <span className="text-slate-600 font-medium">{item.name} <strong className="text-[10px] text-slate-400 font-normal">(&times; {item.quantity})</strong></span>
                    <span className="font-bold text-slate-700">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* On demand list */}
              {onDemand.length > 0 && (
                <div className="border-t border-slate-100 pt-4 space-y-2.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">On-Demand Requests</span>
                  {onDemand.map((req, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs md:text-sm bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <span className="text-slate-600 font-medium text-[11px] md:text-xs">{req.name}</span>
                      <span className="font-black text-emerald-700 text-[10px]">Free</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Free Gift Indicator */}
              {subtotal >= (giftThreshold || 300) && (
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs md:text-sm bg-amber-50 p-3 rounded-2xl border border-amber-100 text-amber-800 font-bold">
                  <span className="flex items-center gap-1.5"><Gift className="w-4 h-4 text-amber-500" /> Free Gift Added:</span>
                  <span className="text-[10px] text-amber-700 font-black">{freeProduct}</span>
                </div>
              )}

              {/* Calculations */}
              <div className="border-t border-slate-200 pt-4 space-y-2 text-xs md:text-sm font-semibold text-slate-500">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-bold text-slate-700">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Seat Delivery Charge</span>
                  <span className={`font-black ${Number(delivery) === 0 ? 'text-emerald-600 font-bold' : 'text-slate-800'}`}>
                    {Number(delivery) === 0 ? 'Free' : `₹${delivery}`}
                  </span>
                </div>

                <div className="flex justify-between text-sm md:text-base font-black text-slate-800 border-t border-slate-100 pt-3">
                  <span className="text-slate-900 uppercase text-[10px] md:text-[11px] tracking-wider">Grand Total</span>
                  <span className="text-lg md:text-xl text-rose-600 font-black">₹{total}</span>
                </div>
              </div>
            </div>

            {/* Mobile Step 2: Delivery Details card */}
            <div className="md:hidden mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Delivery Details</p>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-400" /> Station</span>
                  <span className="font-black text-slate-800">{stationCode || '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5"><Train className="w-3.5 h-3.5 text-indigo-400" /> Coach / Seat</span>
                  <span className="font-black text-slate-800">{coach ? `${coach.toUpperCase()} / ${seat.toUpperCase()}` : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5"><Ticket className="w-3.5 h-3.5 text-amber-500" /> PNR</span>
                  <span className="font-mono font-black text-slate-800">{pnr || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 📱 Mobile Step 3: Payment Selection — Premium Full View */}
          <div className={`md:hidden ${mobileStep === 3 ? 'block' : 'hidden'}`}>
            <div className="space-y-3">
              {/* Header */}
              <div className="text-center pb-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">How would you like to pay?</p>
              </div>

              {isPrepaidOnly && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-[10px] flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>COD disabled:</strong> {codPolicy === 'always_disable' ? 'Cash on Delivery has been deactivated.' : `COD not available after ${Number(codCutoffHour) > 12 ? `${Number(codCutoffHour) - 12}:00 PM` : `${Number(codCutoffHour)}:00 AM`}.`}
                  </span>
                </div>
              )}

              {/* Online UPI / Card */}
              <button
                type="button"
                onClick={() => setPaymentMode('online')}
                className={`w-full text-left rounded-3xl border-2 p-5 transition-all duration-200 relative overflow-hidden ${paymentMode === 'online'
                  ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-pink-50 shadow-lg shadow-rose-100'
                  : 'border-slate-200 bg-white'
                  }`}
              >
                {paymentMode === 'online' && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full -translate-y-4 translate-x-4" />
                )}
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl shrink-0 transition-all ${paymentMode === 'online' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-slate-100 text-slate-400'}`}>
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-black text-slate-900">Online UPI / Card</span>
                      <span className="text-[8px] bg-emerald-100 text-emerald-700 font-black px-1.5 py-0.5 rounded uppercase tracking-wide">Recommended</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Pay via UPI, Debit/Credit Cards, Netbanking</span>
                    <div className="flex items-center gap-2 mt-2">
                      {['UPI', 'Visa', 'MC', 'RuPay'].map(m => (
                        <span key={m} className="text-[8px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{m}</span>
                      ))}
                    </div>
                  </div>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${paymentMode === 'online' ? 'border-rose-500 bg-rose-500' : 'border-slate-300'}`}>
                    {paymentMode === 'online' && <span className="w-2 h-2 rounded-full bg-white block" />}
                  </span>
                </div>
              </button>

              {/* Cash on Delivery */}
              <button
                type="button"
                disabled={isPrepaidOnly}
                onClick={() => setPaymentMode('cod')}
                className={`w-full text-left rounded-3xl border-2 p-5 transition-all duration-200 relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed ${paymentMode === 'cod'
                  ? 'border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg shadow-slate-200'
                  : 'border-slate-200 bg-white'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl shrink-0 transition-all ${paymentMode === 'cod' && !isPrepaidOnly ? 'bg-slate-800 text-white shadow-md shadow-slate-500/20' : 'bg-slate-100 text-slate-400'}`}>
                    <Coins className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-black text-slate-900 block mb-0.5">Cash on Delivery</span>
                    <span className="text-[11px] text-slate-400 font-medium">Pay in cash directly to delivery agent at your seat</span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">CASH</span>
                      <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">AT SEAT</span>
                    </div>
                  </div>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${paymentMode === 'cod' && !isPrepaidOnly ? 'border-slate-700 bg-slate-700' : 'border-slate-300'}`}>
                    {paymentMode === 'cod' && !isPrepaidOnly && <span className="w-2 h-2 rounded-full bg-white block" />}
                  </span>
                </div>
              </button>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <Lock className="w-3 h-3 text-slate-300" />
                <span className="text-[9px] text-slate-400 font-medium">Secured & Encrypted · RailFood Safe Pay</span>
              </div>

              <div id="recaptcha-container"></div>
            </div>
          </div>

        </div>
      </div>

      {/* 📱 Mobile Step 1: Sticky Bottom → Proceed to Order Summary */}
      {mobileStep === 1 && !otpSent && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Your Total</p>
              <p className="text-base font-black text-slate-900">₹{total} <span className="text-[9px] font-normal text-slate-400">incl. all</span></p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                if (!pnr || pnr.length < 10) { alert('Please enter a valid 10-digit PNR number.'); return; }
                if (!phone || phone.length < 10) { alert('Please enter a valid 10-digit mobile number.'); return; }
                if (!coach) { alert('Please enter your Coach Number (e.g. S4, B1).'); return; }
                if (!seat) { alert('Please enter your Seat / Berth Number.'); return; }
                handlePlaceOrderSubmit(e);
              }}
              className="flex-shrink-0 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black py-3 px-5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-rose-600/25"
            >
              Proceed
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 📱 Mobile Step 2: Sticky Bottom → Proceed to Payment */}
      {mobileStep === 2 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Grand Total</p>
              <p className="text-lg font-black text-slate-900 leading-tight">₹{total}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex-shrink-0 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black py-3 px-5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-rose-600/25"
            >
              Select Payment
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 📱 Mobile Step 3: Sticky Bottom → Total + Place Order */}
      {mobileStep === 3 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]">
          <form onSubmit={handlePlaceOrderSubmit}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Grand Total</p>
                <p className="text-lg font-black text-slate-900 leading-tight">₹{total}</p>
              </div>
              <button
                type="submit"
                disabled={isVerifying || isClosed}
                className="flex-shrink-0 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black py-3 px-5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-rose-600/25 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isClosed ? 'Closed' : isVerifying ? 'Processing...' : currentUser === phone ? 'Confirm Order' : 'Place Order'}
                {!isVerifying && !isClosed && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest animate-pulse">Loading Checkout...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
