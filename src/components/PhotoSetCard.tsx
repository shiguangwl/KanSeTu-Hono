import type { FC } from 'hono/jsx';

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

interface PhotoSetCardProps {
  photoSet: PhotoSet;
  lazy?: boolean;
}

export const PhotoSetCard: FC<PhotoSetCardProps> = ({ photoSet, lazy = true }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div class="masonry-item bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">
      {/* 图片容器 */}
      <div class="relative overflow-hidden">
        <a href={`/photoset/${photoSet.slug}`} class="block">
          {lazy ? (
            <img
              data-src={photoSet.cover_image}
              alt={photoSet.title}
              class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300 opacity-0 loading-skeleton"
              style="aspect-ratio: auto;"
              loading="lazy"
            />
          ) : (
            <img
              src={photoSet.cover_image}
              alt={photoSet.title}
              class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
              style="aspect-ratio: auto;"
            />
          )}
        </a>
        
        {/* 悬浮信息 */}
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onclick={`openImageViewer('${photoSet.cover_image}', '${photoSet.title}')`}
            class="bg-white bg-opacity-90 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-opacity-100 transition-all duration-200"
          >
            查看大图
          </button>
        </div>

        {/* 分类标签 */}
        <div class="absolute top-3 left-3">
          <a
            href={`/?category=${photoSet.category_slug}`}
            class="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium hover:bg-opacity-90 transition-all duration-200"
          >
            {photoSet.category}
          </a>
        </div>

        {/* 浏览量 */}
        <div class="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
          </svg>
          <span>{formatViewCount(photoSet.view_count)}</span>
        </div>
      </div>

      {/* 内容区域 */}
      <div class="p-4">
        {/* 标题 */}
        <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
          <a href={`/photoset/${photoSet.slug}`} class="hover:underline">
            {photoSet.title}
          </a>
        </h3>

        {/* 描述 */}
        <p class="text-gray-600 text-sm mb-3 line-clamp-2">
          {photoSet.description}
        </p>

        {/* 标签 */}
        {photoSet.tags && photoSet.tags.length > 0 && (
          <div class="flex flex-wrap gap-1 mb-3">
            {photoSet.tags.slice(0, 3).map((tag, index) => (
              <a
                key={index}
                href={`/?tag=${encodeURIComponent(tag)}`}
                class="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs transition-colors duration-200"
              >
                #{tag}
              </a>
            ))}
            {photoSet.tags.length > 3 && (
              <span class="text-gray-500 text-xs px-2 py-1">
                +{photoSet.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 底部信息 */}
        <div class="flex items-center justify-between text-xs text-gray-500">
          <time dateTime={photoSet.published_at}>
            {formatDate(photoSet.published_at)}
          </time>
          <a
            href={`/photoset/${photoSet.slug}`}
            class="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            查看详情 →
          </a>
        </div>
      </div>
    </div>
  );
};
