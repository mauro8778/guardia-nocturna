import { Controller, Get, Put, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface PublicAvailabilityQuery {
  lat?: string;
  lng?: string;
  radiusKm?: string;
  subjectFilter?: string;
}

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // Endpoint público para obtener la disponibilidad de todos los docentes activos
  // Acepta query params opcionales: lat, lng, radiusKm, subjectFilter
  @Get('public')
  async getAllPublicAvailabilities(@Query() query: PublicAvailabilityQuery) {
    const lat = query.lat !== undefined ? parseFloat(query.lat) : undefined;
    const lng = query.lng !== undefined ? parseFloat(query.lng) : undefined;
    const radiusKm = query.radiusKm !== undefined ? parseFloat(query.radiusKm) : undefined;

    return this.availabilityService.getAllPublicAvailabilities({
      lat: lat !== undefined && !isNaN(lat) ? lat : undefined,
      lng: lng !== undefined && !isNaN(lng) ? lng : undefined,
      radiusKm: radiusKm !== undefined && !isNaN(radiusKm) ? radiusKm : undefined,
      subjectFilter: query.subjectFilter,
    });
  }

  // Endpoint público legacy de compatibilidad
  @Get()
  async getAvailability() {
    const list = await this.availabilityService.getAllPublicAvailabilities();
    return list[0] ?? null;
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
