import { MetadataRoute } from 'next';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://<your-api-id>.execute-api.<your-region>.amazonaws.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://s7abt.com';

// Supported locales
const locales = ['ar', 'en'];

// Helper function to safely parse dates
function safeParseDate(dateString: string | null | undefined): Date {
  if (!dateString) return new Date();

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  } catch (error) {
    return new Date();
  }
}

interface Article {
  s7b_article_id: number;
  s7b_article_add_date: string;
}

interface News {
  s7b_news_id: number;
  s7b_news_add_date: string;
}

interface Section {
  s7b_section_id: number;
}

interface Tag {
  s7b_tags_id: number;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemap: MetadataRoute.Sitemap = [];

  try {
    // --- Static Pages ---
    const staticPages = [
      '', // home
      '/articles',
      '/sections',
      '/news',
      '/tags',
      '/vision2030',
      '/contact',
    ];

    // Add static pages for each locale
    for (const locale of locales) {
      for (const page of staticPages) {
        sitemap.push({
          url: `${SITE_URL}/${locale}${page}`,
          lastModified: new Date(),
          changeFrequency: page === '' ? 'daily' : 'weekly',
          priority: page === '' ? 1 : 0.8,
        });
      }
    }

    // --- Dynamic Articles ---
    try {
      const articlesResponse = await axios.get(`${API_BASE_URL}/articles`, {
        params: { limit: 1000, offset: 0 },
        timeout: 5000,
      });

      const articles: Article[] = articlesResponse.data?.data?.articles || [];

      for (const article of articles) {
        for (const locale of locales) {
          sitemap.push({
            url: `${SITE_URL}/${locale}/articles/${article.s7b_article_id}`,
            lastModified: safeParseDate(article.s7b_article_add_date),
            changeFrequency: 'monthly',
            priority: 0.9,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching articles for sitemap:', error);
    }

    // --- Dynamic News ---
    try {
      const newsResponse = await axios.get(`${API_BASE_URL}/news`, {
        params: { limit: 1000, offset: 0 },
        timeout: 5000,
      });

      const newsItems: News[] = newsResponse.data?.data?.news || [];

      for (const newsItem of newsItems) {
        for (const locale of locales) {
          sitemap.push({
            url: `${SITE_URL}/${locale}/news/${newsItem.s7b_news_id}`,
            lastModified: safeParseDate(newsItem.s7b_news_add_date),
            changeFrequency: 'monthly',
            priority: 0.7,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching news for sitemap:', error);
    }

    // --- Dynamic Sections ---
    try {
      const sectionsResponse = await axios.get(`${API_BASE_URL}/sections`, {
        timeout: 5000,
      });

      const sections: Section[] = sectionsResponse.data?.data?.sections || [];

      for (const section of sections) {
        for (const locale of locales) {
          sitemap.push({
            url: `${SITE_URL}/${locale}/sections/${section.s7b_section_id}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching sections for sitemap:', error);
    }

    // --- Dynamic Tags ---
    try {
      const tagsResponse = await axios.get(`${API_BASE_URL}/tags`, {
        timeout: 5000,
      });

      const tags: Tag[] = tagsResponse.data?.data?.tags || [];

      for (const tag of tags) {
        for (const locale of locales) {
          sitemap.push({
            url: `${SITE_URL}/${locale}/tags/${tag.s7b_tags_id}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching tags for sitemap:', error);
    }

  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return sitemap;
}
