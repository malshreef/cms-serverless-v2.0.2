'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { searchApi } from '@/lib/api/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchResultCard from '@/components/search/SearchResultCard';
import Pagination from '@/components/search/Pagination';
import SearchFiltersSidebar from '@/components/search/SearchFiltersSidebar';

export default function AdvancedSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Search state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<(string | number)[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<(string | number)[]>([]);
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const resultsPerPage = 20;

  // Available filters
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);

  // Perform search
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setArticles([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const offset = (currentPage - 1) * resultsPerPage;
        const result = await searchApi.query(query, resultsPerPage, offset, 'all');
        
        let filteredArticles = result.articles;
        
        // Apply category filter
        if (selectedCategories.length > 0) {
          filteredArticles = filteredArticles.filter(article => 
            article.sections?.some((section: any) => 
              selectedCategories.includes(section.s7b_section_id)
            )
          );
        }
        
        // Apply author filter
        if (selectedAuthors.length > 0) {
          filteredArticles = filteredArticles.filter(article => 
            selectedAuthors.includes(article.s7b_user_id)
          );
        }
        
        // Apply date range filter
        if (dateRange !== 'all') {
          const now = new Date();
          const filterDate = new Date();
          
          switch (dateRange) {
            case 'day':
              filterDate.setDate(now.getDate() - 1);
              break;
            case 'week':
              filterDate.setDate(now.getDate() - 7);
              break;
            case 'month':
              filterDate.setMonth(now.getMonth() - 1);
              break;
            case 'year':
              filterDate.setFullYear(now.getFullYear() - 1);
              break;
          }
          
          filteredArticles = filteredArticles.filter(article => 
            new Date(article.s7b_article_add_date) >= filterDate
          );
        }
        
        // Apply sorting
        switch (sortBy) {
          case 'newest':
            filteredArticles.sort((a, b) => 
              new Date(b.s7b_article_add_date).getTime() - new Date(a.s7b_article_add_date).getTime()
            );
            break;
          case 'oldest':
            filteredArticles.sort((a, b) => 
              new Date(a.s7b_article_add_date).getTime() - new Date(b.s7b_article_add_date).getTime()
            );
            break;
          case 'most_read':
            filteredArticles.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
        }
        
        setArticles(filteredArticles);
        setTotal(filteredArticles.length);
        setTotalPages(Math.ceil(filteredArticles.length / resultsPerPage));
        
        // Extract unique categories and authors for filters
        const uniqueCategories = new Map();
        const uniqueAuthors = new Map();
        
        result.articles.forEach(article => {
          article.sections?.forEach((section: any) => {
            const count = uniqueCategories.get(section.s7b_section_id) || 0;
            uniqueCategories.set(section.s7b_section_id, count + 1);
          });
          
          if (article.s7b_user_id) {
            const count = uniqueAuthors.get(article.s7b_user_id) || 0;
            uniqueAuthors.set(article.s7b_user_id, count + 1);
          }
        });
        
        setCategories(
          Array.from(uniqueCategories.entries()).map(([id, count]) => {
            const article = result.articles.find(a => 
              a.sections?.some((s: any) => s.s7b_section_id === id)
            );
            const section = article?.sections?.find((s: any) => s.s7b_section_id === id);
            return {
              id,
              name: section?.s7b_section_name || 'غير محدد',
              count,
            };
          })
        );
        
        setAuthors(
          Array.from(uniqueAuthors.entries()).map(([id, count]) => {
            const article = result.articles.find(a => a.s7b_user_id === id);
            return {
              id,
              name: article?.s7b_user_name || 'كاتب مجهول',
              count,
            };
          })
        );
        
      } catch (err) {
        console.error('Search failed:', err);
        setError('حدث خطأ أثناء البحث');
        setArticles([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, currentPage, selectedCategories, selectedAuthors, dateRange, sortBy]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchInput = (e.target as HTMLFormElement).querySelector('input');
    if (searchInput) {
      const newQuery = (searchInput as HTMLInputElement).value;
      setQuery(newQuery);
      setCurrentPage(1);
      router.push(`/${locale}/search?q=${encodeURIComponent(newQuery)}`);
    }
  };

  // Handle filter changes
  const handleCategoryChange = (categoryId: string | number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
    setCurrentPage(1);
  };

  const handleAuthorChange = (authorId: string | number) => {
    setSelectedAuthors(prev => 
      prev.includes(authorId)
        ? prev.filter(id => id !== authorId)
        : [...prev, authorId]
    );
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Search Header Section */}
      <section className="gradient-hero pt-32 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-5xl font-bold text-charcoal mb-2">
                  {isRTL ? 'البحث' : 'Search'}
                </h1>
                <p className="text-xl text-muted-blue">
                  {isRTL ? 'اكتشف المحتوى الذي تبحث عنه' : 'Discover the content you are looking for'}
                </p>
              </div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3 text-sky-cta hover:text-sky-cta-hover bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-border-blue`}
              >
                <i className="fas fa-sliders-h"></i>
                <span className="font-medium">{isRTL ? 'بحث متقدم' : 'Advanced Search'}</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-border-blue">
              <form onSubmit={handleSearch} className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-4 mb-6`}>
                <div className="flex-1 relative">
                  <i className={`fas fa-search absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 transform -translate-y-1/2 text-muted-blue`}></i>
                  <input
                    type="text"
                    defaultValue={query}
                    placeholder={isRTL ? 'ابحث في المقالات والمحتوى...' : 'Search in articles and content...'}
                    className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 rounded-xl border-2 border-border-blue focus:border-sky-cta focus:outline-none text-lg transition-all duration-300`}
                  />
                </div>
                <button
                  type="submit"
                  className="px-10 py-4 bg-sky-cta text-white rounded-xl hover:bg-sky-cta-hover transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                >
                  <i className={`fas fa-search ${isRTL ? 'ml-2' : 'mr-2'}`}></i>
                  {isRTL ? 'بحث' : 'Search'}
                </button>
              </form>

              {/* Advanced Search Panel */}
              {showAdvanced && (
                <div className="border-t border-border-blue pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-3">
                        {isRTL ? 'التاريخ' : 'Date'}
                      </label>
                      <select
                        value={dateRange}
                        onChange={(e) => {
                          setDateRange(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-4 py-3 border-2 border-border-blue rounded-xl focus:border-sky-cta focus:outline-none transition-all duration-300"
                      >
                        <option value="all">{isRTL ? 'أي وقت' : 'Any time'}</option>
                        <option value="day">{isRTL ? 'آخر يوم' : 'Last day'}</option>
                        <option value="week">{isRTL ? 'آخر أسبوع' : 'Last week'}</option>
                        <option value="month">{isRTL ? 'آخر شهر' : 'Last month'}</option>
                        <option value="year">{isRTL ? 'آخر سنة' : 'Last year'}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-6`}>
              <h2 className="text-3xl font-bold text-charcoal">
                {isRTL ? 'نتائج البحث' : 'Search Results'}
              </h2>
              {total > 0 && (
                <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                  <span className="w-2 h-2 bg-sky-cta rounded-full"></span>
                  <span className="text-muted-blue font-medium">
                    {total} {isRTL ? 'نتيجة' : 'results'}
                  </span>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
              <span className="text-sm font-medium text-charcoal">
                {isRTL ? 'ترتيب حسب:' : 'Sort by:'}
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-border-blue rounded-lg focus:border-sky-cta focus:outline-none text-sm bg-white shadow-sm"
              >
                <option value="newest">{isRTL ? 'الأحدث' : 'Newest'}</option>
                <option value="oldest">{isRTL ? 'الأقدم' : 'Oldest'}</option>
                <option value="most_read">{isRTL ? 'الأكثر قراءة' : 'Most Read'}</option>
              </select>
            </div>
          </div>

          {/* Results and Filters Layout */}
          <div className="flex gap-8">
            {/* Results List - Full Width */}
            <div className="flex-1 space-y-4">
              {/* Loading State */}
              {loading && (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-cta"></div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* No Results */}
              {!loading && !error && query && articles.length === 0 && (
                <div className="bg-sky-bg border border-border-blue rounded-lg p-8 text-center">
                  <p className="text-lg text-charcoal mb-4">
                    {isRTL ? 'لم نجد نتائج تطابق بحثك' : 'No results found'}
                  </p>
                  <p className="text-muted-blue">
                    {isRTL ? 'حاول البحث بكلمات مختلفة أو تصفح الأقسام' : 'Try different keywords or browse sections'}
                  </p>
                </div>
              )}

              {/* Results */}
              {!loading && articles.length > 0 && articles.map((article) => (
                <SearchResultCard key={article.s7b_article_id} article={article} />
              ))}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>

            {/* Filters Sidebar */}
            {!loading && (categories.length > 0 || authors.length > 0) && (
              <div className="w-80 flex-shrink-0">
                <SearchFiltersSidebar
                categories={categories}
                authors={authors}
                selectedCategories={selectedCategories}
                selectedAuthors={selectedAuthors}
                onCategoryChange={handleCategoryChange}
                onAuthorChange={handleAuthorChange}
              />
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

