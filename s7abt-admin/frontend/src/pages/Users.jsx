import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MoreVertical,
  Shield,
  Mail,
  User,
  Loader2
} from 'lucide-react';

export default function Users() {
  const { permissions } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter, statusFilter, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchQuery) params.search = searchQuery;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.active = statusFilter;

      const response = await usersAPI.list(params);
      console.log('Users API Response:', response.data);

      // Handle nested data structure from API
      const responseData = response.data.data || response.data;
      setUsers(responseData.users || []);

      if (responseData.pagination) {
        setPagination(responseData.pagination);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('فشل في تحميل قائمة المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      await usersAPI.delete(id);
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error deleting user:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message || 'فشل في حذف المستخدم';
      alert(errorMsg);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      content_manager: 'bg-blue-100 text-blue-700 border-blue-200',
      content_specialist: 'bg-green-100 text-green-700 border-green-200',
      viewer: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    const labels = {
      admin: 'مدير النظام',
      content_manager: 'مدير المحتوى',
      content_specialist: 'أخصائي محتوى',
      viewer: 'مشاهد',
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
        {labels[role] || role}
      </span>
    );
  };

  const getStatusBadge = (active) => {
    return active ? (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
        نشط
      </span>
    ) : (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
        معطل
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-sky-cta" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-readex">المستخدمين</h1>
          <p className="text-gray-500 mt-1 font-rubik">إدارة مستخدمي النظام وصلاحياتهم</p>
        </div>
        {permissions.can('users', 'create') && (
          <Link
            to="/users/new"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-cta text-white rounded-lg hover:bg-sky-cta-hover transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>مستخدم جديد</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-cta focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-cta focus:border-transparent"
            >
              <option value="">كل الأدوار</option>
              <option value="admin">مدير النظام</option>
              <option value="content_manager">مدير المحتوى</option>
              <option value="content_specialist">أخصائي محتوى</option>
              <option value="viewer">مشاهد</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-cta focus:border-transparent"
            >
              <option value="">كل الحالات</option>
              <option value="1">نشط</option>
              <option value="0">معطل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">المستخدم</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">الدور</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">المحتوى</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">تاريخ الانضمام</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold"
                          style={{ display: user.image ? 'none' : 'flex' }}
                        >
                          {user.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.brief && (
                            <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{user.brief}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role || 'viewer')}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.active)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded font-rubik">
                          {user.articleCount || 0} مقالات
                        </span>
                        <span className="px-2 py-1 bg-green-50 text-green-600 rounded font-rubik">
                          {user.newsCount || 0} أخبار
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-rubik">
                      {new Date(user.createdAt || Date.now()).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {permissions.can('users', 'update') && (
                          <Link
                            to={`/users/${user.id}/edit`}
                            className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        )}
                        {permissions.can('users', 'delete') && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {searchQuery || roleFilter || statusFilter !== '' ? 'لا توجد نتائج للبحث' : 'لا يوجد مستخدمين'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500 font-rubik">
              عرض {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                السابق
              </button>
              <div className="flex items-center gap-1">
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const page = i + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= pagination.page - 1 && page <= pagination.page + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setPagination({ ...pagination, page })}
                        className={`px-3 py-2 rounded-lg transition-colors font-rubik ${
                          page === pagination.page
                            ? 'bg-sky-cta text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === pagination.page - 2 || page === pagination.page + 2) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
