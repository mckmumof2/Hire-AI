const express = require('express');
const router = express.Router();

const PIPELINE_STAGES = [
  'applied',
  'under-review',
  'shortlisted',
  'interview-scheduled',
  'selected',
  'rejected'
];

// GET /api/pipeline/:jobId — Get pipeline for a job
router.get('/:jobId', (req, res) => {
  try {
    const db = req.app.locals.db.read();
    const job = (db.jobs || []).find(j => j.id === req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const candidates = (db.candidates || []).filter(c => c.appliedJobId === req.params.jobId);

    // Group by pipeline stage
    const pipeline = {};
    PIPELINE_STAGES.forEach(stage => {
      pipeline[stage] = candidates.filter(c => (c.pipelineStage || 'applied') === stage);
    });

    res.json({
      jobId: req.params.jobId,
      jobTitle: job.title,
      stages: PIPELINE_STAGES,
      pipeline,
      totalCandidates: candidates.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pipeline — Get overall pipeline (all jobs combined)
router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db.read();
    const candidates = db.candidates || [];

    const pipeline = {};
    PIPELINE_STAGES.forEach(stage => {
      pipeline[stage] = candidates.filter(c => (c.pipelineStage || 'applied') === stage);
    });

    res.json({
      stages: PIPELINE_STAGES,
      pipeline,
      totalCandidates: candidates.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/pipeline/move — Move candidate between stages
router.patch('/move', (req, res) => {
  try {
    const { candidateId, stage } = req.body;

    if (!candidateId || !stage) {
      return res.status(400).json({ error: 'candidateId and stage are required' });
    }

    if (!PIPELINE_STAGES.includes(stage)) {
      return res.status(400).json({ error: `Invalid stage. Valid stages: ${PIPELINE_STAGES.join(', ')}` });
    }

    const db = req.app.locals.db.read();
    const idx = (db.candidates || []).findIndex(c => c.id === candidateId);

    if (idx === -1) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    db.candidates[idx].pipelineStage = stage;
    
    // Also update status based on stage
    const stageStatusMap = {
      'applied': 'new',
      'under-review': 'reviewed',
      'shortlisted': 'shortlisted',
      'interview-scheduled': 'interview',
      'selected': 'selected',
      'rejected': 'rejected'
    };
    db.candidates[idx].status = stageStatusMap[stage] || db.candidates[idx].status;

    req.app.locals.db.write(db);

    res.json({
      message: `Candidate moved to ${stage}`,
      candidate: db.candidates[idx]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
