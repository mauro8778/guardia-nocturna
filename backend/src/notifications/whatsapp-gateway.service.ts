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
          `Por favor adjuntá tu comprobante en la plataforma para confirmación inmediata.`
        );

      case 'RECEIPT_SUBMITTED':
        return (
          `🔔 *GUARDIA NOCTURNA - COMPROBANTE CARGADO*\n\n` +
          `Estimado/a ${data.teacherName || 'Docente'},\n` +
          `El alumno *${data.studentName}* cargó un comprobante para la clase de *${data.subject}* el *${data.date}* (${data.startTime} hs).\n\n` +
          `📄 *Ref/Comprobante:* ${data.receiptRef || 'Adjunto'}\n` +
          `Por favor revisá tu Dashboard Docente para confirmar el turno en verde 🟢.`
        );

      case 'APPOINTMENT_CONFIRMED':
        return (
          `🎉 *GUARDIA NOCTURNA - TURNO CONFIRMADO 🟢*\n\n` +
          `Hola ${data.studentName},\n` +
          `¡Tu clase de *${data.subject}* con *${data.teacherName}* fue CONFIRMADA!\n\n` +
          `📅 *Fecha:* ${data.date}\n` +
          `⏰ *Horario:* ${data.startTime} a ${data.endTime} hs\n` +
          `🔗 *Aula Virtual Jitsi:* ${data.meetingUrl || 'Ingresá al sitio para unirte'}`
        );

      case 'DOCENTE_APPROVED':
        return (
          `✅ *GUARDIA NOCTURNA - SOLICITUD APROBADA*\n\n` +
          `Estimado/a ${data.teacherName},\n` +
          `¡Felicitaciones! Tu cuenta de Docente ha sido APROBADA por la Administración.\n` +
          `Ya podés ingresar a tu Dashboard para configurar tus horarios, materias y precios.`
        );

      case 'DOCENTE_REJECTED':
        return (
          `⚠️ *GUARDIA NOCTURNA - ESTADO DE REGISTRO*\n\n` +
          `Estimado/a ${data.teacherName},\n` +
          `Tu solicitud de registro como Docente se encuentra pausada. Por favor comunicate con administración para mayor detalle.`
        );

      default:
        return `🔔 *GUARDIA NOCTURNA*: Notificación del sistema para ${data.studentName || data.teacherName || 'usuario'}.`;
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
