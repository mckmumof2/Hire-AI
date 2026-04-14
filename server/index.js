require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const IS_VERCEL = !!process.env.VERCEL;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// On Vercel, use /tmp for writable storage. Locally, use the project directory.
const uploadsDir = IS_VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Ensure data directory exists
const dataDir = IS_VERCEL
  ? path.join('/tmp', 'data')
  : path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Initialize db.json if not exists
const dbPath = path.join(dataDir, 'db.json');
if (!fs.existsSync(dbPath)) {
  // On Vercel, seed with the bundled roles data for job matching
  const seedData = { candidates: [], jobs: [], pipeline: {} };
  fs.writeFileSync(dbPath, JSON.stringify(seedData, null, 2));
}

// Simple DB helper
const db = {
  read() {
    try {
      return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch (e) {
      return { candidates: [], jobs: [], pipeline: {} };
    }
  },
  write(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  }
};

// Make db available to routes
app.locals.db = db;
app.locals.uploadsDir = uploadsDir;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    aiConfigured: !!process.env.NVIDIA_API_KEY,
    environment: IS_VERCEL ? 'vercel' : 'local'
  });
});

// Routes - Register API routes BEFORE static files
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/pipeline', require('./routes/pipeline'));

// Dedicate 404 handler for API (Ensure JSON response, not HTML)
app.all('/api/*', (req, res) => {
  console.log(`[404] API not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

// Static file serving for React Frontend (Production — local only, Vercel serves static files itself)
if (!IS_VERCEL) {
  const clientDistDir = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDistDir));

  // Catch-all to serve index.html for any other route (React Router support)
  app.get('*', (req, res) => {
    const indexPath = path.join(clientDistDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send('Hire AI Backend is running. Access the dashboard via Vite (Port 5173 in Dev).');
    }
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Only start listening when running locally (not on Vercel)
if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🏗️  Hire AI Server running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`🤖 NVIDIA AI: ${process.env.NVIDIA_API_KEY ? 'Configured ✓' : 'Not configured ✗'}`);
    console.log('');
  });
}

// Export for Vercel serverless function
module.exports = app;
