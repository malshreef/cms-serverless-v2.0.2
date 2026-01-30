import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ArticleCard from '@/components/ui/ArticleCard';
import Pagination from '@/components/ui/Pagination';
import { setRequestLocale } from 'next-intl/server';
import { articlesApi } from '@/lib/api/client';

interface ArticlesPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ArticlesPage({ params, searchParams }: ArticlesPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  setRequestLocale(locale);
  const isRTL = locale === 'ar';

  // Pagination Logic
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1;
  const limit = 15; // Show 15 articles per page
  const offset = (page - 1) * limit;

  try {
    const articlesData = await articlesApi.getAll(limit, offset);
    const articles = articlesData.articles || [];
    const totalArticles = articlesData.pagination?.total || 0;
    const totalPages = Math.ceil(totalArticles / limit);

    return (
      <main className="min-h-screen">
        <Header />

        {/* Page Header */}
        <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          <div className="container mx-auto px-6 relative text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {isRTL ? 'جميع المقالات' : 'All Articles'}
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              {isRTL
                ? 'استكشف مجموعتنا الشاملة من المقالات المتخصصة في الحوسبة السحابية والتقنية'
                : 'Explore our comprehensive collection of cloud computing and technology articles'}
            </p>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            {articles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-blue">
                  {isRTL ? 'لا توجد مقالات متاحة حالياً' : 'No articles available at the moment'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {articles.map((article: any) => (
                    <ArticleCard
                      key={article.s7b_article_id}
                      article={article}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination totalPages={totalPages} currentPage={page} />
              </>
            )}
          </div>
        </section>

        <Footer />
      </main>
    );
  } catch (error) {
    console.error('Error fetching articles:', error);
    return (
      <main className="min-h-screen">
        <Header />
        <div className="container mx-auto px-6 py-24 text-center">
          <h1 className="text-4xl font-bold text-charcoal mb-4">
            {isRTL ? 'خطأ في تحميل المحتوى' : 'Error Loading Content'}
          </h1>
          <p className="text-xl text-muted-blue mb-8">
            {isRTL
              ? 'نواجه مشكلة في تحميل المقالات. يرجى المحاولة مرة أخرى لاحقاً.'
              : 'We\'re having trouble loading the content. Please try again later.'}
          </p>
          <a
            href="/"
            className="inline-block px-8 py-4 bg-sky-cta text-white rounded-full hover:bg-sky-cta-hover transition-colors duration-200 font-semibold"
          >
            {isRTL ? 'العودة للرئيسية' : 'Return Home'}
          </a>
        </div>
        <Footer />
      </main>
    );
  }
}
