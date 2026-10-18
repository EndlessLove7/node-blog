const fs = require('fs');
const path = require('path');
const { AppError } = require('../utils/errors');

const dataFile = path.join(__dirname, '..', '..', 'test', 'data.json');

function readAll() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, '[]\n', 'utf8');
  }
  const content = fs.readFileSync(dataFile, 'utf8');
  try {
    const value = content.trim() ? JSON.parse(content) : [];
    if (!Array.isArray(value)) {
      throw new Error('not an array');
    }
    return value;
  } catch {
    throw new AppError(500, 'data.json 数据格式错误');
  }
}

function writeAll(todos) {
  fs.writeFileSync(dataFile, `${JSON.stringify(todos, null, 2)}\n`, 'utf8');
}

module.exports = { readAll, writeAll };
