const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { AppError, asyncHandler } = require('../errors');
const { authenticate } = require('../middleware/auth');
const { validate, requireJsonObject } = require('../middleware/validate');

const router = express.Router();
const idSchema = z.object({ id: z.coerce.number().int().positive() });
const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  keyword: z.string().trim().max(100).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});
const coverImageUrlSchema = z.string().max(500).refine((value) => {
  if (value.startsWith('/')) {
    return /^\/uploads\/[A-Za-z0-9-]+\.(jpg|png|webp)$/i.test(value);
  }
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}, '封面地址必须为有效 URL 或本地上传路径');
const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().min(1).max(1_000_000),
  coverImageUrl: coverImageUrlSchema.optional(),
});
const updateSchema = createSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  '至少提供一个需要修改的字段',
);

router.get('/', validate(listSchema, 'query'), asyncHandler(async (req, res) => {
  const { page, pageSize, keyword, order } = req.validated.query;
  const where = keyword
    ? { OR: [{ title: { contains: keyword } }, { content: { contains: keyword } }] }
    : {};
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ createdAt: order }, { id: order }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { author: { select: { id: true, username: true } } },
    }),
    prisma.article.count({ where }),
  ]);
  res.json({
    code: 0,
    data: { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
    msg: '获取成功',
  });
}));

router.get('/:id', validate(idSchema, 'params'), asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: { author: { select: { id: true, username: true } } },
  });
  if (!article) {
    throw new AppError(404, '文章不存在');
  }
  res.json({ code: 0, data: article, msg: '获取成功' });
}));

router.post('/', authenticate, requireJsonObject, validate(createSchema), asyncHandler(async (req, res) => {
  const article = await prisma.article.create({
    data: { ...req.validated.body, userId: req.user.id },
    include: { author: { select: { id: true, username: true } } },
  });
  res.status(201).json({ code: 0, data: article, msg: '创建成功' });
}));

router.patch('/:id', authenticate, validate(idSchema, 'params'), requireJsonObject, validate(updateSchema), asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const result = await prisma.article.updateMany({
    where: { id, userId: req.user.id },
    data: req.validated.body,
  });
  if (result.count === 0) {
    throw new AppError(404, '文章不存在或无权修改');
  }
  const article = await prisma.article.findUnique({
    where: { id },
    include: { author: { select: { id: true, username: true } } },
  });
  res.json({ code: 0, data: article, msg: '更新成功' });
}));

router.delete('/:id', authenticate, validate(idSchema, 'params'), asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const result = await prisma.article.deleteMany({
    where: { id, userId: req.user.id },
  });
  if (result.count === 0) {
    throw new AppError(404, '文章不存在或无权删除');
  }
  res.json({ code: 0, data: { id }, msg: '删除成功' });
}));

module.exports = router;
