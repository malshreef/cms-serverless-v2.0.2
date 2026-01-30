/**
 * Alt Text Utility Functions
 *
 * Generates descriptive and concise alt text for images
 * following SEO best practices and WCAG accessibility guidelines.
 *
 * Maximum length: 125 characters
 */

/**
 * Truncates text to a maximum length while preserving word boundaries
 */
function truncateText(text: string, maxLength: number = 125): string {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Generates alt text for article featured images
 * Format: "Article title"
 */
export function getArticleImageAlt(articleTitle: string, locale: string = 'ar'): string {
  if (!articleTitle || articleTitle.trim() === '') {
    return locale === 'ar' ? 'صورة المقال' : 'Article image';
  }
  return truncateText(articleTitle);
}

/**
 * Generates alt text for author/writer profile images
 * Format: "Author name profile picture" or "صورة الكاتب [name]"
 */
export function getAuthorImageAlt(authorName: string, locale: string = 'ar'): string {
  if (!authorName || authorName.trim() === '') {
    return locale === 'ar' ? 'صورة الكاتب' : 'Author profile picture';
  }

  const cleanName = authorName.trim();
  const altText = locale === 'ar'
    ? `صورة الكاتب ${cleanName}`
    : `${cleanName} profile picture`;

  return truncateText(altText);
}

/**
 * Generates alt text for section images
 * Format: "Section name" or "قسم [name]"
 */
export function getSectionImageAlt(sectionName: string, locale: string = 'ar'): string {
  if (!sectionName || sectionName.trim() === '') {
    return locale === 'ar' ? 'صورة القسم' : 'Section image';
  }

  const cleanName = sectionName.trim();
  const altText = locale === 'ar'
    ? `قسم ${cleanName}`
    : `${cleanName} section`;

  return truncateText(altText);
}

/**
 * Generates alt text for news images
 * Format: "News title"
 */
export function getNewsImageAlt(newsTitle: string, locale: string = 'ar'): string {
  if (!newsTitle || newsTitle.trim() === '') {
    return locale === 'ar' ? 'صورة الخبر' : 'News image';
  }
  return truncateText(newsTitle);
}

/**
 * Generates alt text for logo images
 * Format: Brand name in current locale
 */
export function getLogoAlt(locale: string = 'ar'): string {
  return locale === 'ar' ? 'شعار سحابة المحتوى' : 'S7abt Cloud Content Logo';
}

/**
 * Returns empty alt text for decorative images
 * Decorative images should have empty alt="" for screen readers to skip
 */
export function getDecorativeImageAlt(): string {
  return '';
}

/**
 * Generates alt text for placeholder images
 * Returns empty string as placeholders are decorative
 */
export function getPlaceholderImageAlt(): string {
  return '';
}

/**
 * Generates alt text for tag/category images
 * Format: "Tag name" or "وسم [name]"
 */
export function getTagImageAlt(tagName: string, locale: string = 'ar'): string {
  if (!tagName || tagName.trim() === '') {
    return locale === 'ar' ? 'صورة الوسم' : 'Tag image';
  }

  const cleanName = tagName.trim();
  const altText = locale === 'ar'
    ? `وسم ${cleanName}`
    : `${cleanName} tag`;

  return truncateText(altText);
}

/**
 * Generates alt text for related article images
 * Format: "Related: Article title" or "مقال ذو صلة: [title]"
 */
export function getRelatedArticleImageAlt(articleTitle: string, locale: string = 'ar'): string {
  if (!articleTitle || articleTitle.trim() === '') {
    return locale === 'ar' ? 'مقال ذو صلة' : 'Related article';
  }

  const prefix = locale === 'ar' ? 'مقال ذو صلة: ' : 'Related: ';
  const maxContentLength = 125 - prefix.length;
  const truncatedTitle = articleTitle.length > maxContentLength
    ? truncateText(articleTitle, maxContentLength)
    : articleTitle;

  return prefix + truncatedTitle;
}
