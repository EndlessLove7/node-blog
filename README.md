# 拾页博客全栈项目

这是一个使用 **React + Vite + Node.js + Express + Prisma + MySQL** 实现的全栈博客项目。前端位于 `client/`，后端 API 位于 `src/`，Prisma 管理数据库模型和迁移。

## 项目当前包含什么

| 部分 | 已实现内容 |
| --- | --- |
| 前端页面 | 博客首页、文章搜索/排序/分页、文章详情、注册登录、创建和编辑自己的文章、封面上传 |
| 后端 API | 用户注册/登录/鉴权、文章增删改查、分页搜索、封面上传、原有 TODO 接口 |
| 数据库 | MySQL 中的 `User` 和 `Article` 表；由 Prisma 管理模型和迁移 |
| 图片存储 | 图片文件保存在本地 `uploads/` 目录，由 Express 提供静态访问 |

开发时，React 前端运行在 `http://127.0.0.1:5173`，Express API 运行在 `http://127.0.0.1:3000`；Vite 会代理 `/api` 和 `/uploads` 请求。生产构建后，Express 会托管 `client/dist/`，网页和 API 共用 `http://127.0.0.1:3000`。

## 技术如何协作

```text
浏览器中的 React 前端 / Postman
              │ HTTP + JSON / 图片表单
              ▼
       Vite 开发服务器 (127.0.0.1:5173)
              │ 代理 /api 和 /uploads
              ▼
       Express 后端 (127.0.0.1:3000)
       ├── Zod：校验请求参数
       ├── JWT：验证登录身份
       ├── Multer：接收封面图片
       └── Prisma Client：读写数据
              │
              ├── MySQL：用户和文章数据
              └── uploads/：图片文件
```

- **Express** 接收 HTTP 请求、选择对应路由并返回 JSON。
- **Prisma** 根据 `prisma/schema.prisma` 中的数据模型，生成 JavaScript 客户端并访问 MySQL。SQL 迁移保存在 `prisma/migrations/`。
- **MySQL** 持久化用户和文章。密码不以明文存储，而是使用 bcrypt 哈希后保存。
- **JWT** 在登录成功后签发。调用受保护接口时，将 token 放到 `Authorization: Bearer <token>` 请求头中。
- **Zod** 校验用户名、密码、文章内容、分页参数等输入；全局错误处理中间件负责统一返回错误 JSON，日志中记录请求方法、路径、状态码和耗时。
- **Multer** 接收图片文件。只允许 JPG、PNG、WebP，大小不超过 5 MB；文件保存到 `uploads/`，响应中返回可访问的相对 URL。

成功和失败的 JSON 响应统一为：

```json
{
  "code": 0,
  "data": {},
  "msg": "操作成功"
}
```

失败时 `code` 为非零值，`data` 通常为 `null`；参数校验错误会在 `data` 中列出错误字段。

## 目录说明

```text
.
├── http-server.js            # 后端服务启动入口
├── client/                   # React + Vite 前端
│   ├── index.html            # 前端 HTML 入口
│   ├── vite.config.js        # Vite 配置与本地 API 代理
│   └── src/
│       ├── main.jsx          # React 挂载入口
│       ├── App.jsx           # 页面、登录、文章浏览与编辑
│       └── style.css         # 响应式界面样式
├── src/
│   ├── app.js                # Express 应用、中间件和生产前端托管
│   ├── config/
│   │   └── index.js          # 读取并校验 .env 配置
│   ├── controller/           # 接收请求参数并组织 HTTP 响应
│   │   ├── authController.js
│   │   ├── articleController.js
│   │   ├── uploadController.js
│   │   └── todoController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT 鉴权
│   │   └── validate.js       # Zod 参数校验
│   ├── routes/
│   │   ├── auth.js           # 用户路由与请求参数校验
│   │   ├── articles.js       # 文章路由与请求参数校验
│   │   ├── upload.js         # 封面上传路由
│   │   └── todos.js          # TODO 路由与请求参数校验
│   ├── repository/           # 数据访问与持久化
│   │   ├── prisma.js         # Prisma Client 实例
│   │   ├── userRepository.js
│   │   ├── articleRepository.js
│   │   ├── todoRepository.js
│   │   └── uploadRepository.js
│   ├── service/              # 用户、文章、TODO、上传业务逻辑
│   │   ├── authService.js
│   │   ├── articleService.js
│   │   ├── todoService.js
│   │   └── uploadService.js
│   └── utils/
│       └── errors.js         # 统一错误类型、异步处理和错误响应
├── prisma/
│   ├── schema.prisma         # User、Article 数据模型
│   └── migrations/           # 数据库迁移记录
├── uploads/                  # 上传的图片文件
├── test/                     # 创建博客 API 前的原有学习文件和服务备份
│   ├── http-server.js        # 改写前的纯 Node.js TODO 服务备份
│   └── data.json             # 原 TODO 数据，当前 TODO API 继续读写此文件
├── .env.example              # 环境变量示例，不含真实密码
└── README.md                 # 本说明文件
```

根目录的 `http-server.js` 是**后端服务入口**，启动过程如下：
```text
http-server.js
  ├─ 引入 src/app.js
  │    ├─ 注册中间件与各业务路由
  │    └─ 路由 -> 控制器 -> 服务 -> 仓储
  ├─ 引入 src/repository/prisma.js
  ├─ prisma.$connect()       连接数据库
  └─ app.listen(...)         启动 HTTP 服务
```
`routes/` 负责接口路径、参数校验与中间件编排；`controller/` 处理 HTTP 请求和响应；`service/` 承载业务逻辑；`repository/` 封装数据库及文件访问。鉴权和参数校验由 `middleware/` 处理，环境配置和通用错误处理分别位于 `config/`、`utils/`。
`test/http-server.js` 是旧服务备份，不是当前启动入口。博客前端现在位于 `client/`；`test/` 中的 HTML/JavaScript 是原有学习文件，不属于博客页面。

## 本机安装与启动

项目需要 Node.js 20 或更高版本，以及正在运行的 MySQL 服务。

1. 确认本机 MySQL 服务已启动，并且数据库 `blog` 已创建。
2. 首次配置时复制 `.env.example` 为 `.env`，设置 `DATABASE_URL` 和至少 32 个字符的随机 `JWT_SECRET`。`.env` 含数据库凭据，已加入忽略列表，**不要提交或分享这个文件**。
3. 安装依赖、生成 Prisma Client，并应用数据库迁移：

   ```sh
   npm install
   npx prisma generate
   npx prisma migrate deploy
   ```

   数据库迁移会创建 `User` 和 `Article` 表。已完成项目初始化的本机无需再次创建数据库账号；运行时配置已写在本机私有的 `.env` 中。
4. 同时启动后端和前端开发服务器：

   ```sh
   npm run dev:full
   ```

   浏览器访问 `http://127.0.0.1:5173` 使用前端；后端 API 地址为 `http://127.0.0.1:3000`。只启动后端可运行 `npm start`，只启动前端可运行 `npm run dev:client`。

5. 构建并使用 Express 托管前端：

   ```sh
   npm run build:client
   npm start
   ```

   然后访问 `http://127.0.0.1:3000/`。前端构建文件位于 `client/dist/`，不需要单独部署第二个 Web 服务。

其他脚本：

| 命令 | 说明 |
| --- | --- |
| `npm run prisma:generate` | 按 Prisma 模型生成客户端 |
| `npm run db:migrate` | 在数据库部署已有迁移 |
| `npm run dev` | 以开发监听模式启动后端 |
| `npm run dev:client` | 启动前端开发服务器 |
| `npm run dev:full` | 同时启动前端和后端 |
| `npm run build:client` | 构建生产前端文件 |

## API 接口

### 用户

| 方法 | 路径 | 是否登录 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | 否 | 注册；用户名为 3–32 位英文字母、数字或下划线，密码至少 8 字符且最多 72 字节 |
| `POST` | `/api/auth/login` | 否 | 验证用户名和密码，成功后返回 JWT 与用户资料 |
| `GET` | `/api/auth/me` | 是 | 获取当前登录用户资料 |

注册和登录请求示例：

```json
{
  "username": "alice_01",
  "password": "your-password"
}
```

登录成功后，将返回 JSON 中的 `data.token` 用于后续需要登录的请求：

```http
Authorization: Bearer <登录返回的 token>
```

注册和登录路径中使用的用户名会转成小写保存，因此用户名不区分大小写。

### 文章

| 方法 | 路径 | 是否登录 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/api/articles?page=1&pageSize=10&keyword=Node&order=desc` | 否 | 文章分页、按标题或正文关键词搜索、按创建时间排序；`order` 可为 `asc` 或 `desc` |
| `GET` | `/api/articles/:id` | 否 | 获取文章详情 |
| `POST` | `/api/articles` | 是 | 新增文章，作者来自当前登录用户 |
| `PATCH` | `/api/articles/:id` | 是 | 修改自己的文章 |
| `DELETE` | `/api/articles/:id` | 是 | 删除自己的文章 |

创建文章的请求示例：

```json
{
  "title": "我的第一篇文章",
  "content": "文章正文",
  "coverImageUrl": "/uploads/上传接口返回的文件名.png"
}
```

文章封面地址为可选字段；文章修改时只需提供想修改的字段。越权修改或删除会返回“文章不存在或无权修改/删除”。

### 封面图片

| 方法 | 路径 | 是否登录 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/upload/cover` | 是 | 使用 `multipart/form-data` 上传图片，表单字段名为 `file` |

上传成功后，响应的 `data.url` 可填入文章的 `coverImageUrl`。图片通过 `/uploads/<文件名>` 访问。这里使用本地文件夹保存，尚未接入云对象存储。

### 原 TODO 接口

`GET|POST /todos` 和 `PUT|DELETE /todos/:id` 仍可使用，数据保存在 `test/data.json`。这是之前学习项目的兼容接口，不属于博客文章数据库模型。

## 开发提示

- API 只监听本机回环地址 `127.0.0.1`，适用于当前电脑本地开发；其他设备默认不能连接。
- 如果 3000 端口被占用，可在 `.env` 中更改 `PORT`。
- 登录 token 的有效期由 `JWT_EXPIRES_IN` 设置，默认 `7d`。
- 若修改 Prisma 模型，需生成对应迁移并提交迁移文件，然后部署迁移；不要在有重要数据的数据库上随意重置数据库。
- 当前图片保存在本机磁盘。生产环境通常应另行配置持久化存储或对象存储、HTTPS、备份和访问控制。
