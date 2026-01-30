import { Metadata } from 'next';

interface Article {
  id: number;
  title: string;
  excerpt?: string;
  description?: string;
  mainImage?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: number;
    name: string;
  };
  section?: {
    id: number;
    name: string;
  };
  tags?: Array<{
    id: number;
    name: string;
  }>;
}

/**
 * Generate JSON-LD structured data for article
 */
export function generateArticleStructuredData(
  article: Article,
  locale: string,
  baseUrl: string = 'https://s7abt.com'
) {
  const articleUrl = `${baseUrl}/${locale}/articles/${article.id}`;
  const image = article.mainImage || article.image;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || article.description || '',
    image: image ? (image.startsWith('http') ? image : `${baseUrl}/${image}`) : undefined,
    datePublished: article.createdAt,
    dateModified: article.updatedAt || article.createdAt,
    author: {
      '@type': 'Person',
      name: article.user?.name || 'S7abt Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'S7abt',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    articleSection: article.section?.name,
    keywords: article.tags?.map((tag) => tag.name).join(', '),
  };
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(
  items: Array<{ label: string; href?: string }>,
  baseUrl: string = 'https://s7abt.com'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `${baseUrl}${item.href}` : undefined,
    })),
  };
}

/**
 * Generate Next.js metadata for article page
 */
export function generateArticleMetadata(
  article: Article,
  locale: string,
  baseUrl: string = 'https://s7abt.com'
): Metadata {
  const articleUrl = `${baseUrl}/${locale}/articles/${article.id}`;
  const image = article.mainImage || article.image;
  const description = article.excerpt || article.description || '';

  return {
    title: article.title,
    description: description,
    keywords: article.tags?.map((tag) => tag.name).join(', '),
    authors: article.user ? [{ name: article.user.name }] : undefined,
    openGraph: {
      title: article.title,
      description: description,
      url: articleUrl,
      siteName: 'S7abt',
      images: image
        ? [
            {
              url: image.startsWith('http') ? image : `${baseUrl}/${image}`,
              width: 1200,
              height: 630,
              alt: article.title,
            },
          ]
        : undefined,
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      type: 'article',
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt || article.createdAt,
      section: article.section?.name,
      tags: article.tags?.map((tag) => tag.name),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: description,
      images: image ? [image.startsWith('http') ? image : `${baseUrl}/${image}`] : undefined,
    },
    alternates: {
      canonical: articleUrl,
      languages: {
        ar: `${baseUrl}/ar/articles/${article.id}`,
        en: `${baseUrl}/en/articles/${article.id}`,
      },
    },
  };
}

/**
 * Generate meta tags for article page (for use in Head component)
 */
export function generateArticleMetaTags(
  article: Article,
  locale: string,
  baseUrl: string = 'https://s7abt.com'
) {
  const articleUrl = `${baseUrl}/${locale}/articles/${article.id}`;
  const image = article.mainImage || article.image;
  const description = article.excerpt || article.description || '';

  return [
    // Basic meta tags
    { name: 'description', content: description },
    { name: 'keywords', content: article.tags?.map((tag) => tag.name).join(', ') || '' },
    { name: 'author', content: article.user?.name || 'S7abt Team' },

    // Open Graph
    { property: 'og:title', content: article.title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: articleUrl },
    { property: 'og:type', content: 'article' },
    { property: 'og:image', content: image || `${baseUrl}/default-og-image.jpg` },
    { property: 'og:locale', content: locale === 'ar' ? 'ar_SA' : 'en_US' },
    { property: 'og:site_name', content: 'S7abt' },
    { property: 'article:published_time', content: article.createdAt || '' },
    { property: 'article:modified_time', content: article.updatedAt || article.createdAt || '' },
    { property: 'article:section', content: article.section?.name || '' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: article.title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image || `${baseUrl}/default-og-image.jpg` },

    // Canonical
    { rel: 'canonical', href: articleUrl },
  ];
}
