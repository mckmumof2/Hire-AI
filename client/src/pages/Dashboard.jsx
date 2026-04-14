import React from 'react';
import DashboardStats from '../components/DashboardStats';
import CandidateTable from '../components/CandidateTable';
import JobListingCard from '../components/JobListingCard';

const Dashboard = ({ candidates, jobs, onSelectCandidate, onSelectJob, onUpload }) => {
  const stats = {
    total: candidates.length,
    shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
    interviews: candidates.filter(c => c.status === 'interview').length,
    hired: candidates.filter(c => c.status === 'selected').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
  };

  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
    .slice(0, 5);

  const activeJobs = jobs.filter(j => j.status === 'active').slice(0, 3);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Recruitment Dashboard</h1>
          <div className="subtitle">Welcome back! Here's what's happening with your hiring pipeline.</div>
        </div>
        <button className="btn btn-primary" onClick={onUpload}>+ Upload CV/Portfolio</button>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3>Recent Applications</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => window.location.hash = '#candidates'}>View All</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <CandidateTable candidates={recentCandidates} onSelect={onSelectCandidate} />
          </div>
        </div>

        <div className="recent-jobs">
          <div className="card-header" style={{ padding: '0 0 16px 0', border: 'none' }}>
            <h3>Active Job Openings</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeJobs.map(job => (
              <JobListingCard key={job.id} job={job} onView={onSelectJob} />
            ))}
            {activeJobs.length === 0 && (
              <div className="empty-state" style={{ padding: '20px' }}>
                <p>No active jobs. Post a new role to start hiring.</p>
              </div>
            )}
            <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => window.location.hash = '#jobs'}>Manage All Jobs</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
