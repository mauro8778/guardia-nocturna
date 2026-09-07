import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-status.dto';
import { SubmitReceiptDto } from './dto/submit-receipt.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const SUPERADMIN_EMAIL = 'maurodiaz8778@gmail.com';

interface AuthReq {
  user: { userId: string; role: string; fullName: string; email: string };
}

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async findAll(
    @Query('date') date?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Request() req?: { user?: { email?: string } },
  ) {
    const isSuperAdmin = req?.user?.email === SUPERADMIN_EMAIL;
    return this.appointmentsService.findAll(date, teacherId, status, search, isSuperAdmin);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createDto: CreateAppointmentDto,
    @Request() req: AuthReq,
  ) {
    const isSuperAdmin = req.user.email === SUPERADMIN_EMAIL;
    // isGhostTest puede venir del body (enviado por el frontend en modo fantasma)
    // pero solo se acepta si el solicitante es el superadmin
    const isGhostTest = isSuperAdmin && (createDto.isGhostTest === true);
    return this.appointmentsService.create(
      createDto,
      req.user.userId,
      req.user.fullName,
      isGhostTest,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/receipt')
  async submitReceipt(
    @Param('id') id: string,
    @Body() receiptDto: SubmitReceiptDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.appointmentsService.submitReceipt(id, receiptDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateAppointmentStatusDto,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.appointmentsService.updateStatus(
      id,
      updateDto,
      req.user.userId,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.appointmentsService.remove(id, req.user.userId, req.user.role);
  }
}
