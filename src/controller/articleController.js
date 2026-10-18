const articleService = require('../service/articleService');
const { asyncHandler } = require('../utils/errors');

const list = asyncHandler(async (req, res) => {
  const data = await articleService.list(req.validated.query);
  res.json({ code: 0, data, msg: '获取成功' });
});

const getById = asyncHandler(async (req, res) => {
  const article = await articleService.getById(req.validated.params.id);
  res.json({ code: 0, data: article, msg: '获取成功' });
});

const create = asyncHandler(async (req, res) => {
  const article = await articleService.create(req.validated.body, req.user.id);
  res.status(201).json({ code: 0, data: article, msg: '创建成功' });
});

const update = asyncHandler(async (req, res) => {
  const article = await articleService.update(
    req.validated.params.id,
    req.user.id,
    req.validated.body,
  );
  res.json({ code: 0, data: article, msg: '更新成功' });
});

const remove = asyncHandler(async (req, res) => {
  const data = await articleService.remove(req.validated.params.id, req.user.id);
  res.json({ code: 0, data, msg: '删除成功' });
});

module.exports = { list, getById, create, update, remove };
