import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, BookOpen, FileText, AlertCircle, Upload, GraduationCap, Paperclip, Check } from 'lucide-react';
import { appointmentsApi } from '../services/api';
import { Appointment } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedStartTime: string;
  initialSubject?: string;
  hourlyRate?: number;
  availableSubjects?: string[];
  teacherId?: string;
  teacherName?: string;
  onBookingSuccess: (appointment: Appointment, totalPrice: number) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedStartTime,
  initialSubject = '',
  hourlyRate = 0,
  availableSubjects = [],
  teacherId,
  teacherName,
  onBookingSuccess,
}) => {
  const [subject, setSubject] = useState<string>(initialSubject);
  const [academicLevel, setAcademicLevel] = useState<string>('Terciario / Universitario');
  const [specificTopics, setSpecificTopics] = useState<string>('');
  const [studyMaterialUrl, setStudyMaterialUrl] = useState<string>('');
  const [materialFileName, setMaterialFileName] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setSubject(initialSubject || (availableSubjects[0] || ''));
      setSpecificTopics('');
      setStudyMaterialUrl('');
      setMaterialFileName('');
      setNotes('');
    }
  }, [isOpen, initialSubject, availableSubjects]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError('El archivo no debe superar los 8MB.');
        return;
      }
      setMaterialFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudyMaterialUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Cálculo automático de la Hora Fin en base a las horas seleccionadas
  const computeEndTime = (start: string, duration: number) => {
    const [h, m] = start.split(':').map(Number);
    const endH = (h + duration).toString().padStart(2, '0');
    const minutesStr = (m || 0).toString().padStart(2, '0');
    return `${endH}:${minutesStr}`;
  };

  const calculatedEndTime = computeEndTime(selectedStartTime, durationHours);
  const totalPrice = durationHours * hourlyRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await appointmentsApi.create({
        date: selectedDate,
        startTime: selectedStartTime,
        endTime: calculatedEndTime,
        subject,
        academicLevel,
        specificTopics,
        studyMaterialUrl,
        notes: notes ? `${notes} (Duración: ${durationHours} hs)` : `Duración: ${durationHours} hs`,
        teacherId,
        teacherName,
      });
      onBookingSuccess(created, totalPrice);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (typeof msg === 'string') {
        setError(msg);
      } else if (Array.isArray(msg)) {
        setError(msg.join(', '));
      } else {
        setError('No se pudo reservar el turno. Intente nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjectOptions = availableSubjects && availableSubjects.length > 0
    ? availableSubjects
    : (subject ? [subject] : []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Reservar Clase Particular</h2>
            <p className="text-xs text-slate-400">Ingresá los detalles para que el docente prepare tu clase</p>
          </div>
        </div>

        {/* Slot Info Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2 text-slate-300">
            <CalendarIcon className="w-4 h-4 text-brand-400" />
            <span className="font-semibold">{selectedDate}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">{selectedStartTime} a {calculatedEndTime} hs</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Materia y Nivel Educativo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Materia Seleccionada
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              >
                {subjectOptions.map((subjOption) => (
                  <option key={subjOption} value={subjOption}>
                    {subjOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>Nivel Educativo</span>
              </label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="Secundario">Secundario</option>
                <option value="Terciario / Universitario">Terciario / Universitario</option>
                <option value="Ingreso / Preuniversitario">Ingreso / Preuniversitario</option>
                <option value="Otro / Consulta Especial">Otro / Consulta Especial</option>
              </select>
            </div>
          </div>

          {/* Temas Específicos que le van a tomar */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Temas Específicos a Evaluar / Repasar
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Integrales dobles, Ecuaciones diferenciales, Derivadas..."
              value={specificTopics}
              onChange={(e) => setSpecificTopics(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Adjuntar Material de la Escuela / Facultad (Sugerencia de la página) */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-amber-400" />
                Material de Estudio / Referencia (Opcional)
              </span>
              <span className="text-[10px] text-amber-200/70">Fotos, guía o examen</span>
            </div>
            <p className="text-[11px] text-slate-300">
              💡 <span className="font-semibold text-amber-300">Sugerencia:</span> Adjuntá una foto o PDF de la guía práctica, programa o parcial de tu colegio/facultad para que el docente prepare referencias antes de la clase.
            </p>

            <div className="flex items-center space-x-2 pt-1">
              <label className="flex-1 cursor-pointer flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-850 border border-amber-500/40 text-slate-200 py-2 px-3 rounded-xl text-xs font-semibold transition-all">
                <Upload className="w-4 h-4 text-amber-400" />
                <span className="truncate">{materialFileName || 'Adjuntar Foto / PDF de la Guía'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {studyMaterialUrl && (
                <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1.5 rounded-xl shrink-0">
                  <Check className="w-3.5 h-3.5 mr-1" /> Adjuntado
                </span>
              )}
            </div>
          </div>

          {/* Cantidad de Horas */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Seleccionar Cantidad de Horas:
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Valor: ${hourlyRate.toLocaleString('es-AR')} / hs
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setDurationHours(hours)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    durationHours === hours
                      ? 'bg-brand-600 text-white border-brand-400 shadow-md shadow-brand-600/30 scale-[1.02]'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {hours} {hours === 1 ? 'Hora' : 'Horas'}
                </button>
              ))}
            </div>
          </div>

          {/* Monto Total Estimado */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Monto Total Estimado</span>
              <span className="text-xs text-brand-300">
                {durationHours} {durationHours === 1 ? 'hora' : 'horas'} x ${hourlyRate.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-mono font-extrabold text-amber-400">
                ${totalPrice.toLocaleString('es-AR')} ARS
              </span>
            </div>
          </div>

          {/* Notas Adicionales */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas Adicionales (Opcional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <textarea
                rows={2}
                placeholder="Ej: Consultas sobre el horario o detalles del examen..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Información de Pago por Transferencia */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">💳 Método de Pago: Transferencia Bancaria Directa</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-slate-300 space-y-0.5 shadow-md text-[11px]">
              <span className="font-bold text-emerald-400 block">🟢 Transferencia por Alias / CBU / CVU</span>
              <span className="text-[10px] text-slate-400">Podés abonar desde la app de tu banco o Mercado Pago sin comisiones extra. Al finalizar adjuntás tu comprobante.</span>
            </div>
          </div>

          {/* Advertencia de Almacenamiento en DB y Activación al Pagar */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-slate-400 text-[11px]">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              🔒 <span className="font-bold text-slate-200">Activación mediante pago:</span> Toda la información (temas, nivel y archivos adjuntos) se registra temporalmente en la base de datos y <span className="text-amber-400 font-semibold">se activa definitivamente cuando pagás</span>. Si no realizás el pago, el turno y toda la información cargada se borran automáticamente.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !subject || !specificTopics}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? 'Reservando...' : `Confirmar Reserva ($${totalPrice.toLocaleString('es-AR')})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
