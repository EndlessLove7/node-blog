const fs = require('fs/promises');
const path = require('path');
const config = require('../config');

function readUploadedFile(filename) {
  return fs.readFile(path.join(config.uploadDir, filename));
}

function removeUploadedFile(filename) {
  return fs.unlink(path.join(config.uploadDir, filename));
}

module.exports = { readUploadedFile, removeUploadedFile };
