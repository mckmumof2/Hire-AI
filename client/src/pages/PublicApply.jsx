import React, { useState } from 'react';
import { api } from '../utils/api';

const PublicApply = ({ roles }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    appliedRole: '',
    hp_check: '' // Honeypot field
  });
  const [cvFile, setCvFile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.name === 'cv') setCvFile(e.target.files[0]);
    if (e.target.name === 'portfolio') setPortfolio(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvFile) {
      setError('Please upload your CV (PDF).');
      return;
    }

    setStatus('submitting');
    setError('');

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('source', 'Public Link');
    data.append('cv', cvFile);
    portfolio.forEach(file => data.append('portfolio', file));

    try {
      await api.uploadCandidate(data);
      setStatus('success');
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="public-apply-container">
        <div className="apply-card success-card">
          <div className="success-icon">✨</div>
          <h1>Application Received!</h1>
          <p>Thank you for applying. Our AI is currently analyzing your profile against our studio's standards. You will hear from us if your skills align with our current projects.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Submit Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-apply-container">
      <div className="apply-header">
        <div className="logo-placeholder">H</div>
        <h1>Hire AI — Smart Recruitment</h1>
        <p>Join our architecture studio and work on visionary projects.</p>
      </div>

      <div className="apply-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-group">
              <label>Full Name *</label>
              <input 
                type="text" 
                name="name" 
                required 
                placeholder="e.g. Rahul Kumar" 
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  placeholder="name@example.com" 
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input 
                  type="tel" 
                  name="phone" 
                  required 
                  placeholder="+91 XXXXX XXXXX" 
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Position Applied For *</label>
              <select 
                name="appliedRole" 
                required 
                value={formData.appliedRole}
                onChange={handleInputChange}
              >
                <option value="">Select a role...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.title}>{r.title}</option>
                ))}
                <option value="Architect">Architect</option>
                <option value="Draftsman">Draftsman</option>
                <option value="Intern">Intern</option>
              </select>
            </div>

            {/* Honeypot field (hidden from users) */}
            <input 
              type="text" 
              name="hp_check" 
              style={{ display: 'none' }} 
              tabIndex="-1" 
              autoComplete="off"
              value={formData.hp_check}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-section">
            <h3>Documents</h3>
            <div className="form-group">
              <label>Curriculum Vitae (CV) * <small>(PDF only, max 10MB)</small></label>
              <div className="file-upload-box">
                <input 
                  type="file" 
                  name="cv" 
                  accept=".pdf" 
                  required 
                  onChange={handleFileChange}
                />
                <div className="upload-hint">
                  {cvFile ? `Selected: ${cvFile.name}` : "Drop your CV here or click to browse"}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Portfolio / Sample Works <small>(PDF or Images, up to 5 files)</small></label>
              <div className="file-upload-box">
                <input 
                  type="file" 
                  name="portfolio" 
                  multiple 
                  accept=".pdf,image/*" 
                  onChange={handleFileChange}
                />
                <div className="upload-hint">
                  {portfolio.length > 0 ? `${portfolio.length} files selected` : "Upload drawings, GFCs, or 3D renders"}
                </div>
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className={`btn btn-primary btn-large ${status === 'submitting' ? 'loading' : ''}`}
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </form>
      </div>

      <div className="apply-footer">
        <p>© {new Date().getFullYear()} Hire AI. All submissions are automatically analyzed for technical proficiency.</p>
      </div>

      <style jsx>{`
        .public-apply-container {
          min-height: 100vh;
          background: radial-gradient(circle at top right, #1a1c2c, #0a0b10);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          color: white;
          font-family: 'Inter', sans-serif;
        }

        .apply-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .logo-placeholder {
          width: 60px;
          height: 60px;
          background: var(--accent-gradient);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 800;
          margin: 0 auto 20px;
          box-shadow: 0 0 20px rgba(100, 108, 255, 0.4);
        }

        .apply-header h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .apply-card {
          width: 100%;
          max-width: 700px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        }

        .apply-card.success-card {
          text-align: center;
          padding: 60px 40px;
        }

        .success-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .form-section {
          margin-bottom: 32px;
        }

        .form-section h3 {
          font-size: 1.2rem;
          margin-bottom: 20px;
          color: var(--accent-light);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 10px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .form-group input, 
        .form-group select {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-group input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 10px rgba(100, 108, 255, 0.2);
          outline: none;
        }

        .file-upload-box {
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          border: 2px dashed rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 30px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .file-upload-box:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--accent-primary);
        }

        .file-upload-box input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .upload-hint {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }

        .btn-large {
          width: 100%;
          padding: 16px;
          font-size: 1.1rem;
          margin-top: 20px;
        }

        .error-message {
          background: rgba(255, 71, 87, 0.1);
          color: #ff4757;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 0.9rem;
          border: 1px solid rgba(255, 71, 87, 0.2);
        }

        .apply-footer {
          margin-top: 40px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          .apply-card {
            padding: 20px;
          }
          .apply-header h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PublicApply;
