import React from 'react';
import ScoreIndicator from './ScoreIndicator';

const CandidateCard = ({ candidate, onClick, recommendRole }) => {
  const skills = candidate.aiAnalysis?.softwareSkills?.slice(0, 4) || [];

  return (
    <div className="candidate-card" onClick={() => onClick(candidate)}>
      <div className="cc-header">
        <div>
          <div className="cc-name">
            {candidate.name}
            {candidate.verified && <span className="verify-badge" style={{ marginLeft: '8px' }}>✓</span>}
          </div>
          <div className="cc-role">{candidate.appliedRole || 'Architect'}</div>
        </div>
        <ScoreIndicator score={candidate.aiAnalysis?.overallScore || 0} size={40} strokeWidth={3.5} />
      </div>

      {recommendRole && (
        <div style={{ 
          marginTop: '8px', 
          padding: '8px', 
          background: 'var(--bg-tertiary)', 
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid var(--border-subtle)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Match Fit:</span>
          <span style={{ fontWeight: 800, color: 'var(--accent-light)' }}>{candidate.tempMatchScore || 0}%</span>
        </div>
      )}

      <div className="cc-skills">
        {skills.map((skill, i) => (
          <span key={i} className="skill-tag">
            {typeof skill === 'string' ? skill : skill.name}
          </span>
        ))}
      </div>

      <div className="cc-footer">
        <span className={`badge-status ${candidate.status || 'new'}`}>
          <span className="dot"></span>
          {candidate.status || 'New'}
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {candidate.experience || 0} Yrs Exp
        </span>
      </div>
    </div>
  );
};

export default CandidateCard;
