import React, { useState } from 'react';

const RecommendationBar = ({ roles, activeRole, onSelectRole }) => {
  // Group roles by category
  const categories = roles.reduce((acc, role) => {
    if (!acc[role.category]) acc[role.category] = [];
    acc[role.category].push(role);
    return acc;
  }, {});

  const [expandedCategory, setExpandedCategory] = useState(null);

  return (
    <div className="recommendation-bar-container">
      <div className="rb-label">
        <span className="ai-stars">✨</span> Recommend for Position:
      </div>
      
      <div className="rb-scroll-view">
        <button 
          className={`rb-chip ${!activeRole ? 'active' : ''}`}
          onClick={() => onSelectRole(null)}
        >
          All Candidates
        </button>

        {Object.keys(categories).map((cat) => (
          <div key={cat} className="rb-category-group">
            <div 
              className={`rb-category-label ${expandedCategory === cat ? 'expanded' : ''}`}
              onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
            >
              {cat} <span className="chevron">{expandedCategory === cat ? '▾' : '▸'}</span>
            </div>
            
            {(expandedCategory === cat || !expandedCategory) && (
              <div className="rb-role-list">
                {categories[cat].map((role) => (
                  <button
                    key={role.id}
                    className={`rb-chip ${activeRole === role.id ? 'active' : ''}`}
                    onClick={() => onSelectRole(role.id)}
                    title={role.title}
                  >
                    {role.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationBar;
