import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import SearchFilterSection from '@/components/sections/SearchFilterSection';
import PremiumArticlesSection from '@/components/sections/PremiumArticlesSection';
import AllContentSection from '@/components/sections/AllContentSection';
import CategoriesSection from '@/components/sections/CategoriesSection';
import VisionSection from '@/components/sections/VisionSection';
import TopWritersSection from '@/components/sections/TopWritersSection';
import MainPageTagsSection from '@/components/sections/MainPageTagsSection'; // NEW: Replaced TopicsSection
import NewsletterSection from '@/components/sections/NewsletterSection';
import { setRequestLocale } from 'next-intl/server';
import { articlesApi, sectionsApi } from '@/lib/api/client'; // REMOVED: tagsApi (not needed anymore)

export const dynamic = 'force-dynamic';

interface HomePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  try {
    // Fetch data from API
    // REMOVED: tagsApi.getAll() - MainPageTagsSection fetches its own data
    const [articlesData, premiumData, sectionsData] = await Promise.allSettled([
      articlesApi.getAll(9, 0),
      articlesApi.getPremium(4, 0),
      sectionsApi.getAll(),
      // REMOVED: tagsApi.getAll() - no longer needed
    ]);

    const articles = articlesData.status === 'fulfilled' ? (articlesData.value.articles || []) : [];
    const premiumArticles = premiumData.status === 'fulfilled' ? (premiumData.value.articles || []) : [];
    const sections = sectionsData.status === 'fulfilled' ? (sectionsData.value.sections || []) : [];
    // REMOVED: const tags = tagsData.tags || []; - no longer needed

    return (
      <main className="min-h-screen">
        <Header />
        <HeroSection />
        <SearchFilterSection />

        <PremiumArticlesSection articles={premiumArticles} locale={locale} />
        <AllContentSection articles={articles} hasMore={articlesData.pagination?.hasMore !== false} />
        <CategoriesSection sections={sections} />
        <VisionSection />

        {/* Top Writers Section */}
        <TopWritersSection />

        {/* UPDATED: Replaced TopicsSection with MainPageTagsSection */}
        {/* No props needed - component fetches its own data */}
        <MainPageTagsSection />

        <NewsletterSection />
        <Footer />
      </main>
    );
  } catch (error) {
    console.error('Error fetching data:', error);

    // Return error page
    return (
      <main className="min-h-screen">
        <Header />
        <div className="container mx-auto px-6 py-24 text-center">
          <h1 className="text-4xl font-bold text-charcoal mb-4">
            Error Loading Content
          </h1>
          <p className="text-xl text-muted-blue mb-8">
            We're having trouble loading the content. Please try again later.
          </p>
          <a
            href="/"
            className="inline-block px-8 py-4 bg-sky-cta text-white rounded-full hover:bg-sky-cta-hover transition-colors duration-200 font-semibold"
          >
            Retry
          </a>
        </div>
        <Footer />
      </main>
    );
  }
}