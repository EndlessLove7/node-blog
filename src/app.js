const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { notFound, errorHandler } = require('./errors');

const app = express();
const clientDist = path.join(__dirname, '..', 'client', 'dist');

app.disable('x-powered-by');
// 全局中间件，都会经过
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - startedAt}ms`);
  });
  next();
});
// 内置中间件，注册 JSON 请求体解析中间件， limit 限制请求体大小。
app.use(express.json({ limit: '1mb' }));
// 路由级中间件，只处理 /uploads 开头的请求。express.static(...) 返回一个静态文件中间件，用来读取 config.uploadDir 目录中的图片并发送给请求方。
// 例如，磁盘上的 uploads/picture.png 可以通过：
// http://127.0.0.1:3000/uploads/picture.png 访问。
// 这里的 '/uploads' 是 URL 前缀，config.uploadDir 是服务器上的实际目录。
app.use('/uploads', express.static(config.uploadDir, { dotfiles: 'deny', index: false }));
app.use(express.static(clientDist, { index: false }));

app.get('/', (req, res) => {
  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    return res.sendFile(path.join(clientDist, 'index.html'));
  }
  res.json({
    code: 0,
    data: {
      endpoints: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/me',
        'GET /api/articles',
        'GET /api/articles/:id',
        'POST /api/articles',
        'PATCH /api/articles/:id',
        'DELETE /api/articles/:id',
        'POST /api/upload/cover',
        'GET|POST /todos',
      ],
    },
    msg: 'Blog API 服务已启动',
  });
});
// 加载用户路由模块， 并把它挂载在 /api/auth 前缀下
// 例如，如果 routes/auth.js 内部写了：router.post('/login', ...);
// 挂载到 /api/auth 后，完整请求路径就是：POST /api/auth/login
// Express 会把挂载前缀和路由内部路径组合起来。 这个机制让不同功能可以拆分在不同文件中，而不用把所有接口都写在 app.js。
app.use('/api/auth', require('./routes/auth'));
// 加载文章模块，并把它挂载在 /api/articles 前缀下.....
app.use('/api/articles', require('./routes/articles'));
app.use('/api/upload', require('./routes/upload'));
app.use('/todos', require('./routes/todos'));
app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/api/')
    || req.path === '/todos'
    || req.path.startsWith('/todos/')
    || req.path.startsWith('/uploads/')
    || path.extname(req.path)
  ) {
    return next();
  }
  if (!fs.existsSync(clientDist)) {
    return next();
  }
  return res.sendFile(path.join(clientDist, 'index.html'), (error) => {
    if (error) next(error);
  });
});
app.use(notFound);
app.use(errorHandler);

fs.mkdirSync(config.uploadDir, { recursive: true });

module.exports = app;
