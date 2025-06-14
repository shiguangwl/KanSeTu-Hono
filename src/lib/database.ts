import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../../data/kansetsu.db');

// 创建数据库连接
export const db = new Database(DB_PATH);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 创建表的SQL语句
export const createTables = () => {
  // 创建分类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建套图表
  db.exec(`
    CREATE TABLE IF NOT EXISTS photosets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category_id INTEGER NOT NULL,
      tags TEXT,
      image_urls TEXT NOT NULL,
      view_count INTEGER NOT NULL DEFAULT 0,
      published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      slug TEXT NOT NULL UNIQUE,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    )
  `);

  // 创建管理员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_photosets_category_id ON photosets(category_id);
    CREATE INDEX IF NOT EXISTS idx_photosets_status ON photosets(status);
    CREATE INDEX IF NOT EXISTS idx_photosets_published_at ON photosets(published_at);
    CREATE INDEX IF NOT EXISTS idx_photosets_view_count ON photosets(view_count);
    CREATE INDEX IF NOT EXISTS idx_photosets_is_featured ON photosets(is_featured);
    CREATE INDEX IF NOT EXISTS idx_photosets_slug ON photosets(slug);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
  `);

  console.log('数据库表创建完成');
};

// 插入默认数据
export const insertDefaultData = () => {
  // 检查是否已有数据
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };

  // 插入默认分类
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)');
    const defaultCategories = [
      { name: '美女写真', slug: 'beauty' },
      { name: '风景摄影', slug: 'landscape' },
      { name: '街拍时尚', slug: 'street-fashion' },
      { name: '艺术摄影', slug: 'art-photography' },
      { name: '其他', slug: 'others' }
    ];

    for (const category of defaultCategories) {
      insertCategory.run(category.name, category.slug);
    }
    console.log('默认分类插入完成');
  }

  // 插入默认管理员账户 (用户名: admin, 密码: admin123)
  if (adminCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const insertAdmin = db.prepare('INSERT INTO admin_users (username, password) VALUES (?, ?)');
    insertAdmin.run('admin', hashedPassword);
    console.log('默认管理员账户创建完成 (用户名: admin, 密码: admin123)');
  }
};

// 关闭数据库连接
export const closeDatabase = () => {
  db.close();
};

// 导出预编译的语句 - 延迟初始化
export let statements: any = {};

export const initStatements = () => {
  statements = {
    // 套图相关
    getPhotoSets: db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM photosets p
      JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
    `),

    getPhotoSetBySlug: db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM photosets p
      JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ?
    `),

    getPhotoSetsByCategory: db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM photosets p
      JOIN categories c ON p.category_id = c.id
      WHERE c.slug = ? AND p.status = 'published'
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
    `),

    searchPhotoSets: db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM photosets p
      JOIN categories c ON p.category_id = c.id
      WHERE (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)
      AND p.status = 'published'
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
    `),

    incrementViewCount: db.prepare('UPDATE photosets SET view_count = view_count + 1 WHERE id = ?'),

    // 分类相关
    getCategories: db.prepare('SELECT * FROM categories ORDER BY name'),

    getCategoriesWithCount: db.prepare(`
      SELECT c.*, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN photosets p ON c.id = p.category_id AND p.status = 'published'
      GROUP BY c.id
      ORDER BY c.name
    `),

    getCategoryBySlug: db.prepare('SELECT * FROM categories WHERE slug = ?'),

    // 管理员相关
    getAdminByUsername: db.prepare('SELECT * FROM admin_users WHERE username = ?'),

    // 统计相关
    getTotalPhotoSets: db.prepare('SELECT COUNT(*) as count FROM photosets WHERE status = ?'),
    getTotalCategories: db.prepare('SELECT COUNT(*) as count FROM categories'),
    getTotalViews: db.prepare('SELECT SUM(view_count) as total FROM photosets WHERE status = ?'),

    getTopPhotoSets: db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM photosets p
      JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.view_count DESC
      LIMIT ?
    `),

    getTopCategories: db.prepare(`
      SELECT c.*, SUM(p.view_count) as total_views, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN photosets p ON c.id = p.category_id AND p.status = 'published'
      GROUP BY c.id
      ORDER BY total_views DESC
      LIMIT ?
    `)
  };
};
