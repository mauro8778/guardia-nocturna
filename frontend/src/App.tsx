import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { AuthModal } from './components/AuthModal';
import { BookingModal } from './components/BookingModal';
import { BookingSuccessModal } from './components/BookingSuccessModal';
import { DocenteDashboard } from './components/DocenteDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { WhatsAppModal } from './components/WhatsAppModal';
import { VirtualClassroomModal } from './components/VirtualClassroomModal';
import { appointmentsApi, availabilityApi } from './services/api';
import { Appointment, AppointmentStatus, DocenteAvailability } from './types';
import { Sparkles, Info } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user } = useAuth();

  // Navigation Tab State (CALENDAR vs DASHBOARD)
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'DASHBOARD'>('CALENDAR');

  // Fecha actual YYYY-MM-DD
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allAvailabilities, setAllAvailabilities] = useState<DocenteAvailability[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modales
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [selectedStartTime, setSelectedStartTime] = useState<string>('18:00');
  
  // Success Payment Modal
  const [isSuccessOpen, setIsSuccessOpen] = useState<boolean>(false);
  const [successAppointment, setSuccessAppointment] = useState<Appointment | null>(null);
  const [successTotalPrice, setSuccessTotalPrice] = useState<number>(0);

  // WhatsApp Modal
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);
  const [selectedWhatsAppAppt, setSelectedWhatsAppAppt] = useState<Appointment | null>(null);
  const [customWhatsAppMessage, setCustomWhatsAppMessage] = useState<string | undefined>(undefined);

  // Virtual Classroom Modal
  const [isClassroomOpen, setIsClassroomOpen] = useState<boolean>(false);
  const [selectedClassroomAppt, setSelectedClassroomAppt] = useState<Appointment | null>(null);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Cargar disponibilidad de todos los docentes
  const loadAllAvailabilities = async () => {
    try {
      const data = await availabilityApi.getAllPublic();
      setAllAvailabilities(data);
      if (data.length > 0) {
        const exists = data.some((t) => t.teacherId === selectedTeacherId);
        if (!exists || !selectedTeacherId) {
          setSelectedTeacherId(data[0].teacherId);
          if (data[0].subjects && data[0].subjects.length > 0) {
            setSelectedSubject(data[0].subjects[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar docentes:', error);
    }
  };

  const activeTeacher = allAvailabilities.find((t) => t.teacherId === selectedTeacherId) || allAvailabilities[0] || null;

  const handleUpdateAvailability = async (newConfig: Partial<DocenteAvailability>) => {
    try {
      const updated = await availabilityApi.updateMyConfig(newConfig);
      setAllAvailabilities((prev) => prev.map((a) => (a.teacherId === updated.teacherId ? updated : a)));
      showToast('¡Configuración de disponibilidad guardada exitosamente!');
    } catch (error) {
      console.error('Error al actualizar disponibilidad:', error);
      showToast('No se pudo guardar la disponibilidad.');
      throw error;
    }
  };

  // Cargar turnos de la fecha elegida para el docente seleccionado
  const loadAppointments = async (date: string, teacherId?: string) => {
    setIsLoading(true);
    try {
      const data = await appointmentsApi.getAll(date, teacherId || selectedTeacherId);
      setAppointments(data);
    } catch (error) {
      console.error('Error al cargar turnos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllAvailabilities();
    loadAppointments(selectedDate, selectedTeacherId);
  }, [selectedDate, selectedTeacherId]);

  // Selección de slot disponible para reservar
  const handleSelectSlotToBook = (time: string) => {
    if (!user) {
      setIsAuthOpen(true);
      showToast('Por favor iniciá sesión o registrate para tomar un turno.');
      return;
    }
    if (user.role === 'ADMIN') {
      showToast('⚠️ Los profesores y administradores no pueden tomar turnos como alumnos.');
      return;
    }
    setSelectedStartTime(time);
    setIsBookingOpen(true);
  };

  // Cuando se reserva con éxito
  const handleBookingSuccess = (newAppt: Appointment, totalPrice: number) => {
    setAppointments((prev) => [...prev, newAppt]);
    showToast(`¡Turno reservado exitosamente! Estado: 🟡 Pago Pendiente.`);
    setSuccessAppointment(newAppt);
    setSuccessTotalPrice(totalPrice);
    setIsSuccessOpen(true);
  };

  // Abrir WhatsApp con mensaje personalizado opcional
  const handleOpenWhatsAppModal = (appt: Appointment | null, customMsg?: string) => {
    setSelectedWhatsAppAppt(appt);
    setCustomWhatsAppMessage(customMsg);
    setIsWhatsAppOpen(true);
  };

  // Actualizar estado de pago (PENDING <-> CONFIRMED_PAID)
  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const updated = await appointmentsApi.updateStatus(id, newStatus);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      const statusText = newStatus === 'CONFIRMED_PAID' ? '🟢 Pagado' : '🟡 Pago Pendiente';
      showToast(`Estado del turno actualizado a: ${statusText}`);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      showToast('No se pudo actualizar el estado del turno.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenWhatsAppDirect={() => handleOpenWhatsAppModal(null)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="glass-panel px-4 py-3 rounded-2xl border border-brand-500/40 shadow-2xl flex items-center space-x-3 text-xs text-white">
            <Info className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Render View based on activeTab and User Role */}
        {activeTab === 'DASHBOARD' && user?.role === 'ADMIN' ? (
          user.email === 'maurodiaz8778@gmail.com' ? (
            <AdminDashboard
              onOpenWhatsApp={(appt, customMsg) => handleOpenWhatsAppModal(appt, customMsg)}
            />
          ) : (
            <DocenteDashboard
              availability={activeTeacher}
              onUpdateAvailability={handleUpdateAvailability}
              onOpenClassroom={(appt) => {
                setSelectedClassroomAppt(appt);
                setIsClassroomOpen(true);
              }}
              onOpenWhatsApp={(appt, customMsg) => handleOpenWhatsAppModal(appt, customMsg)}
            />
          )
        ) : (
          <>
            {/* Hero Header Section */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-800">
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-3xl space-y-3">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-oat-200/10 border border-oat-300/30 text-oat-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-oat-300" />
                  <span>Plataforma Online de Clases Particulares</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Reservá tu clase en <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-oat-300 to-brand-400">Guardia Docente</span>
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Elegí la materia, el profesor/a y el horario disponible. El turno figura en <span className="text-amber-400 font-semibold">🟡 amarillo</span> al reservar y pasa a <span className="text-emerald-400 font-semibold">🟢 verde</span> al enviar tu comprobante.
                </p>
              </div>
            </div>

            {/* Interactive Calendar View */}
            <CalendarView
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              appointments={appointments}
              allTeacherAvailabilities={allAvailabilities}
              activeTeacher={activeTeacher}
              selectedTeacherId={selectedTeacherId}
              onTeacherChange={setSelectedTeacherId}
              selectedSubject={selectedSubject}
              onSubjectChange={setSelectedSubject}
              onSelectSlotToBook={handleSelectSlotToBook}
              onUpdateStatus={handleUpdateStatus}
              onOpenWhatsApp={(appt) => handleOpenWhatsAppModal(appt)}
              onOpenClassroom={(appt) => {
                setSelectedClassroomAppt(appt);
                setIsClassroomOpen(true);
              }}
            />
          </>
        )}
      </main>

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        selectedDate={selectedDate}
        selectedStartTime={selectedStartTime}
        initialSubject={selectedSubject}
        hourlyRate={activeTeacher?.hourlyRate || 5000}
        availableSubjects={activeTeacher?.subjects}
        teacherId={activeTeacher?.teacherId}
        teacherName={activeTeacher?.teacherName}
        onBookingSuccess={handleBookingSuccess}
      />

      <BookingSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        appointment={successAppointment}
        totalPrice={successTotalPrice}
        aliasMP={activeTeacher?.aliasMP}
        linkMP={activeTeacher?.linkMP}
        teacherName={activeTeacher?.teacherName}
        onOpenWhatsApp={(appt, customMsg) => handleOpenWhatsAppModal(appt, customMsg)}
      />

      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        appointment={selectedWhatsAppAppt}
        customMessage={customWhatsAppMessage}
      />

      <VirtualClassroomModal
        isOpen={isClassroomOpen}
        onClose={() => setIsClassroomOpen(false)}
        appointment={selectedClassroomAppt}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-400">
        <p>© 2026 Guardia Docente. Todos los derechos reservados. Clases particulares y turnos online.</p>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

