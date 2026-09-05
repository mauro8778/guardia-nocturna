import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Video,
  MessageSquare,
  Lock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { User as UserIcon } from 'lucide-react';
import { Appointment, AppointmentStatus, DocenteAvailability } from '../types';
import { useAuth } from '../context/AuthContext';
import { BookOpen } from 'lucide-react';

interface CalendarViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  appointments: Appointment[];
  allTeacherAvailabilities: DocenteAvailability[];
  activeTeacher: DocenteAvailability | null;
  selectedTeacherId: string;
  onTeacherChange: (teacherId: string) => void;
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  onSelectSlotToBook: (time: string) => void;
  onUpdateStatus: (id: string, newStatus: AppointmentStatus) => void;
  onOpenWhatsApp: (appointment: Appointment) => void;
  onOpenClassroom: (appointment: Appointment) => void;
}

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onDateChange,
  appointments,
  allTeacherAvailabilities,
  activeTeacher,
  selectedTeacherId,
  onTeacherChange,
  selectedSubject,
  onSubjectChange,
  onSelectSlotToBook,
  onUpdateStatus,
  onOpenWhatsApp,
  onOpenClassroom,
}) => {
  const { user } = useAuth();

  const availability = activeTeacher;

  // Días habilitados y rango horario dinámico
  const currentDayNum = new Date(selectedDate + 'T00:00:00').getDay();
  const currentDayName = DAYS_OF_WEEK[currentDayNum];
  const isDayAvailable = !availability || (availability.availableDays && availability.availableDays.includes(currentDayNum));

  const getDynamicHours = () => {
    if (!availability) {
      return [
        '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00'
      ];
    }

    if (availability.is24Hours) {
      return Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    }

    const start = Math.max(0, Math.min(23, availability.startHour ?? 8));
    const end = Math.max(start, Math.min(23, availability.endHour ?? 22));
    const hoursArr: string[] = [];
    for (let h = start; h <= end; h++) {
      hoursArr.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return hoursArr;
  };

  const HOURS = getDynamicHours();

  // Helper para mover fecha (+1 día, -1 día)
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const timeToMin = (t: string): number => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const getAppointmentForSlot = (time: string): { appointment: Appointment; isStartSlot: boolean } | undefined => {
    const slotMin = timeToMin(time);
    const appt = appointments.find((a) => {
      if (a.status === 'CANCELLED') return false;
      const startMin = timeToMin(a.startTime);
      const endMin = timeToMin(a.endTime || `${Math.floor(startMin / 60) + 1}:00`);
      return slotMin >= startMin && slotMin < endMin;
    });

    if (!appt) return undefined;

    return {
      appointment: appt,
      isStartSlot: appt.startTime === time,
    };
  };

  // Verificar si la videollamada está activa en el horario actual
  const isClassroomActive = (appointment: Appointment): boolean => {
    if (user?.role === 'ADMIN') return true; // Docente siempre puede ingresar
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (appointment.date !== todayStr) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = appointment.startTime.split(':').map(Number);
    const startMinutes = startH * 60 + (startM || 0);

    const [endH, endM] = (appointment.endTime || `${startH + 1}:00`).split(':').map(Number);
    const endMinutes = endH * 60 + (endM || 0);

    // Habilitado desde 15 min antes del inicio hasta el fin de la clase
    return currentMinutes >= (startMinutes - 15) && currentMinutes <= endMinutes;
  };

  // Extraer todas las materias únicas dictadas por los docentes
  const allUniqueSubjects = Array.from(
    new Set(allTeacherAvailabilities.flatMap((t) => t.subjects || []))
  );

  // Filtrar los profesores que dictan la materia seleccionada
  const teachersForSelectedSubject = allTeacherAvailabilities.filter((t) =>
    t.subjects?.includes(selectedSubject)
  );

  return (
    <div className="w-full space-y-6">
      {/* Calendar Header Control Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Grilla de Turnos
              <span className="text-xs font-normal text-slate-400">({selectedDate})</span>
            </h2>
            <p className="text-xs text-slate-400">Seleccioná materia, docente y horario para reservar tu clase online</p>
          </div>
        </div>

        {/* Date Selector & Nav Controls */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Día Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-brand-300 focus:outline-none px-2 py-1 cursor-pointer font-mono"
          />

          <button
            onClick={() => shiftDate(1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Día Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Legend Indicators */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
            <span className="text-slate-300 font-medium">🟡 Pendiente</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-700"></span>
            <span className="text-slate-400">Ocupado</span>
          </div>
        </div>
      </div>

      {/* 📚 Paso 1: Elegir Materia */}
      <div className="glass-panel p-4 rounded-2xl border border-brand-500/30 bg-slate-900/90 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              1. Seleccioná la Materia que querés cursar:
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {allUniqueSubjects.map((subj) => (
            <button
              key={subj}
              type="button"
              onClick={() => onSubjectChange(subj)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedSubject === subj
                  ? 'bg-brand-600 text-white border-brand-400 shadow-md shadow-brand-600/40 scale-[1.02]'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* 👨‍🏫 Paso 2: Elegir Docente que la dicta */}
      <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-slate-900/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserIcon className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              2. Seleccioná el Profesora/Profesor para "{selectedSubject}":
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {teachersForSelectedSubject.length} docentes disponibles
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(teachersForSelectedSubject.length > 0
            ? teachersForSelectedSubject
            : allTeacherAvailabilities
          ).map((doc) => {
            const isSelected = doc.teacherId === selectedTeacherId;
            return (
              <div
                key={doc.teacherId}
                onClick={() => onTeacherChange(doc.teacherId)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                    isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'
                  }`}>
                    {doc.teacherName.charAt(0)}
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-white truncate">{doc.teacherName}</h4>
                    <p className="text-[10px] text-amber-300 font-mono font-bold">
                      ${doc.hourlyRate.toLocaleString('es-AR')} ARS {doc.pricingType === 'PER_SUBJECT' ? '• Por Materia' : '• Por Hora'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {doc.is24Hours ? '⚡ 24 hs Guardia Docente' : `${doc.startHour}:00 a ${doc.endHour}:00 hs`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isSelected ? '✓ Elegido' : 'Elegir'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Banner de Día No Habilitado */}
      {!isDayAvailable && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-3 text-amber-300 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="font-bold">El docente no dicta clases los días {currentDayName}.</p>
            <p className="text-[11px] text-amber-300/80 mt-0.5">
              Por favor seleccioná otro día de la semana en el calendario para consultar los turnos disponibles.
            </p>
          </div>
        </div>
      )}

      {/* Hourly Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {HOURS.map((time) => {
          const slotMatch = getAppointmentForSlot(time);
          const rawAppt = slotMatch?.appointment;
          const isStartSlot = slotMatch?.isStartSlot ?? false;

          const isOwner = user && rawAppt && rawAppt.studentId === user.id;
          const isAdmin = user && user.role === 'ADMIN';

          // El turno está bloqueado para el público si ya enviaron comprobante (RECEIPT_SUBMITTED) o si está pagado (CONFIRMED_PAID).
          // Si está en DRAFT_UNPAID, solo lo ve el dueño o admin; para el resto del público figura DISPONIBLE.
          const isSlotLocked = rawAppt && (rawAppt.status === 'RECEIPT_SUBMITTED' || rawAppt.status === 'CONFIRMED_PAID');
          const isVisibleDraft = rawAppt && rawAppt.status === 'DRAFT_UNPAID' && (isOwner || isAdmin);

          const appointment = isSlotLocked || isVisibleDraft ? rawAppt : undefined;
          const isBooked = !!appointment;

          const isDraft = appointment?.status === 'DRAFT_UNPAID';
          const isSubmitted = appointment?.status === 'RECEIPT_SUBMITTED';
          const isPaid = appointment?.status === 'CONFIRMED_PAID';

          return (
            <div
              key={time}
              className={`relative rounded-2xl p-4 transition-all duration-200 ${
                !isBooked
                  ? 'glass-card hover:border-brand-500/50 hover:bg-slate-900/80 group cursor-pointer'
                  : isDraft
                  ? 'glass-oat border-oat-300/40'
                  : isSubmitted
                  ? 'glass-yellow border-amber-500/40'
                  : isPaid
                  ? 'glass-green border-emerald-500/40'
                  : 'glass-disabled border-slate-800/40'
              }`}
            >
              {/* Card Top Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className={`w-4 h-4 ${isSubmitted ? 'text-amber-400' : isPaid ? 'text-emerald-400' : isDraft ? 'text-oat-300' : 'text-slate-400'}`} />
                  <span className="font-mono text-sm font-bold text-white">{time} hs</span>
                </div>

                {/* Status Badges */}
                {isDraft && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-oat-200/20 text-oat-300 border border-oat-300/40">
                    ⚪ Sin Comprobante (Libre)
                  </span>
                )}
                {isSubmitted && (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    {isStartSlot ? '🟡 En Revisión (Bloqueado)' : `🟡 Cubierto (${appointment.startTime} - ${appointment.endTime})`}
                  </span>
                )}
                {isPaid && (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {isStartSlot ? '🟢 Turno Confirmado' : `🟢 Reservado (${appointment.startTime} - ${appointment.endTime})`}
                  </span>
                )}
                {!isBooked && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-brand-300 border border-slate-700/50 group-hover:bg-brand-600 group-hover:text-white transition-all">
                    Disponible
                  </span>
                )}
              </div>

              {/* Card Body Content */}
              {isBooked ? (
                <div className="space-y-3">
                  {isStartSlot ? (
                    <div>
                      <h4 className="text-sm font-bold text-white truncate">{appointment.subject}</h4>
                      <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                        Alumno: <span className="font-semibold text-slate-100">{appointment.studentName}</span>
                      </p>
                      {/* Modality & Group Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          appointment.modality === 'PRESENCIAL'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        }`}>
                          {appointment.modality === 'PRESENCIAL' ? '📍 Presencial' : '🎥 Virtual (Online)'}
                        </span>

                        {appointment.classType === 'GROUP' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            👥 Grupal ({appointment.enrolledCount || 1}/{appointment.maxStudents || 5})
                          </span>
                        )}
                      </div>

                      {appointment.modality === 'PRESENCIAL' && appointment.classAddress && (
                        <p className="text-[10px] text-amber-300 font-mono mt-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 truncate">
                          📍 Lugar: {appointment.classAddress}
                        </p>
                      )}

                      {appointment.receiptRef && (
                        <p className="text-[11px] text-amber-300 font-mono mt-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 truncate">
                          Comprobante: {appointment.receiptRef}
                        </p>
                      )}
                      {appointment.notes && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/40">
                          "{appointment.notes}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 truncate">{appointment.subject}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        Alumno: <span className="font-semibold text-slate-200">{appointment.studentName}</span>
                      </p>
                      <p className="text-[11px] font-medium text-amber-300/90 mt-1 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 italic">
                        ↳ Horario ocupado por turno de {appointment.startTime} a {appointment.endTime} hs
                      </p>
                    </div>
                  )}

                  {/* Action Buttons for Booked Slot */}
                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                    {/* Toggle Payment Status Button (For Admin or Owner) */}
                    {(isAdmin || isOwner) && isStartSlot && (
                      <button
                        onClick={() =>
                          onUpdateStatus(
                            appointment.id,
                            isPaid ? 'RECEIPT_SUBMITTED' : 'CONFIRMED_PAID'
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          isPaid
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/40'
                        }`}
                        title="Cambiar estado entre Revisión 🟡 y Pagado 🟢"
                      >
                        {isPaid ? '🟡 Revertir a Revisión' : '🟢 Aprobar Pago'}
                      </button>
                    )}

                    <div className="flex items-center space-x-1.5 ml-auto">
                      {/* WhatsApp Button */}
                      {isStartSlot && (
                        <button
                          onClick={() => onOpenWhatsApp(appointment)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all text-xs"
                          title="Enviar comprobante por WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Virtual Classroom Button (Only for Virtual classes!) */}
                      {appointment.modality !== 'PRESENCIAL' && (
                        isClassroomActive(appointment) ? (
                          <button
                            onClick={() => onOpenClassroom(appointment)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/30 transition-all animate-pulse"
                            title="Unirse al aula virtual HD en vivo"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Entrar</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-500 font-medium text-[11px] border border-slate-800 cursor-not-allowed opacity-70"
                            title={`Aula habilitada únicamente durante el horario de la clase (${appointment.startTime} hs)`}
                          >
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>Habilitado {appointment.startTime} hs</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Free Available Slot View */
                <div
                  onClick={() => onSelectSlotToBook(time)}
                  className="py-4 flex flex-col items-center justify-center text-center space-y-2"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800/80 group-hover:bg-brand-600 flex items-center justify-center text-slate-400 group-hover:text-white transition-all">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                    Tomar Turno
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
