import React, { useState } from 'react';
import {
  Sparkles,
  ClipboardList,
  MessageSquare,
  CalendarDays,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  AlertCircle,
  Download,
  FileText,
} from 'lucide-react';
import { aiApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { downloadAsWordDoc } from '../utils/docxExporter';
import {
  AiGenerationResult,
  GenerateEvaluationPayload,
  GenerateComunicadoPayload,
  GeneratePlanificacionPayload,
} from '../types';

type AiTool = 'evaluation' | 'comunicado' | 'planificacion';

const ACADEMIC_LEVELS = [
  'Primario',
  'Secundario',
  'Terciario / Universitario',
  'Posgrado / Profesional',
];

export const AiToolsPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<AiTool>('evaluation');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Evaluation form state
  const [evalSubject, setEvalSubject] = useState('');
  const [evalLevel, setEvalLevel] = useState('Secundario');
  const [evalQuestionType, setEvalQuestionType] = useState<GenerateEvaluationPayload['questionType']>('mixed');
  const [evalCount, setEvalCount] = useState(10);
  const [evalDifficulty, setEvalDifficulty] = useState<GenerateEvaluationPayload['difficulty']>('medio');
  const [evalTime, setEvalTime] = useState('60 minutos');
  const [evalSkills, setEvalSkills] = useState('Resolución de problemas prácticos y teoría');
  const [evalContext, setEvalContext] = useState('');

  // Comunicado form state
  const [comTeacherName, setComTeacherName] = useState(user?.fullName ?? '');
  const [comSubjects, setComSubjects] = useState('');
  const [comMotivo, setComMotivo] = useState('');
  const [comDestinatario, setComDestinatario] = useState('Autoridades del establecimiento educativo');

  // Planificacion form state
  const [planSubject, setPlanSubject] = useState('');
  const [planLevel, setPlanLevel] = useState('Secundario');
  const [planPeriod, setPlanPeriod] = useState<GeneratePlanificacionPayload['periodType']>('trimestral');

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      let res: AiGenerationResult;
      if (activeTool === 'evaluation') {
        res = await aiApi.generateEvaluation({
          subject: evalSubject,
          academicLevel: evalLevel,
          questionType: evalQuestionType,
          questionCount: evalCount,
          difficulty: evalDifficulty,
          estimatedTime: evalTime,
          skillsFocus: evalSkills,
          additionalContext: evalContext,
        });
      } else if (activeTool === 'comunicado') {
        res = await aiApi.generateComunicado({
          teacherName: comTeacherName,
          subjects: comSubjects,
          motivo: comMotivo,
          destinatario: comDestinatario,
        });
      } else {
        res = await aiApi.generatePlanificacion({
          subject: planSubject,
          academicLevel: planLevel,
          periodType: planPeriod,
        });
      }
      setResult(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error al generar contenido. Intentá nuevamente.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const tools: { id: AiTool; icon: React.ReactNode; label: string; desc: string; color: string }[] = [
    {
      id: 'evaluation',
      icon: <ClipboardList className="w-4 h-4" />,
      label: '📝 Evaluaciones',
      desc: 'Generá exámenes completos con clave de respuestas',
      color: 'brand',
    },
    {
      id: 'comunicado',
      icon: <MessageSquare className="w-4 h-4" />,
      label: '📣 Comunicados',
      desc: 'Cartas formales para instituciones educativas',
      color: 'amber',
    },
    {
      id: 'planificacion',
      icon: <CalendarDays className="w-4 h-4" />,
      label: '📅 Planificación Anual',
      desc: 'Diseño curricular completo por período',
      color: 'emerald',
    },
  ];

  const canGenerate =
    activeTool === 'evaluation'
      ? evalSubject.trim().length > 0
      : activeTool === 'comunicado'
      ? comTeacherName.trim().length > 0 && comMotivo.trim().length > 0 && comSubjects.trim().length > 0
      : planSubject.trim().length > 0;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 border border-purple-500/30 bg-slate-900/90">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              🤖 Herramientas IA con Gemini
            </h3>
            <p className="text-xs text-slate-400">
              Generá evaluaciones, comunicados y planificaciones curriculares con inteligencia artificial
            </p>
          </div>
        </div>

        {/* Tool selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => { setActiveTool(tool.id); setResult(null); setError(null); }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                activeTool === tool.id
                  ? `bg-${tool.color}-500/20 border-${tool.color}-500 shadow-lg ring-1 ring-${tool.color}-500/50`
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className={`flex items-center gap-2 font-bold text-xs mb-1 ${activeTool === tool.id ? 'text-white' : 'text-slate-300'}`}>
                {tool.icon}
                {tool.label}
              </div>
              <p className={`text-[10px] font-normal ${activeTool === tool.id ? 'text-slate-300' : 'text-slate-500'}`}>
                {tool.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Formulario dinámico */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        {activeTool === 'evaluation' && (
          <>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-brand-400" />
                Configuración Avanzada de Evaluación
              </h4>
            </div>

            {/* Banner Recomendaciones para Máxima Efectividad */}
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>💡 Recomendaciones para generar la mejor evaluación:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-purple-200/90 leading-relaxed">
                <li><strong>Especificá los temas:</strong> Detallá las unidades o conceptos específicos a evaluar para evitar consignas genéricas.</li>
                <li><strong>Aclaraciones útiles:</strong> Indicá si el alumno dispone de tabla periódica, formulario, o uso de calculadora.</li>
                <li><strong>Enfoque pedagógico:</strong> Definí si buscás evaluar conceptos teóricos de memoria o la resolución práctica de casos.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Materia / Tema a Evaluar *</label>
                <input
                  type="text"
                  value={evalSubject}
                  onChange={(e) => setEvalSubject(e.target.value)}
                  placeholder="Ej: Análisis Matemático — Derivadas e Integrales Definidas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">🎓 Nivel de Estudio</label>
                <select value={evalLevel} onChange={(e) => setEvalLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500">
                  {ACADEMIC_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">🔥 Nivel de Dificultad</label>
                <select value={evalDifficulty} onChange={(e) => setEvalDifficulty(e.target.value as GenerateEvaluationPayload['difficulty'])} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500">
                  <option value="facil">Fácil (Introductorio / Conceptos básicos)</option>
                  <option value="medio">Medio (Estándar de cursada)</option>
                  <option value="dificil">Difícil (Avanzado / Exigente)</option>
                  <option value="exigente">Exigente (Olímpico / Nivel Excelencia)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">📋 Tipo de Consignas</label>
                <select value={evalQuestionType} onChange={(e) => setEvalQuestionType(e.target.value as GenerateEvaluationPayload['questionType'])} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500">
                  <option value="mixed">Mixta (Opción Múltiple + Desarrollo)</option>
                  <option value="multiple_choice">Opción Múltiple (4 opciones por ítem)</option>
                  <option value="open">Preguntas Abiertas de Desarrollo</option>
                  <option value="practical_cases">Resolución de Casos Prácticos Reales</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">⏱️ Duración Estimada del Examen</label>
                <select value={evalTime} onChange={(e) => setEvalTime(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500">
                  <option value="30 minutos">30 minutos (Examen corto / Quiz)</option>
                  <option value="45 minutos">45 minutos (Módulo de clase)</option>
                  <option value="60 minutos">60 minutos (1 hora estándar)</option>
                  <option value="90 minutos">90 minutos (Parcial extenso)</option>
                  <option value="120 minutos">120 minutos (Final / Integrador)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">🎯 Enfoque / Habilidades a Evaluar</label>
                <select value={evalSkills} onChange={(e) => setEvalSkills(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500">
                  <option value="Resolución de problemas prácticos y teoría">Resolución práctica + Teoría</option>
                  <option value="Conceptos teóricos y definiciones fundamentales">Conceptos teóricos de memoria</option>
                  <option value="Análisis crítico, razonamiento y deducción">Análisis crítico y deducción</option>
                  <option value="Aplicación a casos de estudio y código/ejercicios">Casos de estudio real y práctica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">🔢 Cantidad de Consignas</label>
                <input type="number" min={1} max={30} value={evalCount} onChange={(e) => setEvalCount(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-brand-500" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Aspectos específicos a considerar (Recomendado)</label>
                <textarea
                  value={evalContext}
                  onChange={(e) => setEvalContext(e.target.value)}
                  rows={3}
                  placeholder="Ej: Aclarar que pueden usar calculadora científica. Incluir 2 ejercicios prácticos del Capítulo 3. El examen debe contar con rúbrica de corrección explícita."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </>
        )}

        {activeTool === 'comunicado' && (
          <>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              Configurar Comunicado Institucional
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tu nombre completo *</label>
                <input type="text" value={comTeacherName} onChange={(e) => setComTeacherName(e.target.value)} placeholder="Prof. Juan García" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Materias que dictás *</label>
                <input type="text" value={comSubjects} onChange={(e) => setComSubjects(e.target.value)} placeholder="Matemática, Física, Química" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dirigido a</label>
                <input type="text" value={comDestinatario} onChange={(e) => setComDestinatario(e.target.value)} placeholder="Rector/a, Directivo/a..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Motivo del comunicado *</label>
                <textarea
                  value={comMotivo}
                  onChange={(e) => setComMotivo(e.target.value)}
                  rows={3}
                  placeholder="Ej: Presentar mis servicios de clases particulares a los alumnos del establecimiento y proponer una colaboración con la institución..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </>
        )}

        {activeTool === 'planificacion' && (
          <>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              Configurar Planificación Anual
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Materia *</label>
                <input type="text" value={planSubject} onChange={(e) => setPlanSubject(e.target.value)} placeholder="Ej: Álgebra y Análisis Matemático" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nivel Educativo</label>
                <select value={planLevel} onChange={(e) => setPlanLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500">
                  {ACADEMIC_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Organización Temporal</label>
                <select value={planPeriod} onChange={(e) => setPlanPeriod(e.target.value as GeneratePlanificacionPayload['periodType'])} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500">
                  <option value="bimestral">Bimestral (5 períodos)</option>
                  <option value="trimestral">Trimestral (4 períodos)</option>
                  <option value="cuatrimestral">Cuatrimestral (2 períodos)</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Botón Generar */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !canGenerate}
            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-extrabold text-sm transition-all shadow-lg ${
              canGenerate && !isLoading
                ? 'bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-white shadow-purple-600/30 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando con Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>✨ Generar con IA</span>
              </>
            )}
          </button>
          {!canGenerate && (
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <ChevronDown className="w-3.5 h-3.5" />
              Completá los campos obligatorios (*) para habilitar el generador.
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-red-500/30 bg-red-500/5 flex items-start space-x-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="glass-panel rounded-3xl border border-purple-500/30 overflow-hidden shadow-2xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-purple-500/10 gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Resultado generado por Gemini AI</span>
              <span className="text-slate-500 font-normal hidden sm:inline">
                — {new Date(result.generatedAt).toLocaleTimeString('es-AR')} hs
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => {
                  const docTitle =
                    activeTool === 'evaluation'
                      ? `Evaluacion_${evalSubject.replace(/\s+/g, '_') || 'Materia'}`
                      : activeTool === 'comunicado'
                      ? `Comunicado_${comTeacherName.replace(/\s+/g, '_') || 'Docente'}`
                      : `Planificacion_${planSubject.replace(/\s+/g, '_') || 'Materia'}`;
                  downloadAsWordDoc(
                    activeTool === 'evaluation' ? `EVALUACIÓN: ${evalSubject}` : activeTool === 'comunicado' ? `COMUNICADO: ${comMotivo}` : `PLANIFICACIÓN: ${planSubject}`,
                    result.content,
                    docTitle
                  );
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all border border-blue-400/40 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Word (.docx)</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-slate-950/80">
            <pre className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {result.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
