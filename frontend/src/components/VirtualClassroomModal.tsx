import React from 'react';
import { X, Video, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { Appointment } from '../types';

interface VirtualClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export const VirtualClassroomModal: React.FC<VirtualClassroomModalProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  if (!isOpen || !appointment) return null;

  const cleanRoom = appointment.id ? appointment.id.replace(/-/g, '').slice(0, 12) : 'aula-live';
  const baseMeetingUrl = appointment.meetingUrl
    ? appointment.meetingUrl.split('#')[0]
    : `https://meet.jit.si/guardia-nocturna-${cleanRoom}`;
  
  // URL con parámetros de bypass para ingreso directo sin pedir anfitrión ni login
  const meetingUrl = `${baseMeetingUrl}#config.prejoinPageEnabled=false&config.requireDisplayName=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&interfaceConfig.PREJOIN_PAGE_ENABLED=false&interfaceConfig.SHOW_JITSI_WATERMARK=false`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Aula Virtual - {appointment.subject}
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  En Vivo
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Alumno: <strong className="text-slate-200">{appointment.studentName}</strong> | Horario: {appointment.startTime} - {appointment.endTime} hs
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
              title="Abrir en ventana flotante"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pestaña Externa</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Meeting Room Frame */}
        <div className="flex-1 bg-slate-950 relative">
          <iframe
            src={meetingUrl}
            allow="camera; microphone; display-capture; autoplay; clipboard-write"
            className="w-full h-full border-none"
            title="Aula Virtual Guardia Nocturna"
          />
        </div>

        {/* Modal Footer Banner */}
        <div className="px-6 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2 text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Conexión segura cifrada punta a punta</span>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Guardia Nocturna Video Platform v1.0
          </p>
        </div>
      </div>
    </div>
  );
};
