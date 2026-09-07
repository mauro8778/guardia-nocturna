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
  teacherLat?: number;
  teacherLng?: number;
  zone?: string;
  distanceKm?: number;
}

export interface GetPublicAvailabilityParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  subjectFilter?: string;
}

/** Calcula distancia en km entre dos puntos usando la fórmula de Haversine */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  private parseJsonField<T>(raw: string | null | undefined, fallback: T): T {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private formatAvailability(config: Availability, distanceKm?: number): FormattedAvailability {
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
      availableDays: this.parseJsonField<number[]>(config.availableDays, [1, 2, 3, 4, 5, 6]),
      subjects: this.parseJsonField<string[]>(config.subjects, ['Matemática / Álgebra']),
      hourlyRate: config.hourlyRate ?? 5000,
      pricingType: (config.pricingType as 'PER_HOUR' | 'PER_SUBJECT') || 'PER_HOUR',
      subjectRates: this.parseJsonField<Record<string, number>>(config.subjectRates, {}),
      supportedModalities: (config.supportedModalities as 'VIRTUAL' | 'PRESENCIAL' | 'BOTH') || 'BOTH',
      teacherAddress: config.teacherAddress ?? undefined,
      offersAtStudentHome: config.offersAtStudentHome ?? false,
      allowGroupClasses: config.allowGroupClasses ?? false,
      minGroupStudents: config.minGroupStudents ?? 1,
      maxGroupStudents: config.maxGroupStudents ?? 5,
      teacherLat: config.teacherLat ?? undefined,
      teacherLng: config.teacherLng ?? undefined,
      zone: config.zone ?? undefined,
      ...(distanceKm !== undefined ? { distanceKm: Math.round(distanceKm * 10) / 10 } : {}),
    };
  }

  async getAllPublicAvailabilities(params?: GetPublicAvailabilityParams): Promise<FormattedAvailability[]> {
    const SUPERADMIN_EMAIL = 'maurodiaz8778@gmail.com';
    const now = new Date();

    const approvedTeachers = await this.prisma.user.findMany({
      where: {
        role: { in: ['TEACHER', 'ADMIN'] },
        status: 'APPROVED',
        // El superadmin nunca aparece en el listado público
        email: { not: SUPERADMIN_EMAIL },
        OR: [
          { membershipStatus: { in: ['ACTIVE_TRIAL', 'ACTIVE_PAID', 'EXEMPT'] } },
          { trialEndsAt: { gte: now } },
          { membershipPaidUntil: { gte: now } },
        ],
      },
      select: { id: true },
    });

    const teacherIds = approvedTeachers.map((t) => t.id);

    const subjectFilter = params?.subjectFilter?.trim();
    const configs = await this.prisma.availability.findMany({
      where: {
        teacherId: { in: teacherIds },
        ...(subjectFilter
          ? { subjects: { contains: subjectFilter } }
          : {}),
      },
    });

    const formatted = configs.map((c) => {
      if (params?.lat !== undefined && params?.lng !== undefined && c.teacherLat !== null && c.teacherLng !== null && c.teacherLat !== undefined && c.teacherLng !== undefined) {
        const dist = haversineKm(params.lat, params.lng, c.teacherLat, c.teacherLng);
        return this.formatAvailability(c, dist);
      }
      return this.formatAvailability(c);
    });

    // Si hay coordenadas, ordenar: primero docentes en radio, luego resto por distancia
    if (params?.lat !== undefined && params?.lng !== undefined) {
      const radiusKm = params.radiusKm ?? 15;
      const inZone = formatted.filter((f) => f.distanceKm !== undefined && f.distanceKm <= radiusKm);
      const outZone = formatted.filter((f) => f.distanceKm === undefined || f.distanceKm > radiusKm);
      inZone.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
      outZone.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
      return [...inZone, ...outZone];
    }

    return formatted;
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
    if (dto.teacherLat !== undefined) updateData.teacherLat = dto.teacherLat;
    if (dto.teacherLng !== undefined) updateData.teacherLng = dto.teacherLng;
    if (dto.zone !== undefined) updateData.zone = dto.zone;

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
        teacherLat: dto.teacherLat ?? null,
        teacherLng: dto.teacherLng ?? null,
        zone: dto.zone ?? null,
      },
    });

    return this.formatAvailability(updated);
  }
}
