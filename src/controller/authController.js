const authService = require('../service/authService');
const { asyncHandler } = require('../utils/errors');

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.validated.body.username, req.validated.body.password);
  res.status(201).json({ code: 0, data: user, msg: '注册成功' });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.validated.body.username, req.validated.body.password);
  res.json({ code: 0, data, msg: '登录成功' });
});

function me(req, res) {
  res.json({ code: 0, data: req.user, msg: '获取成功' });
}

module.exports = { register, login, me };
