const prisma = require('./prisma');

function create(username, passwordHash) {
  return prisma.user.create({
    data: { username, passwordHash },
    select: { id: true, username: true, createdAt: true },
  });
}

function findByUsername(username) {
  return prisma.user.findUnique({ where: { username } });
}

function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, createdAt: true },
  });
}

module.exports = { create, findByUsername, findById };
