import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private checkAdmin(req: { user: { role: string; email: string } }) {
    if (req.user.role !== 'ADMIN' && req.user.email !== 'maurodiaz8778@gmail.com') {
      throw new ForbiddenException('Acceso restringido a administradores');
    }
  }

  @Get('admin/metrics')
  async getMetrics(@Request() req: { user: { role: string; email: string } }) {
    this.checkAdmin(req);
    return this.usersService.getAdminMetrics();
  }

  @Get('admin/docentes')
  async getAllDocentes(@Request() req: { user: { role: string; email: string } }) {
    this.checkAdmin(req);
    return this.usersService.getAllDocentes();
  }

  @Get('admin/pending-docentes')
  async getPendingDocentes(@Request() req: { user: { role: string; email: string } }) {
    this.checkAdmin(req);
    return this.usersService.getPendingDocentes();
  }

  @Patch('admin/docentes/:id/approve')
  async approveDocente(
    @Param('id') id: string,
    @Request() req: { user: { role: string; email: string } },
  ) {
    this.checkAdmin(req);
    return this.usersService.approveDocente(id);
  }

  @Patch('admin/docentes/:id/reject')
  async rejectDocente(
    @Param('id') id: string,
    @Request() req: { user: { role: string; email: string } },
  ) {
    this.checkAdmin(req);
    return this.usersService.rejectDocente(id);
  }

  @Patch('admin/docentes/:id/commission')
  async updateCommission(
    @Param('id') id: string,
    @Body() body: { commissionRate?: number; applyCommission?: boolean },
    @Request() req: { user: { role: string; email: string } },
  ) {
    this.checkAdmin(req);
    return this.usersService.updateDocenteCommission(id, body.commissionRate, body.applyCommission);
  }
}
