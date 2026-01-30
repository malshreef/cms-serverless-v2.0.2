import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import cloudIcon from '../assets/cloud-icon.png';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { resetPasswordRequest, resetPasswordConfirm } = useAuth();

    const [step, setStep] = useState(1); // 1: Request Code, 2: Confirm Reset
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleRequestCode = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await resetPasswordRequest(email);
            if (result.success) {
                setStep(2);
                setSuccessMessage('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
            } else {
                setError(result.message || 'فشل في إرسال رمز التحقق');
            }
        } catch (err) {
            setError('حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReset = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('كلمات المرور غير متطابقة');
            return;
        }

        setLoading(true);

        try {
            const result = await resetPasswordConfirm(email, newPassword, code);
            if (result.success) {
                setSuccessMessage('تم تغيير كلمة المرور بنجاح. جاري التوجيه لتسجيل الدخول...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(result.message || 'فشل في تغيير كلمة المرور');
            }
        } catch (err) {
            setError('حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-sky-bg flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-3 space-x-reverse mb-3">
                        <img src={cloudIcon} alt="S7abt" className="w-16 h-16" />
                        <h1 className="text-4xl font-bold font-readex text-sky-cta">S7abt</h1>
                    </div>
                    <p className="text-muted-blue font-rubik">استعادة كلمة المرور</p>
                </div>

                {/* Card */}
                <div className="bg-cloud-white rounded-lg shadow-lg border border-border-blue p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600 text-right">{error}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-600 text-right">{successMessage}</p>
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleRequestCode} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-muted-blue mb-2 text-right font-rubik">
                                    البريد الإلكتروني
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full px-4 py-3 border border-border-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-cta bg-cloud-white text-charcoal text-right"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-sky-cta hover:bg-sky-cta-hover text-white font-semibold font-rubik py-3 rounded-lg transition duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleConfirmReset} className="space-y-4">
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-muted-blue mb-2 text-right font-rubik">
                                    رمز التحقق
                                </label>
                                <input
                                    type="text"
                                    id="code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="أدخل الرمز المرسل لبريدك"
                                    className="w-full px-4 py-3 border border-border-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-cta bg-cloud-white text-charcoal text-right"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-muted-blue mb-2 text-right font-rubik">
                                    كلمة المرور الجديدة
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 border border-border-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-cta bg-cloud-white text-charcoal text-right"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-blue mb-2 text-right font-rubik">
                                    تأكيد كلمة المرور
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 border border-border-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-cta bg-cloud-white text-charcoal text-right"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-sky-cta hover:bg-sky-cta-hover text-white font-semibold font-rubik py-3 rounded-lg transition duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm text-link-blue hover:text-sky-cta-hover font-rubik">
                            العودة لتسجيل الدخول
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
