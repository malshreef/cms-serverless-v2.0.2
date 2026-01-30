import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usersAPI } from '../lib/api';
import { ArrowRight, Save, Loader2, User, Mail, Shield, Lock, FileText, Image as ImageIcon, Twitter, Facebook, Linkedin, ToggleLeft, ToggleRight } from 'lucide-react';

export default function UserForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'viewer', // default role
        password: '', // only for create
        brief: '',
        image: '',
        twitter: '',
        facebook: '',
        linkedin: '',
        active: 1,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEdit) {
            fetchUser();
        }
    }, [id]);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const response = await usersAPI.get(id);
            console.log('Get User API Response:', response.data);

            // Handle nested data structure from API
            const responseData = response.data.data || response.data;
            const user = responseData.user || responseData;

            setFormData({
                name: user.name || '',
                email: user.email || '',
                role: user.role || 'viewer',
                password: '', // Don't populate password
                brief: user.brief || '',
                image: user.image || '',
                twitter: user.twitter || '',
                facebook: user.facebook || '',
                linkedin: user.linkedin || '',
                active: user.active ?? 1,
            });
        } catch (err) {
            console.error('Error fetching user:', err);
            setError('فشل في تحميل بيانات المستخدم');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (isEdit) {
                // For update, remove password if empty
                const payload = { ...formData };
                if (!payload.password) delete payload.password;
                await usersAPI.update(id, payload);
            } else {
                await usersAPI.create(formData);
            }
            navigate('/users');
        } catch (err) {
            console.error('Error saving user:', err);
            setError(err.response?.data?.message || 'فشل في حفظ المستخدم');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-sky-cta" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/users')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowRight className="w-6 h-6 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 font-readex">
                            {isEdit ? 'تعديل مستخدم' : 'مستخدم جديد'}
                        </h1>
                        <p className="text-gray-500 mt-1 font-rubik">
                            {isEdit ? 'تعديل بيانات المستخدم والصلاحيات' : 'إضافة مستخدم جديد للنظام'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-readex">المعلومات الأساسية</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 font-rubik">
                                        <User className="w-4 h-4" />
                                        الاسم
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent"
                                        required
                                        maxLength={100}
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 font-rubik">
                                        <Mail className="w-4 h-4" />
                                        البريد الإلكتروني
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                                        required
                                        disabled={isEdit}
                                    />
                                    {isEdit && (
                                        <p className="text-xs text-gray-500">لا يمكن تعديل البريد الإلكتروني</p>
                                    )}
                                </div>

                                {/* Role */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 font-rubik">
                                        <Shield className="w-4 h-4" />
                                        الدور
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent"
                                    >
                                        <option value="admin">مدير النظام (Admin)</option>
                                        <option value="content_manager">مدير المحتوى (Content Manager)</option>
                                        <option value="content_specialist">أخصائي محتوى (Content Specialist)</option>
                                        <option value="viewer">مشاهد (Viewer)</option>
                                    </select>
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 font-rubik">
                                        <Lock className="w-4 h-4" />
                                        كلمة المرور {isEdit && '(اتركها فارغة للإبقاء على الحالية)'}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent"
                                        required={!isEdit}
                                        minLength={8}
                                        placeholder={isEdit ? '' : 'يجب أن تحتوي على 8 أحرف على الأقل'}
                                    />
                                    {!isEdit && (
                                        <p className="text-xs text-gray-500">
                                            يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص
                                        </p>
                                    )}
                                </div>

                                {/* Brief */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 font-rubik">
                                        <FileText className="w-4 h-4" />
                                        نبذة مختصرة (اختياري)
                                    </label>
                                    <textarea
                                        value={formData.brief}
                                        onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent"
                                        rows={3}
                                        maxLength={200}
                                        placeholder="نبذة مختصرة عن المستخدم..."
                                    />
                                    <p className="text-xs text-gray-500 text-left font-rubik">
                                        {formData.brief.length}/200
                                    </p>
                                </div>

                                {/* Active Status */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 font-rubik">
                                        {formData.active ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                                        حالة الحساب
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, active: formData.active ? 0 : 1 })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                formData.active ? 'bg-green-600' : 'bg-gray-300'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    formData.active ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                        <span className={`text-sm ${formData.active ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                            {formData.active ? 'الحساب نشط' : 'الحساب معطل'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile & Social Links */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-readex">الملف الشخصي والروابط</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Profile Image URL */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 font-rubik">
                                        <ImageIcon className="w-4 h-4" />
                                        رابط الصورة الشخصية (اختياري)
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent"
                                        placeholder="https://example.com/profile.jpg"
                                        maxLength={200}
                                    />
                                </div>

                                {/* Twitter */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 font-rubik">
                                        <Twitter className="w-4 h-4" />
                                        تويتر (اختياري)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.twitter}
                                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent"
                                        placeholder="@username"
                                        maxLength={100}
                                    />
                                </div>

                                {/* Facebook */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 font-rubik">
                                        <Facebook className="w-4 h-4" />
                                        فيسبوك (اختياري)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.facebook}
                                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent"
                                        placeholder="facebook.com/username"
                                        maxLength={100}
                                    />
                                </div>

                                {/* LinkedIn */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 font-rubik">
                                        <Linkedin className="w-4 h-4" />
                                        لينكد إن (اختياري)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.linkedin}
                                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent"
                                        placeholder="linkedin.com/in/username"
                                        maxLength={100}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => navigate('/users')}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-sky-cta text-white rounded-lg hover:bg-sky-cta-hover transition-colors font-medium disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    حفظ
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
