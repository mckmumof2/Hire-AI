import React from 'react';

const Settings = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>System Settings</h1>
          <div className="subtitle">Configure AI parameters, role definitions, and firm-specific criteria.</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <div className="card-header">
          <h3>AI Analysis Configuration</h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>NVIDIA NIM API Status</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
              <span className="dot" style={{ backgroundColor: 'currentColor' }}></span> Connected (Active)
            </div>
          </div>

          <div className="form-group">
            <label>Model Configuration</label>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="label">Text Model</div>
                <div className="value">meta/llama-3.3-70b-instruct</div>
              </div>
              <div className="detail-item">
                <div className="label">Vision Model</div>
                <div className="value">meta/llama-3.2-90b-vision-instruct</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', marginTop: '24px' }}>
        <div className="card-header">
          <h3>Firm Configuration</h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>Firm Specialty</label>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Architecture, Engineering, Govt. Projects, DPRs, GFC Drawings</p>
          </div>
          <div className="form-group">
            <label>Upload Directory</label>
            <code style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px' }}>server/uploads/</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
