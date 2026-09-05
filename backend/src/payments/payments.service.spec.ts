import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappGatewayService } from '../notifications/whatsapp-gateway.service';

interface MockPrismaService {
  appointment: {
    findUnique: jest.Mock;
    update: jest.Mock;
    findMany: jest.Mock;
  };
  availability: {
    findUnique: jest.Mock;
  };
  paymentTransaction: {
    upsert: jest.Mock;
    findMany: jest.Mock;
  };
  teacherPayout: {
    findMany: jest.Mock;
    create: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
}

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaMock: MockPrismaService;

  beforeEach(async () => {
    prismaMock = {
      appointment: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      availability: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      paymentTransaction: {
        upsert: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      teacherPayout: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn((args: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 'payout-123', ...args.data }),
        ),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: WhatsappGatewayService,
          useValue: {
            sendNotification: jest.fn().mockReturnValue({ message: 'OK' }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPreference', () => {
    it('debe lanzar NotFoundException si el turno no existe', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue(null);

      await expect(
        service.createPreference({ appointmentId: 'non-existent' }, 'student-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe retornar la preferencia simulada cuando no hay token de MP', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 'app-999',
        subject: 'Álgebra',
        teacherName: 'Prof. Mauro Díaz',
        totalAmount: 5500,
        studentName: 'Juan Alumno',
      });

      const res = await service.createPreference({ appointmentId: 'app-999' }, 'student-1');

      expect(res.appointmentId).toBe('app-999');
      expect(res.totalAmount).toBe(5500);
      expect(res.isSimulated).toBe(true);
      expect(res.preferenceId).toContain('PREF-MP-app-999');
    });
  });

  describe('processSimulatedPayment', () => {
    it('debe actualizar el turno a CONFIRMED_PAID y registrar la transacción', async () => {
      const mockAppt = {
        id: 'app-777',
        studentId: 'student-1',
        studentName: 'Alumno Test',
        teacherId: 'teacher-1',
        teacherName: 'Prof. Test',
        subject: 'Física',
        date: '2026-09-12',
        startTime: '10:00',
        endTime: '11:00',
        totalAmount: 5500,
        platformFee: 500,
        teacherNet: 5000,
      };

      prismaMock.appointment.findUnique.mockResolvedValue(mockAppt);
      prismaMock.appointment.update.mockResolvedValue({
        ...mockAppt,
        status: 'CONFIRMED_PAID',
      });

      const res = await service.processSimulatedPayment('app-777');

      expect(res.message).toContain('procesado exitosamente');
      expect(prismaMock.appointment.update).toHaveBeenCalledWith({
        where: { id: 'app-777' },
        data: expect.objectContaining({ status: 'CONFIRMED_PAID' }),
      });
      expect(prismaMock.paymentTransaction.upsert).toHaveBeenCalled();
    });
  });

  describe('processPayout', () => {
    it('debe registrar exitosamente la liquidación a un docente', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'teacher-1',
        fullName: 'Prof. Pedro Gómez',
      });

      const dto = {
        teacherId: 'teacher-1',
        amount: 15000,
        reference: 'LIQ-SEPT-01',
      };

      const res = await service.processPayout(dto);

      expect(res.message).toContain('15.000');
      expect(prismaMock.teacherPayout.create).toHaveBeenCalled();
    });
  });
});
