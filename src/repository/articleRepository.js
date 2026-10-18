const prisma = require('./prisma');

function list({ where, order, page, pageSize }) {
  return Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ createdAt: order }, { id: order }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { author: { select: { id: true, username: true } } },
    }),
    prisma.article.count({ where }),
  ]);
}

function findById(id) {
  return prisma.article.findUnique({
    where: { id },
    include: { author: { select: { id: true, username: true } } },
  });
}

function create(data) {
  return prisma.article.create({
    data,
    include: { author: { select: { id: true, username: true } } },
  });
}

function updateOwned(id, userId, data) {
  return prisma.article.updateMany({
    where: { id, userId },
    data,
  });
}

function deleteOwned(id, userId) {
  return prisma.article.deleteMany({ where: { id, userId } });
}

module.exports = { list, findById, create, updateOwned, deleteOwned };
