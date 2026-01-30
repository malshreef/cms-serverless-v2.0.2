'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

// ✅ CORRECT API ENDPOINT with status parameter - Configure in environment variables
const TAGS_API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/tags` : 'https://<your-api-id>.execute-api.<region>.amazonaws.com/Stage/tags';

interface Tag {
  id: number;
  name: string;
  articlesCount: number;  // ✅ Changed from articleCount to articlesCount (with 's')
  newsCount: number;
  totalUsage: number;
}

export default function TagsPage() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTagsCount, setAllTagsCount] = useState(0);
  const [totalArticlesCount, setTotalArticlesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        // ✅ FIX: Add status=published parameter to only count published articles
        const response = await fetch(`${TAGS_API_URL}?status=published`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Handle the correct response structure: { success: true, data: { tags: [...] } }
        if (result.success && result.data && result.data.tags && Array.isArray(result.data.tags)) {
          // Get ALL tags with usage > 0
          // ✅ FIX: Use articlesCount (with 's') from API response
          const allTags = result.data.tags
            .filter((tag: any) => 
              tag.name && 
              tag.name.trim() !== '' && 
              (tag.articlesCount > 0 || tag.newsCount > 0)  // ✅ Fixed: use articlesCount
            )
            .map((tag: any) => ({
              id: tag.id,
              name: tag.name,
              articlesCount: tag.articlesCount || 0,  // ✅ Fixed: use articlesCount
              newsCount: tag.newsCount || 0,
              totalUsage: tag.totalUsage || 0
            }))
            .sort((a: Tag, b: Tag) => b.totalUsage - a.totalUsage);
          
          // Store total count of all tags
          setAllTagsCount(allTags.length);
          
          // ✅ FIX: Calculate total PUBLISHED articles from articlesCount (not totalUsage)
          // totalUsage includes both articles AND news, we only want articles
          const totalArticles = allTags.reduce((sum: number, tag: Tag) => 
            sum + (tag.articlesCount || 0), 0  // ✅ Fixed: use articlesCount only
          );
          setTotalArticlesCount(totalArticles);
          
          // Set ALL tags (no slice, show everything)
          setTags(allTags);
        } else {
          throw new Error('Invalid data format received from API');
        }
      } catch (err) {
        console.error('Error fetching tags:', err);
        setError(locale === 'ar' ? 'فشل تحميل المواضيع' : 'Failed to load tags');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [locale]);  // ✅ Added locale to dependencies

  // Calculate font size based on usage count
  const getFontSize = (usageCount: number, maxCount: number, minCount: number) => {
    const maxSize = 2.5; // rem
    const minSize = 1.2; // rem
    
    if (maxCount === minCount) return minSize;
    
    const ratio = (usageCount - minCount) / (maxCount - minCount);
    const size = minSize + (ratio * (maxSize - minSize));
    
    return Math.max(minSize, Math.min(maxSize, size));
  };

  const maxCount = Math.max(...tags.map(t => t.totalUsage || 0), 1);
  const minCount = Math.min(...tags.map(t => t.totalUsage || 0), 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />

      {/* Hero Section - Light Blue Background */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-r from-sky-400 to-blue-500">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl text-center mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {locale === 'ar' ? 'المواضيع المصنفة' : 'Classified Topics'}
            </h1>
            <p className="text-xl text-white opacity-90 mb-8 leading-relaxed">
              {locale === 'ar'
                ? 'استكشف أشهر المواضيع والتصنيفات على موقعنا'
                : 'Explore the most popular topics and categories on our site'}
            </p>
            <div className="flex items-center justify-center gap-6 text-white">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                </svg>
                <span>{allTagsCount} {locale === 'ar' ? 'تصنيف' : 'Categories'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tags Cloud */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
                <p className="text-xl text-gray-600">
                  {locale === 'ar' ? 'جاري تحميل المواضيع...' : 'Loading topics...'}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center max-w-md">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {locale === 'ar' ? 'حدث خطأ' : 'An Error Occurred'}
                </h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </div>
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 text-6xl mb-4">🏷️</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                {locale === 'ar' ? 'لا توجد مواضيع' : 'No topics found'}
              </h3>
              <p className="text-gray-500">
                {locale === 'ar' ? 'لم يتم العثور على أي مواضيع' : 'No topics were found'}
              </p>
            </div>
          ) : (
            <>
              {/* Tags Cloud with Dynamic Sizing - Single Light Blue Color */}
              <div className="max-w-6xl mx-auto mb-12">
                <div className="flex flex-wrap justify-center items-center gap-4">
                  {tags.map((tag) => {
                    const fontSize = getFontSize(tag.totalUsage || 0, maxCount, minCount);
                    
                    return (
                      <Link
                        key={tag.id}
                        href={`/${locale}/tags/${tag.id}`}
                        className="group relative inline-block px-6 py-3 rounded-full text-[#0066CC] font-bold shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
                        style={{ 
                          fontSize: `${fontSize}rem`,
                          backgroundColor: '#E3F5FF'
                        }}
                      >
                        #{tag.name}
                        {/* ✅ Show totalUsage in badge (articles + news) */}
                        {tag.totalUsage && tag.totalUsage > 0 && (
                          <span className="absolute -top-2 -right-2 bg-white text-gray-800 text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-md group-hover:scale-125 transition-transform">
                            {tag.totalUsage}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Stats Section - 2 Cards Only */}
              <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {allTagsCount}
                  </div>
                  <div className="text-sm text-gray-700">
                    {locale === 'ar' ? 'تصنيف' : 'Categories'}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {totalArticlesCount}
                  </div>
                  <div className="text-sm text-gray-700">
                    {/* ✅ This now correctly shows ONLY published articles count */}
                    {locale === 'ar' ? 'مقال منشور' : 'Published Articles'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
