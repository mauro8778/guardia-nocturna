import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';

import { WhatsappGatewayService } from '../notifications/whatsapp-gateway.service';

interface MockPrismaService {
  appointment: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    deleteMany: jest.Mock;
  };
  availability: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
}

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = {
      appointment: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn((args: { data: Record<string, unknown> }) => Promise.resolve({ id: 'test-uuid-123', ...args.data })),
        update: jest.fn((args: { where: { id: string }; data: Record<string, unknown> }) => Promise.resolve({ id: args.where.id, ...args.data })),
        delete: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      availability: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: WhatsappGatewayService,
          useValue: {
            sendNotification: jest.fn().mockReturnValue({ message: 'OK', waLink: 'https://wa.me/' }),
          },
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe reservar exitosamente un turno cuando está disponible', async () => {
      prismaMock.appointment.findMany.mockResolvedValue([]);

      const dto = {
        date: '2026-09-10',
        startTime: '18:00',
        endTime: '19:00',
        subject: 'Matemática Avanzada',
        notes: 'Repasar integrales',
      };

      const result = await service.create(dto, 'student-1', 'Juan Pérez');

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('DRAFT_UNPAID');
      expect(result.studentName).toBe('Juan Pérez');
      expect(result.meetingUrl).toContain('https://meet.jit.si/');
    });

    it('debe lanzar ConflictException al intentar reservar un turno ya ocupado', async () => {
      prismaMock.appointment.findMany.mockResolvedValue([
        {
          id: 'existing-appointment',
          date: '2026-09-10',
          startTime: '18:00',
          endTime: '19:00',
          status: 'CONFIRMED_PAID',
        },
      ]);

      const dto = {
        date: '2026-09-10',
        startTime: '18:00',
        endTime: '19:00',
        subject: 'Física I',
      };

      await expect(
        service.create(dto, 'student-2', 'María Gómez'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('debe actualizar el estado a CONFIRMED_PAID (Verde)', async () => {
      const mockAppointment = {
        id: 'app-1',
        studentId: 'student-1',
        status: 'DRAFT_UNPAID',
      };
      prismaMock.appointment.findUnique.mockResolvedValue(mockAppointment);

      const updated = await service.updateStatus(
        'app-1',
        { status: 'CONFIRMED_PAID' },
        'student-1',
        'STUDENT',
      );

      expect(updated.status).toBe('CONFIRMED_PAID');
    });
  });
});
