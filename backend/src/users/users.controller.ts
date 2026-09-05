import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admin/metrics')
  @Roles('ADMIN')
  async getMetrics() {
    return this.usersService.getAdminMetrics();
  }

  @Get('admin/docentes')
  @Roles('ADMIN')
  async getAllDocentes() {
    return this.usersService.getAllDocentes();
  }

  @Get('admin/pending-docentes')
  @Roles('ADMIN')
  async getPendingDocentes() {
    return this.usersService.getPendingDocentes();
  }

  @Patch('admin/docentes/:id/approve')
  @Roles('ADMIN')
  async approveDocente(@Param('id') id: string) {
    return this.usersService.approveDocente(id);
  }

  @Patch('admin/docentes/:id/reject')
  @Roles('ADMIN')
  async rejectDocente(@Param('id') id: string) {
    return this.usersService.rejectDocente(id);
  }

  @Patch('admin/docentes/:id/commission')
  @Roles('ADMIN')
  async updateCommission(
    @Param('id') id: string,
    @Body() body: { commissionRate?: number; applyCommission?: boolean },
  ) {
    return this.usersService.updateDocenteCommission(id, body.commissionRate, body.applyCommission);
  }

  @Patch('admin/docentes/:id/membership')
  @Roles('ADMIN')
  async updateMembership(
    @Param('id') id: string,
    @Body() body: { membershipType: 'COMMISSION_10' | 'MONTHLY_FIXED' | 'LIFETIME_FREE'; membershipStatus?: string },
  ) {
    return this.usersService.updateTeacherMembership(id, body.membershipType, body.membershipStatus);
  }

  @Patch('docente/my-membership')
  async updateMyMembership(
    @Req() req: any,
    @Body() body: { teacherId?: string; membershipType: 'COMMISSION_10' | 'MONTHLY_FIXED' | 'LIFETIME_FREE' },
  ) {
    const teacherId = req.user?.id || req.user?.userId || body.teacherId;
    return this.usersService.updateTeacherMembership(teacherId, body.membershipType);
  }

  @Patch('docente/membership-payment')
  async submitMembershipPayment(
    @Req() req: any,
    @Body() body: { teacherId?: string; teacherName?: string; receiptRef?: string; receiptUrl?: string },
  ) {
    const teacherId = req.user?.id || req.user?.userId || body.teacherId;
    const teacherName = req.user?.fullName || body.teacherName || 'Docente';
    return this.usersService.submitMembershipPayment(
      teacherId,
      teacherName,
      body.receiptRef,
      body.receiptUrl,
    );
  }

  @Get('admin/membership-payments')
  @Roles('ADMIN')
  async getMembershipPayments() {
    return this.usersService.getMembershipPayments();
  }

  @Patch('admin/membership-payments/:id/approve')
  @Roles('ADMIN')
  async approveMembershipPayment(@Param('id') id: string) {
    return this.usersService.approveMembershipPayment(id);
  }
}
