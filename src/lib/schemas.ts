import { z } from 'zod';

// 基础验证模式
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const SortSchema = z.enum([
  'published_at_desc',
  'published_at_asc', 
  'view_count_desc',
  'view_count_asc'
]).default('published_at_desc');

// 套图查询模式
export const PhotoSetQuerySchema = PaginationSchema.extend({
  category: z.string().min(1).max(100).optional(),
  tag: z.string().min(1).max(50).optional(),
  search: z.string().min(1).max(200).optional(),
  sort: SortSchema
});

// 管理员登录模式
export const AdminLoginSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名最多50个字符'),
  password: z.string().min(6, '密码至少6个字符').max(100, '密码最多100个字符')
});

// 套图创建/更新模式
export const PhotoSetCreateSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题最多200个字符'),
  description: z.string().min(1, '描述不能为空').max(1000, '描述最多1000个字符'),
  category_id: z.coerce.number().int().min(1, '请选择分类'),
  tags: z.array(z.string().min(1).max(50)).min(1, '至少需要一个标签').max(10, '最多10个标签'),
  image_urls: z.array(z.string().url('请提供有效的图片URL')).min(1, '至少需要一张图片').max(50, '最多50张图片'),
  is_featured: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('published')
});

export const PhotoSetUpdateSchema = PhotoSetCreateSchema.partial();

// 分类模式
export const CategoryCreateSchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(100, '分类名称最多100个字符'),
  slug: z.string().min(1, '分类标识不能为空').max(100, '分类标识最多100个字符')
    .regex(/^[a-z0-9-]+$/, '分类标识只能包含小写字母、数字和连字符')
});

// 参数验证模式
export const SlugParamSchema = z.object({
  slug: z.string().min(1, '标识符不能为空').max(200, '标识符过长')
});

export const IdParamSchema = z.object({
  id: z.coerce.number().int().min(1, '无效的ID')
});

// 标签查询模式
export const TagQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

// 热门内容查询模式
export const HotQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

// 类型导出
export type PaginationQuery = z.infer<typeof PaginationSchema>;
export type PhotoSetQuery = z.infer<typeof PhotoSetQuerySchema>;
export type AdminLogin = z.infer<typeof AdminLoginSchema>;
export type PhotoSetCreate = z.infer<typeof PhotoSetCreateSchema>;
export type PhotoSetUpdate = z.infer<typeof PhotoSetUpdateSchema>;
export type CategoryCreate = z.infer<typeof CategoryCreateSchema>;
export type SlugParam = z.infer<typeof SlugParamSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type TagQuery = z.infer<typeof TagQuerySchema>;
export type HotQuery = z.infer<typeof HotQuerySchema>;
