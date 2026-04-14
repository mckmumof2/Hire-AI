const path = require('path');
const roles = require('../data/roles.json');

/**
 * Match a candidate's extracted data against all role definitions
 * Returns top matching roles with scores
 */
function matchCandidateToRoles(candidateData) {
  const results = roles.map(role => {
    const score = calculateRoleScore(candidateData, role);
    return {
      roleId: role.id,
      title: role.title,
      category: role.category,
      score: Math.round(score * 100) / 100,
      experienceRange: role.experienceRange,
      matchDetails: getMatchDetails(candidateData, role)
    };
  });

  // Sort by score descending and return top 5
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * Calculate overall fit score for a candidate against a specific role
 */
function calculateRoleScore(candidate, role) {
  let score = 0;
  const criteria = role.evaluationCriteria;

  // Education score
  const eduScore = calculateEducationScore(candidate, role);
  score += eduScore * (criteria.education || 0);

  // Software score
  const softScore = calculateSoftwareScore(candidate, role);
  score += softScore * (criteria.software || 0);

  // Portfolio score
  const portScore = calculatePortfolioScore(candidate, role);
  score += portScore * (criteria.portfolio || 0);

  // Experience score
  const expScore = calculateExperienceScore(candidate, role);
  score += expScore * (criteria.experience || 0);

  // Communication (derived from CV quality)
  const commScore = candidate.summary ? 50 : 30;
  score += commScore * (criteria.communication || 0);

  return Math.min(100, Math.max(0, score));
}

/**
 * Score education relevance
 */
function calculateEducationScore(candidate, role) {
  if (!candidate.education || candidate.education.length === 0) return 20;

  const archDegrees = ['b.arch', 'barch', 'm.arch', 'march', 'b.planning', 'bplanning'];
  const engDegrees = ['b.tech', 'btech', 'b.e', 'be', 'm.tech', 'mtech', 'm.e'];
  const designDegrees = ['b.des', 'bdes', 'm.des', 'mdes', 'interior design', 'landscape'];

  let maxScore = 30;
  
  for (const edu of candidate.education) {
    const degree = (edu.degree || '').toLowerCase();
    
    if (role.category === 'Architecture & Design' || role.category === 'Landscape & Urban') {
      if (archDegrees.some(d => degree.includes(d))) maxScore = 100;
      else if (engDegrees.some(d => degree.includes(d))) maxScore = Math.max(maxScore, 60);
    } else if (role.category === 'Engineering') {
      if (engDegrees.some(d => degree.includes(d))) maxScore = 100;
      else if (archDegrees.some(d => degree.includes(d))) maxScore = Math.max(maxScore, 50);
    } else if (role.category === 'Interior Design') {
      if (designDegrees.some(d => degree.includes(d))) maxScore = 100;
      else if (archDegrees.some(d => degree.includes(d))) maxScore = Math.max(maxScore, 80);
    } else if (role.category === 'Technical & Support') {
      if (archDegrees.some(d => degree.includes(d)) || engDegrees.some(d => degree.includes(d))) {
        maxScore = Math.max(maxScore, 80);
      }
      if (degree.includes('diploma') || degree.includes('iti')) maxScore = Math.max(maxScore, 70);
    }
  }

  return maxScore;
}

/**
 * Score software proficiency match
 */
function calculateSoftwareScore(candidate, role) {
  if (!candidate.softwareSkills || candidate.softwareSkills.length === 0) return 10;

  const candidateSoftware = candidate.softwareSkills.map(s => 
    (typeof s === 'string' ? s : s.name || '').toLowerCase()
  );

  // Check mandatory software
  let mandatoryMatch = 0;
  const totalMandatory = role.mandatorySoftware.length || 1;
  
  for (const sw of role.mandatorySoftware) {
    if (candidateSoftware.some(cs => cs.includes(sw.toLowerCase()))) {
      mandatoryMatch++;
    }
  }

  // Check preferred software
  let preferredMatch = 0;
  const totalPreferred = role.preferredSoftware.length || 1;
  
  for (const sw of role.preferredSoftware) {
    if (candidateSoftware.some(cs => cs.includes(sw.toLowerCase()))) {
      preferredMatch++;
    }
  }

  const mandatoryScore = (mandatoryMatch / totalMandatory) * 70;
  const preferredScore = (preferredMatch / totalPreferred) * 30;

  return mandatoryScore + preferredScore;
}

/**
 * Score portfolio relevance
 */
function calculatePortfolioScore(candidate, role) {
  if (!candidate.portfolioAnalysis) return 30;

  const pa = candidate.portfolioAnalysis;
  
  // Average of available quality metrics
  const metrics = [
    pa.qualityScore || 0,
    pa.conceptClarity || 0,
    pa.technicalDepth || 0,
    pa.detailingQuality || 0,
    pa.constructionUnderstanding || 0,
    pa.presentationQuality || 0
  ].filter(m => m > 0);

  if (metrics.length === 0) return 30;
  
  let avgScore = metrics.reduce((sum, m) => sum + m, 0) / metrics.length;

  // Bonus for technical drawings (valued highly for govt project firms)
  if (pa.technicalDrawingPresent) avgScore = Math.min(100, avgScore + 10);
  
  // Penalty for render-only portfolios when role needs technical work
  if (pa.renderOnlyPortfolio && role.category !== 'Technical & Support' && role.id !== '3d-visualizer') {
    avgScore *= 0.7;
  }

  return avgScore;
}

/**
 * Score experience relevance
 */
function calculateExperienceScore(candidate, role) {
  const expYears = candidate.totalExperienceYears || 0;
  const { min, max } = role.experienceRange;

  let score = 50;

  // Perfect range match
  if (expYears >= min && expYears <= max) {
    score = 90;
  } 
  // Slightly under
  else if (expYears < min && expYears >= min - 1) {
    score = 65;
  }
  // Significantly under
  else if (expYears < min - 1) {
    score = Math.max(10, 50 - (min - expYears) * 10);
  }
  // Over-qualified (less of a penalty)
  else if (expYears > max) {
    score = Math.max(40, 80 - (expYears - max) * 5);
  }

  // Bonus for government project experience
  if (candidate.governmentExperience) score = Math.min(100, score + 10);
  if (candidate.dprExperience) score = Math.min(100, score + 5);
  if (candidate.gfcExperience) score = Math.min(100, score + 5);

  return score;
}

/**
 * Get detailed match information
 */
function getMatchDetails(candidate, role) {
  const candidateSoftware = (candidate.softwareSkills || []).map(s => 
    (typeof s === 'string' ? s : s.name || '').toLowerCase()
  );

  const mandatoryMet = role.mandatorySoftware.filter(sw =>
    candidateSoftware.some(cs => cs.includes(sw.toLowerCase()))
  );
  
  const mandatoryMissing = role.mandatorySoftware.filter(sw =>
    !candidateSoftware.some(cs => cs.includes(sw.toLowerCase()))
  );

  const preferredMet = role.preferredSoftware.filter(sw =>
    candidateSoftware.some(cs => cs.includes(sw.toLowerCase()))
  );

  const expYears = candidate.totalExperienceYears || 0;
  const { min, max } = role.experienceRange;

  return {
    mandatorySoftwareMet: mandatoryMet,
    mandatorySoftwareMissing: mandatoryMissing,
    preferredSoftwareMet: preferredMet,
    experienceInRange: expYears >= min && expYears <= max,
    experienceYears: expYears,
    requiredRange: `${min}-${max} years`
  };
}

/**
 * Match a candidate against a specific role by ID
 */
function matchToSpecificRole(candidateData, roleId) {
  const role = roles.find(r => r.id === roleId);
  if (!role) return null;

  const score = calculateRoleScore(candidateData, role);
  return {
    roleId: role.id,
    title: role.title,
    category: role.category,
    score: Math.round(score * 100) / 100,
    experienceRange: role.experienceRange,
    matchDetails: getMatchDetails(candidateData, role)
  };
}

/**
 * Get all available roles
 */
function getAllRoles() {
  return roles;
}

/**
 * Get roles by category
 */
function getRolesByCategory(category) {
  return roles.filter(r => r.category === category);
}

module.exports = {
  matchCandidateToRoles,
  matchToSpecificRole,
  getAllRoles,
  getRolesByCategory
};
