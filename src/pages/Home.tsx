import { html } from 'hono/html';
import type { PhotoSetListResponse, CategoryResponse } from '../types/index.js';
import { formatRelativeTime } from '../lib/utils.js';

interface HomeProps {
  photoSets: PhotoSetListResponse[];
  categories: CategoryResponse[];
  hotPhotoSets: PhotoSetListResponse[];
  currentPage: number;
  totalPages: number;
  currentCategory?: string;
  currentSort?: string;
}

export const Home = ({ 
  photoSets, 
  categories, 
  hotPhotoSets, 
  currentPage, 
  totalPages, 
  currentCategory,
  currentSort = 'published_at_desc'
}: HomeProps) => {
  const title = currentCategory ? `${currentCategory} - 看图网站` : '看图网站 - 精美图片分享平台';
  
  return html`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <meta name="description" content="发现精美图片，分享美好瞬间。汇集各类高质量图片内容。">
      <meta name="keywords" content="图片,摄影,美图,分享,瀑布流">
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                primary: '#4A90E2',
                secondary: '#5CB85C'
              }
            }
          }
        }
      </script>
      <style>
        .masonry {
          column-count: 1;
          column-gap: 1rem;
        }
        @media (min-width: 640px) { .masonry { column-count: 2; } }
        @media (min-width: 768px) { .masonry { column-count: 3; } }
        @media (min-width: 1024px) { .masonry { column-count: 4; } }
        .masonry-item {
          break-inside: avoid;
          margin-bottom: 1rem;
        }
        .image-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .image-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
      </style>
    </head>
    <body class="bg-gray-50 text-gray-900">
      <!-- 导航栏 -->
      <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <a href="/" class="text-2xl font-bold text-primary">看图网站</a>
            </div>
            <div class="flex items-center">
              <form action="/search" method="GET" class="relative">
                <input 
                  type="text" 
                  name="q" 
                  placeholder="搜索图片..." 
                  class="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                <button type="submit" class="absolute right-2 top-2 text-gray-400 hover:text-primary">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- 主要内容区域 -->
          <div class="flex-1">
            <!-- 分类筛选 -->
            <div class="mb-6 flex flex-wrap gap-2">
              <a 
                href="/" 
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !currentCategory 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }"
              >
                全部
              </a>
              ${categories.map(category => `
                <a 
                  href="/category/${category.slug}"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentCategory === category.slug 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border'
                  }"
                >
                  ${category.name} (${category.count})
                </a>
              `).join('')}
            </div>
            
            <!-- 套图网格 -->
            <div class="masonry" id="photoGrid">
              ${photoSets.map(photoSet => `
                <div class="masonry-item">
                  <div class="bg-white rounded-lg shadow-sm overflow-hidden image-hover">
                    <a href="/photoset/${photoSet.slug}">
                      <div class="relative">
                        <img 
                          src="${photoSet.cover_image}" 
                          alt="${photoSet.title}"
                          class="w-full h-auto"
                          loading="lazy"
                        >
                      </div>
                    </a>
                    
                    <div class="p-4">
                      <h3 class="font-semibold text-lg mb-2">
                        <a href="/photoset/${photoSet.slug}" class="hover:text-primary transition-colors">
                          ${photoSet.title}
                        </a>
                      </h3>
                      
                      <div class="flex items-center justify-between text-sm text-gray-500">
                        <span>${photoSet.view_count} 浏览</span>
                        <span>${photoSet.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- 侧边栏 -->
          <div class="w-full lg:w-80">
            <!-- 热门推荐 -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 class="text-lg font-semibold mb-4">热门推荐</h2>
              <div class="space-y-4">
                ${hotPhotoSets.map((photoSet, index) => `
                  <div class="flex gap-3">
                    <span class="inline-flex items-center justify-center w-6 h-6 text-xs font-bold ${
                      index < 3 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
                    } rounded-full">
                      ${index + 1}
                    </span>
                    <div class="flex-1">
                      <a href="/photoset/${photoSet.slug}" class="block">
                        <h3 class="text-sm font-medium text-gray-900 hover:text-primary mb-1">
                          ${photoSet.title}
                        </h3>
                        <div class="text-xs text-gray-500">
                          ${photoSet.view_count} 浏览
                        </div>
                      </a>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- 分类列表 -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h2 class="text-lg font-semibold mb-4">分类浏览</h2>
              <div class="space-y-2">
                ${categories.map(category => `
                  <a 
                    href="/category/${category.slug}" 
                    class="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 transition-colors"
                  >
                    <span class="text-gray-700">${category.name}</span>
                    <span class="text-sm text-gray-500">${category.count}</span>
                  </a>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <!-- 页脚 -->
      <footer class="bg-white border-t mt-12">
        <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div class="text-center text-gray-600">
            <p>&copy; 2024 看图网站. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </body>
    </html>
  `;
};
