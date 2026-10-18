const todoService = require('../service/todoService');

function list(req, res) {
  res.json({ code: 0, data: todoService.list(), msg: '获取成功' });
}

function create(req, res) {
  const todo = todoService.create(req.validated.body);
  res.status(201).json({ code: 0, data: todo, msg: '新增成功' });
}

function update(req, res) {
  const todo = todoService.update(req.params.id, req.validated.body);
  res.json({ code: 0, data: todo, msg: '更新成功' });
}

function remove(req, res) {
  const todo = todoService.remove(req.params.id);
  res.json({ code: 0, data: todo, msg: '删除成功' });
}

module.exports = { list, create, update, remove };
