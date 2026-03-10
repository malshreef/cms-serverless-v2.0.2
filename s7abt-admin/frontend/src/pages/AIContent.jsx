import { useState, useEffect, useCallback } from 'react';
import { aiContentAPI, sectionsAPI } from '../lib/api';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Plus,
  RefreshCw,
  Zap,
  FileText,
  Newspaper,
} from 'lucide-react';

const STATUS_MAP = {
  suggested: { label: 'مقترح', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  approved: { label: 'معتمد', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  generating: { label: 'جاري الإنشاء', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  generated: { label: 'تم الإنشاء', color: 'bg-green-100 text-green-700 border-green-200' },
  failed: { label: 'فشل', color: 'bg-red-100 text-red-700 border-red-200' },
  rejected: { label: 'مرفوض', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const TYPE_MAP = {
  article: { label: 'مقال', icon: FileText },
  news: { label: 'خبر', icon: Newspaper },
};

const AIContent = () => {
  const [topics, setTopics] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [filters, setFilters] = useState({ status: '', type: '', page: 1 });
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: '', title_en: '', description: '', type: 'article', section_id: 1,
  });

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: filters.page, limit: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;

      const response = await aiContentAPI.listTopics(params);
      const data = response.data?.data || response.data || {};
      setTopics(data.topics || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('فشل في تحميل المواضيع');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchSections = async () => {
    try {
      const response = await sectionsAPI.list();
      const data = response.data?.data || response.data || {};
      setSections(data.sections || data || []);
    } catch (err) {
      console.error('Error fetching sections:', err);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    fetchSections();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleApprove = async (topicId) => {
    setActionLoading(topicId);
    try {
      await aiContentAPI.updateTopic(topicId, { action: 'approve' });
      showSuccess('تم اعتماد الموضوع');
      fetchTopics();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل في اعتماد الموضوع');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (topicId) => {
    setActionLoading(topicId);
    try {
      await aiContentAPI.updateTopic(topicId, { action: 'reject' });
      showSuccess('تم رفض الموضوع');
      fetchTopics();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل في رفض الموضوع');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerate = async (topicId) => {
    setActionLoading(topicId);
    try {
      const response = await aiContentAPI.generateContent(topicId);
      const data = response.data?.data || response.data || {};
      showSuccess(data.message || 'تم إنشاء المحتوى بنجاح');
      fetchTopics();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل في إنشاء المحتوى');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuggest = async () => {
    setActionLoading('suggest');
    try {
      const response = await aiContentAPI.suggestTopics();
      const data = response.data?.data || response.data || {};
      showSuccess(data.message || 'تم اقتراح مواضيع جديدة');
      fetchTopics();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل في اقتراح المواضيع');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.title.trim()) return;
    setActionLoading('create');
    try {
      await aiContentAPI.createTopic(newTopic);
      showSuccess('تم إضافة الموضوع');
      setShowCreateModal(false);
      setNewTopic({ title: '', title_en: '', description: '', type: 'article', section_id: 1 });
      fetchTopics();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل في إضافة الموضوع');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = STATUS_MAP[status] || STATUS_MAP.suggested;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>
        {s.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const t = TYPE_MAP[type] || TYPE_MAP.article;
    const Icon = t.icon;
    return (
      <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200">
        <Icon className="w-3 h-3 ml-1" />
        {t.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal font-readex">المحتوى الذكي</h1>
          <p className="text-muted-blue mt-1">
            إدارة المواضيع المقترحة بالذكاء الاصطناعي وإنشاء المقالات والأخبار
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSuggest}
            disabled={actionLoading === 'suggest'}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            {actionLoading === 'suggest' ? (
              <Loader className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 ml-2" />
            )}
            اقتراح مواضيع
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-sky-cta text-white rounded-lg hover:bg-sky-cta-hover transition"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة موضوع
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 ml-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-right">
            <p className="text-red-800 font-semibold">خطأ</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 mr-2">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 ml-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-right">
            <p className="text-green-700 text-sm">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-blue">الحالة:</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="border border-border-blue rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">الكل</option>
              <option value="suggested">مقترح</option>
              <option value="approved">معتمد</option>
              <option value="generating">جاري الإنشاء</option>
              <option value="generated">تم الإنشاء</option>
              <option value="failed">فشل</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-blue">النوع:</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              className="border border-border-blue rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">الكل</option>
              <option value="article">مقال</option>
              <option value="news">خبر</option>
            </select>
          </div>
          <button
            onClick={() => fetchTopics()}
            className="inline-flex items-center px-3 py-1.5 text-sm text-muted-blue hover:text-charcoal transition"
          >
            <RefreshCw className="w-4 h-4 ml-1" />
            تحديث
          </button>
        </div>
      </div>

      {/* Topics Table */}
      <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-8 h-8 text-sky-cta animate-spin" />
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-16 text-muted-blue">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">لا توجد مواضيع</p>
            <p className="text-sm mt-2">اضغط "اقتراح مواضيع" للحصول على اقتراحات من الذكاء الاصطناعي</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-blue">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-blue uppercase">العنوان</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-blue uppercase">النوع</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-blue uppercase">الحالة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-blue uppercase">المصدر</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-blue uppercase">الأسبوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-blue uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border-blue">
                {topics.map((topic) => (
                  <tr key={topic.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="text-right">
                        <p className="font-medium text-charcoal text-sm">{topic.title}</p>
                        {topic.title_en && (
                          <p className="text-xs text-muted-blue mt-1 ltr">{topic.title_en}</p>
                        )}
                        {topic.description && (
                          <p className="text-xs text-muted-blue mt-1 line-clamp-2">{topic.description}</p>
                        )}
                        {topic.error && (
                          <p className="text-xs text-red-500 mt-1">{topic.error}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {getTypeBadge(topic.type)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {getStatusBadge(topic.status)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-xs text-muted-blue">
                        {topic.source === 'ai_suggested' ? 'ذكاء اصطناعي' : 'يدوي'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-xs text-muted-blue font-mono">{topic.week}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        {topic.status === 'suggested' && (
                          <>
                            <button
                              onClick={() => handleApprove(topic.id)}
                              disabled={actionLoading === topic.id}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                              title="اعتماد"
                            >
                              {actionLoading === topic.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3 ml-1" />
                              )}
                              اعتماد
                            </button>
                            <button
                              onClick={() => handleReject(topic.id)}
                              disabled={actionLoading === topic.id}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                              title="رفض"
                            >
                              <XCircle className="w-3 h-3 ml-1" />
                              رفض
                            </button>
                          </>
                        )}
                        {(topic.status === 'approved' || topic.status === 'failed') && (
                          <button
                            onClick={() => handleGenerate(topic.id)}
                            disabled={actionLoading === topic.id}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                            title="إنشاء المحتوى"
                          >
                            {actionLoading === topic.id ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <Zap className="w-3 h-3 ml-1" />
                            )}
                            إنشاء
                          </button>
                        )}
                        {topic.status === 'generated' && topic.article_id && (
                          <a
                            href={`/articles/${topic.article_id}`}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                          >
                            <FileText className="w-3 h-3 ml-1" />
                            عرض المقال
                          </a>
                        )}
                        {topic.status === 'generating' && (
                          <span className="inline-flex items-center text-xs text-purple-600">
                            <Loader className="w-3 h-3 ml-1 animate-spin" />
                            جاري الإنشاء...
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-border-blue">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page <= 1}
              className="px-3 py-1.5 text-sm border border-border-blue rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <span className="text-sm text-muted-blue">
              صفحة {filters.page} من {totalPages}
            </span>
            <button
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page >= totalPages}
              className="px-3 py-1.5 text-sm border border-border-blue rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {/* Create Topic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-border-blue">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-charcoal">إضافة موضوع جديد</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateTopic} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1 text-right">
                  العنوان (عربي) *
                </label>
                <input
                  type="text"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  className="w-full border border-border-blue rounded-lg px-4 py-2 text-right"
                  placeholder="عنوان الموضوع بالعربية"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1 text-right">
                  العنوان (إنجليزي)
                </label>
                <input
                  type="text"
                  value={newTopic.title_en}
                  onChange={(e) => setNewTopic({ ...newTopic, title_en: e.target.value })}
                  className="w-full border border-border-blue rounded-lg px-4 py-2 ltr text-left"
                  placeholder="Topic title in English"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1 text-right">
                  الوصف
                </label>
                <textarea
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                  rows={3}
                  className="w-full border border-border-blue rounded-lg px-4 py-2 text-right"
                  placeholder="وصف مختصر للموضوع"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1 text-right">
                    النوع
                  </label>
                  <select
                    value={newTopic.type}
                    onChange={(e) => setNewTopic({ ...newTopic, type: e.target.value })}
                    className="w-full border border-border-blue rounded-lg px-4 py-2"
                  >
                    <option value="article">مقال</option>
                    <option value="news">خبر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1 text-right">
                    القسم
                  </label>
                  <select
                    value={newTopic.section_id}
                    onChange={(e) => setNewTopic({ ...newTopic, section_id: parseInt(e.target.value) })}
                    className="w-full border border-border-blue rounded-lg px-4 py-2"
                  >
                    {sections.map((section) => (
                      <option key={section.id || section.s7b_section_id} value={section.id || section.s7b_section_id}>
                        {section.name || section.s7b_section_name_ar || section.s7b_section_name}
                      </option>
                    ))}
                    {sections.length === 0 && <option value="1">عام</option>}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-blue">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create' || !newTopic.title.trim()}
                  className="inline-flex items-center px-4 py-2 bg-sky-cta text-white rounded-lg hover:bg-sky-cta-hover transition disabled:opacity-50"
                >
                  {actionLoading === 'create' ? (
                    <Loader className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 ml-2" />
                  )}
                  إضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIContent;
