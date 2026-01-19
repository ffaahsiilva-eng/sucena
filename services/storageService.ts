
import { GeneralReport, DeviationRecord, CleaningRecord, MatrixRole, DDSRecord, LogRecord, Notification, BaseRecord, OrderRecord, ReminderRecord, Announcement, AttendanceRecord, AppConfig, DDSScheduleRecord } from '../types';

const KEYS = {
  REPORTS: 'painelSucena_reports',
  DEVIATIONS: 'painelSucena_deviations',
  CLEANING: 'painelSucena_cleaning',
  MATRIX: 'painelSucena_matrix',
  LAST_RESET: 'painelSucena_last_month_reset',
  DDS: 'painelSucena_dds',
  DDS_SCHEDULE: 'painelSucena_dds_schedule', // Nova chave
  // EVIDENCE: Removed from types but keeping key if needed for legacy data cleanup manually
  EVIDENCE: 'painelSucena_evidence', 
  SAFETY: 'painelSucena_safety',
  STOCK: 'painelSucena_stock',
  VEHICLE: 'painelSucena_vehicle',
  INSPECTION: 'painelSucena_inspection',
  EQUIPMENT_INSPECTION: 'painelSucena_equipment_inspections',
  LOGS: 'painelSucena_logs',
  NOTIFICATIONS: 'painelSucena_notifications',
  REMINDERS: 'painelSucena_reminders',
  JOB_TITLES: 'painelSucena_job_titles',
  ANNOUNCEMENT: 'painelSucena_global_announcement',
  RESIDUES_ATTENDANCE: 'painelSucena_residues_attendance',
  RESIDUES_TEAM: 'painelSucena_residues_team_roster', // Nova Chave para persistir nomes
  OPERATIONAL_ROLES: 'painelSucena_operational_roles', // Nova Chave para Funções Operacionais
  WORK_PERMITS: 'painelSucena_work_permits', // Nova Chave: PTs
  SITE_INSPECTIONS: 'painelSucena_site_inspections', // Nova Chave: Vistorias Canteiro
  APP_CONFIG: 'painelSucena_app_config' // Nova Chave: Configurações Visuais
};

const DEFAULT_JOB_TITLES = [
    'Encarregado Geral',
    'Encarregado',
    'Engenheiro',
    'Preposto',
    'Técnico Meio Ambiente',
    'Técnico de Segurança',
    'Planejador (a)',
    'Aux. Administrativo',
    'Outros'
];

// Funções padrão que já existem nos formulários (não precisamos duplicar)
const DEFAULT_OPERATIONAL_ROLES = [
    'Jardineiro', 
    'Ajudante', 
    'Motorista do Pipa', // Mapeado para Motorista Pipa
    'Motorista do Munck', // Mapeado para Motorista Munck
    'Sinaleiro', 
    'Mecânico montador', // Mapeado para Mecânico
    'Auxiliar de elétrica' // Mapeado para Aux. Elétrica
];

// Dados Iniciais da Matriz
const INITIAL_MATRIX: MatrixRole[] = [
    {
        id: 'preposto',
        title: 'Preposto',
        iconName: 'Briefcase',
        color: 'bg-blue-600',
        tasks: [
            { id: 'p1', description: 'DDS De liderança', completed: false },
            { id: 'p2', description: 'Woc', completed: false },
            { id: 'p3', description: 'Observação de tarefas', completed: false },
            { id: 'p4', description: 'Inspeção em HSE', completed: false },
            { id: 'p5', description: 'Roda de conversa', completed: false },
        ]
    },
    {
        id: 'enc_geral',
        title: 'Encarregado Geral',
        iconName: 'UserCog',
        color: 'bg-indigo-600',
        tasks: [
            { id: 'eg_hse_1', description: 'Evento sem lesão / Condição de risco', completed: false },
            { id: 'eg_hse_2', description: 'Observação de Tarefa', completed: false },
            { id: 'eg_hse_3', description: 'Inspeção de HSE', completed: false },
        ]
    },
    {
        id: 'encarregado',
        title: 'Encarregado',
        iconName: 'HardHat',
        color: 'bg-amber-600',
        tasks: [
            { id: 'enc_hse_1', description: 'Evento sem lesão / Condição de risco', completed: false },
            { id: 'enc_hse_2', description: 'Observação de Tarefa', completed: false },
            { id: 'enc_hse_3', description: 'Inspeção de HSE', completed: false },
        ]
    },
    // DUPLICADO: Encarregado (Verde)
    {
        id: 'encarregado_verde',
        title: 'Encarregado',
        iconName: 'HardHat',
        color: 'bg-green-600',
        tasks: [
            { id: 'enc_green_hse_1', description: 'Evento sem lesão / Condição de risco', completed: false },
            { id: 'enc_green_hse_2', description: 'Observação de Tarefa', completed: false },
            { id: 'enc_green_hse_3', description: 'Inspeção de HSE', completed: false },
        ]
    },
    {
        id: 'tec_seguranca',
        title: 'Téc. Segurança',
        iconName: 'Shield',
        color: 'bg-red-600',
        tasks: [
            { id: 'ts1', description: 'DDS da Liderança', completed: false },
            { id: 'ts2', description: 'WOC - Caminhar, Observar e Conversar', completed: false },
            { id: 'ts3', description: 'Inspeção de HSE', completed: false },
            { id: 'ts4', description: 'Evento sem lesão / Condição de risco (ALTO RISCO)', completed: false },
            { id: 'ts5', description: 'Coach em HSE', completed: false },
            { id: 'ts6', description: 'Observação de Tarefa', completed: false },
        ]
    },
];

// Helper para criar Log Interno
const createLogEntry = (
    category: LogRecord['category'], 
    description: string, 
    details: string,
    user?: { username: string, name: string, jobTitle: string }
) => {
    const log: LogRecord = {
        id: Date.now().toString() + Math.random(),
        createdAt: new Date().toISOString(),
        category,
        action: 'CRIACAO',
        description,
        details,
        createdBy: user?.username || 'Sistema',
        authorName: user?.name || 'Sistema',
        authorRole: user?.jobTitle || 'Automático'
    };
    StorageService.addLog(log);
};

export const StorageService = {
  KEYS, 

  save: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
  get: (key: string) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  
  deleteItem: (key: string, id: string) => {
      const currentData = StorageService.get(key);
      if (Array.isArray(currentData)) {
          const itemToDelete = currentData.find((item: any) => item.id === id);
          if (itemToDelete) {
             createLogEntry('SISTEMA', 'Exclusão de Registro', `Item ID: ${id} removido da chave ${key}.`);
          }
          const newData = currentData.filter((item: any) => item.id !== id);
          StorageService.save(key, newData);
          return newData;
      }
      return currentData || [];
  },

  updateItem: (key: string, item: any) => {
      const currentData = StorageService.get(key);
      if (Array.isArray(currentData)) {
          const index = currentData.findIndex((i: any) => i.id === item.id);
          if (index !== -1) {
              currentData[index] = item;
              StorageService.save(key, currentData);
              // Log Update
              createLogEntry('SISTEMA', 'Atualização de Registro', `Item ID: ${item.id} atualizado em ${key}.`, { 
                  username: item.createdBy, name: item.authorName, jobTitle: item.authorRole 
              });
          }
      }
  },

  // === APP CONFIGURATION (Personalização) ===
  getAppConfig: (): AppConfig | null => {
      return StorageService.get(KEYS.APP_CONFIG);
  },
  saveAppConfig: (config: AppConfig) => {
      StorageService.save(KEYS.APP_CONFIG, config);
      createLogEntry('SISTEMA', 'Alteração de Layout', 'Configurações visuais ou de menu atualizadas.');
      // Dispara evento para atualização em tempo real
      window.dispatchEvent(new Event('app-config-update'));
  },

  // === ANNOUNCEMENTS ===
  getAnnouncement: (): Announcement | null => {
      return StorageService.get(KEYS.ANNOUNCEMENT);
  },
  saveAnnouncement: (announcement: Announcement) => {
      StorageService.save(KEYS.ANNOUNCEMENT, announcement);
      
      // DISPARAR EVENTO PARA A ABA ATUAL (Admin)
      window.dispatchEvent(new Event('local-storage-announcement-update'));
      
      createLogEntry('SISTEMA', 'Comunicado Geral', `Título: ${announcement.title}`, { 
          username: announcement.createdBy, name: 'Admin', jobTitle: 'Administrador' 
      });
  },
  clearAnnouncement: () => {
      localStorage.removeItem(KEYS.ANNOUNCEMENT);
      // DISPARAR EVENTO PARA A ABA ATUAL (Admin)
      window.dispatchEvent(new Event('local-storage-announcement-update'));
  },

  // === DDS SCHEDULE ===
  getDDSSchedule: (): DDSScheduleRecord[] => {
      return StorageService.get(KEYS.DDS_SCHEDULE) || [];
  },
  saveDDSSchedule: (schedule: DDSScheduleRecord[]) => {
      StorageService.save(KEYS.DDS_SCHEDULE, schedule);
      createLogEntry('ESCALA_DDS', 'Escala DDS Atualizada', 'A escala mensal de palestrantes foi atualizada.');
  },

  // === JOB TITLES (Cargos Administrativos do Sistema) ===
  getJobTitles: (): string[] => {
      const stored = StorageService.get(KEYS.JOB_TITLES);
      return stored || DEFAULT_JOB_TITLES;
  },
  addJobTitle: (title: string) => {
      const current = StorageService.getJobTitles();
      if (!current.includes(title)) {
          const updated = [...current, title];
          StorageService.save(KEYS.JOB_TITLES, updated);
      }
  },
  removeJobTitle: (title: string) => {
      const current = StorageService.getJobTitles();
      const updated = current.filter(t => t !== title);
      StorageService.save(KEYS.JOB_TITLES, updated);
  },

  // === OPERATIONAL ROLES (Funções de Campo / Efetivo) ===
  getOperationalRoles: (): string[] => {
      const stored = StorageService.get(KEYS.OPERATIONAL_ROLES);
      if (!stored) {
          StorageService.save(KEYS.OPERATIONAL_ROLES, DEFAULT_OPERATIONAL_ROLES);
          return DEFAULT_OPERATIONAL_ROLES;
      }
      return stored;
  },
  addOperationalRole: (role: string) => {
      const current = StorageService.getOperationalRoles();
      // Normaliza para comparação (ignora case) mas salva o formato original
      const exists = current.some((r: string) => r.toLowerCase() === role.toLowerCase());
      if (!exists) {
          const updated = [...current, role];
          StorageService.save(KEYS.OPERATIONAL_ROLES, updated);
      }
  },

  // === LOGS ===
  getLogs: (): LogRecord[] => {
      const logs = StorageService.get(KEYS.LOGS) || [];
      // Ordenar logs: mais recentes primeiro
      return logs.sort((a: LogRecord, b: LogRecord) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  addLog: (log: LogRecord) => {
      const current = StorageService.get(KEYS.LOGS) || [];
      StorageService.save(KEYS.LOGS, [log, ...current]);
  },

  // === NOTIFICATIONS ===
  getNotifications: (username: string): Notification[] => {
      const all = StorageService.get(KEYS.NOTIFICATIONS) || [];
      return all.filter((n: Notification) => n.userId === username).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  addNotification: (notification: Notification) => {
      const current = StorageService.get(KEYS.NOTIFICATIONS) || [];
      StorageService.save(KEYS.NOTIFICATIONS, [notification, ...current]);
  },
  markNotificationAsRead: (id: string) => {
      const all = StorageService.get(KEYS.NOTIFICATIONS) || [];
      const updated = all.map((n: Notification) => n.id === id ? { ...n, read: true } : n);
      StorageService.save(KEYS.NOTIFICATIONS, updated);
  },

  // === MODULES (With Auto Logging) ===

  getReports: (): GeneralReport[] => StorageService.get(KEYS.REPORTS) || [],
  addReport: (report: GeneralReport) => {
    const current = StorageService.getReports();
    StorageService.save(KEYS.REPORTS, [report, ...current]);
    createLogEntry('RELATORIO', 'Novo Relatório Geral', `Local: ${report.location}, Data: ${report.date}`, { username: report.createdBy!, name: report.authorName!, jobTitle: report.authorRole! });
  },

  getDeviations: (): DeviationRecord[] => StorageService.get(KEYS.DEVIATIONS) || [],
  addDeviation: (deviation: DeviationRecord) => {
    const current = StorageService.getDeviations();
    StorageService.save(KEYS.DEVIATIONS, [deviation, ...current]);
    createLogEntry('DESVIO', 'Novo Desvio Registrado', `Tipo: ${deviation.type}`, { username: deviation.createdBy!, name: deviation.authorName!, jobTitle: deviation.authorRole! });
  },

  getCleaning: (): CleaningRecord[] => StorageService.get(KEYS.CLEANING) || [],
  addCleaning: (cleaning: CleaningRecord) => {
    const current = StorageService.getCleaning();
    StorageService.save(KEYS.CLEANING, [cleaning, ...current]);
    createLogEntry('LIMPEZA', 'Registro de Limpeza', `Área: ${cleaning.area}`, { username: cleaning.createdBy!, name: cleaning.authorName!, jobTitle: cleaning.authorRole! });
  },

  getDDS: (): DDSRecord[] => StorageService.get(KEYS.DDS) || [],
  addDDS: (dds: DDSRecord) => {
    const current = StorageService.getDDS();
    StorageService.save(KEYS.DDS, [dds, ...current]);
    createLogEntry('DDS', 'DDS Realizado', `Tema: ${dds.theme}`, { username: dds.createdBy!, name: dds.authorName!, jobTitle: dds.authorRole! });
  },

  // === ATTENDANCE ===
  getAttendance: (): AttendanceRecord[] => StorageService.get(KEYS.RESIDUES_ATTENDANCE) || [],
  addAttendance: (record: AttendanceRecord) => {
      const current = StorageService.getAttendance();
      StorageService.save(KEYS.RESIDUES_ATTENDANCE, [record, ...current]);
      createLogEntry('PRESENCA', 'Lista de Presença', `Data: ${new Date(record.date).toLocaleDateString()}`, { 
          username: record.createdBy!, name: record.authorName!, jobTitle: record.authorRole! 
      });
  },

  // === REMINDERS ===
  getReminders: (): ReminderRecord[] => StorageService.get(KEYS.REMINDERS) || [],
  addReminder: (reminder: ReminderRecord) => {
      const current = StorageService.getReminders();
      StorageService.save(KEYS.REMINDERS, [reminder, ...current]);
  },

  getGeneric: (key: string): any[] => StorageService.get(key) || [],
  addGeneric: (key: string, item: any) => {
      const current = StorageService.getGeneric(key);
      StorageService.save(key, [item, ...current]);

      // Lógica para categorizar o Log genérico
      let category: LogRecord['category'] = 'OUTROS';
      let desc = 'Novo Registro';
      
      if (key === KEYS.EVIDENCE) { category = 'EVIDENCIA'; desc = `Evidência: ${item.activity}`; }
      else if (key === KEYS.SAFETY) { category = 'SEGURANCA'; desc = `Segurança: ${item.type} (${item.riskLevel})`; }
      else if (key === KEYS.STOCK) { category = 'PEDIDOS'; desc = `Novo Pedido: ${(item as OrderRecord).materialName}`; }
      else if (key === KEYS.INSPECTION) { category = 'VISTORIA'; desc = `Nova Vistoria: ${item.task}`; }
      else if (key === KEYS.EQUIPMENT_INSPECTION) { category = 'VISTORIA'; desc = `Vistoria Equipamento: ${item.vehicleName}`; }
      else if (key === KEYS.WORK_PERMITS) { category = 'PT'; desc = `Nova PT: ${item.category}`; }
      else if (key === KEYS.SITE_INSPECTIONS) { category = 'CANTEIRO'; desc = `Nova Vistoria Canteiro`; }

      createLogEntry(category, desc, `ID: ${item.id}`, { username: item.createdBy, name: item.authorName, jobTitle: item.authorRole });
  },

  getMatrix: (): MatrixRole[] => {
    const stored = StorageService.get(KEYS.MATRIX);
    const lastReset = localStorage.getItem(KEYS.LAST_RESET);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const resetKey = `${currentMonth}-${currentYear}`;

    if (lastReset !== resetKey) {
        // 1. Reset da Matriz
        const matrixToReset = stored || INITIAL_MATRIX;
        const resetMatrix = matrixToReset.map((role: MatrixRole) => ({
            ...role,
            tasks: role.tasks.map(task => ({ ...task, completed: false }))
        }));
        
        // 2. Limpeza Automática dos Logs (Novo mês)
        StorageService.save(KEYS.LOGS, []);

        localStorage.setItem(KEYS.LAST_RESET, resetKey);
        StorageService.save(KEYS.MATRIX, resetMatrix);

        // 3. Criação de Logs de Sistema informando o reset
        createLogEntry('SISTEMA', 'Limpeza Mensal Automática', `Todos os logs do mês anterior foram excluídos. Início do ciclo: ${resetKey}`);
        createLogEntry('SISTEMA', 'Reset Mensal da Matriz', `Matriz resetada para ${resetKey}`);
        
        return resetMatrix;
    }

    return stored || INITIAL_MATRIX;
  },
  
  saveMatrix: (matrix: MatrixRole[]) => {
      StorageService.save(KEYS.MATRIX, matrix);
      // Não logar cada checkbox para não poluir, ou logar apenas se necessário
  },

  getDataForDashboard: () => {
      return {
          reports: StorageService.getReports(),
          deviations: StorageService.getDeviations(),
          cleaning: StorageService.getCleaning(),
          matrix: StorageService.getMatrix() 
      };
  }
};
