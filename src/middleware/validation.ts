import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { errors } from './error-handler.js';

// 验证规则类型
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// 验证单个字段
const validateField = (value: any, rule: ValidationRule, fieldName: string): string[] => {
  const errors: string[] = [];
  
  // 必填验证
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} 是必填字段`);
    return errors; // 如果必填字段为空，直接返回，不进行其他验证
  }
  
  // 如果字段不是必填且为空，跳过其他验证
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return errors;
  }
  
  // 类型验证
  if (rule.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rule.type) {
      errors.push(`${fieldName} 必须是 ${rule.type} 类型`);
      return errors; // 类型错误时不进行其他验证
    }
  }
  
  // 字符串长度验证
  if (rule.type === 'string' && typeof value === 'string') {
    if (rule.min !== undefined && value.length < rule.min) {
      errors.push(`${fieldName} 长度不能少于 ${rule.min} 个字符`);
    }
    if (rule.max !== undefined && value.length > rule.max) {
      errors.push(`${fieldName} 长度不能超过 ${rule.max} 个字符`);
    }
  }
  
  // 数字范围验证
  if (rule.type === 'number' && typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push(`${fieldName} 不能小于 ${rule.min}`);
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push(`${fieldName} 不能大于 ${rule.max}`);
    }
  }
  
  // 数组长度验证
  if (rule.type === 'array' && Array.isArray(value)) {
    if (rule.min !== undefined && value.length < rule.min) {
      errors.push(`${fieldName} 至少需要 ${rule.min} 个元素`);
    }
    if (rule.max !== undefined && value.length > rule.max) {
      errors.push(`${fieldName} 最多只能有 ${rule.max} 个元素`);
    }
  }
  
  // 正则表达式验证
  if (rule.pattern && typeof value === 'string') {
    if (!rule.pattern.test(value)) {
      errors.push(`${fieldName} 格式不正确`);
    }
  }
  
  // 枚举值验证
  if (rule.enum && !rule.enum.includes(value)) {
    errors.push(`${fieldName} 必须是以下值之一: ${rule.enum.join(', ')}`);
  }
  
  // 自定义验证
  if (rule.custom) {
    const result = rule.custom(value);
    if (result !== true) {
      errors.push(typeof result === 'string' ? result : `${fieldName} 验证失败`);
    }
  }
  
  return errors;
};

// 验证数据
export const validateData = (data: any, schema: ValidationSchema): string[] => {
  const errors: string[] = [];
  
  // 验证每个字段
  for (const [fieldName, rule] of Object.entries(schema)) {
    const fieldErrors = validateField(data[fieldName], rule, fieldName);
    errors.push(...fieldErrors);
  }
  
  return errors;
};

// 验证中间件工厂
export const validate = (schema: ValidationSchema, source: 'json' | 'query' | 'param' = 'json') => {
  return async (c: Context, next: Next) => {
    let data: any;
    
    try {
      switch (source) {
        case 'json':
          data = await c.req.json();
          break;
        case 'query':
          data = Object.fromEntries(new URL(c.req.url).searchParams.entries());
          break;
        case 'param':
          data = c.req.param();
          break;
        default:
          throw new Error('不支持的数据源');
      }
    } catch (error) {
      throw new HTTPException(400, { message: '请求数据格式错误' });
    }
    
    const validationErrors = validateData(data, schema);
    
    if (validationErrors.length > 0) {
      throw new HTTPException(400, { 
        message: '请求参数验证失败',
        cause: validationErrors
      });
    }
    
    // 将验证后的数据存储到上下文中
    c.set('validatedData', data);
    await next();
  };
};

// 常用验证规则
export const rules = {
  // 基础类型
  string: (required = false, min?: number, max?: number): ValidationRule => ({
    required,
    type: 'string',
    min,
    max
  }),
  
  number: (required = false, min?: number, max?: number): ValidationRule => ({
    required,
    type: 'number',
    min,
    max
  }),
  
  boolean: (required = false): ValidationRule => ({
    required,
    type: 'boolean'
  }),
  
  array: (required = false, min?: number, max?: number): ValidationRule => ({
    required,
    type: 'array',
    min,
    max
  }),
  
  // 特殊格式
  email: (required = false): ValidationRule => ({
    required,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    max: 254
  }),
  
  url: (required = false): ValidationRule => ({
    required,
    type: 'string',
    custom: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return '必须是有效的URL';
      }
    }
  }),
  
  slug: (required = false): ValidationRule => ({
    required,
    type: 'string',
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    min: 1,
    max: 200
  }),
  
  // 分页参数
  page: (): ValidationRule => ({
    required: false,
    type: 'number',
    min: 1
  }),
  
  limit: (): ValidationRule => ({
    required: false,
    type: 'number',
    min: 1,
    max: 100
  }),
  
  // 排序参数
  sort: (allowedValues: string[]): ValidationRule => ({
    required: false,
    type: 'string',
    enum: allowedValues
  }),
  
  // ID参数
  id: (required = true): ValidationRule => ({
    required,
    type: 'number',
    min: 1
  })
};

// 预定义的验证模式
export const schemas = {
  // 分页查询
  pagination: {
    page: rules.page(),
    limit: rules.limit()
  },
  
  // 套图查询
  photosetQuery: {
    page: rules.page(),
    limit: rules.limit(),
    category: rules.string(false, 1, 100),
    tag: rules.string(false, 1, 50),
    search: rules.string(false, 1, 200),
    sort: rules.sort(['published_at_desc', 'published_at_asc', 'view_count_desc', 'view_count_asc'])
  },
  
  // 登录
  login: {
    username: rules.string(true, 3, 50),
    password: rules.string(true, 6, 100)
  }
};
