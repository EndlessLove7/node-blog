const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config');
const uploadController = require('../controller/uploadController');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../utils/errors');

const router = express.Router();
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (req, file, callback) => {
    const extension = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[file.mimetype];
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    callback(
      allowedTypes.has(file.mimetype) ? null : new AppError(400, '仅支持 JPG、PNG 或 WebP 图片'),
      allowedTypes.has(file.mimetype),
    );
  },
});

router.post('/cover', authenticate, upload.single('file'), uploadController.uploadCover);

module.exports = router;
