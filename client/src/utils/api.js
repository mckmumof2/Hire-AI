const API_BASE = '/api';

async function request(url, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  
  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
    config.body = options.body;
  }

  const res = await fetch(`${API_BASE}${url}`, config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Candidates
  getCandidates: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/candidates${qs ? '?' + qs : ''}`);
  },
  getCandidate: (id) => request(`/candidates/${id}`),
  uploadCandidate: (formData) => request('/candidates', { method: 'POST', body: formData }),
  updateStatus: (id, status, pipelineStage) => request(`/candidates/${id}/status`, { method: 'PATCH', body: { status, pipelineStage } }),
  updateRemarks: (id, data) => request(`/candidates/${id}/remarks`, { method: 'PATCH', body: data }),
  verifyCandidate: (id, verified) => request(`/candidates/${id}/verify`, { method: 'PATCH', body: { verified } }),
  assessCandidate: (id) => request(`/candidates/${id}/assess`, { method: 'POST' }),
  bulkAssess: () => request('/candidates/bulk-assess', { method: 'POST' }),
  deleteCandidate: (id) => request(`/candidates/${id}`, { method: 'DELETE' }),

  // Jobs
  getJobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/jobs${qs ? '?' + qs : ''}`);
  },
  getJob: (id) => request(`/jobs/${id}`),
  getRoles: () => request('/jobs/roles'),
  createJob: (data) => request('/jobs', { method: 'POST', body: data }),
  updateJob: (id, data) => request(`/jobs/${id}`, { method: 'PATCH', body: data }),
  deleteJob: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),

  // Analysis
  analyzeCV: (candidateId) => request('/analysis/cv', { method: 'POST', body: { candidateId } }),
  analyzePortfolio: (candidateId) => request('/analysis/portfolio', { method: 'POST', body: { candidateId } }),
  fullAnalysis: (candidateId, targetRole) => request('/analysis/full', { method: 'POST', body: { candidateId, targetRole } }),
  compareCandidates: (candidateIds) => request('/analysis/compare', { method: 'POST', body: { candidateIds } }),

  // Pipeline
  getPipeline: (jobId) => request(jobId ? `/pipeline/${jobId}` : '/pipeline'),
  moveCandidate: (candidateId, stage) => request('/pipeline/move', { method: 'PATCH', body: { candidateId, stage } }),

  // Health
  health: () => request('/health').catch(() => ({ status: 'error' }))
};
