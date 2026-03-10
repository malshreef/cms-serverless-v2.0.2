/**
 * Utility functions for handling S3 images
 */

const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || 'https://<your-s3-bucket>.s3.<your-region>.amazonaws.com';

/**
 * Build full S3 URL from image key
 * @param {string} imageKey - S3 key or full URL
 * @returns {string|null} - Full image URL or null
 */
export const buildImageUrl = (imageKey) => {
  if (!imageKey) return null;
  
  // If already a full URL, return as is
  if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
    return imageKey;
  }
  
  // Build S3 URL from key
  return `${S3_BASE_URL}/${imageKey}`;
};

/**
 * Extract S3 key from full URL
 * @param {string} url - Full S3 URL
 * @returns {string} - S3 key
 */
export const extractS3Key = (url) => {
  if (!url) return '';
  
  // If it's already a key (no http), return as is
  if (!url.startsWith('http')) return url;
  
  // Extract key from URL
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch (e) {
    return url;
  }
};

/**
 * Get image thumbnail URL (if thumbnails are generated)
 * @param {string} imageKey - Original image S3 key
 * @returns {string|null} - Thumbnail URL
 */
export const getThumbnailUrl = (imageKey) => {
  if (!imageKey) return null;
  
  const key = extractS3Key(imageKey);
  const parts = key.split('/');
  const fileName = parts[parts.length - 1];
  const folder = parts.slice(0, -1).join('/');
  
  // Thumbnail naming convention: folder/thumbnails/filename
  const thumbnailKey = `${folder}/thumbnails/${fileName}`;
  return buildImageUrl(thumbnailKey);
};

/**
 * Validate image file
 * @param {File} file - File object
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateImageFile = (file, maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    return { valid: false, error: 'لم يتم اختيار ملف' };
  }
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'يجب اختيار ملف صورة فقط' };
  }
  
  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return { valid: false, error: `حجم الملف يجب أن يكون أقل من ${maxSizeMB} ميجابايت` };
  }
  
  return { valid: true, error: null };
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default {
  buildImageUrl,
  extractS3Key,
  getThumbnailUrl,
  validateImageFile,
  formatFileSize
};

