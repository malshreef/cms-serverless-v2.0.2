/**
 * Calculate estimated reading time for an article
 * @param content - The article content (body text)
 * @param wordsPerMinute - Average reading speed (default: 200 for Arabic, 250 for English)
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  if (!content) return 1; // Minimum 1 minute
  
  // Remove HTML tags if any
  const plainText = content.replace(/<[^>]*>/g, '');
  
  // Count words
  // For Arabic text, we count Arabic words separately
  const arabicWords = plainText.match(/[\u0600-\u06FF]+/g) || [];
  const englishWords = plainText.match(/[a-zA-Z]+/g) || [];
  
  // Arabic reading is typically slower, so we use a different WPM
  const arabicWPM = 180;
  const englishWPM = 250;
  
  const arabicTime = arabicWords.length / arabicWPM;
  const englishTime = englishWords.length / englishWPM;
  
  const totalMinutes = Math.ceil(arabicTime + englishTime);
  
  // Return at least 1 minute
  return Math.max(1, totalMinutes);
}

/**
 * Format reading time for display
 * @param minutes - Reading time in minutes
 * @param locale - Locale for formatting (ar or en)
 * @returns Formatted reading time string
 */
export function formatReadingTime(minutes: number, locale: string = 'ar'): string {
  if (locale === 'ar') {
    return `${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
  }
  return `${minutes} min`;
}
