const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const basicAuth = require('express-basic-auth');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Security configuration
const WEB_USERNAME = process.env.WEB_USERNAME || 'admin';
const WEB_PASSWORD = process.env.WEB_PASSWORD || 'epub2024';
const API_KEY = process.env.API_KEY || 'web2epub-secret-key-change-me';

// Railway persistent storage: use /data if available, otherwise local
const STORAGE_ROOT = process.env.RAILWAY_VOLUME_MOUNT_PATH || __dirname;
const UPLOADS_DIR = path.join(STORAGE_ROOT, 'uploads');
const METADATA_FILE = path.join(STORAGE_ROOT, 'metadata.json');

console.log('Storage configuration:');
console.log('- Root:', STORAGE_ROOT);
console.log('- Uploads:', UPLOADS_DIR);
console.log('- Metadata:', METADATA_FILE);

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('Created uploads directory');
}

// Ensure metadata file exists
if (!fs.existsSync(METADATA_FILE)) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify([], null, 2));
  console.log('Created metadata file');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const sanitized = originalName.replace(/[^a-z0-9._-]/gi, '_');
    cb(null, `${timestamp}_${sanitized}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/epub+zip' || file.originalname.endsWith('.epub')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers EPUB sont acceptés'));
    }
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for now to allow inline scripts in index.html
}));

// Rate limiting
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 uploads per 15 minutes
  message: 'Trop de requêtes, veuillez réessayer plus tard'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Max 100 requests per 15 minutes
  message: 'Trop de requêtes, veuillez réessayer plus tard'
});

// API Key validation middleware
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (apiKey === API_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'API key invalide' });
  }
}

// HTTP Basic Auth for web interface
const webAuth = basicAuth({
  users: { [WEB_USERNAME]: WEB_PASSWORD },
  challenge: true,
  realm: 'Web2EPUB Admin'
});

// Middleware
app.use(cors());
app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'web2epub-session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: false // Set to true in production with HTTPS
  }
}));

// Session auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === WEB_USERNAME && password === WEB_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Logout endpoint
app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

// Serve login page without authentication
app.use('/login.html', express.static(path.join(__dirname, 'public', 'login.html')));

// Protected API endpoints (keep API key auth for extension uploads)
app.use('/api/epubs', apiLimiter, requireAuth);

// Serve index.html with session authentication
app.get('/', requireAuth, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve other static files without authentication for assets
app.use(express.static('public'));

// Helper functions
function readMetadata() {
  try {
    const data = fs.readFileSync(METADATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading metadata:', error);
    return [];
  }
}

function writeMetadata(metadata) {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('Error writing metadata:', error);
  }
}

/**
 * Validate and sanitize upload request body
 * @param {Object} body - Request body to validate
 * @returns {Object} - Validation result { valid: boolean, errors: array, sanitized: object }
 */
function validateUploadData(body) {
  const errors = [];
  const sanitized = {};

  // Validate title
  if (body.title) {
    if (typeof body.title !== 'string') {
      errors.push('Title must be a string');
    } else if (body.title.length > 500) {
      errors.push('Title too long (max 500 characters)');
    } else {
      sanitized.title = body.title.trim();
    }
  }

  // Validate timestamp (optional)
  if (body.timestamp) {
    if (typeof body.timestamp !== 'string') {
      errors.push('Timestamp must be a string');
    } else {
      const date = new Date(body.timestamp);
      if (isNaN(date.getTime())) {
        errors.push('Invalid timestamp format');
      } else {
        sanitized.timestamp = body.timestamp;
      }
    }
  }

  // Validate URL (optional)
  if (body.url) {
    if (typeof body.url !== 'string') {
      errors.push('URL must be a string');
    } else if (body.url.length > 2000) {
      errors.push('URL too long (max 2000 characters)');
    } else if (body.url.trim() !== '') {
      // Validate URL format
      try {
        new URL(body.url);
        sanitized.url = body.url.trim();
      } catch (e) {
        errors.push('Invalid URL format');
      }
    } else {
      sanitized.url = '';
    }
  } else {
    sanitized.url = '';
  }

  // Validate domain (optional)
  if (body.domain) {
    if (typeof body.domain !== 'string') {
      errors.push('Domain must be a string');
    } else if (body.domain.length > 255) {
      errors.push('Domain too long (max 255 characters)');
    } else {
      sanitized.domain = body.domain.trim();
    }
  } else {
    sanitized.domain = '';
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

// Routes
// Upload EPUB (protected by API key)
app.post('/upload', uploadLimiter, validateApiKey, upload.single('epub'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Validate request body
    const validation = validateUploadData(req.body);
    if (!validation.valid) {
      // Delete uploaded file on validation error
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        error: 'Données invalides',
        details: validation.errors
      });
    }

    const metadata = readMetadata();

    const newEntry = {
      id: Date.now().toString(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      title: validation.sanitized.title || req.file.originalname.replace('.epub', ''),
      size: req.file.size,
      uploadedAt: validation.sanitized.timestamp || new Date().toISOString(),
      url: validation.sanitized.url || '',
      domain: validation.sanitized.domain || '',
      path: req.file.path
    };

    metadata.unshift(newEntry);
    writeMetadata(metadata);

    console.log('EPUB uploaded:', newEntry.title);

    res.json({
      success: true,
      message: 'EPUB sauvegardé avec succès',
      id: newEntry.id
    });
  } catch (error) {
    // Cleanup uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all EPUBs
app.get('/api/epubs', (req, res) => {
  try {
    const metadata = readMetadata();
    res.json(metadata);
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download EPUB
app.get('/api/download/:id', requireAuth, (req, res) => {
  try {
    const metadata = readMetadata();
    const entry = metadata.find(e => e.id === req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    const filePath = path.join(UPLOADS_DIR, entry.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier physique non trouvé' });
    }

    res.download(filePath, entry.originalName);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete EPUB
app.delete('/api/epubs/:id', requireAuth, (req, res) => {
  try {
    const metadata = readMetadata();
    const index = metadata.findIndex(e => e.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    const entry = metadata[index];
    const filePath = path.join(UPLOADS_DIR, entry.filename);

    // Delete file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from metadata
    metadata.splice(index, 1);
    writeMetadata(metadata);

    res.json({ success: true, message: 'EPUB supprimé' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Web2EPUB server running on http://${HOST}:${PORT}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
});
