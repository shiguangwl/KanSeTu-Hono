import type { FC } from 'hono/jsx';

interface LayoutProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  children: any;
}

export const Layout: FC<LayoutProps> = ({
  title = '看图网站',
  description = '精美图片分享平台，发现美好瞬间',
  keywords = '图片,摄影,分享,美图,看图',
  ogImage = '/images/og-default.jpg',
  canonical,
  children
}) => {
  const fullTitle = title === '看图网站' ? title : `${title} - 看图网站`;

  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{fullTitle}</title>

        {/* SEO Meta Tags */}
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content="看图网站" />
        {canonical && <link rel="canonical" href={canonical} />}

        {/* Open Graph */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="看图网站" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />

        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>

        {/* Custom Styles */}
        <style>{`
          .masonry {
            column-count: 1;
            column-gap: 1rem;
          }

          @media (min-width: 640px) {
            .masonry { column-count: 2; }
          }

          @media (min-width: 768px) {
            .masonry { column-count: 3; }
          }

          @media (min-width: 1024px) {
            .masonry { column-count: 4; }
          }

          @media (min-width: 1280px) {
            .masonry { column-count: 5; }
          }

          .masonry-item {
            break-inside: avoid;
            margin-bottom: 1rem;
          }

          .image-viewer {
            backdrop-filter: blur(10px);
          }

          .fade-in {
            animation: fadeIn 0.3s ease-in-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </head>
      <body class="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
};