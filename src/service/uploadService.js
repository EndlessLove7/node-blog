const { AppError } = require('../utils/errors');
const uploadRepository = require('../repository/uploadRepository');

function isSupportedImage(buffer) {
  const isPng = buffer.length >= 8
    && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isWebp = buffer.length >= 12
    && buffer.toString('ascii', 0, 4) === 'RIFF'
    && buffer.toString('ascii', 8, 12) === 'WEBP';
  return isPng || isJpeg || isWebp;
}

async function validateUploadedImage(filename) {
  try {
    const header = await uploadRepository.readUploadedFile(filename);
    if (!isSupportedImage(header)) {
      throw new AppError(400, '上传文件内容不是有效的 JPG、PNG 或 WebP 图片');
    }
  } catch (error) {
    await uploadRepository.removeUploadedFile(filename);
    throw error;
  }
}

module.exports = { validateUploadedImage };
