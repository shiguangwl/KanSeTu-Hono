import slugify from 'slugify';

// 生成URL友好的slug
export const generateSlug = (text: string): string => {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
};

// 解析标签字符串为数组
export const parseTags = (tags?: string): string[] => {
  if (!tags) return [];
  return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
};

// 将标签数组转换为字符串
export const stringifyTags = (tags: string[]): string => {
  return tags.join(',');
};

// 解析图片URL JSON字符串
export const parseImageUrls = (imageUrls: string): string[] => {
  try {
    return JSON.parse(imageUrls);
  } catch {
    return [];
  }
};

// 将图片URL数组转换为JSON字符串
export const stringifyImageUrls = (imageUrls: string[]): string => {
  return JSON.stringify(imageUrls);
};

// 分页计算
export const calculatePagination = (page: number = 1, limit: number = 20) => {
  const offset = (page - 1) * limit;
  return { offset, limit };
};

// 格式化日期
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 格式化相对时间
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}分钟前`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}小时前`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}天前`;
  } else {
    return formatDate(dateString);
  }
};

// 验证邮箱格式
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 验证URL格式
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// 截取文本
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 生成随机字符串
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 清理HTML标签
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

// 转义HTML特殊字符
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// 生成SEO友好的meta描述
export const generateMetaDescription = (text: string, maxLength: number = 160): string => {
  const cleaned = stripHtml(text).replace(/\s+/g, ' ').trim();
  return truncateText(cleaned, maxLength);
};
