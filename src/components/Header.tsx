import type { FC } from 'hono/jsx';

interface HeaderProps {
  currentCategory?: string;
  searchQuery?: string;
  categories?: Array<{ id: number; name: string; slug: string; count: number }>;
}

export const Header: FC<HeaderProps> = ({ currentCategory, searchQuery, categories = [] }) => {
  return (
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 主导航 */}
        <div class="flex items-center justify-between h-16">
          {/* Logo */}
          <div class="flex-shrink-0">
            <a href="/" class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">看</span>
              </div>
              <span class="text-xl font-bold text-gray-900">看图网站</span>
            </a>
          </div>

          {/* 搜索框 */}
          <div class="flex-1 max-w-lg mx-8">
            <div class="relative">
              <input
                type="text"
                placeholder="搜索图片..."
                value={searchQuery || ''}
                onkeydown="handleSearch(event)"
                class="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div class="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* 导航链接 */}
          <nav class="hidden md:flex space-x-8">
            <a href="/" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              首页
            </a>
            <a href="/hot" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              热门
            </a>
            <a href="/admin/login" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              管理
            </a>
          </nav>

          {/* 移动端菜单按钮 */}
          <div class="md:hidden">
            <button
              type="button"
              onclick="toggleMobileMenu()"
              class="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 分类导航 */}
        {categories.length > 0 && (
          <div class="border-t border-gray-200 py-3">
            <div class="flex items-center space-x-6 overflow-x-auto">
              <a
                href="/"
                class={`whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  !currentCategory 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                全部
              </a>
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`/?category=${category.slug}`}
                  class={`whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    currentCategory === category.slug
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                  }`}
                >
                  {category.name}
                  <span class="ml-1 text-xs text-gray-500">({category.count})</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 移动端菜单 */}
      <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-gray-200">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <a href="/" class="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md text-base font-medium">
            首页
          </a>
          <a href="/hot" class="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md text-base font-medium">
            热门
          </a>
          <a href="/admin/login" class="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md text-base font-medium">
            管理
          </a>
        </div>
      </div>

      <script>{`
        function toggleMobileMenu() {
          const menu = document.getElementById('mobile-menu');
          menu.classList.toggle('hidden');
        }
      `}</script>
    </header>
  );
};
