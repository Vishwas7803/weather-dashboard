// Open-Meteo API integration
// Docs: https://open-meteo.com/


// CORRECT ✅ - split into two separate base URLs
const BASE_URL = 'https://api.open-meteo.com/v1';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1';
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1';

export const WMO_CODES = {
  0: { label: 'Clear Sky', icon: '☀️' },
  1: { label: 'Mainly Clear', icon: '🌤️' },
  2: { label: 'Partly Cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Icy Fog', icon: '🌫️' },
  51: { label: 'Light Drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy Drizzle', icon: '🌧️' },
  61: { label: 'Light Rain', icon: '🌧️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy Rain', icon: '🌧️' },
  71: { label: 'Light Snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '❄️' },
  75: { label: 'Heavy Snow', icon: '❄️' },
  80: { label: 'Rain Showers', icon: '🌦️' },
  81: { label: 'Rain Showers', icon: '🌧️' },
  82: { label: 'Heavy Showers', icon: '⛈️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm w/ Hail', icon: '⛈️' },
  99: { label: 'Heavy Thunderstorm', icon: '⛈️' },
};

export async function getCityName(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      'Your Location'
    );
  } catch {
    return 'Your Location';
  }
}

export async function fetchCurrentWeather(lat, lon, date) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'precipitation_sum',
      'wind_speed_10m_max',
      'precipitation_probability_max',
      'uv_index_max',
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'visibility',
      'wind_speed_10m',
      'weather_code',
    ].join(','),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'weather_code',
      'wind_speed_10m',
      'precipitation',
    ].join(','),
    timezone: 'auto',
    start_date: date,
    end_date: date,
  });

  const res = await fetch(`${BASE_URL}/forecast?${params}`);
  if (!res.ok) throw new Error('Weather API error');
  return res.json();
}

export async function fetchAirQuality(lat, lon, date) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: [
      'pm10',
      'pm2_5',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'european_aqi',
    ].join(','),
    timezone: 'auto',
    start_date: date,
    end_date: date,
  });

  const res = await fetch(`${AIR_URL}/air-quality?${params}`);
  if (!res.ok) throw new Error('Air quality API error');
  return res.json();
}

// Archive API has a ~7-day data lag — cap end date accordingly
function getArchiveSafeEndDate(endDate) {
  const LAG_DAYS = 7;
  const safeEnd = new Date();
  safeEnd.setDate(safeEnd.getDate() - LAG_DAYS);

  const requested = new Date(endDate);
  const capped = requested < safeEnd ? requested : safeEnd;
  return capped.toISOString().split('T')[0];
}

export async function fetchHistoricalWeather(lat, lon, startDate, endDate) {
  const safeEndDate = getArchiveSafeEndDate(endDate);

  if (startDate >= safeEndDate) {
    throw new Error(
      `Archive data is only available up to ${safeEndDate}. Please select a range ending before that date.`
    );
  }

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    start_date: startDate,
    end_date: safeEndDate,
    daily: [
      'temperature_2m_mean',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'precipitation_sum',
      'wind_speed_10m_max',
      'wind_direction_10m_dominant',
    ].join(','),
    timezone: 'auto',
  });

  const url = `${ARCHIVE_URL}/archive?${params}`;
  console.log('[fetchHistoricalWeather] Requesting:', url);

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Historical weather API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchHistoricalAirQuality(lat, lon, startDate, endDate) {
  const safeEndDate = getArchiveSafeEndDate(endDate);

  if (startDate >= safeEndDate) {
    return { hourly: { time: [], pm10: [], pm2_5: [] } };
  }

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    start_date: startDate,
    end_date: safeEndDate,
    hourly: ['pm10', 'pm2_5'].join(','),
    timezone: 'auto',
  });

  const url = `${AIR_URL}/air-quality?${params}`;
  console.log('[fetchHistoricalAirQuality] Requesting:', url);

  const res = await fetch(url);
  if (!res.ok) {
    console.warn('Air quality API error:', res.status);
    return { hourly: { time: [], pm10: [], pm2_5: [] } };
  }
  return res.json();
}

export function toDateStr(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

export function getCurrentHourIndex(timeArray) {
  const now = new Date();
  const currentHour = now.getHours();
  const today = toDateStr(now);
  return timeArray.findIndex(t => {
    const d = new Date(t);
    return toDateStr(d) === today && d.getHours() === currentHour;
  });
}

export function aqiCategory(aqi) {
  if (aqi <= 50) return { label: 'Good', color: '#34d399' };
  if (aqi <= 100) return { label: 'Fair', color: '#fbbf24' };
  if (aqi <= 150) return { label: 'Moderate', color: '#fb923c' };
  if (aqi <= 200) return { label: 'Poor', color: '#f87171' };
  if (aqi <= 300) return { label: 'Very Poor', color: '#c084fc' };
  return { label: 'Extremely Poor', color: '#991b1b' };
}

export function uvCategory(uv) {
  if (uv <= 2) return { label: 'Low', color: '#34d399' };
  if (uv <= 5) return { label: 'Moderate', color: '#fbbf24' };
  if (uv <= 7) return { label: 'High', color: '#fb923c' };
  if (uv <= 10) return { label: 'Very High', color: '#f87171' };
  return { label: 'Extreme', color: '#c084fc' };
}

export function toFahrenheit(c) {
  return (c * 9 / 5 + 32).toFixed(1);
}

export function toIST(timeStr) {
  if (!timeStr) return '--';
  try {
    const d = new Date(timeStr);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return timeStr;
  }
}

export function degToCompass(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}