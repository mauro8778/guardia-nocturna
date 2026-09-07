import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateEvaluationDto } from './dto/generate-evaluation.dto';
import { GenerateComunicadoDto } from './dto/generate-comunicado.dto';
import { GeneratePlanificacionDto } from './dto/generate-planificacion.dto';
import { AiGenerationResultDto } from './dto/ai-generation-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface AuthenticatedRequest {
  user: { userId: string; role: string; fullName: string };
}

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('evaluation')
  async generateEvaluation(
    @Body() dto: GenerateEvaluationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AiGenerationResultDto> {
    return this.aiService.generateEvaluation(dto, req.user.userId);
  }

  @Post('comunicado')
  async generateComunicado(
    @Body() dto: GenerateComunicadoDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AiGenerationResultDto> {
    return this.aiService.generateComunicado(dto, req.user.userId);
  }

  @Post('planificacion')
  async generatePlanificacion(
    @Body() dto: GeneratePlanificacionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AiGenerationResultDto> {
    return this.aiService.generatePlanificacion(dto, req.user.userId);
  }
}
