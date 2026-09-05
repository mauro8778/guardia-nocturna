import { Injectable, Logger } from '@nestjs/common';

export interface WhatsAppNotificationPayload {
  recipientPhone: string;
  recipientRole: 'STUDENT' | 'TEACHER' | 'ADMIN';
  event:
    | 'APPOINTMENT_RESERVED'
    | 'RECEIPT_SUBMITTED'
    | 'APPOINTMENT_CONFIRMED'
    | 'DOCENTE_APPROVED'
    | 'DOCENTE_REJECTED';
  data: {
    studentName?: string;
    teacherName?: string;
    subject?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    receiptRef?: string;
    meetingUrl?: string;
    totalAmount?: number;
  };
}

@Injectable()
export class WhatsappGatewayService {
  private readonly logger = new Logger(WhatsappGatewayService.name);

  /**
   * Genera el mensaje formateado con Emojis para WhatsApp segun el evento
   */
  formatMessage(payload: WhatsAppNotificationPayload): string {
    const { event, data } = payload;

    switch (event) {
      case 'APPOINTMENT_RESERVED':
        return (
          `🌙 *GUARDIA NOCTURNA - RESERVA REGISTRADA*\n\n` +
          `Hola ${data.studentName || 'Alumno/a'},\n` +
          `Tu turno para *${data.subject}* el *${data.date}* de *${data.startTime} a ${data.endTime} hs* fue registrado.\n\n` +
          `💰 *Monto a abonar:* $${data.totalAmount || 5000} ARS\n` +
          `📌 Estado actual: 🟡 *Pago Pendiente*\n\n` +
          `🌙 *GUARDIA DOCENTE - RESERVA REGISTRADA*\n\n` +
          `Hola ${data.studentName}, registraste una reserva para *${data.subject}* el día *${data.date}* de *${data.startTime} a ${data.endTime} hs*.\n` +
          `Docente: *${data.teacherName}*\n\n` +
          `📌 Estado: *🟡 Pendiente de Comprobante*\n` +
          `Por favor cargá tu comprobante para confirmar el turno.`
        );

      case 'RECEIPT_SUBMITTED':
        return (
          `🔔 *GUARDIA DOCENTE - COMPROBANTE CARGADO*\n\n` +
          `Recibimos el comprobante ref: *${data.receiptRef || 'N/A'}* para la clase de *${data.subject}*.\n` +
          `El docente o administrador está validando la transferencia. Te notificaremos al confirmar.`
        );

      case 'APPOINTMENT_CONFIRMED':
        return (
          `🎉 *GUARDIA DOCENTE - TURNO CONFIRMADO 🟢*\n\n` +
          `¡Tu pago fue validado! Tu clase de *${data.subject}* el día *${data.date}* a las *${data.startTime} hs* está confirmada.\n\n` +
          `🔗 Aula Virtual HD: ${data.meetingUrl || 'Disponible en la grilla'}`
        );

      case 'DOCENTE_APPROVED':
        return (
          `✅ *GUARDIA DOCENTE - SOLICITUD APROBADA*\n\n` +
          `¡Felicitaciones ${data.teacherName}! Tu cuenta de profesor ha sido verificada y aprobada por el Administrador.\n` +
          `Ya podés configurar tus horarios y recibir reservas.`
        );

      case 'DOCENTE_REJECTED':
        return (
          `⚠️ *GUARDIA DOCENTE - ESTADO DE REGISTRO*\n\n` +
          `Hola ${data.teacherName}, tu solicitud de registro de docente ha sido revisada por el Administrador. Contactanos para más detalles.`
        );

      default:
        return `🔔 *GUARDIA DOCENTE*: Notificación del sistema para ${data.studentName || data.teacherName || 'usuario'}.`;
    }
  }

  /**
   * Construye el enlace directo para enviar mensaje de WhatsApp Web / App
   */
  generateWhatsAppLink(phone: string, textMessage: string): string {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const encodedText = encodeURIComponent(textMessage);
    return `https://wa.me/${cleanPhone || '5491133231465'}?text=${encodedText}`;
  }

  /**
   * Despacha y registra el evento en el Gateway del sistema
   */
  sendNotification(payload: WhatsAppNotificationPayload): { message: string; waLink: string } {
    const textMessage = this.formatMessage(payload);
    const waLink = this.generateWhatsAppLink(payload.recipientPhone, textMessage);

    this.logger.log(
      `\n=======================================================\n` +
      `[WHATSAPP GATEWAY -> ${payload.recipientRole}]\n` +
      `Destinatario: ${payload.recipientPhone}\n` +
      `Evento: ${payload.event}\n` +
      `Link Directo: ${waLink}\n` +
      `Contenido:\n${textMessage}\n` +
      `=======================================================\n`
    );

    return { message: textMessage, waLink };
  }
}
