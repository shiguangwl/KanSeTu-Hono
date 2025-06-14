import { html } from 'hono/html';

export const TestPage = () => {
  return html`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>测试页面 - 看图网站</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50">
      <div class="max-w-4xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">看图网站测试页面</h1>
        
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">系统状态</h2>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>数据库连接正常</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>HonoJS 服务器运行正常</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Tailwind CSS 加载正常</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">功能测试</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/api/categories" class="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <h3 class="font-medium">API - 分类列表</h3>
              <p class="text-sm text-gray-600">测试分类API接口</p>
            </a>
            <a href="/api/photosets" class="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <h3 class="font-medium">API - 套图列表</h3>
              <p class="text-sm text-gray-600">测试套图API接口</p>
            </a>
            <a href="/admin/login" class="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <h3 class="font-medium">管理员登录</h3>
              <p class="text-sm text-gray-600">admin / admin123</p>
            </a>
            <a href="/categories" class="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <h3 class="font-medium">分类页面</h3>
              <p class="text-sm text-gray-600">浏览所有分类</p>
            </a>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-semibold mb-4">下一步开发</h2>
          <ul class="space-y-2 text-sm text-gray-600">
            <li>✅ 数据库初始化完成</li>
            <li>✅ 基础API接口完成</li>
            <li>⏳ 前端页面开发中</li>
            <li>⏳ 管理后台开发中</li>
            <li>⏳ 图片上传功能</li>
            <li>⏳ SEO优化</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `;
};
