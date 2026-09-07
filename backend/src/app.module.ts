import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { EventsModule } from './events/events.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    NotificationsModule,
    UsersModule,
    AuthModule,
    AppointmentsModule,
    AvailabilityModule,
    PaymentsModule,
    AiModule,
  ],
})
export class AppModule {}


