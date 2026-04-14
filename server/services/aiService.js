const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY
});

const TEXT_MODEL = 'meta/llama-3.3-70b-instruct';
const VISION_MODEL = 'meta/llama-3.2-90b-vision-instruct';

/**
 * Analyze a CV's extracted text using NVIDIA NIM LLM
 */
async function analyzeCVText(cvText) {
  const prompt = `You are an expert HR analyst for an architecture and engineering consultancy firm in India that handles government projects, DPRs, GFC drawings, site coordination, and comprehensive consultancy.

Analyze the following CV/resume text and extract structured information. Return ONLY valid JSON with no additional text.

CV TEXT:
"""
${cvText}
"""

Return this exact JSON structure:
{
  "name": "",
  "email": "",
  "phone": "",
  "education": [
    {
      "degree": "",
      "institution": "",
      "year": "",
      "specialization": ""
    }
  ],
  "totalExperienceYears": 0,
  "experienceBreakdown": [
    {
      "company": "",
      "role": "",
      "duration": "",
      "firmType": "",
      "keyProjects": []
    }
  ],
  "softwareSkills": [
    {
      "name": "",
      "proficiency": "beginner|intermediate|advanced|expert"
    }
  ],
  "technicalSkills": [],
  "projectTypes": [],
  "governmentExperience": false,
  "dprExperience": false,
  "gfcExperience": false,
  "siteCoordinationExperience": false,
  "tenderExperience": false,
  "certifications": [],
  "languages": [],
  "summary": ""
}`;

  try {
    const completion = await client.chat.completions.create({
      model: TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4096
    });

    const responseText = completion.choices[0].message.content;
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No valid JSON found in AI response');
  } catch (error) {
    console.error('CV Analysis error:', error.message);
    throw error;
  }
}

/**
 * Analyze portfolio images using NVIDIA NIM Vision model
 */
async function analyzePortfolioImages(base64Images) {
  const imageContent = base64Images.slice(0, 5).map(img => ({
    type: 'image_url',
    image_url: { url: `data:image/${img.format || 'jpeg'};base64,${img.data}` }
  }));

  const prompt = `You are an expert architectural portfolio reviewer for an Indian architecture firm specializing in government projects, DPRs, GFCs, and comprehensive consultancy.

Analyze these portfolio pages and evaluate the candidate's work. Return ONLY valid JSON.

{
  "drawingTypes": [],
  "technicalDrawingPresent": false,
  "renderOnlyPortfolio": false,
  "qualityScore": 0,
  "conceptClarity": 0,
  "technicalDepth": 0,
  "detailingQuality": 0,
  "constructionUnderstanding": 0,
  "presentationQuality": 0,
  "projectScale": "",
  "observations": [],
  "strengths": [],
  "weaknesses": []
}

Score each metric from 0-100. drawingTypes should list types like: "floor plans", "sections", "elevations", "details", "3D renders", "site plans", "working drawings", "GFC drawings", etc.`;

  try {
    const completion = await client.chat.completions.create({
      model: VISION_MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imageContent
        ]
      }],
      temperature: 0.1,
      max_tokens: 4096
    });

    const responseText = completion.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No valid JSON found in portfolio analysis');
  } catch (error) {
    console.error('Portfolio Analysis error:', error.message);
    // Return text-only fallback analysis
    return {
      drawingTypes: [],
      technicalDrawingPresent: false,
      renderOnlyPortfolio: false,
      qualityScore: 0,
      conceptClarity: 0,
      technicalDepth: 0,
      detailingQuality: 0,
      constructionUnderstanding: 0,
      presentationQuality: 0,
      projectScale: 'unknown',
      observations: ['Vision analysis unavailable - portfolio uploaded for manual review'],
      strengths: [],
      weaknesses: [],
      error: error.message
    };
  }
}

/**
 * Analyze portfolio text (extracted from PDF)
 */
async function analyzePortfolioText(portfolioText) {
  const prompt = `You are an expert architectural portfolio reviewer for an Indian architecture firm specializing in government projects, DPRs, GFCs, and comprehensive consultancy.

Analyze this portfolio text content and evaluate what you can infer. Return ONLY valid JSON.

PORTFOLIO TEXT:
"""
${portfolioText}
"""

{
  "drawingTypes": [],
  "projectNames": [],
  "projectScale": "",
  "technicalContentPresent": false,
  "observations": [],
  "strengths": [],
  "weaknesses": [],
  "qualityScore": 0,
  "conceptClarity": 0,
  "technicalDepth": 0,
  "detailingQuality": 0,
  "constructionUnderstanding": 0,
  "presentationQuality": 0
}

Score each metric from 0-100 based on what you can infer.`;

  try {
    const completion = await client.chat.completions.create({
      model: TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4096
    });

    const responseText = completion.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No valid JSON in portfolio text analysis');
  } catch (error) {
    console.error('Portfolio text analysis error:', error.message);
    throw error;
  }
}

/**
 * Generate combined suitability score and insights
 */
async function generateCombinedAnalysis(cvAnalysis, portfolioAnalysis, targetRole) {
  const prompt = `You are a senior HR manager at an Indian architecture consultancy that handles government projects, DPRs, GFC drawings, and comprehensive consultancy projects.

Given the following candidate analysis data, generate a comprehensive hiring assessment. Return ONLY valid JSON.

CV ANALYSIS:
${JSON.stringify(cvAnalysis, null, 2)}

PORTFOLIO ANALYSIS:
${JSON.stringify(portfolioAnalysis, null, 2)}

TARGET ROLE: ${targetRole || 'General Assessment'}

{
  "overallScore": 0,
  "strengths": [],
  "redFlags": [],
  "missingElements": [],
  "roleFitSuggestions": [
    {
      "role": "",
      "fitScore": 0,
      "reason": ""
    }
  ],
  "domainInsights": {
    "govtProjectReadiness": 0,
    "technicalCompetence": 0,
    "softwareReadiness": 0,
    "portfolioStrength": 0,
    "experienceRelevance": 0
  },
  "hiringRecommendation": "",
  "interviewFocusAreas": [],
  "salaryBracketSuggestion": "",
  "summary": ""
}

overallScore should be 0-100. Provide at least 3 strengths, check for red flags thoroughly.
For role fit suggestions, suggest top 3 roles from architecture/engineering firms.
hiringRecommendation should be one of: "STRONG_YES", "YES", "MAYBE", "NO", "STRONG_NO".
Be critical but fair. Focus on technical competence over just visual portfolio quality.`;

  try {
    const completion = await client.chat.completions.create({
      model: TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 4096
    });

    const responseText = completion.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No valid JSON in combined analysis');
  } catch (error) {
    console.error('Combined analysis error:', error.message);
    throw error;
  }
}

/**
 * Compare multiple candidates for a role
 */
async function compareCandidates(candidatesData) {
  const prompt = `You are a senior HR manager comparing candidates for an architecture/engineering position.

Compare these candidates and rank them. Return ONLY valid JSON.

CANDIDATES:
${JSON.stringify(candidatesData, null, 2)}

{
  "ranking": [
    {
      "candidateId": "",
      "name": "",
      "rank": 1,
      "overallScore": 0,
      "keyAdvantage": "",
      "keyWeakness": ""
    }
  ],
  "comparisonSummary": "",
  "recommendation": ""
}`;

  try {
    const completion = await client.chat.completions.create({
      model: TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 4096
    });

    const responseText = completion.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No valid JSON in comparison');
  } catch (error) {
    console.error('Comparison error:', error.message);
    throw error;
  }
}

module.exports = {
  analyzeCVText,
  analyzePortfolioImages,
  analyzePortfolioText,
  generateCombinedAnalysis,
  compareCandidates
};
