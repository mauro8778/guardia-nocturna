import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Phone, AlertCircle, GraduationCap, Briefcase, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'RESET'>('LOGIN');
  const [role, setRole] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'LOGIN') {
        await login(email, password);
        onClose();
      } else if (mode === 'REGISTER') {
        await register({ email, password, fullName, phone, role });
        onClose();
      } else if (mode === 'RESET') {
        await resetPassword(email, password);
        setSuccessMsg('¡Contraseña actualizada! Sesión iniciada automáticamente.');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (Array.isArray(msg)) {
        setError(msg.join(', '));
      } else if (typeof msg === 'string') {
        setError(msg);
      } else {
        setError('Ocurrió un error. Verifique sus credenciales.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'LOGIN' ? 'Iniciar Sesión' : mode === 'REGISTER' ? 'Crear Cuenta' : 'Cambiar / Restablecer Contraseña'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'LOGIN'
              ? 'Accedé a tus turnos de clases en Guardia Docente'
              : mode === 'REGISTER'
              ? 'Registrate para reservar o dictar clases particulares online'
              : 'Ingresá tu correo y tu nueva contraseña para actualizar la cuenta'}
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <>
              {/* Role Selector: Alumno vs Docente */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo de Cuenta</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('STUDENT')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                      role === 'STUDENT'
                        ? 'bg-brand-600 text-white border-brand-400 shadow-md shadow-brand-600/30'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Alumno</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                      role === 'ADMIN'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Docente / Profesor</span>
                  </button>
                </div>

                {role === 'ADMIN' && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-purple-950/70 border border-purple-500/40 text-purple-200 text-xs space-y-1 shadow-lg">
                    <p className="font-bold flex items-center gap-1 text-purple-300">
                      🎁 <span>Prueba Gratuita por Tiempo Limitado: 10 Días Gratis</span>
                    </p>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      Registrate sin costo inicial. Tu cuenta incluye 10 días para probar la plataforma dictando clases presenciales o virtuales. Al finalizar la prueba podés elegir tu plan: <strong className="text-amber-300">10% por clase</strong> o <strong className="text-emerald-300">$50.000/mes fijo (0% comisión)</strong>.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder={role === 'ADMIN' ? 'Prof. Carlos Gómez' : 'Juan Pérez'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                {mode === 'RESET' ? 'Nueva Contraseña' : 'Contraseña'}
              </label>
              {mode === 'LOGIN' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('RESET');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <KeyRound className="w-3 h-3" />
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono (WhatsApp)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="+54 9 11 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-600/30 disabled:opacity-50 mt-2"
          >
            {isSubmitting
              ? 'Procesando...'
              : mode === 'LOGIN'
              ? 'Entrar'
              : mode === 'REGISTER'
              ? `Crear Cuenta de ${role === 'ADMIN' ? 'Docente' : 'Alumno'}`
              : 'Actualizar Contraseña'}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800 pt-4 flex items-center justify-between">
          {mode === 'RESET' ? (
            <button
              onClick={() => {
                setMode('LOGIN');
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-brand-400 font-semibold hover:underline mx-auto"
            >
              ← Volver al inicio de sesión
            </button>
          ) : (
            <>
              <span>{mode === 'LOGIN' ? '¿No tenés una cuenta?' : '¿Ya tenés cuenta?'}</span>
              <button
                onClick={() => {
                  setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-brand-400 font-semibold hover:underline"
              >
                {mode === 'LOGIN' ? 'Registrate gratis' : 'Iniciá sesión'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
