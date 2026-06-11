import { Outlet, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Trophy, ListOrdered, User, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ProfileSetupModal } from './ProfileSetupModal';
import { useLang } from '../contexts/LanguageContext';
import { t } from '../i18n';
import { LanguageToggle } from './LanguageToggle';

export function Layout() {
  const { user, profile, isLoading, isAdmin } = useAuthStore();
  const location = useLocation();
  const { lang } = useLang();

  const isProtectedRoute = 
    ['/predictions', '/leaderboard', '/profile', '/admin'].includes(location.pathname) ||
    location.pathname.startsWith('/player/');

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-900 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user && isProtectedRoute) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-slate-900 text-slate-100">
      <ProfileSetupModal />
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <h1 className="text-lg font-extrabold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
          {t(lang, 'auth.title')}
        </h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `p-1.5 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'border-white/20 text-white/80 hover:bg-white/10'
                }`
              }
              title={t(lang, 'nav.admin')}
            >
              <ShieldAlert size={18} />
            </NavLink>
          )}
          <LanguageToggle />
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 pb-safe z-40">
        <div className="flex justify-around items-center h-16">
          <NavLink
            to="/predictions"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-green-500' : 'text-slate-400 hover:text-slate-300'
              }`
            }
          >
            <Trophy size={24} />
            <span className="text-xs font-medium">{t(lang, 'nav.predictions')}</span>
          </NavLink>
          
          <NavLink
            to="/leaderboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-green-500' : 'text-slate-400 hover:text-slate-300'
              }`
            }
          >
            <ListOrdered size={24} />
            <span className="text-xs font-medium">{t(lang, 'nav.leaderboard')}</span>
          </NavLink>

          <NavLink
            to={user ? "/profile" : "/login"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-green-500' : 'text-slate-400 hover:text-slate-300'
              }`
            }
          >
            <User size={24} />
            <span className="text-xs font-medium">
              {profile?.name ? profile.name.split(' ')[0] : (user ? t(lang, 'nav.profile') : t(lang, 'nav.profile'))}
            </span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
