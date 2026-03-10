/**
 * Utility functions for handling image URLs
 * Uses S3 bucket for image storage (same as admin panel)
 */

// S3 bucket URL (same as admin panel)
const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://<your-s3-bucket>.s3.<your-region>.amazonaws.com';

/**
 * Format image URL to use the S3 bucket path
 * @param imagePath - The image path from the API (can be relative or full URL)
 * @returns Full image URL
 */
export function formatImageUrl(imagePath: string | undefined | null): string | undefined {
  if (!imagePath) {
    return undefined;
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it starts with a slash, remove it
  let cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // The API returns paths like:
  // - "articles/1761153353568-2353c740a6530d97.png"
  // - "news/1761153353568-2353c740a6530d97.png"
  // These are already in the correct format for S3
  
  // Build the full S3 URL
  return `${S3_BASE_URL}/${cleanPath}`;
}

/**
 * Check if an image URL is valid
 * @param url - The image URL to check
 * @returns True if the URL is valid
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

