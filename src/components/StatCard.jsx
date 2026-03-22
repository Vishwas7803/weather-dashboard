import './StatCard.css';

export default function StatCard({ icon, label, value, unit, sub, color, badge }) {
  return (
    <div className="stat-card card fade-in">
      <div className="stat-top">
        <span className="stat-icon">{icon}</span>
        {badge && (
          <span className="stat-badge" style={{ background: badge.color + '22', color: badge.color }}>
            {badge.label}
          </span>
        )}
      </div>
      <div className="stat-value" style={color ? { color } : {}}>
        {value ?? '--'}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
