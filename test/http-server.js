const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

function sendJson(res, statusCode, code, data, msg) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ code, data, msg }));
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function readTodos() {
  ensureDataFile();
  const content = fs.readFileSync(DATA_FILE, 'utf8');
  if (!content.trim()) return [];

  try {
    const todos = JSON.parse(content);
    return Array.isArray(todos) ? todos : [];
  } catch (error) {
    throw new Error('data.json 数据格式错误');
  }
}

function writeTodos(todos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), 'utf8');
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let tooLarge = false;

    req.on('data', (chunk) => {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > 1 * 1024 * 1024) {
        tooLarge = true;
        body = '';
      }
    });

    req.on('end', () => {
      if (tooLarge) {
        reject(new Error('请求体过大'));
        return;
      }

      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('JSON 参数错误'));
      }
    });

    req.on('error', (error) => reject(error));
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const method = req.method;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    console.log(`${method} ${pathname}`);

    if (pathname === '/' && method === 'GET') {
      return sendJson(res, 200, 0, {
        endpoints: [
          'GET /todos',
          'POST /todos',
          'PUT /todos/:id',
          'DELETE /todos/:id',
        ],
      }, 'TODO API 服务已启动');
    }

    if (pathname === '/todos') {
      if (method === 'GET') {
        const todos = readTodos();
        return sendJson(res, 200, 0, todos, '获取成功');
      }

      if (method === 'POST') {
        const body = await parseJsonBody(req);

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          return sendJson(res, 400, 400, null, '请求体必须为 JSON 对象');
        }

        if (typeof body.title !== 'string' || !body.title.trim()) {
          return sendJson(res, 400, 400, null, 'title 不能为空');
        }

        const todos = readTodos();
        const todo = {
          id: Date.now().toString() + Math.random().toString(16).slice(2),
          title: body.title.trim(),
          completed: Boolean(body.completed),
          createdAt: new Date().toISOString(),
        };

        todos.push(todo);
        writeTodos(todos);
        return sendJson(res, 200, 0, todo, '新增成功');
      }

      return sendJson(res, 405, 405, null, '该接口不支持该请求方法');
    }

    const todoMatch = pathname.match(/^\/todos\/([^/]+)$/);
    if (todoMatch) {
      const todoId = todoMatch[1];
      const todos = readTodos();
      const index = todos.findIndex((todo) => todo.id === todoId);

      if (index === -1) {
        return sendJson(res, 404, 404, null, '待办事项不存在');
      }

      if (method === 'PUT') {
        const body = await parseJsonBody(req);

        if (body && typeof body === 'object' && !Array.isArray(body)) {
          if (typeof body.completed !== 'boolean') {
            return sendJson(res, 400, 400, null, 'completed 必须为布尔值');
          }

          if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim())) {
            return sendJson(res, 400, 400, null, 'title 必须为非空字符串');
          }

          if (body.completed !== undefined && typeof body.completed !== 'boolean') {
            return sendJson(res, 400, 400, null, 'completed 必须为布尔值');
          }
        } else {
          return sendJson(res, 400, 400, null, '请求体必须为 JSON 对象');
        }

        if (body.title !== undefined) {
          todos[index].title = body.title.trim();
        }

        if (body.completed !== undefined) {
          todos[index].completed = body.completed;
        }

        writeTodos(todos);
        return sendJson(res, 200, 0, todos[index], '更新成功');
      }

      if (method === 'DELETE') {
        const [deletedTodo] = todos.splice(index, 1);
        writeTodos(todos);
        return sendJson(res, 200, 0, deletedTodo, '删除成功');
      }

      return sendJson(res, 405, 405, null, '该接口不支持该请求方法');
    }

    return sendJson(res, 404, 404, null, '接口不存在');
  } catch (error) {
    console.error('全局错误:', error);
    const statusCode = error.message === 'JSON 参数错误' || error.message === '请求体过大' ? 400 : 500;
    return sendJson(res, statusCode, statusCode, null, error.message || '服务器内部错误');
  }
});

server.listen(PORT, () => {
  console.log(`TODO API server is running at http://127.0.0.1:${PORT}`);
});
