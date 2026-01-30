import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { articlesAPI, sectionsAPI, tagsAPI } from '../lib/api';
import ImageUpload from '../components/ImageUpload';
import RichTextEditor from '../components/RichTextEditor';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { canPublish } from '../lib/permissions';

const ArticleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const userCanPublish = canPublish(user?.role, 'articles');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    mainImageKey: '',
    status: 'draft',
    premium: false,
    sectionId: '',
    sections: [{ title: '', content: '' }],
    tagIds: [],
  });

  const [sections, setSections] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    fetchSections();
    fetchTags();
    if (isEdit) {
      fetchArticle();
    }
  }, [id]);

  const fetchSections = async () => {
    try {
      const response = await sectionsAPI.list();
      const sectionsData = response.data?.sections || response.data?.data?.sections || response.data?.data || [];
      setSections(Array.isArray(sectionsData) ? sectionsData : []);
    } catch (err) {
      console.error('Error fetching sections:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await tagsAPI.list();
      const tagsData = response.data?.tags || response.data?.data?.tags || response.data?.data || [];
      setTags(Array.isArray(tagsData) ? tagsData : []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.get(id);
      const article = response.data.data;
      
      // Handle mainImage - filter out "no-image.png" default placeholder
      let imageKey = article.mainImage || '';
      if (imageKey === 'no-image.png') {
        imageKey = ''; // Treat default placeholder as no image
      }
      
      setFormData({
        title: article.title || '',
        slug: article.slug || '',
        excerpt: article.excerpt || '',
        mainImageKey: imageKey,
        status: article.status || 'draft',
        premium: article.premium || false,
        sectionId: article.section?.id || article.sectionId || '',
        sections: article.sections || [{ title: '', content: '' }],
        tagIds: article.tags?.map(t => t.id) || [],
      });
    } catch (err) {
      setError('خطأ في تحميل المقال: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-generate slug from title
    if (name === 'title' && !isEdit) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSectionChange = (index, field, value) => {
    const updatedSections = [...formData.sections];
    updatedSections[index][field] = value;
    setFormData(prev => ({ ...prev, sections: updatedSections }));
  };

  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { title: '', content: '' }]
    }));
  };

  const removeSection = (index) => {
    if (formData.sections.length > 1) {
      const updatedSections = formData.sections.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, sections: updatedSections }));
    }
  };

  const handleTagToggle = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug || !formData.sectionId) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        mainImage: formData.mainImageKey || 'no-image.png', // Use default if no image
        status: formData.status,
        premium: formData.premium,
        userId: 1, // TODO: Map Cognito user to database user ID
        sectionId: parseInt(formData.sectionId),
        sections: formData.sections.filter(s => s.title || s.content),
        tagIds: formData.tagIds,
      };

      if (isEdit) {
        await articlesAPI.update(id, payload);
      } else {
        await articlesAPI.create(payload);
      }

      navigate('/articles');
    } catch (err) {
      setError('خطأ في حفظ المقال: ' + err.message);
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-readex text-charcoal mb-2 text-right">
          {isEdit ? 'تعديل مقال' : 'مقال جديد'}
        </h1>
        <p className="text-muted-blue text-right">
          {isEdit ? 'تحديث معلومات المقال' : 'إضافة مقال جديد إلى المدونة'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-right">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6 space-y-6">
          <h3 className="text-xl font-bold text-charcoal text-right">المعلومات الأساسية</h3>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2 text-right">
              عنوان المقال <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2 text-right">
              الرابط (Slug) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-left"
              dir="ltr"
              required
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2 text-right">
              الوصف المختصر
            </label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right"
            />
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2 text-right">
              القسم <span className="text-red-500">*</span>
            </label>
            <select
              name="sectionId"
              value={formData.sectionId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right"
              required
            >
              <option value="">اختر القسم</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2 text-right">
              الحالة
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right"
            >
              <option value="draft">مسودة</option>
              {userCanPublish && (
                <>
                  <option value="published">منشور</option>
                  <option value="scheduled">مجدول</option>
                </>
              )}
            </select>
          </div>

          {/* Premium Article */}
          <div>
            <label className="flex items-center justify-end cursor-pointer">
              <span className="text-sm font-medium text-charcoal mr-3">مقال مميز (Premium)</span>
              <input
                type="checkbox"
                checked={formData.premium}
                onChange={(e) => setFormData(prev => ({ ...prev, premium: e.target.checked }))}
                className="w-5 h-5 text-sky-cta border-border-blue rounded focus:ring-2 focus:ring-sky-cta cursor-pointer"
              />
            </label>
            <p className="text-xs text-muted-blue mt-2 text-right">
              سيتم عرض المقالات المميزة في قسم المقالات المميزة على الصفحة الرئيسية (أحدث 4 مقالات)
            </p>
            <p className="text-xs text-muted-blue mt-2 text-right">
            لعرض المقال في الصفحة المخصصة لرؤية 2030 كرما اختيار التاق التالي : vision2030 - رؤية-السعودية-2030
            </p>

          </div>
        </div>

        {/* Main Image */}
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
          <h3 className="text-xl font-bold text-charcoal mb-6 text-right">الصورة الرئيسية</h3>
          
          <ImageUpload
            value={formData.mainImageKey}
            onChange={(imageKey) => setFormData(prev => ({ ...prev, mainImageKey: imageKey }))}
            folder="articles"
            label="صورة المقال"
          />
        </div>

        {/* Article Sections */}
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={addSection}
              className="bg-sky-cta hover:bg-sky-cta-hover text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قسم</span>
            </button>
            <h3 className="text-xl font-bold text-charcoal text-right">أقسام المقال</h3>
          </div>

          <div className="space-y-6">
            {formData.sections.map((section, index) => (
              <div key={index} className="border border-border-blue rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="text-red-600 hover:text-red-700 p-2"
                    disabled={formData.sections.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <h4 className="font-medium text-charcoal">القسم {index + 1}</h4>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                    placeholder="عنوان القسم"
                    className="w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right"
                  />
                  <RichTextEditor
                    value={section.content}
                    onChange={(content) => handleSectionChange(index, 'content', content)}
                    placeholder="محتوى القسم"
                    height={350}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
          <h3 className="text-xl font-bold text-charcoal mb-6 text-right">الوسوم</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.id)}
                className={`px-4 py-2 rounded-lg border transition ${
                  formData.tagIds.includes(tag.id)
                    ? 'bg-sky-cta text-white border-sky-cta'
                    : 'bg-white text-charcoal border-border-blue hover:border-sky-cta'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/articles')}
            className="px-6 py-3 border border-border-blue text-charcoal rounded-lg hover:bg-sky-bg transition"
          >
            <X className="w-5 h-5 inline ml-2" />
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-sky-cta hover:bg-sky-cta-hover text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 space-x-reverse transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{isEdit ? 'تحديث' : 'حفظ'} المقال</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArticleForm;

