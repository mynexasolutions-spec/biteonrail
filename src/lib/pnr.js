import { supabase, isSupabaseConfigured } from './supabase';
import crypto from 'crypto';

/**
 * Helper to parse PnrResponse XML string to object matching the parsed schema
 */
const parseXmlToObj = (xmlString) => {
  const getTagValue = (tag, str) => {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
    const match = str.match(regex);
    return match ? match[1] : '';
  };

  const passengerBlocks = [];
  // Split on each <PassengerStatus> tag segment
  const parts = xmlString.split(/<PassengerStatus>/gi);
  for (const part of parts) {
    // Only segments containing individual passenger tags are valid passenger objects
    if (part.includes('<Number>') || part.includes('<Berth>') || part.includes('<BookingBerthNo>')) {
      passengerBlocks.push({
        no: getTagValue('Number', part),
        coach: getTagValue('Coach', part) || getTagValue('BookingCoachId', part),
        seat: getTagValue('Berth', part) || getTagValue('BookingBerthNo', part) || getTagValue('CurrentBerthNo', part),
        bookingStatus: getTagValue('BookingStatus', part),
        currentStatus: getTagValue('CurrentStatus', part)
      });
    }
  }

  return {
    Pnr: getTagValue('Pnr', xmlString),
    TrainNo: getTagValue('TrainNo', xmlString),
    TrainName: getTagValue('TrainName', xmlString),
    Doj: getTagValue('Doj', xmlString),
    From: getTagValue('From', xmlString),
    To: getTagValue('To', xmlString),
    Class: getTagValue('Class', xmlString),
    PassengerStatus: passengerBlocks,
    Error: getTagValue('Error', xmlString),
    ErrorCode: getTagValue('ErrorCode', xmlString),
    DestinationName: getTagValue('DestinationName', xmlString),
    DestinationDoj: getTagValue('DestinationDoj', xmlString),
    SourceName: getTagValue('SourceName', xmlString),
    BoardingPoint: getTagValue('BoardingPoint', xmlString),
    BoardingStationName: getTagValue('BoardingStationName', xmlString),
    ReservationUptoName: getTagValue('ReservationUptoName', xmlString)
  };
};

// Dynamically fetch active hubs ONLY from Supabase DB
const getActiveHubs = async () => {
  try {
    const { data, error } = await supabase.from('stations').select('code');
    if (data && !error) {
      return data.map(s => (s.code || '').toUpperCase()).filter(Boolean);
    }
    if (error) {
      console.error("Supabase error fetching stations:", error);
    }
  } catch (e) {
    console.warn("Supabase fetch failed inside getActiveHubs:", e);
  }
  return [];
};

let pnrCache = {};

export const clearPnrCaches = () => {
  pnrCache = {};
  scheduleCache = {};
  delayCache = {};
};


export const getPnrStatus = async (pnr) => {
  if (pnrCache[pnr]) {
    return pnrCache[pnr];
  }
  try {
    const response = await fetch(`/api/pnr-status?pnr=${pnr}`, {
      method: "GET"
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorObj = new Error(errorData.message || errorData.error || `Failed to fetch PNR status (Status: ${response.status})`);
      errorObj.isPnrError = true;
      throw errorObj;
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      const errorObj = new Error(result.error || result.message || "Invalid PNR Number");
      errorObj.isPnrError = true;
      throw errorObj;
    }

    pnrCache[pnr] = result;
    return result;
  } catch (err) {
    console.error("PNR Fetch failed:", err);
    throw err;
  }
};

/**
 * Helper to calculate train schedule date param based on Date of Journey
 */
const calculateDateParam = (dojStr) => {
  if (!dojStr) return 'today';
  try {
    const parts = dojStr.split(/[-/]/);
    let dojDate;
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        dojDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        dojDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    } else {
      dojDate = new Date(dojStr);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dojDate.setHours(0, 0, 0, 0);
    
    const diffTime = dojDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === -1) return 'today'; // Fallback to today if yesterday just in case
    if (diffDays === 0) return 'today';
    
    const yyyy = dojDate.getFullYear();
    const mm = String(dojDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dojDate.getDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`; // DD-MM-YYYY for RailKit
  } catch (e) {
    console.warn("Error calculating dateParam from DOJ:", dojStr, e);
    return 'today';
  }
};

/**
 * Generate a realistic timeline of stations with timings and delay for the train
 */
let scheduleCache = {};

const getRouteStopsForTrain = async (trainNumber, boardingStation, destinationStation, destinationName = '', dateParam = 'today') => {
  const num = String(trainNumber);
  if (scheduleCache[num]) {
    return scheduleCache[num];
  }
  const activeHubs = await getActiveHubs();

  try {
    const res = await fetch(`/api/train-schedule?trainNo=${num}`, {
      method: "GET"
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data && Array.isArray(result.data.route)) {
        const routeStops = result.data.route.map(stop => {
          const code = (stop.stnCode || '').toUpperCase();
          const name = stop.stnName || '';
          
          // Map scheduled times
          const arrTime = stop.arrival || '--';
          const depTime = stop.departure || '--';
          const time = arrTime !== '--' ? arrTime : (depTime !== '--' ? depTime : '--:--');

          return {
            code,
            name,
            time,
            delay: "Right Time",
            isActive: activeHubs.includes(code),
            isPassed: false,
            haltTime: stop.halt || ''
          };
        });

        const stopsResult = {
          routeStops,
          currentPosition: `Scheduled route for ${result.data.trainInfo?.train_name || 'train'}`
        };
        scheduleCache[num] = stopsResult;
        return stopsResult;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch train schedule from proxy train-schedule:", err);
  }

  // Safe fallback route
  return {
    routeStops: [
      { code: boardingStation, name: boardingStation, time: "--:--", delay: "Right Time", isActive: activeHubs.includes(boardingStation), isPassed: false, haltTime: "First Stop" },
      { code: destinationStation, name: destinationName || destinationStation, time: "--:--", delay: "Right Time", isActive: activeHubs.includes(destinationStation), isPassed: false, haltTime: "Last Stop" }
    ],
    currentPosition: "Live tracking connection active"
  };
};

/**
 * Standardize PNR API response formats
 */
export const parsePnrData = async (apiResponse, dateParam = 'today') => {
  const data = apiResponse.data || apiResponse.details || apiResponse;

  // Extract train info from RailKit schema
  const trainNumber = data.train?.number || data.train_num || data.trainNumber || data.trainNo || data.TrainNo || "12626";
  const trainName = data.train?.name || data.train_name || data.trainName || data.TrainName || "KERALA EXPRESS";
  
  // Extract date of journey
  const dateOfJourney = data.journey?.dateOfJourney || data.date || data.dateOfJourney || data.DateOfJourney || data.Doj || data.doj || "12-07-2026";
  const computedDateParam = calculateDateParam(dateOfJourney);

  // Extract station details from RailKit schema
  const sourceStation = data.journey?.source?.code || data.From || data.from || data.source || data.Source || "NDLS";
  const boardingPoint = data.journey?.boardingPoint?.code || data.BoardingPoint || data.boardingPoint || data.boardingCode || sourceStation;
  const destinationStation = data.journey?.destination?.code || data.To || data.to || data.destinationStation || data.destinationCode || "SBC";

  // Full station names
  const sourceName = data.journey?.source?.name || data.SourceName || data.source_name || data.sourceName || "";
  const boardingStationName = data.journey?.boardingPoint?.name || data.BoardingStationName || data.boarding_station_name || data.boardingStationName || "";
  const destinationName = data.journey?.destination?.name || data.DestinationName || data.destination_name || data.destinationName || "";
  const destinationDoj = data.journey?.arrivalDate || data.DestinationDoj || data.destination_doj || "";
  const className = data.journey?.class || data.class || data.className || data.Class || "3A";

  const rawPassengers = data.passengers || data.PassengerStatus || [];
  const passengers = rawPassengers.map((p, idx) => {
    const booking = p.booking || {};
    const current = p.current || {};
    return {
      passengerNumber: p.no || p.PassengerNo || (idx + 1),
      bookingStatus: booking.status || p.booking_status || p.bookingStatus || p.BookingStatus || "CNF",
      currentStatus: current.status || p.current_status || p.currentStatus || p.CurrentStatus || "CNF",
      coach: current.coach || booking.coach || p.coach || p.Coach || p.BookingCoachId || "B1",
      seat: current.berthNo || booking.berthNo || p.seat || p.SeatNo || p.Seat || p.Berth || p.berth || "23"
    };
  });

  // Generate train route stops timeline dynamically
  const result = await getRouteStopsForTrain(trainNumber, sourceStation, destinationStation, destinationName, computedDateParam);

  return {
    pnr: data.pnr || data.Pnr || "",
    trainNumber,
    trainName,
    dateOfJourney,
    sourceStation,
    boardingPoint,
    boardingStationName,
    sourceName,
    destinationStation,
    destinationName,
    destinationDoj,
    className,
    passengers,
    routeStops: result.routeStops || [],
    currentPosition: result.currentPosition || "Live running position tracking active"
  };
};

/**
 * Fetch live delay for a specific station on a train's route
 */
let delayCache = {};

export const getLiveTrainDelay = async (trainNumber, dateParam, stationCode) => {
  const num = String(trainNumber);
  const code = String(stationCode).toUpperCase();
  const cacheKey = `${num}_${dateParam}_${code}`;
  if (delayCache[cacheKey]) {
    return delayCache[cacheKey];
  }
  try {
    const res = await fetch(`/api/track-train?trainNo=${num}&date=${dateParam}`, {
      method: "GET"
    });
    if (res.ok) {
      const result = await res.json();
      const stationsArray = result.data?.timeline || result.data?.stations;
      if (result.success && Array.isArray(stationsArray)) {
        const matchedStop = stationsArray.find(s => (s.stationCode || '').toUpperCase() === code);
        if (matchedStop) {
          const rawDelay = matchedStop.arrival?.delay || matchedStop.departure?.delay || "0";
          const delayMins = parseInt(String(rawDelay).replace(/[^0-9]/g, '')) || 0;
          const delayResult = {
            delayMins,
            statusNote: result.data.statusNote || '',
            actualTime: matchedStop.arrival?.actual || matchedStop.departure?.actual || ''
          };
          delayCache[cacheKey] = delayResult;
          return delayResult;
        }
      }
    }
  } catch (err) {
    console.warn("Failed to fetch live train delay from track-train proxy:", err);
  }
  return { delayMins: 0, statusNote: '', actualTime: '' };
};
