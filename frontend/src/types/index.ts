export type UserRole = 'STUDENT' | 'ADMIN';
export type UserStatus = 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
export type MembershipType = 'COMMISSION_10' | 'MONTHLY_FIXED' | 'LIFETIME_FREE';
export type MembershipStatus = 'ACTIVE_TRIAL' | 'ACTIVE_PAID' | 'EXEMPT' | 'SUSPENDED_UNPAID';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  status?: UserStatus;
  commissionRate?: number;
  applyCommission?: boolean;
  membershipType?: MembershipType;
  membershipStatus?: MembershipStatus;
  trialEndsAt?: string;
  membershipPaidUntil?: string;
}

export type AppointmentStatus = 'DRAFT_UNPAID' | 'RECEIPT_SUBMITTED' | 'CONFIRMED_PAID' | 'CANCELLED';
export type ClassModality = 'VIRTUAL' | 'PRESENCIAL';
export type LocationType = 'VIRTUAL' | 'TEACHER_LOCATION' | 'STUDENT_HOME';
export type ClassType = 'INDIVIDUAL' | 'GROUP';

export interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  subject: string;
  academicLevel?: string;
  specificTopics?: string;
  studyMaterialUrl?: string;
  notes?: string;
  status: AppointmentStatus;
  meetingUrl?: string;
  receiptRef?: string;
  receiptUrl?: string;
  teacherId?: string;
  teacherName?: string;
  studentId: string;
  studentName: string;
  totalAmount?: number;
  platformFee?: number;
  teacherNet?: number;
  pricingType?: 'PER_HOUR' | 'PER_SUBJECT';
  modality?: ClassModality;
  locationType?: LocationType;
  classAddress?: string;
  classType?: ClassType;
  maxStudents?: number;
  enrolledCount?: number;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface DocenteAvailability {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherPhone: string;
  aliasMP: string;
  is24Hours: boolean;
  startHour: number;
  endHour: number;
  availableDays: number[];
  subjects: string[];
  hourlyRate: number;
  pricingType?: 'PER_HOUR' | 'PER_SUBJECT';
  subjectRates?: Record<string, number>;
  linkMP?: string;
  supportedModalities?: 'VIRTUAL' | 'PRESENCIAL' | 'BOTH';
  teacherAddress?: string;
  offersAtStudentHome?: boolean;
  allowGroupClasses?: boolean;
  minGroupStudents?: number;
  maxGroupStudents?: number;
  teacherLat?: number;
  teacherLng?: number;
  zone?: string;
  distanceKm?: number;
}

export interface TeacherMembershipPayment {
  id: string;
  teacherId: string;
  teacherName: string;
  amount: number;
  receiptRef?: string;
  receiptUrl?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  periodMonth: string;
  createdAt: string;
}

export interface AdminMetrics {
  totalUsers: number;
  totalDocentes: number;
  pendingDocentes: number;
  totalStudents: number;
  totalAppointments: number;
  confirmedCount: number;
  pendingReceipts: number;
  draftAppointments: number;
  totalGrossRevenue: number;
  totalPlatformFee: number;
  totalTeacherNet: number;
}

export interface TeacherBalanceReport {
  teacherId: string;
  teacherName: string;
  totalGrossRevenue: number;
  platformFeeAccumulated: number;
  totalTeacherNetEarned: number;
  totalPaidOut: number;
  pendingBalance: number;
}

export interface FinancialsSummary {
  totalGrossRevenue: number;
  totalPlatformFee: number;
  totalTeacherNetEarned: number;
  totalPaidOutToTeachers: number;
  pendingBalanceToTeachers: number;
  teachersBalances: TeacherBalanceReport[];
  recentTransactions: Array<Record<string, unknown>>;
  recentPayouts: Array<Record<string, unknown>>;
}

export interface PreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
  isSimulated: boolean;
  totalAmount: number;
  appointmentId: string;
  subject: string;
  teacherName: string;
}

// ─── Tipos para Herramientas IA ──────────────────────────────────────────────

export interface AiGenerationResult {
  content: string;
  generatedAt: string;
}

export interface GenerateEvaluationPayload {
  subject: string;
  academicLevel: string;
  questionType: 'multiple_choice' | 'open' | 'mixed';
  questionCount: number;
  difficulty: 'facil' | 'medio' | 'dificil';
  additionalContext: string;
}

export interface GenerateComunicadoPayload {
  teacherName: string;
  subjects: string;
  motivo: string;
  destinatario: string;
}

export interface GeneratePlanificacionPayload {
  subject: string;
  academicLevel: string;
  periodType: 'bimestral' | 'trimestral' | 'cuatrimestral';
}

export interface StudentLocationData {
  lat: number;
  lng: number;
  displayName: string;
}
