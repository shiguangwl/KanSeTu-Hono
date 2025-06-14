import { html } from 'hono/html';
import type { DashboardStats } from '../types/index.js';

interface AdminDashboardProps {
  stats: DashboardStats;
}

export const AdminDashboard = ({ stats }: AdminDashboardProps) => {
  return html`
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
    <body class="bg-gray-50">
      <!-- 导航栏 -->
      <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <a href="/admin/dashboard" class="text-2xl font-bold text-primary">管理后台</a>
            </div>
            <div class="flex items-center space-x-4">
              <a href="/" class="text-gray-600 hover:text-primary" target="_blank">查看网站</a>
              <button onclick="logout()" class="text-gray-600 hover:text-red-600">退出登录</button>
            </div>
          </div>
        </div>
      </nav>

      <div class="flex">
        <!-- 侧边栏 -->
        <div class="w-64 bg-white shadow-sm min-h-screen">
          <nav class="mt-8">
            <div class="px-4 space-y-2">
              <a href="/admin/dashboard" class="bg-primary text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"></path>
                </svg>
                仪表盘
              </a>
              
              <a href="/admin/photosets" class="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                套图管理
              </a>
              
              <a href="/admin/categories" class="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                </svg>
                分类管理
              </a>
            </div>
          </nav>
        </div>

        <!-- 主要内容 -->
        <div class="flex-1 p-8">
          <div class="mb-8">
            <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
            <p class="text-gray-600">网站数据概览</p>
          </div>

          <!-- 统计卡片 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">总套图数</dt>
                      <dd class="text-lg font-medium text-gray-900">${stats.total_photosets}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">总分类数</dt>
                      <dd class="text-lg font-medium text-gray-900">${stats.total_categories}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">总浏览量</dt>
                      <dd class="text-lg font-medium text-gray-900">${stats.total_views}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 热门套图和分类 -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- 热门套图 -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">热门套图</h3>
                <div class="space-y-3">
                  ${stats.top_photosets.map((photoSet, index) => `
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <span class="inline-flex items-center justify-center w-6 h-6 text-xs font-bold ${
                          index < 3 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-600'
                        } rounded-full mr-3">
                          ${index + 1}
                        </span>
                        <div>
                          <p class="text-sm font-medium text-gray-900">${photoSet.title}</p>
                          <p class="text-xs text-gray-500">${photoSet.category}</p>
                        </div>
                      </div>
                      <span class="text-sm text-gray-500">${photoSet.view_count} 浏览</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- 热门分类 -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">热门分类</h3>
                <div class="space-y-3">
                  ${stats.top_categories.map((category, index) => `
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <span class="inline-flex items-center justify-center w-6 h-6 text-xs font-bold ${
                          index < 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                        } rounded-full mr-3">
                          ${index + 1}
                        </span>
                        <p class="text-sm font-medium text-gray-900">${category.name}</p>
                      </div>
                      <span class="text-sm text-gray-500">${category.count} 套图</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script>
        // 检查登录状态
        function checkAuth() {
          const token = localStorage.getItem('admin-token');
          if (!token) {
            window.location.href = '/admin/login';
            return false;
          }
          return true;
        }

        // 退出登录
        function logout() {
          localStorage.removeItem('admin-token');
          window.location.href = '/admin/login';
        }

        // 页面加载时检查认证
        if (!checkAuth()) {
          // 如果未认证，会自动跳转到登录页
        }
      </script>
    </body>
    </html>
  `;
};
