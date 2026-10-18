const articleRepository = require('../repository/articleRepository');
const { AppError } = require('../utils/errors');

async function list({ page, pageSize, keyword, order }) {
  const where = keyword
    ? { OR: [{ title: { contains: keyword } }, { content: { contains: keyword } }] }
    : {};
  const [items, total] = await articleRepository.list({ where, order, page, pageSize });
  return {
    items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

async function getById(id) {
  const article = await articleRepository.findById(id);
  if (!article) {
    throw new AppError(404, '文章不存在');
  }
  return article;
}

function create(data, userId) {
  return articleRepository.create({ ...data, userId });
}

async function update(id, userId, data) {
  const result = await articleRepository.updateOwned(id, userId, data);
  if (result.count === 0) {
    throw new AppError(404, '文章不存在或无权修改');
  }
  return articleRepository.findById(id);
}

async function remove(id, userId) {
  const result = await articleRepository.deleteOwned(id, userId);
  if (result.count === 0) {
    throw new AppError(404, '文章不存在或无权删除');
  }
  return { id };
}

module.exports = { list, getById, create, update, remove };
