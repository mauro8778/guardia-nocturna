import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Conectado a la base de datos PostgreSQL/Supabase');
    } catch (error: any) {
      this.logger.error(`❌ Error al conectar a la base de datos: ${error.message}`);
      this.logger.warn('⚠️ La aplicación continuará levantada. Verifique si el proyecto de Supabase está activo (no pausado) y que DATABASE_URL sea correcta.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
