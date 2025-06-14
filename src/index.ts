import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import { compress } from 'hono/compress';
import { serveStatic } from '@hono/node-server/serve-static';
import { jsxRenderer } from 'hono/jsx-renderer';

// 导入路由
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import pageRoutes from './routes/pages.js';

// 初始化数据库
import { initStatements } from './lib/database.js';
import { PhotoSetDAO, CategoryDAO } from './lib/dao.js';
import { env } from './lib/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { Layout } from './components/Layout.js';

const app = new Hono();

// 基础中间件
app.use('*', logger());
app.use('*', timing());
app.use('*', compress());
app.use('*', secureHeaders());
app.use('*', prettyJSON());

// CORS配置
app.use('*', cors({
  origin: (origin) => {
    // 开发环境允许所有本地地址
    if (env.NODE_ENV === 'development') {
      return origin?.includes('localhost') || origin?.includes('127.0.0.1') ? origin : env.ALLOWED_ORIGINS[0];
    }
    // 生产环境检查允许的域名列表
    return env.ALLOWED_ORIGINS.includes(origin || '') ? origin : false;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24小时
}));

// 暂时注释JSX Renderer，先测试基本JSX功能
// app.use('*', jsxRenderer(({ children, title, description, keywords, ogImage, canonical }) => {
//   return (
//     <Layout
//       title={title}
//       description={description}
//       keywords={keywords}
//       ogImage={ogImage}
//       canonical={canonical}
//     >
//       {children}
//     </Layout>
//   );
// }));

// 静态文件服务
app.use('/public/*', serveStatic({ root: './' }));

// 初始化数据库语句
try {
  initStatements();
  console.log('数据库连接成功');
} catch (error) {
  console.error('数据库连接失败:', error);
  process.exit(1);
}

// 暂时移除JSX测试，专注于其他功能

// 路由
app.route('/api', apiRoutes);
app.route('/admin', adminRoutes);
app.route('/', pageRoutes);

// SEO相关路由
app.get('/robots.txt', (c) => {
  return c.text(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${new URL('/sitemap.xml', c.req.url).toString()}`);
});

app.get('/sitemap.xml', async (c) => {
  try {
    const baseUrl = new URL('/', c.req.url).origin;

    // 获取所有套图和分类
    const photoSets = PhotoSetDAO.getPhotoSets({ limit: 1000 });
    const categories = CategoryDAO.getCategoriesWithCount();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/categories</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/tags</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

    // 添加分类页面
    categories.forEach(category => {
      sitemap += `
  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // 添加套图详情页
    photoSets.data.forEach(photoSet => {
      sitemap += `
  <url>
    <loc>${baseUrl}/photoset/${photoSet.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${new Date(photoSet.published_at).toISOString().split('T')[0]}</lastmod>
  </url>`;
    });

    sitemap += `
</urlset>`;

    c.header('Content-Type', 'application/xml');
    return c.text(sitemap);
  } catch (error) {
    console.error('生成sitemap失败:', error);
    return c.text('Internal Server Error', 500);
  }
});

// 错误处理
app.onError(errorHandler);

// 404处理
app.notFound(notFoundHandler);

serve({
  fetch: app.fetch,
  port: env.PORT
}, (info) => {
  console.log(`🚀 服务器运行在 http://localhost:${info.port}`);
  console.log(`📊 管理后台: http://localhost:${info.port}/admin/login`);
  console.log(`🔧 API接口: http://localhost:${info.port}/api`);
  console.log(`📄 API文档: http://localhost:${info.port}/api/health`);

  if (env.NODE_ENV === 'development') {
    console.log(`🧪 测试页面: http://localhost:${info.port}/test`);
  }
});
