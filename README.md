# 看图网站 (KanSeTu)

一个基于 HonoJS 的现代化图片分享网站，支持服务端渲染(SSR)、管理后台和SEO优化。

## 🚀 功能特性

### 前台功能
- ✅ 响应式瀑布流布局展示套图
- ✅ 套图详情页面，支持图片查看器
- ✅ 分类筛选和浏览
- ✅ 标签系统
- ✅ 搜索功能
- ✅ 热门推荐
- ✅ SEO友好的URL结构

### 后台管理
- ✅ 管理员登录认证
- ✅ 仪表盘数据统计
- ✅ 套图管理 (CRUD)
- ✅ 分类管理
- ✅ JWT Token认证

### SEO优化
- ✅ 服务端渲染(SSR)
- ✅ 动态生成sitemap.xml
- ✅ robots.txt配置
- ✅ Meta标签优化
- ✅ Open Graph支持
- ✅ 语义化HTML结构

### HonoJS 最佳实践
- ✅ 中间件链式处理
- ✅ 请求验证和错误处理
- ✅ 响应缓存和性能优化
- ✅ 安全头部配置
- ✅ CORS 跨域处理
- ✅ 环境配置管理
- ✅ 结构化错误响应
- ✅ API 健康检查

## 🛠 技术栈

- **后端框架**: HonoJS (基于最新最佳实践)
- **视图层**: JSX + SSR
- **数据库**: SQLite + better-sqlite3
- **CSS框架**: Tailwind CSS
- **认证**: JWT + bcrypt
- **运行时**: Node.js/Bun/Deno兼容
- **中间件**:
  - 压缩 (compress)
  - 安全头 (secure-headers)
  - 缓存 (cache)
  - CORS
  - 请求验证
  - 错误处理
  - 性能监控 (timing)

## 📦 快速开始

### 环境要求
- Node.js 18+ 或 Bun
- pnpm (推荐)

### 安装依赖
```bash
pnpm install
```

### 初始化数据库
```bash
pnpm run db:init
```

### 添加示例数据
```bash
pnpm run db:sample
```

### 启动开发服务器
```bash
pnpm run dev
```

访问 http://localhost:3000 查看网站

## 🔐 管理后台

访问 http://localhost:3000/admin/login

默认管理员账户：
- 用户名: `admin`
- 密码: `admin123`

## 🔧 API接口

### 前台API
- `GET /api` - API信息和文档
- `GET /api/health` - 健康检查
- `GET /api/photosets` - 获取套图列表 (支持分页、筛选、排序)
- `GET /api/photosets/:slug` - 获取套图详情
- `GET /api/categories` - 获取分类列表
- `GET /api/tags` - 获取标签列表
- `GET /api/hot` - 获取热门套图

### 管理后台API
- `POST /admin/login` - 管理员登录
- `GET /admin/dashboard-stats` - 仪表盘统计
- `GET /admin/photosets` - 获取套图列表(管理员)
- `POST /admin/photosets` - 创建套图
- `PUT /admin/photosets/:id` - 更新套图
- `DELETE /admin/photosets/:id` - 删除套图

## 📊 主要功能演示

1. **首页**: http://localhost:3000
2. **套图详情**: 点击任意套图查看
3. **管理后台**: http://localhost:3000/admin/login
4. **API接口**: http://localhost:3000/api
5. **健康检查**: http://localhost:3000/api/health
6. **SEO**: http://localhost:3000/sitemap.xml

---

**看图网站** - 让美好图片触手可及 ✨
