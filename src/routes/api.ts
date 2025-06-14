import { Hono } from 'hono';
import { cache } from 'hono/cache';
import { etag } from 'hono/etag';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { PhotoSetDAO, CategoryDAO, TagDAO } from '../lib/dao.js';
import {
  PhotoSetQuerySchema,
  SlugParamSchema,
  TagQuerySchema,
  HotQuerySchema
} from '../lib/schemas.js';
import type { PhotoSetQueryParams } from '../types/index.js';

const api = new Hono();

// 添加中间件
api.use('*', logger());
api.use('*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  allowMethods: ['GET', 'HEAD', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400
}));
api.use('*', etag());

// 为静态内容添加缓存
api.use('/categories', cache({
  cacheName: 'api-categories',
  cacheControl: 'max-age=3600', // 1小时缓存
}));

api.use('/tags', cache({
  cacheName: 'api-tags',
  cacheControl: 'max-age=1800', // 30分钟缓存
}));



// 获取套图列表
api.get('/photosets', zValidator('query', PhotoSetQuerySchema), async (c) => {
  const query = c.req.valid('query');

  const params: PhotoSetQueryParams = {
    page: query.page,
    limit: query.limit,
    category: query.category,
    tag: query.tag,
    search: query.search,
    sort: query.sort as any
  };

  const result = PhotoSetDAO.getPhotoSets(params);

  // 设置缓存头
  c.header('Cache-Control', 'public, max-age=300'); // 5分钟缓存

  return c.json({
    success: true,
    data: result.data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      pages: Math.ceil(result.total / query.limit),
      hasNext: query.page < Math.ceil(result.total / query.limit),
      hasPrev: query.page > 1
    }
  });
});

// 获取套图详情
api.get('/photosets/:slug', zValidator('param', SlugParamSchema), async (c) => {
  const { slug } = c.req.valid('param');

  const photoSet = PhotoSetDAO.getPhotoSetBySlug(slug);

  if (!photoSet) {
    throw new HTTPException(404, { message: '套图不存在' });
  }

  // 设置缓存头
  c.header('Cache-Control', 'public, max-age=300'); // 5分钟缓存

  return c.json({
    success: true,
    data: photoSet
  });
});

// 获取分类列表
api.get('/categories', async (c) => {
  try {
    const categories = CategoryDAO.getCategoriesWithCount();

    // 设置长期缓存，因为分类变化不频繁
    c.header('Cache-Control', 'public, max-age=3600'); // 1小时缓存

    return c.json({
      success: true,
      data: categories,
      meta: {
        total: categories.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return c.json({ success: false, message: '获取分类列表失败' }, 500);
  }
});

// 获取标签列表
api.get('/tags', zValidator('query', TagQuerySchema), async (c) => {
  const { limit } = c.req.valid('query');

  const tags = TagDAO.getPopularTags(limit);

  // 设置中等缓存时间
  c.header('Cache-Control', 'public, max-age=1800'); // 30分钟缓存

  return c.json({
    success: true,
    data: tags,
    meta: {
      total: tags.length,
      limit: limit,
      timestamp: new Date().toISOString()
    }
  });
});

// 获取热门套图
api.get('/hot', zValidator('query', HotQuerySchema), async (c) => {
  const { limit } = c.req.valid('query');

  const hotPhotoSets = PhotoSetDAO.getTopPhotoSets(limit);

  // 设置短期缓存，因为热门内容变化较快
  c.header('Cache-Control', 'public, max-age=600'); // 10分钟缓存

  return c.json({
    success: true,
    data: hotPhotoSets,
    meta: {
      total: hotPhotoSets.length,
      limit: limit,
      timestamp: new Date().toISOString()
    }
  });
});

// API健康检查
api.get('/health', async (c) => {
  try {
    // 简单的数据库连接测试
    const categories = CategoryDAO.getCategoriesWithCount();

    return c.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: {
        connected: true,
        categories_count: categories.length
      }
    });
  } catch (error) {
    console.error('健康检查失败:', error);
    return c.json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: '数据库连接失败'
    }, 503);
  }
});

// API信息
api.get('/', async (c) => {
  return c.json({
    name: '看图网站 API',
    version: '1.0.0',
    description: '基于 HonoJS 的图片分享网站 API',
    endpoints: {
      photosets: '/api/photosets',
      categories: '/api/categories',
      tags: '/api/tags',
      hot: '/api/hot',
      health: '/api/health'
    },
    documentation: 'https://github.com/your-repo/kansetsu',
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
api.onError((err, c) => {
  console.error('API错误:', err);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json({
    success: false,
    message: '服务器内部错误',
    timestamp: new Date().toISOString()
  }, 500);
});

// 404处理
api.notFound((c) => {
  return c.json({
    success: false,
    message: 'API端点不存在',
    timestamp: new Date().toISOString(),
    available_endpoints: [
      '/api/photosets',
      '/api/photosets/:slug',
      '/api/categories',
      '/api/tags',
      '/api/hot',
      '/api/health'
    ]
  }, 404);
});

export default api;
