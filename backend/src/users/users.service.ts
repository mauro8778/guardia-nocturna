import { Injectable, OnModuleInit, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) { }

  async onModuleInit() {
    await this.seedSuperAdmin();
  }

  /**
   * Garantiza la existencia del SuperAdmin con maurodiaz8778@gmail.com / Simona8778@
   */
  async seedSuperAdmin() {
    const adminEmail = 'maurodiaz8778@gmail.com';
    const existing = await this.findByEmail(adminEmail);

    const hashedPassword = await bcrypt.hash('Simona8778@', 10);

    if (!existing) {
      await this.prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          fullName: 'Mauro Díaz (SuperAdmin)',
          phone: '5491133231465',
          role: 'ADMIN',
          status: 'APPROVED',
          commissionRate: 0.10,
          applyCommission: true,
        },
      });
      this.logger.log(`✅ SuperAdmin sembrado exitosamente: ${adminEmail}`);
    } else if (existing.role !== 'ADMIN' || existing.status !== 'APPROVED') {
      await this.prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'ADMIN', status: 'APPROVED', password: hashedPassword },
      });
      this.logger.log(`✅ Permisos y credenciales de SuperAdmin actualizados: ${adminEmail}`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(userData: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: string;
    status?: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
        phone: userData.phone || null,
        role: userData.role || 'STUDENT',
        status: userData.status || (userData.role === 'ADMIN' ? 'PENDING_APPROVAL' : 'APPROVED'),
        commissionRate: 0.10,
        applyCommission: true,
      },
    });
  }

  async updatePassword(email: string, hashedPassword: string): Promise<User> {
    return this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  }

  async getAllDocentes(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingDocentes(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN', status: 'PENDING_APPROVAL' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveDocente(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Docente no encontrado');

    return this.prisma.user.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async rejectDocente(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Docente no encontrado');

    return this.prisma.user.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  async updateDocenteCommission(
    id: string,
    commissionRate?: number,
    applyCommission?: boolean,
  ): Promise<User> {
    const dataToUpdate: { commissionRate?: number; applyCommission?: boolean } = {};
    if (commissionRate !== undefined) dataToUpdate.commissionRate = commissionRate;
    if (applyCommission !== undefined) dataToUpdate.applyCommission = applyCommission;

    return this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async getAdminMetrics() {
    const totalUsers = await this.prisma.user.count();
    const totalDocentes = await this.prisma.user.count({ where: { role: 'ADMIN' } });
    const pendingDocentes = await this.prisma.user.count({ where: { role: 'ADMIN', status: 'PENDING_APPROVAL' } });
    const totalStudents = await this.prisma.user.count({ where: { role: 'STUDENT' } });

    const totalAppointments = await this.prisma.appointment.count();
    const confirmedAppointments = await this.prisma.appointment.findMany({
      where: { status: 'CONFIRMED_PAID' },
    });

    const totalGrossRevenue = confirmedAppointments.reduce((acc, curr) => acc + (curr.totalAmount || 5000), 0);
    const totalPlatformFee = confirmedAppointments.reduce((acc, curr) => acc + (curr.platformFee || 500), 0);
    const totalTeacherNet = confirmedAppointments.reduce((acc, curr) => acc + (curr.teacherNet || 4500), 0);

    const pendingReceipts = await this.prisma.appointment.count({ where: { status: 'RECEIPT_SUBMITTED' } });
    const draftAppointments = await this.prisma.appointment.count({ where: { status: 'DRAFT_UNPAID' } });

    return {
      totalUsers,
      totalDocentes,
      pendingDocentes,
      totalStudents,
      totalAppointments,
      confirmedCount: confirmedAppointments.length,
      pendingReceipts,
      draftAppointments,
      totalGrossRevenue,
      totalPlatformFee,
      totalTeacherNet,
    };
  }
}

