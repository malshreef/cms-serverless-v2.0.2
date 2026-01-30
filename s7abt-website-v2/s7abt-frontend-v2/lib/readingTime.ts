/**
 * Calculate estimated reading time for article content
 * @param content - HTML content or plain text
 * @param wordsPerMinute - Average reading speed (default: 200 for Arabic, 250 for English)
 * @param locale - Language locale
 * @returns Reading time in minutes
 */
export function calculateReadingTime(
  content: string,
  locale: string = 'en',
  wordsPerMinute?: number
): number {
  if (!content) return 0;

  // Remove HTML tags
  const plainText = content.replace(/<[^>]*>/g, '');

  // Count words
  // Arabic words are separated by spaces, similar to English
  const words = plainText.trim().split(/\s+/).length;

  // Default reading speeds
  const defaultWPM = locale === 'ar' ? 200 : 250;
  const wpm = wordsPerMinute || defaultWPM;

  // Calculate minutes and round up
  const minutes = Math.ceil(words / wpm);

  return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Format reading time for display
 * @param minutes - Reading time in minutes
 * @param locale - Language locale
 * @returns Formatted string
 */
export function formatReadingTime(minutes: number, locale: string = 'en'): string {
  if (locale === 'ar') {
    return `${minutes} دقيقة`;
  }
  return `${minutes} min read`;
}

/**
 * Calculate reading time from article sections
 * @param sections - Array of article sections
 * @param locale - Language locale
 * @returns Reading time in minutes
 */
export function calculateReadingTimeFromSections(
  sections: Array<{ title?: string; content?: string }>,
  locale: string = 'en'
): number {
  if (!sections || sections.length === 0) return 0;

  const totalContent = sections
    .map((section) => `${section.title || ''} ${section.content || ''}`)
    .join(' ');

  return calculateReadingTime(totalContent, locale);
}
