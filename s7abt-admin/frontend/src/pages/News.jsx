import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { buildImageUrl } from '../lib/imageUtils';
import { newsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Newspaper,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

const News = () => {
  const { permissions } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Mock data
  const mockNews = [
    {
      id: 1,
      title: 'AWS تطلق خدمة جديدة للذكاء الاصطناعي',
      brief: 'أعلنت AWS عن إطلاق خدمة جديدة تعتمد على الذكاء الاصطناعي',
      body: 'أعلنت شركة Amazon Web Services عن إطلاق خدمة جديدة تعتمد على الذكاء الاصطناعي لمساعدة المطورين في بناء تطبيقات أكثر ذكاءً...',
      image: null,
      logo: 'flaticon-cloud',
      active: 1,
      addDate: '2025-10-20T10:30:00',
      showWidth: 12,
      authorName: 'مشرف النظام',
    },
    {
      id: 2,
      title: 'Microsoft Azure تحقق نمواً قياسياً',
      brief: 'تقارير تشير إلى نمو كبير في إيرادات Azure خلال الربع الأخير',
      body: 'أظهرت التقارير المالية الأخيرة لشركة Microsoft نمواً قياسياً في إيرادات خدمة Azure السحابية...',
      image: null,
      logo: 'flaticon-server',
      active: 1,
      addDate: '2025-10-19T14:15:00',
      showWidth: 6,
      authorName: 'محرر المحتوى',
    },
    {
      id: 3,
      title: 'Google Cloud تستثمر في الطاقة المتجددة',
      brief: 'استثمارات ضخمة في مشاريع الطاقة النظيفة لمراكز البيانات',
      body: 'أعلنت Google Cloud عن خطط استثمارية ضخمة في مشاريع الطاقة المتجددة لتشغيل مراكز البيانات...',
      image: null,
      logo: 'flaticon-energy',
      active: 0,
      addDate: '2025-10-18T09:00:00',
      showWidth: 12,
      authorName: 'مشرف النظام',
    },
  ];

  useEffect(() => {
    fetchNews();
  }, [filter, currentPage]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20
      };
      
      if (filter !== 'all') {
        params.status = filter; // Send 'active' or 'inactive' directly
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await newsAPI.list(params);
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      
      // Handle different response structures
      let newsData = [];
      if (response.data?.data?.news) {
        newsData = response.data.data.news;
      } else if (response.data?.news) {
        newsData = response.data.news;
      } else if (response.data?.data) {
        newsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        newsData = response.data;
      }
      
      console.log('Parsed news data:', newsData);
      console.log('Is array?', Array.isArray(newsData));
      console.log('Length:', newsData.length);
      
      setNews(Array.isArray(newsData) ? newsData : []);
      
      if (response.data?.pagination) {
        setTotalPages(response.data.pagination.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      alert('حدث خطأ في تحميل الأخبار: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (newsId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;

    try {
      console.log('Deleting news with ID:', newsId);
      await newsAPI.delete(newsId);
      setNews(news.filter(n => n.id !== newsId));
      alert('تم حذف الخبر بنجاح');
    } catch (error) {
      console.error('Error deleting news:', error);
      alert('حدث خطأ في حذف الخبر: ' + error.message);
    }
  };

  const handleToggleStatus = async (newsId, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await newsAPI.update(newsId, { active: newStatus });
      setNews(news.map(n =>
        n.id === newsId ? { ...n, active: newStatus } : n
      ));
      alert('تم تحديث حالة الخبر بنجاح');
    } catch (error) {
      console.error('Error updating news status:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = {
    total: news.length,
    active: news.filter(n => n.active === 1).length,
    inactive: news.filter(n => n.active === 0).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-cta mx-auto"></div>
          <p className="mt-4 text-muted-blue">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal font-readex">إدارة الأخبار</h1>
          <p className="text-muted-blue mt-1">إدارة الأخبار والتحديثات السريعة</p>
        </div>
        {permissions.can('news', 'create') && (
          <Link
            to="/news/new"
            className="inline-flex items-center px-4 py-2 bg-sky-cta text-white rounded-lg hover:bg-sky-cta-hover transition"
          >
            <Plus className="w-5 h-5 ml-2" />
            خبر جديد
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className="text-sm text-muted-blue mb-1">إجمالي الأخبار</p>
              <p className="text-3xl font-bold text-charcoal">{stats.total}</p>
            </div>
            <div className="p-3 bg-sky-bg rounded-lg">
              <Newspaper className="w-6 h-6 text-sky-cta" />
            </div>
          </div>
        </div>

        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className="text-sm text-muted-blue mb-1">نشط</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className="text-sm text-muted-blue mb-1">غير نشط</p>
              <p className="text-3xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <XCircle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-charcoal mb-2 text-right">الحالة</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right"
            >
              <option value="all">الكل</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-charcoal mb-2 text-right">البحث</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchNews();
                  }
                }}
                placeholder="ابحث في الأخبار... (اضغط Enter للبحث)"
                className="w-full px-4 py-2 pr-10 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-blue" />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={fetchNews}
              className="px-4 py-2 bg-sky-cta text-white rounded-lg hover:bg-sky-cta-hover transition inline-flex items-center"
            >
              <Search className="w-5 h-5 ml-2" />
              بحث
            </button>
            <button
              onClick={fetchNews}
              className="px-4 py-2 bg-sky-bg text-sky-cta rounded-lg hover:bg-sky-cta hover:text-white transition inline-flex items-center"
            >
              <RefreshCw className="w-5 h-5 ml-2" />
              تحديث
            </button>
          </div>
        </div>
      </div>

      {/* News List */}
      <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm">
        <div className="p-6 border-b border-border-blue">
          <h2 className="text-xl font-bold text-charcoal text-right">قائمة الأخبار</h2>
        </div>

        {news.length === 0 ? (
          <div className="p-12 text-center">
            <Newspaper className="w-16 h-16 text-muted-blue mx-auto mb-4 opacity-50" />
            <p className="text-muted-blue text-lg">لا توجد أخبار</p>
            <Link
              to="/news/new"
              className="inline-flex items-center mt-4 text-sky-cta hover:text-sky-cta-hover"
            >
              <Plus className="w-5 h-5 ml-2" />
              إضافة خبر جديد
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border-blue">
            {news.map((item) => (
              <div key={item.id} className="p-6 hover:bg-sky-bg transition">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    {item.image ? (
                      <img
                        src={buildImageUrl(item.image)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg></div>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Newspaper className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 text-right">
                        <h3 className="font-bold text-charcoal text-lg mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-blue mb-2">{item.brief}</p>
                      </div>
                      <div className="mr-4">
                        {item.active === 1 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 ml-1" />
                            نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            <XCircle className="w-3 h-3 ml-1" />
                            غير نشط
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-blue">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <span className="flex items-center">
                          <User className="w-4 h-4 ml-1" />
                          {item.authorName}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 ml-1" />
                          {formatDate(item.addDate)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => {
                            setSelectedNews(item);
                            setShowModal(true);
                          }}
                          className="p-2 text-sky-cta hover:bg-sky-cta hover:text-white rounded-lg transition"
                          title="عرض"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {permissions.canOnResource('news', 'update', item.userId) && (
                          <Link
                            to={`/news/${item.id}/edit`}
                            className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        {permissions.canPublish('news') && (
                          <button
                            onClick={() => handleToggleStatus(item.id, item.active)}
                            className="p-2 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition"
                            title={item.active === 1 ? 'إلغاء التفعيل' : 'تفعيل'}
                          >
                            {item.active === 1 ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        )}
                        {permissions.canOnResource('news', 'delete', item.userId) && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* News Detail Modal */}
      {showModal && selectedNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-charcoal">تفاصيل الخبر</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-2xl font-bold text-charcoal mb-2 text-right">{selectedNews.title}</h4>
                <p className="text-muted-blue text-sm text-right">{selectedNews.brief}</p>
              </div>

              {selectedNews.image && (
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={buildImageUrl(selectedNews.image)} 
                    alt={selectedNews.title} 
                    className="w-full"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg text-right">
                <p className="text-charcoal whitespace-pre-wrap">{selectedNews.body}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-right">
                  <label className="block text-gray-500 mb-1">الكاتب</label>
                  <p className="text-charcoal">{selectedNews.authorName}</p>
                </div>

                <div className="text-right">
                  <label className="block text-gray-500 mb-1">تاريخ الإضافة</label>
                  <p className="text-charcoal">{formatDate(selectedNews.addDate)}</p>
                </div>

                <div className="text-right">
                  <label className="block text-gray-500 mb-1">الحالة</label>
                  <p className="text-charcoal">
                    {selectedNews.active === 1 ? 'نشط' : 'غير نشط'}
                  </p>
                </div>

              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 space-x-reverse">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                إغلاق
              </button>
              <Link
                to={`/news/${selectedNews.id}/edit`}
                className="px-4 py-2 bg-sky-cta text-white rounded-lg hover:bg-sky-cta-hover transition inline-flex items-center"
              >
                <Edit className="w-5 h-5 ml-2" />
                تعديل
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;

