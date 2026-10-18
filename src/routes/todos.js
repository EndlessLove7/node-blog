const express = require('express');
const { z } = require('zod');
const todoController = require('../controller/todoController');
const { validate, requireJsonObject } = require('../middleware/validate');

const router = express.Router();
const createSchema = z.object({
  title: z.string().trim().min(1),
  completed: z.boolean().optional().default(false),
});
const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  completed: z.boolean(),
});

router.get('/', todoController.list);
router.post('/', requireJsonObject, validate(createSchema), todoController.create);
router.put('/:id', requireJsonObject, validate(updateSchema), todoController.update);
router.delete('/:id', todoController.remove);

module.exports = router;
