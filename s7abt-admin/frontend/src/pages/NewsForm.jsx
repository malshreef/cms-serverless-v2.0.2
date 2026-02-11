import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { newsAPI } from '../lib/api';
import ImageUpload from '../components/ImageUpload';
import { buildImageUrl } from '../lib/imageUtils';
import {
  Save,
  X,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader,
  Upload,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isOwnershipBased } from '../lib/permissions';

const NewsForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    brief: '',
    body: '',
    image: '',
    logo: 'flaticon-edit',
    active: 0,
    showWidth: 12,
  });

  const [charCounts, setCharCounts] = useState({
    title: 0,
    brief: 0,
    body: 0,
  });

  useEffect(() => {
    if (isEdit) {
      fetchNews();
    }
  }, [id]);

  useEffect(() => {
    setCharCounts({
      title: formData.title.length,
      brief: formData.brief.length,
      body: formData.body.length,
    });
  }, [formData.title, formData.brief, formData.body]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      console.log('Fetching news with ID:', id);
      const response = await newsAPI.get(id);
      console.log('News data received:', response.data);
      
      // Handle different response structures
      let newsData;
      if (response.data?.data?.news) {
        newsData = response.data.data.news;
      } else if (response.data?.news) {
        newsData = response.data.news;
      } else if (response.data?.data) {
        newsData = response.data.data;
      } else {
        newsData = response.data;
      }
      
      console.log('Parsed news data:', newsData);

      // Ownership check: content_specialist can only edit their own news
      if (isOwnershipBased(user?.role, 'news', 'update')) {
        if (String(newsData.userId) !== String(user?.dbUserId)) {
          setError('ليس لديك صلاحية تعديل هذا الخبر');
          navigate('/news');
          return;
        }
      }

      setFormData({
        title: newsData.title || '',
        brief: newsData.brief || '',
        body: newsData.body || '',
        image: newsData.image || '',
        logo: newsData.logo || 'flaticon-edit',
        active: newsData.active || 0,
        showWidth: newsData.showWidth || 12,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching news:', error);
      setError('فشل في تحميل بيانات الخبر');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // Validation
    if (!formData.title.trim()) {
      setError('عنوان الخبر مطلوب');
      setSaving(false);
      return;
    }

    if (!formData.body.trim()) {
      setError('محتوى الخبر مطلوب');
      setSaving(false);
      return;
    }

    if (formData.title.length > 100) {
      setError('عنوان الخبر يجب ألا يتجاوز 100 حرف');
      setSaving(false);
      return;
    }

    if (formData.brief.length > 200) {
      setError('مختصر الخبر يجب ألا يتجاوز 200 حرف');
      setSaving(false);
      return;
    }

    if (formData.body.length > 2000) {
      setError('محتوى الخبر يجب ألا يتجاوز 2000 حرف');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        userId: 1, // TODO: Map Cognito user to database user ID
      };

      if (isEdit) {
        console.log('Updating news with ID:', id, 'Payload:', payload);
        await newsAPI.update(id, payload);
      } else {
        console.log('Creating new news. Payload:', payload);
        await newsAPI.create(payload);
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/news');
      }, 1500);
    } catch (error) {
      console.error('Error saving news:', error);
      setError('فشل في حفظ الخبر. يرجى المحاولة مرة أخرى.');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('هل أنت متأكد من إلغاء التغييرات؟')) {
      navigate('/news');
    }
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-charcoal font-readex">
          {isEdit ? 'تعديل الخبر' : 'خبر جديد'}
        </h1>
        <p className="text-muted-blue mt-1">
          {isEdit ? 'تعديل بيانات الخبر' : 'إضافة خبر جديد إلى الموقع'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 ml-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-right">
            <p className="text-red-800 font-semibold">خطأ</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 ml-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-right">
            <p className="text-green-800 font-semibold">تم بنجاح!</p>
            <p className="text-green-700 text-sm mt-1">
              تم {isEdit ? 'تحديث' : 'إضافة'} الخبر بنجاح. جاري التحويل...
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Content Card */}
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm">
          <div className="p-6 border-b border-border-blue">
            <h2 className="text-xl font-bold text-charcoal text-right">معلومات الخبر</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2 text-right">
                عنوان الخبر <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                maxLength={100}
                required
                className="w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right"
                placeholder="أدخل عنوان الخبر"
              />
              <p className="text-xs text-muted-blue mt-1 text-right">
                {charCounts.title}/100 حرف
              </p>
            </div>

            {/* Brief */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2 text-right">
                مختصر الخبر
              </label>
              <input
                type="text"
                name="brief"
                value={formData.brief}
                onChange={handleChange}
                maxLength={200}
                className="w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right"
                placeholder="ملخص قصير للخبر"
              />
              <p className="text-xs text-muted-blue mt-1 text-right">
                {charCounts.brief}/200 حرف
              </p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2 text-right">
                محتوى الخبر <span className="text-red-500">*</span>
              </label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                maxLength={2000}
                required
                rows={8}
                className="w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-right resize-none"
                placeholder="اكتب محتوى الخبر هنا..."
              />
              <p className="text-xs text-muted-blue mt-1 text-right">
                {charCounts.body}/2000 حرف
              </p>
            </div>

            {/* Image Upload */}
            <ImageUpload
              value={formData.image}
              onChange={(imageKey) => setFormData(prev => ({ ...prev, image: imageKey }))}
              folder="news"
              label="صورة الخبر"
            />

          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm">
          <div className="p-6 border-b border-border-blue">
            <h2 className="text-xl font-bold text-charcoal text-right">إعدادات العرض</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="text-right">
                <label className="block text-sm font-medium text-charcoal mb-1">
                  حالة النشر
                </label>
                <p className="text-xs text-muted-blue">
                  تفعيل أو إلغاء تفعيل عرض الخبر في الموقع
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active === 1}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-cta/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-cta"></div>
              </label>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition inline-flex items-center"
          >
            <X className="w-5 h-5 ml-2" />
            إلغاء
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-sky-cta text-white rounded-lg hover:bg-sky-cta-hover transition inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 ml-2" />
                {isEdit ? 'حفظ التغييرات' : 'إضافة الخبر'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewsForm;

