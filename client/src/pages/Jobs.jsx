import React, { useState } from 'react';
import JobListingCard from '../components/JobListingCard';
import JobListingForm from '../components/JobListingForm';

const Jobs = ({ jobs, onSelect, onCreate, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const handleCreate = (data) => {
    onCreate(data);
    setShowForm(false);
  };

  const handleUpdate = (data) => {
    onUpdate(editingJob.id, data);
    setEditingJob(null);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Active Job Listings</h1>
          <div className="subtitle">Manage open roles and track applicant volume for each position.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Post New Job</button>
      </div>

      <div className="jobs-grid">
        {jobs.map(job => (
          <JobListingCard 
            key={job.id} 
            job={job} 
            onView={onSelect} 
            onEdit={(j) => setEditingJob(j)}
          />
        ))}

        {jobs.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">💼</div>
            <h3>No job listings yet</h3>
            <p>Start by creating a new job opening to attract candidates.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>Post My First Job</button>
          </div>
        )}
      </div>

      {(showForm || editingJob) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingJob ? 'Edit Job Listing' : 'Post New Opening'}</h2>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditingJob(null); }}>×</button>
            </div>
            <div className="modal-body">
              <JobListingForm 
                initialData={editingJob} 
                onSubmit={editingJob ? handleUpdate : handleCreate}
                onCancel={() => { setShowForm(false); setEditingJob(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
