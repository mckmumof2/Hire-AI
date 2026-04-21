import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Jobs from './pages/Jobs';
import Pipeline from './pages/Pipeline';
import Settings from './pages/Settings';
import PublicApply from './pages/PublicApply';
import Login from './pages/Login';
import CandidateDetail from './components/CandidateDetail';
import UploadModal from './components/UploadModal';
import { api } from './utils/api';

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simple hash-based router
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      setActivePage(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    window.location.hash = activePage;
  }, [activePage]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candsData, jobsData, rolesData] = await Promise.all([
          api.getCandidates(),
          api.getJobs(),
          api.getRoles()
        ]);
        setCandidates(candsData.candidates || []);
        setJobs(jobsData.jobs || []);
        setRoles(rolesData.roles || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUploadComplete = (newCandidate) => {
    if (newCandidate) {
      setCandidates(prev => [newCandidate, ...prev]);
    }
    // Optionally trigger analysis check or refresh later
  };

  const handleMoveCandidate = async (candidateId, stage) => {
    try {
      const res = await api.moveCandidate(candidateId, stage);
      setCandidates(candidates.map(c => c.id === candidateId ? res.candidate : c));
    } catch (err) {
      alert(`Failed to move candidate: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (candidateId, status, stage) => {
    try {
      const res = await api.updateStatus(candidateId, status, stage);
      setCandidates(candidates.map(c => c.id === candidateId ? res : c));
      if (selectedCandidate?.id === candidateId) setSelectedCandidate(res);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleVerifyCandidate = async (candidateId, verified) => {
    try {
      const res = await api.verifyCandidate(candidateId, verified);
      setCandidates(candidates.map(c => c.id === candidateId ? res : c));
      if (selectedCandidate?.id === candidateId) setSelectedCandidate(res);
    } catch (err) {
      alert(`Failed to verify candidate: ${err.message}`);
    }
  };

  const handleSortCandidates = async (roleId) => {
    setLoading(true);
    try {
      const res = await api.getCandidates({ sortByRole: roleId });
      setCandidates(res.candidates || []);
    } catch (err) {
      console.error('Failed to sort candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssess = async () => {
    try {
      const res = await api.bulkAssess();
      alert(res.message);
      // Refresh candidates to show 'processing' status
      const candsData = await api.getCandidates();
      setCandidates(candsData.candidates || []);
    } catch (err) {
      alert(`Bulk assessment failed: ${err.message}`);
    }
  };

  const handleAssessCandidate = async (candidateId) => {
    try {
      const res = await api.assessCandidate(candidateId);
      alert(res.message);
      // Refresh to update status
      const candsData = await api.getCandidates();
      setCandidates(candsData.candidates || []);
      const updated = (candsData.candidates || []).find(c => c.id === candidateId);
      if (updated && selectedCandidate?.id === candidateId) setSelectedCandidate(updated);
    } catch (err) {
      alert(`Manual assessment failed: ${err.message}`);
    }
  };

  const handleCreateJob = async (jobData) => {
    try {
      const res = await api.createJob(jobData);
      setJobs([res, ...jobs]);
    } catch (err) {
      alert(`Failed to create job: ${err.message}`);
    }
  };

  const renderPage = () => {
    if (loading) return <div className="loading-state"><div className="spinner"></div>Loading your recruitment data...</div>;

    switch (activePage) {
      case 'dashboard':
        return <Dashboard 
          candidates={candidates} 
          jobs={jobs} 
          onSelectCandidate={setSelectedCandidate}
          onSelectJob={(job) => { /* Handle job selection */ }}
          onUpload={() => setShowUpload(true)}
        />;
      case 'candidates':
        return <Candidates 
          candidates={candidates} 
          roles={roles}
          onSelect={setSelectedCandidate}
          onUploadComplete={handleUploadComplete}
          onSortByRole={handleSortCandidates}
          onBulkAssess={handleBulkAssess}
          onUpload={() => setShowUpload(true)}
        />;
      case 'jobs':
        return <Jobs 
          jobs={jobs} 
          onCreate={handleCreateJob}
          onUpdate={(id, data) => api.updateJob(id, data).then(res => setJobs(jobs.map(j => j.id === id ? res : j)))}
          onDelete={(id) => api.deleteJob(id).then(() => setJobs(jobs.filter(j => j.id !== id)))}
          onSelect={(job) => { /* Show job applicants */ }}
        />;
      case 'pipeline':
        return <Pipeline 
          candidates={candidates} 
          onMoveCandidate={handleMoveCandidate}
          onSelectCandidate={setSelectedCandidate}
        />;
      case 'settings':
        return <Settings />;
      case 'apply':
        return <PublicApply roles={roles} />;
      default:
        return <Dashboard candidates={candidates} jobs={jobs} onSelectCandidate={setSelectedCandidate} onUpload={() => setShowUpload(true)} />;
    }
  };

  const handleLogout = () => {
    // No-op for now as we've removed auth
  };

  // Public applying mode
  if (activePage === 'apply') {
    return <PublicApply roles={roles} />;
  }

  return (
    <div className="app-layout">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
      />
      
      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <Header collapsed={collapsed} title={activePage.toUpperCase()} onLogout={handleLogout} />
        {renderPage()}
      </div>

      {selectedCandidate && (
        <CandidateDetail 
          candidate={selectedCandidate} 
          onClose={() => setSelectedCandidate(null)}
          onUpdateStatus={handleUpdateStatus}
          onVerify={handleVerifyCandidate}
          onAssess={handleAssessCandidate}
        />
      )}

      {showUpload && (
        <UploadModal 
          onClose={() => setShowUpload(false)}
          onUploadComplete={(nc) => { handleUploadComplete(nc); setShowUpload(false); }}
        />
      )}
    </div>
  );
};

export default App;
