// 数据库模型类型定义

export interface PhotoSet {
  id: number;
  title: string;
  description?: string;
  category_id: number;
  tags?: string;
  image_urls: string; // JSON字符串存储数组
  view_count: number;
  published_at: string;
  updated_at: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  slug: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

// API响应类型
export interface PhotoSetResponse {
  id: number;
  title: string;
  description?: string;
  category: string;
  category_slug: string;
  tags: string[];
  image_urls: string[];
  view_count: number;
  published_at: string;
  slug: string;
}

export interface PhotoSetListResponse {
  id: number;
  title: string;
  description?: string;
  category: string;
  category_slug: string;
  tags: string[];
  cover_image: string; // 第一张图片作为封面
  view_count: number;
  published_at: string;
  slug: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface TagResponse {
  name: string;
  count: number;
}

export interface DashboardStats {
  total_photosets: number;
  total_categories: number;
  total_views: number;
  top_photosets: PhotoSetListResponse[];
  top_categories: CategoryResponse[];
}

// API请求类型
export interface CreatePhotoSetRequest {
  title: string;
  description?: string;
  category_name: string;
  tags?: string[];
  image_urls: string[];
  is_featured?: boolean;
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdatePhotoSetRequest extends CreatePhotoSetRequest {
  id: number;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  id: number;
  name: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

// 查询参数类型
export interface PhotoSetQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
  sort?: 'published_at_desc' | 'published_at_asc' | 'view_count_desc' | 'view_count_asc';
}

export interface AdminPhotoSetQueryParams extends PhotoSetQueryParams {
  status?: 'draft' | 'published' | 'archived';
}
