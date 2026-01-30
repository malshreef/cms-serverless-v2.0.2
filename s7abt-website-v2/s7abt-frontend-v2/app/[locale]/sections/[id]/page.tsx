'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ArticleCard from '@/components/ui/ArticleCard';
import Pagination from '@/components/search/Pagination';
import Breadcrumbs, { BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { sectionsApi, articlesApi, Article, Section } from '@/lib/api/client';

const ARTICLES_PER_PAGE = 15;

export default function SectionPage() {
  const locale = useLocale();
  const params = useParams();
  const sectionId = params?.id as string;
  const isRTL = locale === 'ar';

  const [section, setSection] = useState<Section | null>(null);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch Section Details
      try {
        const sectionData = await sectionsApi.getById(sectionId);
        if (!sectionData.section) {
          throw new Error('Section not found');
        }
        setSection(sectionData.section);
      } catch (sectionErr) {
        console.error('Error fetching section details:', sectionErr);
        setError('Failed to load section details');
        setLoading(false);
        return;
      }

      // 2. Fetch Articles (separately so it doesn't block the page if it fails)
      try {
        // Try dedicated endpoint first
        const articlesData = await sectionsApi.getArticles(sectionId, 100);

        if (articlesData.articles && articlesData.articles.length > 0) {
          setAllArticles(articlesData.articles);
        } else {
          // Fallback: Fetch global articles and filter client-side
          console.log('Dedicated endpoint returned 0 articles, using fallback...');
          const globalArticlesData = await articlesApi.getAll(100, 0);
          const filteredArticles = (globalArticlesData.articles || []).filter(
            (article: Article) =>
              article.sections?.some(
                (s) => s.s7b_section_id === parseInt(sectionId, 10)
              )
          );
          setAllArticles(filteredArticles);
        }
      } catch (articlesErr) {
        console.error('Error fetching section articles, trying fallback:', articlesErr);

        try {
          // Fallback on error: Fetch global articles and filter client-side
          const globalArticlesData = await articlesApi.getAll(100, 0);
          const filteredArticles = (globalArticlesData.articles || []).filter(
            (article: Article) =>
              article.sections?.some(
                (s) => s.s7b_section_id === parseInt(sectionId, 10)
              )
          );
          setAllArticles(filteredArticles);
        } catch (fallbackErr) {
          console.error('Fallback fetch failed:', fallbackErr);
          setAllArticles([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sectionId]);

  // Reset to page 1 when section changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sectionId]);

  // Calculate pagination
  const totalPages = Math.ceil(allArticles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const endIndex = startIndex + ARTICLES_PER_PAGE;
  const paginatedArticles = allArticles.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="gradient-hero pt-32 pb-16 min-h-[400px] flex items-center justify-center">
          <p className="text-xl text-muted-blue">
            {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !section) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="gradient-hero pt-32 pb-16 min-h-[400px] flex items-center justify-center">
          <p className="text-xl text-red-500">
            {error || (locale === 'ar' ? 'لم يتم العثور على الفئة' : 'Section not found')}
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: locale === 'ar' ? 'الرئيسية' : 'Home',
      href: `/${locale}`,
    },
    {
      label: locale === 'ar' ? 'الأقسام' : 'Sections',
      href: `/${locale}/sections`,
    },
    {
      label: section.s7b_section_name,
    },
  ];

  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-r from-sky-400 to-blue-500">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl text-center mx-auto">
            {/* Breadcrumbs with SEO markup */}
            <div className="flex justify-center mb-8">
              <Breadcrumbs items={breadcrumbItems} variant="light" />
            </div>

            {/* Section Badge */}
            <div className="inline-block mb-6">
              <span className="inline-flex items-center px-6 py-3 rounded-full text-white font-bold text-2xl shadow-lg"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                {section.s7b_section_name}
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {locale === 'ar'
                ? `مقالات ${section.s7b_section_name}`
                : `${section.s7b_section_name} Articles`}
            </h1>

            {section.s7b_section_brief && (
              <p className="text-xl text-white opacity-90 mb-8 leading-relaxed">
                {section.s7b_section_brief}
              </p>
            )}

            <div className="flex items-center justify-center gap-6 text-white">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                <span>{allArticles.length} {locale === 'ar' ? 'مقال' : 'Articles'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          {allArticles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-blue">
                {locale === 'ar'
                  ? 'لا توجد مقالات في هذه الفئة'
                  : 'No articles in this category'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedArticles.map((article) => (
                  <ArticleCard
                    key={article.s7b_article_id}
                    article={article}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
