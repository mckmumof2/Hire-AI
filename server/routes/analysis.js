const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { extractTextFromPDF, getImagesFromDirectory } = require('../services/pdfParser');
const { analyzeCVText, analyzePortfolioText, analyzePortfolioImages, generateCombinedAnalysis, compareCandidates } = require('../services/aiService');

// POST /api/analysis/cv — Analyze CV text only
router.post('/cv', async (req, res) => {
  try {
    const { candidateId } = req.body;
    if (!candidateId) {
      return res.status(400).json({ error: 'candidateId is required' });
    }

    const db = req.app.locals.db.read();
    const candidate = (db.candidates || []).find(c => c.id === candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const cvPath = path.join(req.app.locals.uploadsDir, candidateId, 'cv', candidate.cvFile);
    if (!fs.existsSync(cvPath)) {
      return res.status(404).json({ error: 'CV file not found' });
    }

    const pdfData = await extractTextFromPDF(cvPath);
    const analysis = await analyzeCVText(pdfData.text);

    res.json({ analysis, textLength: pdfData.text.length, pages: pdfData.pages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analysis/portfolio — Analyze portfolio only
router.post('/portfolio', async (req, res) => {
  try {
    const { candidateId } = req.body;
    if (!candidateId) {
      return res.status(400).json({ error: 'candidateId is required' });
    }

    const portfolioDir = path.join(req.app.locals.uploadsDir, candidateId, 'portfolio');
    if (!fs.existsSync(portfolioDir)) {
      return res.status(404).json({ error: 'Portfolio directory not found' });
    }

    // Try image analysis first
    const images = getImagesFromDirectory(portfolioDir);
    let analysis;

    if (images.length > 0) {
      analysis = await analyzePortfolioImages(images);
      analysis.analysisType = 'vision';
    } else {
      // Fall back to text analysis of PDF
      const files = fs.readdirSync(portfolioDir).filter(f => f.endsWith('.pdf'));
      if (files.length === 0) {
        return res.status(404).json({ error: 'No portfolio files found' });
      }
      const pdfData = await extractTextFromPDF(path.join(portfolioDir, files[0]));
      analysis = await analyzePortfolioText(pdfData.text);
      analysis.analysisType = 'text';
    }

    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analysis/full — Full CV + Portfolio analysis
router.post('/full', async (req, res) => {
  try {
    const { candidateId, targetRole } = req.body;
    if (!candidateId) {
      return res.status(400).json({ error: 'candidateId is required' });
    }

    const db = req.app.locals.db.read();
    const candidate = (db.candidates || []).find(c => c.id === candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    let cvAnalysis = null;
    let portfolioAnalysis = null;

    // CV Analysis
    if (candidate.cvFile) {
      const cvPath = path.join(req.app.locals.uploadsDir, candidateId, 'cv', candidate.cvFile);
      if (fs.existsSync(cvPath)) {
        const pdfData = await extractTextFromPDF(cvPath);
        cvAnalysis = await analyzeCVText(pdfData.text);
      }
    }

    // Portfolio Analysis
    const portfolioDir = path.join(req.app.locals.uploadsDir, candidateId, 'portfolio');
    if (fs.existsSync(portfolioDir)) {
      const images = getImagesFromDirectory(portfolioDir);
      if (images.length > 0) {
        portfolioAnalysis = await analyzePortfolioImages(images);
      } else {
        const pdfs = fs.readdirSync(portfolioDir).filter(f => f.endsWith('.pdf'));
        if (pdfs.length > 0) {
          const pdfData = await extractTextFromPDF(path.join(portfolioDir, pdfs[0]));
          portfolioAnalysis = await analyzePortfolioText(pdfData.text);
        }
      }
    }

    // Combined analysis
    const combined = await generateCombinedAnalysis(
      cvAnalysis || {},
      portfolioAnalysis || {},
      targetRole || candidate.appliedRole
    );

    // Update candidate record
    const idx = db.candidates.findIndex(c => c.id === candidateId);
    if (idx !== -1) {
      db.candidates[idx].aiAnalysis = {
        ...cvAnalysis,
        portfolioAnalysis,
        ...combined,
        analyzedAt: new Date().toISOString()
      };
      db.candidates[idx].experience = cvAnalysis?.totalExperienceYears || 0;
      db.candidates[idx].status = 'reviewed';
      req.app.locals.db.write(db);
    }

    res.json({ cvAnalysis, portfolioAnalysis, combined });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analysis/compare — Compare 2-5 candidates
router.post('/compare', async (req, res) => {
  try {
    const { candidateIds } = req.body;
    if (!candidateIds || candidateIds.length < 2 || candidateIds.length > 5) {
      return res.status(400).json({ error: 'Provide 2-5 candidate IDs' });
    }

    const db = req.app.locals.db.read();
    const candidatesData = candidateIds.map(id => {
      const c = (db.candidates || []).find(c => c.id === id);
      if (!c) return null;
      return {
        id: c.id,
        name: c.name,
        experience: c.experience,
        appliedRole: c.appliedRole,
        aiAnalysis: c.aiAnalysis
      };
    }).filter(Boolean);

    if (candidatesData.length < 2) {
      return res.status(404).json({ error: 'Not enough valid candidates found' });
    }

    const comparison = await compareCandidates(candidatesData);
    res.json({ comparison });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analysis/reanalyze — Re-run analysis for a candidate
router.post('/reanalyze', async (req, res) => {
  try {
    const { candidateId } = req.body;
    if (!candidateId) {
      return res.status(400).json({ error: 'candidateId is required' });
    }

    const db = req.app.locals.db.read();
    const idx = (db.candidates || []).findIndex(c => c.id === candidateId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    db.candidates[idx].status = 'processing';
    req.app.locals.db.write(db);

    res.json({ message: 'Re-analysis started', candidateId });

    // Process in background (same as upload flow)
    // Re-importing to avoid circular deps
    const candidateRoutes = require('./candidates');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
