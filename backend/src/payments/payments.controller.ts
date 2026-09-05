import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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

  private checkAdmin(req: RequestWithUser) {
    if (req.user.role !== 'ADMIN' && req.user.email !== 'maurodiaz8778@gmail.com') {
      throw new ForbiddenException('Acceso restringido a administradores');
    }
  }

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

  @UseGuards(JwtAuthGuard)
  @Get('financials')
  async getFinancialsSummary(
    @Request() req: RequestWithUser,
  ): Promise<FinancialsSummary> {
    this.checkAdmin(req);
    return this.paymentsService.getFinancialsSummary();
  }

  @UseGuards(JwtAuthGuard)
  @Post('process-payout')
  async processPayout(
    @Body() dto: ProcessPayoutDto,
    @Request() req: RequestWithUser,
  ): Promise<Record<string, unknown>> {
    this.checkAdmin(req);
    return this.paymentsService.processPayout(dto);
  }
}
