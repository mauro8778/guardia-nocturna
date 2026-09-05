import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // Endpoint público para obtener la disponibilidad de todos los docentes activos
  @Get('public')
  async getAllPublicAvailabilities() {
    return this.availabilityService.getAllPublicAvailabilities();
  }

  // Endpoint público legacy de compatibilidad
  @Get()
  async getAvailability() {
    const list = await this.availabilityService.getAllPublicAvailabilities();
    return list[0] || null;
  }

  // Endpoint autenticado para obtener configuración del docente actual
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Get('me')
  async getMyAvailability(@Request() req: { user: { userId: string; role: string; fullName: string } }) {
    return this.availabilityService.getAvailabilityByTeacher(req.user.userId, req.user.fullName);
  }

  // Endpoint autenticado para actualizar la configuración propia del docente
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Put('me')
  async updateMyAvailability(
    @Request() req: { user: { userId: string; role: string; fullName: string } },
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.updateAvailabilityByTeacher(req.user.userId, dto, req.user.fullName);
  }
}
