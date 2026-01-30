import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Send,
  RefreshCw,
} from 'lucide-react';
import { tweetsAPI } from '../lib/api';

const Tweets = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, posted, failed
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTweet, setSelectedTweet] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTweets();
  }, [filter]);

  const fetchTweets = async () => {
    setLoading(true);
    try {
      const params = {};
      
      // Add status filter if not 'all'
      if (filter !== 'all') {
        params.status = filter;
      }
      
      // Add search term if provided
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await tweetsAPI.list(params);
      console.log('Tweets API response:', response.data);
      
      // Handle response structure
      const tweetsData = response.data.data?.tweets || response.data.tweets || response.data || [];
      setTweets(Array.isArray(tweetsData) ? tweetsData : []);
    } catch (error) {
      console.error('Error fetching tweets:', error);
      alert('فشل في تحميل التغريدات');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTweets();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchTweets();
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: Clock,
        text: 'بانتظار النشر',
        className: 'bg-amber-100 text-amber-700',
      },
      posted: {
        icon: CheckCircle,
        text: 'تم النشر',
        className: 'bg-green-100 text-green-700',
      },
      failed: {
        icon: XCircle,
        text: 'فشل',
        className: 'bg-red-100 text-red-700',
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
        <Icon className="w-3 h-3 ml-1" />
        {badge.text}
      </span>
    );
  };

  const getToneBadge = (tone) => {
    return tone === 'professional' ? (
      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">احترافي</span>
    ) : (
      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">ودي</span>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async (tweetId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه التغريدة؟')) return;
    
    try {
      await tweetsAPI.delete(tweetId);
      setTweets(tweets.filter(t => t.tweet_id !== tweetId));
      alert('تم حذف التغريدة بنجاح');
    } catch (error) {
      console.error('Error deleting tweet:', error);
      alert('فشل في حذف التغريدة');
    }
  };

  const handleApprove = async (tweetId) => {
    try {
      await tweetsAPI.approve(tweetId);
      setTweets(tweets.map(t => 
        t.tweet_id === tweetId ? { ...t, status: 'pending' } : t
      ));
      alert('تم الموافقة على التغريدة');
    } catch (error) {
      console.error('Error approving tweet:', error);
      alert('فشل في الموافقة على التغريدة');
    }
  };

  const handlePublish = async (tweetId) => {
    if (!window.confirm('هل تريد نشر هذه التغريدة الآن؟')) return;
    
    try {
      await tweetsAPI.publish(tweetId);
      setTweets(tweets.map(t => 
        t.tweet_id === tweetId ? { ...t, status: 'posted', posted_time: Date.now() } : t
      ));
      alert('تم نشر التغريدة بنجاح');
    } catch (error) {
      console.error('Error publishing tweet:', error);
      alert('فشل في نشر التغريدة');
    }
  };

  const stats = {
    total: tweets.length,
    pending: tweets.filter(t => t.status === 'pending').length,
    posted: tweets.filter(t => t.status === 'posted').length,
    failed: tweets.filter(t => t.status === 'failed').length,
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
          <h1 className="text-3xl font-bold text-charcoal font-readex">إدارة التغريدات</h1>
          <p className="text-muted-blue mt-1">إدارة قائمة انتظار التغريدات والنشر التلقائي</p>
        </div>
        <Link
          to="/tweets/generate"
          className="inline-flex items-center px-4 py-2 bg-sky-cta text-white rounded-lg hover:bg-sky-cta-hover transition"
        >
          <Plus className="w-5 h-5 ml-2" />
          إنشاء تغريدات من مقال
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className="text-sm text-muted-blue mb-1">إجمالي التغريدات</p>
              <p className="text-3xl font-bold text-charcoal">{stats.total}</p>
            </div>
            <div className="p-3 bg-sky-bg rounded-lg">
              <MessageSquare className="w-6 h-6 text-sky-cta" />
            </div>
          </div>
        </div>

        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className="text-sm text-muted-blue mb-1">بانتظار النشر</p>
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className="text-sm text-muted-blue mb-1">تم النشر</p>
              <p className="text-3xl font-bold text-green-600">{stats.posted}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className="text-sm text-muted-blue mb-1">فشل</p>
              <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-charcoal mb-2 text-right">الحالة</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right"
            >
              <option value="all">الكل</option>
              <option value="pending">بانتظار النشر</option>
              <option value="posted">تم النشر</option>
              <option value="failed">فشل</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-charcoal mb-2 text-right">البحث</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder="ابحث في التغريدات... (اضغط Enter)"
                className="w-full px-4 py-2 pr-10 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-blue" />
            </div>
          </div>

          {/* Search and Refresh Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-sky-cta text-white rounded-lg hover:bg-sky-cta-hover transition inline-flex items-center"
            >
              <Search className="w-5 h-5 ml-2" />
              بحث
            </button>
            <button
              onClick={fetchTweets}
              className="px-4 py-2 bg-sky-bg text-sky-cta rounded-lg hover:bg-sky-cta hover:text-white transition inline-flex items-center"
            >
              <RefreshCw className="w-5 h-5 ml-2" />
              تحديث
            </button>
          </div>
        </div>
      </div>

      {/* Tweets List */}
      <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-blue">
            <thead className="bg-sky-bg">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-charcoal uppercase tracking-wider">
                  التغريدة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-charcoal uppercase tracking-wider">
                  المقال
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-charcoal uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-charcoal uppercase tracking-wider">
                  موعد النشر
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-charcoal uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border-blue">
              {tweets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-blue">
                    لا توجد تغريدات
                  </td>
                </tr>
              ) : (
                tweets.map((tweet) => (
                  <tr key={tweet.tweet_id} className="hover:bg-sky-bg transition">
                    <td className="px-6 py-4">
                      <div className="text-sm text-charcoal text-right max-w-md">
                        <p className="line-clamp-2">{tweet.tweet_text}</p>
                        <div className="flex gap-2 mt-2">
                          {getToneBadge(tweet.tone)}
                          <span className="text-xs text-muted-blue">تسلسل: {tweet.sequence}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal text-right">
                      {tweet.article_title || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tweet.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal text-right">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(tweet.scheduled_time)}
                        </span>
                        {tweet.posted_time && (
                          <span className="text-xs text-green-600">
                            نُشر: {formatDate(tweet.posted_time)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setSelectedTweet(tweet);
                            setShowModal(true);
                          }}
                          className="text-sky-cta hover:text-sky-cta-hover"
                          title="عرض"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {tweet.status === 'pending' && (
                          <button
                            onClick={() => handlePublish(tweet.tweet_id)}
                            className="text-green-600 hover:text-green-700"
                            title="نشر الآن"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(tweet.tweet_id)}
                          className="text-red-600 hover:text-red-700"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {showModal && selectedTweet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-charcoal">تفاصيل التغريدة</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-muted-blue hover:text-charcoal"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2 text-right">
                    نص التغريدة
                  </label>
                  <div className="p-4 bg-sky-bg rounded-lg text-right whitespace-pre-wrap">
                    {selectedTweet.tweet_text}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2 text-right">
                      الحالة
                    </label>
                    {getStatusBadge(selectedTweet.status)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2 text-right">
                      الأسلوب
                    </label>
                    {getToneBadge(selectedTweet.tone)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2 text-right">
                    المقال المرتبط
                  </label>
                  <p className="text-charcoal">{selectedTweet.article_title || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2 text-right">
                    موعد النشر المجدول
                  </label>
                  <p className="text-charcoal">{formatDate(selectedTweet.scheduled_time)}</p>
                </div>

                {selectedTweet.posted_time && (
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2 text-right">
                      تاريخ النشر الفعلي
                    </label>
                    <p className="text-green-600">{formatDate(selectedTweet.posted_time)}</p>
                  </div>
                )}

                {selectedTweet.twitter_tweet_id && (
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2 text-right">
                      رابط التغريدة
                    </label>
                    <a
                      href={`https://twitter.com/i/web/status/${selectedTweet.twitter_tweet_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-cta hover:underline"
                    >
                      عرض على تويتر
                    </a>
                  </div>
                )}

                {selectedTweet.hashtags && selectedTweet.hashtags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2 text-right">
                      الهاشتاجات
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTweet.hashtags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-sky-bg text-sky-cta text-sm rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border-blue rounded-lg hover:bg-sky-bg transition"
                >
                  إغلاق
                </button>
                {selectedTweet.status === 'pending' && (
                  <button
                    onClick={() => {
                      handlePublish(selectedTweet.tweet_id);
                      setShowModal(false);
                    }}
                    className="px-4 py-2 bg-sky-cta text-white rounded-lg hover:bg-sky-cta-hover transition"
                  >
                    نشر الآن
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tweets;

