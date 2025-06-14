#!/usr/bin/env tsx

import { PhotoSetDAO } from '../lib/dao.js';
import { initStatements } from '../lib/database.js';

// 初始化数据库语句
initStatements();

// 示例套图数据
const samplePhotoSets = [
  {
    title: '美丽的日落风景',
    description: '在海边拍摄的绚烂日落，色彩斑斓，令人陶醉。',
    category_name: '风景摄影',
    tags: ['日落', '海边', '风景', '自然'],
    image_urls: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'
    ],
    is_featured: true,
    status: 'published' as const
  },
  {
    title: '城市街头时尚',
    description: '现代都市中的时尚街拍，展现年轻人的活力与个性。',
    category_name: '街拍时尚',
    tags: ['街拍', '时尚', '都市', '青春'],
    image_urls: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800'
    ],
    is_featured: false,
    status: 'published' as const
  },
  {
    title: '艺术人像摄影',
    description: '黑白艺术人像，展现光影的魅力和人物的内在美。',
    category_name: '艺术摄影',
    tags: ['人像', '黑白', '艺术', '光影'],
    image_urls: [
      'https://images.unsplash.com/photo-1494790108755-2616c9c9b8e7?w=800',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800'
    ],
    is_featured: false,
    status: 'published' as const
  },
  {
    title: '山间清晨',
    description: '清晨的山峦，云雾缭绕，宁静而神秘。',
    category_name: '风景摄影',
    tags: ['山峦', '清晨', '云雾', '自然'],
    image_urls: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1464822759844-d150baec0494?w=800',
      'https://images.unsplash.com/photo-1418065460487-3956c3043904?w=800'
    ],
    is_featured: true,
    status: 'published' as const
  },
  {
    title: '时尚女性写真',
    description: '优雅的女性写真，展现现代女性的魅力与自信。',
    category_name: '美女写真',
    tags: ['女性', '写真', '优雅', '时尚'],
    image_urls: [
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800'
    ],
    is_featured: false,
    status: 'published' as const
  },
  {
    title: '创意艺术摄影',
    description: '充满创意的艺术摄影作品，展现摄影师的独特视角。',
    category_name: '艺术摄影',
    tags: ['创意', '艺术', '抽象', '视觉'],
    image_urls: [
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ],
    is_featured: false,
    status: 'published' as const
  }
];

async function addSampleData() {
  try {
    console.log('开始添加示例数据...');
    
    for (const photoSet of samplePhotoSets) {
      const id = PhotoSetDAO.createPhotoSet(photoSet);
      console.log(`创建套图: ${photoSet.title} (ID: ${id})`);
    }
    
    console.log('示例数据添加完成！');
    console.log('现在可以访问 http://localhost:3000 查看效果');
    
  } catch (error) {
    console.error('添加示例数据失败:', error);
    process.exit(1);
  }
}

addSampleData();
