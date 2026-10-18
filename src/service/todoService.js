const crypto = require('crypto');
const todoRepository = require('../repository/todoRepository');
const { AppError } = require('../utils/errors');

function list() {
  return todoRepository.readAll();
}

function create(data) {
  const todo = {
    id: `${Date.now()}${crypto.randomBytes(8).toString('hex')}`,
    title: data.title,
    completed: data.completed,
    createdAt: new Date().toISOString(),
  };
  const todos = todoRepository.readAll();
  todos.push(todo);
  todoRepository.writeAll(todos);
  return todo;
}

function update(id, data) {
  const todos = todoRepository.readAll();
  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) {
    throw new AppError(404, '待办事项不存在');
  }
  Object.assign(todos[index], data);
  todoRepository.writeAll(todos);
  return todos[index];
}

function remove(id) {
  const todos = todoRepository.readAll();
  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) {
    throw new AppError(404, '待办事项不存在');
  }
  const [todo] = todos.splice(index, 1);
  todoRepository.writeAll(todos);
  return todo;
}

module.exports = { list, create, update, remove };
