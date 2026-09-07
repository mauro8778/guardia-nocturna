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
import { AiGenerationResultDto } from './dto/ai-generation-result.dto';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

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

  private readonly RESCUE_TEXT_MODELS: string[] = [
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
  ];

  private async generateContent(prompt: string): Promise<string> {
    const ai = this.ensureAiAvailable();
    let lastError: unknown;

    for (const modelName of this.RESCUE_TEXT_MODELS) {
      try {
        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text) return text;
      } catch (error) {
        lastError = error;
        this.logger.warn(`⚠️ Modelo ${modelName} falló o no está disponible, probando el siguiente en la lista...`);
      }
    }

    if (lastError instanceof ServiceUnavailableException || lastError instanceof InternalServerErrorException) {
      throw lastError;
    }
    this.logger.error('Error al generar contenido con Gemini:', lastError);
    throw new InternalServerErrorException('Error interno del servidor, contacte a soporte.');
  }

  async generateEvaluation(dto: GenerateEvaluationDto, userId: string): Promise<AiGenerationResultDto> {
    this.checkRateLimit(userId);

    const typeLabel =
      dto.questionType === 'multiple_choice'
        ? 'Opción Múltiple (4 opciones por consigna A, B, C, D con solo una correcta)'
        : dto.questionType === 'open'
          ? 'Preguntas Abiertas de desarrollo teórico/práctico con criterios de corrección'
          : dto.questionType === 'practical_cases'
            ? 'Resolución de Casos Prácticos y Ejercicios de Aplicación Real'
            : 'Mixta (Mitad Opción Múltiple, Mitad Preguntas Abiertas de desarrollo)';

    const difficultyLabel =
      dto.difficulty === 'facil'
        ? 'Nivel Básico / Introductorio (evalúa conceptos fundamentales y comprensión directa)'
        : dto.difficulty === 'medio'
          ? 'Nivel Intermedio / Estándar (evalúa aplicación de conocimientos y resolución estándar)'
          : dto.difficulty === 'dificil'
            ? 'Nivel Avanzado / Exigente (evalúa análisis crítico, integración de temas y problemas complejos)'
            : 'Nivel Olímpico / Excelencia (desafíos conceptuales, problemas de alta dificultad y razonamiento deductivo)';

    const prompt = `Sos un docente pedagogo experto en ${dto.subject} con amplia trayectoria en nivel ${dto.academicLevel}.
Diseñá una EVALUACIÓN ESCRITA DE ALTA CALIDAD PEDAGÓGICA con las siguientes especificaciones técnicas:

📌 DATOS DE LA EVALUACIÓN:
- Materia / Asignatura: ${dto.subject}
- Nivel Educativo: ${dto.academicLevel}
- Formato de Consignas: ${typeLabel}
- Cantidad de Preguntas: ${dto.questionCount}
- Nivel de Dificultad: ${difficultyLabel}
${dto.estimatedTime ? `- Tiempo Estimado de Resolución: ${dto.estimatedTime}` : ''}
${dto.skillsFocus ? `- Enfoque Pedagógico / Habilidades a Evaluar: ${dto.skillsFocus}` : ''}
${dto.additionalContext ? `- Especificaciones Técnicas y Contexto Adicional: ${dto.additionalContext}` : ''}

🎯 ESTRUCTURA REQUERIDA EN EL EXAMEN:
1. ENCABEZADO INSTITUCIONAL: (Espacio para Institución, Nombre del Alumno, Fecha, Materia, Nota Final y Tiempo).
2. RECOMENDACIONES E INSTRUCCIONES GENERALES PARA EL ALUMNO (Claridad de letra, uso de calculadora/fórmulas si aplica, ponderación de puntajes).
3. DESARROLLO DEL EXAMEN: Las ${dto.questionCount} preguntas/ejercicios numerados claramente, indicando el puntaje asignado a cada ítem (debe sumar 10 puntos en total).
4. SECCIÓN FINAL PARA EL DOCENTE:
   "--- CLAVE DE RESPUESTAS Y CRITERIOS DE CORRECCIÓN (EXCLUSIVO DOCENTE) ---"
   - Para opción múltiple: Respuesta correcta explicitada con justificación breve.
   - Para desarrollo/prácticos: Solución paso a paso, fórmula utilizada o respuesta modelo esperada.

Respondé en español neutro académico, listo para imprimir o copiar directamente a un documento de texto.`;

    const content = await this.generateContent(prompt);
    return { content, generatedAt: new Date().toISOString() };
  }

  async generateComunicado(dto: GenerateComunicadoDto, userId: string): Promise<AiGenerationResultDto> {
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

  async generatePlanificacion(dto: GeneratePlanificacionDto, userId: string): Promise<AiGenerationResultDto> {
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
