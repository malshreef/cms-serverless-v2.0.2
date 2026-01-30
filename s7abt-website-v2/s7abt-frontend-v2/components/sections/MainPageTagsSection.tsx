'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface Tag {
  id: number;
  name: string;
  articlesCount: number;
  newsCount: number;
  totalUsage: number;
}

export default function MainPageTagsSection() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use environment variable for API URL
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://<your-api-id>.execute-api.me-central-1.amazonaws.com/Stage';
      const response = await fetch(`${API_BASE_URL}/tags`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Handle the correct response structure: { success: true, data: { tags: [...] } }
      if (result.success && result.data && result.data.tags && Array.isArray(result.data.tags)) {
        // Filter out empty tags and tags with 0 articles, sort by totalUsage, and take top 20
        const processedTags = result.data.tags
          .filter((tag: Tag) =>
            tag.name &&
            tag.name.trim() !== '' &&
            tag.totalUsage > 0
          )
          .sort((a: Tag, b: Tag) => b.totalUsage - a.totalUsage)
          .slice(0, 20); // Take only top 20 for homepage

        setTags(processedTags);
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
      // Instead of showing error, just hide the section if tags fail to load
      setError(null); // Don't show error to user
      setTags([]); // Empty tags will hide the section
    } finally {
      setIsLoading(false);
    }
  };

  const getFontSize = (totalUsage: number, maxCount: number, minCount: number): number => {
    if (maxCount === minCount) return 1;
    
    const minSize = 0.875; // 14px
    const maxSize = 1.5;   // 24px
    const normalized = (totalUsage - minCount) / (maxCount - minCount);
    return minSize + (normalized * (maxSize - minSize));
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">
            {locale === 'ar' ? 'أهم التصنيفات' : 'Top Classifications'}
          </h2>
          <div className="text-center text-gray-500">
            {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">
            {locale === 'ar' ? 'أهم التصنيفات' : 'Top Classifications'}
          </h2>
          <div className="text-center text-red-500">
            {locale === 'ar' ? 'فشل تحميل المواضيع' : 'Failed to load topics'}
            <div className="text-sm text-gray-500 mt-2">{error}</div>
          </div>
        </div>
      </section>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  const maxCount = Math.max(...tags.map(tag => tag.totalUsage));
  const minCount = Math.min(...tags.map(tag => tag.totalUsage));

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Header - Centered title */}
        <h2 className="text-2xl font-bold mb-8 text-center">
          {locale === 'ar' ? 'أهم التصنيفات' : 'Top Classifications'}
        </h2>

        {/* Tags Cloud - Top 20 only */}
        <div className="flex flex-wrap gap-3 justify-center items-center mb-8">
          {tags.map((tag) => {
            const fontSize = getFontSize(tag.totalUsage, maxCount, minCount);
            
            return (
              <Link
                key={tag.id}
                href={`/${locale}/tags/${tag.id}`}
                className="inline-block px-4 py-2 rounded-full transition-all duration-200 hover:shadow-md"
                style={{
                  backgroundColor: '#E3F5FF',
                  color: '#0066CC',
                  fontSize: `${fontSize}rem`,
                  fontWeight: 500,
                }}
              >
                {tag.name}
              </Link>
            );
          })}
        </div>

        {/* View All Button - Matching design color */}
        <div className="text-center">
          <Link
            href={`/${locale}/tags`}
            className="inline-block px-8 py-3 bg-sky-cta text-white rounded-full hover:bg-[#2563EB] transition-colors font-medium shadow-md"
          >
            {locale === 'ar' ? 'عرض جميع التصنيفات' : 'View All Classifications'}
          </Link>
        </div>
      </div>
    </section>
  );
}
