const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config');
const { AppError, asyncHandler } = require('../errors');
const { authenticate } = require('../middleware/auth');

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
    callback(allowedTypes.has(file.mimetype) ? null : new AppError(400, '仅支持 JPG、PNG 或 WebP 图片'), allowedTypes.has(file.mimetype));
  },
});

function isSupportedImage(buffer) {
  const isPng = buffer.length >= 8
    && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isWebp = buffer.length >= 12
    && buffer.toString('ascii', 0, 4) === 'RIFF'
    && buffer.toString('ascii', 8, 12) === 'WEBP';
  return isPng || isJpeg || isWebp;
}

router.post('/cover', authenticate, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError(400, '请上传图片，表单字段名为 file');
  }

  const filePath = path.join(config.uploadDir, req.file.filename);
  try {
    const header = await fs.readFile(filePath);
    if (!isSupportedImage(header)) {
      throw new AppError(400, '上传文件内容不是有效的 JPG、PNG 或 WebP 图片');
    }
  } catch (error) {
    await fs.unlink(filePath);
    throw error;
  }

  res.status(201).json({
    code: 0,
    data: { url: `/uploads/${req.file.filename}` },
    msg: '上传成功',
  });
}));

module.exports = router;
