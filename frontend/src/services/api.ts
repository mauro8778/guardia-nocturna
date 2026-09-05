import axios from 'axios';
import { Appointment, AppointmentStatus, AuthResponse, User, DocenteAvailability, AdminMetrics } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://guardia-nocturna.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adjuntar automáticamente el token JWT a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('guardia_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: async (data: { email: string; password: string; fullName: string; phone?: string; role?: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  resetPassword: async (data: { email: string; newPassword: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/reset-password', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },
};

export const appointmentsApi = {
  getAll: async (date?: string, teacherId?: string, status?: string, search?: string): Promise<Appointment[]> => {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (teacherId) params.teacherId = teacherId;
    if (status) params.status = status;
    if (search) params.search = search;

    const response = await api.get<Appointment[]>('/appointments', { params });
    return response.data;
  },

  create: async (data: {
    date: string;
    startTime: string;
    endTime: string;
    subject: string;
    academicLevel?: string;
    specificTopics?: string;
    studyMaterialUrl?: string;
    notes?: string;
    teacherId?: string;
    teacherName?: string;
    modality?: 'VIRTUAL' | 'PRESENCIAL';
    locationType?: 'VIRTUAL' | 'TEACHER_LOCATION' | 'STUDENT_HOME';
    classAddress?: string;
    classType?: 'INDIVIDUAL' | 'GROUP';
  }): Promise<Appointment> => {
    const response = await api.post<Appointment>('/appointments', data);
    return response.data;
  },

  updateStatus: async (id: string, status: AppointmentStatus): Promise<Appointment> => {
    const response = await api.patch<Appointment>(`/appointments/${id}/status`, { status });
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/appointments/${id}`);
    return response.data;
  },

  submitReceipt: async (id: string, data: { receiptRef?: string; receiptUrl?: string }): Promise<Appointment> => {
    const response = await api.post<Appointment>(`/appointments/${id}/receipt`, data);
    return response.data;
  },
};

export const availabilityApi = {
  getAllPublic: async (): Promise<DocenteAvailability[]> => {
    const response = await api.get<DocenteAvailability[]>('/availability/public');
    return response.data;
  },

  get: async (): Promise<DocenteAvailability> => {
    const response = await api.get<DocenteAvailability>('/availability');
    return response.data;
  },

  getMyConfig: async (): Promise<DocenteAvailability> => {
    const response = await api.get<DocenteAvailability>('/availability/me');
    return response.data;
  },

  updateMyConfig: async (data: Partial<DocenteAvailability>): Promise<DocenteAvailability> => {
    const response = await api.put<DocenteAvailability>('/availability/me', data);
    return response.data;
  },

  update: async (data: Partial<DocenteAvailability>): Promise<DocenteAvailability> => {
    const response = await api.put<DocenteAvailability>('/availability/me', data);
    return response.data;
  },
};

export const adminApi = {
  getMetrics: async (): Promise<AdminMetrics> => {
    const response = await api.get<AdminMetrics>('/users/admin/metrics');
    return response.data;
  },

  getAllDocentes: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/admin/docentes');
    return response.data;
  },

  getPendingDocentes: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/admin/pending-docentes');
    return response.data;
  },

  approveDocente: async (id: string): Promise<User> => {
    const response = await api.patch<User>(`/users/admin/docentes/${id}/approve`);
    return response.data;
  },

  rejectDocente: async (id: string): Promise<User> => {
    const response = await api.patch<User>(`/users/admin/docentes/${id}/reject`);
    return response.data;
  },

  updateCommission: async (id: string, data: { commissionRate?: number; applyCommission?: boolean }): Promise<User> => {
    const response = await api.patch<User>(`/users/admin/docentes/${id}/commission`, data);
    return response.data;
  },

  updateMembership: async (id: string, data: { membershipType: 'COMMISSION_10' | 'MONTHLY_FIXED' | 'LIFETIME_FREE'; membershipStatus?: string }): Promise<User> => {
    const response = await api.patch<User>(`/users/admin/docentes/${id}/membership`, data);
    return response.data;
  },

  submitMembershipPayment: async (data: { teacherId: string; teacherName: string; receiptRef?: string; receiptUrl?: string }) => {
    const response = await api.patch('/users/docente/membership-payment', data);
    return response.data;
  },

  getMembershipPayments: async () => {
    const response = await api.get('/users/admin/membership-payments');
    return response.data;
  },

  approveMembershipPayment: async (id: string) => {
    const response = await api.patch(`/users/admin/membership-payments/${id}/approve`);
    return response.data;
  },
};

export const paymentsApi = {
  createPreference: async (data: { appointmentId: string; customAmount?: number }) => {
    const response = await api.post('/payments/create-preference', data);
    return response.data;
  },

  processSimulatedPayment: async (data: { appointmentId: string }) => {
    const response = await api.post('/payments/process-simulated', data);
    return response.data;
  },

  getFinancials: async () => {
    const response = await api.get('/payments/financials');
    return response.data;
  },

  processPayout: async (data: { teacherId: string; amount: number; reference?: string }) => {
    const response = await api.post('/payments/process-payout', data);
    return response.data;
  },
};



