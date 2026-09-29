import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Library,
  Calendar,
  CheckSquare,
  FileBarChart,
  ClipboardList,
  Menu,
  Moon,
  Sun,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

interface SidebarItem {
  name: string;
  to: string;
  icon: React.ElementType;
}

const navigation: SidebarGroup[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'People',
    items: [
      { name: 'Users', to: '/admin/users', icon: Users },
    ],
  },
  {
    title: 'Academic',
    items: [
      { name: 'Courses & Classes', to: '/admin/courses', icon: Library },
      { name: 'Papers', to: '/admin/papers', icon: BookOpen },
    ],
  },
  {
    title: 'Schedule',
    items: [
      { name: 'Timetable', to: '/admin/timetable', icon: Calendar },
    ],
  },
  {
    title: 'Records',
    items: [
      { name: 'Attendance', to: '/admin/attendance', icon: CheckSquare },
      { name: 'Marks (External)', to: '#', icon: FileBarChart },
    ],
  },
  {
    title: 'Logs',
    items: [
      { name: 'Audit Log', to: '/admin/audit', icon: ClipboardList },
    ],
  },
];

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  // Helper to get page title from current path
  const getPageTitle = () => {
    const currentItem = navigation
      .flatMap(group => group.items)
      .find(item => item.to === location.pathname);
    
    if (currentItem) return currentItem.name;
    
    // Fallback logic for deeper routes
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 1) {
      const parentRoute = pathParts[1];
      return parentRoute.charAt(0).toUpperCase() + parentRoute.slice(1);
    }
    
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out flex flex-col
          ${isCollapsed ? 'w-[72px]' : 'w-64'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
          <div className={`flex items-center overflow-hidden transition-all ${isCollapsed ? 'w-10 justify-center' : 'w-full gap-2'}`}>
            <div className="w-8 h-8 bg-[var(--color-accent)] rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">a</span>
            </div>
            {!isCollapsed && (
              <span className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                attend<span className="text-[var(--color-accent)]">me</span>
              </span>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
          <nav className="space-y-8">
            {navigation.map((group, idx) => (
              <div key={idx}>
                {!isCollapsed && (
                  <h3 className="px-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    item.to.startsWith('#') || item.to.startsWith('http') ? (
                      <a
                        key={item.name}
                        href={item.to}
                        onClick={(e) => { if (item.to === '#') { e.preventDefault(); alert('External marks system integration pending.'); } }}
                        className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon className={`shrink-0 ${isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
                        {!isCollapsed && <span>{item.name}</span>}
                      </a>
                    ) : (
                      <NavLink
                        key={item.name}
                        to={item.to}
                        end={item.to === '/admin'}
                        className={({ isActive }) =>
                          `flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-[var(--color-accent)] text-white'
                              : 'text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-gray-800'
                          } ${isCollapsed ? 'justify-center' : ''}`
                        }
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon className={`shrink-0 ${isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
                        {!isCollapsed && <span>{item.name}</span>}
                      </NavLink>
                    )
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Collapse</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
        {/* Topbar */}
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-[var(--color-text-primary)] leading-none mb-1">
                  {user?.name || 'Admin User'}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] leading-none">
                  Administrator
                </span>
              </div>
              <div className="h-9 w-9 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center font-medium text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-colors ml-1"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
