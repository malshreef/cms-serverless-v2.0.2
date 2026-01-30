import { useState, useEffect } from 'react';
import { sectionsAPI } from '../lib/api';
import { FolderOpen, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sections = () => {
  const { permissions } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await sectionsAPI.list();
      // Handle different response formats
      const sectionsData = response.data?.sections || response.data?.data?.sections || response.data?.data?.data || response.data?.data || [];
      setSections(Array.isArray(sectionsData) ? sectionsData : []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching sections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSection(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setFormData({ name: section.name });
    setShowModal(true);
  };

  const handleDelete = async (section) => {
    const articleCount = section.articleCount || 0;
    let confirmMessage;
    
    if (articleCount > 0) {
      confirmMessage = `هذا القسم يحتوي على ${articleCount} مقالة.\n\nحذف القسم قد يؤثر على هذه المقالات.\n\nهل تريد المتابعة؟`;
    } else {
      confirmMessage = `هل أنت متأكد من حذف القسم "${section.name}"؟`;
    }
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await sectionsAPI.delete(section.id);
      fetchSections();
      alert('تم حذف القسم بنجاح');
    } catch (err) {
      // Extract backend error message if available
      let errorMessage = err.response?.data?.message || 
                        err.response?.data?.error || 
                        err.message || 
                        'حدث خطأ غير متوقع';
      
      // If errorMessage is an object, try to extract the actual message
      if (typeof errorMessage === 'object') {
        errorMessage = errorMessage.message || JSON.stringify(errorMessage);
      }
      
      alert('خطأ في حذف القسم:\n\n' + errorMessage);
      console.error('Delete section error:', err.response?.data || err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم القسم');
      return;
    }

    try {
      setSaving(true);
      if (editingSection) {
        await sectionsAPI.update(editingSection.id, formData);
        alert('تم تحديث القسم بنجاح');
      } else {
        await sectionsAPI.create(formData);
        alert('تم إضافة القسم بنجاح');
      }
      setShowModal(false);
      fetchSections();
    } catch (err) {
      alert('خطأ في حفظ القسم: ' + err.message);
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
          <h2 className="text-3xl font-bold font-readex text-charcoal mb-2">الأقسام</h2>
          <p className="text-muted-blue">إدارة أقسام المقالات ({sections.length} قسم)</p>
        </div>
        {permissions.can('sections', 'create') && (
          <button
            onClick={handleAdd}
            className="bg-sky-cta hover:bg-sky-cta-hover text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 space-x-reverse transition"
          >
            <Plus className="w-5 h-5" />
            <span>قسم جديد</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600 text-right">خطأ في تحميل الأقسام: {error}</p>
        </div>
      )}

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-sky-bg rounded-lg flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-sky-cta" />
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                {permissions.can('sections', 'update') && (
                  <button
                    onClick={() => handleEdit(section)}
                    className="p-2 hover:bg-sky-bg rounded-lg transition"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4 text-sky-cta" />
                  </button>
                )}
                {permissions.can('sections', 'delete') && (
                  <button
                    onClick={() => handleDelete(section)}
                    className="p-2 hover:bg-red-50 rounded-lg transition"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            </div>
            <h3 className="text-lg font-bold text-charcoal mb-1 text-right">{section.name}</h3>
            <div className="mt-4 pt-4 border-t border-border-blue">
              <p className="text-sm text-muted-blue text-right">
                {section.articleCount || 0} مقال
              </p>
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FolderOpen className="w-16 h-16 text-muted-blue mx-auto mb-4" />
            <p className="text-muted-blue text-lg">لا توجد أقسام</p>
            <button
              onClick={handleAdd}
              className="mt-4 text-sky-cta hover:text-sky-cta-hover font-medium"
            >
              إضافة قسم جديد
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-cloud-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-border-blue">
              <h3 className="text-xl font-bold text-charcoal">
                {editingSection ? 'تعديل القسم' : 'قسم جديد'}
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
                    اسم القسم *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-sky-bg border border-border-blue rounded-lg px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-sky-cta"
                    placeholder="مثال: الحوسبة السحابية"
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
                      <span>{editingSection ? 'تحديث' : 'إضافة'}</span>
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

export default Sections;

