import { useState, useEffect } from 'react';
import { tagsAPI } from '../lib/api';
import { Tag, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Tags = () => {
  const { permissions } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await tagsAPI.list();
      // Handle different response formats
      const tagsData = response.data?.tags || response.data?.data?.tags || response.data?.data?.data || response.data?.data || [];
      setTags(Array.isArray(tagsData) ? tagsData : []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTag(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name });
    setShowModal(true);
  };

  const handleDelete = async (tag) => {
    const articleCount = tag.articleCount || 0;
    let confirmMessage;
    
    if (articleCount > 0) {
      confirmMessage = `هذا الوسم مستخدم في ${articleCount} مقالة.\n\nحذف الوسم سيؤدي إلى إزالته من جميع المقالات.\nالمقالات نفسها لن تتأثر.\n\nهل تريد المتابعة؟`;
    } else {
      confirmMessage = `هل أنت متأكد من حذف الوسم "${tag.name}"؟`;
    }
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await tagsAPI.delete(tag.id);
      fetchTags();
      alert('تم حذف الوسم بنجاح');
    } catch (err) {
      alert('خطأ في حذف الوسم: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم الوسم');
      return;
    }

    try {
      setSaving(true);
      if (editingTag) {
        await tagsAPI.update(editingTag.id, formData);
        alert('تم تحديث الوسم بنجاح');
      } else {
        await tagsAPI.create(formData);
        alert('تم إضافة الوسم بنجاح');
      }
      setShowModal(false);
      fetchTags();
    } catch (err) {
      alert('خطأ في حفظ الوسم: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
          <h2 className="text-3xl font-bold font-readex text-charcoal mb-2">الوسوم</h2>
          <p className="text-muted-blue">إدارة وسوم المقالات ({tags.length} وسم)</p>
        </div>
        {permissions.can('tags', 'create') && (
          <button
            onClick={handleAdd}
            className="bg-sky-cta hover:bg-sky-cta-hover text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 space-x-reverse transition"
          >
            <Plus className="w-5 h-5" />
            <span>وسم جديد</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600 text-right">خطأ في تحميل الوسوم: {error}</p>
        </div>
      )}

      {/* Tags Grid */}
      <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
        {tags.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 text-muted-blue mx-auto mb-4" />
            <p className="text-muted-blue text-lg">لا توجد وسوم</p>
            <button
              onClick={handleAdd}
              className="mt-4 text-sky-cta hover:text-sky-cta-hover font-medium"
            >
              إضافة وسم جديد
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="group bg-sky-bg border border-border-blue rounded-lg px-4 py-3 flex items-center space-x-3 space-x-reverse hover:bg-sky-cta hover:border-sky-cta transition"
              >
                <Tag className="w-5 h-5 text-sky-cta group-hover:text-white transition" />
                <div className="flex-1">
                  <div className="font-semibold text-charcoal group-hover:text-white transition">
                    {tag.name}
                  </div>
                  <div className="text-xs text-muted-blue group-hover:text-white transition">
                    {tag.slug}
                  </div>
                </div>
                <div className="flex items-center space-x-1 space-x-reverse opacity-0 group-hover:opacity-100 transition">
                  {permissions.can('tags', 'update') && (
                    <button
                      onClick={() => handleEdit(tag)}
                      className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded transition"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4 text-white" />
                    </button>
                  )}
                  {permissions.can('tags', 'delete') && (
                    <button
                      onClick={() => handleDelete(tag)}
                      className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded transition"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-cloud-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-border-blue">
              <h3 className="text-xl font-bold text-charcoal">
                {editingTag ? 'تعديل الوسم' : 'وسم جديد'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-blue hover:text-charcoal transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2 text-right">
                    الاسم بالعربية *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-sky-bg border border-border-blue rounded-lg px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-sky-cta"
                    placeholder="مثال: AWS"
                  />
                </div>


              </div>

              <div className="flex items-center justify-end space-x-4 space-x-reverse mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-border-blue text-muted-blue rounded-lg hover:bg-sky-bg transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-sky-cta hover:bg-sky-cta-hover text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 space-x-reverse transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{editingTag ? 'تحديث' : 'إضافة'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tags;

