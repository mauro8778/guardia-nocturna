import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateEvaluationDto } from './dto/generate-evaluation.dto';
import { GenerateComunicadoDto } from './dto/generate-comunicado.dto';
import { GeneratePlanificacionDto } from './dto/generate-planificacion.dto';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

interface AiGenerationResult {
  content: string;
  generatedAt: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenerativeAI | null;
  private readonly rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('✅ Gemini AI inicializado correctamente.');
    } else {
      this.genAI = null;
      this.logger.warn('⚠️  GEMINI_API_KEY no configurada. Las funciones de IA no estarán disponibles.');
    }
  }

  private checkRateLimit(userId: string): void {
    const now = Date.now();
    const entry = this.rateLimitMap.get(userId);

    if (!entry || now > entry.resetAt) {
      this.rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
      throw new ServiceUnavailableException(
        'Límite de solicitudes IA alcanzado. Esperá 1 minuto antes de generar nuevo contenido.',
      );
    }

    entry.count++;
  }

  private ensureAiAvailable(): GoogleGenerativeAI {
    if (!this.genAI) {
      throw new ServiceUnavailableException(
        'El servicio de Inteligencia Artificial no está configurado. Contactá al administrador para habilitar la API Key de Gemini.',
      );
    }
    return this.genAI;
  }

  private async generateContent(prompt: string): Promise<string> {
    const ai = this.ensureAiAvailable();
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) throw new InternalServerErrorException('Error interno del servidor, contacte a soporte.');
      return text;
    } catch (error) {
      if (error instanceof ServiceUnavailableException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error('Error al generar contenido con Gemini:', error);
      throw new InternalServerErrorException('Error interno del servidor, contacte a soporte.');
    }
  }

  async generateEvaluation(dto: GenerateEvaluationDto, userId: string): Promise<AiGenerationResult> {
    this.checkRateLimit(userId);

    const typeLabel =
      dto.questionType === 'multiple_choice'
        ? 'opción múltiple (4 opciones por pregunta, indicar la correcta)'
        : dto.questionType === 'open'
        ? 'preguntas abiertas con guía de respuesta esperada'
        : 'mixta (mitad opción múltiple, mitad preguntas abiertas)';

    const difficultyLabel =
      dto.difficulty === 'facil' ? 'nivel básico/introductorio' : dto.difficulty === 'medio' ? 'nivel intermedio' : 'nivel avanzado/universitario';

    const prompt = `Sos un docente experto en ${dto.subject} con amplia experiencia en educación ${dto.academicLevel}.
Generá una evaluación escrita completa con las siguientes características:
- Materia: ${dto.subject}
- Nivel educativo: ${dto.academicLevel}
- Tipo de preguntas: ${typeLabel}
- Cantidad de preguntas: ${dto.questionCount}
- Dificultad: ${difficultyLabel}
${dto.additionalContext ? `- Contexto adicional: ${dto.additionalContext}` : ''}

FORMATO DE RESPUESTA:
1. Encabezado con nombre de la institución (dejar en blanco), materia, fecha y espacio para nombre del alumno.
2. Instrucciones generales breves.
3. Las ${dto.questionCount} preguntas numeradas claramente.
4. Al final, una sección separada "--- CLAVE DE RESPUESTAS (Solo para el docente) ---" con las respuestas correctas.

Respondé íntegramente en español. El tono debe ser académico y formal.`;

    const content = await this.generateContent(prompt);
    return { content, generatedAt: new Date().toISOString() };
  }

  async generateComunicado(dto: GenerateComunicadoDto, userId: string): Promise<AiGenerationResult> {
    this.checkRateLimit(userId);

    const prompt = `Sos ${dto.teacherName}, un docente particular profesional que dicta clases de ${dto.subjects}.
Redactá un comunicado institucional formal dirigido a: ${dto.destinatario}.
El motivo del comunicado es: ${dto.motivo}.

REQUISITOS:
- Tono formal, respetuoso y profesional.
- Estructura: Lugar y fecha (dejar la fecha en blanco para completar), saludo formal, cuerpo del comunicado desarrollado en 2-3 párrafos, cierre y firma del docente.
- Destacar la propuesta de valor del servicio de clases particulares.
- Extensión: entre 200 y 350 palabras.
- Respondé íntegramente en español rioplatense formal.`;

    const content = await this.generateContent(prompt);
    return { content, generatedAt: new Date().toISOString() };
  }

  async generatePlanificacion(dto: GeneratePlanificacionDto, userId: string): Promise<AiGenerationResult> {
    this.checkRateLimit(userId);

    const periodsLabel =
      dto.periodType === 'bimestral'
        ? '5 bimestres'
        : dto.periodType === 'trimestral'
        ? '4 trimestres'
        : '2 cuatrimestres';

    const prompt = `Sos un docente experto en ${dto.subject} para el nivel ${dto.academicLevel}.
Generá una planificación curricular anual completa organizada en ${periodsLabel}.

ESTRUCTURA REQUERIDA por cada período:
- Nombre del período (ej: "Primer Bimestre — Marzo/Abril")
- Objetivos de aprendizaje específicos (3-5 ítems)
- Contenidos conceptuales a desarrollar (listado detallado)
- Estrategias didácticas sugeridas
- Criterios e instrumentos de evaluación
- Bibliografía sugerida (al menos 2 referencias)

ENCABEZADO: Incluir sección de datos institucionales (institución, materia, nivel, año lectivo, docente) para completar a mano.

Respondé íntegramente en español. El documento debe ser profesional, listo para presentar ante autoridades educativas.`;

    const content = await this.generateContent(prompt);
    return { content, generatedAt: new Date().toISOString() };
  }
}
