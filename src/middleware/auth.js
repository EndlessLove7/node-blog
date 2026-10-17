const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { JWT_SECRET } = require('../config');
const { AppError, asyncHandler } = require('../errors');

const authenticate = asyncHandler(async (req, res, next) => {
  const authorization = req.get('authorization');
  const match = authorization && authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new AppError(401, '请先登录');
  }

  let payload;
  try {
    payload = jwt.verify(match[1], JWT_SECRET);
  } catch {
    throw new AppError(401, '登录凭证无效或已过期');
  }

  if (!payload || typeof payload !== 'object' || !Number.isInteger(payload.sub)) {
    throw new AppError(401, '登录凭证无效或已过期');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, createdAt: true },
  });
  if (!user) {
    throw new AppError(401, '登录凭证对应的用户不存在');
  }

  req.user = user;
  return next();
});

module.exports = { authenticate };
