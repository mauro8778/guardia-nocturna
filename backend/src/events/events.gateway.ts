import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('🔌 WebSocket Gateway inicializado correctamente.');
  }

  handleConnection(client: Socket) {
    this.logger.log(`⚡ Cliente conectado a WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Cliente desconectado: ${client.id}`);
  }

  // Notificar nuevo turno creado en tiempo real
  notifyAppointmentCreated(appointment: any) {
    if (this.server) {
      this.server.emit('appointmentCreated', {
        type: 'APPOINTMENT_CREATED',
        appointment,
        message: `¡Nuevo turno reservado para ${appointment.subject}!`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Notificar actualización de estado de turno
  notifyAppointmentUpdated(appointment: any) {
    if (this.server) {
      this.server.emit('appointmentUpdated', {
        type: 'APPOINTMENT_UPDATED',
        appointment,
        message: `Turno de ${appointment.subject} actualizado a ${appointment.status}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Notificar comprobante cargado por el alumno o docente
  notifyReceiptSubmitted(data: any) {
    if (this.server) {
      this.server.emit('receiptSubmitted', {
        type: 'RECEIPT_SUBMITTED',
        data,
        message: `Nuevo comprobante recibido para el turno de ${data.subject || 'materia'}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Notificar cambio en membresía docente
  notifyMembershipUpdated(data: any) {
    if (this.server) {
      this.server.emit('membershipUpdated', {
        type: 'MEMBERSHIP_UPDATED',
        data,
        message: `Membresía del docente actualizada`,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
