import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articlesAPI, newsAPI, tweetsAPI, usersAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
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
  const { user, permissions } = useAuth();
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalNews: 0,
    totalTweets: 0,
    pendingTweets: 0,
    postedTweets: 0,
    failedTweets: 0,
    nextTweet: null,
    totalUsers: 0,
    newArticlesThisWeek: 0,
    publishedArticles: 0,
    activeNews: 0,
    recentArticles: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch articles
      const articlesResponse = await articlesAPI.list({ limit: 5, page: 1 });
      const articlesData = articlesResponse.data?.data || articlesResponse.data || {};
      const articles = articlesData.articles || [];
      const totalArticles = articlesData.pagination?.total || articles.length;
      
      // Calculate articles created in last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newArticlesThisWeek = articles.filter(article => {
        const createdDate = new Date(article.createdAt);
        return createdDate >= oneWeekAgo;
      }).length;
      
      // Count published articles
      const publishedArticles = articles.filter(a => a.status === 'published').length;
      
      // Fetch news
      let totalNews = 0;
      let activeNews = 0;
      try {
        const newsResponse = await newsAPI.list({ limit: 10, page: 1 });
        const newsData = newsResponse.data?.data || newsResponse.data || {};
        const newsList = newsData.news || [];
        totalNews = newsData.pagination?.total || 0;
        activeNews = newsList.filter(n => n.active === 1).length;
      } catch (newsErr) {
        console.log('News not available:', newsErr);
      }
      
      // Fetch tweets from API (only if user has permission)
      let totalTweets = 0;
      let pendingTweets = 0;
      let postedTweets = 0;
      let failedTweets = 0;
      let nextTweet = null;

      if (permissions.can('tweets', 'list')) {
        try {
          const tweetsResponse = await tweetsAPI.list();
          const tweetsData = tweetsResponse.data?.data || tweetsResponse.data || {};
          const tweets = tweetsData.tweets || [];

          totalTweets = tweets.length;
          pendingTweets = tweets.filter(t => t.status === 'pending').length;
          postedTweets = tweets.filter(t => t.status === 'posted').length;
          failedTweets = tweets.filter(t => t.status === 'failed').length;

          // Get next scheduled tweet
          const pendingList = tweets
            .filter(t => t.status === 'pending')
            .sort((a, b) => a.scheduled_time - b.scheduled_time);
          nextTweet = pendingList.length > 0 ? pendingList[0] : null;
        } catch (tweetsErr) {
          console.log('Tweets not available:', tweetsErr);
        }
      }

      // Fetch users count (only if user has permission)
      let totalUsers = 0;
      if (permissions.can('users', 'list')) {
        try {
          const usersResponse = await usersAPI.list({ limit: 1, page: 1 });
          const usersData = usersResponse.data?.data || usersResponse.data || {};
          totalUsers = usersData.pagination?.total || 0;
        } catch (usersErr) {
          console.log('Users not available:', usersErr);
        }
      }

      setStats({
        totalArticles,
        totalNews,
        totalTweets,
        pendingTweets,
        postedTweets,
        failedTweets,
        nextTweet,
        totalUsers,
        newArticlesThisWeek,
        publishedArticles,
        activeNews,
        recentArticles: articles,
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter quick actions based on user permissions
  const allQuickActions = [
    { name: 'مقال جديد', icon: Plus, color: 'bg-sky-cta', link: '/articles/new', resource: 'articles', action: 'create' },
    { name: 'المقالات', icon: FileText, color: 'bg-sky-cta', link: '/articles', resource: 'articles', action: 'list' },
    { name: 'الأقسام', icon: Upload, color: 'bg-sky-cta', link: '/sections', resource: 'sections', action: 'list' },
    { name: 'الوسوم', icon: Tag, color: 'bg-sky-cta', link: '/tags', resource: 'tags', action: 'list' },
    { name: 'الأخبار', icon: Newspaper, color: 'bg-sky-cta', link: '/news', resource: 'news', action: 'list' },
    { name: 'التحليلات', icon: BarChart3, color: 'bg-sky-cta', link: '/insights', resource: 'analytics', action: 'read' },
  ];

  const quickActions = allQuickActions.filter(action =>
    permissions.can(action.resource, action.action)
  );

  const buildImageUrl = (imageKey) => {
    if (!imageKey || imageKey === 'no-image.png') return null;
    if (imageKey.startsWith('http')) return imageKey;
    const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || 'https://<your-s3-bucket>.s3.me-central-1.amazonaws.com';
    return `${S3_BASE_URL}/${imageKey}`;
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
          مرحباً بعودتك &nbsp;
           {user?.name || user?.email?.split('@')[0] || 'مدير'}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Articles Card */}
        <div className="bg-cloud-white rounded-lg p-6 border border-border-blue shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-blue-500 text-sm font-medium">
              {stats.newArticlesThisWeek} جديد هذا الأسبوع
            </span>
            <div className="w-12 h-12 bg-sky-bg rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-sky-cta" />
            </div>
          </div>
          <h3 className="text-4xl font-bold text-charcoal mb-1 text-right">
            {stats.totalArticles}
          </h3>
          <p className="text-muted-blue text-sm text-right">إجمالي المقالات</p>
        </div>

        {/* News Card */}
        <div className="bg-cloud-white rounded-lg p-6 border border-border-blue shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-green-500 text-sm font-medium">
              {stats.activeNews} نشط
            </span>
            <div className="w-12 h-12 bg-sky-bg rounded-lg flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-sky-cta" />
            </div>
          </div>
          <h3 className="text-4xl font-bold text-charcoal mb-1 text-right">
            {stats.totalNews}
          </h3>
          <p className="text-muted-blue text-sm text-right">الأخبار</p>
        </div>

        {/* Tweets Card - Only show if user has permission */}
        {permissions.can('tweets', 'list') && (
          <div className="bg-cloud-white rounded-lg p-6 border border-border-blue shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <span className="text-amber-400 text-sm font-medium">{stats.pendingTweets} بانتظار النشر</span>
              <div className="w-12 h-12 bg-sky-bg rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-sky-cta" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-charcoal mb-1 text-right">
              {stats.totalTweets}
            </h3>
            <p className="text-muted-blue text-sm text-right">إجمالي التغريدات</p>
          </div>
        )}

        {/* Users Card - Only show if user has permission */}
        {permissions.can('users', 'list') && (
          <div className="bg-cloud-white rounded-lg p-6 border border-border-blue shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-sky-bg rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-sky-cta" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-charcoal mb-1 text-right">
              {stats.totalUsers}
            </h3>
            <p className="text-muted-blue text-sm text-right">المستخدمون</p>
          </div>
        )}
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
            {stats.recentArticles && stats.recentArticles.length > 0 ? (
              <div className="space-y-4">
                {stats.recentArticles.map((article) => {
                  const imageUrl = buildImageUrl(article.mainImage);
                  
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
                          {article.section?.name && (
                            <span className="px-2 py-1 bg-sky-bg text-sky-cta text-xs rounded">
                              {article.section.name}
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              article.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {article.status === 'published' ? 'منشور' : 'مسودة'}
                          </span>
                        </div>
                      </div>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={article.title}
                          className="w-16 h-16 rounded-lg flex-shrink-0 object-cover"
                          onError={(e) => {
                            console.log('Image failed to load:', imageUrl);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <div className="w-16 h-16 bg-sky-bg rounded-lg flex-shrink-0" style={{ display: imageUrl ? 'none' : 'block' }}></div>
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

        {/* Tweet Queue Overview - Only show if user has permission */}
        {permissions.can('tweets', 'list') && (
          <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm">
            <div className="p-6 border-b border-border-blue">
              <h3 className="text-xl font-bold font-readex text-charcoal text-right">
                قائمة انتظار التغريدات
              </h3>
            </div>
            <div className="p-6">
              {stats.nextTweet ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-sky-cta">
                        {new Date(stats.nextTweet.scheduled_time).toLocaleString('ar-SA', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-sm text-muted-blue">التغريدة التالية</span>
                    </div>
                    <div className="bg-sky-bg p-4 rounded-lg">
                      <p className="text-sm text-charcoal text-right">
                        {stats.nextTweet.tweet_text}
                      </p>
                    </div>
                  </div>
                ) : null}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded">
                    {stats.pendingTweets}
                  </span>
                  <span className="text-sm text-muted-blue">بانتظار النشر</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded">
                    {stats.postedTweets}
                  </span>
                  <span className="text-sm text-muted-blue">تم النشر</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded">
                    {stats.failedTweets}
                  </span>
                  <span className="text-sm text-muted-blue">فشل</span>
                </div>
              </div>
              <Link to="/tweets" className="block w-full mt-6 bg-sky-cta hover:bg-sky-cta-hover text-white font-medium py-2 rounded-lg transition text-center">
                إدارة قائمة التغريدات
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

