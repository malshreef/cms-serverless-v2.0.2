import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import NotificationSettings from '../components/NotificationSettings';
import {
  FileText,
  Newspaper,
  MessageSquare,
  Users,
  Plus,
  Upload,
  Tag,
  Calendar,
  Download,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      setStats(response.data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { name: 'مقال جديد', icon: Plus, color: 'bg-sky-cta', link: '/articles/new' },
    { name: 'المقالات', icon: FileText, color: 'bg-sky-cta', link: '/articles' },
    { name: 'الأقسام', icon: Upload, color: 'bg-sky-cta', link: '/sections' },
    { name: 'الوسوم', icon: Tag, color: 'bg-sky-cta', link: '/tags' },
    { name: 'الأخبار', icon: Newspaper, color: 'bg-sky-cta', link: '#' },
    { name: 'التحليلات', icon: BarChart3, color: 'bg-sky-cta', link: '#' },
  ];

  // Get display name with fallback logic
  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.givenName) return user.givenName;
    if (user?.email) return user.email.split('@')[0];
    return 'مدير';
  };

  // Get article status display
  const getStatusDisplay = (status) => {
    // Handle different status formats
    const normalizedStatus = (status || 'draft').toLowerCase().trim();
    
    switch (normalizedStatus) {
      case 'published':
      case 'منشور':
        return { text: 'منشور', className: 'bg-green-100 text-green-700' };
      case 'archived':
      case 'مؤرشف':
        return { text: 'مؤرشف', className: 'bg-gray-100 text-gray-700' };
      case 'draft':
      case 'مسودة':
      default:
        return { text: 'مسودة', className: 'bg-amber-100 text-amber-700' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-cta"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-right">خطأ في تحميل البيانات: {error}</p>
      </div>
    );
  }

  return (
    
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-readex text-charcoal mb-2">لوحة المعلومات</h2>
        <p className="text-muted-blue">
          مرحباً بعودتك {getDisplayName()}! إليك ما يحدث مع المحتوى الخاص بك
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Articles Card */}
        <div className="bg-cloud-white rounded-lg p-6 border border-border-blue shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-green-500 text-sm font-medium">
              {stats?.articleGrowth || 0}%+
            </span>
            <div className="w-12 h-12 bg-sky-bg rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-sky-cta" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-charcoal mb-1 text-right">
            {stats?.totalArticles || 0}
          </h3>
          <p className="text-muted-blue text-sm text-right">إجمالي المقالات</p>
        </div>

        {/* News Card */}
        <div className="bg-cloud-white rounded-lg p-6 border border-border-blue shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-green-500 text-sm font-medium">
              {stats?.newsGrowth || 0}%+
            </span>
            <div className="w-12 h-12 bg-sky-bg rounded-lg flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-sky-cta" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-charcoal mb-1 text-right">
            {stats?.totalNews || 0}
          </h3>
          <p className="text-muted-blue text-sm text-right">الأخبار</p>
        </div>

        {/* Tweets Card */}
        <div className="bg-cloud-white rounded-lg p-6 border border-border-blue shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-amber-400 text-sm font-medium">42 معلق</span>
            <div className="w-12 h-12 bg-sky-bg rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-sky-cta" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-charcoal mb-1 text-right">
            {stats?.tweetsInQueue || 0}
          </h3>
          <p className="text-muted-blue text-sm text-right">التغريدات في قائمة الانتظار</p>
        </div>

        {/* Users Card */}
        <div className="bg-cloud-white rounded-lg p-6 border border-border-blue shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-green-500 text-sm font-medium">
              {stats?.userGrowth || 0}+
            </span>
            <div className="w-12 h-12 bg-sky-bg rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-sky-cta" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-charcoal mb-1 text-right">
            {stats?.totalUsers || 0}
          </h3>
          <p className="text-muted-blue text-sm text-right">المستخدمون</p>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6 mb-8">
        <h3 className="text-xl font-bold font-readex text-charcoal mb-6 text-right">
          إجراءات سريعة
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const content = (
              <>
                <div className="w-14 h-14 bg-sky-bg group-hover:bg-sky-cta rounded-lg flex items-center justify-center mb-3 transition">
                  <Icon className="w-7 h-7 text-sky-cta group-hover:text-white transition" />
                </div>
                <span className="text-sm font-medium text-charcoal">{action.name}</span>
              </>
            );
            
            if (action.link && action.link !== '#') {
              return (
                <Link
                  key={action.name}
                  to={action.link}
                  className="flex flex-col items-center justify-center p-6 hover:bg-sky-bg rounded-lg transition group"
                >
                  {content}
                </Link>
              );
            }
            
            return (
              <button
                key={action.name}
                className="flex flex-col items-center justify-center p-6 hover:bg-sky-bg rounded-lg transition group opacity-50 cursor-not-allowed"
                disabled
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Articles & Tweet Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Articles */}
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm">
          <div className="p-6 border-b border-border-blue">
            <h3 className="text-xl font-bold font-readex text-charcoal text-right">
              المقالات الأخيرة
            </h3>
          </div>
          <div className="p-6">
            {stats?.recentArticles && stats.recentArticles.length > 0 ? (
              <div className="space-y-4">
                {stats.recentArticles.map((article) => {
                  const statusInfo = getStatusDisplay(article.status);
                  
                  return (
                    <div
                      key={article.id}
                      className="flex items-start space-x-4 space-x-reverse pb-4 border-b border-border-blue last:border-0"
                    >
                      <div className="flex-1 text-right">
                        <h4 className="font-semibold text-charcoal mb-1">{article.title}</h4>
                        <p className="text-sm text-muted-blue mb-2">
                          {new Date(article.createdAt).toLocaleDateString('ar-SA')}
                        </p>
                        <div className="flex items-center justify-end space-x-2 space-x-reverse">
                          {article.sectionName && (
                            <span className="px-2 py-1 bg-sky-bg text-sky-cta text-xs rounded">
                              {article.sectionName}
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded ${statusInfo.className}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-sky-bg rounded-lg flex-shrink-0"></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-blue text-center py-8">لا توجد مقالات حديثة</p>
            )}
            <Link to="/articles" className="block w-full mt-4 text-sky-cta font-medium text-sm hover:text-sky-cta-hover transition text-center">
              عرض جميع المقالات ←
            </Link>
          </div>
        </div>

        {/* Tweet Queue Overview */}
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm">
          <div className="p-6 border-b border-border-blue">
            <h3 className="text-xl font-bold font-readex text-charcoal text-right">
              قائمة انتظار التغريدات
            </h3>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-sky-cta">اليوم الساعة 3:00 م</span>
                <span className="text-sm text-muted-blue">التغريدة التالية</span>
              </div>
              <div className="bg-sky-bg p-4 rounded-lg">
                <p className="text-sm text-charcoal text-right">
                  🚀 اكتشف أفضل الممارسات لاستخدام AWS Lambda في 2025! دليل شامل للمطورين
                  العرب. #AWS #Serverless #CloudComputing
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded">
                  42
                </span>
                <span className="text-sm text-muted-blue">بانتظار الموافقة</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded">
                  98
                </span>
                <span className="text-sm text-muted-blue">مجدولة</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded">
                  1
                </span>
                <span className="text-sm text-muted-blue">نُشرت اليوم</span>
              </div>
            </div>
            <button className="w-full mt-6 bg-sky-cta hover:bg-sky-cta-hover text-white font-medium py-2 rounded-lg transition">
              إدارة قائمة التغريدات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

