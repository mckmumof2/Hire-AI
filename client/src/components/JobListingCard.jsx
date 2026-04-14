import React from 'react';
import { formatDate } from '../utils/constants';

const JobListingCard = ({ job, onView, onEdit, onDelete }) => {
  return (
    <div className="job-card" onClick={() => onView(job)}>
      <div className="cc-header">
        <div>
          <div className="job-title">{job.title}</div>
          <div className="job-category">{job.category} • {job.department}</div>
        </div>
        <span className={`badge-status ${job.status}`}>
          <span className="dot"></span>
          {job.status}
        </span>
      </div>

      <div className="job-meta">
        <span>📍 {job.location || 'Remote'}</span>
        <span>🕒 {job.experienceRange.min}-{job.experienceRange.max} Yrs</span>
        <span>💰 {job.salaryRange || 'Not disclosed'}</span>
      </div>

      <div className="jobs-footer">
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Posted: {formatDate(job.createdAt)}
        </div>
        <div style={{ fontWeight: '700', color: 'var(--accent-light)' }}>
          {job.applicantCount || 0} Applicants
        </div>
      </div>
    </div>
  );
};

export default JobListingCard;
