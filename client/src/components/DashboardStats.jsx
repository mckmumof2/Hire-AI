import React from 'react';

const DashboardStats = ({ stats }) => {
  const cards = [
    { label: 'Total Applications', value: stats.total || 0, icon: '📄', color: 'blue', change: '+12%', up: true },
    { label: 'Shortlisted', value: stats.shortlisted || 0, icon: '⭐', color: 'green', change: '+5%', up: true },
    { label: 'Interviews', value: stats.interviews || 0, icon: '📅', color: 'amber', change: '-2%', up: false },
    { label: 'Hired', value: stats.hired || 0, icon: '✅', color: 'purple', change: '+3%', up: true },
    { label: 'Rejected', value: stats.rejected || 0, icon: '❌', color: 'rose', change: '+1%', up: false },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, i) => (
        <div key={i} className={`stat-card ${card.color}`}>
          <div className="stat-icon">{card.icon}</div>
          <div className="stat-value">{card.value}</div>
          <div className="stat-label">{card.label}</div>
          <div className={`stat-change ${card.up ? 'up' : 'down'}`}>
            <span>{card.up ? '↑' : '↓'}</span> {card.change} from last month
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
