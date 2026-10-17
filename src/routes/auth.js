const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const { AppError, asyncHandler } = require('../errors');
const { validate, requireJsonObject } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const authSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9_]+$/, '用户名只能包含英文字母、数字和下划线'),
  password: z.string().min(8).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, '密码最多为 72 字节'),
});

router.post('/register', requireJsonObject, validate(authSchema), asyncHandler(async (req, res) => {
  const { username: inputUsername, password } = req.validated.body;
  const username = inputUsername.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, passwordHash },
    select: { id: true, username: true, createdAt: true },
  });
  res.status(201).json({ code: 0, data: user, msg: '注册成功' });
}));

router.post('/login', requireJsonObject, validate(authSchema), asyncHandler(async (req, res) => {
  const { username, password } = req.validated.body;
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, '用户名或密码错误');
  }

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({
    code: 0,
    data: {
      token,
      user: { id: user.id, username: user.username, createdAt: user.createdAt },
    },
    msg: '登录成功',
  });
}));

router.get('/me', authenticate, (req, res) => {
  res.json({ code: 0, data: req.user, msg: '获取成功' });
});

module.exports = router;
