const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const clientPublicUploads = path.join(__dirname, '../../../client/public/uploads');
if (!fs.existsSync(clientPublicUploads)) {
  fs.mkdirSync(clientPublicUploads, { recursive: true });
}

function syncUploadToClient(file) {
  if (!file || !file.path) return;
  try {
    const dest = path.join(clientPublicUploads, file.filename);
    fs.copyFileSync(file.path, dest);
  } catch (e) {
    console.warn('[Upload Sync Warning]:', e.message);
  }
}

// 1. Poster Storage
const posterStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `poster-${uniqueSuffix}${ext}`);
  }
});

const imageFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Supported formats: JPG, PNG, and WebP.'), false);
  }
};

const uploadPoster = multer({
  storage: posterStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: imageFileFilter
});

function handlePosterUpload(fieldName = 'poster') {
  return (req, res, next) => {
    const upload = uploadPoster.single(fieldName);
    upload(req, res, err => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Poster file exceeds 5 MB limit.' });
        }
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      if (req.file) syncUploadToClient(req.file);
      next();
    });
  };
}

// 2. Registration Screenshot Proof Storage
const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `proof-${uniqueSuffix}${ext}`);
  }
});

const uploadScreenshot = multer({
  storage: proofStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB limit
  fileFilter: imageFileFilter
});

function handleScreenshotUpload(fieldName = 'screenshot') {
  return (req, res, next) => {
    const upload = uploadScreenshot.single(fieldName);
    upload(req, res, err => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Screenshot file exceeds 8 MB limit.' });
        }
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      if (req.file) syncUploadToClient(req.file);
      next();
    });
  };
}

// 3. Participation Certificate Storage (supports images & PDFs)
const certStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `cert-${uniqueSuffix}${ext}`);
  }
});

const certFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid certificate format. Supported formats: JPG, PNG, WebP, or PDF.'), false);
  }
};

const uploadCertificate = multer({
  storage: certStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: certFileFilter
});

function handleCertificateUpload(fieldName = 'certificate') {
  return (req, res, next) => {
    const upload = uploadCertificate.single(fieldName);
    upload(req, res, err => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Certificate file exceeds 10 MB limit.' });
        }
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      if (req.file) syncUploadToClient(req.file);
      next();
    });
  };
}

module.exports = {
  uploadPoster,
  handlePosterUpload,
  uploadScreenshot,
  handleScreenshotUpload,
  uploadCertificate,
  handleCertificateUpload,
  syncUploadToClient
};
