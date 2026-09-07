import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Video,
  BookOpen,
  User as UserIcon,
  Sparkles,
  Navigation,
  AlertCircle,
  CheckCircle2,
  Filter,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { DocenteAvailability, StudentLocationData } from '../types';

interface StudentOnboardingProps {
  allAvailabilities: DocenteAvailability[];
  selectedTeacherId: string;
  onTeacherSelect: (teacherId: string) => void;
  onFiltersChange: (filters: {
    subject: string;
    locationType: 'VIRTUAL' | 'TEACHER_LOCATION' | 'STUDENT_HOME';
    classType: 'INDIVIDUAL' | 'GROUP';
    academicLevel: string;
  }) => void;
}

const ACADEMIC_LEVELS = [
  'Primario',
  'Secundario',
  'Terciario / Universitario',
  'Posgrado / Profesional',
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'es' } }
    );
    const data = await res.json() as { address?: { suburb?: string; neighbourhood?: string; city?: string; town?: string; state?: string } };
    const addr = data.address ?? {};
    const parts = [addr.suburb ?? addr.neighbourhood, addr.city ?? addr.town ?? addr.state].filter(Boolean);
    return parts.join(', ') || 'Tu ubicación';
  } catch {
    return 'Tu ubicación';
  }
}

export const StudentOnboarding: React.FC<StudentOnboardingProps> = ({
  allAvailabilities,
  selectedTeacherId,
  onTeacherSelect,
  onFiltersChange,
}) => {
  const [academicLevel, setAcademicLevel] = useState('Terciario / Universitario');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [classType, setClassType] = useState<'INDIVIDUAL' | 'GROUP'>('INDIVIDUAL');
  const [locationType, setLocationType] = useState<'VIRTUAL' | 'TEACHER_LOCATION' | 'STUDENT_HOME'>('VIRTUAL');

  const [studentLocation, setStudentLocation] = useState<StudentLocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [manualZone, setManualZone] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [onlyVirtual, setOnlyVirtual] = useState(false);

  // Extraer materias únicas
  const allSubjects = Array.from(
    new Set(allAvailabilities.flatMap((t) => t.subjects ?? []))
  );

  useEffect(() => {
    if (allSubjects.length > 0 && !selectedSubject) {
      setSelectedSubject(allSubjects[0]);
    }
  }, [allSubjects, selectedSubject]);

  // Emitir filtros hacia arriba cuando cambian
  useEffect(() => {
    onFiltersChange({ subject: selectedSubject, locationType, classType, academicLevel });
  }, [selectedSubject, locationType, classType, academicLevel, onFiltersChange]);

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setShowManualInput(true);
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const displayName = await reverseGeocode(lat, lng);
        setStudentLocation({ lat, lng, displayName });
        setLocationStatus('granted');
      },
      () => {
        setLocationStatus('denied');
        setShowManualInput(true);
      },
      { timeout: 8000 }
    );
  }, []);

  const handleApplyManualZone = async () => {
    const q = manualZone.trim();
    if (!q) return;
    setLocationStatus('loading');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const shortName = data[0].display_name.split(',').slice(0, 3).join(',');
        setStudentLocation({ lat, lng, displayName: shortName || q });
        setLocationStatus('granted');
      } else {
        setStudentLocation({ lat: 0, lng: 0, displayName: q });
        setLocationStatus('granted');
      }
    } catch {
      setStudentLocation({ lat: 0, lng: 0, displayName: q });
      setLocationStatus('granted');
    }
  };

  // Filtrar docentes según criterios
  const eligibleTeachers = allAvailabilities.filter((t) => {
    if (onlyVirtual && t.supportedModalities === 'PRESENCIAL') return false;
    if (selectedSubject && t.subjects?.length && !t.subjects.includes(selectedSubject)) return false;
    if (classType === 'GROUP' && !t.allowGroupClasses) return false;
    if (locationType === 'VIRTUAL' && t.supportedModalities === 'PRESENCIAL') return false;
    if (locationType === 'TEACHER_LOCATION') {
      if (t.supportedModalities === 'VIRTUAL') return false;
      if (!t.teacherAddress?.trim()) return false;
    }
    if (locationType === 'STUDENT_HOME') {
      if (t.supportedModalities === 'VIRTUAL') return false;
      if (!t.offersAtStudentHome) return false;
    }
    return true;
  });

  // Separar docentes por zona
  const RADIUS_KM = 25;
  const inZone = eligibleTeachers.filter((t) => {
    if (!studentLocation) return false;
    if (studentLocation.lat !== 0 && studentLocation.lng !== 0 && t.teacherLat && t.teacherLng) {
      const dist = haversineKm(studentLocation.lat, studentLocation.lng, t.teacherLat, t.teacherLng);
      return dist <= RADIUS_KM;
    }
    if (t.distanceKm !== undefined && t.distanceKm <= RADIUS_KM) {
      return true;
    }
    if (studentLocation.displayName) {
      const query = studentLocation.displayName.toLowerCase();
      const teacherAddr = (t.teacherAddress || '').toLowerCase();
      const teacherZone = (t.zone || '').toLowerCase();
      return teacherAddr.includes(query) || teacherZone.includes(query) || query.includes(teacherAddr) || query.includes(teacherZone);
    }
    return false;
  });

  const outZone = eligibleTeachers.filter((t) => !inZone.includes(t));

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 border border-brand-500/30 bg-slate-900/90 space-y-5 shadow-2xl">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              ¿Qué clase estás buscando?
            </h3>
            <p className="text-xs text-slate-400">
              Configurá tus preferencias para ver solo los docentes que te convienen
            </p>
          </div>
        </div>

        {/* Paso 1 — Preferencias de clase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nivel Educativo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              🎓 Nivel Educativo
            </label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              {ACADEMIC_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          {/* Materia */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              📚 Materia
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              {allSubjects.map((subj) => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          {/* Formato */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">👥 Formato de Clase</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setClassType('INDIVIDUAL')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  classType === 'INDIVIDUAL'
                    ? 'bg-brand-600 text-white border-brand-400 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                👤 Individual
              </button>
              <button
                type="button"
                onClick={() => setClassType('GROUP')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  classType === 'GROUP'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                👥 Grupal
              </button>
            </div>
          </div>
        </div>

        {/* Modalidad */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-300 block">
            📍 ¿Cómo querés tomar la clase?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: 'VIRTUAL', icon: <Video className="w-4 h-4" />, label: '🎥 Virtual (Online)', desc: 'Videollamada HD integrada', color: 'brand' },
              { value: 'TEACHER_LOCATION', icon: <UserIcon className="w-4 h-4" />, label: '📍 En local del docente', desc: 'Ir al establecimiento del profe', color: 'amber' },
              { value: 'STUDENT_HOME', icon: <BookOpen className="w-4 h-4" />, label: '🏡 A domicilio tuyo', desc: 'El docente va a tu casa', color: 'emerald' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLocationType(opt.value as typeof locationType)}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex items-center space-x-3 ${
                  locationType === opt.value
                    ? `bg-${opt.color}-500/20 border-${opt.color}-500 text-white shadow-lg ring-1 ring-${opt.color}-500`
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl bg-${opt.color}-500/20 text-${opt.color}-400 flex items-center justify-center shrink-0`}>
                  {opt.icon}
                </div>
                <div>
                  <span className="block text-white font-extrabold">{opt.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Paso 2 — Ubicación del alumno */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              Tu ubicación — Docentes cerca tuyo primero
            </label>
            {/* Filtro solo virtuales */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setOnlyVirtual(!onlyVirtual)}
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${onlyVirtual ? 'bg-brand-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${onlyVirtual ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-brand-400" />
                Solo virtuales
              </span>
            </label>
          </div>

          {locationStatus === 'idle' && !studentLocation && (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={requestGeolocation}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/40 text-brand-300 text-xs font-bold transition-all"
              >
                <Navigation className="w-4 h-4" />
                <span>Detectar mi ubicación automáticamente</span>
              </button>
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="text-xs text-slate-400 hover:text-white underline transition-colors"
              >
                Ingresar zona manualmente
              </button>
            </div>
          )}

          {locationStatus === 'loading' && (
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              <span>Buscando zona...</span>
            </div>
          )}

          {studentLocation && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <div className="flex items-center space-x-2 truncate">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="truncate">📍 Zona activa: <strong>{studentLocation.displayName}</strong> — docentes cercanos primero</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStudentLocation(null);
                  setLocationStatus('idle');
                  setShowManualInput(true);
                }}
                className="text-[11px] text-slate-400 hover:text-white underline shrink-0 ml-2"
              >
                Cambiar
              </button>
            </div>
          )}

          {(showManualInput || locationStatus === 'denied') && !studentLocation && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualZone}
                  onChange={(e) => setManualZone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyManualZone();
                  }}
                  placeholder="Ej: Brasil 1513, Merlo / Caballito / Córdoba..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={handleApplyManualZone}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Buscar Zona
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Presioná <strong>Buscar Zona</strong> o presiona Enter para calcular docentes cercanos a esa dirección.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Paso 3 — Listado de Docentes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-amber-400" />
            Docentes disponibles para "{selectedSubject}"
          </h3>
          <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            {eligibleTeachers.length} {eligibleTeachers.length === 1 ? 'docente' : 'docentes'} encontrados
          </span>
        </div>

        {eligibleTeachers.length === 0 ? (
          <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 flex items-center space-x-4 text-amber-300 text-xs">
            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">No hay docentes con esta combinación de filtros.</p>
              <p className="text-amber-300/80 mt-0.5">Probá cambiar la modalidad o la materia.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Docentes en tu zona */}
            {inZone.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Docentes en tu zona (dentro de {RADIUS_KM} km)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 font-mono">{inZone.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {inZone.map((doc) => (
                    <TeacherCard
                      key={doc.teacherId}
                      doc={doc}
                      isSelected={doc.teacherId === selectedTeacherId}
                      onSelect={onTeacherSelect}
                      locationType={locationType}
                      badge={doc.distanceKm !== undefined ? `📍 ${doc.distanceKm} km` : undefined}
                      badgeColor="emerald"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Docentes fuera de zona o sin geolocalización */}
            {outZone.length > 0 && (
              <div className="space-y-2">
                {inZone.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider pt-2 border-t border-slate-800">
                    <Video className="w-3.5 h-3.5 text-brand-400" />
                    <span>Otros docentes disponibles {locationType === 'VIRTUAL' ? '(todo el país)' : '(otras zonas)'}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {outZone.map((doc) => (
                    <TeacherCard
                      key={doc.teacherId}
                      doc={doc}
                      isSelected={doc.teacherId === selectedTeacherId}
                      onSelect={onTeacherSelect}
                      locationType={locationType}
                      badge={doc.distanceKm !== undefined ? `${doc.distanceKm} km` : (doc.zone ?? undefined)}
                      badgeColor="slate"
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA — Ver Calendario */}
      {selectedTeacherId && (
        <div className="glass-panel p-4 rounded-2xl border border-brand-500/30 bg-brand-600/10 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
            <div>
              <p className="font-bold text-white">
                Docente seleccionado — ahora elegí fecha y horario en la grilla
              </p>
              <p className="text-slate-400 mt-0.5">
                Scrolleá para ver los horarios disponibles del docente
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-brand-400 shrink-0 animate-bounce" />
        </div>
      )}
    </div>
  );
};

// ── Subcomponente de card de docente ────────────────────────────────────────

interface TeacherCardProps {
  doc: DocenteAvailability;
  isSelected: boolean;
  onSelect: (id: string) => void;
  locationType: 'VIRTUAL' | 'TEACHER_LOCATION' | 'STUDENT_HOME';
  badge?: string;
  badgeColor?: 'emerald' | 'slate' | 'amber';
}

const TeacherCard: React.FC<TeacherCardProps> = ({ doc, isSelected, onSelect, locationType, badge, badgeColor = 'slate' }) => {
  const badgeClasses: Record<string, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    slate: 'bg-slate-700/60 text-slate-400 border-slate-700',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };

  return (
    <div
      onClick={() => onSelect(doc.teacherId)}
      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
        isSelected
          ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/20 scale-[1.02]'
          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
      }`}
    >
      <div className="flex items-center space-x-3 overflow-hidden min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
            isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'
          }`}
        >
          {doc.teacherName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-white truncate">{doc.teacherName}</h4>
          <p className="text-[10px] text-amber-300 font-mono font-bold">
            ${doc.hourlyRate.toLocaleString('es-AR')} ARS {doc.pricingType === 'PER_SUBJECT' ? '• Por Materia' : '• Por Hora'}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            {doc.is24Hours ? '⚡ 24hs Guardia' : `${doc.startHour}:00 — ${doc.endHour}:00 hs`}
          </p>
          {doc.teacherAddress && locationType === 'TEACHER_LOCATION' && (
            <p className="text-[9px] text-amber-300 font-mono truncate">📍 {doc.teacherAddress}</p>
          )}
          {badge && (
            <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono border ${badgeClasses[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all shrink-0 ml-2 ${
          isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
        }`}
      >
        {isSelected ? '✓ Elegido' : 'Elegir'}
      </button>
    </div>
  );
};
