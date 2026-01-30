import axios from 'axios';

// --- Configuration ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://<your-api-id>.execute-api.me-central-1.amazonaws.com';
const SEARCH_API_URL = process.env.NEXT_PUBLIC_SEARCH_API_URL || 'https://<your-api-id>.execute-api.me-central-1.amazonaws.com';

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
  premium?: boolean;
  sections?: Section[];
  tags?: Tag[];
  comments?: Comment[];
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

// --- Helper Functions ---
function mapArticle(apiArticle: any): Article {
  // Handle search API format (minimal fields)
  const isSearchResult = !apiArticle.mainImage && !apiArticle.image && !apiArticle.author && !apiArticle.section;
  
  if (isSearchResult) {
    // Search API format: {id, title, brief, created_at, tags}
    return {
      s7b_article_id: parseInt(apiArticle.id) || 0,
      s7b_article_title: apiArticle.title || '',
      s7b_article_brief: apiArticle.brief || '',
      s7b_article_body: '',
      s7b_article_image: '', // Search API doesn't return images
      s7b_article_add_date: apiArticle.created_at || '',
      s7b_user_id: 0,
      s7b_user_name: '', // Search API doesn't return author
      premium: false,
      sections: apiArticle.tags && apiArticle.tags.length > 0 ? [{
        s7b_section_id: 0,
        s7b_section_name: apiArticle.tags[0] || 'عام',
      }] : [],
      tags: (apiArticle.tags || []).map((tagName: string, index: number) => ({
        s7b_tags_id: index,
        s7b_tags_name: tagName,
      })),
      comments: [],
    };
  }
  
  // Regular API format
  // Handle body/content - could be string or array of sections
  let articleBody = '';
  if (Array.isArray(apiArticle.body)) {
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
    premium: apiArticle.premium || false,
    sections,
    tags,
    comments,
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

// --- API Functions ---

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
    return { article };
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
};

// Sections API (uses main client)
export const sectionsApi = {
  getAll: async () => {
    const response = await apiClient.get('/sections');
    const apiData = response.data.data || response.data;
    const sections = (apiData.sections || []).map(mapSection);
    return { sections };
  },
  getById: async (id: string | number) => {
    const response = await apiClient.get(`/sections/${id}`);
    const apiData = response.data.data || response.data;
    const section = mapSection(apiData.section || apiData);
    return { section };
  },
  getArticles: async (id: string | number, limit = 10, offset = 0) => {
    const response = await apiClient.get(`/sections/${id}/articles?limit=${limit}&offset=${offset}`);
    const apiData = response.data.data || response.data;
    const articles = (apiData.articles || []).map(mapArticle);
    return {
      articles,
      pagination: apiData.pagination || {},
    };
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
  
  // Search articles by tags using the new dedicated Tags API
  byTags: async (tags: string[], limit = 20, offset = 0) => {
    try {
      console.log('Fetching articles by tags using Tags API:', tags);
      
      // Use the new dedicated Tags API endpoint
      const TAGS_API_URL = 'https://<your-api-id>.execute-api.me-central-1.amazonaws.com/default/GetArticlesByTags';
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

