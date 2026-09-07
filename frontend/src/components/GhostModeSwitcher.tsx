import React from 'react';
import { Ghost, User, BookOpen, Shield } from 'lucide-react';
import { useGhostMode, GhostRole } from '../context/GhostModeContext';

const modes: { role: GhostRole; label: string; desc: string; icon: React.ReactNode; color: string; bg: string }[] = [
  {
    role: 'REAL_ADMIN',
    label: 'Admin Real',
    desc: 'Dashboard de administración',
    icon: <Shield className="w-3.5 h-3.5" />,
    color: 'text-amber-300',
    bg: 'bg-amber-500/20 border-amber-500',
  },
  {
    role: 'GHOST_STUDENT',
    label: 'Simular Alumno',
    desc: 'Vista de reserva · Turnos fantasma',
    icon: <User className="w-3.5 h-3.5" />,
    color: 'text-sky-300',
    bg: 'bg-sky-500/20 border-sky-500',
  },
  {
    role: 'GHOST_TEACHER',
    label: 'Simular Docente',
    desc: 'Dashboard del docente',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/20 border-emerald-500',
  },
];

export const GhostModeSwitcher: React.FC = () => {
  const { isSuperAdmin, ghostRole, setGhostRole } = useGhostMode();

  if (!isSuperAdmin) return null;

  const active = modes.find((m) => m.role === ghostRole) ?? modes[0];

  return (
    <div className="fixed bottom-5 left-5 z-[9999] flex flex-col items-start gap-1.5 select-none">
      {/* Panel de opciones */}
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl space-y-1.5 w-52">
        {/* Header */}
        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-800">
          <Ghost className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Ghost Mode</span>
        </div>

        {modes.map((mode) => (
          <button
            key={mode.role}
            type="button"
            onClick={() => setGhostRole(mode.role)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
              ghostRole === mode.role
                ? `${mode.bg} ${mode.color}`
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
          >
            <span className={ghostRole === mode.role ? mode.color : 'text-slate-600'}>
              {mode.icon}
            </span>
            <div className="text-left">
              <span className="block font-bold">{mode.label}</span>
              <span className={`text-[9px] font-normal ${ghostRole === mode.role ? 'opacity-80' : 'text-slate-600'}`}>
                {mode.desc}
              </span>
            </div>
            {ghostRole === mode.role && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Badge compacto del modo activo */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold ${active.bg} ${active.color}`}>
        {active.icon}
        <span>{active.label}</span>
        {ghostRole !== 'REAL_ADMIN' && (
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
        )}
      </div>
    </div>
  );
};
