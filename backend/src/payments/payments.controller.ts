import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PaymentsService, PreferenceResponse, FinancialsSummary } from './payments.service';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { ProcessPayoutDto } from './dto/process-payout.dto';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-preference')
  async createPreference(
    @Body() dto: CreatePreferenceDto,
    @Request() req: RequestWithUser,
  ): Promise<PreferenceResponse> {
    return this.paymentsService.createPreference(
      dto,
      req.user.userId,
      req.user.email,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('process-simulated')
  async processSimulatedPayment(
    @Body() dto: CreatePreferenceDto,
  ): Promise<Record<string, unknown>> {
    return this.paymentsService.processSimulatedPayment(dto.appointmentId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  async handleWebhook(
    @Body() body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.paymentsService.handleWebhook(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('financials')
  async getFinancialsSummary(): Promise<FinancialsSummary> {
    return this.paymentsService.getFinancialsSummary();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('process-payout')
  async processPayout(
    @Body() dto: ProcessPayoutDto,
  ): Promise<Record<string, unknown>> {
    return this.paymentsService.processPayout(dto);
  }
}
