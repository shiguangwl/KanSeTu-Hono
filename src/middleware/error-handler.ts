import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { env } from '../lib/env.js';

// 错误类型定义
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// 创建应用错误
export const createError = (
  message: string, 
  statusCode: number = 500, 
  code?: string, 
  details?: any
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

// 常见错误创建函数
export const errors = {
  notFound: (resource: string = '资源') => 
    createError(`${resource}不存在`, 404, 'NOT_FOUND'),
  
  badRequest: (message: string = '请求参数错误') => 
    createError(message, 400, 'BAD_REQUEST'),
  
  unauthorized: (message: string = '未授权访问') => 
    createError(message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message: string = '禁止访问') => 
    createError(message, 403, 'FORBIDDEN'),
  
  conflict: (message: string = '资源冲突') => 
    createError(message, 409, 'CONFLICT'),
  
  tooManyRequests: (message: string = '请求过于频繁') => 
    createError(message, 429, 'TOO_MANY_REQUESTS'),
  
  internal: (message: string = '服务器内部错误') => 
    createError(message, 500, 'INTERNAL_ERROR'),
  
  serviceUnavailable: (message: string = '服务暂时不可用') => 
    createError(message, 503, 'SERVICE_UNAVAILABLE')
};

// 错误响应格式化
const formatErrorResponse = (error: Error | HTTPException | AppError, c: Context) => {
  const timestamp = new Date().toISOString();
  const requestId = c.get('requestId') || 'unknown';
  
  // HTTPException 处理
  if (error instanceof HTTPException) {
    return {
      success: false,
      error: {
        message: error.message,
        status: error.status,
        timestamp,
        requestId
      }
    };
  }
  
  // AppError 处理
  if ('statusCode' in error) {
    const appError = error as AppError;
    const response: any = {
      success: false,
      error: {
        message: appError.message,
        status: appError.statusCode || 500,
        timestamp,
        requestId
      }
    };
    
    if (appError.code) {
      response.error.code = appError.code;
    }
    
    // 开发环境下包含更多错误信息
    if (env.NODE_ENV === 'development') {
      response.error.stack = appError.stack;
      if (appError.details) {
        response.error.details = appError.details;
      }
    }
    
    return response;
  }
  
  // 普通 Error 处理
  const response: any = {
    success: false,
    error: {
      message: env.NODE_ENV === 'production' ? '服务器内部错误' : error.message,
      status: 500,
      timestamp,
      requestId
    }
  };
  
  // 开发环境下包含堆栈信息
  if (env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }
  
  return response;
};

// 错误处理中间件
export const errorHandler = (error: Error | HTTPException | AppError, c: Context) => {
  // 记录错误日志
  const logLevel = error instanceof HTTPException && error.status < 500 ? 'warn' : 'error';
  console[logLevel]('请求错误:', {
    message: error.message,
    stack: error.stack,
    url: c.req.url,
    method: c.req.method,
    userAgent: c.req.header('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // 格式化错误响应
  const errorResponse = formatErrorResponse(error, c);
  const status = errorResponse.error.status;
  
  // 设置错误响应头
  c.header('Content-Type', 'application/json');
  
  // 对于某些错误类型，添加特殊头部
  if (status === 429) {
    c.header('Retry-After', '60'); // 1分钟后重试
  }
  
  if (status === 503) {
    c.header('Retry-After', '300'); // 5分钟后重试
  }
  
  return c.json(errorResponse, status);
};

// 404 处理器
export const notFoundHandler = (c: Context) => {
  const isApiRequest = c.req.url.includes('/api/');
  
  if (isApiRequest) {
    return c.json({
      success: false,
      error: {
        message: 'API端点不存在',
        status: 404,
        timestamp: new Date().toISOString(),
        path: new URL(c.req.url).pathname
      }
    }, 404);
  }
  
  // 非API请求返回HTML 404页面
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>页面未找到 - 看图网站</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50 flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">页面未找到</h2>
        <p class="text-gray-600 mb-8">抱歉，您访问的页面不存在。</p>
        <a href="/" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          返回首页
        </a>
      </div>
    </body>
    </html>
  `, 404);
};
