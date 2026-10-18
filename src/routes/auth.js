const express = require('express');
const { z } = require('zod');
const authController = require('../controller/authController');
const { authenticate } = require('../middleware/auth');
const { validate, requireJsonObject } = require('../middleware/validate');

const router = express.Router();
const authSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9_]+$/, '用户名只能包含英文字母、数字和下划线'),
  password: z.string().min(8).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, '密码最多为 72 字节'),
});

router.post('/register', requireJsonObject, validate(authSchema), authController.register);
router.post('/login', requireJsonObject, validate(authSchema), authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
