'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Tag {
  id: number;
  name: string;
  articleCount: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    try {
      setLoading(true);
      
      // Fetch all tags from your API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags`);
      const data = await response.json();
      
      // Map and sort tags by article count
      const allTags = (data.data?.tags || data.tags || []).map((tag: any) => ({
        id: tag.s7b_tags_id || tag.id,
        name: tag.s7b_tags_name || tag.name,
        articleCount: tag.article_count || tag.articleCount || 0,
      }));
      
      // Sort by article count and take top 20
      const topTags = allTags
        .sort((a: Tag, b: Tag) => b.articleCount - a.articleCount)
        .slice(0, 20);
      
      setTags(topTags);
      setError(null);
    } catch (err) {
      console.error('Failed to load tags:', err);
      setError('حدث خطأ أثناء تحميل المواضيع');
    } finally {
      setLoading(false);
    }
  }

  // Calculate font size based on article count
  function getFontSize(articleCount: number, maxCount: number, minCount: number) {
    const maxSize = 2.5; // rem
    const minSize = 1; // rem
    
    if (maxCount === minCount) return minSize;
    
    const ratio = (articleCount - minCount) / (maxCount - minCount);
    const size = minSize + (ratio * (maxSize - minSize));
    
    return Math.max(minSize, Math.min(maxSize, size));
  }

  // Get color based on index for variety
  const colors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-rose-400 to-rose-600',
    'from-green-400 to-green-600',
    'from-indigo-400 to-indigo-600',
    'from-orange-400 to-orange-600',
    'from-sky-400 to-sky-600',
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50" dir="rtl">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
              <p className="text-xl text-gray-600">جاري تحميل المواضيع...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50" dir="rtl">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">حدث خطأ</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  loadTags();
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const maxCount = Math.max(...tags.map(t => t.articleCount), 1);
  const minCount = Math.min(...tags.map(t => t.articleCount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50" dir="rtl">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl text-center mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              المواضيع الرئيسية
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              استكشف أشهر المواضيع والتصنيفات على موقعنا
            </p>
            <div className="flex items-center justify-center gap-6 text-blue-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                </svg>
                <span>أكثر من {tags.length} موضوع</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tags Cloud Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          {tags.length > 0 ? (
            <>
              {/* Tags Cloud */}
              <div className="max-w-6xl mx-auto mb-12">
                <div className="flex flex-wrap justify-center items-center gap-4">
                  {tags.map((tag, index) => {
                    const fontSize = getFontSize(tag.articleCount, maxCount, minCount);
                    const colorClass = colors[index % colors.length];
                    
                    return (
                      <Link
                        key={tag.id}
                        href={`/tag/${encodeURIComponent(tag.name)}`}
                        className={`group relative inline-block px-6 py-3 rounded-full bg-gradient-to-r ${colorClass} text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300`}
                        style={{ fontSize: `${fontSize}rem` }}
                      >
                        {tag.name}
                        <span className="absolute -top-2 -right-2 bg-white text-gray-800 text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-md group-hover:scale-125 transition-transform">
                          {tag.articleCount}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* "View All" Button */}
              <div className="text-center">
                <button
                  onClick={loadTags}
                  className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors duration-200 inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                  </svg>
                  <span>عرض جميع المواضيع</span>
                </button>
              </div>

              {/* Stats Section */}
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {tags.length}
                  </div>
                  <div className="text-sm text-gray-700">موضوع متاح</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {tags.reduce((sum, tag) => sum + tag.articleCount, 0)}
                  </div>
                  <div className="text-sm text-gray-700">مقال منشور</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {maxCount}
                  </div>
                  <div className="text-sm text-gray-700">أكثر موضوع</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="text-gray-400 text-6xl mb-4">🏷️</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">لا توجد مواضيع</h3>
              <p className="text-gray-500">لم يتم العثور على أي مواضيع</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
