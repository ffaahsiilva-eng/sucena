
import React, { useEffect, useState } from 'react';
import { Card, Button, Input, AITextArea } from './ui/Shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StorageService } from '../services/storageService';
import { DDSRecord, EquipmentInspectionRecord, LogRecord, OrderRecord, ReminderRecord, WorkPermitRecord, SiteInspectionRecord, ModuleType, MatrixRole, DDSScheduleRecord } from '../types';
import { TrendingUp, CheckCircle2, FileText, AlertTriangle, Megaphone, User, Users, Calendar, Image as ImageIcon, Siren, Truck, Newspaper, Check, X, Save, ShoppingBag, Clock, StickyNote, BellRing, ClipboardCheck, Hammer, ArrowRight, UserCheck } from 'lucide-react';
import { AuthService, User as UserType } from '../services/authService';

interface DashboardProps {
    onNavigate: (module: ModuleType, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState({
      compliance: 0,
      totalReports: 0,
      totalDeviations: 0,
      cleaningData: [] as any[],
      activityData: [] as any[],
      todaysDDS: null as DDSRecord | null,
      upcomingInspections: [] as EquipmentInspectionRecord[],
      recentDeliveries: [] as OrderRecord[], 
      urgentOrders: [] as OrderRecord[], 
      todaysReminders: [] as ReminderRecord[],
      // Novos alertas
      expiringPermits: [] as WorkPermitRecord[],
      upcomingSiteInspections: [] as SiteInspectionRecord[],
      // Matriz para alerta
      matrixData: [] as MatrixRole[],
      // DDS Amanhã
      tomorrowDDS: null as DDSScheduleRecord | null
  });

  const [inspectModal, setInspectModal] = useState<{
      isOpen: boolean;
      inspectionId: string | null;
      vehicleName: string;
      plate: string;
      action: 'APROVADO' | 'REPROVADO' | null;
  }>({ isOpen: false, inspectionId: null, vehicleName: '', plate: '', action: null });

  const [inspectForm, setInspectForm] = useState({
      newDate: '',
      comment: ''
  });

  const [daysLeftInMonth, setDaysLeftInMonth] = useState<number>(30);
  
  // Estado para usuários online
  const [onlineUsers, setOnlineUsers] = useState<{ user: UserType, isOnline: boolean }[]>([]);

  const COLORS = ['#0f172a', '#EAB308', '#64748b', '#94a3b8', '#cbd5e1'];

  const loadData = () => {
    // Carregar dados reais
    const data = StorageService.getDataForDashboard();
    const ddsRecords = StorageService.getDDS();
    const inspections = StorageService.getGeneric(StorageService.KEYS.EQUIPMENT_INSPECTION) as EquipmentInspectionRecord[];
    const orders = StorageService.getGeneric(StorageService.KEYS.STOCK) as OrderRecord[];
    const allReminders = StorageService.getReminders();
    
    // Novos Dados
    const permits = StorageService.getGeneric(StorageService.KEYS.WORK_PERMITS) as WorkPermitRecord[];
    const siteInspections = StorageService.getGeneric(StorageService.KEYS.SITE_INSPECTIONS) as SiteInspectionRecord[];
    const ddsSchedule = StorageService.getDDSSchedule();

    const now = new Date();
    const today = new Date();
    today.setHours(0,0,0,0); // Normalizar para cálculo de dias

    const currentUser = AuthService.getCurrentUser();
    
    // --- LÓGICA DE LEMBRETES DO DIA ---
    const todayStr = now.toISOString().split('T')[0];
    const todaysReminders = allReminders.filter(r => {
        if (r.date !== todayStr) return false;
        
        // Lógica de Visibilidade Igual ao Módulo de Lembretes
        // 1. Eu criei
        if (r.createdBy === currentUser?.username) return true;
        // 2. Todos
        if (r.visibility === 'ALL') return true;
        // 3. Cargos
        if (r.visibility === 'ROLES' && r.targetRoles?.includes(currentUser?.jobTitle || '')) return true;
        // 4. Usuário Específico (Legado e Novo)
        if ((r.visibility === 'USER' || !r.visibility) && r.mentionedUser === currentUser?.username) return true;

        return false;
    });

    // --- LÓGICA DE ALERTA: PERMISSÕES DE TRABALHO (5 DIAS) ---
    const expiringPermits = permits.filter(p => {
        if (p.status !== 'ACTIVE') return false;
        const expDate = new Date(p.expirationDate);
        expDate.setHours(0,0,0,0);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 5; // Vence entre hoje e 5 dias
    });

    // --- LÓGICA DE ALERTA: VISTORIAS DE CANTEIRO (5 DIAS) ---
    const upcomingSiteInspections = siteInspections.filter(i => {
        if (i.status !== 'PENDING') return false;
        const inspDate = new Date(i.inspectionDate);
        inspDate.setHours(0,0,0,0);
        const diffDays = Math.ceil((inspDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 5; // É entre hoje e 5 dias
    });

    // --- LÓGICA DE PEDIDOS (NOTÍCIAS) ---
    // 1. Entregas Recentes (Últimas 12 horas)
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const recentDeliveries = orders.filter(o => 
        o.status === 'ENTREGUE' && 
        o.updatedAt && 
        new Date(o.updatedAt) > twelveHoursAgo
    );

    // 2. Pedidos Urgentes Pendentes (Faltando <= 5 dias e status PENDENTE)
    const urgentOrders = orders.filter(o => {
        if (o.status !== 'PENDENTE') return false; // Se já foi solicitado, feito, entregue ou cancelado, sai do alerta
        const deadline = new Date(o.requiredDate);
        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 5;
    }).sort((a, b) => new Date(a.requiredDate).getTime() - new Date(b.requiredDate).getTime());

    // 0. Buscar DDS do Dia (Data atual YYYY-MM-DD)
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const todayKey = localDate.toISOString().split('T')[0];
    const todaysDDS = ddsRecords.find(r => r.date === todayKey) || null;

    // 0.1 Buscar Vistorias Vencendo (<= 2 dias)
    const upcoming = inspections.filter(i => {
        const iDate = new Date(i.nextInspectionDate);
        iDate.setHours(0,0,0,0);
        const diffTime = iDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 2; 
    });
    upcoming.sort((a, b) => new Date(a.nextInspectionDate).getTime() - new Date(b.nextInspectionDate).getTime());

    // --- LÓGICA DDS DE AMANHÃ (CORRIGIDA) ---
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // FIX: Construir chave YYYY-MM-DD usando data LOCAL para evitar que UTC avance o dia à noite
    const tYear = tomorrow.getFullYear();
    const tMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tDay = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowKey = `${tYear}-${tMonth}-${tDay}`;
    
    const tomorrowDDS = ddsSchedule.find(s => s.date === tomorrowKey) || null;

    // 1. Calculando Conformidade da Matriz
    let totalTasks = 0;
    let completedTasks = 0;
    data.matrix.forEach(role => {
        role.tasks.forEach(task => {
            totalTasks++;
            if (task.completed) completedTasks++;
        });
    });
    const compliance = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Cálculo de dias restantes no mês
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysLeft = Math.ceil((lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    setDaysLeftInMonth(daysLeft);

    // 2. Calculando Atividades vs Ocorrências (Semanal / Últimos 5 dias úteis)
    const chartData = [];
    for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dateKey = d.toISOString().split('T')[0];
        const reportsCount = data.reports.filter(r => r.date === dateKey).length;
        const devCount = data.deviations.filter(dev => dev.createdAt.startsWith(dateKey)).length;
        chartData.push({
            name: dayStr.charAt(0).toUpperCase() + dayStr.slice(1),
            reports: reportsCount,
            issues: devCount
        });
    }

    // 3. Distribuição de Limpeza por Setor (Geral)
    const cleaningMap: Record<string, number> = {};
    data.cleaning.forEach(c => {
        cleaningMap[c.area] = (cleaningMap[c.area] || 0) + 1;
    });
    const cleaningChartData = Object.keys(cleaningMap).map(area => ({
        name: area,
        value: cleaningMap[area]
    }));
    if (cleaningChartData.length === 0) {
        cleaningChartData.push({ name: 'Sem dados', value: 1 });
    }

    setMetrics({
        compliance,
        totalReports: data.reports.length,
        totalDeviations: data.deviations.length,
        cleaningData: cleaningChartData,
        activityData: chartData,
        todaysDDS,
        upcomingInspections: upcoming,
        recentDeliveries,
        urgentOrders,
        todaysReminders,
        expiringPermits,
        upcomingSiteInspections,
        matrixData: data.matrix,
        tomorrowDDS
    });

    // --- CARREGAR USUÁRIOS ONLINE ---
    const allUsers = AuthService.getUsers();
    const processedUsers = allUsers.map(u => {
        // Considera online se lastSeen for menor que 5 minutos atrás
        let isOnline = false;
        if (u.lastSeen) {
            const lastSeenTime = new Date(u.lastSeen).getTime();
            const timeDiff = now.getTime() - lastSeenTime;
            if (timeDiff < 5 * 60 * 1000) { // 5 minutos
                isOnline = true;
            }
        }
        // Se for o usuário atual, está online agora
        if (currentUser && u.username === currentUser.username) {
            isOnline = true;
        }
        return { user: u, isOnline };
    });

    // Ordenar: Online primeiro, depois por nome
    processedUsers.sort((a, b) => {
        if (a.isOnline === b.isOnline) return a.user.name.localeCompare(b.user.name);
        return a.isOnline ? -1 : 1;
    });

    setOnlineUsers(processedUsers);
  };

  useEffect(() => {
    loadData();
    // Atualiza a lista de online a cada 10 segundos
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const openActionModal = (insp: EquipmentInspectionRecord, action: 'APROVADO' | 'REPROVADO') => {
      setInspectModal({
          isOpen: true,
          inspectionId: insp.id,
          vehicleName: insp.vehicleName,
          plate: insp.plate,
          action
      });
      // Sugerir data: Hoje + 30 dias se aprovado, Hoje + 1 dia se reprovado
      const today = new Date();
      if (action === 'APROVADO') today.setDate(today.getDate() + 30);
      else today.setDate(today.getDate() + 1);
      
      setInspectForm({
          newDate: today.toISOString().split('T')[0],
          comment: ''
      });
  };

  const handleSaveAction = () => {
      if (!inspectModal.inspectionId || !inspectForm.newDate) return;

      const user = AuthService.getCurrentUser();
      
      // 1. Criar Log
      const log: LogRecord = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          category: 'VISTORIA',
          action: inspectModal.action || 'INFO',
          description: `Vistoria ${inspectModal.action} - ${inspectModal.vehicleName}`,
          details: `Placa: ${inspectModal.plate}. Obs: ${inspectForm.comment}`,
          createdBy: user?.username || 'Sistema',
          authorName: user?.name || 'Anônimo',
          authorRole: user?.jobTitle || 'N/A'
      };
      StorageService.addLog(log);

      // 2. Atualizar Data da Vistoria
      // Busca o item original
      const inspections = StorageService.getGeneric(StorageService.KEYS.EQUIPMENT_INSPECTION) as EquipmentInspectionRecord[];
      const original = inspections.find(i => i.id === inspectModal.inspectionId);
      
      if (original) {
          const updated: EquipmentInspectionRecord = {
              ...original,
              nextInspectionDate: inspectForm.newDate
          };
          StorageService.updateItem(StorageService.KEYS.EQUIPMENT_INSPECTION, updated);
      }

      // 3. Resetar e Recarregar
      setInspectModal({ isOpen: false, inspectionId: null, vehicleName: '', plate: '', action: null });
      loadData();
      alert(`Vistoria registrada com sucesso!`);
  };

  const currentUser = AuthService.getCurrentUser();

  // Filtrar cargos com matriz incompleta para o alerta
  const incompleteRoles = metrics.matrixData.filter(role => {
      const completed = role.tasks.filter(t => t.completed).length;
      return completed < role.tasks.length;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      <div className="flex items-center gap-2 mb-2">
           <Newspaper className="text-slate-700" size={24} />
           <h2 className="text-2xl font-bold text-slate-800">Painel de Notícias & Indicadores</h2>
      </div>

      {/* --- NOTÍCIA DE ESCALA DDS (NOVO) --- */}
      {metrics.tomorrowDDS && metrics.tomorrowDDS.speakerName && (
          <div className="w-full bg-purple-600 rounded-xl p-4 shadow-md mb-4 text-white animate-in slide-in-from-top-2 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full">
                      <Megaphone size={28} className="animate-pulse text-yellow-300" />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg uppercase tracking-wide text-purple-100 mb-1">
                          DDS de Amanhã <span className="text-xs opacity-70 ml-1">({new Date(metrics.tomorrowDDS.date + 'T12:00:00').toLocaleDateString('pt-BR')})</span>
                      </h3>
                      <p className="text-xl font-bold text-white flex items-center gap-2">
                          <User size={20}/> {metrics.tomorrowDDS.speakerName}
                      </p>
                      {metrics.tomorrowDDS.theme && (
                          <p className="text-sm text-purple-200 mt-1">Tema: <span className="font-semibold text-white">{metrics.tomorrowDDS.theme}</span></p>
                      )}
                  </div>
              </div>
              <button 
                  onClick={() => onNavigate(ModuleType.DDS_SCHEDULE)}
                  className="bg-white text-purple-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-50 transition-colors shadow-sm whitespace-nowrap"
              >
                  Ver Escala Completa
              </button>
          </div>
      )}

      {/* --- ALERTA DE FECHAMENTO DE MATRIZ (7 DIAS) --- */}
      {daysLeftInMonth <= 7 && incompleteRoles.length > 0 && (
          <div className="w-full bg-indigo-50 border border-indigo-200 rounded-xl p-4 shadow-sm mb-4 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3">
                  <Clock className="text-indigo-600 animate-pulse" />
                  <h3 className="text-indigo-900 font-bold text-lg">Fechamento Mensal da Matriz</h3>
              </div>
              <p className="text-sm text-indigo-700 mb-3">
                  Faltam apenas <span className="font-bold">{daysLeftInMonth} dias</span> para o reset da matriz. 
                  Os seguintes cargos ainda possuem pendências:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {incompleteRoles.map(role => {
                      const completed = role.tasks.filter(t => t.completed).length;
                      const total = role.tasks.length;
                      const percent = Math.round((completed / total) * 100);
                      
                      return (
                          <div 
                            key={role.id} 
                            className="bg-white p-2 rounded border border-indigo-100 flex items-center justify-between cursor-pointer hover:bg-indigo-50 transition-colors"
                            onClick={() => onNavigate(ModuleType.MATRIZ)}
                          >
                              <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                  <ArrowRight size={12} className="text-indigo-400"/> {role.title}
                              </span>
                              <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                  {percent}% Completo
                              </span>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* --- SEÇÃO DE ALERTAS CRÍTICOS (PTs & Vistorias) --- */}
      {(metrics.expiringPermits.length > 0 || metrics.upcomingSiteInspections.length > 0) && (
          <div className="w-full bg-orange-100 border border-orange-300 rounded-xl p-4 shadow-sm mb-4 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-orange-600 animate-pulse" />
                  <h3 className="text-orange-900 font-bold text-lg">Alertas de Vencimento e Vistorias</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  
                  {/* PTs Vencendo */}
                  {metrics.expiringPermits.map(pt => {
                      const daysLeft = Math.ceil((new Date(pt.expirationDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                      return (
                          <div 
                            key={pt.id} 
                            className="bg-white p-3 rounded-lg border-l-4 border-l-orange-500 border shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => onNavigate(ModuleType.WORK_PERMITS, { category: pt.category })}
                          >
                              <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                                      <Hammer size={12}/> PT - {pt.category}
                                  </span>
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-bold">Vence em {daysLeft} dias</span>
                              </div>
                              <p className="font-bold text-slate-800">{pt.location}</p>
                              <p className="text-xs text-slate-500 truncate">{pt.description}</p>
                          </div>
                      );
                  })}

                  {/* Vistorias de Canteiro Chegando */}
                  {metrics.upcomingSiteInspections.map(insp => {
                      const daysLeft = Math.ceil((new Date(insp.inspectionDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                      return (
                          <div 
                            key={insp.id} 
                            className="bg-white p-3 rounded-lg border-l-4 border-l-purple-500 border shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => onNavigate(ModuleType.SITE_INSPECTION)}
                          >
                              <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
                                      <ClipboardCheck size={12}/> Vistoria de Canteiro
                                  </span>
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                                      {daysLeft === 0 ? 'HOJE' : `Em ${daysLeft} dias`}
                                  </span>
                              </div>
                              <p className="font-bold text-slate-800">{insp.location}</p>
                              <p className="text-xs text-slate-500">Agendada para {new Date(insp.inspectionDate).toLocaleDateString('pt-BR')}</p>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* --- SEÇÃO DE LEMBRETES DO DIA (NOVO) --- */}
      {metrics.todaysReminders.length > 0 && (
          <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm mb-4 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3">
                  <BellRing className="text-yellow-600 animate-pulse" />
                  <h3 className="text-yellow-800 font-bold text-lg">Lembretes para Hoje</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {metrics.todaysReminders.map(rem => {
                      const amIMentioned = rem.mentionedUser === currentUser?.username;
                      const isPublic = rem.visibility === 'ALL';
                      const isRole = rem.visibility === 'ROLES';

                      return (
                          <div 
                            key={rem.id} 
                            className={`bg-white p-3 rounded-lg border shadow-sm cursor-pointer hover:bg-slate-50 transition-colors ${amIMentioned ? 'border-blue-300 ring-1 ring-blue-300' : 'border-yellow-100'}`}
                            onClick={() => onNavigate(ModuleType.REMINDERS)}
                          >
                              <div className="flex items-start gap-3">
                                   <div className={`p-2 rounded-full shrink-0 ${amIMentioned ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                       <StickyNote size={18} />
                                   </div>
                                   <div>
                                       <div className="flex justify-between items-start gap-2">
                                            <p className="font-bold text-slate-800 leading-tight">{rem.title}</p>
                                            <div className="flex flex-col items-end gap-1">
                                                {amIMentioned && (
                                                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-bold whitespace-nowrap">
                                                        De: {rem.authorName}
                                                    </span>
                                                )}
                                                {isPublic && (
                                                    <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 rounded font-bold whitespace-nowrap">
                                                        Geral
                                                    </span>
                                                )}
                                                {isRole && (
                                                    <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 rounded font-bold whitespace-nowrap">
                                                        Cargo
                                                    </span>
                                                )}
                                            </div>
                                       </div>
                                       <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{rem.description}</p>
                                   </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* --- SEÇÃO DE NOTÍCIAS DE PEDIDOS (NOVO) --- */}
      
      {/* Entregas Recentes (Últimas 12h) */}
      {metrics.recentDeliveries.length > 0 && (
          <div className="w-full bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm mb-4 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="text-green-600" />
                  <h3 className="text-green-800 font-bold text-lg">Materiais Entregues (Últimas 12h)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {metrics.recentDeliveries.map(order => (
                      <div 
                        key={order.id} 
                        className="bg-white p-3 rounded-lg border border-green-100 flex items-center justify-between shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => onNavigate(ModuleType.STOCK, { tab: 'requests' })} // Vai para 'Meus Pedidos'
                      >
                          <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-full text-green-700">
                                   <ShoppingBag size={18} />
                               </div>
                               <div>
                                   <p className="font-bold text-slate-800 leading-none">{order.materialName}</p>
                                   <p className="text-xs text-slate-500 mt-1">{order.quantity} {order.unit}</p>
                               </div>
                          </div>
                          <div className="text-right">
                               <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">ENTREGUE</span>
                               <p className="text-[10px] text-slate-400 mt-1">{new Date(order.updatedAt || '').toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Alerta de Pedidos Pendentes Próximos do Prazo */}
      {metrics.urgentOrders.length > 0 && (
          <div className="w-full bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-3">
                  <Clock className="text-orange-600 animate-pulse" />
                  <h3 className="text-orange-800 font-bold text-lg">Atenção: Solicitações Pendentes (Prazo Curto)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {metrics.urgentOrders.map(order => {
                      const deadline = new Date(order.requiredDate);
                      const now = new Date();
                      const diffTime = deadline.getTime() - now.getTime();
                      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const isLate = daysLeft < 0;

                      return (
                          <div 
                            key={order.id} 
                            className="bg-white p-3 rounded-lg border border-orange-100 flex flex-col justify-between shadow-sm gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => onNavigate(ModuleType.STOCK, { tab: 'management' })}
                          >
                              <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-orange-100 rounded-full text-orange-700">
                                          <AlertTriangle size={18} />
                                      </div>
                                      <div>
                                          <p className="font-bold text-slate-800 leading-none">{order.materialName}</p>
                                          <p className="text-xs text-slate-500 mt-1">Solicitante: {order.authorName}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLate ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                          {isLate ? 'ATRASADO' : `${daysLeft} dias`}
                                      </span>
                                  </div>
                              </div>
                              <p className="text-xs text-slate-500 bg-slate-50 p-1 rounded">
                                  Ainda não marcado como "Solicitado" pelo Aux. Adm.
                              </p>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}


      {/* ALERTA DE VISTORIAS DE EQUIPAMENTOS (SÓ APARECE SE TIVER PENDÊNCIA) */}
      {metrics.upcomingInspections.length > 0 && (
          <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                  <Siren className="text-red-600 animate-bounce" />
                  <h3 className="text-red-800 font-bold text-lg">Atenção: Vistorias de Equipamentos Pendentes</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {metrics.upcomingInspections.map(insp => {
                      const days = Math.ceil((new Date(insp.nextInspectionDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                      const isLate = days < 0;
                      return (
                          <div 
                            key={insp.id} 
                            className="bg-white p-3 rounded-lg border border-red-100 flex flex-col justify-between shadow-sm gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => onNavigate(ModuleType.EQUIPMENT_INSPECTION)}
                          >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Truck className="text-slate-400" size={20} />
                                    <div>
                                        <p className="font-bold text-slate-800 leading-none">{insp.vehicleName}</p>
                                        <p className="font-mono text-xs text-slate-500 mt-1">{insp.plate}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold text-sm ${isLate ? 'text-red-600' : 'text-orange-500'}`}>
                                        {new Date(insp.nextInspectionDate).toLocaleDateString('pt-BR')}
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium uppercase">
                                        {isLate ? `Atrasado ${Math.abs(days)} dia(s)` : (days === 0 ? 'Vence Hoje' : `Vence em ${days} dias`)}
                                    </p>
                                </div>
                              </div>
                              
                              <div className="flex gap-2 border-t pt-2 border-slate-100" onClick={(e) => e.stopPropagation()}>
                                  <button 
                                     onClick={() => openActionModal(insp, 'APROVADO')}
                                     className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                  >
                                      <Check size={14} /> Aprovar
                                  </button>
                                  <button 
                                     onClick={() => openActionModal(insp, 'REPROVADO')}
                                     className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                  >
                                      <X size={14} /> Reprovar
                                  </button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* DDS DO DIA - FEED PRINCIPAL */}
      <div className="w-full mt-6">
         <div className="flex items-center gap-2 mb-2">
            <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Destaque do Dia</span>
            <span className="text-slate-400 text-sm flex items-center gap-1">
                <Calendar size={14} /> {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
         </div>
         
         <Card className={`border-l-4 ${metrics.todaysDDS ? 'border-l-green-500' : 'border-l-slate-300'} shadow-md`}>
            {metrics.todaysDDS ? (
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Conteúdo do DDS */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                                    <Megaphone className="inline-block mr-2 text-green-600 mb-1" size={24}/>
                                    {metrics.todaysDDS.theme}
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">Diálogo Diário de Segurança realizado.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Palestrante</p>
                                    <p className="font-semibold text-slate-800">{metrics.todaysDDS.speaker}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-full">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Presença</p>
                                    <p className="font-semibold text-slate-800">
                                        {metrics.todaysDDS.employeesCount} Colaboradores
                                        {metrics.todaysDDS.visitorsCount > 0 && <span className="text-slate-400 text-xs ml-1">(+ {metrics.todaysDDS.visitorsCount} visit.)</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview da Foto (Se houver) */}
                    {metrics.todaysDDS.photoUrls && metrics.todaysDDS.photoUrls.length > 0 && (
                        <div className="md:w-1/3 shrink-0">
                            <div 
                                className="relative h-40 w-full rounded-lg overflow-hidden border border-slate-200 group cursor-pointer"
                                onClick={() => onNavigate(ModuleType.DDS)}
                            >
                                <img 
                                    src={metrics.todaysDDS.photoUrls[0]} 
                                    alt="DDS Registro" 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute bottom-0 left-0 w-full bg-black/60 p-2 text-white text-xs flex items-center gap-1 backdrop-blur-sm">
                                    <ImageIcon size={12} />
                                    {metrics.todaysDDS.photoUrls.length} foto(s) registrada(s)
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div 
                    className="flex flex-col items-center justify-center py-8 text-center cursor-pointer hover:bg-slate-50 transition-colors rounded-lg"
                    onClick={() => onNavigate(ModuleType.DDS)}
                >
                    <div className="bg-slate-100 p-4 rounded-full mb-3">
                        <Megaphone className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">DDS de hoje pendente</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-4">
                        O Diálogo Diário de Segurança ainda não foi registrado no sistema hoje.
                    </p>
                    <div className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                        Clique para registrar
                    </div>
                </div>
            )}
         </Card>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Matriz Gauge */}
        <Card className="flex flex-col justify-center items-center bg-white border-l-4 border-l-yellow-500 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate(ModuleType.MATRIZ)}>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 z-10">Matriz de Resp.</span>
            <div className="relative flex items-center justify-center z-10">
                 <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="36" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                    <circle cx="48" cy="48" r="36" stroke="#EAB308" strokeWidth="8" fill="transparent" strokeDasharray={`${metrics.compliance * 2.26} 226`}  />
                 </svg>
                 <span className="absolute text-2xl font-bold text-slate-800">{metrics.compliance}%</span>
            </div>
            <span className="text-xs text-slate-400 mt-2 z-10">Mês Atual</span>
        </Card>

        {/* Total Relatórios */}
        <Card className="flex flex-col justify-between border-l-4 border-l-slate-800 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate(ModuleType.GENERAL_REPORTS)}>
             <div className="flex items-start justify-between">
                <div>
                   <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Relatórios Gerais</span>
                   <h3 className="text-3xl font-bold text-slate-800 mt-2">{metrics.totalReports}</h3>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                   <FileText size={24} />
                </div>
             </div>
             <div className="mt-4 text-xs text-slate-400">
                Total de registros operacionais
             </div>
        </Card>

        {/* Total Desvios */}
        <Card className="flex flex-col justify-between border-l-4 border-l-red-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate(ModuleType.DEVIATIONS)}>
             <div className="flex items-start justify-between">
                <div>
                   <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Desvios Registrados</span>
                   <h3 className="text-3xl font-bold text-red-600 mt-2">{metrics.totalDeviations}</h3>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-red-600">
                   <AlertTriangle size={24} />
                </div>
             </div>
             <div className="mt-4 text-xs text-slate-400">
                Total de ocorrências registradas
             </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="text-blue-600" size={20} />
                  Atividades vs. Ocorrências
              </h3>
              <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-500">Últimos 5 dias</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="reports" fill="#3b82f6" name="Relatórios" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="issues" fill="#ef4444" name="Desvios" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="text-green-600" size={20} />
                  Limpeza por Setor
              </h3>
              <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-500">Geral</span>
          </div>
          <div className="h-64 flex flex-col md:flex-row items-center">
            <div className="h-full w-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={metrics.cleaningData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {metrics.cleaningData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-1/2 justify-center md:justify-start pl-4">
                {metrics.cleaningData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm text-slate-600 min-w-[120px]">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length]}}></div>
                        <span className="font-medium">{entry.name}:</span> {entry.value}
                    </div>
                ))}
            </div>
          </div>
        </Card>
      </div>

      {/* --- SEÇÃO DE USUÁRIOS ONLINE --- */}
      <div className="w-full mt-2">
          <Card className="bg-slate-900 border-slate-800 text-white">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                  <UserCheck size={20} className="text-green-400" />
                  <h3 className="text-lg font-bold">Equipe Online</h3>
                  <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      Atividade Recente (5 min)
                  </span>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                  {onlineUsers.map(({ user, isOnline }) => (
                      <div key={user.id} className="flex flex-col items-center min-w-[80px] group">
                          <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 overflow-hidden transition-all ${isOnline ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-slate-700 opacity-50 grayscale'}`}>
                              {user.photoUrl ? (
                                  <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                  <span className="text-slate-300">{user.name.substring(0, 2).toUpperCase()}</span>
                              )}
                              {isOnline && (
                                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
                              )}
                          </div>
                          <span className={`text-[10px] mt-2 font-medium text-center truncate w-full px-1 ${isOnline ? 'text-white' : 'text-slate-500'}`}>
                              {user.name.split(' ')[0]}
                          </span>
                          <span className="text-[8px] text-slate-500 truncate w-full text-center">
                              {user.jobTitle}
                          </span>
                      </div>
                  ))}
                  {onlineUsers.length === 0 && (
                      <div className="text-sm text-slate-500 py-2 w-full text-center">
                          Nenhum usuário online no momento.
                      </div>
                  )}
              </div>
          </Card>
      </div>

      {/* Modal de Ação de Vistoria (Equipamentos) */}
      {inspectModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className={`font-bold text-lg flex items-center gap-2 ${inspectModal.action === 'APROVADO' ? 'text-green-700' : 'text-red-700'}`}>
                          {inspectModal.action === 'APROVADO' ? <CheckCircle2 /> : <AlertTriangle />}
                          Confirmar {inspectModal.action}
                      </h3>
                      <button onClick={() => setInspectModal(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-red-500">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded mb-4 text-sm text-slate-600">
                      <p><span className="font-bold">Veículo:</span> {inspectModal.vehicleName}</p>
                      <p><span className="font-bold">Placa:</span> {inspectModal.plate}</p>
                  </div>

                  <div className="space-y-4">
                      <Input 
                          label="Próxima Vistoria (Nova Data)" 
                          type="date"
                          value={inspectForm.newDate}
                          onChange={e => setInspectForm(prev => ({ ...prev, newDate: e.target.value }))}
                          required
                      />
                      <AITextArea 
                          label="Observações / Comentários"
                          value={inspectForm.comment}
                          onChange={e => setInspectForm(prev => ({ ...prev, comment: e.target.value }))}
                          placeholder={inspectModal.action === 'REPROVADO' ? "Motivo da reprovação..." : "Comentários opcionais..."}
                      />
                  </div>

                  <div className="flex gap-2 mt-6">
                      <Button variant="secondary" onClick={() => setInspectModal(prev => ({ ...prev, isOpen: false }))} className="flex-1">
                          Cancelar
                      </Button>
                      <Button onClick={handleSaveAction} className="flex-1">
                          <Save size={18} /> Salvar & Atualizar
                      </Button>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};
