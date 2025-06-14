import type { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';

// JWT Token接口
interface JWTPayload {
  userId: number;
  username: string;
  iat?: number;
  exp?: number;
}

// 生成JWT Token
export const generateToken = (userId: number, username: string): string => {
  return jwt.sign(
    { userId, username },
    env.JWT_SECRET,
    { expiresIn: '7d' } // 7天过期
  );
};

// 验证JWT Token
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

// 认证中间件
export const authMiddleware = async (c: Context, next: Next) => {
  // 从请求头获取token
  let token = c.req.header('Authorization');

  if (token && token.startsWith('Bearer ')) {
    token = token.substring(7);
  }

  if (!token) {
    return c.json({ success: false, message: '未提供认证令牌' }, 401);
  }

  const payload = verifyToken(token);
  if (!payload) {
    return c.json({ success: false, message: '无效的认证令牌' }, 401);
  }

  // 将用户信息添加到上下文中
  c.set('user', payload);
  await next();
};

// 可选认证中间件（不强制要求登录）
export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  let token = c.req.header('Authorization');

  if (token && token.startsWith('Bearer ')) {
    token = token.substring(7);
  }

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      c.set('user', payload);
    }
  }

  await next();
};

// 从上下文中获取当前用户
export const getCurrentUser = (c: Context): JWTPayload | null => {
  return c.get('user') || null;
};

// 检查是否已登录
export const isAuthenticated = (c: Context): boolean => {
  return !!getCurrentUser(c);
};
