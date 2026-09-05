import React, { useState } from 'react';
import { X, CheckCircle, Copy, Check, ShieldCheck, Upload, FileCheck } from 'lucide-react';
import { Appointment } from '../types';
import { appointmentsApi } from '../services/api';

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  totalPrice?: number;
  aliasMP?: string;
  linkMP?: string;
  teacherName?: string;
  onOpenWhatsApp: (appointment: Appointment, customMessage?: string) => void;
  onReceiptSubmitted?: (updatedAppt: Appointment) => void;
}

export const MP_ALIAS_DEFAULT = 'guardia.nocturna.mp';
export const MP_TITULAR_DEFAULT = 'Guardia Nocturna SRL';

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  isOpen,
  onClose,
  appointment,
  totalPrice = 5000,
  aliasMP = MP_ALIAS_DEFAULT,
  teacherName = 'Guardia Nocturna SRL',
  onReceiptSubmitted,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [receiptRef, setReceiptRef] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; dataUrl: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  if (!isOpen || !appointment) return null;

  const currentAlias = aliasMP || MP_ALIAS_DEFAULT;

  const handleCopyAlias = () => {
    navigator.clipboard.writeText(currentAlias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Manejar selección de archivo (Foto o PDF)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Límite de tamaño 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo supera el límite de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        type: file.type,
        dataUrl: reader.result as string,
      });
      if (!receiptRef) {
        setReceiptRef(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Subir comprobante en la plataforma web
  const handleSubmitWebReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !receiptRef.trim()) {
      alert('Por favor selecciona una foto/PDF o escribe el N° de Operación.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await appointmentsApi.submitReceipt(appointment.id, {
        receiptRef: receiptRef.trim() || selectedFile?.name || 'Comprobante Adjunto',
        receiptUrl: selectedFile?.dataUrl || '',
      });
      
      setSubmittedSuccess(true);
      if (onReceiptSubmitted) onReceiptSubmitted(updated);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error al subir comprobante:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="flex flex-col items-center text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">¡Reserva Registrada!</h2>
          <p className="text-[11px] text-amber-300 font-semibold bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/20">
            {submittedSuccess ? '🟢 Estado: Activado (Comprobante Enviado)' : '⚪ Estado: Pendiente de Pago (Se activará al subir comprobante)'}
          </p>
          <p className="text-[10px] text-slate-400 max-w-sm mt-1">
            💡 <span className="text-slate-300 font-semibold">Tus temas y archivos adjuntos se guardaron en la base de datos.</span> Subí tu comprobante dentro de los 15 minutos para <span className="text-amber-400 font-bold">activar tu reserva</span>; caso contrario la información se borrará automáticamente.
          </p>
        </div>

        {/* Payment Card: Direct Bank Transfer / Alias */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 space-y-3 bg-slate-950/80">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">Método de Pago: Transferencia Bancaria</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono font-bold">0% Comisión</span>
          </div>

          {/* Alias Box with Copy Action */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Alias para Transferir</p>
              <p className="text-base font-mono font-extrabold text-amber-400 tracking-wide">{currentAlias}</p>
            </div>
            <button
              type="button"
              onClick={handleCopyAlias}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Alias</span>
                </>
              )}
            </button>
          </div>

          {/* Transfer Info Breakdown */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block">Docente / Titular:</span>
              <span className="font-semibold text-slate-200 text-xs">{appointment.teacherName || teacherName}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block">Monto Total a Abonar:</span>
              <span className="font-extrabold text-amber-300 text-xs font-mono">
                ${totalPrice.toLocaleString('es-AR')} ARS
              </span>
            </div>
          </div>
        </div>

        {/* Web Receipt Submission Form with Photo/PDF Upload */}
        <form onSubmit={handleSubmitWebReceipt} className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-200">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">Cargar Foto o PDF del Comprobante</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">JPG, PNG, PDF (Máx 5MB)</span>
          </div>

          {/* File Picker & Dropzone */}
          {!selectedFile ? (
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-all p-3 text-center">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-slate-200">Hacé clic para seleccionar tu comprobante</span>
              <span className="text-[10px] text-slate-500">Seleccioná una imagen o PDF de tu transferencia</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            /* Selected File Preview Box */
            <div className="flex items-center justify-between p-3 bg-slate-900 border border-emerald-500/40 rounded-2xl">
              <div className="flex items-center space-x-3 overflow-hidden">
                {selectedFile.type.startsWith('image/') ? (
                  <img src={selectedFile.dataUrl} alt="Preview" className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-700" />
                ) : (
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                    PDF
                  </div>
                )}
                <div className="truncate">
                  <span className="text-xs font-bold text-white block truncate">{selectedFile.name}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">✓ Listo para enviar</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title="Quitar archivo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Optional N° Operacion Input */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-semibold block">N° de Operación / Nota (Opcional):</label>
            <input
              type="text"
              placeholder="Ej: N° Transacción 8472910482"
              value={receiptRef}
              onChange={(e) => setReceiptRef(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!selectedFile && !receiptRef.trim()) || submittedSuccess}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <FileCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Procesando comprobante...' : submittedSuccess ? '✓ ¡Comprobante Registrado! Docente notificado' : '🚀 Enviar Comprobante (Bloquear Turno)'}</span>
          </button>
        </form>

        <button
          onClick={onClose}
          className="w-full py-1 text-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Cerrar y volver a la grilla
        </button>
      </div>
    </div>
  );
};
