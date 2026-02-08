import axios from 'axios';

// --- Configuration ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://<your-api-id>.execute-api.<your-region>.amazonaws.com';
const SEARCH_API_URL = process.env.NEXT_PUBLIC_SEARCH_API_URL || 'https://<your-api-id>.execute-api.<your-region>.amazonaws.com';

// --- Axios Clients ---
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const searchApiClient = axios.create({
  baseURL: SEARCH_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Types ---
export interface Article {
  s7b_article_id: number;
  s7b_article_title: string;
  s7b_article_brief: string;
  s7b_article_body: string;
  s7b_article_image: string;
  s7b_article_add_date: string;
  s7b_user_id: number;
  s7b_user_name?: string;
  s7b_user_brief?: string;
  s7b_user_image?: string;
  s7b_user_twitter?: string;
  s7b_user_facebook?: string;
  s7b_user_linkedin?: string;
  reading_time?: number;
  premium?: boolean;
  snippet?: string;
  sections?: Section[];
  tags?: Tag[];
  comments?: Comment[];
}

export interface News {
  s7b_news_id: number;
  s7b_news_title: string;
  s7b_news_brief: string;
  s7b_news_body: string;
  s7b_news_image: string;
  s7b_news_add_date: string;
}

export interface Section {
  s7b_section_id: number;
  s7b_section_name: string;
  s7b_section_brief?: string;
  s7b_section_description?: string;
  s7b_section_order?: number;
  article_count?: number;
}

export interface Tag {
  s7b_tags_id: number;
  s7b_tags_name: string;
}

export interface Comment {
  s7b_comment_id: number;
  s7b_comment_user_name: string;
  s7b_comment_body: string;
  s7b_comment_add_date: string;
}

export interface User {
  s7b_user_id: number;
  s7b_user_name: string;
  s7b_user_email?: string;
}

export interface Writer {
  id: number;
  username: string;
  displayName: string;
  bio: string;
  articlesCount: number;
  avatarUrl: string | null;
  socialMedia: {
    twitter: string | null;
    linkedin: string | null;
    facebook: string | null;
  };
}

// --- Helper Functions ---
function mapArticle(apiArticle: any): Article {
  // Handle search API format - detected by having 'snippet' field or simple author/section structure
  const isSearchResult = apiArticle.snippet !== undefined ||
    (apiArticle.author && typeof apiArticle.author === 'object' && 'name' in apiArticle.author && !apiArticle.mainImage);

  if (isSearchResult) {
    // Search API format: {id, title, brief, snippet, created_at, tags, author, section}
    return {
      s7b_article_id: parseInt(apiArticle.id) || 0,
      s7b_article_title: apiArticle.title || '',
      s7b_article_brief: apiArticle.brief || '',
      s7b_article_body: '',
      s7b_article_image: apiArticle.image || '', // Search API now returns image
      s7b_article_add_date: apiArticle.created_at || '',
      s7b_user_id: apiArticle.author?.id || 0,
      s7b_user_name: apiArticle.author?.name || '', // Search API now returns author
      premium: false,
      snippet: apiArticle.snippet || '', // New: snippet with search term context
      sections: apiArticle.section ? [{
        s7b_section_id: apiArticle.section.id || 0,
        s7b_section_name: apiArticle.section.name || 'عام',
      }] : (apiArticle.tags && apiArticle.tags.length > 0 ? [{
        s7b_section_id: 0,
        s7b_section_name: apiArticle.tags[0] || 'عام',
      }] : []),
      tags: (apiArticle.tags || []).map((tagName: string, index: number) => ({
        s7b_tags_id: index,
        s7b_tags_name: tagName,
      })),
      comments: [],
    };
  }

  // Regular API format
  // Handle body/content - could be string, array of sections, or div1-div5 fields
  let articleBody = '';

  // Check for div1-div5 fields (new DB structure)
  const hasDivFields = apiArticle.div1Title || apiArticle.div1Body ||
    apiArticle.s7b_article_div1 || apiArticle.s7b_article_div1_body;

  if (hasDivFields) {
    // Construct body from div1-div5
    for (let i = 1; i <= 5; i++) {
      const title = apiArticle[`div${i}Title`] || apiArticle[`s7b_article_div${i}`];
      const body = apiArticle[`div${i}Body`] || apiArticle[`s7b_article_div${i}_body`];

      if (title || body) {
        if (title) articleBody += `<h2 id="section-${i}">${title}</h2>\n`;
        if (body) articleBody += `${body}\n\n`;
      }
    }
  } else if (Array.isArray(apiArticle.body)) {
    const sections = apiArticle.body.map((section: any) => {
      if (typeof section === 'string') return section;
      return `## ${section.title || ''}\n${section.content || ''}`;
    });
    articleBody = sections.join('\n');
  } else if (Array.isArray(apiArticle.content)) {
    const sections = apiArticle.content.map((section: any) => {
      if (typeof section === 'string') return section;
      return `## ${section.title || ''}\n${section.content || ''}`;
    });
    articleBody = sections.join('\n');
  } else {
    articleBody = apiArticle.body || apiArticle.content || '';
  }

  // Map tags
  const tags = (apiArticle.tags || []).map((tag: any) => ({
    s7b_tags_id: tag.id,
    s7b_tags_name: tag.name,
  }));

  // Map comments
  const comments = (apiArticle.comments || []).map((comment: any) => ({
    s7b_comment_id: comment.id,
    s7b_comment_user_name: comment.userName || comment.user_name || 'Anonymous',
    s7b_comment_body: comment.body || comment.content || '',
    s7b_comment_add_date: comment.createdAt || comment.created_at || '',
  }));

  // Map sections
  let sections: Section[] = [];
  if (apiArticle.section) {
    // Single section object
    sections = [{
      s7b_section_id: apiArticle.section.id || 0,
      s7b_section_name: apiArticle.section.name || '',
    }];
  } else if (apiArticle.sectionName) {
    // Legacy format
    sections = [{
      s7b_section_id: apiArticle.sectionId || 0,
      s7b_section_name: apiArticle.sectionName || '',
    }];
  }

  return {
    s7b_article_id: apiArticle.id,
    s7b_article_title: apiArticle.title,
    s7b_article_brief: apiArticle.excerpt || apiArticle.description || '',
    s7b_article_body: articleBody,
    s7b_article_image: apiArticle.mainImage || apiArticle.image || '',
    s7b_article_add_date: apiArticle.createdAt || apiArticle.created_at || '',
    s7b_user_id: apiArticle.author?.id || apiArticle.userId || apiArticle.user_id || 0,
    s7b_user_name: apiArticle.author?.name || apiArticle.userName || apiArticle.user_name || apiArticle.authorName || apiArticle.author_name || '',
    s7b_user_brief: apiArticle.authorBrief || apiArticle.author_brief || '',
    s7b_user_image: apiArticle.authorImage || apiArticle.author_image || '',
    s7b_user_twitter: apiArticle.authorTwitter || apiArticle.author_twitter || '',
    s7b_user_facebook: apiArticle.authorFacebook || apiArticle.author_facebook || '',
    s7b_user_linkedin: apiArticle.authorLinkedin || apiArticle.author_linkedin || '',
    reading_time: apiArticle.readingTime || apiArticle.reading_time || 0,
    premium: apiArticle.premium || false,
    sections,
    tags,
    comments,
  };
}

function mapNews(apiNews: any): News {
  return {
    s7b_news_id: apiNews.id || apiNews.s7b_news_id,
    s7b_news_title: apiNews.title || apiNews.s7b_news_title,
    s7b_news_brief: apiNews.brief || apiNews.excerpt || apiNews.s7b_news_brief || '',
    s7b_news_body: apiNews.body || apiNews.content || apiNews.s7b_news_body || '',
    s7b_news_image: apiNews.image || apiNews.mainImage || apiNews.s7b_news_image || '',
    s7b_news_add_date: apiNews.createdAt || apiNews.created_at || apiNews.s7b_news_add_date || '',
  };
}

function mapSection(apiSection: any): Section {
  // Try multiple possible field names for article count
  const articleCount = apiSection.articlesCount       // Primary field from API
    || apiSection.articleCount
    || apiSection.article_count
    || apiSection.articles_count
    || apiSection.count
    || apiSection.total
    || apiSection.totalArticles
    || apiSection.total_articles
    || 0;

  // Map order field
  const order = apiSection.displayOrder               // Primary field from API
    || apiSection.s7b_section_order
    || apiSection.order
    || 0;

  // Map name field (title or name)
  const name = apiSection.title                       // Primary field from API
    || apiSection.name
    || apiSection.s7b_section_name
    || '';

  return {
    s7b_section_id: apiSection.id,
    s7b_section_name: name,
    s7b_section_brief: apiSection.description || apiSection.brief || '',
    s7b_section_description: apiSection.description || apiSection.s7b_section_description || apiSection.brief || '',
    s7b_section_order: order,
    article_count: articleCount,
  };
}

function mapWriter(apiWriter: any): Writer {
  return {
    id: apiWriter.id,
    username: apiWriter.username,
    displayName: apiWriter.displayName,
    bio: apiWriter.bio || '',
    articlesCount: apiWriter.articlesCount || 0,
    avatarUrl: apiWriter.avatarUrl || null,
    socialMedia: {
      twitter: apiWriter.socialMedia?.twitter || null,
      linkedin: apiWriter.socialMedia?.linkedin || null,
      facebook: apiWriter.socialMedia?.facebook || null,
    },
  };
}

// --- API Functions ---

// Share stats type
export interface ShareStats {
  twitter: number;
  linkedin: number;
  whatsapp: number;
  copy: number;
  total: number;
}

export type SharePlatform = 'twitter' | 'linkedin' | 'whatsapp' | 'copy';

// Articles API (uses main client)
export const articlesApi = {
  getAll: async (limit = 10, offset = 0) => {
    const response = await apiClient.get(`/articles?limit=${limit}&offset=${offset}`);
    const apiData = response.data.data || response.data;
    const articles = (apiData.articles || []).map(mapArticle);
    return {
      articles,
      pagination: apiData.pagination || {},
    };
  },
  getById: async (id: string | number) => {
    const response = await apiClient.get(`/articles/${id}`);
    const apiData = response.data.data || response.data;
    const article = mapArticle(apiData.article || apiData);
    // Include share stats from response
    const shareStats = apiData.article?.shareStats || apiData.shareStats || {
      twitter: 0,
      linkedin: 0,
      whatsapp: 0,
      copy: 0,
      total: 0,
    };
    return { article, shareStats };
  },
  getPremium: async (limit = 4, offset = 0) => {
    const response = await apiClient.get(`/articles?premium=true&status=active&limit=${limit}&offset=${offset}`);
    const apiData = response.data.data || response.data;
    const articles = (apiData.articles || []).map(mapArticle);
    return {
      articles,
      pagination: apiData.pagination || {},
    };
  },
  trackShare: async (id: string | number, platform: SharePlatform): Promise<{ stats: ShareStats }> => {
    try {
      const response = await apiClient.post(`/articles/${id}/share`, { platform });
      const apiData = response.data.data || response.data;
      return { stats: apiData.stats || { twitter: 0, linkedin: 0, whatsapp: 0, copy: 0, total: 0 } };
    } catch (error) {
      console.error('Failed to track share:', error);
      // Return empty stats on error, don't break the share action
      return { stats: { twitter: 0, linkedin: 0, whatsapp: 0, copy: 0, total: 0 } };
    }
  },
};

// Sections API (uses main client)
export const sectionsApi = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/sections');
      const apiData = response.data.data || response.data;
      const sections = (apiData.sections || []).map(mapSection);
      return { sections };
    } catch (error) {
      // Fallback: Extract unique sections from articles
      console.warn('Sections API failed, falling back to extracting from articles:', error);
      try {
        const articlesResponse = await apiClient.get('/articles?limit=100');
        const articlesData = articlesResponse.data.data || articlesResponse.data;
        const articles = articlesData.articles || [];

        // Extract unique sections from articles
        const sectionsMap = new Map<number, any>();
        articles.forEach((article: any) => {
          if (article.sectionId && article.sectionName && !sectionsMap.has(article.sectionId)) {
            sectionsMap.set(article.sectionId, {
              s7b_section_id: article.sectionId,
              s7b_section_name: article.sectionName,
              s7b_section_brief: '',
              s7b_section_description: '',
              s7b_section_order: article.sectionId,
              article_count: 0
            });
          }
        });

        // Count articles per section
        articles.forEach((article: any) => {
          if (article.sectionId && sectionsMap.has(article.sectionId)) {
            const section = sectionsMap.get(article.sectionId);
            section.article_count++;
          }
        });

        const sections = Array.from(sectionsMap.values());
        return { sections };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return { sections: [] };
      }
    }
  },
  getById: async (id: string | number) => {
    try {
      const response = await apiClient.get(`/sections/${id}`);
      const apiData = response.data.data || response.data;
      const section = mapSection(apiData.section || apiData);
      return { section };
    } catch (error) {
      // Fallback: Get section from the sections list
      console.warn(`Section ${id} API failed, using fallback from sections list`);
      try {
        const { sections } = await sectionsApi.getAll();
        const section = sections.find((s: Section) => s.s7b_section_id === parseInt(String(id), 10));
        if (section) {
          return { section };
        }
        throw new Error(`Section ${id} not found`);
      } catch (fallbackError) {
        console.error('Fallback for section getById failed:', fallbackError);
        throw error; // Re-throw original error
      }
    }
  },
  getArticles: async (id: string | number, limit = 10, offset = 0) => {
    try {
      const response = await apiClient.get(`/sections/${id}/articles?limit=${limit}&offset=${offset}`);
      const apiData = response.data.data || response.data;
      const articles = (apiData.articles || []).map(mapArticle);
      return {
        articles,
        pagination: apiData.pagination || {},
      };
    } catch (error) {
      // Fallback: Get all articles and filter by sectionId
      console.warn(`Section ${id} articles API failed, using fallback from all articles`);
      try {
        // Fetch articles from the API (returns raw API data with sectionId)
        const response = await apiClient.get('/articles?limit=100');
        const apiData = response.data.data || response.data;
        const allArticles = apiData.articles || [];

        // Filter by sectionId (raw API data)
        const sectionIdNum = parseInt(String(id), 10);
        const filteredRawArticles = allArticles.filter((article: any) =>
          article.sectionId === sectionIdNum
        );

        // Map to Article type
        const filteredArticles = filteredRawArticles.map(mapArticle);

        return {
          articles: filteredArticles,
          pagination: {
            offset: 0,
            limit: filteredArticles.length,
            total: filteredArticles.length,
            hasMore: false
          },
        };
      } catch (fallbackError) {
        console.error('Fallback for section articles failed:', fallbackError);
        return {
          articles: [],
          pagination: { offset: 0, limit: 0, total: 0, hasMore: false },
        };
      }
    }
  },
};

// Tags API (uses main client)
export const tagsApi = {
  getAll: async () => {
    const response = await apiClient.get('/tags');
    const apiData = response.data.data || response.data;
    return { tags: apiData.tags || [] };
  },
  getById: async (id: string | number) => {
    const response = await apiClient.get(`/tags/${id}`);
    const apiData = response.data.data || response.data;
    return { tag: apiData.tag || apiData };
  },
  getArticles: async (id: string | number, limit = 10, offset = 0) => {
    const response = await apiClient.get(`/tags/${id}/articles?limit=${limit}&offset=${offset}`);
    const apiData = response.data.data || response.data;
    const articles = (apiData.articles || []).map(mapArticle);
    return {
      articles,
      pagination: apiData.pagination || {},
    };
  },
};

// Users API (uses main client)
export const usersApi = {
  getById: async (id: string | number) => {
    const response = await apiClient.get(`/users/${id}`);
    const apiData = response.data.data || response.data;
    return { user: apiData.user || apiData };
  },
  getArticles: async (id: string | number, limit = 10, offset = 0) => {
    const response = await apiClient.get(`/users/${id}/articles?limit=${limit}&offset=${offset}`);
    const apiData = response.data.data || response.data;
    const articles = (apiData.articles || []).map(mapArticle);
    return {
      articles,
      pagination: apiData.pagination || {},
    };
  },
};

// Writers API (uses dedicated Lambda endpoint)
export const writersApi = {
  getTopWriters: async () => {
    try {
      console.log('Fetching top writers...');

      // Use the dedicated GetTopWriters Lambda endpoint
      const WRITERS_API_URL = 'https://<your-api-id>.execute-api.<your-region>.amazonaws.com/default/s7abt-GetTopWriters';

      const response = await axios.get(WRITERS_API_URL);
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch top writers');
      }

      // Map the writers from the API format
      const writers = (data.data?.writers || []).map(mapWriter);

      console.log(`Top writers API returned ${writers.length} writers`);

      return {
        writers,
        count: data.data?.count || writers.length,
        timestamp: data.data?.timestamp || new Date().toISOString(),
      };

    } catch (error) {
      console.error('Top writers API error:', error);
      // Return empty result on error instead of throwing
      return {
        writers: [],
        count: 0,
        timestamp: new Date().toISOString(),
      };
    }
  },
};

// Search API (uses dedicated search client)
export const searchApi = {
  query: async (searchTerm: string, limit = 20, offset = 0, scope = 'all') => {
    try {
      const response = await searchApiClient.get(`/`, {
        params: {
          q: searchTerm,
          limit,
          offset,
          scope,
        },
      });

      const apiData = response.data.data || response.data;

      // Map articles from the response
      const articles = (apiData.articles || apiData.items || []).map(mapArticle);

      return {
        articles,
        total: apiData.total || articles.length,
        pagination: {
          total: apiData.total || articles.length,
          hasMore: (offset + articles.length) < (apiData.total || 0)
        },
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  },

  // Search articles by tags using the dedicated Tags API
  byTags: async (tags: string[], limit = 20, offset = 0) => {
    try {
      console.log('Fetching articles by tags using Tags API:', tags);

      // Use the GetArticlesByTags endpoint (separate from NEXT_PUBLIC_TAGS_API_URL which is for tag ID lookups)
      const TAGS_API_URL = `${API_BASE_URL}/GetArticlesByTags`;
      const tagsParam = tags.join(',');
      const url = `${TAGS_API_URL}?tags=${encodeURIComponent(tagsParam)}&limit=${limit}&offset=${offset}`;

      const response = await axios.get(url);
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch articles by tags');
      }

      // Map the articles from the new API format to the expected format
      const articles = (data.data?.articles || []).map((article: any) => {
        // Map the new API format with body sections to old format
        let articleBody = '';
        if (Array.isArray(article.body)) {
          articleBody = article.body.map((section: any) =>
            `## ${section.title || ''}\n${section.body || ''}`
          ).join('\n\n');
        }

        return {
          s7b_article_id: article.id,
          s7b_article_title: article.title,
          s7b_article_brief: article.description || article.brief || '',
          s7b_article_body: articleBody,
          s7b_article_image: article.image || '',
          s7b_article_add_date: article.addDate || article.createdAt || '',
          s7b_user_id: article.userId || 0,
          s7b_user_name: article.author || article.userName || '',
          premium: article.premium || false,
          sections: article.section ? [{
            s7b_section_id: article.section.id || article.sectionId || 0,
            s7b_section_name: article.section.title || article.sectionTitle || '',
          }] : [],
          tags: (article.tags || []).map((tag: any, index: number) => ({
            s7b_tags_id: tag.id || index,
            s7b_tags_name: tag.name,
          })),
          comments: [],
        };
      });

      const pagination = data.data?.pagination || {};

      console.log(`Tags API returned ${articles.length} articles (Total: ${pagination.total || 0})`);

      return {
        articles,
        total: pagination.total || articles.length,
        pagination: {
          total: pagination.total || articles.length,
          hasMore: pagination.hasMore || false,
          offset: pagination.offset || offset,
          limit: pagination.limit || limit,
        },
      };

    } catch (error) {
      console.error('Tags API error:', error);
      // Return empty result on error instead of throwing
      return {
        articles: [],
        total: 0,
        pagination: { total: 0, hasMore: false, offset: 0, limit },
      };
    }
  },
};

// News API (uses main client)
export const newsApi = {
  getAll: async (limit = 10, offset = 0) => {
    try {
      const response = await apiClient.get(`/news?limit=${limit}&offset=${offset}`);
      const apiData = response.data.data || response.data;
      const news = (apiData.news || []).map(mapNews);
      return {
        news,
        pagination: apiData.pagination || {
          total: news.length,
          offset,
          limit,
          hasMore: false,
        },
      };
    } catch (error) {
      console.error('News API error:', error);
      // Return empty result instead of throwing
      return {
        news: [],
        pagination: {
          total: 0,
          offset: 0,
          limit,
          hasMore: false,
        },
      };
    }
  },
  getById: async (id: string | number) => {
    try {
      const response = await apiClient.get(`/news/${id}`);
      const apiData = response.data.data || response.data;
      const news = mapNews(apiData.news || apiData);
      return { news };
    } catch (error) {
      console.error(`News ${id} API error:`, error);
      throw error;
    }
  },
};