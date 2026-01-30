import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

// Create axios instance
const api = axios.create({
  baseURL: API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  getCurrentUser: () => api.get('/admin/auth/me'),
};

export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard/stats'),
};

export const analyticsAPI = {
  // Get insights and analytics data
  getInsights: (params) => api.get('/admin/analytics/insights', { params }),
};

export const newsAPI = {
  // List news with filters and pagination
  list: (params) => api.get('/admin/news', { params }),

  // Get single news item
  get: (id) => api.get(`/admin/news/${id}`),

  // Create new news
  create: (data) => api.post('/admin/news', data),

  // Update news
  update: (id, data) => api.put(`/admin/news/${id}`, data),

  // Delete news
  delete: (id) => api.delete(`/admin/news/${id}`),
};

export const tweetsAPI = {
  // List tweets with filters
  list: (params) => api.get('/admin/tweets', { params }),

  // Get single tweet
  get: (id) => api.get(`/admin/tweets/${id}`),

  // Generate tweets from article
  generate: (articleId, options) => api.post('/admin/tweets/generate', {
    articleId,
    ...options
  }),

  // Update tweet
  update: (id, data) => api.put(`/admin/tweets/${id}`, data),

  // Delete tweet
  delete: (id) => api.delete(`/admin/tweets/${id}`),

  // Approve tweet for publishing
  approve: (id) => api.post(`/admin/tweets/${id}/approve`),

  // Publish tweet immediately
  publish: (id) => api.post(`/admin/tweets/${id}/publish`),
};

export const articlesAPI = {
  // List articles with filters and pagination
  list: (params) => api.get('/admin/articles', { params }),

  // Get single article
  get: (id) => api.get(`/admin/articles/${id}`),

  // Create new article
  create: (data) => api.post('/admin/articles', data),

  // Update article
  update: (id, data) => api.put(`/admin/articles/${id}`, data),

  // Delete article
  delete: (id) => api.delete(`/admin/articles/${id}`),

  // Get image upload URL
  getImageUploadUrl: (filename, contentType) =>
    api.post('/admin/articles/image-upload-url', { filename, contentType }),
};

export const sectionsAPI = {
  list: () => api.get('/admin/sections'),
  create: (data) => api.post('/admin/sections', data),
  update: (id, data) => api.put(`/admin/sections/${id}`, data),
  delete: (id) => api.delete(`/admin/sections/${id}`),
};

export const tagsAPI = {
  list: () => api.get('/admin/tags'),
  create: (data) => api.post('/admin/tags', data),
  update: (id, data) => api.put(`/admin/tags/${id}`, data),
  delete: (id) => api.delete(`/admin/tags/${id}`),
};

export const usersAPI = {
  list: (params) => api.get('/admin/users', { params }),
  get: (id) => api.get(`/admin/users/${id}`),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
};

export default api;

