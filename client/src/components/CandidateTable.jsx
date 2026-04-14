import React from 'react';
import { formatDate, timeAgo } from '../utils/constants';
import ScoreIndicator from './ScoreIndicator';

const CandidateTable = ({ candidates, onSelect, recommendRole }) => {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            {recommendRole && <th>Match Fit</th>}
            <th>Role Applied</th>
            <th>Exp (Yrs)</th>
            <th>Status</th>
            <th>AI Overall</th>
            <th>Personal Notes</th>
            <th>Source</th>
            <th>Upload Date</th>
          </tr>
        </thead>
        <tbody>
          {candidates.length === 0 ? (
            <tr>
              <td colSpan={recommendRole ? "7" : "6"} style={{ textAlign: 'center', padding: '40px' }}>
                No candidates found.
              </td>
            </tr>
          ) : candidates.map((c) => (
            <tr key={c.id} onClick={() => onSelect(c)}>
              <td>
                <div className="candidate-name">{c.name} {c.verified && <span className="verify-badge" title="Data Verified">✓ Verified</span>}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email}</div>
              </td>
              {recommendRole && (
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ScoreIndicator score={c.tempMatchScore || 0} size={32} strokeWidth={4} />
                    <span style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{c.tempMatchScore || 0}%</span>
                  </div>
                </td>
              )}
              <td>
                <div className="candidate-role">{c.appliedRole || 'N/A'}</div>
              </td>
              <td>{c.experience || 0}</td>
              <td>
                <span className={`badge-status ${c.status || 'new'}`}>
                  <span className="dot"></span>
                  {c.status || 'New'}
                </span>
              </td>
              <td>
                <ScoreIndicator score={c.aiAnalysis?.overallScore || 0} size={36} strokeWidth={3} />
              </td>
              <td style={{ maxWidth: '200px' }}>
                <div className="personal-notes-cell" title={c.personalNotes}>
                  {c.personalNotes || <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                </div>
              </td>
              <td style={{ fontSize: '0.8rem' }}>
                <span className={`badge-source ${c.source === 'Public Link' ? 'public' : 'manual'}`}>
                  {c.source || 'Manual'}
                </span>
              </td>
              <td title={formatDate(c.uploadDate)}>{timeAgo(c.uploadDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CandidateTable;
