const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Default admin password hash for "portfolio2024" — change via POST /api/change-password
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'portfolio2024', 10);

let adminPasswordHash = DEFAULT_PASSWORD_HASH;

const DATA_FILE = path.join(__dirname, 'data', 'portfolio.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'portfolio-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }, // 8 hours
}));

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Auth routes
app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  const match = await bcrypt.compare(password, adminPasswordHash);
  if (!match) return res.status(401).json({ error: 'Invalid password' });
  req.session.authenticated = true;
  res.json({ success: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth-status', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

app.post('/api/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  const match = await bcrypt.compare(currentPassword, adminPasswordHash);
  if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
  adminPasswordHash = await bcrypt.hash(newPassword, 10);
  res.json({ success: true });
});

// Portfolio data routes
app.get('/api/portfolio', (req, res) => {
  res.json(readData());
});

app.put('/api/portfolio', requireAuth, (req, res) => {
  const data = req.body;
  writeData(data);
  res.json({ success: true });
});

// Section-level update helpers
const SECTIONS = ['profile', 'skills', 'certifications', 'education', 'experience', 'projects'];

SECTIONS.forEach(section => {
  app.put(`/api/portfolio/${section}`, requireAuth, (req, res) => {
    const data = readData();
    data[section] = req.body;
    writeData(data);
    res.json({ success: true });
  });
});

// File upload
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Serve admin page only when authenticated
app.get('/admin', (req, res) => {
  if (!(req.session && req.session.authenticated)) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Portfolio running at http://localhost:${PORT}`);
  console.log('Default admin password: portfolio2024');
});
