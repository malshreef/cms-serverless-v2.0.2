import { useState, useEffect } from 'react';
import { commentsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  MessageCircle,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  User,
  RefreshCw,
  FileText,
  Eye,
  Clock,
} from 'lucide-react';

const Comments = () => {
  const { permissions } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedComment, setSelectedComment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [filter, currentPage]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
      };

      if (filter !== 'all') {
        params.status = filter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await commentsAPI.list(params);

      let commentsData = [];
      if (response.data?.data?.comments) {
        commentsData = response.data.data.comments;
      } else if (response.data?.comments) {
        commentsData = response.data.comments;
      } else if (response.data?.data) {
        commentsData = Array.isArray(response.data.data) ? response.data.data : [];
      }

      setComments(Array.isArray(commentsData) ? commentsData : []);

      const pagination = response.data?.data?.pagination || response.data?.pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      alert('حدث خطأ في تحميل التعليقات: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (commentId, newStatus) => {
    setActionLoading(commentId);
    try {
      await commentsAPI.updateStatus(commentId, { active: newStatus });
      setComments(comments.map(c =>
        c.id === commentId ? { ...c, active: newStatus } : c
      ));
      alert(newStatus === 1 ? 'تم اعتماد التعليق' : 'تم رفض التعليق');
    } catch (error) {
      console.error('Error updating comment status:', error);
      alert('حدث خطأ في تحديث حالة التعليق');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;

    setActionLoading(commentId);
    try {
      await commentsAPI.delete(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      if (showModal && selectedComment?.id === commentId) {
        setShowModal(false);
        setSelectedComment(null);
      }
      alert('تم حذف التعليق بنجاح');
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('حدث خطأ في حذف التعليق');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    const normalized = dateString.replace(' ', 'T');
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return 'غير محدد';
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const stats = {
    total: comments.length,
    pending: comments.filter(c => c.active === 0).length,
    approved: comments.filter(c => c.active === 1).length,
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
          <h1 className="text-3xl font-bold text-charcoal font-readex">إدارة التعليقات</h1>
          <p className="text-muted-blue mt-1">مراجعة واعتماد تعليقات القراء</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className="text-sm text-muted-blue mb-1">إجمالي التعليقات</p>
              <p className="text-3xl font-bold text-charcoal">{stats.total}</p>
            </div>
            <div className="p-3 bg-sky-bg rounded-lg">
              <MessageCircle className="w-6 h-6 text-sky-cta" />
            </div>
          </div>
        </div>

        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className="text-sm text-muted-blue mb-1">بانتظار المراجعة</p>
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
              <p className="text-sm text-muted-blue mb-1">معتمد</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
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
              onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right"
            >
              <option value="all">الكل</option>
              <option value="pending">بانتظار المراجعة</option>
              <option value="approved">معتمد</option>
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
                    setCurrentPage(1);
                    fetchComments();
                  }
                }}
                placeholder="ابحث في التعليقات... (اضغط Enter للبحث)"
                className="w-full px-4 py-2 pr-10 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-blue" />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => { setCurrentPage(1); fetchComments(); }}
              className="px-4 py-2 bg-sky-cta text-white rounded-lg hover:bg-sky-cta-hover transition inline-flex items-center"
            >
              <Search className="w-5 h-5 ml-2" />
              بحث
            </button>
            <button
              onClick={fetchComments}
              className="px-4 py-2 bg-sky-bg text-sky-cta rounded-lg hover:bg-sky-cta hover:text-white transition inline-flex items-center"
            >
              <RefreshCw className="w-5 h-5 ml-2" />
              تحديث
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm">
        <div className="p-6 border-b border-border-blue">
          <h2 className="text-xl font-bold text-charcoal text-right">قائمة التعليقات</h2>
        </div>

        {comments.length === 0 ? (
          <div className="p-12 text-center">
            <MessageCircle className="w-16 h-16 text-muted-blue mx-auto mb-4 opacity-50" />
            <p className="text-muted-blue text-lg">لا توجد تعليقات</p>
          </div>
        ) : (
          <div className="divide-y divide-border-blue">
            {comments.map((item) => (
              <div key={item.id} className="p-6 hover:bg-sky-bg transition">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-12 h-12 bg-sky-cta rounded-full flex items-center justify-center text-white font-bold">
                    {(item.userName || '?')[0].toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-2 mb-1 justify-end">
                          <span className="font-bold text-charcoal">{item.userName}</span>
                          <span className="text-xs text-muted-blue">({item.userEmail})</span>
                        </div>
                        <p className="text-sm text-charcoal mb-2">{truncateText(item.body, 200)}</p>
                        {item.articleTitle && (
                          <div className="flex items-center gap-1 text-xs text-muted-blue justify-end">
                            <span>{item.articleTitle}</span>
                            <FileText className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div className="mr-4">
                        {item.active === 1 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 ml-1" />
                            معتمد
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <Clock className="w-3 h-3 ml-1" />
                            بانتظار المراجعة
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-blue">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 ml-1" />
                          {formatDate(item.addDate)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => {
                            setSelectedComment(item);
                            setShowModal(true);
                          }}
                          className="p-2 text-sky-cta hover:bg-sky-cta hover:text-white rounded-lg transition"
                          title="عرض"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {permissions.can('comments', 'update') && (
                          item.active === 0 ? (
                            <button
                              onClick={() => handleUpdateStatus(item.id, 1)}
                              disabled={actionLoading === item.id}
                              className="p-2 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition disabled:opacity-50"
                              title="اعتماد"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(item.id, 0)}
                              disabled={actionLoading === item.id}
                              className="p-2 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition disabled:opacity-50"
                              title="إلغاء الاعتماد"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )
                        )}
                        {permissions.can('comments', 'delete') && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={actionLoading === item.id}
                            className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition disabled:opacity-50"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg transition ${
                currentPage === page
                  ? 'bg-sky-cta text-white'
                  : 'bg-cloud-white text-muted-blue border border-border-blue hover:bg-sky-bg'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Comment Detail Modal */}
      {showModal && selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-charcoal">تفاصيل التعليق</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Author Info */}
              <div className="flex items-center gap-3 justify-end">
                <div className="text-right">
                  <div className="font-bold text-charcoal">{selectedComment.userName}</div>
                  <div className="text-sm text-muted-blue">{selectedComment.userEmail}</div>
                </div>
                <div className="w-12 h-12 bg-sky-cta rounded-full flex items-center justify-center text-white font-bold">
                  {(selectedComment.userName || '?')[0].toUpperCase()}
                </div>
              </div>

              {/* Comment Body */}
              <div className="bg-gray-50 p-4 rounded-lg text-right">
                <p className="text-charcoal whitespace-pre-wrap">{selectedComment.body}</p>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-right">
                  <label className="block text-gray-500 mb-1">المقال</label>
                  <p className="text-charcoal">{selectedComment.articleTitle || 'غير محدد'}</p>
                </div>
                <div className="text-right">
                  <label className="block text-gray-500 mb-1">تاريخ الإضافة</label>
                  <p className="text-charcoal">{formatDate(selectedComment.addDate)}</p>
                </div>
                <div className="text-right">
                  <label className="block text-gray-500 mb-1">الحالة</label>
                  <p className="text-charcoal">
                    {selectedComment.active === 1 ? 'معتمد' : 'بانتظار المراجعة'}
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
              {permissions.can('comments', 'update') && (
                selectedComment.active === 0 ? (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedComment.id, 1);
                      setSelectedComment({ ...selectedComment, active: 1 });
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition inline-flex items-center"
                  >
                    <CheckCircle className="w-5 h-5 ml-2" />
                    اعتماد
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedComment.id, 0);
                      setSelectedComment({ ...selectedComment, active: 0 });
                    }}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition inline-flex items-center"
                  >
                    <XCircle className="w-5 h-5 ml-2" />
                    إلغاء الاعتماد
                  </button>
                )
              )}
              {permissions.can('comments', 'delete') && (
                <button
                  onClick={() => handleDelete(selectedComment.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition inline-flex items-center"
                >
                  <Trash2 className="w-5 h-5 ml-2" />
                  حذف
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comments;
