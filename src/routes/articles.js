const express = require('express');
const { z } = require('zod');
const articleController = require('../controller/articleController');
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

router.get('/', validate(listSchema, 'query'), articleController.list);
router.get('/:id', validate(idSchema, 'params'), articleController.getById);
router.post('/', authenticate, requireJsonObject, validate(createSchema), articleController.create);
router.patch(
  '/:id',
  authenticate,
  validate(idSchema, 'params'),
  requireJsonObject,
  validate(updateSchema),
  articleController.update,
);
router.delete('/:id', authenticate, validate(idSchema, 'params'), articleController.remove);

module.exports = router;
