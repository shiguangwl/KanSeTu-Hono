import type { FC } from 'hono/jsx';
import { Header } from '../components/Header.js';
import { PhotoSetCard } from '../components/PhotoSetCard.js';
import { Pagination } from '../components/Pagination.js';

interface PhotoSet {
  id: number;
  title: string;
  description: string;
  category: string;
  category_slug: string;
  tags: string[];
  cover_image: string;
  view_count: number;
  published_at: string;
  slug: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface HomePageProps {
  photoSets: PhotoSet[];
  categories: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  currentCategory?: string;
  searchQuery?: string;
  currentTag?: string;
}

export const HomePage: FC<HomePageProps> = ({ 
  photoSets, 
  categories, 
  pagination,
  currentCategory,
  searchQuery,
  currentTag
}) => {
  const buildQueryParams = () => {
    const params: Record<string, string> = {};
    if (currentCategory) params.category = currentCategory;
    if (searchQuery) params.search = searchQuery;
    if (currentTag) params.tag = currentTag;
    return params;
  };

  const getPageTitle = () => {
    if (searchQuery) return `搜索: ${searchQuery}`;
    if (currentCategory) {
      const category = categories.find(c => c.slug === currentCategory);
      return category ? `${category.name} 分类` : '分类';
    }
    if (currentTag) return `标签: ${currentTag}`;
    return '看图网站';
  };

  const getPageDescription = () => {
    if (searchQuery) return `搜索 "${searchQuery}" 的相关图片`;
    if (currentCategory) {
      const category = categories.find(c => c.slug === currentCategory);
      return category ? `浏览 ${category.name} 分类下的精美图片` : '浏览分类图片';
    }
    if (currentTag) return `浏览标签 "${currentTag}" 下的相关图片`;
    return '精美图片分享平台，发现美好瞬间';
  };

  return (
    <>
      <Header 
        currentCategory={currentCategory}
        searchQuery={searchQuery}
        categories={categories}
      />
      
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和统计 */}
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            {getPageTitle()}
          </h1>
          <p class="text-gray-600 mb-4">
            {getPageDescription()}
          </p>
          
          {/* 结果统计 */}
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">
              共找到 <span class="font-medium text-gray-900">{pagination.total}</span> 个套图
              {pagination.pages > 1 && (
                <>
                  ，第 <span class="font-medium text-gray-900">{pagination.page}</span> 页
                  / 共 <span class="font-medium text-gray-900">{pagination.pages}</span> 页
                </>
              )}
            </div>
            
            {/* 排序选择 */}
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-500">排序:</span>
              <select 
                onchange="handleSortChange(this.value)"
                class="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="published_at_desc">最新发布</option>
                <option value="published_at_asc">最早发布</option>
                <option value="view_count_desc">最多浏览</option>
                <option value="view_count_asc">最少浏览</option>
              </select>
            </div>
          </div>
        </div>

        {/* 当前筛选条件 */}
        {(currentCategory || searchQuery || currentTag) && (
          <div class="mb-6 flex flex-wrap items-center gap-2">
            <span class="text-sm text-gray-500">当前筛选:</span>
            
            {currentCategory && (
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                分类: {categories.find(c => c.slug === currentCategory)?.name || currentCategory}
                <a href="/" class="ml-2 text-blue-600 hover:text-blue-800">×</a>
              </span>
            )}
            
            {searchQuery && (
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                搜索: {searchQuery}
                <a href="/" class="ml-2 text-green-600 hover:text-green-800">×</a>
              </span>
            )}
            
            {currentTag && (
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                标签: {currentTag}
                <a href="/" class="ml-2 text-purple-600 hover:text-purple-800">×</a>
              </span>
            )}
            
            <a href="/" class="text-sm text-gray-500 hover:text-gray-700 underline">
              清除所有筛选
            </a>
          </div>
        )}

        {/* 套图网格 */}
        {photoSets.length > 0 ? (
          <div class="masonry">
            {photoSets.map((photoSet) => (
              <PhotoSetCard key={photoSet.id} photoSet={photoSet} />
            ))}
          </div>
        ) : (
          <div class="text-center py-12">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">暂无图片</h3>
            <p class="text-gray-500 mb-4">
              {searchQuery || currentCategory || currentTag 
                ? '没有找到符合条件的图片，试试其他搜索条件吧' 
                : '还没有上传任何图片'}
            </p>
            <a href="/" class="text-blue-600 hover:text-blue-700 font-medium">
              浏览所有图片 →
            </a>
          </div>
        )}

        {/* 分页 */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          baseUrl="/"
          queryParams={buildQueryParams()}
        />
      </main>

      <script>{`
        function handleSortChange(sort) {
          const url = new URL(window.location);
          if (sort === 'published_at_desc') {
            url.searchParams.delete('sort');
          } else {
            url.searchParams.set('sort', sort);
          }
          window.location.href = url.toString();
        }
      `}</script>
    </>
  );
};
