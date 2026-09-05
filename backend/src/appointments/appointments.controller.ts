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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async findAll(
    @Query('date') date?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.appointmentsService.findAll(date, teacherId, status, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createDto: CreateAppointmentDto,
    @Request() req: { user: { userId: string; fullName: string } },
  ) {
    return this.appointmentsService.create(
      createDto,
      req.user.userId,
      req.user.fullName,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/receipt')
  async submitReceipt(
    @Param('id') id: string,
    @Body() receiptDto: import('./dto/submit-receipt.dto').SubmitReceiptDto,
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
