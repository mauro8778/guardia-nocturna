import React, { useState } from 'react';
import { X, MessageSquare, Send, ExternalLink } from 'lucide-react';
import { Appointment } from '../types';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  customMessage?: string;
}

const ADMIN_WHATSAPP_NUMBER = '5491133231465';

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  appointment,
  customMessage,
}) => {
  const [message, setMessage] = useState<string>('');

  React.useEffect(() => {
    if (customMessage) {
      setMessage(customMessage);
    } else if (appointment) {
      const formattedMessage =
        `¡Hola Guardia Docente! Reservé un turno para la materia *${appointment.subject}* el día *${appointment.date}* de *${appointment.startTime} a ${appointment.endTime} hs* (Alumno: ${appointment.studentName}). Quisiera confirmar el método de pago y el acceso al aula virtual.`;
      setMessage(formattedMessage);
    } else {
      setMessage(`¡Hola Guardia Docente! Quisiera hacer una consulta sobre las clases particulares online.`);
    }
  }, [appointment, customMessage, isOpen]);

  if (!isOpen) return null;

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Enviar Mensaje por WhatsApp</h2>
            <p className="text-xs text-slate-400">Consultas y comprobantes de pago</p>
          </div>
        </div>

        {/* Form Body - Only Message Textarea */}
        <div className="space-y-4">

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Escribí tu mensaje:</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribí tu consulta aquí..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none font-sans"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Abrir WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
