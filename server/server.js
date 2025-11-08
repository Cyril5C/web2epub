const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

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

// Middleware
app.use(cors());
app.use(express.json());
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

// Routes
// Upload EPUB
app.post('/upload', upload.single('epub'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const metadata = readMetadata();

    const newEntry = {
      id: Date.now().toString(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      title: req.body.title || req.file.originalname.replace('.epub', ''),
      size: req.file.size,
      uploadedAt: req.body.timestamp || new Date().toISOString(),
      url: req.body.url || '',
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
app.get('/api/download/:id', (req, res) => {
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
app.delete('/api/epubs/:id', (req, res) => {
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
