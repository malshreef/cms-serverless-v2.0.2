import { useState } from 'react';
import { confirmSignIn } from 'aws-amplify/auth';
import cloudIcon from '../../assets/cloud-icon.png';

const ChangePassword = ({ onPasswordChanged }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      const { isSignedIn } = await confirmSignIn({
        challengeResponse: newPassword,
      });

      if (isSignedIn) {
        onPasswordChanged();
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.message || 'فشل تغيير كلمة المرور');
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
          <p className="text-muted-blue">لوحة التحكم الإدارية</p>
        </div>

        {/* Change Password Card */}
        <div className="bg-cloud-white rounded-lg shadow-lg border border-border-blue p-8">
          <h2 className="text-2xl font-bold font-readex text-charcoal mb-2 text-right">
            تغيير كلمة المرور
          </h2>
          <p className="text-muted-blue mb-6 text-right font-rubik">
            يجب تغيير كلمة المرور المؤقتة عند تسجيل الدخول لأول مرة
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-right">{error}</p>
            </div>
          )}

          {/* Change Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password Input */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-muted-blue mb-2 text-right font-rubik">
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                className="w-full px-4 py-3 border border-border-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-cta bg-cloud-white text-charcoal text-right"
                required
                disabled={loading}
                minLength={8}
              />
              <p className="text-xs text-muted-blue mt-1 text-right font-rubik">
                يجب أن تحتوي على 8 أحرف على الأقل
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-blue mb-2 text-right font-rubik">
                تأكيد كلمة المرور
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور الجديدة"
                className="w-full px-4 py-3 border border-border-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-cta bg-cloud-white text-charcoal text-right"
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            {/* Password Requirements */}
            <div className="bg-sky-bg p-4 rounded-lg">
              <p className="text-sm font-semibold text-charcoal mb-2 text-right font-rubik">
                متطلبات كلمة المرور:
              </p>
              <ul className="text-sm text-muted-blue space-y-1 text-right font-rubik">
                <li>• 8 أحرف على الأقل</li>
                <li>• حرف كبير واحد على الأقل</li>
                <li>• حرف صغير واحد على الأقل</li>
                <li>• رقم واحد على الأقل</li>
                <li>• رمز خاص واحد على الأقل (!@#$%^&*)</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-cta hover:bg-sky-cta-hover text-white font-semibold font-rubik py-3 rounded-lg transition duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-blue">
            محمي بواسطة AWS Cognito
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;

