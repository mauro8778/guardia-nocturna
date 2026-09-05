import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Availability, Prisma } from '@prisma/client';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

export interface FormattedAvailability {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherPhone: string;
  aliasMP: string;
  linkMP: string;
  is24Hours: boolean;
  startHour: number;
  endHour: number;
  availableDays: number[];
  subjects: string[];
  hourlyRate: number;
  pricingType: 'PER_HOUR' | 'PER_SUBJECT';
  subjectRates: Record<string, number>;
  supportedModalities: 'VIRTUAL' | 'PRESENCIAL' | 'BOTH';
  teacherAddress?: string;
  offersAtStudentHome: boolean;
  allowGroupClasses: boolean;
  minGroupStudents: number;
  maxGroupStudents: number;
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  private formatAvailability(config: Availability): FormattedAvailability {
    let availableDays: number[] = [1, 2, 3, 4, 5, 6];
    let subjects: string[] = ['Matemática / Álgebra'];
    let subjectRates: Record<string, number> = {};

    try {
      if (config.availableDays) {
        availableDays = JSON.parse(config.availableDays);
      }
    } catch {
      availableDays = [1, 2, 3, 4, 5, 6];
    }

    try {
      if (config.subjects) {
        subjects = JSON.parse(config.subjects);
      }
    } catch {
      subjects = ['Matemática / Álgebra'];
    }

    try {
      if (config.subjectRates) {
        subjectRates = JSON.parse(config.subjectRates);
      }
    } catch {
      subjectRates = {};
    }

    return {
      id: config.id,
      teacherId: config.teacherId,
      teacherName: config.teacherName || 'Docente Guardia Docente',
      teacherPhone: config.teacherPhone || '',
      aliasMP: config.aliasMP || '',
      linkMP: config.linkMP || '',
      is24Hours: config.is24Hours ?? false,
      startHour: config.startHour ?? 8,
      endHour: config.endHour ?? 22,
      availableDays,
      subjects,
      hourlyRate: config.hourlyRate ?? 5000,
      pricingType: (config.pricingType as 'PER_HOUR' | 'PER_SUBJECT') || 'PER_HOUR',
      subjectRates,
      supportedModalities: (config.supportedModalities as 'VIRTUAL' | 'PRESENCIAL' | 'BOTH') || 'BOTH',
      teacherAddress: config.teacherAddress || undefined,
      offersAtStudentHome: config.offersAtStudentHome ?? false,
      allowGroupClasses: config.allowGroupClasses ?? false,
      minGroupStudents: config.minGroupStudents ?? 1,
      maxGroupStudents: config.maxGroupStudents ?? 5,
    };
  }

  async getAllPublicAvailabilities(): Promise<FormattedAvailability[]> {
    const now = new Date();
    const approvedTeachers = await this.prisma.user.findMany({
      where: {
        role: { in: ['TEACHER', 'ADMIN'] },
        status: 'APPROVED',
        OR: [
          { membershipStatus: { in: ['ACTIVE_TRIAL', 'ACTIVE_PAID', 'EXEMPT'] } },
          { trialEndsAt: { gte: now } },
          { membershipPaidUntil: { gte: now } },
        ],
      },
      select: { id: true },
    });

    const teacherIds = approvedTeachers.map((t) => t.id);

    const configs = await this.prisma.availability.findMany({
      where: {
        teacherId: { in: teacherIds },
      },
    });

    return configs.map((c) => this.formatAvailability(c));
  }

  async getAvailabilityByTeacher(teacherId: string, teacherName?: string): Promise<FormattedAvailability> {
    const config = await this.prisma.availability.upsert({
      where: { teacherId },
      update: {},
      create: {
        teacherId,
        teacherName: teacherName || 'Docente Guardia Docente',
        teacherPhone: '',
        aliasMP: '',
        linkMP: '',
        is24Hours: false,
        startHour: 8,
        endHour: 22,
        availableDays: JSON.stringify([1, 2, 3, 4, 5, 6]),
        subjects: JSON.stringify(['Matemática / Álgebra']),
        hourlyRate: 5000,
        pricingType: 'PER_HOUR',
        subjectRates: JSON.stringify({}),
        supportedModalities: 'BOTH',
        offersAtStudentHome: false,
        allowGroupClasses: false,
        minGroupStudents: 1,
        maxGroupStudents: 5,
      },
    });

    return this.formatAvailability(config);
  }

  async updateAvailabilityByTeacher(
    teacherId: string,
    dto: UpdateAvailabilityDto,
    teacherName?: string,
  ): Promise<FormattedAvailability> {
    const updateData: Prisma.AvailabilityUpdateInput = {};
    if (dto.teacherName !== undefined) updateData.teacherName = dto.teacherName;
    if (dto.teacherPhone !== undefined) updateData.teacherPhone = dto.teacherPhone;
    if (dto.aliasMP !== undefined) updateData.aliasMP = dto.aliasMP;
    if (dto.linkMP !== undefined) updateData.linkMP = dto.linkMP;
    if (dto.is24Hours !== undefined) updateData.is24Hours = dto.is24Hours;
    if (dto.startHour !== undefined) updateData.startHour = dto.startHour;
    if (dto.endHour !== undefined) updateData.endHour = dto.endHour;
    if (dto.hourlyRate !== undefined) updateData.hourlyRate = dto.hourlyRate;
    if (dto.pricingType !== undefined) updateData.pricingType = dto.pricingType;
    if (dto.availableDays !== undefined) updateData.availableDays = JSON.stringify(dto.availableDays);
    if (dto.subjects !== undefined) updateData.subjects = JSON.stringify(dto.subjects);
    if (dto.subjectRates !== undefined) updateData.subjectRates = JSON.stringify(dto.subjectRates);
    if (dto.supportedModalities !== undefined) updateData.supportedModalities = dto.supportedModalities;
    if (dto.teacherAddress !== undefined) updateData.teacherAddress = dto.teacherAddress;
    if (dto.offersAtStudentHome !== undefined) updateData.offersAtStudentHome = dto.offersAtStudentHome;
    if (dto.allowGroupClasses !== undefined) updateData.allowGroupClasses = dto.allowGroupClasses;
    if (dto.minGroupStudents !== undefined) updateData.minGroupStudents = dto.minGroupStudents;
    if (dto.maxGroupStudents !== undefined) updateData.maxGroupStudents = dto.maxGroupStudents;

    const updated = await this.prisma.availability.upsert({
      where: { teacherId },
      update: updateData,
      create: {
        teacherId,
        teacherName: dto.teacherName || teacherName || 'Docente Guardia Docente',
        teacherPhone: dto.teacherPhone || '',
        aliasMP: dto.aliasMP || '',
        linkMP: dto.linkMP || '',
        is24Hours: dto.is24Hours ?? false,
        startHour: dto.startHour ?? 8,
        endHour: dto.endHour ?? 22,
        availableDays: dto.availableDays ? JSON.stringify(dto.availableDays) : JSON.stringify([1, 2, 3, 4, 5, 6]),
        subjects: dto.subjects ? JSON.stringify(dto.subjects) : JSON.stringify(['Matemática / Álgebra']),
        hourlyRate: dto.hourlyRate ?? 5000,
        pricingType: dto.pricingType || 'PER_HOUR',
        subjectRates: dto.subjectRates ? JSON.stringify(dto.subjectRates) : JSON.stringify({}),
        supportedModalities: dto.supportedModalities || 'BOTH',
        teacherAddress: dto.teacherAddress || null,
        offersAtStudentHome: dto.offersAtStudentHome ?? false,
        allowGroupClasses: dto.allowGroupClasses ?? false,
        minGroupStudents: dto.minGroupStudents ?? 1,
        maxGroupStudents: dto.maxGroupStudents ?? 5,
      },
    });

    return this.formatAvailability(updated);
  }
}

