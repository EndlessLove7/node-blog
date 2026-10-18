const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repository/userRepository');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const { AppError } = require('../utils/errors');

async function register(inputUsername, password) {
  const username = inputUsername.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  return userRepository.create(username, passwordHash);
}

async function login(inputUsername, password) {
  const user = await userRepository.findByUsername(inputUsername.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, '用户名或密码错误');
  }

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return {
    token,
    user: { id: user.id, username: user.username, createdAt: user.createdAt },
  };
}

module.exports = { register, login };
