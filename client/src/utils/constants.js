export const PIPELINE_STAGES = [
  { id: 'applied', label: 'Applied', icon: '📥', color: '#6366f1' },
  { id: 'under-review', label: 'Under Review', icon: '🔍', color: '#3b82f6' },
  { id: 'shortlisted', label: 'Shortlisted', icon: '⭐', color: '#10b981' },
  { id: 'interview-scheduled', label: 'Interview', icon: '📅', color: '#f59e0b' },
  { id: 'selected', label: 'Selected', icon: '✅', color: '#10b981' },
  { id: 'rejected', label: 'Rejected', icon: '❌', color: '#f43f5e' }
];

export const ROLE_CATEGORIES = [
  'Architecture & Design',
  'Landscape & Urban',
  'Interior Design',
  'Engineering',
  'Technical & Support',
  'Operations'
];

export const STATUS_LABELS = {
  'new': 'New',
  'processing': 'Processing',
  'reviewed': 'Reviewed',
  'review-needed': 'Review Needed',
  'shortlisted': 'Shortlisted',
  'interview': 'Interview',
  'selected': 'Selected',
  'rejected': 'Rejected',
  'on-hold': 'On Hold'
};

export const SCORE_COLORS = {
  excellent: '#10b981',
  good: '#3b82f6',
  average: '#f59e0b',
  poor: '#f43f5e'
};

export function getScoreClass(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  return 'poor';
}

export function getScoreColor(score) {
  return SCORE_COLORS[getScoreClass(score)];
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}
