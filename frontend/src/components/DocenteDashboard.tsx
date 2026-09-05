import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Video,
  MessageSquare,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Trash2,
  BookOpen,
  Settings,
  Plus,
  Save,
  Check,
  X,
} from 'lucide-react';
import { Appointment, AppointmentStatus, DocenteAvailability } from '../types';
import { appointmentsApi, availabilityApi, adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface DocenteDashboardProps {
  availability: DocenteAvailability | null;
  onUpdateAvailability: (newConfig: Partial<DocenteAvailability>) => Promise<void>;
  onOpenClassroom: (appointment: Appointment) => void;
  onOpenWhatsApp: (appointment: Appointment | null, customMessage?: string) => void;
}

const DAYS_NAMES = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 0, name: 'Domingo' },
];

export const DocenteDashboard: React.FC<DocenteDashboardProps> = ({
  availability,
  onUpdateAvailability,
  onOpenClassroom,
  onOpenWhatsApp,
}) => {
  const { user, updateUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT_UNPAID' | 'RECEIPT_SUBMITTED' | 'CONFIRMED_PAID'>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Membership modal & selection state
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState<boolean>(false);
  const [currentMembershipType, setCurrentMembershipType] = useState<'COMMISSION_10' | 'MONTHLY_FIXED'>(
    (user?.membershipType as any) === 'MONTHLY_FIXED' ? 'MONTHLY_FIXED' : 'COMMISSION_10'
  );
  const [monthlyReceiptRef, setMonthlyReceiptRef] = useState<string>('');
  const [monthlyFile, setMonthlyFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [isSubmittingMonthlyReceipt, setIsSubmittingMonthlyReceipt] = useState<boolean>(false);

  const handleSelectPlan = async (membershipType: 'COMMISSION_10' | 'MONTHLY_FIXED') => {
    if (!user) return;
    try {
      await adminApi.updateMyMembership({ teacherId: user.id, membershipType });
      setCurrentMembershipType(membershipType);
      updateUser({ membershipType });
      showToast(`¡Plan de Membresía guardado: ${
        membershipType === 'MONTHLY_FIXED' ? 'Fijo Mensual $50.000 (0% comisión)' : '10% por clase'
      }!`);
      setIsMembershipModalOpen(false);
    } catch (err) {
      console.error('Error al actualizar plan:', err);
      showToast('Error al actualizar el plan.');
    }
  };

  const handleUploadMonthlyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmittingMonthlyReceipt(true);
    try {
      await adminApi.submitMembershipPayment({
        teacherId: user.id,
        teacherName: user.fullName,
        receiptRef: monthlyReceiptRef || monthlyFile?.name || 'Comprobante Mensual $50k',
        receiptUrl: monthlyFile?.dataUrl || undefined,
      });
      showToast('¡Comprobante de Membresía Mensual ($50.000) enviado para aprobación!');
      setIsMembershipModalOpen(false);
    } catch (err) {
      console.error('Error al enviar comprobante:', err);
      showToast('Error al enviar comprobante.');
    } finally {
      setIsSubmittingMonthlyReceipt(false);
    }
  };

  // SubTab (Turnos vs Disponibilidad)
  const [subTab, setSubTab] = useState<'TURNOS' | 'DISPONIBILIDAD'>('TURNOS');

  // Form State para Configuración de Disponibilidad
  const [teacherName, setTeacherName] = useState<string>(availability?.teacherName ?? '');
  const [teacherPhone, setTeacherPhone] = useState<string>(availability?.teacherPhone ?? '');
  const [aliasMP, setAliasMP] = useState<string>(availability?.aliasMP ?? '');
  const [linkMP, setLinkMP] = useState<string>(availability?.linkMP ?? '');
  const [is24Hours, setIs24Hours] = useState<boolean>(availability?.is24Hours ?? false);
  const [startHour, setStartHour] = useState<number>(availability?.startHour ?? 8);
  const [endHour, setEndHour] = useState<number>(availability?.endHour ?? 22);
  const [hourlyRate, setHourlyRate] = useState<number>(availability?.hourlyRate ?? 0);
  const [pricingType, setPricingType] = useState<'PER_HOUR' | 'PER_SUBJECT'>(availability?.pricingType ?? 'PER_HOUR');
  const [subjectRates, setSubjectRates] = useState<Record<string, number>>(availability?.subjectRates ?? {});
  const [availableDays, setAvailableDays] = useState<number[]>(availability?.availableDays ?? [1, 2, 3, 4, 5, 6]);
  const [subjectsList, setSubjectsList] = useState<string[]>(
    availability?.subjects ?? []
  );
  const [newSubjectInput, setNewSubjectInput] = useState<string>('');
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  useEffect(() => {
    if (availability) {
      setTeacherName(availability.teacherName || '');
      setTeacherPhone(availability.teacherPhone || '');
      setAliasMP(availability.aliasMP || '');
      setLinkMP(availability.linkMP || '');
      setIs24Hours(availability.is24Hours);
      setStartHour(availability.startHour);
      setEndHour(availability.endHour);
      setHourlyRate(availability.hourlyRate);
      setPricingType(availability.pricingType || 'PER_HOUR');
      setSubjectRates(availability.subjectRates || {});
      setAvailableDays(availability.availableDays);
      setSubjectsList(availability.subjects || []);
    }
  }, [availability]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchAllAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await appointmentsApi.getAll();
      setAppointments(data);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAppointments();
    const fetchMyConfig = async () => {
      try {
        const config = await availabilityApi.getMyConfig();
        if (config) {
          setTeacherName(config.teacherName || '');
          setTeacherPhone(config.teacherPhone || '');
          setAliasMP(config.aliasMP || '');
          setLinkMP(config.linkMP || '');
          setIs24Hours(config.is24Hours);
          setStartHour(config.startHour);
          setEndHour(config.endHour);
          setHourlyRate(config.hourlyRate);
          setAvailableDays(config.availableDays);
          setSubjectsList(config.subjects || []);
        }
      } catch (err) {
        console.error('Error al cargar disponibilidad propia:', err);
      }
    };
    fetchMyConfig();
  }, []);

  // Actualizar estado de pago desde el Dashboard
  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const updated = await appointmentsApi.updateStatus(id, newStatus);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      const label = newStatus === 'CONFIRMED_PAID' ? '🟢 Pagado Aprobado' : newStatus === 'RECEIPT_SUBMITTED' ? '🟡 En Revisión' : '🔴 Cancelado';
      showToast(`Estado del turno actualizado a: ${label}`);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      showToast('No se pudo actualizar el estado.');
    }
  };

  // Cancelar/Eliminar turno
  const handleDeleteAppointment = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar este turno?')) return;
    try {
      await appointmentsApi.delete(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      showToast('Turno cancelado y liberado correctamente.');
    } catch (error) {
      console.error('Error al eliminar turno:', error);
      showToast('No se pudo eliminar el turno.');
    }
  };

  // Filtrado
  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch =
      app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.receiptRef && app.receiptRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.notes && app.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Métricas
  const totalTurnos = appointments.length;
  const draftsCount = appointments.filter((a) => a.status === 'DRAFT_UNPAID').length;
  const revisionCount = appointments.filter((a) => a.status === 'RECEIPT_SUBMITTED').length;
  const pagadosCount = appointments.filter((a) => a.status === 'CONFIRMED_PAID').length;
  
  const [supportedModalities, setSupportedModalities] = useState<'VIRTUAL' | 'PRESENCIAL' | 'BOTH'>(availability?.supportedModalities ?? 'BOTH');
  const [teacherAddress, setTeacherAddress] = useState<string>(availability?.teacherAddress ?? '');
  const [offersAtStudentHome, setOffersAtStudentHome] = useState<boolean>(availability?.offersAtStudentHome ?? false);
  const [allowGroupClasses, setAllowGroupClasses] = useState<boolean>(availability?.allowGroupClasses ?? false);
  const [minGroupStudents, setMinGroupStudents] = useState<number>(availability?.minGroupStudents ?? 1);
  const [maxGroupStudents, setMaxGroupStudents] = useState<number>(availability?.maxGroupStudents ?? 5);

  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // Estimado de ingresos
  const totalRecaudado = pagadosCount * hourlyRate;
  const totalRevision = revisionCount * hourlyRate;

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await onUpdateAvailability({
        teacherName,
        teacherPhone,
        aliasMP,
        linkMP,
        is24Hours,
        startHour,
        endHour,
        hourlyRate,
        pricingType,
        subjectRates,
        availableDays,
        subjects: subjectsList,
        supportedModalities,
        teacherAddress,
        offersAtStudentHome,
        allowGroupClasses,
        minGroupStudents,
        maxGroupStudents,
      });
      showToast('¡Configuración de disponibilidad guardada con éxito!');
    } catch (err) {
      console.error('Error al guardar disponibilidad:', err);
      showToast('Error al guardar la configuración.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="glass-panel px-4 py-3 rounded-2xl border border-brand-500/40 shadow-2xl flex items-center space-x-3 text-xs text-white">
            <span className="font-semibold">{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Membership & Free Trial Status Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950/90 via-slate-900 to-slate-950 border border-purple-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs shadow-xl">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold shrink-0 text-lg">
            🎁
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-white text-sm flex flex-wrap items-center gap-2">
              Membresía Docente: <span className="text-purple-300 font-extrabold">10 Días de Prueba Gratuita Activa</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-extrabold">
                10 Días Gratis 🟢
              </span>
            </h3>
            <p className="text-slate-300 text-xs">
              Tenés acceso total y gratuito a la grilla online. Al finalizar o durante la prueba podés elegir tu plan: <span className="text-amber-300 font-semibold">10% por clase</span>, <span className="text-emerald-300 font-semibold">$50.000 mensual (0% comisión)</span> o solicitar <span className="text-purple-300 font-semibold">Plan Beca VIP</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsMembershipModalOpen(true)}
            className="w-full md:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-1.5"
          >
            <span>👑 Elegir / Modificar Mi Plan</span>
          </button>
        </div>
      </div>

      {/* Dashboard Top Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Panel de Administración Docente</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dashboard de Gestión
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Revisá comprobantes enviados, aprobá cobros y gestioná las aulas virtuales
          </p>
        </div>

        <button
          onClick={fetchAllAppointments}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* SubTab Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSubTab('TURNOS')}
          className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            subTab === 'TURNOS'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Gestión de Turnos ({totalTurnos})</span>
        </button>

        <button
          onClick={() => setSubTab('DISPONIBILIDAD')}
          className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            subTab === 'DISPONIBILIDAD'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuración de Horarios y Disponibilidad</span>
        </button>
      </div>

      {subTab === 'DISPONIBILIDAD' ? (
        /* Availability Configuration Form */
        <form onSubmit={handleSaveAvailability} className="glass-panel p-4 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400 shrink-0" />
                Configuración de Horarios & Días de Atención
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configurá tu disponibilidad laboral, el modo 24 Horas y las materias habilitadas
              </p>
            </div>

            <button
              type="submit"
              disabled={isSavingConfig}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingConfig ? 'Guardando...' : '💾 Guardar Configuración'}</span>
            </button>
          </div>
          {/* Datos del Perfil Docente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre Visible del Profesor/a:
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Ej: Prof. Mauro Díaz"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Teléfono WhatsApp:
              </label>
              <input
                type="text"
                value={teacherPhone}
                onChange={(e) => setTeacherPhone(e.target.value)}
                placeholder="Ej: 5491133231465"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alias MP / CBU (Transferencia Directa):
              </label>
              <input
                type="text"
                value={aliasMP}
                onChange={(e) => setAliasMP(e.target.value)}
                placeholder="Ej: guardia.nocturna.mp"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Link MP / Checkout / QR (Opcional):
              </label>
              <input
                type="text"
                value={linkMP}
                onChange={(e) => setLinkMP(e.target.value)}
                placeholder="Ej: https://mpago.la/pos/..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-sky-400 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* 1. Modo Guardia Nocturna 24 Horas */}
          <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-slate-950/80 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-bold text-white block flex items-center gap-2">
                ⚡ Modo Guardia Docente 24 Horas
                {is24Hours && (
                  <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                    ACTIVADO 24/7
                  </span>
                )}
              </span>
              <p className="text-xs text-slate-400">
                Habilita las 24 horas del día (00:00 a 23:00 hs) para reservas continuas online.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={is24Hours}
                onChange={(e) => setIs24Hours(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* 2. Rango Horario de Atención (si no es 24hs) */}
          {!is24Hours && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hora de Inicio de Atención:
                </label>
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00 hs
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hora de Cierre de Atención:
                </label>
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00 hs
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 3. Días de la Semana Habilitados */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300">
              Días de la Semana con Atención Habilitada:
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {DAYS_NAMES.map((day) => {
                const active = availableDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => {
                      if (active) {
                        setAvailableDays(availableDays.filter((d) => d !== day.id));
                      } else {
                        setAvailableDays([...availableDays, day.id].sort((a, b) => a - b));
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                      active
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{day.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Tarifa por Hora */}
          <div className="space-y-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300">
              Tarifa por Hora de Clase ($ ARS):
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">$</span>
              <input
                type="number"
                step="500"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-7 pr-4 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* 5. Gestión de Materias Habilitadas */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300">
              Materias Dictadas Habilitadas para Alumnos:
            </label>

            <div className="flex items-center space-x-2 max-w-md">
              <input
                type="text"
                placeholder="Ej: Álgebra Lineal"
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newSubjectInput.trim()) return;
                  if (!subjectsList.includes(newSubjectInput.trim())) {
                    setSubjectsList([...subjectsList, newSubjectInput.trim()]);
                  }
                  setNewSubjectInput('');
                }}
                className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {subjectsList.map((subj) => (
                <div
                  key={subj}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200"
                >
                  <span>{subj}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (subjectsList.length <= 1) {
                        alert('Debe haber al menos una materia habilitada.');
                        return;
                      }
                      setSubjectsList(subjectsList.filter((s) => s !== subj));
                    }}
                    className="text-slate-500 hover:text-red-400 transition-colors text-sm font-bold"
                    title="Eliminar materia"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      ) : (
        <>

      {/* Metrics Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Registrados</span>
            <BookOpen className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{totalTurnos}</p>
          <span className="text-[11px] text-slate-400">({draftsCount} borradores sin comprobante)</span>
        </div>

        <div className="glass-yellow p-5 rounded-2xl border border-amber-500/40 space-y-2">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-semibold">Comprobantes a Verificar 🟡</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-300 font-mono">{revisionCount}</p>
          <span className="text-[11px] text-amber-200 font-mono">
            ${totalRevision.toLocaleString('es-AR')} por aprobar
          </span>
        </div>

        <div className="glass-green p-5 rounded-2xl border border-emerald-500/40 space-y-2">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-xs font-semibold">Turnos Confirmados 🟢</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-300 font-mono">{pagadosCount}</p>
          <span className="text-[11px] text-emerald-200 font-mono">
            ${totalRecaudado.toLocaleString('es-AR')} confirmados
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-oat-300/30 space-y-2">
          <div className="flex items-center justify-between text-oat-300">
            <span className="text-xs font-semibold">Recaudación Confirmada</span>
            <DollarSign className="w-4 h-4 text-oat-300" />
          </div>
          <p className="text-2xl font-extrabold text-oat-300 font-mono">
            ${totalRecaudado.toLocaleString('es-AR')} ARS
          </p>
          <span className="text-[11px] text-slate-400">Ingresos efectivizados</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por alumno, materia o N° comprobante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
          />
        </div>

        {/* Status Tabs Filter */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({appointments.length})
          </button>
          <button
            onClick={() => setStatusFilter('RECEIPT_SUBMITTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              statusFilter === 'RECEIPT_SUBMITTED'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            🟡 En Revisión ({revisionCount})
          </button>
          <button
            onClick={() => setStatusFilter('CONFIRMED_PAID')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              statusFilter === 'CONFIRMED_PAID'
                ? 'bg-emerald-600 text-white shadow-md font-bold'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            🟢 Confirmados ({pagadosCount})
          </button>
        </div>
      </div>

      {/* Appointments Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Filter className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No se encontraron turnos</p>
            <p className="text-xs text-slate-500">Pruebe modificando los términos de búsqueda o filtros.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Alumno</th>
                    <th className="py-3.5 px-4">Materia</th>
                    <th className="py-3.5 px-4">Comprobante N°</th>
                    <th className="py-3.5 px-4">Fecha / Hora</th>
                    <th className="py-3.5 px-4">Estado Pago</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAppointments.map((appt) => {
                    const isDraft = appt.status === 'DRAFT_UNPAID';
                    const isSubmitted = appt.status === 'RECEIPT_SUBMITTED';
                    const isPaid = appt.status === 'CONFIRMED_PAID';

                    return (
                      <tr key={appt.id} className="hover:bg-slate-900/60 transition-colors">
                        {/* Alumno Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-400 font-bold shrink-0">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-white block">{appt.studentName}</span>
                              <span className="text-[10px] text-slate-400">ID: {appt.studentId.substring(0, 8)}...</span>
                            </div>
                          </div>
                        </td>

                        {/* Materia, Nivel, Temas & Guía Adjunta */}
                        <td className="py-3.5 px-4 space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-white block">{appt.subject}</span>
                            {appt.academicLevel && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {appt.academicLevel}
                              </span>
                            )}
                          </div>

                          {appt.specificTopics && (
                            <p className="text-[11px] font-semibold text-brand-300">
                              📌 Temas: <span className="text-slate-200">{appt.specificTopics}</span>
                            </p>
                          )}

                          {appt.studyMaterialUrl && (
                            <button
                              onClick={() => setPreviewReceiptUrl(appt.studyMaterialUrl || null)}
                              className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg transition-all"
                            >
                              <span>📄 Ver Guía / Material de Estudio</span>
                            </button>
                          )}

                          {appt.notes && (
                            <span className="text-[10px] text-slate-400 truncate max-w-xs block italic">
                              "{appt.notes}"
                            </span>
                          )}
                        </td>

                        {/* Comprobante / Archivo */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {appt.receiptRef && (
                              <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs block w-max">
                                {appt.receiptRef}
                              </span>
                            )}

                            {appt.receiptUrl ? (
                              <button
                                onClick={() => setPreviewReceiptUrl(appt.receiptUrl || null)}
                                className="flex items-center space-x-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2 py-1 rounded-lg transition-all"
                              >
                                <span>🖼️ Ver Foto / PDF</span>
                              </button>
                            ) : (
                              !appt.receiptRef && <span className="text-[11px] text-slate-500 italic">Sin archivo</span>
                            )}
                          </div>
                        </td>

                        {/* Fecha / Hora */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5 text-slate-200">
                              <Calendar className="w-3.5 h-3.5 text-brand-400" />
                              <span className="font-semibold">{appt.date}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[11px]">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>{appt.startTime} a {appt.endTime} hs</span>
                            </div>
                          </div>
                        </td>

                        {/* Estado Pago */}
                        <td className="py-3.5 px-4">
                          {isDraft && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              ⚪ Sin Pago (Libre)
                            </span>
                          )}
                          {isSubmitted && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED_PAID')}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 transition-all animate-pulse"
                              title="Hacé clic para Aprobar Pago 🟢"
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                              <span>🟡 En Revisión (Aprobar 🟢)</span>
                            </button>
                          )}
                          {isPaid && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, 'RECEIPT_SUBMITTED')}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 transition-all"
                              title="Hacé clic para Revertir a Revisión 🟡"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>🟢 Pago Confirmado</span>
                            </button>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Contactar por WhatsApp */}
                            <button
                              onClick={() =>
                                onOpenWhatsApp(
                                  appt,
                                  `¡Hola ${appt.studentName}! Te escribo desde Guardia Docente respecto a tu turno de *${appt.subject}* el día *${appt.date}* a las *${appt.startTime} hs*.`
                                )
                              }
                              className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
                              title="Enviar WhatsApp al Alumno"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>

                            {/* Entrar a la Clase Virtual */}
                            <button
                              onClick={() => onOpenClassroom(appt)}
                              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all"
                              title="Ingresar al Aula Virtual HD"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Aula HD</span>
                            </button>

                            {/* Eliminar Turno */}
                            <button
                              onClick={() => handleDeleteAppointment(appt.id)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-800 transition-all"
                              title="Cancelar / Eliminar turno"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< md) */}
            <div className="block md:hidden p-4 space-y-4">
              {filteredAppointments.map((appt) => {
                const isDraft = appt.status === 'DRAFT_UNPAID';
                const isSubmitted = appt.status === 'RECEIPT_SUBMITTED';
                const isPaid = appt.status === 'CONFIRMED_PAID';

                return (
                  <div key={appt.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-400 font-bold shrink-0">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block">{appt.studentName}</span>
                          <span className="text-[10px] text-slate-400">📅 {appt.date} • ⏰ {appt.startTime} hs</span>
                        </div>
                      </div>

                      {isDraft && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          ⚪ Sin Pago
                        </span>
                      )}
                      {isSubmitted && (
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED_PAID')}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                        >
                          🟡 En Revisión (Aprobar 🟢)
                        </button>
                      )}
                      {isPaid && (
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'RECEIPT_SUBMITTED')}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        >
                          🟢 Pago Confirmado
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-white">{appt.subject}</span>
                        {appt.academicLevel && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {appt.academicLevel}
                          </span>
                        )}
                      </div>

                      {appt.specificTopics && (
                        <p className="text-[11px] font-medium text-brand-300">
                          📌 Temas: <span className="text-slate-200">{appt.specificTopics}</span>
                        </p>
                      )}

                      {appt.studyMaterialUrl && (
                        <button
                          onClick={() => setPreviewReceiptUrl(appt.studyMaterialUrl || null)}
                          className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg"
                        >
                          <span>📄 Ver Guía / Material de Estudio</span>
                        </button>
                      )}

                      {appt.receiptUrl && (
                        <button
                          onClick={() => setPreviewReceiptUrl(appt.receiptUrl || null)}
                          className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-lg ml-2"
                        >
                          <span>🖼️ Ver Foto / PDF</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() =>
                          onOpenWhatsApp(
                            appt,
                            `¡Hola ${appt.studentName}! Te escribo desde Guardia Docente respecto a tu turno de *${appt.subject}* el día *${appt.date}* a las *${appt.startTime} hs*.`
                          )
                        }
                        className="flex-1 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center space-x-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => onOpenClassroom(appt)}
                        className="flex-1 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center justify-center space-x-1"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Aula HD</span>
                      </button>

                      <button
                        onClick={() => handleDeleteAppointment(appt.id)}
                        className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-red-400 border border-slate-800"
                        title="Cancelar turno"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      </>
      )}

      {/* 👑 Modal de Selección de Plan de Membresía Docente */}
      {isMembershipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsMembershipModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
                <span>Planes de Membresía Guardia Docente</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Elegí tu Plan de Trabajo</h2>
              <p className="text-xs text-slate-400">
                Podés cambiar o seleccionar tu plan durante o al finalizar tu prueba gratuita de 10 días.
              </p>
            </div>

            {/* Cards Grid of 2 Plans (10% por clase vs $50.000 / Mes) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Plan 1: 10% por clase */}
              <div
                onClick={() => handleSelectPlan('COMMISSION_10')}
                className={`p-4.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  currentMembershipType === 'COMMISSION_10'
                    ? 'bg-brand-600/20 border-brand-500 shadow-lg shadow-brand-500/20 ring-1 ring-brand-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-base">
                    📊
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base">10% por Clase</h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    Sin costo ni cuota fija. Pagás solo el 10% de cada clase vendida. Si no dictás clases, pagás $0.
                  </p>
                </div>
                <button
                  type="button"
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                    currentMembershipType === 'COMMISSION_10'
                      ? 'bg-brand-600 text-white shadow-brand-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {currentMembershipType === 'COMMISSION_10' ? '✓ Plan Activo' : 'Elegir 10% por Clase'}
                </button>
              </div>

              {/* Plan 2: $50.000 Fijo Mensual */}
              <div
                onClick={() => handleSelectPlan('MONTHLY_FIXED')}
                className={`p-4.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  currentMembershipType === 'MONTHLY_FIXED'
                    ? 'bg-emerald-600/20 border-emerald-500 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-base">
                    💎
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base">$50.000 / Mes</h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    Cuota fija mensual con <strong className="text-emerald-300 font-bold">0% de comisión</strong> por clase. Clases ilimitadas.
                  </p>
                </div>
                <button
                  type="button"
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                    currentMembershipType === 'MONTHLY_FIXED'
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {currentMembershipType === 'MONTHLY_FIXED' ? '✓ Plan Activo' : 'Elegir $50k / Mes'}
                </button>
              </div>
            </div>

            {/* Formulario de Carga de Comprobante si es $50k Mensual */}
            {currentMembershipType === 'MONTHLY_FIXED' && (
              <form onSubmit={handleUploadMonthlyPayment} className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <span>💳 Abonar o Subir Comprobante de Membresía Mensual ($50.000 ARS)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Transferí <strong className="text-amber-400 font-mono">$50.000 ARS</strong> al Alias <strong className="text-emerald-300 font-mono">guardia.nocturna.mp</strong> y adjuntá tu N° de transacción o comprobante:
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="N° de Operación / Comprobante (Ej: 948271034)"
                    value={monthlyReceiptRef}
                    onChange={(e) => setMonthlyReceiptRef(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingMonthlyReceipt || !monthlyReceiptRef.trim()}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all disabled:opacity-40"
                  >
                    {isSubmittingMonthlyReceipt ? 'Enviando...' : '🚀 Enviar Comprobante de $50.000 para Aprobación'}
                  </button>
                </div>
              </form>
            )}

            <button
              onClick={() => setIsMembershipModalOpen(false)}
              className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
