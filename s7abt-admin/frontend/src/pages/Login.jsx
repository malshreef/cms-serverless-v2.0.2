import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChangePassword from '../components/auth/ChangePassword';
import cloudIcon from '../assets/cloud-icon.png';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, checkAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        navigate('/');
      } else if (result.requiresNewPassword) {
        setRequiresPasswordChange(true);
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChanged = async () => {
    // After password change, check auth and redirect
    await checkAuth();
    navigate('/');
  };

  // Show password change screen if required
  if (requiresPasswordChange) {
    return <ChangePassword onPasswordChanged={handlePasswordChanged} />;
  }

  return (
    <div className="min-h-screen bg-sky-bg flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 space-x-reverse mb-3">
            <img src={cloudIcon} alt="S7abt" className="w-16 h-16" />
            <h1 className="text-4xl font-bold font-readex text-sky-cta">S7abt</h1>
          </div>
          <p className="text-muted-blue font-rubik">لوحة التحكم الإدارية</p>
        </div>

        {/* Login Card */}
        <div className="bg-cloud-white rounded-lg shadow-lg border border-border-blue p-8">
          <h2 className="text-2xl font-bold font-readex text-charcoal mb-2 text-right">
            مرحباً بعودتك
          </h2>
          <p className="text-muted-blue mb-6 text-right font-rubik">
            قم بتسجيل الدخول للوصول إلى لوحة التحكم
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-right">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
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

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-blue mb-2 text-right font-rubik">
                كلمة المرور
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-border-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-cta bg-cloud-white text-charcoal text-right"
                required
                disabled={loading}
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <Link to="/forgot-password" className="text-sm text-link-blue hover:text-sky-cta-hover font-rubik">
                نسيت كلمة المرور؟
              </Link>
              <label className="flex items-center space-x-2 space-x-reverse">
                <span className="text-sm text-muted-blue font-rubik">تذكرني</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-sky-cta border-border-blue rounded focus:ring-sky-cta"
                />
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-cta hover:bg-sky-cta-hover text-white font-semibold font-rubik py-3 rounded-lg transition duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-blue">
            محمي بواسطة AWS Cognito •{' '}
            <a href="#" className="text-link-blue hover:text-sky-cta-hover">
              سياسة الخصوصية
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

