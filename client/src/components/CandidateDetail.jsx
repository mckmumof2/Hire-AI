import React, { useState, useEffect } from 'react';
import ScoreIndicator from './ScoreIndicator';
import AIInsightsPanel from './AIInsightsPanel';
import { formatDate } from '../utils/constants';

const CandidateDetail = ({ candidate, onClose, onUpdateStatus, onVerify, onAssess }) => {
  const [personalNotes, setPersonalNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (candidate) {
      setPersonalNotes(candidate.personalNotes || '');
    }
  }, [candidate]);

  if (!candidate) return null;

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/candidates/${candidate.id}/remarks`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personalNotes }),
      });
      if (response.ok) {
        // We could potentially update the parent state here, but for now we'll just show success
        candidate.personalNotes = personalNotes; // Optimistic update
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="detail-panel">
      <div className="detail-panel-header">
        <div>
          <h2>Candidate Details</h2>
          <div className="subtitle">{candidate.name} • {candidate.appliedRole}</div>
        </div>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>

      <div className="detail-panel-body">
        <div className="detail-section">
          <div className="ai-panel">
            <div className="ai-panel-header">
              <span className="ai-icon">🤖</span> AI Assessment Summary
            </div>
            <div className="ai-section">
              <div className="ai-score-grid">
                <div className="ai-score-item">
                  <span className="label">Overall Score</span>
                  <ScoreIndicator score={candidate.aiAnalysis?.overallScore || 0} size={48} strokeWidth={4} />
                </div>
                <div className="ai-score-item" style={{ flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                  <span className="label">Analysis Control</span>
                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
                    <button 
                      className={`btn btn-sm ${candidate.verified ? 'btn-success' : 'btn-ghost'}`}
                      onClick={() => onVerify(candidate.id, !candidate.verified)}
                      style={{ flex: 1 }}
                    >
                      {candidate.verified ? '✓ Data Verified' : 'Verify Data'}
                    </button>
                    <button 
                      className="btn btn-sm btn-ghost"
                      onClick={() => onAssess(candidate.id)}
                      style={{ flex: 1 }}
                      title="Manually trigger AI extraction"
                    >
                      🔄 Run AI Analysis
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {candidate.aiAnalysis?.roleFitSuggestions && (
              <div className="suitability-card">
                <div className="s-title">✨ AI-Suggested Suitability</div>
                <div className="s-list">
                  {candidate.aiAnalysis.roleFitSuggestions.slice(0, 3).map((fit, i) => (
                    <div key={i} className="s-item">
                      <span className="s-role">{fit.role}</span>
                      <span className="s-score">{fit.fitScore}% Match</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="detail-section">
          <h3>📋 Generic Extraction & Education</h3>
          <table className="verification-table">
            <tbody>
              <tr>
                <td className="v-label">Email ID</td>
                <td className="v-value">{candidate.email || (candidate.aiAnalysis?.email) || '—'}</td>
              </tr>
              <tr>
                <td className="v-label">Telephone</td>
                <td className="v-value">{candidate.phone || (candidate.aiAnalysis?.phone) || '—'}</td>
              </tr>
              {candidate.aiAnalysis?.education?.map((edu, i) => (
                <React.Fragment key={i}>
                  <tr>
                    <td className="v-label">School/College {i+1}</td>
                    <td className="v-value">{edu.institution}</td>
                  </tr>
                  <tr>
                    <td className="v-label">Passing Year</td>
                    <td className="v-value">{edu.year || '—'} ({edu.degree})</td>
                  </tr>
                </React.Fragment>
              ))}
              <tr>
                <td className="v-label">Total Experience</td>
                <td className="v-value">{candidate.experience || 0} Years</td>
              </tr>
              <tr>
                <td className="v-label">Category Fit</td>
                <td className="v-value" style={{ color: 'var(--accent-light)' }}>
                  {candidate.aiAnalysis?.roleFitSuggestions?.[0]?.role || candidate.aiAnalysis?.roleMatches?.[0]?.title || 'Architecture & Design'}
                </td>
              </tr>
              <tr>
                <td className="v-label">Source</td>
                <td className="v-value">
                  <span className={`badge-source ${candidate.source === 'Public Link' ? 'public' : 'manual'}`}>
                    {candidate.source || 'Manual'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="detail-section">
          <h3>✍️ Personal Notes (HR Comments)</h3>
          <div className="notes-editor">
            <textarea
              className="notes-textarea"
              placeholder="Add your comments here..."
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              rows={4}
            />
            <button 
              className={`btn btn-sm btn-primary ${isSaving ? 'loading' : ''}`}
              onClick={handleSaveNotes}
              disabled={isSaving}
              style={{ alignSelf: 'flex-end', marginTop: '8px' }}
            >
              {isSaving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>

        <div className="detail-section">
          <h3>🏗️ Technical & Govt Domains</h3>
          <div className="detail-grid">
            <div className="detail-item" style={{ borderLeft: candidate.aiAnalysis?.govtProjectReadiness > 50 ? '3px solid var(--success)' : '3px solid var(--border-subtle)' }}>
              <div className="label">Govt Project Ready</div>
              <div className="value">{candidate.aiAnalysis?.governmentExperience ? 'YES' : 'NO'}</div>
            </div>
            <div className="detail-item" style={{ borderLeft: candidate.aiAnalysis?.dprExperience ? '3px solid var(--success)' : '3px solid var(--border-subtle)' }}>
              <div className="label">DPR Preparation</div>
              <div className="value">{candidate.aiAnalysis?.dprExperience ? 'EXPERIENCED' : 'NONE'}</div>
            </div>
            <div className="detail-item" style={{ borderLeft: candidate.aiAnalysis?.gfcExperience ? '3px solid var(--success)' : '3px solid var(--border-subtle)' }}>
              <div className="label">GFC Drawings</div>
              <div className="value">{candidate.aiAnalysis?.gfcExperience ? 'EXPERIENCED' : 'NONE'}</div>
            </div>
            <div className="detail-item" style={{ borderLeft: candidate.aiAnalysis?.siteCoordinationExperience ? '3px solid var(--success)' : '3px solid var(--border-subtle)' }}>
              <div className="label">SiteCoordination</div>
              <div className="value">{candidate.aiAnalysis?.siteCoordinationExperience ? 'EXPERIENCED' : 'NONE'}</div>
            </div>
          </div>
        </div>

        {candidate.aiAnalysis && <AIInsightsPanel analysis={candidate.aiAnalysis} />}

        <div className="detail-section">
          <h3>📂 Document Files</h3>
          <div className="upload-file-list">
            {candidate.cvFile && (
              <div className="upload-file-item">
                <span className="file-icon">📄</span>
                <span className="file-name">{candidate.cvFile}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => window.open(`/uploads/${candidate.id}/cv/${candidate.cvFile}`)}>View CV</button>
              </div>
            )}
            {candidate.portfolioFiles?.map((file, i) => (
              <div key={i} className="upload-file-item">
                <span className="file-icon">🖼️</span>
                <span className="file-name">{file}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => window.open(`/uploads/${candidate.id}/portfolio/${file}`)}>View</button>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h3>💬 Status Management</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button className="btn btn-success" onClick={() => onUpdateStatus(candidate.id, 'shortlisted', 'shortlisted')}>Shortlist</button>
            <button className="btn btn-primary" onClick={() => onUpdateStatus(candidate.id, 'interview', 'interview-scheduled')}>Schedule Interview</button>
            <button className="btn btn-danger" onClick={() => onUpdateStatus(candidate.id, 'rejected', 'rejected')}>Reject</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;
