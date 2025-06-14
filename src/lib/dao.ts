import { db, statements } from './database.js';
import type {
  PhotoSet,
  Category,
  AdminUser,
  PhotoSetResponse,
  PhotoSetListResponse,
  CategoryResponse,
  TagResponse,
  DashboardStats,
  PhotoSetQueryParams,
  AdminPhotoSetQueryParams
} from '../types/index.js';
import { 
  parseImageUrls, 
  stringifyImageUrls, 
  parseTags, 
  stringifyTags, 
  generateSlug,
  calculatePagination 
} from './utils.js';
import bcrypt from 'bcrypt';

// 套图相关操作
export class PhotoSetDAO {
  // 获取套图列表
  static getPhotoSets(params: PhotoSetQueryParams = {}): { data: PhotoSetListResponse[], total: number } {
    const { page = 1, limit = 20, category, tag, search, sort = 'published_at_desc' } = params;
    const { offset } = calculatePagination(page, limit);
    
    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM photosets p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.status = 'published'
    `;
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM photosets p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.status = 'published'
    `;
    
    const queryParams: any[] = [];
    const countParams: any[] = [];
    
    // 分类筛选
    if (category) {
      query += ' AND c.slug = ?';
      countQuery += ' AND c.slug = ?';
      queryParams.push(category);
      countParams.push(category);
    }
    
    // 标签筛选
    if (tag) {
      query += ' AND p.tags LIKE ?';
      countQuery += ' AND p.tags LIKE ?';
      const tagParam = `%${tag}%`;
      queryParams.push(tagParam);
      countParams.push(tagParam);
    }
    
    // 搜索
    if (search) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      countQuery += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }
    
    // 排序
    switch (sort) {
      case 'view_count_desc':
        query += ' ORDER BY p.view_count DESC';
        break;
      case 'view_count_asc':
        query += ' ORDER BY p.view_count ASC';
        break;
      case 'published_at_asc':
        query += ' ORDER BY p.published_at ASC';
        break;
      default:
        query += ' ORDER BY p.published_at DESC';
    }
    
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    const stmt = db.prepare(query);
    const countStmt = db.prepare(countQuery);
    
    const rows = stmt.all(...queryParams) as (PhotoSet & { category_name: string, category_slug: string })[];
    const totalResult = countStmt.get(...countParams) as { count: number };
    
    const data: PhotoSetListResponse[] = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category_name,
      category_slug: row.category_slug,
      tags: parseTags(row.tags),
      cover_image: parseImageUrls(row.image_urls)[0] || '',
      view_count: row.view_count,
      published_at: row.published_at,
      slug: row.slug
    }));
    
    return { data, total: totalResult.count };
  }
  
  // 根据slug获取套图详情
  static getPhotoSetBySlug(slug: string): PhotoSetResponse | null {
    const row = statements.getPhotoSetBySlug.get(slug) as (PhotoSet & { category_name: string, category_slug: string }) | undefined;
    
    if (!row) return null;
    
    // 增加浏览量
    statements.incrementViewCount.run(row.id);
    
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category_name,
      category_slug: row.category_slug,
      tags: parseTags(row.tags),
      image_urls: parseImageUrls(row.image_urls),
      view_count: row.view_count + 1, // 返回增加后的浏览量
      published_at: row.published_at,
      slug: row.slug
    };
  }
  
  // 获取热门套图
  static getTopPhotoSets(limit: number = 10): PhotoSetListResponse[] {
    const rows = statements.getTopPhotoSets.all(limit) as (PhotoSet & { category_name: string, category_slug: string })[];
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category_name,
      category_slug: row.category_slug,
      tags: parseTags(row.tags),
      cover_image: parseImageUrls(row.image_urls)[0] || '',
      view_count: row.view_count,
      published_at: row.published_at,
      slug: row.slug
    }));
  }
  
  // 管理员获取套图列表（包含所有状态）
  static getAdminPhotoSets(params: AdminPhotoSetQueryParams = {}): { data: any[], total: number } {
    const { page = 1, limit = 20, category, tag, search, sort = 'published_at_desc', status } = params;
    const { offset } = calculatePagination(page, limit);
    
    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM photosets p 
      JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM photosets p 
      JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    const countParams: any[] = [];
    
    // 状态筛选
    if (status) {
      query += ' AND p.status = ?';
      countQuery += ' AND p.status = ?';
      queryParams.push(status);
      countParams.push(status);
    }
    
    // 其他筛选条件...（类似上面的逻辑）
    
    // 排序
    switch (sort) {
      case 'view_count_desc':
        query += ' ORDER BY p.view_count DESC';
        break;
      case 'view_count_asc':
        query += ' ORDER BY p.view_count ASC';
        break;
      case 'published_at_asc':
        query += ' ORDER BY p.published_at ASC';
        break;
      default:
        query += ' ORDER BY p.published_at DESC';
    }
    
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    const stmt = db.prepare(query);
    const countStmt = db.prepare(countQuery);
    
    const rows = stmt.all(...queryParams) as (PhotoSet & { category_name: string, category_slug: string })[];
    const totalResult = countStmt.get(...countParams) as { count: number };
    
    const data = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category_name,
      category_slug: row.category_slug,
      tags: parseTags(row.tags),
      image_count: parseImageUrls(row.image_urls).length,
      view_count: row.view_count,
      published_at: row.published_at,
      updated_at: row.updated_at,
      status: row.status,
      is_featured: row.is_featured,
      slug: row.slug
    }));
    
    return { data, total: totalResult.count };
  }

  // 创建套图
  static createPhotoSet(data: {
    title: string;
    description?: string;
    category_name: string;
    tags?: string[];
    image_urls: string[];
    is_featured?: boolean;
    status?: 'draft' | 'published' | 'archived';
  }): number {
    // 获取或创建分类
    const category = CategoryDAO.getOrCreateCategory(data.category_name);

    // 生成唯一slug
    let slug = generateSlug(data.title);
    let counter = 1;

    // 检查slug是否已存在，如果存在则添加数字后缀
    const checkSlugStmt = db.prepare('SELECT COUNT(*) as count FROM photosets WHERE slug = ?');
    while ((checkSlugStmt.get(slug) as { count: number }).count > 0) {
      slug = `${generateSlug(data.title)}-${counter}`;
      counter++;
    }

    const stmt = db.prepare(`
      INSERT INTO photosets (title, description, category_id, tags, image_urls, is_featured, status, slug)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.title,
      data.description || null,
      category.id,
      data.tags ? stringifyTags(data.tags) : null,
      stringifyImageUrls(data.image_urls),
      data.is_featured ? 1 : 0,
      data.status || 'published',
      slug
    );

    return result.lastInsertRowid as number;
  }

  // 更新套图
  static updatePhotoSet(id: number, data: {
    title?: string;
    description?: string;
    category_name?: string;
    tags?: string[];
    image_urls?: string[];
    is_featured?: boolean;
    status?: 'draft' | 'published' | 'archived';
  }): boolean {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);

      // 如果标题改变，更新slug
      updates.push('slug = ?');
      params.push(generateSlug(data.title));
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (data.category_name !== undefined) {
      const category = CategoryDAO.getOrCreateCategory(data.category_name);
      updates.push('category_id = ?');
      params.push(category.id);
    }

    if (data.tags !== undefined) {
      updates.push('tags = ?');
      params.push(stringifyTags(data.tags));
    }

    if (data.image_urls !== undefined) {
      updates.push('image_urls = ?');
      params.push(stringifyImageUrls(data.image_urls));
    }

    if (data.is_featured !== undefined) {
      updates.push('is_featured = ?');
      params.push(data.is_featured ? 1 : 0);
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`UPDATE photosets SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);

    return result.changes > 0;
  }

  // 删除套图
  static deletePhotoSet(id: number): boolean {
    const stmt = db.prepare('DELETE FROM photosets WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

// 分类相关操作
export class CategoryDAO {
  // 获取所有分类
  static getCategories(): CategoryResponse[] {
    const rows = statements.getCategories.all() as Category[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      count: 0 // 这里先设为0，后面会用getCategoriesWithCount
    }));
  }

  // 获取分类及其套图数量
  static getCategoriesWithCount(): CategoryResponse[] {
    const rows = statements.getCategoriesWithCount.all() as (Category & { count: number })[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      count: row.count
    }));
  }

  // 根据slug获取分类
  static getCategoryBySlug(slug: string): Category | null {
    return statements.getCategoryBySlug.get(slug) as Category | undefined || null;
  }

  // 获取或创建分类
  static getOrCreateCategory(name: string): Category {
    const slug = generateSlug(name);

    // 先尝试根据名称查找
    let category = db.prepare('SELECT * FROM categories WHERE name = ?').get(name) as Category | undefined;

    if (!category) {
      // 如果不存在，创建新分类
      const stmt = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)');
      const result = stmt.run(name, slug);

      category = {
        id: result.lastInsertRowid as number,
        name,
        slug,
        created_at: new Date().toISOString()
      };
    }

    return category;
  }

  // 创建分类
  static createCategory(name: string): number {
    const slug = generateSlug(name);
    const stmt = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)');
    const result = stmt.run(name, slug);
    return result.lastInsertRowid as number;
  }

  // 更新分类
  static updateCategory(id: number, name: string): boolean {
    const slug = generateSlug(name);
    const stmt = db.prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?');
    const result = stmt.run(name, slug, id);
    return result.changes > 0;
  }

  // 删除分类
  static deleteCategory(id: number): boolean {
    // 检查是否有套图使用此分类
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM photosets WHERE category_id = ?');
    const countResult = countStmt.get(id) as { count: number };

    if (countResult.count > 0) {
      throw new Error('无法删除分类，该分类下还有套图');
    }

    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

// 管理员相关操作
export class AdminDAO {
  // 根据用户名获取管理员
  static getAdminByUsername(username: string): AdminUser | null {
    return statements.getAdminByUsername.get(username) as AdminUser | undefined || null;
  }

  // 验证管理员密码
  static async verifyAdmin(username: string, password: string): Promise<AdminUser | null> {
    const admin = this.getAdminByUsername(username);
    if (!admin) return null;

    const isValid = await bcrypt.compare(password, admin.password);
    return isValid ? admin : null;
  }

  // 创建管理员
  static async createAdmin(username: string, password: string): Promise<number> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO admin_users (username, password) VALUES (?, ?)');
    const result = stmt.run(username, hashedPassword);
    return result.lastInsertRowid as number;
  }
}

// 统计相关操作
export class StatsDAO {
  // 获取仪表盘统计数据
  static getDashboardStats(): DashboardStats {
    const totalPhotoSets = statements.getTotalPhotoSets.get('published') as { count: number };
    const totalCategories = statements.getTotalCategories.get() as { count: number };
    const totalViews = statements.getTotalViews.get('published') as { total: number };

    const topPhotoSets = PhotoSetDAO.getTopPhotoSets(5);
    const topCategories = statements.getTopCategories.all(5) as (Category & { total_views: number, count: number })[];

    return {
      total_photosets: totalPhotoSets.count,
      total_categories: totalCategories.count,
      total_views: totalViews.total || 0,
      top_photosets: topPhotoSets,
      top_categories: topCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: cat.count
      }))
    };
  }
}

// 标签相关操作
export class TagDAO {
  // 获取所有标签及其使用次数
  static getAllTags(): TagResponse[] {
    const stmt = db.prepare(`
      SELECT tags FROM photosets
      WHERE tags IS NOT NULL AND tags != '' AND status = 'published'
    `);
    const rows = stmt.all() as { tags: string }[];

    const tagCounts: { [key: string]: number } = {};

    rows.forEach(row => {
      const tags = parseTags(row.tags);
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  // 获取热门标签
  static getPopularTags(limit: number = 20): TagResponse[] {
    const allTags = this.getAllTags();
    return allTags.slice(0, limit);
  }
}
