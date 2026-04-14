const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { extractTextFromPDF, getImagesFromDirectory } = require('../services/pdfParser');
const { analyzeCVText, analyzePortfolioText, analyzePortfolioImages, generateCombinedAnalysis } = require('../services/aiService');
const { matchCandidateToRoles, matchToSpecificRole } = require('../services/roleMatching');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const candidateId = req.candidateId || uuidv4();
    req.candidateId = candidateId;
    
    const subDir = file.fieldname === 'cv' ? 'cv' : 'portfolio';
    const uploadPath = path.join(req.app.locals.uploadsDir, candidateId, subDir);
    
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed`));
    }
  }
});

// GET /api/candidates — List all candidates with optional filters
router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db.read();
    let candidates = db.candidates || [];

    // Apply filters
    const { role, status, minScore, maxScore, minExp, maxExp, search, jobId, software, sortByRole } = req.query;

    if (role) {
      candidates = candidates.filter(c => c.appliedRole === role || 
        (c.aiAnalysis?.roleFitSuggestions || []).some(r => r.role === role));
    }
    if (status) {
      candidates = candidates.filter(c => c.status === status);
    }
    if (minScore) {
      candidates = candidates.filter(c => (c.aiAnalysis?.overallScore || 0) >= Number(minScore));
    }
    if (maxScore) {
      candidates = candidates.filter(c => (c.aiAnalysis?.overallScore || 0) <= Number(maxScore));
    }
    if (minExp) {
      candidates = candidates.filter(c => (c.experience || 0) >= Number(minExp));
    }
    if (maxExp) {
      candidates = candidates.filter(c => (c.experience || 0) <= Number(maxExp));
    }
    if (jobId) {
      candidates = candidates.filter(c => c.appliedJobId === jobId);
    }
    if (software) {
      const sw = software.toLowerCase();
      candidates = candidates.filter(c => 
        (c.aiAnalysis?.softwareSkills || []).some(s => 
          (typeof s === 'string' ? s : s.name || '').toLowerCase().includes(sw)
        )
      );
    }
    if (search) {
      const s = search.toLowerCase();
      candidates = candidates.filter(c =>
        (c.name || '').toLowerCase().includes(s) ||
        (c.email || '').toLowerCase().includes(s) ||
        (c.appliedRole || '').toLowerCase().includes(s)
      );
    }

    // Sort logic
    if (sortByRole) {
      // Calculate scores for all candidates against this role if they have AI analysis
      candidates = candidates.map(c => {
        if (!c.aiAnalysis || c.aiAnalysis.error) return { ...c, tempMatchScore: 0 };
        
        // Use pre-calculated match if existing in roleMatches, else calculate
        const existingMatch = (c.aiAnalysis.roleMatches || []).find(r => r.roleId === sortByRole);
        const match = existingMatch || matchToSpecificRole(c.aiAnalysis, sortByRole);
        
        return { ...c, tempMatchScore: match?.score || 0, tempMatchDetails: match?.matchDetails };
      });

      // Sort by score descending
      candidates.sort((a, b) => b.tempMatchScore - a.tempMatchScore);
    } else {
      // Sort by upload date (newest first)
      candidates.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    }

    res.json({ candidates, total: candidates.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/candidates/:id — Get single candidate
router.get('/:id', (req, res) => {
  try {
    const db = req.app.locals.db.read();
    const candidate = (db.candidates || []).find(c => c.id === req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Include file listings
    const candidateDir = path.join(req.app.locals.uploadsDir, candidate.id);
    const cvDir = path.join(candidateDir, 'cv');
    const portfolioDir = path.join(candidateDir, 'portfolio');

    candidate.files = {
      cv: fs.existsSync(cvDir) ? fs.readdirSync(cvDir) : [],
      portfolio: fs.existsSync(portfolioDir) ? fs.readdirSync(portfolioDir) : []
    };

    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/candidates — Upload CV + Portfolio, trigger analysis
router.post('/', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'portfolio', maxCount: 5 }
]), async (req, res) => {
  try {
    const candidateId = req.candidateId || uuidv4();
    const { name, email, phone, appliedRole, appliedJobId, source, hp_check } = req.body;
    
    // Simple honeypot check for bots
    if (hp_check && hp_check !== '') {
      return res.status(403).json({ error: 'Spam detected' });
    }

    const candidate = {
      id: candidateId,
      name: name || 'Unknown',
      email: email || '',
      phone: phone || '',
      appliedRole: appliedRole || '',
      appliedJobId: appliedJobId || '',
      source: source || 'manual',
      experience: 0,
      status: 'new',
      uploadDate: new Date().toISOString(),
      cvFile: '',
      portfolioFiles: [],
      aiAnalysis: null,
      remarks: '',
      personalNotes: '',
      rating: 0,
      questionnaire: {},
      pipelineStage: 'applied',
      verified: false
    };

    // Track uploaded files
    if (req.files?.cv) {
      candidate.cvFile = req.files.cv[0].filename;
    }
    if (req.files?.portfolio) {
      candidate.portfolioFiles = req.files.portfolio.map(f => f.filename);
    }

    // Save candidate to DB immediately (analysis happens async)
    const db = req.app.locals.db.read();
    db.candidates = db.candidates || [];
    db.candidates.push(candidate);
    req.app.locals.db.write(db);

    // Start AI analysis in background
    processCandidate(candidate, req.app.locals).catch(err => {
      console.error(`Analysis failed for ${candidateId}:`, err.message);
    });

    res.status(201).json({ 
      message: 'Candidate uploaded successfully. AI analysis in progress.',
      candidate 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Background AI processing
async function processCandidate(candidate, appLocals) {
  const db = appLocals.db.read();
  const idx = db.candidates.findIndex(c => c.id === candidate.id);
  if (idx === -1) return;

  try {
    // Update status to processing
    db.candidates[idx].status = 'processing';
    appLocals.db.write(db);

    let cvAnalysis = null;
    let portfolioAnalysis = null;

    // Analyze CV
    if (candidate.cvFile) {
      const cvPath = path.join(appLocals.uploadsDir, candidate.id, 'cv', candidate.cvFile);
      if (fs.existsSync(cvPath) && path.extname(cvPath).toLowerCase() === '.pdf') {
        const pdfData = await extractTextFromPDF(cvPath);
        if (pdfData.text && pdfData.text.trim().length > 50) {
          cvAnalysis = await analyzeCVText(pdfData.text);
          
          // Update candidate with extracted info
          if (cvAnalysis.name && cvAnalysis.name !== '') {
            db.candidates[idx].name = db.candidates[idx].name === 'Unknown' ? cvAnalysis.name : db.candidates[idx].name;
          }
          if (cvAnalysis.email) db.candidates[idx].email = db.candidates[idx].email || cvAnalysis.email;
          if (cvAnalysis.phone) db.candidates[idx].phone = db.candidates[idx].phone || cvAnalysis.phone;
          db.candidates[idx].experience = cvAnalysis.totalExperienceYears || 0;
        }
      }
    }

    // Analyze portfolio
    const portfolioDir = path.join(appLocals.uploadsDir, candidate.id, 'portfolio');
    if (fs.existsSync(portfolioDir)) {
      // Check for images first (for vision analysis)
      const images = getImagesFromDirectory(portfolioDir);
      if (images.length > 0) {
        portfolioAnalysis = await analyzePortfolioImages(images);
      }
      
      // Also check for PDF portfolios
      const portfolioPdfs = (candidate.portfolioFiles || []).filter(f => 
        path.extname(f).toLowerCase() === '.pdf'
      );
      if (portfolioPdfs.length > 0 && !portfolioAnalysis) {
        const portfolioPath = path.join(portfolioDir, portfolioPdfs[0]);
        if (fs.existsSync(portfolioPath)) {
          const pdfData = await extractTextFromPDF(portfolioPath);
          if (pdfData.text && pdfData.text.trim().length > 30) {
            portfolioAnalysis = await analyzePortfolioText(pdfData.text);
          }
        }
      }
    }

    // Generate combined analysis
    let combinedAnalysis = {};
    if (cvAnalysis || portfolioAnalysis) {
      combinedAnalysis = await generateCombinedAnalysis(
        cvAnalysis || {},
        portfolioAnalysis || {},
        candidate.appliedRole
      );
    }

    // Role matching
    const roleMatches = cvAnalysis ? matchCandidateToRoles(cvAnalysis) : [];

    // Compile full analysis
    db.candidates[idx].aiAnalysis = {
      ...cvAnalysis,
      portfolioAnalysis: portfolioAnalysis || null,
      ...combinedAnalysis,
      roleFitSuggestions: combinedAnalysis.roleFitSuggestions || roleMatches.map(r => ({
        role: r.title,
        fitScore: r.score,
        reason: `Matched based on ${r.matchDetails?.experienceInRange ? 'experience range' : 'skills'}`
      })),
      roleMatches,
      analyzedAt: new Date().toISOString()
    };

    db.candidates[idx].status = 'reviewed';
    appLocals.db.write(db);
    
    console.log(`✅ Analysis complete for: ${db.candidates[idx].name} (${candidate.id})`);
  } catch (error) {
    console.error(`❌ Analysis failed for ${candidate.id}:`, error.message);
    
    // Re-read db in case it changed
    const freshDb = appLocals.db.read();
    const freshIdx = freshDb.candidates.findIndex(c => c.id === candidate.id);
    if (freshIdx !== -1) {
      freshDb.candidates[freshIdx].status = 'review-needed';
      freshDb.candidates[freshIdx].aiAnalysis = {
        error: error.message,
        analyzedAt: new Date().toISOString()
      };
      appLocals.db.write(freshDb);
    }
  }
}

// POST /api/candidates/bulk-assess — Trigger analysis for all pending candidates
router.post('/bulk-assess', async (req, res) => {
  try {
    const db = req.app.locals.db.read();
    const pendingCandidates = (db.candidates || []).filter(c => 
      c.status === 'new' || c.status === 'processing' || c.status === 'review-needed' || !c.aiAnalysis
    );

    if (pendingCandidates.length === 0) {
      return res.json({ message: 'No pending candidates to analyze.' });
    }

    pendingCandidates.forEach(candidate => {
      processCandidate(candidate, req.app.locals).catch(err => {
        console.error(`Bulk analysis failed for ${candidate.id}:`, err.message);
      });
    });

    res.json({ 
      message: `Started analysis for ${pendingCandidates.length} candidates.`,
      count: pendingCandidates.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/assess', async (req, res) => {
  try {
    const db = req.app.locals.db.read();
    const candidate = (db.candidates || []).find(c => c.id === req.params.id);
    
    console.log(`📡 Manual Assessment Request Received: Candidate ${req.params.id} (${candidate?.name || 'Unknown'})`);
    
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    processCandidate(candidate, req.app.locals).catch(err => {
      console.error(`Manual analysis failed for ${req.params.id}:`, err.message);
    });

    res.json({ message: 'Analysis triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/candidates/:id/verify
router.patch('/:id/verify', (req, res) => {
  try {
    const db = req.app.locals.db.read();
    const idx = (db.candidates || []).findIndex(c => c.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    db.candidates[idx].verified = req.body.verified !== undefined ? req.body.verified : !db.candidates[idx].verified;
    req.app.locals.db.write(db);

    res.json(db.candidates[idx]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/candidates/:id/status — Update candidate status
router.patch('/:id/status', (req, res) => {
  try {
    const db = req.app.locals.db.read();
    const idx = (db.candidates || []).findIndex(c => c.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const validStatuses = ['new', 'processing', 'reviewed', 'shortlisted', 'interview', 'selected', 'rejected', 'on-hold'];
    if (req.body.status && !validStatuses.includes(req.body.status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    db.candidates[idx].status = req.body.status;
    if (req.body.pipelineStage) {
      db.candidates[idx].pipelineStage = req.body.pipelineStage;
    }
    req.app.locals.db.write(db);

    res.json(db.candidates[idx]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/candidates/:id/remarks — Add remarks and rating
router.patch('/:id/remarks', (req, res) => {
  try {
    const db = req.app.locals.db.read();
    const idx = (db.candidates || []).findIndex(c => c.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (req.body.remarks !== undefined) db.candidates[idx].remarks = req.body.remarks;
    if (req.body.personalNotes !== undefined) db.candidates[idx].personalNotes = req.body.personalNotes;
    if (req.body.rating !== undefined) db.candidates[idx].rating = Number(req.body.rating);
    if (req.body.questionnaire) {
      db.candidates[idx].questionnaire = {
        ...db.candidates[idx].questionnaire,
        ...req.body.questionnaire
      };
    }
    req.app.locals.db.write(db);

    res.json(db.candidates[idx]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/candidates/:id — Remove candidate and files
router.delete('/:id', (req, res) => {
  try {
    const db = req.app.locals.db.read();
    const idx = (db.candidates || []).findIndex(c => c.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const candidate = db.candidates[idx];

    // Remove files
    const candidateDir = path.join(req.app.locals.uploadsDir, candidate.id);
    if (fs.existsSync(candidateDir)) {
      fs.rmSync(candidateDir, { recursive: true, force: true });
    }

    // Remove from DB
    db.candidates.splice(idx, 1);
    req.app.locals.db.write(db);

    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
