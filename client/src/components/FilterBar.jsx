import React from 'react';
import { ROLE_CATEGORIES, PIPELINE_STAGES } from '../utils/constants';

const FilterBar = ({ filters, onFilterChange, roles }) => {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Status</label>
        <select 
          className="filter-select" 
          value={filters.status || ''} 
          onChange={(e) => onFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview">Interview</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Applied Role</label>
        <select 
          className="filter-select" 
          value={filters.role || ''} 
          onChange={(e) => onFilterChange('role', e.target.value)}
        >
          <option value="">All Roles</option>
          {roles.map(r => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Min Experience</label>
        <input 
          type="number" 
          className="filter-input" 
          placeholder="Min Yrs" 
          value={filters.minExp || ''}
          onChange={(e) => onFilterChange('minExp', e.target.value)}
          style={{ width: '100px' }}
        />
      </div>

      <div className="filter-group">
        <label>AI Score Min</label>
        <input 
          type="number" 
          className="filter-input" 
          placeholder="Score %" 
          value={filters.minScore || ''}
          onChange={(e) => onFilterChange('minScore', e.target.value)}
          style={{ width: '100px' }}
        />
      </div>

      <div className="filter-group">
        <label>Software</label>
        <input 
          type="text" 
          className="filter-input" 
          placeholder="e.g. Revit" 
          value={filters.software || ''}
          onChange={(e) => onFilterChange('software', e.target.value)}
        />
      </div>

      <button className="btn btn-ghost" onClick={() => onFilterChange('clear', null)} style={{ marginTop: '20px' }}>
        Clear
      </button>
    </div>
  );
};

export default FilterBar;
