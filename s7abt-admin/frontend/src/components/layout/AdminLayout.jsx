import { useState, useMemo } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessRoute } from '../../lib/permissions';
import {
  Home,
  FileText,
  Newspaper,
  Tag,
  Layers,
  MessageSquare,
  Users,
  Settings,
  Bell,
  Search,
  LogOut,
  BarChart3,
} from 'lucide-react';
import cloudIcon from '../../assets/cloud-icon.png';

const AdminLayout = () => {
  const location = useLocation();
  const { user, logout, loading, permissions } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const allNavigation = [
    { name: 'لوحة المعلومات', href: '/', icon: Home, permPath: '/dashboard' },
    { name: 'المقالات', href: '/articles', icon: FileText, permPath: '/articles' },
    { name: 'الأخبار', href: '/news', icon: Newspaper, permPath: '/news' },
    { name: 'الوسوم', href: '/tags', icon: Tag, permPath: '/tags' },
    { name: 'الأقسام', href: '/sections', icon: Layers, permPath: '/sections' },
    { name: 'التغريدات', href: '/tweets', icon: MessageSquare, permPath: '/tweets' },
    { name: 'المستخدمين', href: '/users', icon: Users, permPath: '/users' },
    { name: 'التحليلات', href: '/insights', icon: BarChart3, permPath: '/insights' },
  ];

  // Filter navigation based on user permissions
  const navigation = useMemo(() => {
    const role = user?.role || 'viewer';
    return allNavigation.filter(item => canAccessRoute(role, item.permPath));
  }, [user?.role]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
  };

  // Get display name with fallback logic
  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.givenName) return user.givenName;
    if (user?.email) return user.email.split('@')[0];
    return 'مدير النظام';
  };

  // Get initials for avatar
  const getInitials = () => {
    if (user?.name) return user.name[0].toUpperCase();
    if (user?.givenName) return user.givenName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'م';
  };

  const displayName = getDisplayName();
  const initials = getInitials();

  return (
    <div className="min-h-screen bg-sky-bg" dir="rtl">
      {/* Top Bar */}
      <div className="bg-cloud-white border-b border-border-blue fixed top-0 left-0 right-0 z-50 h-16">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse">
              <img src={cloudIcon} alt="S7abt" className="w-10 h-10" />
              <h1 className="text-2xl font-bold font-readex text-sky-cta">S7abt</h1>
            </div>
            <span className="text-muted-blue font-rubik">لوحة التحكم</span>
          </div>

          <div className="flex items-center space-x-6 space-x-reverse">
            {/* TODO: Search Bar - Implement search functionality later */}
            {/* <div className="relative">
              <input
                type="text"
                placeholder="البحث..."
                className="bg-sky-bg border border-border-blue rounded-lg px-4 py-2 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-sky-cta text-right"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-blue" />
            </div> */}

            {/* TODO: Notifications (Bell) - Implement notifications system later */}
            {/* <button className="relative p-2 hover:bg-sky-bg rounded-lg transition">
              <Bell className="w-6 h-6 text-muted-blue" />
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button> */}

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 space-x-reverse hover:bg-sky-bg rounded-lg p-2 transition"
              >
                <div className="text-sm text-right">
                  <div className="font-semibold text-charcoal">
                    {displayName}
                  </div>
                  <div className="text-muted-blue text-xs">{permissions.getRoleDisplayName()}</div>
                </div>
                <div className="w-10 h-10 bg-sky-cta rounded-full flex items-center justify-center text-white font-semibold">
                  {initials}
                </div>
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-cloud-white rounded-lg shadow-lg border border-border-blue py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-right hover:bg-sky-bg flex items-center space-x-2 space-x-reverse text-muted-blue"
                  >
                    <span>تسجيل الخروج</span>
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="fixed right-0 top-16 bottom-0 w-64 bg-cloud-white border-l border-border-blue overflow-y-auto">
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg font-medium font-rubik transition ${
                  active
                    ? 'bg-sky-bg text-sky-cta'
                    : 'text-muted-blue hover:bg-sky-bg'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="mr-64 mt-16 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-cta"></div>
          </div>
        ) : !user ? (
          <Navigate to="/login" replace />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
};

export default AdminLayout;

