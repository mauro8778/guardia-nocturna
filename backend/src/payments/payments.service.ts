import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappGatewayService } from '../notifications/whatsapp-gateway.service';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { ProcessPayoutDto } from './dto/process-payout.dto';

export interface PreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
  isSimulated: boolean;
  totalAmount: number;
  appointmentId: string;
  subject: string;
  teacherName: string;
}

export interface TeacherBalanceReport {
  teacherId: string;
  teacherName: string;
  totalGrossRevenue: number;
  platformFeeAccumulated: number;
  totalTeacherNetEarned: number;
  totalPaidOut: number;
  pendingBalance: number;
}

export interface FinancialsSummary {
  totalGrossRevenue: number;
  totalPlatformFee: number;
  totalTeacherNetEarned: number;
  totalPaidOutToTeachers: number;
  pendingBalanceToTeachers: number;
  teachersBalances: TeacherBalanceReport[];
  recentTransactions: Array<Record<string, unknown>>;
  recentPayouts: Array<Record<string, unknown>>;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappGateway: WhatsappGatewayService,
  ) {}

  async createPreference(
    dto: CreatePreferenceDto,
    studentId: string,
    studentEmail?: string,
  ): Promise<PreferenceResponse> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException(`El turno con ID ${dto.appointmentId} no existe`);
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const totalAmount = dto.customAmount || appointment.totalAmount;

    // Si existe el token oficial de Mercado Pago en .env, integramos la API oficial
    if (accessToken) {
      try {
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            items: [
              {
                id: appointment.id,
                title: `Clase Particular: ${appointment.subject} - ${appointment.teacherName}`,
                quantity: 1,
                currency_id: 'ARS',
                unit_price: totalAmount,
              },
            ],
            payer: {
              email: studentEmail || 'alumno@guardianocturna.com',
              name: appointment.studentName,
            },
            external_reference: appointment.id,
            notification_url: `${process.env.BACKEND_URL || 'https://guardianocturna.com'}/api/payments/webhook`,
            back_urls: {
              success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?status=success&appId=${appointment.id}`,
              failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?status=failure&appId=${appointment.id}`,
              pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?status=pending&appId=${appointment.id}`,
            },
            auto_return: 'approved',
          }),
        });

        if (response.ok) {
          const mpData = (await response.json()) as { id: string; init_point: string; sandbox_init_point: string };
          return {
            preferenceId: mpData.id,
            initPoint: mpData.init_point,
            sandboxInitPoint: mpData.sandbox_init_point,
            isSimulated: false,
            totalAmount,
            appointmentId: appointment.id,
            subject: appointment.subject,
            teacherName: appointment.teacherName,
          };
        }
      } catch (err) {
        this.logger.error('Error invocando API Mercado Pago, usando fallback simulado:', err);
      }
    }

    // Obtener linkMP configurado por el docente si existe
    const teacherAvail = await this.prisma.availability.findUnique({
      where: { teacherId: appointment.teacherId },
    });

    const teacherLink = teacherAvail?.linkMP && teacherAvail.linkMP.trim().length > 5
      ? (teacherAvail.linkMP.startsWith('http') ? teacherAvail.linkMP : `https://${teacherAvail.linkMP}`)
      : `https://www.mercadopago.com.ar`;

    // Pasarela Fallback / Preference Mercado Pago
    const simulatedPrefId = `PREF-MP-${appointment.id.substring(0, 8)}-${Date.now()}`;
    return {
      preferenceId: simulatedPrefId,
      initPoint: teacherLink,
      isSimulated: true,
      totalAmount,
      appointmentId: appointment.id,
      subject: appointment.subject,
      teacherName: appointment.teacherName,
    };
  }

  async processSimulatedPayment(appointmentId: string): Promise<Record<string, unknown>> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado para procesar pago');
    }

    // Actualizar estado a CONFIRMED_PAID (🟢 Verde)
    const updatedAppt = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CONFIRMED_PAID',
        receiptRef: `MP-CHECKOUT-${Date.now().toString().slice(-6)}`,
      },
    });

    // Registrar Transacción de Pago
    await this.prisma.paymentTransaction.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        mpPaymentId: `PAY-MP-${Date.now()}`,
        mpPreferenceId: `PREF-${appointmentId.substring(0, 8)}`,
        paymentMethod: 'MERCADO_PAGO_CHECKOUT',
        status: 'APPROVED',
        totalAmount: appointment.totalAmount,
        platformFee: appointment.platformFee,
        teacherNet: appointment.teacherNet,
        teacherId: appointment.teacherId,
        studentId: appointment.studentId,
      },
      update: {
        status: 'APPROVED',
      },
    });

    // Despachar alerta de WhatsApp
    const teacherAvail = await this.prisma.availability.findUnique({
      where: { teacherId: appointment.teacherId },
    });

    this.whatsappGateway.sendNotification({
      recipientPhone: teacherAvail?.teacherPhone || '5491133231465',
      recipientRole: 'TEACHER',
      event: 'RECEIPT_SUBMITTED',
      data: {
        studentName: appointment.studentName,
        teacherName: appointment.teacherName,
        subject: appointment.subject,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        totalAmount: appointment.totalAmount,
      },
    });

    return {
      message: 'Pago acreditado y procesado exitosamente vía Mercado Pago',
      appointment: updatedAppt,
    };
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    this.logger.log(`Webhook de Mercado Pago recibido: ${JSON.stringify(payload)}`);

    const appointmentId =
      (payload.appointmentId as string) ||
      (payload.external_reference as string) ||
      ((payload.data as Record<string, unknown>)?.appointmentId as string);

    if (appointmentId) {
      await this.processSimulatedPayment(appointmentId);
      return { status: 'processed', appointmentId };
    }

    return { status: 'acknowledged' };
  }

  async getFinancialsSummary(): Promise<FinancialsSummary> {
    const confirmedAppointments = await this.prisma.appointment.findMany({
      where: { status: 'CONFIRMED_PAID' },
    });

    const payouts = await this.prisma.teacherPayout.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const transactions = await this.prisma.paymentTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    let totalGrossRevenue = 0;
    let totalPlatformFee = 0;
    let totalTeacherNetEarned = 0;

    const teacherMap = new Map<string, TeacherBalanceReport>();

    for (const appt of confirmedAppointments) {
      totalGrossRevenue += appt.totalAmount;
      totalPlatformFee += appt.platformFee;
      totalTeacherNetEarned += appt.teacherNet;

      const tId = appt.teacherId || 'teacher-admin-id';
      const existing = teacherMap.get(tId) || {
        teacherId: tId,
        teacherName: appt.teacherName || 'Docente Guardia Nocturna',
        totalGrossRevenue: 0,
        platformFeeAccumulated: 0,
        totalTeacherNetEarned: 0,
        totalPaidOut: 0,
        pendingBalance: 0,
      };

      existing.totalGrossRevenue += appt.totalAmount;
      existing.platformFeeAccumulated += appt.platformFee;
      existing.totalTeacherNetEarned += appt.teacherNet;
      teacherMap.set(tId, existing);
    }

    let totalPaidOutToTeachers = 0;
    for (const payout of payouts) {
      totalPaidOutToTeachers += payout.amount;
      const existing = teacherMap.get(payout.teacherId);
      if (existing) {
        existing.totalPaidOut += payout.amount;
      }
    }

    const teachersBalances: TeacherBalanceReport[] = Array.from(teacherMap.values()).map((t) => ({
      ...t,
      pendingBalance: Math.max(0, t.totalTeacherNetEarned - t.totalPaidOut),
    }));

    const pendingBalanceToTeachers = Math.max(0, totalTeacherNetEarned - totalPaidOutToTeachers);

    return {
      totalGrossRevenue,
      totalPlatformFee,
      totalTeacherNetEarned,
      totalPaidOutToTeachers,
      pendingBalanceToTeachers,
      teachersBalances,
      recentTransactions: transactions as unknown as Array<Record<string, unknown>>,
      recentPayouts: payouts as unknown as Array<Record<string, unknown>>,
    };
  }

  async processPayout(dto: ProcessPayoutDto): Promise<Record<string, unknown>> {
    const teacherUser = await this.prisma.user.findUnique({
      where: { id: dto.teacherId },
    });

    const teacherName = teacherUser ? teacherUser.fullName : 'Docente Guardia Nocturna';

    const payout = await this.prisma.teacherPayout.create({
      data: {
        teacherId: dto.teacherId,
        teacherName,
        amount: dto.amount,
        reference: dto.reference || `LIQ-MP-${Date.now()}`,
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    return {
      message: `Liquidación de $${dto.amount.toLocaleString('es-AR')} registrada exitosamente para ${teacherName}`,
      payout,
    };
  }
}
