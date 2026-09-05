import { Injectable, ConflictException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappGatewayService } from '../notifications/whatsapp-gateway.service';
import { Appointment, Prisma } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-status.dto';
import { SubmitReceiptDto } from './dto/submit-receipt.dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappGateway: WhatsappGatewayService,
  ) {}

  async cleanupExpiredDrafts(): Promise<number> {
    // Purge draft appointments older than 15 minutes that were never paid
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const deleted = await this.prisma.appointment.deleteMany({
      where: {
        status: 'DRAFT_UNPAID',
        createdAt: { lt: fifteenMinutesAgo },
      },
    });
    return deleted.count;
  }

  async findAll(
    date?: string,
    teacherId?: string,
    status?: string,
    search?: string,
  ): Promise<Appointment[]> {
    // Run cleanup asynchronously without blocking the read latency
    this.cleanupExpiredDrafts().catch((err) =>
      this.logger.error(`Error en la limpieza asíncrona de borradores: ${err.message}`, err.stack),
    );

    const whereClause: Prisma.AppointmentWhereInput = {};
    if (date) whereClause.date = date;
    if (teacherId) whereClause.teacherId = teacherId;
    if (status) whereClause.status = status;

    if (search && search.trim() !== '') {
      const cleanSearch = search.trim();
      whereClause.OR = [
        { subject: { contains: cleanSearch, mode: 'insensitive' } },
        { studentName: { contains: cleanSearch, mode: 'insensitive' } },
        { teacherName: { contains: cleanSearch, mode: 'insensitive' } },
        { receiptRef: { contains: cleanSearch, mode: 'insensitive' } },
        { notes: { contains: cleanSearch, mode: 'insensitive' } },
      ];
    }

    return this.prisma.appointment.findMany({
      where: whereClause,
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new NotFoundException(`Turno con ID ${id} no encontrado`);
    }
    return appointment;
  }

  async create(
    dto: CreateAppointmentDto,
    studentId: string,
    studentName: string,
  ): Promise<Appointment> {
    const studentUser = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (studentUser && studentUser.role === 'ADMIN') {
      throw new ForbiddenException(
        'Los profesores y administradores no pueden reservar turnos como alumnos. Por favor iniciá sesión con una cuenta de alumno.',
      );
    }

    let targetTeacherId = dto.teacherId;
    let targetTeacherName = dto.teacherName;

    if (!targetTeacherId) {
      const defaultTeacher = this.prisma.availability?.findFirst ? await this.prisma.availability.findFirst() : null;
      if (defaultTeacher) {
        targetTeacherId = defaultTeacher.teacherId;
        targetTeacherName = defaultTeacher.teacherName;
      } else {
        targetTeacherId = 'teacher-admin-id';
        targetTeacherName = 'Profesor Guardia Nocturna';
      }
    }

    const timeToMin = (t: string): number => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    const newStart = timeToMin(dto.startTime);
    const newEnd = timeToMin(dto.endTime || `${Math.floor(newStart / 60) + 1}:00`);
    const durationHours = Math.max(1, (newEnd - newStart) / 60);

    // Fetch teacher's availability config to calculate pricing
    const teacherAvail = await this.prisma.availability.findUnique({
      where: { teacherId: targetTeacherId },
    });

    let baseTeacherRate = 5000;
    let pricingType = 'PER_HOUR';

    if (teacherAvail) {
      pricingType = teacherAvail.pricingType || 'PER_HOUR';
      if (pricingType === 'PER_SUBJECT' && teacherAvail.subjectRates) {
        try {
          const rates = JSON.parse(teacherAvail.subjectRates);
          if (rates[dto.subject]) {
            baseTeacherRate = rates[dto.subject];
          } else {
            baseTeacherRate = teacherAvail.hourlyRate * durationHours;
          }
        } catch {
          baseTeacherRate = teacherAvail.hourlyRate * durationHours;
        }
      } else {
        baseTeacherRate = (teacherAvail.hourlyRate || 5000) * durationHours;
      }
    }

    // Check teacher user commission settings
    const teacherUser = await this.prisma.user.findUnique({ where: { id: targetTeacherId } });
    let commissionRate = 0.10; // 10% por defecto
    let applyCommission = true;

    if (teacherUser) {
      commissionRate = teacherUser.commissionRate ?? 0.10;
      applyCommission = teacherUser.applyCommission ?? true;
    }

    const teacherNet = baseTeacherRate; // El docente NUNCA pierde su ganancia fijada
    const platformFee = applyCommission ? Math.round(baseTeacherRate * commissionRate) : 0;
    const totalAmount = baseTeacherRate + platformFee; // El alumno paga el 10% de recargo de la plataforma sin desgloses confusos

    // Fetch active appointments for the target date and teacher
    const dateAppointments = await this.prisma.appointment.findMany({
      where: { date: dto.date, teacherId: targetTeacherId },
    });

    const isGroupBooking = dto.classType === 'GROUP';
    const maxGroupStudents = isGroupBooking ? (teacherAvail?.maxGroupStudents || 5) : 1;

    // Check overlap with locked appointments (RECEIPT_SUBMITTED or CONFIRMED_PAID)
    const overlappingLocked = dateAppointments.filter((appt) => {
      if (appt.status !== 'RECEIPT_SUBMITTED' && appt.status !== 'CONFIRMED_PAID') {
        return false;
      }
      const apptStart = timeToMin(appt.startTime);
      const apptEnd = timeToMin(appt.endTime || `${Math.floor(apptStart / 60) + 1}:00`);
      return newStart < apptEnd && apptStart < newEnd;
    });

    if (overlappingLocked.length > 0) {
      if (!isGroupBooking || overlappingLocked.some((a) => a.classType === 'INDIVIDUAL')) {
        throw new ConflictException(
          `El rango de horario seleccionado (${dto.startTime} a ${dto.endTime} hs) ya se encuentra reservado.`,
        );
      }

      // Group booking: count enrolled students
      const totalEnrolled = overlappingLocked.reduce((sum, a) => sum + (a.enrolledCount || 1), 0);
      if (totalEnrolled >= maxGroupStudents) {
        throw new ConflictException(
          `La clase grupal de ${dto.subject} ha alcanzado su cupo máximo de ${maxGroupStudents} alumnos.`,
        );
      }
    }

    // Determine final class address
    let finalClassAddress: string | null = null;
    const selectedModality = dto.modality || 'VIRTUAL';
    const selectedLocationType = dto.locationType || (selectedModality === 'PRESENCIAL' ? 'TEACHER_LOCATION' : 'VIRTUAL');

    if (selectedModality === 'PRESENCIAL') {
      if (selectedLocationType === 'TEACHER_LOCATION') {
        finalClassAddress = teacherAvail?.teacherAddress || 'Dirección del Estudio/Instituto del Docente';
      } else if (selectedLocationType === 'STUDENT_HOME') {
        finalClassAddress = dto.classAddress || 'Domicilio del Alumno';
      }
    }

    // Remove overlapping unpaid drafts or cancelled appointments efficiently
    const draftIdsToRemove = dateAppointments
      .filter((appt) => {
        if (appt.status !== 'DRAFT_UNPAID' && appt.status !== 'CANCELLED') {
          return false;
        }
        const apptStart = timeToMin(appt.startTime);
        const apptEnd = timeToMin(appt.endTime || `${Math.floor(apptStart / 60) + 1}:00`);
        return newStart < apptEnd && apptStart < newEnd;
      })
      .map((a) => a.id);

    if (draftIdsToRemove.length > 0) {
      await this.prisma.appointment.deleteMany({
        where: { id: { in: draftIdsToRemove } },
      });
    }

    // Auto-generate free embedded meeting room URL if Virtual
    const cleanRoomName = `guardia-docente-${dto.date}-${dto.startTime.replace(':', '')}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;
    const meetingUrl = selectedModality === 'VIRTUAL'
      ? `https://meet.jit.si/${cleanRoomName}#config.prejoinPageEnabled=false&config.requireDisplayName=false`
      : null;

    const newAppointment = await this.prisma.appointment.create({
      data: {
        date: dto.date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        subject: dto.subject,
        academicLevel: dto.academicLevel || '',
        specificTopics: dto.specificTopics || '',
        studyMaterialUrl: dto.studyMaterialUrl || '',
        notes: dto.notes || '',
        status: 'DRAFT_UNPAID',
        meetingUrl,
        teacherId: targetTeacherId,
        teacherName: targetTeacherName,
        studentId,
        studentName,
        totalAmount,
        platformFee,
        teacherNet,
        pricingType,
        modality: selectedModality,
        locationType: selectedLocationType,
        classAddress: finalClassAddress,
        classType: isGroupBooking ? 'GROUP' : 'INDIVIDUAL',
        maxStudents: maxGroupStudents,
        enrolledCount: 1,
      },
    });

    // Despachar alerta de WhatsApp vía Gateway
    this.whatsappGateway.sendNotification({
      recipientPhone: teacherAvail?.teacherPhone || '5491133231465',
      recipientRole: 'TEACHER',
      event: 'APPOINTMENT_RESERVED',
      data: {
        studentName,
        teacherName: targetTeacherName,
        subject: dto.subject,
        date: dto.date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        totalAmount,
      },
    });

    return newAppointment;
  }

  async submitReceipt(
    id: string,
    dto: SubmitReceiptDto,
    userId: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (appointment.studentId !== userId) {
      throw new ForbiddenException('No puedes enviar comprobantes para turnos de otros usuarios');
    }

    const saved = await this.prisma.appointment.update({
      where: { id },
      data: {
        receiptRef: dto.receiptRef || '',
        receiptUrl: dto.receiptUrl || '',
        status: 'RECEIPT_SUBMITTED',
      },
    });

    // Notificación automática por WhatsApp Gateway al docente
    const teacherAvail = await this.prisma.availability.findUnique({
      where: { teacherId: saved.teacherId },
    });

    this.whatsappGateway.sendNotification({
      recipientPhone: teacherAvail?.teacherPhone || '5491133231465',
      recipientRole: 'TEACHER',
      event: 'RECEIPT_SUBMITTED',
      data: {
        studentName: saved.studentName,
        teacherName: saved.teacherName,
        subject: saved.subject,
        date: saved.date,
        startTime: saved.startTime,
        endTime: saved.endTime,
        receiptRef: saved.receiptRef || 'Adjunto',
      },
    });

    return saved;
  }

  async updateStatus(
    id: string,
    updateDto: UpdateAppointmentStatusDto,
    userId: string,
    userRole: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (userRole !== 'ADMIN' && appointment.studentId !== userId) {
      throw new ForbiddenException('No tienes permisos para modificar este turno');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: updateDto.status },
    });

    if (updateDto.status === 'CONFIRMED_PAID') {
      const studentUser = await this.prisma.user.findUnique({ where: { id: updated.studentId } });
      this.whatsappGateway.sendNotification({
        recipientPhone: studentUser?.phone || '5491133231465',
        recipientRole: 'STUDENT',
        event: 'APPOINTMENT_CONFIRMED',
        data: {
          studentName: updated.studentName,
          teacherName: updated.teacherName,
          subject: updated.subject,
          date: updated.date,
          startTime: updated.startTime,
          endTime: updated.endTime,
          meetingUrl: updated.meetingUrl || '',
        },
      });
    }

    return updated;
  }

  async remove(id: string, userId: string, userRole: string): Promise<{ message: string }> {
    const appointment = await this.findOne(id);

    if (userRole !== 'ADMIN' && appointment.studentId !== userId) {
      throw new ForbiddenException('No tienes permisos para cancelar este turno');
    }

    await this.prisma.appointment.delete({ where: { id } });
    return { message: 'Turno cancelado exitosamente' };
  }
}


