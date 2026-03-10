import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Activity,
  Users,
  LogOut,
  Leaf,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/store/authStore';
import { logoutApi } from '@/services/auth.service';

interface NavItem {
  to: string;
  label: string;
  labelAr: string;
  icon: React.ElementType;
  requiredRole?: 'admin' | 'operator' | 'viewer';
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Tableau de Bord',
    labelAr: 'لوحة التحكم',
    icon: LayoutDashboard,
  },
  {
    to: '/iot',
    label: 'Surveillance IoT',
    labelAr: 'مراقبة إنترنت الأشياء',
    icon: Cpu,
  },
  {
    to: '/monitoring',
    label: 'Monitoring Système',
    labelAr: 'مراقبة النظام',
    icon: Activity,
  },
  {
    to: '/admin',
    label: 'Administration',
    labelAr: 'الإدارة',
    icon: Users,
    requiredRole: 'admin',
  },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const roleHierarchy: Record<string, number> = {
    viewer: 1,
    operator: 2,
    admin: 3,
  };
  const userLevel = roleHierarchy[user?.role ?? 'viewer'] ?? 0;

  const visibleItems = navItems.filter((item) => {
    if (!item.requiredRole) return true;
    return userLevel >= (roleHierarchy[item.requiredRole] ?? 0);
  });

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // ignore server errors on logout
    }
    logout();
    navigate('/login');
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen overflow-y-auto">
      {/* Brand */}
      <div className="oasis-gradient px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">SIREP OASIS</p>
            <p className="text-oasis-200 text-xs">NEXUS TECH DZ</p>
          </div>
        </div>
        <p className="mt-2 text-oasis-200 text-xs arabic-inline">
          منصة واحة الصحراء الذكية
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Navigation
        </p>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx('sidebar-link group', isActive && 'sidebar-link-active')
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={clsx(
                    'w-4 h-4 shrink-0',
                    isActive ? 'text-oasis-700' : 'text-slate-400 group-hover:text-oasis-600'
                  )}
                />
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{item.label}</span>
                  <span className="block text-[10px] text-slate-400 arabic-inline truncate">
                    {item.labelAr}
                  </span>
                </span>
                {isActive && (
                  <ChevronRight className="w-3 h-3 text-oasis-600 shrink-0" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-200 px-3 py-4">
        {user && (
          <div className="px-3 py-2 mb-2 rounded-lg bg-slate-50">
            <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <span className="mt-1 badge badge-success capitalize">{user.role}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full sidebar-link text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Déconnexion / تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
