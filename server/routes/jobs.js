const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getAllRoles, getRolesByCategory } = require('../services/roleMatching');

// GET /api/jobs — List all jobs
router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db.read();
    let jobs = db.jobs || [];

    const { status, category, search } = req.query;

    if (status) {
      jobs = jobs.filter(j => j.status === status);
    }
    if (category) {
      jobs = jobs.filter(j => j.category === category);
    }
    if (search) {
      const s = search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(s) ||
        j.department?.toLowerCase().includes(s)
      );
    }

    // Attach applicant counts
    const candidates = db.candidates || [];
    jobs = jobs.map(job => ({
      ...job,
      applicantCount: candidates.filter(c => c.appliedJobId === job.id).length
    }));

    jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ jobs, total: jobs.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs/roles — Get all available roles
router.get('/roles', (req, res) => {
  try {
    const { category } = req.query;
    const roles = category ? getRolesByCategory(category) : getAllRoles();
    res.json({ roles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs/:id — Get single job with applicants
router.get('/:id', (req, res) => {
  try {
    const db = req.app.locals.db.read();
    const job = (db.jobs || []).find(j => j.id === req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Attach applicants
    const candidates = (db.candidates || []).filter(c => c.appliedJobId === job.id);
    
    res.json({ ...job, applicants: candidates, applicantCount: candidates.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs — Create new job listing
router.post('/', (req, res) => {
  try {
    const {
      title, roleId, category, department, description,
      experienceRange, requirements, mandatorySoftware,
      preferredSoftware, projectExposure, location, salaryRange
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const job = {
      id: uuidv4(),
      title,
      roleId: roleId || '',
      category: category || '',
      department: department || '',
      description: description || '',
      experienceRange: experienceRange || { min: 0, max: 0 },
      requirements: requirements || [],
      mandatorySoftware: mandatorySoftware || [],
      preferredSoftware: preferredSoftware || [],
      projectExposure: projectExposure || [],
      location: location || '',
      salaryRange: salaryRange || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const db = req.app.locals.db.read();
    db.jobs = db.jobs || [];
    db.jobs.push(job);
    req.app.locals.db.write(db);

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/jobs/:id — Update job listing
router.patch('/:id', (req, res) => {
  try {
    const db = req.app.locals.db.read();
    const idx = (db.jobs || []).findIndex(j => j.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const allowedFields = [
      'title', 'roleId', 'category', 'department', 'description',
      'experienceRange', 'requirements', 'mandatorySoftware',
      'preferredSoftware', 'projectExposure', 'location', 'salaryRange', 'status'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        db.jobs[idx][field] = req.body[field];
      }
    }
    db.jobs[idx].updatedAt = new Date().toISOString();
    req.app.locals.db.write(db);

    res.json(db.jobs[idx]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/jobs/:id — Delete/close a job
router.delete('/:id', (req, res) => {
  try {
    const db = req.app.locals.db.read();
    const idx = (db.jobs || []).findIndex(j => j.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Job not found' });
    }

    db.jobs.splice(idx, 1);
    req.app.locals.db.write(db);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
