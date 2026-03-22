import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import StatCard from '../components/StatCard.jsx';
import HourlyChart from '../components/HourlyChart.jsx';
import DateSelector from '../components/DateSelector.jsx';
import {
  fetchCurrentWeather, fetchAirQuality,
  WMO_CODES, aqiCategory, uvCategory, toFahrenheit, toIST,
  getCurrentHourIndex, toDateStr
} from '../utils/api.js';
import './CurrentWeather.css';

export default function CurrentWeather({ location }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tempUnit, setTempUnit] = useState('C'); // 'C' or 'F'

  const loadData = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    const dateStr = toDateStr(selectedDate);
    try {
      const [w, aq] = await Promise.all([
        fetchCurrentWeather(location.lat, location.lon, dateStr),
        fetchAirQuality(location.lat, location.lon, dateStr),
      ]);
      setWeather(w);
      setAirQuality(aq);
    } catch (e) {
      setError(e.message || 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  }, [location, selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  // ---------- derived values ----------
  const daily = weather?.daily;
  const current = weather?.current;
  const hourly = weather?.hourly;
  const aqHourly = airQuality?.hourly;

  const isToday = toDateStr(selectedDate) === toDateStr(new Date());

  // Current hour index in hourly array
  const nowIdx = isToday && hourly ? getCurrentHourIndex(hourly.time) : -1;
  const safeIdx = nowIdx >= 0 ? nowIdx : 12; // default noon

  // Get current values (use API current if today, else noon values)
  const currentTemp = isToday && current
    ? current.temperature_2m
    : hourly?.temperature_2m?.[safeIdx];

  const currentHumidity = isToday && current
    ? current.relative_humidity_2m
    : hourly?.relative_humidity_2m?.[safeIdx];

  const wmoCode = isToday && current
    ? current.weather_code
    : hourly?.weather_code?.[safeIdx];
  const wmo = WMO_CODES[wmoCode] || { label: 'Unknown', icon: '🌡️' };

  // AQI values (current hour or noon)
  const aqIdx = aqHourly ? safeIdx : 0;
  const aqi = aqHourly?.european_aqi?.[aqIdx];
  const aqiCat = aqi != null ? aqiCategory(aqi) : null;

  const pm10 = aqHourly?.pm10?.[aqIdx];
  const pm25 = aqHourly?.pm2_5?.[aqIdx];
  const co = aqHourly?.carbon_monoxide?.[aqIdx];
  const no2 = aqHourly?.nitrogen_dioxide?.[aqIdx];
  const so2 = aqHourly?.sulphur_dioxide?.[aqIdx];

  const uvMax = daily?.uv_index_max?.[0];
  const uvCat = uvMax != null ? uvCategory(uvMax) : null;

  // Temperature conversion helper
  const T = (c) => {
    if (c == null) return '--';
    if (tempUnit === 'F') return toFahrenheit(c);
    return Number(c).toFixed(1);
  };
  const tUnit = tempUnit === 'C' ? '°C' : '°F';

  // ---------- hourly chart data ----------
  const buildHourlyData = () => {
    if (!hourly) return [];
    return hourly.time.map((t, i) => ({
      time: format(new Date(t), 'HH:mm'),
      temperature: hourly.temperature_2m[i],
      humidity: hourly.relative_humidity_2m[i],
      precipitation: hourly.precipitation[i],
      visibility: hourly.visibility ? hourly.visibility[i] / 1000 : null, // km
      wind: hourly.wind_speed_10m[i],
    }));
  };

  const buildAqHourlyData = () => {
    if (!aqHourly) return [];
    return aqHourly.time.map((t, i) => ({
      time: format(new Date(t), 'HH:mm'),
      pm10: aqHourly.pm10[i],
      pm25: aqHourly.pm2_5[i],
    }));
  };

  const hourlyData = buildHourlyData();
  const aqHourlyData = buildAqHourlyData();
  const currentTimeStr = nowIdx >= 0 ? format(new Date(hourly?.time?.[nowIdx] || new Date()), 'HH:mm') : null;

  // ---------- render ----------
  if (!location) {
    return (
      <div className="cw-page container">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="loader" />
        </div>
      </div>
    );
  }

  return (
    <div className="cw-page container">
      {/* Header */}
      <div className="cw-header">
        <div className="cw-title-block">
          <h1 className="cw-title">
            {wmo.icon} {wmo.label}
          </h1>
          <p className="cw-subtitle">
            {format(selectedDate, 'EEEE, d MMMM yyyy')} · {location.city}
          </p>
        </div>

        <div className="cw-controls">
          <DateSelector
            selected={selectedDate}
            onChange={(d) => setSelectedDate(d)}
            label="Select Date"
          />
          <div className="toggle-unit">
            <button
              className={tempUnit === 'C' ? 'active' : ''}
              onClick={() => setTempUnit('C')}>°C</button>
            <button
              className={tempUnit === 'F' ? 'active' : ''}
              onClick={() => setTempUnit('F')}>°F</button>
          </div>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="cw-loading">
          <div className="loader" />
          <p>Loading weather data…</p>
        </div>
      ) : weather ? (
        <>
          {/* ---- Main temp hero ---- */}
          <div className="cw-hero card fade-in">
            <div className="hero-temp">
              <span className="hero-big-icon">{wmo.icon}</span>
              <div>
                <div className="hero-current">{T(currentTemp)}{tUnit}</div>
                <div className="hero-range">
                  ↓ {T(daily?.temperature_2m_min?.[0])}{tUnit} &nbsp;·&nbsp; ↑ {T(daily?.temperature_2m_max?.[0])}{tUnit}
                </div>
                <div className="hero-condition">{wmo.label}</div>
              </div>
            </div>
            <div className="hero-meta">
              <div className="hero-meta-item">
                <span>💧</span>
                <span>{currentHumidity != null ? Math.round(currentHumidity) : '--'}%</span>
                <span>Humidity</span>
              </div>
              <div className="hero-meta-item">
                <span>💨</span>
                <span>{daily?.wind_speed_10m_max?.[0] != null ? Number(daily.wind_speed_10m_max[0]).toFixed(0) : '--'} km/h</span>
                <span>Max Wind</span>
              </div>
              <div className="hero-meta-item">
                <span>🌧️</span>
                <span>{daily?.precipitation_sum?.[0] != null ? Number(daily.precipitation_sum[0]).toFixed(1) : '--'} mm</span>
                <span>Precip.</span>
              </div>
            </div>
          </div>

          {/* ---- Section: Weather Variables ---- */}
          <h2 className="section-title">Weather Variables</h2>
          <div className="stats-grid">
            <StatCard icon="🌡️" label="Current Temperature" value={T(currentTemp)} unit={tUnit} />
            <StatCard icon="⬇️" label="Min Temperature" value={T(daily?.temperature_2m_min?.[0])} unit={tUnit} />
            <StatCard icon="⬆️" label="Max Temperature" value={T(daily?.temperature_2m_max?.[0])} unit={tUnit} />
            <StatCard icon="💧" label="Relative Humidity" value={currentHumidity != null ? Math.round(currentHumidity) : '--'} unit="%" />
            <StatCard icon="🌧️" label="Precipitation" value={daily?.precipitation_sum?.[0] != null ? Number(daily.precipitation_sum[0]).toFixed(1) : '--'} unit="mm" />
            <StatCard icon="☀️" label="UV Index Max" value={uvMax != null ? Number(uvMax).toFixed(1) : '--'}
              color={uvCat?.color}
              badge={uvCat} />
            <StatCard icon="🌅" label="Sunrise" value={toIST(daily?.sunrise?.[0])} sub="IST" />
            <StatCard icon="🌇" label="Sunset" value={toIST(daily?.sunset?.[0])} sub="IST" />
            <StatCard icon="💨" label="Max Wind Speed" value={daily?.wind_speed_10m_max?.[0] != null ? Number(daily.wind_speed_10m_max[0]).toFixed(0) : '--'} unit="km/h" />
            <StatCard icon="🌦️" label="Precip. Probability Max" value={daily?.precipitation_probability_max?.[0] != null ? Math.round(daily.precipitation_probability_max[0]) : '--'} unit="%" />
          </div>

          {/* ---- Section: Air Quality ---- */}
          <h2 className="section-title">Air Quality Metrics</h2>
          <div className="stats-grid">
            <StatCard icon="🌿" label="Air Quality Index (AQI)" value={aqi != null ? Math.round(aqi) : '--'}
              color={aqiCat?.color} badge={aqiCat} />
            <StatCard icon="🟤" label="PM10" value={pm10 != null ? Number(pm10).toFixed(1) : '--'} unit=" µg/m³" />
            <StatCard icon="🔴" label="PM2.5" value={pm25 != null ? Number(pm25).toFixed(1) : '--'} unit=" µg/m³" />
            <StatCard icon="🏭" label="Carbon Monoxide (CO)" value={co != null ? Number(co).toFixed(0) : '--'} unit=" µg/m³" />
            <StatCard icon="🍃" label="CO₂" value="~420" unit=" ppm" sub="Global avg. (no API)" />
            <StatCard icon="🔵" label="Nitrogen Dioxide (NO₂)" value={no2 != null ? Number(no2).toFixed(1) : '--'} unit=" µg/m³" />
            <StatCard icon="🟡" label="Sulphur Dioxide (SO₂)" value={so2 != null ? Number(so2).toFixed(1) : '--'} unit=" µg/m³" />
          </div>

          {/* ---- Section: Hourly Charts ---- */}
          <h2 className="section-title">Hourly Forecast</h2>
          <div className="charts-grid">
            <HourlyChart
              title={`🌡️ Temperature (${tUnit})`}
              data={hourlyData.map(d => ({ ...d, temperature: tempUnit === 'F' ? parseFloat(toFahrenheit(d.temperature)) : d.temperature }))}
              lines={[{ key: 'temperature', color: '#fb923c' }]}
              unit={tUnit}
              currentHour={currentTimeStr}
            />
            <HourlyChart
              title="💧 Relative Humidity"
              data={hourlyData}
              lines={[{ key: 'humidity', color: '#38bdf8' }]}
              unit="%"
              currentHour={currentTimeStr}
            />
            <HourlyChart
              title="🌧️ Precipitation"
              data={hourlyData}
              bars={[{ key: 'precipitation', color: '#818cf8' }]}
              unit=" mm"
              currentHour={currentTimeStr}
            />
            <HourlyChart
              title="👁️ Visibility"
              data={hourlyData}
              lines={[{ key: 'visibility', color: '#34d399' }]}
              unit=" km"
              currentHour={currentTimeStr}
            />
            <HourlyChart
              title="💨 Wind Speed (10m)"
              data={hourlyData}
              lines={[{ key: 'wind', color: '#fbbf24' }]}
              unit=" km/h"
              currentHour={currentTimeStr}
            />
            {aqHourlyData.length > 0 && (
              <HourlyChart
                title="🌫️ PM10 & PM2.5 (µg/m³)"
                data={aqHourlyData}
                lines={[
                  { key: 'pm10', name: 'PM10', color: '#fb923c' },
                  { key: 'pm25', name: 'PM2.5', color: '#f87171' },
                ]}
                unit=" µg/m³"
                currentHour={currentTimeStr}
              />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
