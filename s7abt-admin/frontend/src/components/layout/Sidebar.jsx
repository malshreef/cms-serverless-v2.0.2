import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  NewspaperIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  FolderIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleBadgeColor } from '../../lib/permissions';

const navigation = [
  { name: 'لوحة المعلومات', href: '/dashboard', icon: HomeIcon },
  { name: 'المقالات', href: '/articles', icon: DocumentTextIcon },
  { name: 'الأخبار', href: '/news', icon: NewspaperIcon },
  { name: 'التغريدات', href: '/tweets', icon: ChatBubbleLeftRightIcon },
  { name: 'الأقسام', href: '/sections', icon: FolderIcon },
  { name: 'الوسوم', href: '/tags', icon: TagIcon },
  { name: 'المستخدمون', href: '/users', icon: UserGroupIcon },
  { name: 'الإعدادات', href: '/settings', icon: Cog6ToothIcon },
  { name: 'التحليلات', href: '/insights', icon: ChartBarIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar() {
  const location = useLocation();
  const { user, permissions } = useAuth();

  // Filter navigation items based on user permissions
  const filteredNavigation = navigation.filter((item) =>
    permissions.canAccessRoute(item.href)
  );

  return (
    <div className="flex flex-col w-64 bg-gray-800">
      <div className="flex items-center justify-center h-16 bg-gray-900">
        <h1 className="text-xl font-bold text-white">S7abt Admin</h1>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href || 
                          location.pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
              )}
            >
              <item.icon
                className={classNames(
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                  'ml-3 h-6 w-6 flex-shrink-0'
                )}
                aria-hidden="true"
              />
              <span className="mr-3">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="flex-shrink-0 p-4 border-t border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <div className="mr-3">
            <p className="text-sm font-medium text-white">{user?.name || user?.email || 'User'}</p>
            <span className={classNames(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
              getRoleBadgeColor(user?.role)
            )}>
              {permissions.getRoleDisplayName()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

