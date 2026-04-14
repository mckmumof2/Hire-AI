import React from 'react';

const Header = ({ collapsed, title, onLogout }) => {
  return (
    <header className={`header ${collapsed ? 'collapsed' : ''}`}>
      <div className="header-search">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Search candidates, jobs, or skills..." />
      </div>

      <div className="header-actions">
        <button className="header-btn" title="Notifications">
          <span>🔔</span>
          <div className="badge"></div>
        </button>
        <div className="header-avatar">VA</div>
      </div>
    </header>
  );
};

export default Header;
