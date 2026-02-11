import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { articlesAPI, sectionsAPI } from '../lib/api';
import { FileText, Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Articles = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [articles, setArticles] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [premiumFilter, setPremiumFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [currentPage, statusFilter, sectionFilter, premiumFilter, searchTerm]);

  const fetchSections = async () => {
    try {
      const response = await sectionsAPI.list();
      const sectionsData = response.data?.sections || response.data?.data?.sections || response.data?.data?.data || response.data?.data || [];
      setSections(Array.isArray(sectionsData) ? sectionsData : []);
    } catch (err) {
      console.error('Error fetching sections:', err);
    }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 15,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(sectionFilter !== 'all' && { sectionId: sectionFilter }),
        ...(premiumFilter !== 'all' && { premium: premiumFilter === 'premium' }),
        ...(searchTerm && { search: searchTerm }),
      };
      
      const response = await articlesAPI.list(params);
      
      // Handle different response formats
      const articlesData = response.data?.articles || response.data?.data?.articles || response.data?.data?.items || response.data?.data || [];
      const paginationData = response.data?.pagination || response.data?.data?.pagination || {};
      
      setArticles(Array.isArray(articlesData) ? articlesData : []);
      setTotalPages(paginationData.totalPages || 1);
      setTotalArticles(paginationData.total || articlesData.length || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`هل أنت متأكد من حذف المقال "${title}"؟`)) {
      return;
    }

    try {
      await articlesAPI.delete(id);
      fetchArticles();
      alert('تم حذف المقال بنجاح');
    } catch (err) {
      alert('خطأ في حذف المقال: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      published: 'bg-green-100 text-green-700',
      draft: 'bg-amber-100 text-amber-700',
      scheduled: 'bg-blue-100 text-blue-700',
    };
    
    const labels = {
      published: 'منشور',
      draft: 'مسودة',
      scheduled: 'مجدول',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading && articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-cta"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-readex text-charcoal mb-2">المقالات</h2>
          <p className="text-muted-blue">إدارة مقالات المدونة ({totalArticles} مقال)</p>
        </div>
        {permissions.can('articles', 'create') && (
          <button
            onClick={() => navigate('/articles/new')}
            className="bg-sky-cta hover:bg-sky-cta-hover text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 space-x-reverse transition"
          >
            <Plus className="w-5 h-5" />
            <span>مقال جديد</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="البحث في المقالات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-sky-bg border border-border-blue rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-cta text-right"
              />
              <Search className="absolute right-3 top-2.5 w-5 h-5 text-muted-blue" />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-sky-bg border border-border-blue rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-cta text-right"
            >
              <option value="all">جميع الحالات</option>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
              <option value="scheduled">مجدول</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full bg-sky-bg border border-border-blue rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-cta text-right"
            >
              <option value="all">جميع الأقسام</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          {/* Premium Filter */}
          <div>
            <select
              value={premiumFilter}
              onChange={(e) => setPremiumFilter(e.target.value)}
              className="w-full bg-sky-bg border border-border-blue rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-cta text-right"
            >
              <option value="all">جميع المقالات</option>
              <option value="premium">مميز فقط</option>
              <option value="regular">عادي فقط</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600 text-right">خطأ في تحميل المقالات: {error}</p>
        </div>
      )}

      {/* Articles List */}
      <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm overflow-hidden">
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-blue mx-auto mb-4" />
            <p className="text-muted-blue text-lg">لا توجد مقالات</p>
            <button
              onClick={() => navigate('/articles/new')}
              className="mt-4 text-sky-cta hover:text-sky-cta-hover font-medium"
            >
              إنشاء مقال جديد
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sky-bg border-b border-border-blue">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-blue uppercase tracking-wider">
                      العنوان
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-blue uppercase tracking-wider">
                      القسم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-blue uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-blue uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-blue uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-blue">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-sky-bg transition">
                      <td className="px-6 py-4">
                        <div className="text-right">
                          <div className="font-semibold text-charcoal">{article.title}</div>
                          <div className="text-sm text-muted-blue mt-1">{article.excerpt}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="px-2 py-1 bg-sky-bg text-sky-cta text-xs rounded">
                          {article.section?.name || 'غير محدد'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2 space-x-reverse">
                          {getStatusBadge(article.status)}
                          {article.premium && (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                              مميز
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-muted-blue">
                        {new Date(article.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2 space-x-reverse">
                          <button
                            onClick={() => navigate(`/articles/${article.id}`)}
                            className="p-2 hover:bg-sky-bg rounded-lg transition"
                            title="عرض"
                          >
                            <Eye className="w-4 h-4 text-muted-blue" />
                          </button>
                          {permissions.canOnResource('articles', 'update', article.author?.id) && (
                            <button
                              onClick={() => navigate(`/articles/${article.id}/edit`)}
                              className="p-2 hover:bg-sky-bg rounded-lg transition"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4 text-sky-cta" />
                            </button>
                          )}
                          {permissions.canOnResource('articles', 'delete', article.author?.id) && (
                            <button
                              onClick={() => handleDelete(article.id, article.title)}
                              className="p-2 hover:bg-red-50 rounded-lg transition"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border-blue flex items-center justify-between">
                <div className="text-sm text-muted-blue">
                  صفحة {currentPage} من {totalPages}
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-sky-bg text-sky-cta rounded-lg hover:bg-sky-cta hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-sky-bg text-sky-cta rounded-lg hover:bg-sky-cta hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Articles;

