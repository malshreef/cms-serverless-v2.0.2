import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ArticleCard from '@/components/ui/ArticleCard';
import { setRequestLocale } from 'next-intl/server';
import { searchApi } from '@/lib/api/client';

export const dynamic = 'force-dynamic';

interface Vision2030PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function Vision2030Page({ params }: Vision2030PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const isArabic = locale === 'ar';
  
  try {
    // Search for articles with Vision 2030 tags using the new dedicated Tags API
    const tags = ['Vision 2030', 'vision2030', 'رؤية-السعودية-2030', 'رؤية-2030', 'vision-2030'];
    
    console.log('Vision 2030 Page: Fetching articles with tags:', tags);
    
    // Use the new Tags API (searchApi.byTags now uses the dedicated endpoint)
    const articlesData = await searchApi.byTags(tags, 50, 0);
    const articles = articlesData.articles || [];
    
    console.log(`✅ Tags API returned ${articles.length} articles (Total: ${articlesData.total || 0})`);

    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <Header />
        
        {/* Hero Section with Saudi Theme */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          <div className="container mx-auto px-6 relative">
            <div className={`max-w-4xl ${isArabic ? 'mr-auto text-right' : 'ml-auto text-left'}`}>
              {/* Saudi Flag Colors Accent */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-1 bg-gradient-to-r from-green-600 to-green-500 rounded-full"></div>
                <span className="text-green-600 font-bold text-sm tracking-wide uppercase">
                  {isArabic ? 'رؤية المملكة 2030' : 'Saudi Vision 2030'}
                </span>
              </div>

              {/* Main Title */}
              <h1 className="text-5xl lg:text-6xl font-bold text-charcoal mb-6 leading-tight">
                {isArabic 
                  ? 'الخدمات السحابية وفق رؤية 2030'
                  : 'Cloud Services & Vision 2030'
                }
              </h1>

              {/* Description */}
              <p className="text-xl lg:text-2xl text-muted-blue mb-8 leading-relaxed">
                {isArabic
                  ? 'استكشف كيف تساهم الخدمات السحابية في تحقيق أهداف رؤية المملكة العربية السعودية 2030 والتحول الرقمي الشامل'
                  : 'Explore how cloud services contribute to achieving the goals of Saudi Arabia\'s Vision 2030 and comprehensive digital transformation'
                }
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-100">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {articles.length}
                  </div>
                  <div className="text-sm text-muted-blue">
                    {isArabic ? 'مقالة متخصصة' : 'Specialized Articles'}
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-100">
                  <div className="text-3xl font-bold text-green-600 mb-2">2030</div>
                  <div className="text-sm text-muted-blue">
                    {isArabic ? 'رؤية المملكة' : 'Kingdom Vision'}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-100 col-span-2 md:col-span-1">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    <i className="fas fa-cloud"></i>
                  </div>
                  <div className="text-sm text-muted-blue">
                    {isArabic ? 'التحول السحابي' : 'Cloud Transformation'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision 2030 Pillars Section */}
        <section className="py-12 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`bg-white rounded-xl p-6 border-l-4 border-green-600 ${isArabic ? 'text-right' : 'text-left'}`}>
                <div className="text-3xl mb-3">🏛️</div>
                <h3 className="font-bold text-lg text-charcoal mb-2">
                  {isArabic ? 'مجتمع حيوي' : 'Vibrant Society'}
                </h3>
                <p className="text-sm text-muted-blue">
                  {isArabic 
                    ? 'بناء مجتمع رقمي متقدم يعتمد على التقنيات السحابية'
                    : 'Building an advanced digital society based on cloud technologies'
                  }
                </p>
              </div>

              <div className={`bg-white rounded-xl p-6 border-l-4 border-green-600 ${isArabic ? 'text-right' : 'text-left'}`}>
                <div className="text-3xl mb-3">💼</div>
                <h3 className="font-bold text-lg text-charcoal mb-2">
                  {isArabic ? 'اقتصاد مزدهر' : 'Thriving Economy'}
                </h3>
                <p className="text-sm text-muted-blue">
                  {isArabic 
                    ? 'تمكين الاقتصاد الرقمي من خلال البنية التحتية السحابية'
                    : 'Enabling digital economy through cloud infrastructure'
                  }
                </p>
              </div>

              <div className={`bg-white rounded-xl p-6 border-l-4 border-green-600 ${isArabic ? 'text-right' : 'text-left'}`}>
                <div className="text-3xl mb-3">🌍</div>
                <h3 className="font-bold text-lg text-charcoal mb-2">
                  {isArabic ? 'وطن طموح' : 'Ambitious Nation'}
                </h3>
                <p className="text-sm text-muted-blue">
                  {isArabic 
                    ? 'قيادة التحول الرقمي في المنطقة باستخدام الحلول السحابية'
                    : 'Leading digital transformation in the region using cloud solutions'
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            {/* Section Header */}
            <div className={`mb-12 ${isArabic ? 'text-right' : 'text-left'}`}>
              <h2 className="text-3xl font-bold text-charcoal mb-4">
                {isArabic ? 'مقالات رؤية 2030' : 'Vision 2030 Articles'}
              </h2>
              <p className="text-muted-blue text-lg">
                {isArabic 
                  ? 'اكتشف مجموعة من المقالات المتخصصة حول دور الخدمات السحابية في تحقيق رؤية المملكة 2030'
                  : 'Discover a collection of specialized articles about the role of cloud services in achieving Saudi Vision 2030'
                }
              </p>
            </div>

            {articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article: any) => (
                  <ArticleCard
                    key={article.s7b_article_id}
                    article={article}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">📝</div>
                <h3 className="text-2xl font-bold text-charcoal mb-4">
                  {isArabic ? 'قريباً' : 'Coming Soon'}
                </h3>
                <p className="text-muted-blue text-lg max-w-md mx-auto">
                  {isArabic 
                    ? 'نعمل حالياً على إضافة مقالات متخصصة حول رؤية 2030 والخدمات السحابية'
                    : 'We are currently working on adding specialized articles about Vision 2030 and cloud services'
                  }
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {isArabic 
                ? 'كن جزءاً من رؤية 2030'
                : 'Be Part of Vision 2030'
              }
            </h2>
            <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
              {isArabic 
                ? 'تعرف على المزيد حول كيفية مساهمة الخدمات السحابية في التحول الرقمي للمملكة'
                : 'Learn more about how cloud services contribute to the Kingdom\'s digital transformation'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`/${locale}/articles`}
                className="px-8 py-4 bg-white text-green-600 rounded-full font-semibold hover:bg-gray-100 transition-colors inline-block"
              >
                {isArabic ? 'جميع المقالات' : 'All Articles'}
              </a>
              <a
                href={`/${locale}/sections`}
                className="px-8 py-4 bg-green-700 text-white rounded-full font-semibold hover:bg-green-800 transition-colors inline-block border-2 border-white"
              >
                {isArabic ? 'استكشف الأقسام' : 'Explore Sections'}
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    );
  } catch (error) {
    console.error('Error fetching Vision 2030 articles:', error);
    return (
      <main className="min-h-screen">
        <Header />
        <div className="container mx-auto px-6 py-24 text-center">
          <h1 className="text-4xl font-bold text-charcoal mb-4">
            {isArabic ? 'خطأ في تحميل المقالات' : 'Error Loading Articles'}
          </h1>
          <p className="text-xl text-muted-blue mb-8">
            {isArabic ? 'يرجى المحاولة مرة أخرى لاحقاً' : 'Please try again later'}
          </p>
          <a
            href={`/${locale}`}
            className="px-8 py-4 bg-sky-cta text-white rounded-full font-semibold hover:bg-sky-cta-hover transition-colors inline-block"
          >
            {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
          </a>
        </div>
        <Footer />
      </main>
    );
  }
}
