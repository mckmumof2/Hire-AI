import React, { useState } from 'react';
import FilterBar from '../components/FilterBar';
import CandidateTable from '../components/CandidateTable';
import CandidateCard from '../components/CandidateCard';
import RecommendationBar from '../components/RecommendationBar';

const Candidates = ({ candidates, roles, onSelect, onUploadComplete, onSortByRole, onBulkAssess, onUpload }) => {
  const [viewType, setViewType] = useState('table');
  const [recommendRole, setRecommendRole] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    role: '',
    minScore: '',
    minExp: '',
    software: '',
    search: ''
  });

  const handleFilterChange = (key, value) => {
    if (key === 'clear') {
      setFilters({ status: '', role: '', minScore: '', minExp: '', software: '', search: '' });
      setRecommendRole(null);
      onSortByRole(null);
    } else {
      setFilters({ ...filters, [key]: value });
    }
  };

  const handleRecommend = (roleId) => {
    setRecommendRole(roleId);
    onSortByRole(roleId);
  };

  const filteredCandidates = candidates.filter(c => {
    if (filters.status && c.status !== filters.status) return false;
    if (filters.role && c.appliedRole !== filters.role) return false;
    if (filters.minScore && (c.aiAnalysis?.overallScore || 0) < parseInt(filters.minScore)) return false;
    if (filters.minExp && (c.experience || 0) < parseInt(filters.minExp)) return false;
    if (filters.software && !c.aiAnalysis?.softwareSkills?.some(s => 
      (typeof s === 'string' ? s : s.name).toLowerCase().includes(filters.software.toLowerCase())
    )) return false;
    if (filters.search && !c.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Candidate Repository</h1>
          <div className="subtitle">Displaying {filteredCandidates.length} potential matches for your firm.</div>
        </div>
        <div className="page-header-actions">
          <div className="view-toggle">
            <button className={viewType === 'table' ? 'active' : ''} onClick={() => setViewType('table')}>Table</button>
            <button className={viewType === 'grid' ? 'active' : ''} onClick={() => setViewType('grid')}>Grid</button>
          </div>
          <button className="btn btn-ghost" onClick={onBulkAssess}>Analyze All Pending</button>
          <button className="btn btn-primary" onClick={onUpload}>+ Upload CV/Portfolio</button>
        </div>
      </div>

      <RecommendationBar 
        roles={roles} 
        activeRole={recommendRole} 
        onSelectRole={handleRecommend} 
      />

      <FilterBar filters={filters} onFilterChange={handleFilterChange} roles={roles} />

      {viewType === 'table' ? (
        <CandidateTable 
          candidates={filteredCandidates} 
          onSelect={onSelect} 
          recommendRole={recommendRole}
        />
      ) : (
        <div className="candidates-grid">
          {filteredCandidates.map(c => (
            <CandidateCard 
              key={c.id} 
              candidate={c} 
              onClick={onSelect} 
              recommendRole={recommendRole}
            />
          ))}
          {filteredCandidates.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-icon">👥</div>
              <h3>No candidates found</h3>
              <p>Try adjusting your filters or upload a new candidate.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Candidates;
