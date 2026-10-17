const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { z } = require('zod');
const { AppError } = require('../errors');
const { validate, requireJsonObject } = require('../middleware/validate');

const router = express.Router();
const dataFile = path.join(__dirname, '..', '..', 'test', 'data.json');
const createSchema = z.object({
  title: z.string().trim().min(1),
  completed: z.boolean().optional().default(false),
});
const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  completed: z.boolean(),
});

function readTodos() {
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

function writeTodos(todos) {
  fs.writeFileSync(dataFile, `${JSON.stringify(todos, null, 2)}\n`, 'utf8');
}

router.get('/', (req, res) => {
  res.json({ code: 0, data: readTodos(), msg: '获取成功' });
});

router.post('/', requireJsonObject, validate(createSchema), (req, res) => {
  const todo = {
    id: `${Date.now()}${crypto.randomBytes(8).toString('hex')}`,
    title: req.validated.body.title,
    completed: req.validated.body.completed,
    createdAt: new Date().toISOString(),
  };
  const todos = readTodos();
  todos.push(todo);
  writeTodos(todos);
  res.status(201).json({ code: 0, data: todo, msg: '新增成功' });
});

router.put('/:id', requireJsonObject, validate(updateSchema), (req, res, next) => {
  const todos = readTodos();
  const index = todos.findIndex((todo) => todo.id === req.params.id);
  if (index === -1) {
    return next(new AppError(404, '待办事项不存在'));
  }
  Object.assign(todos[index], req.validated.body);
  writeTodos(todos);
  return res.json({ code: 0, data: todos[index], msg: '更新成功' });
});

router.delete('/:id', (req, res, next) => {
  const todos = readTodos();
  const index = todos.findIndex((todo) => todo.id === req.params.id);
  if (index === -1) {
    return next(new AppError(404, '待办事项不存在'));
  }
  const [todo] = todos.splice(index, 1);
  writeTodos(todos);
  return res.json({ code: 0, data: todo, msg: '删除成功' });
});

module.exports = router;
