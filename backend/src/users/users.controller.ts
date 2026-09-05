import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admin/metrics')
  async getMetrics() {
    return this.usersService.getAdminMetrics();
  }

  @Get('admin/docentes')
  async getAllDocentes() {
    return this.usersService.getAllDocentes();
  }

  @Get('admin/pending-docentes')
  async getPendingDocentes() {
    return this.usersService.getPendingDocentes();
  }

  @Patch('admin/docentes/:id/approve')
  async approveDocente(@Param('id') id: string) {
    return this.usersService.approveDocente(id);
  }

  @Patch('admin/docentes/:id/reject')
  async rejectDocente(@Param('id') id: string) {
    return this.usersService.rejectDocente(id);
  }

  @Patch('admin/docentes/:id/commission')
  async updateCommission(
    @Param('id') id: string,
    @Body() body: { commissionRate?: number; applyCommission?: boolean },
  ) {
    return this.usersService.updateDocenteCommission(id, body.commissionRate, body.applyCommission);
  }

  @Patch('admin/docentes/:id/membership')
  async updateMembership(
    @Param('id') id: string,
    @Body() body: { membershipType: 'COMMISSION_10' | 'MONTHLY_FIXED' | 'LIFETIME_FREE'; membershipStatus?: string },
  ) {
    return this.usersService.updateTeacherMembership(id, body.membershipType, body.membershipStatus);
  }

  @Patch('docente/membership-payment')
  async submitMembershipPayment(
    @Body() body: { teacherId: string; teacherName: string; receiptRef?: string; receiptUrl?: string },
  ) {
    return this.usersService.submitMembershipPayment(
      body.teacherId,
      body.teacherName,
      body.receiptRef,
      body.receiptUrl,
    );
  }

  @Get('admin/membership-payments')
  async getMembershipPayments() {
    return this.usersService.getMembershipPayments();
  }

  @Patch('admin/membership-payments/:id/approve')
  async approveMembershipPayment(@Param('id') id: string) {
    return this.usersService.approveMembershipPayment(id);
  }
}
