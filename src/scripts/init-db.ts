#!/usr/bin/env tsx

import { createTables, insertDefaultData, closeDatabase, initStatements } from '../lib/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保data目录存在
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('创建data目录');
}

try {
  console.log('开始初始化数据库...');
  
  // 创建表
  createTables();

  // 初始化预编译语句
  initStatements();

  // 插入默认数据
  insertDefaultData();
  
  console.log('数据库初始化完成！');
  console.log('默认管理员账户: admin / admin123');
  
} catch (error) {
  console.error('数据库初始化失败:', error);
  process.exit(1);
} finally {
  closeDatabase();
}
