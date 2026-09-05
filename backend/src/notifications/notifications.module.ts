import { Module, Global } from '@nestjs/common';
import { WhatsappGatewayService } from './whatsapp-gateway.service';

@Global()
@Module({
  providers: [WhatsappGatewayService],
  exports: [WhatsappGatewayService],
})
export class NotificationsModule {}
