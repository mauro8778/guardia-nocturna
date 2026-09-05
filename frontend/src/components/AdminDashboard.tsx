import React, { useState, useEffect } from 'react';
import { adminApi, appointmentsApi, paymentsApi } from '../services/api';
import { User, Appointment, AdminMetrics, AppointmentStatus, FinancialsSummary, TeacherMembershipPayment } from '../types';
import {
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Search,
  ShieldCheck,
  Percent,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  CreditCard,
  Send,
  FileCheck,
  Eye,
  FileText,
  X,
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenWhatsApp: (appt: Appointment | null, customMsg?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenWhatsApp }) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [docentes, setDocentes] = useState<User[]>([]);
  const [pendingDocentes, setPendingDocentes] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [financials, setFinancials] = useState<FinancialsSummary | null>(null);
  const [membershipPayments, setMembershipPayments] = useState<TeacherMembershipPayment[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<{ title: string; url?: string; ref?: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'METRICS' | 'FINANCIALS' | 'DOCENTES' | 'TURNOS'>('METRICS');
  const [payoutInputs, setPayoutInputs] = useState<Record<string, string>>({});
  const [payoutStatusMsg, setPayoutStatusMsg] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mRes, dRes, pRes, aRes, fRes, memRes] = await Promise.all([
        adminApi.getMetrics(),
        adminApi.getAllDocentes(),
        adminApi.getPendingDocentes(),
        appointmentsApi.getAll(undefined, undefined, statusFilter || undefined, searchTerm || undefined),
        paymentsApi.getFinancials(),
        adminApi.getMembershipPayments(),
      ]);
      setMetrics(mRes);
      setDocentes(dRes);
      setPendingDocentes(pRes);
      setAppointments(aRes);
      setFinancials(fRes);
      setMembershipPayments(memRes || []);
    } catch (error) {
      console.error('Error al cargar datos del Administrador:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Auto-refresh cada 15s
    return () => clearInterval(interval);
  }, [statusFilter, searchTerm]);

  const handleApproveDocente = async (id: string) => {
    try {
      await adminApi.approveDocente(id);
      loadData();
    } catch (error) {
      console.error('Error al aprobar docente:', error);
    }
  };

  const handleRejectDocente = async (id: string) => {
    try {
      await adminApi.rejectDocente(id);
      loadData();
    } catch (error) {
      console.error('Error al rechazar docente:', error);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await appointmentsApi.updateStatus(id, newStatus);
      loadData();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const handleExecutePayout = async (teacherId: string, amount: number) => {
    if (amount <= 0) return;
    try {
      await paymentsApi.processPayout({
        teacherId,
        amount,
        reference: `LIQ-${Date.now().toString().slice(-6)}`,
      });
      setPayoutStatusMsg(`¡Liquidación de $${amount.toLocaleString('es-AR')} registrada exitosamente!`);
      setTimeout(() => setPayoutStatusMsg(null), 4000);
      loadData();
    } catch (err) {
      console.error('Error al procesar liquidación:', err);
    }
  };

  const handleUpdateMembership = async (
    id: string,
    membershipType: 'COMMISSION_10' | 'MONTHLY_FIXED' | 'LIFETIME_FREE',
  ) => {
    try {
      await adminApi.updateMembership(id, { membershipType });
      setPayoutStatusMsg(`¡Membresía actualizada a ${membershipType}!`);
      setTimeout(() => setPayoutStatusMsg(null), 3500);
      loadData();
    } catch (err) {
      console.error('Error al actualizar membresía:', err);
    }
  };

  const handleApproveMembershipPayment = async (paymentId: string) => {
    try {
      await adminApi.approveMembershipPayment(paymentId);
      setPayoutStatusMsg('¡Comprobante de Membresía Mensual ($50.000) aprobado exitosamente!');
      setTimeout(() => setPayoutStatusMsg(null), 4000);
      loadData();
    } catch (err) {
      console.error('Error al aprobar pago de membresía:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {payoutStatusMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="glass-panel px-4 py-3 rounded-2xl border border-emerald-500/40 shadow-2xl flex items-center space-x-3 text-xs text-white">
            <span className="font-semibold text-emerald-300">{payoutStatusMsg}</span>
          </div>
        </div>
      )}

      {/* Header Admin */}
      <div className="glass-panel p-6 rounded-3xl border border-brand-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Panel SuperAdmin Control Total</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Dashboard de Administración
          </h1>
          <p className="text-xs text-slate-400">
            Control global de la plataforma, pasarela de cobros, retención del 10% y liquidación a docentes.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Tabs Nav */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('METRICS')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'METRICS'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Métricas & Ganancias</span>
        </button>

        <button
          onClick={() => setActiveTab('FINANCIALS')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'FINANCIALS'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-300" />
          <span>Finanzas & Liquidaciones</span>
        </button>

        <button
          onClick={() => setActiveTab('DOCENTES')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 relative ${
            activeTab === 'DOCENTES'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Membresías & Docentes</span>
          {pendingDocentes.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px]">
              {pendingDocentes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('TURNOS')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'TURNOS'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Control de Turnos</span>
        </button>
      </div>

      {/* Tab: METRICAS */}
      {activeTab === 'METRICS' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-1">
              <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
                <span>Recaudación Bruta</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-white font-mono break-all">
                ${metrics.totalGrossRevenue.toLocaleString()} ARS
              </p>
              <p className="text-[10px] text-emerald-400 font-medium">
                {metrics.confirmedCount} turnos confirmados
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-brand-500/30 space-y-1">
              <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
                <span>Ganancia Retención Plataforma (10%)</span>
                <Percent className="w-4 h-4 text-brand-400" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-brand-300 font-mono break-all">
                ${metrics.totalPlatformFee.toLocaleString()} ARS
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Comisiones retenidas a docentes
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-sky-500/30 space-y-1">
              <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
                <span>Neto a Pagar a Docentes (90%)</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-sky-300 font-mono break-all">
                ${metrics.totalTeacherNet.toLocaleString()} ARS
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {metrics.totalDocentes} docentes registrados
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: FINANCIALS & PAYOUTS */}
      {activeTab === 'FINANCIALS' && financials && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-1">
              <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
                <span>Ingreso Bruto Total</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-white font-mono break-all">
                ${financials.totalGrossRevenue.toLocaleString('es-AR')} ARS
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold">Transferencias y Comprobantes Validados</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-amber-500/40 space-y-1">
              <div className="flex justify-between items-center text-amber-300 text-xs font-medium">
                <span>Ganancia Neta Admin (10%)</span>
                <Percent className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-300 font-mono break-all">
                ${financials.totalPlatformFee.toLocaleString('es-AR')} ARS
              </p>
              <span className="text-[10px] text-amber-200">Retención neta de la plataforma</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-sky-500/40 space-y-1">
              <div className="flex justify-between items-center text-sky-300 text-xs font-medium">
                <span>Saldo Pendiente a Docentes</span>
                <Clock className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-sky-300 font-mono break-all">
                ${financials.pendingBalanceToTeachers.toLocaleString('es-AR')} ARS
              </p>
              <span className="text-[10px] text-sky-200">Total a transferir / liquidar</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-700 space-y-1">
              <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
                <span>Total Liquidado a Docentes</span>
                <FileCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-200 font-mono break-all">
                ${financials.totalPaidOutToTeachers.toLocaleString('es-AR')} ARS
              </p>
              <span className="text-[10px] text-slate-400">Transferencias registradas</span>
            </div>
          </div>

          {/* Tabla y Tarjetas de Balances y Liquidaciones por Docente */}
          <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400 shrink-0" />
                Estado de Saldo y Liquidaciones por Profesor
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualizá las ganancias netas de cada docente, sus comisiones del 10% y registrá pagos transferidos.
              </p>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Profesor / Docente</th>
                    <th className="py-3.5 px-4">Recaudado Bruto</th>
                    <th className="py-3.5 px-4">Comisión Plataforma (10%)</th>
                    <th className="py-3.5 px-4">Ganancia Neta Docente</th>
                    <th className="py-3.5 px-4">Total Liquidado</th>
                    <th className="py-3.5 px-4">Saldo Pendiente 🟢</th>
                    <th className="py-3.5 px-4 text-right">Registrar Payout / Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {financials.teachersBalances.map((tReport) => {
                    const inputVal = payoutInputs[tReport.teacherId] ?? tReport.pendingBalance.toString();
                    return (
                      <tr key={tReport.teacherId} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{tReport.teacherName}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">${tReport.totalGrossRevenue.toLocaleString('es-AR')}</td>
                        <td className="py-3.5 px-4 font-mono text-amber-400 font-bold">${tReport.platformFeeAccumulated.toLocaleString('es-AR')}</td>
                        <td className="py-3.5 px-4 font-mono text-sky-400 font-bold">${tReport.totalTeacherNetEarned.toLocaleString('es-AR')}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">${tReport.totalPaidOut.toLocaleString('es-AR')}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-extrabold ${
                            tReport.pendingBalance > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            ${tReport.pendingBalance.toLocaleString('es-AR')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="relative w-28">
                              <span className="absolute left-2.5 top-1.5 text-slate-500 font-mono text-xs">$</span>
                              <input
                                type="number"
                                value={inputVal}
                                onChange={(e) => setPayoutInputs({ ...payoutInputs, [tReport.teacherId]: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-6 pr-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <button
                              onClick={() => handleExecutePayout(tReport.teacherId, Number(inputVal))}
                              disabled={Number(inputVal) <= 0}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center space-x-1 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40"
                              title="Registrar liquidación al docente"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Liquidar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< md) */}
            <div className="block md:hidden space-y-3">
              {financials.teachersBalances.map((tReport) => {
                const inputVal = payoutInputs[tReport.teacherId] ?? tReport.pendingBalance.toString();
                return (
                  <div key={tReport.teacherId} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="font-bold text-white text-sm">{tReport.teacherName}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold ${
                        tReport.pendingBalance > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        Pendiente: ${tReport.pendingBalance.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Recaudado Bruto:</span>
                        <span className="font-bold text-white">${tReport.totalGrossRevenue.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-amber-400 block">Comisión 10%:</span>
                        <span className="font-bold text-amber-300">${tReport.platformFeeAccumulated.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-sky-400 block">Ganancia Neta:</span>
                        <span className="font-bold text-sky-300">${tReport.totalTeacherNetEarned.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Liquidado:</span>
                        <span className="font-bold text-slate-300">${tReport.totalPaidOut.toLocaleString('es-AR')}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center space-x-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-2 text-slate-500 font-mono text-xs">$</span>
                        <input
                          type="number"
                          value={inputVal}
                          onChange={(e) => setPayoutInputs({ ...payoutInputs, [tReport.teacherId]: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-6 pr-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        onClick={() => handleExecutePayout(tReport.teacherId, Number(inputVal))}
                        disabled={Number(inputVal) <= 0}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center space-x-1 shadow-md transition-all shrink-0 disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Liquidar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comprobantes de Membresía Mensual ($50.000 ARS) */}
            {membershipPayments.length > 0 && (
              <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-emerald-500/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <CreditCard className="w-5 h-5 shrink-0" />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Comprobantes de Membresía Mensual ($50.000 ARS) ({membershipPayments.length})
                    </h3>
                  </div>
                </div>

                <div className="divide-y divide-slate-800">
                  {membershipPayments.map((pmt) => (
                    <div key={pmt.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-white text-sm">{pmt.teacherName}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            pmt.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {pmt.status === 'APPROVED' ? '✓ Aprobado' : '⏳ Pendiente Revisión'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Ref/N° Op: <span className="text-emerald-400 font-bold">{pmt.receiptRef || 'Sin N° de Operación'}</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        {pmt.receiptUrl ? (
                          <button
                            onClick={() => setSelectedReceipt({
                              title: `Comprobante $50k - ${pmt.teacherName}`,
                              url: pmt.receiptUrl,
                              ref: pmt.receiptRef,
                            })}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-700"
                          >
                            <Eye className="w-3.5 h-3.5 text-brand-400" />
                            <span>Ver Adjunto (Foto/PDF)</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Solo N° de Transacción</span>
                        )}

                        {pmt.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleApproveMembershipPayment(pmt.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md transition flex items-center space-x-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Aprobar $50k</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: DOCENTES & MEMBRESÍAS */}
      {activeTab === 'DOCENTES' && (
        <div className="space-y-6">
          {/* Solicitudes Pendientes */}
          {pendingDocentes.length > 0 && (
            <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-amber-500/40 space-y-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Solicitudes de Registro de Docentes Pendientes ({pendingDocentes.length})
                </h3>
              </div>

              <div className="divide-y divide-slate-800">
                {pendingDocentes.map((docente) => (
                  <div key={docente.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-white text-sm">{docente.fullName}</p>
                      <p className="text-xs text-slate-400">{docente.email} • Tel: {docente.phone || 'N/A'}</p>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleApproveDocente(docente.id)}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Aprobar 🟢</span>
                      </button>

                      <button
                        onClick={() => handleRejectDocente(docente.id)}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition text-center"
                      >
                        <span>Rechazar 🔴</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listado Completo de Docentes y Control de Membresías */}
          <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Gestión de Membresías y Retención de Docentes</h3>
              <p className="text-xs text-slate-400">
                Asigná Plan Beca Vitalicio (Exento), Membresía de $50k/mes o Retención del 10% por clase.
              </p>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Docente</th>
                    <th className="p-3">Email / Teléfono</th>
                    <th className="p-3">Estado Aprobación</th>
                    <th className="p-3">Membresía Actual</th>
                    <th className="p-3 text-right">Acciones de Membresía</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {docentes.map((docente) => (
                    <tr key={docente.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-semibold text-white">{docente.fullName}</td>
                      <td className="p-3 text-slate-400">{docente.email}<br/>{docente.phone}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          docente.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                          docente.status === 'PENDING_APPROVAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {docente.status || 'APPROVED'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                          docente.membershipType === 'LIFETIME_FREE' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                          docente.membershipType === 'MONTHLY_FIXED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                          'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                        }`}>
                          {docente.membershipType === 'LIFETIME_FREE' ? '👑 Plan Beca Vitalicio' :
                           docente.membershipType === 'MONTHLY_FIXED' ? '💎 $50.000 / Mes (0%)' :
                           '📊 10% por Clase'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateMembership(docente.id, 'LIFETIME_FREE')}
                            className="px-2.5 py-1 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white text-[10px] font-bold transition-all shrink-0"
                            title="Otorgar Plan Beca / Conocidos de por vida ($0 y 0% comisión)"
                          >
                            👑 Plan Beca
                          </button>
                          <button
                            onClick={() => handleUpdateMembership(docente.id, 'MONTHLY_FIXED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all shrink-0"
                            title="Cambiar a Membresía Mensual Fija de $50.000"
                          >
                            💎 $50k / Mes
                          </button>
                          <button
                            onClick={() => handleUpdateMembership(docente.id, 'COMMISSION_10')}
                            className="px-2.5 py-1 rounded-lg bg-brand-600/80 hover:bg-brand-500 text-white text-[10px] font-bold transition-all shrink-0"
                            title="Cambiar a Comisión del 10% por clase"
                          >
                            📊 10% Clase
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< md) */}
            <div className="block md:hidden space-y-3">
              {docentes.map((docente) => (
                <div key={docente.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{docente.fullName}</h4>
                      <p className="text-[11px] text-slate-400">{docente.email} {docente.phone ? `• ${docente.phone}` : ''}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      docente.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                      docente.status === 'PENDING_APPROVAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}>
                      {docente.status || 'APPROVED'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Membresía Actual:</span>
                    <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${
                      docente.membershipType === 'LIFETIME_FREE' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                      docente.membershipType === 'MONTHLY_FIXED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                      'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                    }`}>
                      {docente.membershipType === 'LIFETIME_FREE' ? '👑 Plan Beca Vitalicio' :
                       docente.membershipType === 'MONTHLY_FIXED' ? '💎 $50.000 / Mes (0%)' :
                       '📊 10% por Clase'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-semibold">Cambiar Membresía:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => handleUpdateMembership(docente.id, 'LIFETIME_FREE')}
                        className="py-1.5 px-2 rounded-lg bg-purple-600/80 text-white text-[10px] font-bold text-center"
                      >
                        👑 Plan Beca
                      </button>
                      <button
                        onClick={() => handleUpdateMembership(docente.id, 'MONTHLY_FIXED')}
                        className="py-1.5 px-2 rounded-lg bg-emerald-600/80 text-white text-[10px] font-bold text-center"
                      >
                        💎 $50k / Mes
                      </button>
                      <button
                        onClick={() => handleUpdateMembership(docente.id, 'COMMISSION_10')}
                        className="py-1.5 px-2 rounded-lg bg-brand-600/80 text-white text-[10px] font-bold text-center"
                      >
                        📊 10% Clase
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: TURNOS */}
      {activeTab === 'TURNOS' && (
        <div className="space-y-4">
          {/* Barra de Búsqueda y Chips de Filtro */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por alumno, materia, ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  statusFilter === '' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('CONFIRMED_PAID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  statusFilter === 'CONFIRMED_PAID' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                🟢 Confirmados
              </button>
              <button
                onClick={() => setStatusFilter('RECEIPT_SUBMITTED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  statusFilter === 'RECEIPT_SUBMITTED' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                🟡 Comprobantes
              </button>
              <button
                onClick={() => setStatusFilter('DRAFT_UNPAID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  statusFilter === 'DRAFT_UNPAID' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                🟠 Borradores
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block glass-panel p-6 rounded-3xl border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Fecha / Hora</th>
                  <th className="p-3">Materia</th>
                  <th className="p-3">Alumno</th>
                  <th className="p-3">Docente</th>
                  <th className="p-3">Monto / Retención</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-white">{appt.date}<br/>{appt.startTime} hs</td>
                    <td className="p-3 text-slate-200">{appt.subject}</td>
                    <td className="p-3">{appt.studentName}</td>
                    <td className="p-3 text-slate-400">{appt.teacherName}</td>
                    <td className="p-3">
                      <span className="font-bold text-white">${appt.totalAmount || 5000}</span>
                      <span className="text-[10px] text-slate-500 block">Ret: ${appt.platformFee || 500}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        appt.status === 'CONFIRMED_PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                        appt.status === 'RECEIPT_SUBMITTED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="p-3 space-x-2">
                      {appt.status !== 'CONFIRMED_PAID' && (
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED_PAID')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                        >
                          Confirmar 🟢
                        </button>
                      )}
                      <button
                        onClick={() => onOpenWhatsApp(appt)}
                        className="px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-[10px] font-semibold"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (< md) */}
          <div className="block md:hidden space-y-3">
            {appointments.map((appt) => (
              <div key={appt.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h4 className="font-bold text-white text-sm">{appt.subject}</h4>
                    <p className="text-[11px] text-slate-400">📅 {appt.date} • ⏰ {appt.startTime} hs</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    appt.status === 'CONFIRMED_PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                    appt.status === 'RECEIPT_SUBMITTED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                    'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                  }`}>
                    {appt.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Alumno:</span>
                    <span className="font-semibold text-slate-200">{appt.studentName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Docente:</span>
                    <span className="font-semibold text-slate-200">{appt.teacherName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-xs font-mono font-extrabold text-white">${appt.totalAmount || 5000} ARS</span>
                    <span className="text-[10px] text-slate-500 block">Retención: ${appt.platformFee || 500}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {appt.status !== 'CONFIRMED_PAID' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED_PAID')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold"
                      >
                        Confirmar 🟢
                      </button>
                    )}
                    <button
                      onClick={() => onOpenWhatsApp(appt)}
                      className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-semibold"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Previsualización de Comprobante (Imagen / PDF) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-3xl w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <span>{selectedReceipt.title}</span>
                </h3>
                {selectedReceipt.ref && (
                  <p className="text-xs font-mono text-emerald-400 mt-0.5">
                    N° de Operación / Ref: {selectedReceipt.ref}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
              {selectedReceipt.url ? (
                selectedReceipt.url.startsWith('data:application/pdf') || selectedReceipt.url.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={selectedReceipt.url}
                    className="w-full h-[60vh] rounded-xl border border-slate-800"
                    title="Visualizador PDF Comprobante"
                  />
                ) : (
                  <img
                    src={selectedReceipt.url}
                    alt="Comprobante"
                    className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg border border-slate-800"
                  />
                )
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Este pago fue enviado solo con N° de Referencia/Operación.</p>
                  <p className="text-xs font-mono text-emerald-400 mt-1">{selectedReceipt.ref || 'Sin referencia'}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Cerrar Previsualización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

