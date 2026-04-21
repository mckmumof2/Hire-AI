import React, { useState, useRef } from 'react';
import { api } from '../utils/api';

const UploadModal = ({ onClose, onUploadComplete }) => {
  const [files, setFiles] = useState({ cv: null, portfolio: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    appliedRole: ''
  });
  
  const cvInputRef = useRef();
  const portfolioInputRef = useRef();

  const handleFileChange = (e, field) => {
    if (field === 'cv') {
      setFiles({ ...files, cv: e.target.files[0] });
    } else {
      setFiles({ ...files, portfolio: [...files.portfolio, ...Array.from(e.target.files)] });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files.cv) return alert('Please select a CV/Resume (PDF)');
    
    setIsUploading(true);
    setProgress(20);

    const data = new FormData();
    data.append('cv', files.cv);
    files.portfolio.forEach(f => data.append('portfolio', f));
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('appliedRole', formData.appliedRole);

    try {
      setProgress(50);
      const res = await api.uploadCandidate(data);
      console.log('Upload response:', res);
      setProgress(100);
      
      const candidate = res.candidate || res;
      setTimeout(() => {
        try {
          if (candidate && candidate.id) {
            onUploadComplete(candidate);
          } else {
            // Even if response is unexpected, close the modal
            console.warn('Upload succeeded but candidate data missing, closing modal');
            onClose();
          }
        } catch (callbackErr) {
          console.error('Error in upload callback:', callbackErr);
          onClose();
        }
      }, 600);
    } catch (err) {
      console.error('Upload failed:', err);
      alert(`Upload failed: ${err.message}`);
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Upload Candidate Profile</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-body" onSubmit={handleUpload}>
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Candidate Name" 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Applied Role</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.appliedRole}
                onChange={(e) => setFormData({...formData, appliedRole: e.target.value})}
                placeholder="e.g. Senior Architect" 
              />
            </div>
            <div className="form-group">
              <label>Email ID</label>
              <input 
                type="email" 
                className="form-control" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@example.com" 
              />
            </div>
          </div>

          <div className="form-group">
            <label>CV / Resume (Required PDF)</label>
            <div className="upload-zone" onClick={() => cvInputRef.current.click()}>
              <input type="file" ref={cvInputRef} accept=".pdf" hidden onChange={(e) => handleFileChange(e, 'cv')} />
              <div className="upload-icon">📄</div>
              <div className="upload-text">{files.cv ? files.cv.name : 'Click to upload CV (PDF only)'}</div>
            </div>
          </div>

          <div className="form-group">
            <label>Portfolio / Samples (Optional PDF/Images)</label>
            <div className="upload-zone" onClick={() => portfolioInputRef.current.click()}>
              <input type="file" ref={portfolioInputRef} multiple accept=".pdf,.jpg,.png" hidden onChange={(e) => handleFileChange(e, 'portfolio')} />
              <div className="upload-icon">🖼️</div>
              <div className="upload-text">
                {files.portfolio.length > 0 ? `${files.portfolio.length} files selected` : 'Click to upload Portfolio pages'}
              </div>
              <div className="upload-hint">Upload technical drawings/renders for AI vision analysis</div>
            </div>
          </div>

          {isUploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="upload-hint" style={{ textAlign: 'center' }}>
                {progress < 100 ? 'Uploading and analyzing documents...' : 'Complete! Finalizing...'}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isUploading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isUploading || !files.cv}>
              {isUploading ? 'Uploading...' : 'Analyze & Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
