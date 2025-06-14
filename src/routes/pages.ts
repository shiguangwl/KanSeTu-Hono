import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { PhotoSetDAO, CategoryDAO, TagDAO, StatsDAO } from '../lib/dao.js';
import { TestPage } from '../pages/TestPage.js';
import { AdminLogin } from '../pages/AdminLogin.js';
import { AdminDashboard } from '../pages/AdminDashboard.js';
import { HomePage } from '../pages/HomePage.js';
import { PhotoSetQuerySchema } from '../lib/schemas.js';
import type { PhotoSetQueryParams } from '../types/index.js';

const pages = new Hono();

// 首页
pages.get('/', zValidator('query', PhotoSetQuerySchema), async (c) => {
  try {
    const query = c.req.valid('query');

    const params: PhotoSetQueryParams = {
      page: query.page,
      limit: query.limit,
      category: query.category,
      tag: query.tag,
      search: query.search,
      sort: query.sort as any
    };

    const [photoSetsResult, categories] = await Promise.all([
      PhotoSetDAO.getPhotoSets(params),
      CategoryDAO.getCategoriesWithCount()
    ]);

    // 构建查询参数用于分页和筛选
    const buildQueryString = (page?: number) => {
      const params = new URLSearchParams();
      if (page && page > 1) params.set('page', page.toString());
      if (query.category) params.set('category', query.category);
      if (query.tag) params.set('tag', query.tag);
      if (query.search) params.set('search', query.search);
      if (query.sort !== 'published_at_desc') params.set('sort', query.sort);
      return params.toString() ? `?${params.toString()}` : '';
    };

    const currentCategory = query.category;
    const searchQuery = query.search;
    const currentTag = query.tag;

    // 计算分页信息
    const totalPages = Math.ceil(photoSetsResult.total / query.limit);
    const hasNext = query.page < totalPages;
    const hasPrev = query.page > 1;

    return c.html(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${searchQuery ? `搜索: ${searchQuery}` : currentCategory ? `${categories.find(cat => cat.slug === currentCategory)?.name || '分类'}` : '看图网站'} - 精美图片分享平台</title>
        <meta name="description" content="${searchQuery ? `搜索 "${searchQuery}" 的相关图片` : currentCategory ? `浏览 ${categories.find(cat => cat.slug === currentCategory)?.name || '分类'} 下的精美图片` : '精美图片分享平台，发现美好瞬间'}">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#4A90E2'
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
          @media (min-width: 1280px) { .masonry { column-count: 5; } }
          .masonry-item {
            break-inside: avoid;
            margin-bottom: 1rem;
          }
          .image-viewer {
            backdrop-filter: blur(10px);
          }
        </style>
      </head>
      <body class="bg-gray-50">
        <!-- 导航栏 -->
        <nav class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center space-x-4">
                <a href="/" class="flex items-center space-x-2">
                  <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span class="text-white font-bold text-lg">看</span>
                  </div>
                  <span class="text-xl font-bold text-gray-900">看图网站</span>
                </a>
              </div>

              <!-- 搜索框 -->
              <div class="flex-1 max-w-lg mx-8">
                <form action="/" method="GET" class="relative">
                  ${currentCategory ? `<input type="hidden" name="category" value="${currentCategory}">` : ''}
                  ${currentTag ? `<input type="hidden" name="tag" value="${currentTag}">` : ''}
                  <input
                    type="text"
                    name="search"
                    placeholder="搜索图片..."
                    value="${searchQuery || ''}"
                    class="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                  <div class="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </form>
              </div>

              <!-- 导航链接 -->
              <nav class="hidden md:flex space-x-6">
                <a href="/" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">首页</a>
                <a href="/categories" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">分类</a>
                <a href="/tags" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">标签</a>
              </nav>
            </div>

            <!-- 分类导航 -->
            <div class="border-t border-gray-200 py-3">
              <div class="flex items-center space-x-6 overflow-x-auto">
                <a href="/" class="whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium transition-colors ${!currentCategory ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary hover:bg-gray-100'}">
                  全部
                </a>
                ${categories.map(category => `
                  <a href="/?category=${category.slug}" class="whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium transition-colors ${currentCategory === category.slug ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary hover:bg-gray-100'}">
                    ${category.name}
                    <span class="ml-1 text-xs ${currentCategory === category.slug ? 'text-blue-200' : 'text-gray-500'}">(${category.count})</span>
                  </a>
                `).join('')}
              </div>
            </div>
          </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex flex-col lg:flex-row gap-8">
            <!-- 主要内容区域 -->
            <div class="flex-1">
              <!-- 页面标题和统计 -->
              <div class="mb-6">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">
                  ${searchQuery ? `搜索: ${searchQuery}` : currentCategory ? `${categories.find(cat => cat.slug === currentCategory)?.name || '分类'}` : currentTag ? `标签: ${currentTag}` : '精美图片'}
                </h1>
                <div class="flex items-center justify-between">
                  <div class="text-sm text-gray-500">
                    共找到 <span class="font-medium text-gray-900">${photoSetsResult.total}</span> 个套图
                    ${totalPages > 1 ? `，第 <span class="font-medium text-gray-900">${query.page}</span> 页 / 共 <span class="font-medium text-gray-900">${totalPages}</span> 页` : ''}
                  </div>

                  <!-- 排序选择 -->
                  <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500">排序:</span>
                    <select onchange="handleSortChange(this.value)" class="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="published_at_desc" ${query.sort === 'published_at_desc' ? 'selected' : ''}>最新发布</option>
                      <option value="published_at_asc" ${query.sort === 'published_at_asc' ? 'selected' : ''}>最早发布</option>
                      <option value="view_count_desc" ${query.sort === 'view_count_desc' ? 'selected' : ''}>最多浏览</option>
                      <option value="view_count_asc" ${query.sort === 'view_count_asc' ? 'selected' : ''}>最少浏览</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 当前筛选条件 -->
              ${(currentCategory || searchQuery || currentTag) ? `
                <div class="mb-6 flex flex-wrap items-center gap-2">
                  <span class="text-sm text-gray-500">当前筛选:</span>

                  ${currentCategory ? `
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      分类: ${categories.find(c => c.slug === currentCategory)?.name || currentCategory}
                      <a href="/" class="ml-2 text-blue-600 hover:text-blue-800">×</a>
                    </span>
                  ` : ''}

                  ${searchQuery ? `
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      搜索: ${searchQuery}
                      <a href="/" class="ml-2 text-green-600 hover:text-green-800">×</a>
                    </span>
                  ` : ''}

                  ${currentTag ? `
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                      标签: ${currentTag}
                      <a href="/" class="ml-2 text-purple-600 hover:text-purple-800">×</a>
                    </span>
                  ` : ''}

                  <a href="/" class="text-sm text-gray-500 hover:text-gray-700 underline">清除所有筛选</a>
                </div>
              ` : ''}

              <!-- 套图瀑布流 -->
              ${photoSetsResult.data.length > 0 ? `
                <div class="masonry">
                  ${photoSetsResult.data.map(photoSet => `
                    <div class="masonry-item bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">
                      <!-- 图片容器 -->
                      <div class="relative overflow-hidden">
                        <a href="/photoset/${photoSet.slug}" class="block">
                          <img
                            src="${photoSet.cover_image}"
                            alt="${photoSet.title}"
                            class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </a>

                        <!-- 悬浮信息 -->
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onclick="openImageViewer('${photoSet.cover_image}', '${photoSet.title}')"
                            class="bg-white bg-opacity-90 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-opacity-100 transition-all duration-200"
                          >
                            查看大图
                          </button>
                        </div>

                        <!-- 分类标签 -->
                        <div class="absolute top-3 left-3">
                          <a
                            href="/?category=${photoSet.category_slug}"
                            class="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium hover:bg-opacity-90 transition-all duration-200"
                          >
                            ${photoSet.category}
                          </a>
                        </div>

                        <!-- 浏览量 -->
                        <div class="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                          </svg>
                          <span>${photoSet.view_count >= 1000 ? (photoSet.view_count / 1000).toFixed(1) + 'k' : photoSet.view_count}</span>
                        </div>
                      </div>

                      <!-- 内容区域 -->
                      <div class="p-4">
                        <!-- 标题 -->
                        <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                          <a href="/photoset/${photoSet.slug}" class="hover:underline">
                            ${photoSet.title}
                          </a>
                        </h3>

                        <!-- 描述 -->
                        <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                          ${photoSet.description || ''}
                        </p>

                        <!-- 标签 -->
                        ${photoSet.tags && photoSet.tags.length > 0 ? `
                          <div class="flex flex-wrap gap-1 mb-3">
                            ${photoSet.tags.slice(0, 3).map(tag => `
                              <a
                                href="/?tag=${encodeURIComponent(tag)}"
                                class="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs transition-colors duration-200"
                              >
                                #${tag}
                              </a>
                            `).join('')}
                            ${photoSet.tags.length > 3 ? `<span class="text-gray-500 text-xs px-2 py-1">+${photoSet.tags.length - 3}</span>` : ''}
                          </div>
                        ` : ''}

                        <!-- 底部信息 -->
                        <div class="flex items-center justify-between text-xs text-gray-500">
                          <time dateTime="${photoSet.published_at}">
                            ${new Date(photoSet.published_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </time>
                          <a
                            href="/photoset/${photoSet.slug}"
                            class="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                          >
                            查看详情 →
                          </a>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="text-center py-12">
                  <div class="text-gray-400 mb-4">
                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">暂无图片</h3>
                  <p class="text-gray-500 mb-4">
                    ${searchQuery || currentCategory || currentTag ? '没有找到符合条件的图片，试试其他搜索条件吧' : '还没有上传任何图片'}
                  </p>
                  <a href="/" class="text-primary hover:text-primary/80 font-medium">浏览所有图片 →</a>
                </div>
              `}

              <!-- 分页 -->
              ${totalPages > 1 ? `
                <nav class="flex items-center justify-center space-x-2 mt-8" aria-label="分页导航">
                  <!-- 上一页 -->
                  ${hasPrev ? `
                    <a
                      href="${buildQueryString(query.page - 1)}"
                      class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors duration-200"
                    >
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      上一页
                    </a>
                  ` : `
                    <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      上一页
                    </span>
                  `}

                  <!-- 页码 -->
                  <div class="flex items-center space-x-1">
                    ${Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (query.page <= 4) {
                        pageNum = i + 1;
                      } else if (query.page >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = query.page - 3 + i;
                      }

                      const isCurrentPage = pageNum === query.page;
                      return `
                        <a
                          href="${buildQueryString(pageNum)}"
                          class="px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            isCurrentPage
                              ? 'bg-primary text-white border border-primary'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-primary'
                          }"
                        >
                          ${pageNum}
                        </a>
                      `;
                    }).join('')}
                  </div>

                  <!-- 下一页 -->
                  ${hasNext ? `
                    <a
                      href="${buildQueryString(query.page + 1)}"
                      class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors duration-200"
                    >
                      下一页
                      <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  ` : `
                    <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed">
                      下一页
                      <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  `}
                </nav>
              ` : ''}
            </div>

            <!-- 侧边栏 -->
            <div class="w-full lg:w-80 space-y-6">
              <!-- 分类浏览 -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold mb-4 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7l2 2-2 2m0 8l2 2-2 2" />
                  </svg>
                  分类浏览
                </h2>
                <div class="space-y-2">
                  <a
                    href="/"
                    class="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 transition-colors ${!currentCategory ? 'bg-primary/10 text-primary' : 'text-gray-700'}"
                  >
                    <span>全部</span>
                    <span class="text-sm text-gray-500">${photoSetsResult.total}</span>
                  </a>
                  ${categories.map(category => `
                    <a
                      href="/?category=${category.slug}"
                      class="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 transition-colors ${currentCategory === category.slug ? 'bg-primary/10 text-primary' : 'text-gray-700'}"
                    >
                      <span>${category.name}</span>
                      <span class="text-sm text-gray-500">${category.count}</span>
                    </a>
                  `).join('')}
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200">
                  <a href="/categories" class="text-sm text-primary hover:text-primary/80 font-medium">
                    查看所有分类 →
                  </a>
                </div>
              </div>

              <!-- 热门标签 -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold mb-4 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  热门标签
                </h2>
                <div class="flex flex-wrap gap-2">
                  ${TagDAO.getPopularTags(20).map(tag => `
                    <a
                      href="/?tag=${encodeURIComponent(tag.name)}"
                      class="inline-block px-3 py-1 bg-gray-100 hover:bg-primary hover:text-white text-gray-700 text-sm rounded-full transition-colors duration-200 ${currentTag === tag.name ? 'bg-primary text-white' : ''}"
                    >
                      #${tag.name}
                    </a>
                  `).join('')}
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200">
                  <a href="/tags" class="text-sm text-primary hover:text-primary/80 font-medium">
                    查看所有标签 →
                  </a>
                </div>
              </div>

              <!-- 网站统计 -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold mb-4 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  网站统计
                </h2>
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600">套图总数</span>
                    <span class="font-semibold text-gray-900">${photoSetsResult.total}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600">分类数量</span>
                    <span class="font-semibold text-gray-900">${categories.length}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600">标签数量</span>
                    <span class="font-semibold text-gray-900">${TagDAO.getPopularTags(1000).length}</span>
                  </div>
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
              <div class="mt-2 space-x-4">
                <a href="/about" class="hover:text-primary transition-colors">关于我们</a>
                <a href="/contact" class="hover:text-primary transition-colors">联系我们</a>
                <a href="/privacy" class="hover:text-primary transition-colors">隐私政策</a>
              </div>
            </div>
          </div>
        </footer>

        <!-- JavaScript -->
        <script>
          // 图片查看器
          function openImageViewer(src, title) {
            const viewer = document.createElement('div');
            viewer.className = 'fixed inset-0 z-50 flex items-center justify-center image-viewer bg-black bg-opacity-90';
            viewer.innerHTML = \`
              <div class="relative max-w-full max-h-full p-4">
                <img src="\${src}" alt="\${title}" class="max-w-full max-h-full object-contain" />
                <button onclick="this.closest('.image-viewer').remove()"
                        class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 bg-black bg-opacity-50 w-10 h-10 rounded-full flex items-center justify-center">
                  ✕
                </button>
                <div class="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded">
                  \${title}
                </div>
              </div>
            \`;

            viewer.onclick = (e) => {
              if (e.target === viewer) viewer.remove();
            };

            document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                viewer.remove();
              }
            });

            document.body.appendChild(viewer);
          }

          // 排序功能
          function handleSortChange(sort) {
            const url = new URL(window.location);
            if (sort === 'published_at_desc') {
              url.searchParams.delete('sort');
            } else {
              url.searchParams.set('sort', sort);
            }
            window.location.href = url.toString();
          }

          // 图片懒加载
          if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  const img = entry.target;
                  if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.classList.remove('opacity-0');
                    img.classList.add('fade-in');
                    observer.unobserve(img);
                  }
                }
              });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
              imageObserver.observe(img);
            });
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('首页加载失败:', error);
    return c.text('页面加载失败', 500);
  }
});

// 分类页面 - 暂时注释
/*
pages.get('/category/:slug', async (c) => {
  // 暂时注释，等前端页面完成后再启用
});
*/

// 套图详情页
pages.get('/photoset/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const photoSet = PhotoSetDAO.getPhotoSetBySlug(slug);

    if (!photoSet) {
      return c.text('套图不存在', 404);
    }

    // 获取相关数据
    const [categories, relatedPhotoSets, sameCategory] = await Promise.all([
      CategoryDAO.getCategoriesWithCount(),
      PhotoSetDAO.getPhotoSets({
        page: 1,
        limit: 6,
        sort: 'view_count_desc'
      }), // 热门推荐
      PhotoSetDAO.getPhotoSets({
        page: 1,
        limit: 4,
        category: photoSet.category_slug,
        sort: 'published_at_desc'
      }) // 同分类推荐
    ]);

    // 过滤掉当前套图
    const filteredSameCategory = sameCategory.data.filter(item => item.id !== photoSet.id);
    const filteredRelated = relatedPhotoSets.data.filter(item => item.id !== photoSet.id).slice(0, 4);

    return c.html(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${photoSet.title} - 看图网站</title>
        <meta name="description" content="${photoSet.description || photoSet.title}">
        <meta name="keywords" content="${photoSet.tags.join(', ')}, ${photoSet.category}, 图片, 摄影">

        <!-- Open Graph -->
        <meta property="og:title" content="${photoSet.title} - 看图网站">
        <meta property="og:description" content="${photoSet.description || photoSet.title}">
        <meta property="og:image" content="${photoSet.image_urls[0]}">
        <meta property="og:type" content="article">

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${photoSet.title}">
        <meta name="twitter:description" content="${photoSet.description || photoSet.title}">
        <meta name="twitter:image" content="${photoSet.image_urls[0]}">

        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#4A90E2'
                }
              }
            }
          }
        </script>
        <style>
          .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
          }
          .image-viewer {
            backdrop-filter: blur(10px);
          }
          .share-button:hover {
            transform: translateY(-2px);
          }
        </style>
      </head>
      <body class="bg-gray-50">
        <!-- 导航栏 -->
        <nav class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center space-x-4">
                <a href="/" class="flex items-center space-x-2">
                  <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span class="text-white font-bold text-lg">看</span>
                  </div>
                  <span class="text-xl font-bold text-gray-900">看图网站</span>
                </a>
              </div>

              <!-- 搜索框 -->
              <div class="flex-1 max-w-lg mx-8">
                <form action="/" method="GET" class="relative">
                  <input
                    type="text"
                    name="search"
                    placeholder="搜索图片..."
                    class="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                  <div class="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </form>
              </div>

              <!-- 导航链接 -->
              <nav class="hidden md:flex space-x-6">
                <a href="/" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">首页</a>
                <a href="/categories" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">分类</a>
                <a href="/tags" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">标签</a>
              </nav>
            </div>

            <!-- 分类导航 -->
            <div class="border-t border-gray-200 py-3">
              <div class="flex items-center space-x-6 overflow-x-auto">
                <a href="/" class="whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium transition-colors text-gray-600 hover:text-primary hover:bg-gray-100">
                  全部
                </a>
                ${categories.map(category => `
                  <a href="/?category=${category.slug}" class="whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium transition-colors ${photoSet.category_slug === category.slug ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary hover:bg-gray-100'}">
                    ${category.name}
                    <span class="ml-1 text-xs ${photoSet.category_slug === category.slug ? 'text-blue-200' : 'text-gray-500'}">(${category.count})</span>
                  </a>
                `).join('')}
              </div>
            </div>
          </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex flex-col lg:flex-row gap-8">
            <!-- 主要内容区域 -->
            <div class="flex-1">
              <!-- 面包屑 -->
              <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-6">
                <a href="/" class="hover:text-primary transition-colors">首页</a>
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
                <a href="/?category=${photoSet.category_slug}" class="hover:text-primary transition-colors">${photoSet.category}</a>
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-900 font-medium">${photoSet.title}</span>
              </nav>

              <!-- 套图信息卡片 -->
              <div class="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
                <!-- 头部信息 -->
                <div class="p-6 border-b border-gray-200">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h1 class="text-3xl font-bold text-gray-900 mb-3">${photoSet.title}</h1>

                      <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                        <div class="flex items-center space-x-1">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                          </svg>
                          <span>${photoSet.view_count} 浏览</span>
                        </div>
                        <div class="flex items-center space-x-1">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                          </svg>
                          <span>${photoSet.image_urls.length} 张图片</span>
                        </div>
                        <div class="flex items-center space-x-1">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                          </svg>
                          <a href="/?category=${photoSet.category_slug}" class="hover:text-primary transition-colors">
                            ${photoSet.category}
                          </a>
                        </div>
                        <div class="flex items-center space-x-1">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                          </svg>
                          <time dateTime="${photoSet.published_at}">
                            ${new Date(photoSet.published_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </time>
                        </div>
                      </div>

                      ${photoSet.description ? `
                        <p class="text-gray-700 leading-relaxed mb-4">${photoSet.description}</p>
                      ` : ''}

                      <!-- 标签 -->
                      ${photoSet.tags.length > 0 ? `
                        <div class="flex flex-wrap gap-2 mb-4">
                          ${photoSet.tags.map(tag => `
                            <a
                              href="/?tag=${encodeURIComponent(tag)}"
                              class="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-primary hover:text-white text-gray-700 text-sm rounded-full transition-colors duration-200"
                            >
                              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                              </svg>
                              ${tag}
                            </a>
                          `).join('')}
                        </div>
                      ` : ''}
                    </div>

                    <!-- 社交分享按钮 -->
                    <div class="ml-6 flex flex-col space-y-2">
                      <button onclick="shareToWeibo()" class="share-button flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200" title="分享到微博">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9.586 20.414a2 2 0 002.828 0l6.586-6.586a2 2 0 000-2.828L12.414 4.414a2 2 0 00-2.828 0L3 11l6.586 9.414z"/>
                        </svg>
                      </button>
                      <button onclick="shareToWechat()" class="share-button flex items-center justify-center w-10 h-10 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all duration-200" title="分享到微信">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8.5 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 5.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                        </svg>
                      </button>
                      <button onclick="copyLink()" class="share-button flex items-center justify-center w-10 h-10 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all duration-200" title="复制链接">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="px-6 py-4 bg-gray-50 flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <button onclick="downloadAll()" class="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>下载全部</span>
                    </button>
                    <button onclick="toggleFavorite()" class="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>收藏</span>
                    </button>
                  </div>

                  <div class="text-sm text-gray-500">
                    <span>图片加载中...</span>
                  </div>
                </div>
              </div>

              <!-- 图片展示区域 -->
              <div class="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
                <div class="p-6 border-b border-gray-200">
                  <div class="flex items-center justify-between">
                    <h2 class="text-xl font-semibold text-gray-900">图片预览</h2>
                    <div class="flex items-center space-x-4">
                      <div class="flex items-center space-x-2">
                        <button onclick="toggleViewMode('grid')" id="gridBtn" class="p-2 text-gray-600 hover:text-primary transition-colors">
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                        </button>
                        <button onclick="toggleViewMode('list')" id="listBtn" class="p-2 text-gray-600 hover:text-primary transition-colors">
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <span class="text-sm text-gray-500">${photoSet.image_urls.length} 张图片</span>
                    </div>
                  </div>
                </div>

                <!-- 网格视图 -->
                <div id="gridView" class="p-6">
                  <div class="image-grid">
                    ${photoSet.image_urls.map((imageUrl, index) => `
                      <div class="group relative bg-gray-100 rounded-lg overflow-hidden aspect-w-16 aspect-h-9">
                        <img
                          src="${imageUrl}"
                          alt="${photoSet.title} - 图片 ${index + 1}"
                          class="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                          onclick="openImageViewer(${JSON.stringify(photoSet.image_urls)}, ${index})"
                          loading="${index < 6 ? 'eager' : 'lazy'}"
                        />

                        <!-- 悬浮遮罩 -->
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div class="flex space-x-2">
                            <button
                              onclick="openImageViewer(${JSON.stringify(photoSet.image_urls)}, ${index})"
                              class="bg-white bg-opacity-90 text-gray-800 px-3 py-2 rounded-lg font-medium hover:bg-opacity-100 transition-all duration-200 text-sm"
                            >
                              查看大图
                            </button>
                            <button
                              onclick="downloadImage('${imageUrl}', '${photoSet.title}_${index + 1}')"
                              class="bg-primary bg-opacity-90 text-white px-3 py-2 rounded-lg font-medium hover:bg-opacity-100 transition-all duration-200 text-sm"
                            >
                              下载
                            </button>
                          </div>
                        </div>

                        <!-- 图片序号 -->
                        <div class="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
                          ${index + 1}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- 列表视图 -->
                <div id="listView" class="hidden">
                  <div class="divide-y divide-gray-200">
                    ${photoSet.image_urls.map((imageUrl, index) => `
                      <div class="p-4 hover:bg-gray-50 transition-colors duration-200">
                        <div class="flex items-center space-x-4">
                          <div class="flex-shrink-0">
                            <img
                              src="${imageUrl}"
                              alt="${photoSet.title} - 图片 ${index + 1}"
                              class="w-20 h-20 object-cover rounded-lg cursor-pointer"
                              onclick="openImageViewer(${JSON.stringify(photoSet.image_urls)}, ${index})"
                              loading="lazy"
                            />
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900">
                              ${photoSet.title} - 图片 ${index + 1}
                            </p>
                            <p class="text-sm text-gray-500">
                              点击查看大图
                            </p>
                          </div>
                          <div class="flex items-center space-x-2">
                            <button
                              onclick="openImageViewer(${JSON.stringify(photoSet.image_urls)}, ${index})"
                              class="text-primary hover:text-primary/80 text-sm font-medium"
                            >
                              查看
                            </button>
                            <button
                              onclick="downloadImage('${imageUrl}', '${photoSet.title}_${index + 1}')"
                              class="text-gray-600 hover:text-gray-800 text-sm font-medium"
                            >
                              下载
                            </button>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>

            <!-- 侧边栏 -->
            <div class="w-full lg:w-80 space-y-6">
              <!-- 同分类推荐 -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold mb-4 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7l2 2-2 2m0 8l2 2-2 2" />
                  </svg>
                  同分类推荐
                </h3>
                <div class="space-y-4">
                  ${filteredSameCategory.slice(0, 3).map(item => `
                    <a href="/photoset/${item.slug}" class="block group">
                      <div class="flex space-x-3">
                        <div class="flex-shrink-0">
                          <img
                            src="${item.cover_image}"
                            alt="${item.title}"
                            class="w-16 h-16 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
                            loading="lazy"
                          />
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                            ${item.title}
                          </h4>
                          <div class="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                            <span>${item.view_count} 浏览</span>
                            <span>•</span>
                            <span>图片集</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  `).join('')}
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200">
                  <a href="/?category=${photoSet.category_slug}" class="text-sm text-primary hover:text-primary/80 font-medium">
                    查看更多 ${photoSet.category} →
                  </a>
                </div>
              </div>

              <!-- 热门推荐 -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold mb-4 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  热门推荐
                </h3>
                <div class="space-y-4">
                  ${filteredRelated.map((item, index) => `
                    <a href="/photoset/${item.slug}" class="block group">
                      <div class="flex space-x-3">
                        <div class="flex-shrink-0 relative">
                          <img
                            src="${item.cover_image}"
                            alt="${item.title}"
                            class="w-16 h-16 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
                            loading="lazy"
                          />
                          <div class="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            ${index + 1}
                          </div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                            ${item.title}
                          </h4>
                          <div class="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                            <span>${item.view_count} 浏览</span>
                            <span>•</span>
                            <span>${item.category}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  `).join('')}
                </div>
              </div>

              <!-- 相关标签 -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold mb-4 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  相关标签
                </h3>
                <div class="flex flex-wrap gap-2">
                  ${photoSet.tags.map(tag => `
                    <a
                      href="/?tag=${encodeURIComponent(tag)}"
                      class="inline-block px-3 py-1 bg-gray-100 hover:bg-primary hover:text-white text-gray-700 text-sm rounded-full transition-colors duration-200"
                    >
                      #${tag}
                    </a>
                  `).join('')}
                  ${TagDAO.getPopularTags(10).filter(tag => !photoSet.tags.includes(tag.name)).slice(0, 5).map(tag => `
                    <a
                      href="/?tag=${encodeURIComponent(tag.name)}"
                      class="inline-block px-3 py-1 bg-gray-100 hover:bg-primary hover:text-white text-gray-700 text-sm rounded-full transition-colors duration-200"
                    >
                      #${tag.name}
                    </a>
                  `).join('')}
                </div>
              </div>

              <!-- 分类导航 -->
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h3 class="text-lg font-semibold mb-4 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7l2 2-2 2m0 8l2 2-2 2" />
                  </svg>
                  浏览分类
                </h3>
                <div class="space-y-2">
                  ${categories.map(category => `
                    <a
                      href="/?category=${category.slug}"
                      class="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 transition-colors ${photoSet.category_slug === category.slug ? 'bg-primary/10 text-primary' : 'text-gray-700'}"
                    >
                      <span>${category.name}</span>
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
              <div class="mt-2 space-x-4">
                <a href="/about" class="hover:text-primary transition-colors">关于我们</a>
                <a href="/contact" class="hover:text-primary transition-colors">联系我们</a>
                <a href="/privacy" class="hover:text-primary transition-colors">隐私政策</a>
              </div>
            </div>
          </div>
        </footer>

        <!-- JavaScript -->
        <script>
          // 图片查看器
          function openImageViewer(images, currentIndex = 0) {
            const viewer = document.createElement('div');
            viewer.className = 'fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center image-viewer';
            viewer.innerHTML = \`
              <div class="relative max-w-full max-h-full p-4">
                <img src="\${images[currentIndex]}" alt="Image \${currentIndex + 1}" class="max-w-full max-h-full object-contain" />

                <!-- 关闭按钮 -->
                <button onclick="this.closest('.image-viewer').remove()"
                        class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 bg-black bg-opacity-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200">
                  ✕
                </button>

                <!-- 上一张 -->
                <button onclick="prevImage()"
                        class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-300 bg-black bg-opacity-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 \${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}">
                  ‹
                </button>

                <!-- 下一张 -->
                <button onclick="nextImage()"
                        class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-300 bg-black bg-opacity-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 \${currentIndex === images.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                  ›
                </button>

                <!-- 图片信息 -->
                <div class="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                  <div class="text-sm">${photoSet.title}</div>
                  <div class="text-xs text-gray-300">\${currentIndex + 1} / \${images.length}</div>
                </div>

                <!-- 下载按钮 -->
                <button onclick="downloadImage(images[currentIndex], '${photoSet.title}_' + (currentIndex + 1))"
                        class="absolute bottom-4 right-4 text-white bg-primary bg-opacity-80 hover:bg-opacity-100 px-4 py-2 rounded-lg text-sm transition-all duration-200">
                  下载图片
                </button>
              </div>
            \`;

            let index = currentIndex;

            window.prevImage = () => {
              if (index > 0) {
                index--;
                const img = viewer.querySelector('img');
                const info = viewer.querySelector('.text-xs');
                img.src = images[index];
                info.textContent = \`\${index + 1} / \${images.length}\`;
                updateNavigationButtons();
              }
            };

            window.nextImage = () => {
              if (index < images.length - 1) {
                index++;
                const img = viewer.querySelector('img');
                const info = viewer.querySelector('.text-xs');
                img.src = images[index];
                info.textContent = \`\${index + 1} / \${images.length}\`;
                updateNavigationButtons();
              }
            };

            function updateNavigationButtons() {
              const prevBtn = viewer.querySelector('button:nth-child(3)');
              const nextBtn = viewer.querySelector('button:nth-child(4)');

              if (index === 0) {
                prevBtn.classList.add('opacity-50', 'cursor-not-allowed');
              } else {
                prevBtn.classList.remove('opacity-50', 'cursor-not-allowed');
              }

              if (index === images.length - 1) {
                nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
              } else {
                nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
              }
            }

            viewer.onclick = (e) => {
              if (e.target === viewer) viewer.remove();
            };

            document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                viewer.remove();
              } else if (e.key === 'ArrowLeft') {
                window.prevImage();
              } else if (e.key === 'ArrowRight') {
                window.nextImage();
              }
            });

            document.body.appendChild(viewer);
          }

          // 视图模式切换
          function toggleViewMode(mode) {
            const gridView = document.getElementById('gridView');
            const listView = document.getElementById('listView');
            const gridBtn = document.getElementById('gridBtn');
            const listBtn = document.getElementById('listBtn');

            if (mode === 'grid') {
              gridView.classList.remove('hidden');
              listView.classList.add('hidden');
              gridBtn.classList.add('text-primary');
              listBtn.classList.remove('text-primary');
            } else {
              gridView.classList.add('hidden');
              listView.classList.remove('hidden');
              listBtn.classList.add('text-primary');
              gridBtn.classList.remove('text-primary');
            }
          }

          // 下载图片
          function downloadImage(url, filename) {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename + '.jpg';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }

          // 下载全部图片
          function downloadAll() {
            const images = ${JSON.stringify(photoSet.image_urls)};
            images.forEach((url, index) => {
              setTimeout(() => {
                downloadImage(url, '${photoSet.title}_' + (index + 1));
              }, index * 500); // 延迟下载避免浏览器阻止
            });
          }

          // 社交分享
          function shareToWeibo() {
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent('${photoSet.title} - 看图网站');
            window.open(\`https://service.weibo.com/share/share.php?url=\${url}&title=\${title}\`, '_blank');
          }

          function shareToWechat() {
            // 微信分享需要特殊处理，这里显示二维码
            alert('请复制链接分享到微信：' + window.location.href);
          }

          function copyLink() {
            navigator.clipboard.writeText(window.location.href).then(() => {
              alert('链接已复制到剪贴板！');
            }).catch(() => {
              // 降级方案
              const textArea = document.createElement('textarea');
              textArea.value = window.location.href;
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand('copy');
              document.body.removeChild(textArea);
              alert('链接已复制到剪贴板！');
            });
          }

          // 收藏功能
          function toggleFavorite() {
            // 这里可以实现收藏功能
            alert('收藏功能开发中...');
          }

          // 初始化
          document.addEventListener('DOMContentLoaded', function() {
            // 默认网格视图
            toggleViewMode('grid');

            // 图片加载统计
            const images = document.querySelectorAll('img[loading="lazy"]');
            let loadedCount = 0;
            const totalCount = images.length;

            images.forEach(img => {
              img.addEventListener('load', () => {
                loadedCount++;
                const statusText = document.querySelector('.text-sm.text-gray-500');
                if (statusText) {
                  statusText.textContent = \`已加载 \${loadedCount}/\${totalCount} 张图片\`;
                  if (loadedCount === totalCount) {
                    statusText.textContent = '所有图片加载完成';
                  }
                }
              });
            });
          });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('套图详情页加载失败:', error);
    return c.text('页面加载失败', 500);
  }
});

// 分类列表页
pages.get('/categories', async (c) => {
  try {
    const categories = CategoryDAO.getCategoriesWithCount();

    return c.html(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>分类浏览 - 看图网站</title>
        <meta name="description" content="浏览所有图片分类，发现更多精美内容">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#4A90E2'
                }
              }
            }
          }
        </script>
      </head>
      <body class="bg-gray-50">
        <!-- 导航栏 -->
        <nav class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center space-x-4">
                <a href="/" class="flex items-center space-x-2">
                  <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span class="text-white font-bold text-lg">看</span>
                  </div>
                  <span class="text-xl font-bold text-gray-900">看图网站</span>
                </a>
              </div>

              <!-- 搜索框 -->
              <div class="flex-1 max-w-lg mx-8">
                <form action="/" method="GET" class="relative">
                  <input
                    type="text"
                    name="search"
                    placeholder="搜索图片..."
                    class="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                  <div class="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </form>
              </div>

              <!-- 导航链接 -->
              <nav class="hidden md:flex space-x-6">
                <a href="/" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">首页</a>
                <a href="/categories" class="text-primary px-3 py-2 rounded-md text-sm font-medium">分类</a>
                <a href="/tags" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">标签</a>
              </nav>
            </div>
          </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- 面包屑 -->
          <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <a href="/" class="hover:text-primary transition-colors">首页</a>
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-gray-900 font-medium">分类浏览</span>
          </nav>

          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-4">分类浏览</h1>
            <p class="text-gray-600">发现不同类型的精美图片，找到你感兴趣的内容</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            ${categories.map(category => `
              <a href="/?category=${category.slug}" class="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <div class="p-6">
                  <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7l2 2-2 2m0 8l2 2-2 2" />
                      </svg>
                    </div>
                    <span class="text-2xl font-bold text-gray-300 group-hover:text-primary transition-colors">${category.count}</span>
                  </div>
                  <h2 class="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors mb-2">${category.name}</h2>
                  <p class="text-gray-600 text-sm">${category.count} 个套图</p>
                </div>
                <div class="h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </a>
            `).join('')}
          </div>
        </main>

        <!-- 页脚 -->
        <footer class="bg-white border-t mt-12">
          <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div class="text-center text-gray-600">
              <p>&copy; 2024 看图网站. All rights reserved.</p>
              <div class="mt-2 space-x-4">
                <a href="/about" class="hover:text-primary transition-colors">关于我们</a>
                <a href="/contact" class="hover:text-primary transition-colors">联系我们</a>
                <a href="/privacy" class="hover:text-primary transition-colors">隐私政策</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('分类列表页加载失败:', error);
    return c.text('页面加载失败', 500);
  }
});

// 标签列表页
pages.get('/tags', async (c) => {
  try {
    const tags = TagDAO.getAllTags();
    const popularTags = TagDAO.getPopularTags(50);

    return c.html(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>标签浏览 - 看图网站</title>
        <meta name="description" content="浏览所有图片标签，通过标签发现更多相关内容">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#4A90E2'
                }
              }
            }
          }
        </script>
      </head>
      <body class="bg-gray-50">
        <!-- 导航栏 -->
        <nav class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center space-x-4">
                <a href="/" class="flex items-center space-x-2">
                  <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span class="text-white font-bold text-lg">看</span>
                  </div>
                  <span class="text-xl font-bold text-gray-900">看图网站</span>
                </a>
              </div>

              <!-- 搜索框 -->
              <div class="flex-1 max-w-lg mx-8">
                <form action="/" method="GET" class="relative">
                  <input
                    type="text"
                    name="search"
                    placeholder="搜索图片..."
                    class="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                  <div class="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </form>
              </div>

              <!-- 导航链接 -->
              <nav class="hidden md:flex space-x-6">
                <a href="/" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">首页</a>
                <a href="/categories" class="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">分类</a>
                <a href="/tags" class="text-primary px-3 py-2 rounded-md text-sm font-medium">标签</a>
              </nav>
            </div>
          </div>
        </nav>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- 面包屑 -->
          <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <a href="/" class="hover:text-primary transition-colors">首页</a>
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-gray-900 font-medium">标签浏览</span>
          </nav>

          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-4">标签浏览</h1>
            <p class="text-gray-600">通过标签发现相关内容，找到你感兴趣的图片主题</p>
          </div>

          <!-- 热门标签 -->
          <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              热门标签
            </h2>
            <div class="flex flex-wrap gap-3">
              ${popularTags.slice(0, 20).map((tag, index) => `
                <a
                  href="/?tag=${encodeURIComponent(tag.name)}"
                  class="group relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  ${index < 3 ? `<span class="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">${index + 1}</span>` : ''}
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                  </svg>
                  ${tag.name}
                  <span class="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">${tag.count}</span>
                </a>
              `).join('')}
            </div>
          </div>

          <!-- 所有标签 -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
              </svg>
              所有标签 (${tags.length})
            </h2>
            <div class="flex flex-wrap gap-2">
              ${tags.map(tag => `
                <a
                  href="/?tag=${encodeURIComponent(tag.name)}"
                  class="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-primary hover:text-white text-gray-700 text-sm rounded-full transition-colors duration-200"
                >
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                  </svg>
                  ${tag.name}
                  <span class="ml-1 text-xs opacity-75">(${tag.count})</span>
                </a>
              `).join('')}
            </div>
          </div>
        </main>

        <!-- 页脚 -->
        <footer class="bg-white border-t mt-12">
          <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div class="text-center text-gray-600">
              <p>&copy; 2024 看图网站. All rights reserved.</p>
              <div class="mt-2 space-x-4">
                <a href="/about" class="hover:text-primary transition-colors">关于我们</a>
                <a href="/contact" class="hover:text-primary transition-colors">联系我们</a>
                <a href="/privacy" class="hover:text-primary transition-colors">隐私政策</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('标签列表页加载失败:', error);
    return c.text('页面加载失败', 500);
  }
});

// 隐藏的管理员登录页面
pages.get('/setu-admin', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>管理员登录 - 看图网站</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                primary: '#4A90E2'
              }
            }
          }
        }
      </script>
    </head>
    <body class="bg-gray-50 min-h-screen flex items-center justify-center">
      <div class="max-w-md w-full space-y-8 p-8">
        <div class="text-center">
          <div class="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
            <span class="text-white font-bold text-2xl">看</span>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">管理员登录</h2>
          <p class="mt-2 text-sm text-gray-600">请输入您的管理员凭据</p>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6">
          <form id="loginForm" class="space-y-6">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="请输入用户名"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="请输入密码"
              />
            </div>

            <div id="errorMessage" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"></div>

            <button
              type="submit"
              class="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              id="submitBtn"
            >
              登录
            </button>
          </form>
        </div>

        <div class="text-center">
          <a href="/" class="text-sm text-gray-600 hover:text-primary transition-colors">
            ← 返回首页
          </a>
        </div>
      </div>

      <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();

          const submitBtn = document.getElementById('submitBtn');
          const errorMessage = document.getElementById('errorMessage');
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;

          // 重置状态
          errorMessage.classList.add('hidden');
          submitBtn.disabled = true;
          submitBtn.textContent = '登录中...';

          try {
            const response = await fetch('/admin/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
              // 保存token到localStorage
              localStorage.setItem('admin_token', data.token);
              // 跳转到管理后台，在URL中携带token
              window.location.href = '/admin/dashboard?token=' + encodeURIComponent(data.token);
            } else {
              errorMessage.textContent = data.message || '登录失败';
              errorMessage.classList.remove('hidden');
            }
          } catch (error) {
            errorMessage.textContent = '网络错误，请稍后重试';
            errorMessage.classList.remove('hidden');
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '登录';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// admin/login路由已在admin.ts中处理

// 管理后台仪表盘
pages.get('/admin/dashboard', async (c) => {
  try {
    // 检查认证 - 从URL参数或Authorization header获取token
    const token = c.req.query('token') ||
                  c.req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return c.redirect('/setu-admin');
    }

    // 简单验证token（实际项目中应该验证JWT签名和过期时间）
    try {
      // 这里可以添加JWT验证逻辑
      // 目前只检查token是否存在
      if (token.length < 10) {
        return c.redirect('/setu-admin');
      }
    } catch (error) {
      console.error('Token验证失败:', error);
      return c.redirect('/setu-admin');
    }

    const stats = StatsDAO.getDashboardStats();

    return c.html(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理后台 - 看图网站</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#4A90E2'
                }
              }
            }
          }
        </script>
      </head>
      <body class="bg-gray-50 min-h-screen">
        <!-- 管理后台导航栏 -->
        <nav class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center space-x-4">
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-lg">管</span>
                </div>
                <span class="text-xl font-bold text-gray-900">管理后台</span>
              </div>

              <div class="flex items-center space-x-4">
                <a href="/" target="_blank" class="text-gray-600 hover:text-primary transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button onclick="logout()" class="text-gray-600 hover:text-red-600 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">仪表盘</h1>
            <p class="text-gray-600">欢迎回到管理后台</p>
          </div>

          <!-- 统计卡片 -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">套图总数</p>
                  <p class="text-2xl font-semibold text-gray-900">${stats.total_photosets}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7l2 2-2 2m0 8l2 2-2 2" />
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">分类数量</p>
                  <p class="text-2xl font-semibold text-gray-900">${stats.total_categories}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">标签数量</p>
                  <p class="text-2xl font-semibold text-gray-900">${TagDAO.getAllTags().length}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">总浏览量</p>
                  <p class="text-2xl font-semibold text-gray-900">${stats.total_views}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 快速操作 -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">套图管理</h3>
              <p class="text-gray-600 mb-4">套图，添加、编辑或删除套图</p>
              <a href="/admin/photosets?token=${encodeURIComponent(token)}" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                管理套图
              </a>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">分类管理</h3>
              <p class="text-gray-600 mb-4">管理图片分类，创建或编辑分类</p>
              <a href="/admin/categories?token=${encodeURIComponent(token)}" class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7l2 2-2 2m0 8l2 2-2 2" />
                </svg>
                管理分类
              </a>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">标签管理</h3>
              <p class="text-gray-600 mb-4">管理所有标签，查看使用情况</p>
              <a href="/admin/tags?token=${encodeURIComponent(token)}" class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                </svg>
                管理标签
              </a>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">系统设置</h3>
              <p class="text-gray-600 mb-4">配置系统参数和网站设置</p>
              <button class="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors" onclick="alert('功能开发中...')">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                系统设置
              </button>
            </div>
          </div>
        </div>

        <script>
          // 保存token到全局变量
          window.adminToken = '${token}';

          // 退出登录
          function logout() {
            if (confirm('确定要退出登录吗？')) {
              localStorage.removeItem('admin_token');
              window.location.href = '/setu-admin';
            }
          }

          // 检查token有效性
          function checkTokenValidity() {
            // 这里可以添加定期检查token有效性的逻辑
          }

          // 页面加载完成后执行
          document.addEventListener('DOMContentLoaded', function() {
            console.log('管理后台加载完成');
          });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    return c.text('页面加载失败', 500);
  }
});

// 管理后台套图管理页面
pages.get('/admin/photosets', async (c) => {
  try {
    // 检查认证
    const token = c.req.query('token') ||
                  c.req.header('Authorization')?.replace('Bearer ', '');

    if (!token || token.length < 10) {
      return c.redirect('/setu-admin');
    }

    // 获取查询参数
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const search = c.req.query('search') || '';
    const category = c.req.query('category') || '';
    const status = c.req.query('status') || '';

    // 获取套图列表
    const photoSetsResult = PhotoSetDAO.getPhotoSets({
      page,
      limit,
      search,
      category,
      sort: 'published_at_desc'
    });

    // 获取分类列表
    const categories = CategoryDAO.getCategoriesWithCount();

    // 计算分页信息
    const totalPages = Math.ceil(photoSetsResult.total / limit);

    return c.html(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>套图管理 - 管理后台</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#4A90E2'
                }
              }
            }
          }
        </script>
      </head>
      <body class="bg-gray-50 min-h-screen">
        <!-- 管理后台导航栏 -->
        <nav class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center space-x-4">
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-lg">管</span>
                </div>
                <span class="text-xl font-bold text-gray-900">管理后台</span>
                <span class="text-gray-400">|</span>
                <span class="text-gray-600">套图管理</span>
              </div>

              <div class="flex items-center space-x-4">
                <a href="/admin/dashboard?token=${encodeURIComponent(token)}" class="text-gray-600 hover:text-primary transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
                  </svg>
                </a>
                <a href="/" target="_blank" class="text-gray-600 hover:text-primary transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button onclick="logout()" class="text-gray-600 hover:text-red-600 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- 页面标题和操作 -->
          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">套图管理</h1>
              <p class="text-gray-600">套图，添加、编辑或删除套图</p>
            </div>
            <button onclick="showCreateModal()" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              添加套图
            </button>
          </div>

          <!-- 筛选和搜索 -->
          <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <form method="GET" class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input type="hidden" name="token" value="${token}">

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">搜索</label>
                <input
                  type="text"
                  name="search"
                  value="${search}"
                  placeholder="搜索套图标题..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">分类</label>
                <select name="category" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="">全部分类</option>
                  ${categories.map(cat => `
                    <option value="${cat.slug}" ${category === cat.slug ? 'selected' : ''}>${cat.name}</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="">全部状态</option>
                  <option value="published" ${status === 'published' ? 'selected' : ''}>已发布</option>
                  <option value="draft" ${status === 'draft' ? 'selected' : ''}>草稿</option>
                </select>
              </div>

              <div class="flex items-end space-x-2">
                <button type="submit" class="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                  搜索
                </button>
                <a href="/admin/photosets?token=${encodeURIComponent(token)}" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  重置
                </a>
              </div>
            </form>
          </div>

          <!-- 套图列表 -->
          <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex justify-between items-center">
                <h2 class="text-lg font-semibold text-gray-900">套图列表</h2>
                <span class="text-sm text-gray-500">共 ${photoSetsResult.total} 个套图</span>
              </div>
            </div>

            ${photoSetsResult.data.length > 0 ? `
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">套图</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">浏览量</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发布时间</th>
                      <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    ${photoSetsResult.data.map(photoSet => `
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center">
                            <div class="flex-shrink-0 h-16 w-16">
                              <img class="h-16 w-16 rounded-lg object-cover" src="${photoSet.cover_image}" alt="${photoSet.title}">
                            </div>
                            <div class="ml-4">
                              <div class="text-sm font-medium text-gray-900 max-w-xs truncate">${photoSet.title}</div>
                              <div class="text-sm text-gray-500">图片集</div>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ${photoSet.category}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            已发布
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${photoSet.view_count}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${new Date(photoSet.published_at).toLocaleDateString('zh-CN')}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div class="flex items-center justify-end space-x-2">
                            <a href="/photoset/${photoSet.slug}" target="_blank" class="text-primary hover:text-primary/80">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </a>
                            <button onclick="editPhotoSet(${photoSet.id})" class="text-indigo-600 hover:text-indigo-900">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onclick="deletePhotoSet(${photoSet.id})" class="text-red-600 hover:text-red-900">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">暂无套图</h3>
                <p class="mt-1 text-sm text-gray-500">开始创建您的第一个套图吧</p>
                <div class="mt-6">
                  <button onclick="showCreateModal()" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    添加套图
                  </button>
                </div>
              </div>
            `}

            <!-- 分页 -->
            ${totalPages > 1 ? `
              <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div class="flex items-center justify-between">
                  <div class="flex-1 flex justify-between sm:hidden">
                    ${page > 1 ? `
                      <a href="?token=${encodeURIComponent(token)}&page=${page - 1}&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        上一页
                      </a>
                    ` : `
                      <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">
                        上一页
                      </span>
                    `}
                    ${page < totalPages ? `
                      <a href="?token=${encodeURIComponent(token)}&page=${page + 1}&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        下一页
                      </a>
                    ` : `
                      <span class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">
                        下一页
                      </span>
                    `}
                  </div>
                  <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p class="text-sm text-gray-700">
                        显示第 <span class="font-medium">${(page - 1) * limit + 1}</span> 到 <span class="font-medium">${Math.min(page * limit, photoSetsResult.total)}</span> 条，
                        共 <span class="font-medium">${photoSetsResult.total}</span> 条记录
                      </p>
                    </div>
                    <div>
                      <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        ${page > 1 ? `
                          <a href="?token=${encodeURIComponent(token)}&page=${page - 1}&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                          </a>
                        ` : ''}

                        ${Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (page <= 4) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 3) {
                            pageNum = totalPages - 6 + i;
                          } else {
                            pageNum = page - 3 + i;
                          }

                          const isCurrentPage = pageNum === page;
                          return `
                            <a href="?token=${encodeURIComponent(token)}&page=${pageNum}&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}"
                               class="relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                 isCurrentPage
                                   ? 'z-10 bg-primary border-primary text-white'
                                   : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                               }">
                              ${pageNum}
                            </a>
                          `;
                        }).join('')}

                        ${page < totalPages ? `
                          <a href="?token=${encodeURIComponent(token)}&page=${page + 1}&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                            </svg>
                          </a>
                        ` : ''}
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- 创建/编辑套图模态框 -->
        <div id="photosetModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div class="mt-3">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900" id="modalTitle">添加套图</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form id="photosetForm" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">标题</label>
                  <input type="text" id="title" name="title" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">描述</label>
                  <textarea id="description" name="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">分类</label>
                    <select id="category" name="category" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="">选择分类</option>
                      ${categories.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('')}
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">状态</label>
                    <select id="status" name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="published">已发布</option>
                      <option value="draft">草稿</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">标签（用逗号分隔）</label>
                  <input type="text" id="tags" name="tags" placeholder="例如：美女,写真,艺术" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">图片URL（每行一个）</label>
                  <textarea id="imageUrls" name="imageUrls" rows="6" required placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>
                </div>

                <div class="flex items-center">
                  <input type="checkbox" id="isFeatured" name="isFeatured" class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded">
                  <label for="isFeatured" class="ml-2 block text-sm text-gray-900">设为推荐</label>
                </div>

                <div class="flex justify-end space-x-3 pt-4">
                  <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    取消
                  </button>
                  <button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <script>
          // 全局变量
          window.adminToken = '${token}';
          let currentEditId = null;

          // 显示创建模态框
          function showCreateModal() {
            currentEditId = null;
            document.getElementById('modalTitle').textContent = '添加套图';
            document.getElementById('photosetForm').reset();
            document.getElementById('photosetModal').classList.remove('hidden');
          }

          // 编辑套图
          function editPhotoSet(id) {
            currentEditId = id;
            document.getElementById('modalTitle').textContent = '编辑套图';

            // 加载套图数据并填充表单
            fetch(\`/admin/api/photosets/\${id}\`, {
              headers: {
                'Authorization': 'Bearer ' + window.adminToken
              }
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                const photoSet = data.data;
                document.getElementById('title').value = photoSet.title || '';
                document.getElementById('description').value = photoSet.description || '';
                document.getElementById('category').value = photoSet.category_slug || '';
                document.getElementById('status').value = photoSet.status || 'published';
                document.getElementById('tags').value = photoSet.tags ? photoSet.tags.join(', ') : '';
                document.getElementById('imageUrls').value = photoSet.image_urls ? photoSet.image_urls.join('\\n') : '';
                document.getElementById('isFeatured').checked = photoSet.is_featured || false;

                document.getElementById('photosetModal').classList.remove('hidden');
              } else {
                alert('加载套图数据失败：' + data.message);
              }
            })
            .catch(error => {
              alert('加载套图数据失败：' + error.message);
            });
          }

          // 删除套图
          function deletePhotoSet(id) {
            if (confirm('确定要删除这个套图吗？此操作不可恢复。')) {
              fetch(\`/admin/api/photosets/\${id}\`, {
                method: 'DELETE',
                headers: {
                  'Authorization': 'Bearer ' + window.adminToken
                }
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  location.reload();
                } else {
                  alert('删除失败：' + data.message);
                }
              })
              .catch(error => {
                alert('删除失败：' + error.message);
              });
            }
          }

          // 关闭模态框
          function closeModal() {
            document.getElementById('photosetModal').classList.add('hidden');
          }

          // 表单提交
          document.getElementById('photosetForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const data = {
              title: formData.get('title'),
              description: formData.get('description'),
              category_id: 1, // 需要根据分类slug获取ID
              tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
              image_urls: formData.get('imageUrls').split('\\n').map(url => url.trim()).filter(url => url),
              is_featured: formData.has('isFeatured'),
              status: formData.get('status')
            };

            const url = currentEditId ? \`/admin/api/photosets/\${currentEditId}\` : '/admin/api/photosets';
            const method = currentEditId ? 'PUT' : 'POST';

            try {
              const response = await fetch(url, {
                method: method,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + window.adminToken
                },
                body: JSON.stringify(data)
              });

              const result = await response.json();

              if (result.success) {
                closeModal();
                location.reload();
              } else {
                alert('保存失败：' + result.message);
              }
            } catch (error) {
              alert('保存失败：' + error.message);
            }
          });

          // 退出登录
          function logout() {
            if (confirm('确定要退出登录吗？')) {
              localStorage.removeItem('admin_token');
              window.location.href = '/setu-admin';
            }
          }

          // 点击模态框外部关闭
          document.getElementById('photosetModal').addEventListener('click', function(e) {
            if (e.target === this) {
              closeModal();
            }
          });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('套图管理页面加载失败:', error);
    return c.text('页面加载失败', 500);
  }
});

// 管理后台分类管理页面
pages.get('/admin/categories', async (c) => {
  try {
    // 检查认证
    const token = c.req.query('token') ||
                  c.req.header('Authorization')?.replace('Bearer ', '');

    if (!token || token.length < 10) {
      return c.redirect('/setu-admin');
    }

    // 获取分类列表
    const categories = CategoryDAO.getCategoriesWithCount();

    return c.html(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>分类管理 - 管理后台</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#4A90E2'
                }
              }
            }
          }
        </script>
      </head>
      <body class="bg-gray-50 min-h-screen">
        <!-- 管理后台导航栏 -->
        <nav class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center space-x-4">
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-lg">管</span>
                </div>
                <span class="text-xl font-bold text-gray-900">管理后台</span>
                <span class="text-gray-400">|</span>
                <span class="text-gray-600">分类管理</span>
              </div>

              <div class="flex items-center space-x-4">
                <a href="/admin/dashboard?token=${encodeURIComponent(token)}" class="text-gray-600 hover:text-primary transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
                  </svg>
                </a>
                <a href="/" target="_blank" class="text-gray-600 hover:text-primary transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button onclick="logout()" class="text-gray-600 hover:text-red-600 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- 页面标题和操作 -->
          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">分类管理</h1>
              <p class="text-gray-600">管理图片分类，创建或编辑分类</p>
            </div>
            <button onclick="showCreateModal()" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              添加分类
            </button>
          </div>

          <!-- 分类列表 -->
          <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex justify-between items-center">
                <h2 class="text-lg font-semibold text-gray-900">分类列表</h2>
                <span class="text-sm text-gray-500">共 ${categories.length} 个分类</span>
              </div>
            </div>

            ${categories.length > 0 ? `
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                ${categories.map(category => `
                  <div class="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                    <div class="flex items-center justify-between mb-4">
                      <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7l2 2-2 2m0 8l2 2-2 2" />
                        </svg>
                      </div>
                      <div class="flex items-center space-x-2">
                        <button onclick="editCategory(${category.id}, '${category.name}', '${category.slug}')" class="text-indigo-600 hover:text-indigo-900">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onclick="deleteCategory(${category.id}, '${category.name}')" class="text-red-600 hover:text-red-900">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <h3 class="text-lg font-semibold text-gray-900 mb-2">${category.name}</h3>
                    <p class="text-sm text-gray-600 mb-3">标识符: ${category.slug}</p>

                    <div class="flex items-center justify-between">
                      <span class="text-2xl font-bold text-primary">${category.count}</span>
                      <div class="text-right">
                        <p class="text-xs text-gray-500">套图数量</p>
                        <a href="/?category=${category.slug}" target="_blank" class="text-xs text-primary hover:text-primary/80">查看分类 →</a>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14-7l2 2-2 2m0 8l2 2-2 2" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">暂无分类</h3>
                <p class="mt-1 text-sm text-gray-500">开始创建您的第一个分类吧</p>
                <div class="mt-6">
                  <button onclick="showCreateModal()" class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    添加分类
                  </button>
                </div>
              </div>
            `}
          </div>
        </div>

        <!-- 创建/编辑分类模态框 -->
        <div id="categoryModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div class="mt-3">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900" id="modalTitle">添加分类</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form id="categoryForm" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">分类名称</label>
                  <input type="text" id="categoryName" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="例如：美女写真">
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">URL标识符</label>
                  <input type="text" id="categorySlug" name="slug" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="例如：beauty">
                  <p class="mt-1 text-xs text-gray-500">用于URL中的分类标识，只能包含字母、数字和连字符</p>
                </div>

                <div class="flex justify-end space-x-3 pt-4">
                  <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    取消
                  </button>
                  <button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <script>
          // 全局变量
          window.adminToken = '${token}';
          let currentEditId = null;

          // 显示创建模态框
          function showCreateModal() {
            currentEditId = null;
            document.getElementById('modalTitle').textContent = '添加分类';
            document.getElementById('categoryForm').reset();
            document.getElementById('categoryModal').classList.remove('hidden');
          }

          // 编辑分类
          function editCategory(id, name, slug) {
            currentEditId = id;
            document.getElementById('modalTitle').textContent = '编辑分类';
            document.getElementById('categoryName').value = name;
            document.getElementById('categorySlug').value = slug;
            document.getElementById('categoryModal').classList.remove('hidden');
          }

          // 删除分类
          function deleteCategory(id, name) {
            if (confirm(\`确定要删除分类"\${name}"吗？此操作不可恢复。\`)) {
              fetch(\`/admin/api/categories/\${id}\`, {
                method: 'DELETE',
                headers: {
                  'Authorization': 'Bearer ' + window.adminToken
                }
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  location.reload();
                } else {
                  alert('删除失败：' + data.message);
                }
              })
              .catch(error => {
                alert('删除失败：' + error.message);
              });
            }
          }

          // 关闭模态框
          function closeModal() {
            document.getElementById('categoryModal').classList.add('hidden');
          }

          // 表单提交
          document.getElementById('categoryForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const data = {
              name: formData.get('name'),
              slug: formData.get('slug')
            };

            const url = currentEditId ? \`/admin/api/categories/\${currentEditId}\` : '/admin/api/categories';
            const method = currentEditId ? 'PUT' : 'POST';

            try {
              const response = await fetch(url, {
                method: method,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + window.adminToken
                },
                body: JSON.stringify(data)
              });

              const result = await response.json();

              if (result.success) {
                closeModal();
                location.reload();
              } else {
                alert('保存失败：' + result.message);
              }
            } catch (error) {
              alert('保存失败：' + error.message);
            }
          });

          // 退出登录
          function logout() {
            if (confirm('确定要退出登录吗？')) {
              localStorage.removeItem('admin_token');
              window.location.href = '/setu-admin';
            }
          }

          // 点击模态框外部关闭
          document.getElementById('categoryModal').addEventListener('click', function(e) {
            if (e.target === this) {
              closeModal();
            }
          });

          // 自动生成slug
          document.getElementById('categoryName').addEventListener('input', function(e) {
            const name = e.target.value;
            const slug = name.toLowerCase()
              .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
            document.getElementById('categorySlug').value = slug;
          });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('分类管理页面加载失败:', error);
    return c.text('页面加载失败', 500);
  }
});

// 管理后台标签管理页面
pages.get('/admin/tags', async (c) => {
  try {
    // 检查认证
    const token = c.req.query('token') ||
                  c.req.header('Authorization')?.replace('Bearer ', '');

    if (!token || token.length < 10) {
      return c.redirect('/setu-admin');
    }

    // 获取标签列表
    const allTags = TagDAO.getAllTags();
    const popularTags = TagDAO.getPopularTags(20);

    return c.html(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>标签管理 - 管理后台</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#4A90E2'
                }
              }
            }
          }
        </script>
      </head>
      <body class="bg-gray-50 min-h-screen">
        <!-- 管理后台导航栏 -->
        <nav class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center space-x-4">
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-lg">管</span>
                </div>
                <span class="text-xl font-bold text-gray-900">管理后台</span>
                <span class="text-gray-400">|</span>
                <span class="text-gray-600">标签管理</span>
              </div>

              <div class="flex items-center space-x-4">
                <a href="/admin/dashboard?token=${encodeURIComponent(token)}" class="text-gray-600 hover:text-primary transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
                  </svg>
                </a>
                <a href="/" target="_blank" class="text-gray-600 hover:text-primary transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button onclick="logout()" class="text-gray-600 hover:text-red-600 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- 页面标题 -->
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">标签管理</h1>
            <p class="text-gray-600">管理所有标签，查看标签使用情况和热门程度</p>
          </div>

          <!-- 统计信息 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">标签总数</p>
                  <p class="text-2xl font-semibold text-gray-900">${allTags.length}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">热门标签</p>
                  <p class="text-2xl font-semibold text-gray-900">${popularTags.length}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">平均使用次数</p>
                  <p class="text-2xl font-semibold text-gray-900">${allTags.length > 0 ? Math.round(allTags.reduce((sum, tag) => sum + tag.count, 0) / allTags.length) : 0}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 热门标签 -->
          <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              热门标签 (前20个)
            </h2>
            <div class="flex flex-wrap gap-3">
              ${popularTags.map((tag, index) => `
                <div class="group relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
                  ${index < 3 ? `<span class="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">${index + 1}</span>` : ''}
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                  </svg>
                  <span class="mr-2">${tag.name}</span>
                  <span class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">${tag.count}</span>
                  <button onclick="deleteTag('${tag.name}')" class="ml-2 text-white hover:text-red-200 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 所有标签 -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold text-gray-900 flex items-center">
                <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                </svg>
                所有标签 (${allTags.length})
              </h2>
              <div class="flex items-center space-x-2">
                <input type="text" id="tagSearch" placeholder="搜索标签..." class="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                <button onclick="filterTags()" class="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors">搜索</button>
              </div>
            </div>

            <div id="allTagsContainer" class="flex flex-wrap gap-2">
              ${allTags.map(tag => `
                <div class="tag-item inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors duration-200 group">
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                  </svg>
                  <span class="tag-name mr-1">${tag.name}</span>
                  <span class="text-xs opacity-75">(${tag.count})</span>
                  <button onclick="deleteTag('${tag.name}')" class="ml-2 text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <script>
          // 全局变量
          window.adminToken = '${token}';

          // 删除标签
          function deleteTag(tagName) {
            if (confirm(\`确定要删除标签"\${tagName}"吗？这将影响所有使用该标签的套图。\`)) {
              fetch(\`/admin/api/tags/\${encodeURIComponent(tagName)}\`, {
                method: 'DELETE',
                headers: {
                  'Authorization': 'Bearer ' + window.adminToken
                }
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  location.reload();
                } else {
                  alert('删除失败：' + data.message);
                }
              })
              .catch(error => {
                alert('删除失败：' + error.message);
              });
            }
          }

          // 搜索标签
          function filterTags() {
            const searchTerm = document.getElementById('tagSearch').value.toLowerCase();
            const tagItems = document.querySelectorAll('.tag-item');

            tagItems.forEach(item => {
              const tagName = item.querySelector('.tag-name').textContent.toLowerCase();
              if (tagName.includes(searchTerm)) {
                item.style.display = 'inline-flex';
              } else {
                item.style.display = 'none';
              }
            });
          }

          // 实时搜索
          document.getElementById('tagSearch').addEventListener('input', filterTags);

          // 退出登录
          function logout() {
            if (confirm('确定要退出登录吗？')) {
              localStorage.removeItem('admin_token');
              window.location.href = '/setu-admin';
            }
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('标签管理页面加载失败:', error);
    return c.text('页面加载失败', 500);
  }
});

export default pages;
