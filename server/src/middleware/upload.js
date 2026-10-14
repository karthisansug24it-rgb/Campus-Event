const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `poster-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WebP poster images are allowed.'), false);
  }
};

const uploadPoster = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2 MB limit
  },
  fileFilter
});

// Middleware wrapper to catch multer file size / type errors nicely
function handlePosterUpload(fieldName = 'poster') {
  return (req, res, next) => {
    const upload = uploadPoster.single(fieldName);
    upload(req, res, err => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Poster file exceeds the maximum allowed size of 2 MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
}

module.exports = {
  uploadPoster,
  handlePosterUpload
};
