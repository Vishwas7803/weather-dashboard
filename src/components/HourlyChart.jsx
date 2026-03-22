import { useState, useMemo } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Brush
} from 'recharts';
import './HourlyChart.css';

// Custom tooltip
function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="ct-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="ct-row">
          <span className="ct-dot" style={{ background: p.color }} />
          <span className="ct-name">{p.name}</span>
          <span className="ct-val">{p.value != null ? Number(p.value).toFixed(1) : '--'}{p.unit || unit || ''}</span>
        </div>
      ))}
    </div>
  );
}

export default function HourlyChart({ title, data, lines, bars, unit, color, currentHour }) {
  // data: array of { time, ...values }
  const chartWidth = Math.max(data.length * 48, 600);

  return (
    <div className="hourly-chart card fade-in">
      <div className="hc-header">
        <h3 className="hc-title">{title}</h3>
        <span className="hc-hint">← scroll & use brush to zoom →</span>
      </div>
      <div className="chart-scroll">
        <div style={{ width: chartWidth, minWidth: '100%' }}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={2} />
              <YAxis tick={{ fontSize: 11 }} width={45} unit={unit} />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              {(lines?.length > 1 || bars?.length > 1) && <Legend />}
              {currentHour && (
                <ReferenceLine x={currentHour} stroke="rgba(56,189,248,0.5)"
                  strokeDasharray="4 4" label={{ value: 'Now', fill: 'var(--accent)', fontSize: 11 }} />
              )}
              {lines?.map((l, i) => (
                <Line key={i} type="monotone" dataKey={l.key} name={l.name || l.key}
                  stroke={l.color || color || 'var(--accent)'}
                  strokeWidth={2} dot={false} activeDot={{ r: 4 }}
                  unit={l.unit || unit} />
              ))}
              {bars?.map((b, i) => (
                <Bar key={i} dataKey={b.key} name={b.name || b.key}
                  fill={b.color || color || 'var(--accent)'}
                  fillOpacity={0.7} radius={[3, 3, 0, 0]} unit={b.unit || unit} />
              ))}
              <Brush dataKey="time" height={20} stroke="var(--card-border)"
                fill="var(--bg2)" travellerWidth={8}
                startIndex={0} endIndex={Math.min(11, data.length - 1)} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
