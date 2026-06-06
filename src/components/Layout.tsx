import { Outlet, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Trophy, ListOrdered, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ProfileSetupModal } from './ProfileSetupModal';

export function Layout() {
  const { user, profile, isLoading } = useAuthStore();
  const location = useLocation();

  const isProtectedRoute = ['/predictions', '/leaderboard'].includes(location.pathname);

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
            <span className="text-xs font-medium">Predictions</span>
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
            <span className="text-xs font-medium">Leaderboard</span>
          </NavLink>

          <NavLink
            to="/login"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive && !user ? 'text-green-500' : 'text-slate-400 hover:text-slate-300'
              }`
            }
          >
            <User size={24} />
            <span className="text-xs font-medium">
              {profile ? profile.name.split(' ')[0] : 'Entrar'}
            </span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
