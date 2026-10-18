class AppError extends Error {
  constructor(status, message, code = status) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function notFound(req, res, next) {
  next(new AppError(404, '接口不存在', 404));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && error.status === 400 && Object.hasOwn(error, 'body')) {
    return res.status(400).json({ code: 400, data: null, msg: 'JSON 参数格式错误' });
  }

  if (error.name === 'ZodError') {
    return res.status(400).json({
      code: 400,
      data: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
      msg: '参数校验失败',
    });
  }

  if (error.name === 'MulterError') {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? '图片不能超过 5 MB'
      : '文件上传失败';
    return res.status(400).json({ code: 400, data: null, msg: message });
  }

  if (error.code === 'P2002') {
    return res.status(409).json({ code: 409, data: null, msg: '用户名已被注册' });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({ code: 404, data: null, msg: '资源不存在' });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) {
    console.error('请求处理失败:', error);
  }

  return res.status(status).json({
    code: error.code || status,
    data: null,
    msg: status >= 500 ? '服务器内部错误' : error.message,
  });
}

module.exports = { AppError, asyncHandler, notFound, errorHandler };
