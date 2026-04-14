import React from 'react';

const AIInsightsPanel = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <span className="ai-icon">✨</span> AI Core Assessment Insights
      </div>

      <div className="ai-section">
        <h4>💪 Key Strengths</h4>
        <div className="ai-tag-list">
          {analysis.strengths?.map((s, i) => (
            <span key={i} className="ai-tag strength">✔️ {s}</span>
          ))}
          {(!analysis.strengths || analysis.strengths.length === 0) && <span className="ai-tag info">No specific strengths identified</span>}
        </div>
      </div>

      <div className="ai-section">
        <h4>⚠️ Potential Gaps / Red Flags</h4>
        <div className="ai-tag-list">
          {analysis.redFlags?.map((f, i) => (
            <span key={i} className="ai-tag danger">🚩 {f}</span>
          )) || analysis.weaknesses?.map((w, i) => (
            <span key={i} className="ai-tag danger">🚩 {w}</span>
          ))}
          {analysis.missingElements?.map((m, i) => (
            <span key={i} className="ai-tag warning">❓ Missing: {m}</span>
          ))}
          {(!analysis.redFlags?.length && !analysis.missingElements?.length && !analysis.weaknesses?.length) && <span className="ai-tag info">No flags detected</span>}
        </div>
      </div>

      <div className="ai-section">
        <h4>🛠️ Technical Scorecard</h4>
        <div className="ai-score-grid">
          <div className="ai-score-item">
            <span className="label">Technical Depth</span>
            <span className="value">{analysis.domainInsights?.technicalCompetence || analysis.technicalDepth || 0}/100</span>
          </div>
          <div className="ai-score-item">
            <span className="label">Construction Knowledge</span>
            <span className="value">{analysis.domainInsights?.constructionUnderstanding || analysis.constructionUnderstanding || 0}/100</span>
          </div>
          <div className="ai-score-item">
            <span className="label">Software Proficiency</span>
            <span className="value">{analysis.domainInsights?.softwareReadiness || 0}/100</span>
          </div>
          <div className="ai-score-item">
            <span className="label">Govt Project Readiness</span>
            <span className="value">{analysis.domainInsights?.govtProjectReadiness || 0}/100</span>
          </div>
        </div>
      </div>

      <div className="ai-section">
        <h4>🔖 Technical Proficiency Badges</h4>
        <div className="ai-tag-list">
          {analysis.governmentExperience && <span className="ai-tag success">🏛️ Govt Project Ready</span>}
          {analysis.dprExperience && <span className="ai-tag success">📋 DPR Specialist</span>}
          {analysis.gfcExperience && <span className="ai-tag success">📐 GFC Expert</span>}
          {analysis.siteCoordinationExperience && <span className="ai-tag info">🚧 Site Coordination</span>}
          {analysis.tenderExperience && <span className="ai-tag info">⚖️ Tendering Pro</span>}
          {(!analysis.governmentExperience && !analysis.dprExperience && !analysis.gfcExperience) && (
            <span className="ai-tag warning">Standard Residential/Commercial Focus</span>
          )}
        </div>
      </div>

      <div className="ai-section">
        <h4>💼 Role Fit Suggestions</h4>
        <div className="ai-tag-list">
          {analysis.roleFitSuggestions?.map((fit, i) => (
            <span key={i} className="ai-tag info" title={fit.reason}>
              {fit.role} ({fit.fitScore}%)
            </span>
          ))}
        </div>
      </div>

      <div className="ai-section">
        <h4>📋 Domain Summary</h4>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          {analysis.summary || 'No summary available.'}
        </p>
      </div>

      <div className="ai-section">
        <h4>🖋️ Interview Focus Areas</h4>
        <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '20px' }}>
          {analysis.interviewFocusAreas?.map((area, i) => (
            <li key={i} style={{ marginBottom: '4px' }}>{area}</li>
          ))}
          {(!analysis.interviewFocusAreas || analysis.interviewFocusAreas.length === 0) && <li>No specific focus areas suggested yet.</li>}
        </ul>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
