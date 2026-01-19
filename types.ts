
export enum ModuleType {
  DASHBOARD = 'DASHBOARD',
  GENERAL_REPORTS = 'GENERAL_REPORTS',
  SAFETY = 'SAFETY',
  STOCK = 'STOCK',
  DEVIATIONS = 'DEVIATIONS',
  CLEANING = 'CLEANING',
  MATRIZ = 'MATRIZ',
  INSPECTION = 'INSPECTION',
  GALLERY = 'GALLERY',
  ADMIN = 'ADMIN',
  DDS = 'DDS',
  DDS_SCHEDULE = 'DDS_SCHEDULE',
  PROFILE = 'PROFILE',
  EQUIPMENT_INSPECTION = 'EQUIPMENT_INSPECTION',
  LOGS = 'LOGS',
  REMINDERS = 'REMINDERS',
  RESIDUES_ATTENDANCE = 'RESIDUES_ATTENDANCE',
  WORK_PERMITS = 'WORK_PERMITS', 
  SITE_INSPECTION = 'SITE_INSPECTION', 
  EMERGENCY = 'EMERGENCY', 
  APPEARANCE = 'APPEARANCE',
}

export enum CleaningArea {
  ALMOXARIFADO = 'Almoxarifado',
  CANTEIRO = 'Canteiro de Obras',
  JARDINAGEM = 'Tenda de Jardinagem',
  GABIAO = 'Tenda do Gabião',
}

export interface AppConfig {
  logoUrl?: string; // Base64 da logo (Menu Lateral)
  sidebarColor?: string; // Hex color da barra lateral
  sidebarTextColor?: string; // Hex color do texto da barra lateral
  sidebarIconColor?: string; // Hex color dos ícones inativos
  sidebarHighlightColor?: string; // Hex color do fundo do item selecionado
  menuOrder?: ModuleType[]; // Ordem dos itens do menu
  loginLogoUrl?: string; // Base64 da logo (Tela de Login)
  // Mapeia ModuleType -> Array de JobTitles bloqueados ou ['ALL']
  blockedModules?: Record<string, string[]>; 
}

export interface BaseRecord {
  id: string;
  createdAt: string; // ISO String
  createdBy?: string; // Username (para controle interno)
  authorName?: string; // Nome Completo
  authorRole?: string; // Cargo
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Notification {
  id: string;
  userId: string; // Username do destinatário
  message: string;
  read: boolean;
  createdAt: string;
  type: 'MENTION' | 'SYSTEM';
  targetModule?: ModuleType; // Módulo para redirecionamento
  targetTab?: string;        // Aba específica (ex: 'canceled' no Estoque)
}

export interface LogRecord extends BaseRecord {
  category: 'VISTORIA' | 'SISTEMA' | 'RELATORIO' | 'EVIDENCIA' | 'SEGURANCA' | 'ESTOQUE' | 'DESVIO' | 'LIMPEZA' | 'DDS' | 'OUTROS' | 'PEDIDOS' | 'PRESENCA' | 'PT' | 'CANTEIRO' | 'EMERGENCIA' | 'ESCALA_DDS';
  action: 'CRIACAO' | 'ATUALIZACAO' | 'EXCLUSAO' | 'APROVADO' | 'REPROVADO' | 'INFO' | 'CANCELADO';
  description: string;
  details?: string; 
}

export interface MatrixTask {
  id: string;
  description: string;
  completed: boolean;
}

export interface MatrixRole {
  id: string;
  title: string;
  iconName: 'Briefcase' | 'UserCog' | 'HardHat' | 'Shield'; // Serialized icon name
  color: string;
  tasks: MatrixTask[];
}

export interface GeneralReport extends BaseRecord {
  date: string;
  sector: string; 
  responsible: string; 
  description: string; 
  occurrences: string;
  contract?: string;
  management?: string; 
  leadership?: string; 
  tst?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  activitiesJardinagem?: string;
  activitiesGabiao?: string;
  
  // Legacy fields (Mantidos para compatibilidade com registros antigos)
  qtyJardineiro?: number;
  qtyAjudanteJardinagem?: number;
  qtyAjudantePipa?: number;
  qtyPolivalente?: number;
  qtyMeiaOficial?: number;
  qtyAjudanteGabiao?: number;
  qtyAuxEletrica?: number;
  qtyEletricista?: number;
  qtyMecanico?: number;

  // Novos Campos Padronizados (Jardinagem)
  qtyJardineiroJardinagem?: number;
  qtyAjudanteJardinagemNew?: number;
  qtyMotoristaPipaJardinagem?: number;
  qtyMotoristaMunckJardinagem?: number;
  qtySinaleiroJardinagem?: number;
  qtyMecanicoJardinagem?: number;
  qtyAuxEletricaJardinagem?: number;

  // Novos Campos Padronizados (Gabião)
  qtyJardineiroGabiao?: number;
  qtyAjudanteGabiaoNew?: number;
  qtyMotoristaPipaGabiao?: number;
  qtyMotoristaMunckGabiao?: number;
  qtySinaleiroGabiao?: number;
  qtyMecanicoGabiao?: number;
  qtyAuxEletricaGabiao?: number;

  // Campo flexível para funções extras criadas dinamicamente
  // Chave: Nome da função (ex: 'Pintor') -> Valor: { jardinagem: 2, gabiao: 1 }
  extraLabor?: Record<string, { jardinagem: number, gabiao: number }>;

  // Equipamentos
  qtyVeiculoLeve?: number;
  qtyOnibus?: number;
  qtyCaminhaoPipa?: number;
  qtyMunck?: number;
  equipmentDetails?: string; 
  weatherMorning?: 'Sol' | 'Nublado' | 'Chuva';
  weatherAfternoon?: 'Sol' | 'Nublado' | 'Chuva';
}

export interface SafetyRecord extends BaseRecord {
  type: 'INSPECTION' | 'RISK' | 'COMMUNICATION';
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  actionTaken: string;
  mentionedUsers?: string[]; // Lista de Usernames
}

export type MeasureUnit = 'UNIDADE' | 'METRO' | 'CENTIMETRO' | 'LITRO' | 'CAIXA' | 'KG' | 'PACOTE' | 'GALAO' | 'METRO_CUBICO' | 'PAR';
export type OrderStatus = 'PENDENTE' | 'SOLICITADO' | 'FEITO' | 'ENTREGUE' | 'CANCELADO';

export interface OrderRecord extends BaseRecord {
  materialName: string;
  description: string;
  quantity: number;
  unit: MeasureUnit;
  requiredDate: string; // Data da previsão
  assignedTo?: string; // Username of mentioned person
  status: OrderStatus;
  photoUrl?: string;
  caNumber?: string; // CA (Certificado de Aprovação) para EPIs
  updatedAt?: string; // ISO String para rastrear quando foi entregue/cancelado
}

export interface DeviationRecord extends BaseRecord {
  type: 'PROCESS_FAILURE' | 'DELAY' | 'NON_STANDARD' | 'OTHER';
  description: string;
  cause: string;
  correction: string;
  photoUrls?: string[];     // Novas fotos
  mentionedUsers?: string[]; // Menções
}

export interface VehicleChecklistRecord extends BaseRecord {
  driverName: string;
  vehiclePlate: string;
  mileage: number;
  fuelLevel: number;
  condition: string;
  damageDescription: string;
  photoUrl: string;
}

export interface CleaningRecord extends BaseRecord {
  area: CleaningArea;
  date: string;
  responsible: string;
  description: string;
  photoUrl: string;
}

export interface InspectionRecord extends BaseRecord {
  role: 'Encarregado Geral' | 'Encarregado' | 'Técnico Meio Ambiente' | 'Técnico de Segurança';
  task: string;
  deadline: string;
  completed: boolean;
  photoUrls?: string[]; // Fotos da solicitação/contexto
  correctionPhotoUrl?: string; // Legacy
  correctionPhotoUrls?: string[]; // Fotos da execução
  requester?: string; 
  mentionedUsers?: string[]; // Lista de Usernames
}

export interface DDSRecord extends BaseRecord {
  date: string;
  theme: string;
  speaker: string;
  employeesCount: number;
  visitorsCount: number;
  photoUrls: string[];
}

export interface DDSScheduleRecord {
    date: string; // YYYY-MM-DD
    speakerName: string;
    theme: string;
}

export interface EquipmentInspectionRecord extends BaseRecord {
  vehicleName: string;
  plate: string;
  driverName: string;
  nextInspectionDate: string; // YYYY-MM-DD
}

export type ReminderVisibility = 'ME' | 'ALL' | 'ROLES' | 'USER';

export interface ReminderRecord extends BaseRecord {
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  visibility: ReminderVisibility; // Novo Campo
  targetRoles?: string[]; // Novo Campo (Lista de jobTitles)
  mentionedUser?: string; // Username of the mentioned person (Legacy/USER visibility)
}

// Novo registro de presença
export interface AttendanceRecord extends BaseRecord {
    date: string;
    ddsTheme?: string; // Opcional agora
    tstName: string;
    encGeralName: string;
    encName: string;
    team: {
        role: string;
        name: string;
        present: boolean;
    }[];
}

export interface EvidenceRecord extends BaseRecord {
  activity: string;
  comments: string;
  mediaUrls: string[];
}

// === NOVOS TIPOS ===

export type WorkPermitCategory = 'VERTEDOURO' | 'ESCAVACAO' | 'MUNK';

export interface WorkPermitRecord extends BaseRecord {
    category: WorkPermitCategory;
    description: string;
    location: string;
    expirationDate: string; // YYYY-MM-DD
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
}

export interface SiteInspectionRecord extends BaseRecord {
    inspectionDate: string; // YYYY-MM-DD
    location: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
}
