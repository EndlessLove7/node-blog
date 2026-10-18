const uploadService = require('../service/uploadService');
const { AppError, asyncHandler } = require('../utils/errors');

const uploadCover = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError(400, '请上传图片，表单字段名为 file');
  }

  await uploadService.validateUploadedImage(req.file.filename);
  res.status(201).json({
    code: 0,
    data: { url: `/uploads/${req.file.filename}` },
    msg: '上传成功',
  });
});

module.exports = { uploadCover };
