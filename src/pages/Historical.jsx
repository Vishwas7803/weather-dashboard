import { useState, useCallback } from 'react';
import { format, differenceInDays, subYears } from 'date-fns';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Brush, AreaChart, Area
} from 'recharts';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  fetchHistoricalWeather, fetchHistoricalAirQuality,
  toDateStr, toIST, degToCompass
} from '../utils/api.js';
import './Historical.css';

// Custom Tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="ct-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="ct-row">
          <span className="ct-dot" style={{ background: p.color }} />
          <span className="ct-name">{p.name}</span>
          <span className="ct-val">{p.value != null ? Number(p.value).toFixed(1) : '--'}</span>
        </div>
      ))}
    </div>
  );
}

// Reusable historical chart
function HistoricalChart({ title, data, lines, bars, areas, unit, height = 240 }) {
  if (!data || data.length === 0) return null;
  const chartWidth = Math.max(data.length * 20, 700);

  return (
    <div className="hist-chart card fade-in">
      <div className="hc-header">
        <h3 className="hc-title">{title}</h3>
        <span className="hc-hint">← scroll & brush to zoom →</span>
      </div>
      <div className="chart-scroll">
        <div style={{ width: chartWidth, minWidth: '100%' }}>
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.ceil(data.length / 12)} />
              <YAxis tick={{ fontSize: 11 }} width={48} unit={unit} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {areas?.map((a, i) => (
                <Area key={i} type="monotone" dataKey={a.key} name={a.name || a.key}
                  stroke={a.color} fill={a.color} fillOpacity={0.15}
                  strokeWidth={1.5} dot={false} />
              ))}
              {lines?.map((l, i) => (
                <Line key={i} type="monotone" dataKey={l.key} name={l.name || l.key}
                  stroke={l.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))}
              {bars?.map((b, i) => (
                <Bar key={i} dataKey={b.key} name={b.name || b.key}
                  fill={b.color} fillOpacity={0.75} radius={[2, 2, 0, 0]} />
              ))}
              <Brush dataKey="date" height={22} stroke="var(--card-border)"
                fill="var(--bg2)" travellerWidth={8} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default function Historical({ location }) {
  const today = new Date();
  const twoYearsAgo = subYears(today, 2);

  const [startDate, setStartDate] = useState(subYears(today, 1));
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState(null);
  const [aqData, setAqData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const loadData = useCallback(async () => {
    if (!location || !startDate || !endDate) return;

    // Enforce 2-year max
    const diff = differenceInDays(endDate, startDate);
    if (diff > 731) {
      setError('Please select a date range of at most 2 years.');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setAqData(null);

    const s = toDateStr(startDate);
    const e = toDateStr(endDate);

    try {
      const [w, aq] = await Promise.all([
        fetchHistoricalWeather(location.lat, location.lon, s, e),
        fetchHistoricalAirQuality(location.lat, location.lon, s, e),
      ]);
      setData(w);
      setAqData(aq);
    } catch (err) {
      setError(err.message || 'Failed to fetch historical data');
    } finally {
      setLoading(false);
    }
  }, [location, startDate, endDate]);

  // Build daily chart data
  const buildDailyData = () => {
    if (!data?.daily) return [];
    const { time, temperature_2m_mean, temperature_2m_max, temperature_2m_min,
      sunrise, sunset, precipitation_sum, wind_speed_10m_max, wind_direction_10m_dominant } = data.daily;

    return time.map((t, i) => ({
      date: format(new Date(t), 'dd MMM'),
      tempMean: temperature_2m_mean?.[i],
      tempMax: temperature_2m_max?.[i],
      tempMin: temperature_2m_min?.[i],
      sunrise: (() => {
        try { return parseFloat(format(new Date(sunrise[i]), 'H.mm')); } catch { return null; }
      })(),
      sunset: (() => {
        try { return parseFloat(format(new Date(sunset[i]), 'H.mm')); } catch { return null; }
      })(),
      precipitation: precipitation_sum?.[i],
      windMax: wind_speed_10m_max?.[i],
      windDir: wind_direction_10m_dominant?.[i],
    }));
  };

  // Build daily AQ data (aggregate hourly to daily)
  const buildAqDailyData = () => {
    if (!aqData?.hourly) return [];
    const { time, pm10, pm2_5 } = aqData.hourly;

    // Group by date
    const byDate = {};
    time.forEach((t, i) => {
      const d = toDateStr(new Date(t));
      if (!byDate[d]) byDate[d] = { pm10: [], pm25: [] };
      if (pm10[i] != null) byDate[d].pm10.push(pm10[i]);
      if (pm2_5[i] != null) byDate[d].pm25.push(pm2_5[i]);
    });

    return Object.entries(byDate).map(([date, vals]) => ({
      date: format(new Date(date), 'dd MMM'),
      pm10: vals.pm10.length ? vals.pm10.reduce((a, b) => a + b, 0) / vals.pm10.length : null,
      pm25: vals.pm25.length ? vals.pm25.reduce((a, b) => a + b, 0) / vals.pm25.length : null,
    }));
  };

  const dailyData = buildDailyData();
  const aqDailyData = buildAqDailyData();

  return (
    <div className="hist-page container">
      <div className="hist-header">
        <div>
          <h1 className="hist-title">📅 Historical Data</h1>
          <p className="hist-subtitle">Analyze up to 2 years of weather trends · {location?.city}</p>
        </div>
      </div>

      {/* Date range picker */}
      <div className="card hist-picker fade-in">
        <div className="picker-row">
          <div className="picker-group">
            <label className="ds-label">Select Date Range (max 2 years)</label>
            <ReactDatePicker
              selected={startDate}
              onChange={handleDateChange}
              startDate={startDate}
              endDate={endDate}
              selectsRange
              maxDate={today}
              minDate={twoYearsAgo}
              dateFormat="dd MMM yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              placeholderText="Select date range"
              inline={false}
            />
          </div>
          <div className="picker-info">
            {startDate && endDate && (
              <>
                <div className="pi-row">
                  <span>From</span>
                  <strong>{format(startDate, 'dd MMM yyyy')}</strong>
                </div>
                <div className="pi-row">
                  <span>To</span>
                  <strong>{format(endDate, 'dd MMM yyyy')}</strong>
                </div>
                <div className="pi-row">
                  <span>Duration</span>
                  <strong>{differenceInDays(endDate, startDate)} days</strong>
                </div>
              </>
            )}
          </div>
          <button
            className="fetch-btn"
            onClick={loadData}
            disabled={loading || !startDate || !endDate}>
            {loading ? 'Loading…' : '📊 Fetch Data'}
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading && (
        <div className="hist-loading">
          <div className="loader" />
          <p>Fetching historical data… this may take a moment.</p>
        </div>
      )}

      {!loading && data && (
        <div className="hist-charts fade-in">
          <h2 className="section-title">🌡️ Temperature Trends</h2>
          <HistoricalChart
            title="Temperature — Mean, Max & Min (°C)"
            data={dailyData}
            areas={[
              { key: 'tempMax', name: 'Max Temp', color: '#fb923c' },
              { key: 'tempMin', name: 'Min Temp', color: '#38bdf8' },
            ]}
            lines={[
              { key: 'tempMean', name: 'Mean Temp', color: '#fbbf24' },
            ]}
            unit="°C"
          />

          <h2 className="section-title">🌅 Sun Cycle (IST Hours)</h2>
          <HistoricalChart
            title="Sunrise & Sunset (hour of day, IST)"
            data={dailyData}
            lines={[
              { key: 'sunrise', name: 'Sunrise (h)', color: '#fbbf24' },
              { key: 'sunset', name: 'Sunset (h)', color: '#f97316' },
            ]}
            unit="h"
          />

          <h2 className="section-title">🌧️ Precipitation</h2>
          <HistoricalChart
            title="Daily Total Precipitation (mm)"
            data={dailyData}
            bars={[{ key: 'precipitation', name: 'Precipitation', color: '#818cf8' }]}
            unit=" mm"
          />

          <h2 className="section-title">💨 Wind</h2>
          <HistoricalChart
            title="Max Wind Speed (km/h)"
            data={dailyData}
            lines={[{ key: 'windMax', name: 'Max Wind Speed', color: '#34d399' }]}
            unit=" km/h"
          />

          <h2 className="section-title">🌫️ Air Quality Trends</h2>
          {aqDailyData.length > 0 ? (
            <HistoricalChart
              title="PM10 & PM2.5 Daily Averages (µg/m³)"
              data={aqDailyData}
              lines={[
                { key: 'pm10', name: 'PM10', color: '#fb923c' },
                { key: 'pm25', name: 'PM2.5', color: '#f87171' },
              ]}
              unit=" µg/m³"
            />
          ) : (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>
              Air quality historical data unavailable for this range.
            </div>
          )}
        </div>
      )}

      {!loading && !data && !error && (
        <div className="hist-empty">
          <div className="empty-icon">📊</div>
          <p>Select a date range and click <strong>Fetch Data</strong> to view historical trends.</p>
        </div>
      )}
    </div>
  );
}
