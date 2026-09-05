import { Moon, User as UserIcon, LogOut, MessageSquare, Shield, Calendar as CalendarIcon, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenWhatsAppDirect: () => void;
  activeTab?: 'CALENDAR' | 'DASHBOARD';
  onTabChange?: (tab: 'CALENDAR' | 'DASHBOARD') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenWhatsAppDirect,
  activeTab = 'CALENDAR',
  onTabChange,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Navigation Tabs */}
        <div className="flex items-center space-x-3 sm:space-x-6 min-w-0">
          <div className="flex items-center space-x-2.5 cursor-pointer shrink-0" onClick={() => onTabChange && onTabChange('CALENDAR')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-500 to-oat-300 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Moon className="w-5 h-5 text-slate-950" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-2 truncate">
                Guardia Nocturna
              </h1>
              <p className="hidden xs:block text-[10px] sm:text-xs text-slate-400 font-medium truncate">Clases Particulares & Turnos</p>
            </div>
          </div>

          {/* Admin View Switcher Tabs (Responsive for mobile & desktop) */}
          {user?.role === 'ADMIN' && onTabChange && (
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 sm:p-1 rounded-xl space-x-1 shrink-0">
              <button
                onClick={() => onTabChange('CALENDAR')}
                className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'CALENDAR'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Grilla de Turnos"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grilla</span>
              </button>
              <button
                onClick={() => onTabChange('DASHBOARD')}
                className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'DASHBOARD'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-amber-400 hover:bg-amber-500/10'
                }`}
                title="Dashboard Docente"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Items */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* WhatsApp Direct Shortcut */}
          <button
            onClick={onOpenWhatsAppDirect}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all text-xs font-semibold"
            title="Contactar por WhatsApp"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">WhatsApp</span>
          </button>

          {user ? (
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              {/* Role Indicator Badge */}
              <div
                className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                  user.role === 'ADMIN'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{user.role === 'ADMIN' ? 'Admin' : 'Alumno'}</span>
              </div>

              {/* User Info Badge */}
              <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2 sm:px-3 py-1.5 rounded-lg text-xs">
                <UserIcon className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span className="text-slate-200 font-medium max-w-[80px] sm:max-w-[120px] truncate">
                  {user.fullName}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 transition-all"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-brand-600/30 active:scale-95"
            >
              <UserIcon className="w-4 h-4" />
              <span>Ingresar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
