
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Camera, 
  ShieldAlert, 
  PackageCheck, 
  AlertTriangle, 
  Brush,
  Menu,
  X,
  LogOut,
  Users,
  ClipboardCheck,
  Images,
  Lock,
  Megaphone,
  Settings,
  CalendarClock,
  ScrollText,
  Newspaper,
  Bell,
  StickyNote,
  ListChecks,
  Hammer,
  Ban,
  CalendarDays,
  Info,
  Siren,
  Palette,
  ChevronRight,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { GeneralReports } from './components/modules/GeneralReports';
import { SafetyArea } from './components/modules/SafetyArea';
import { OrderRequests } from './components/modules/StockArrivals'; 
import { ServiceDeviations } from './components/modules/ServiceDeviations';
import { CleaningReport } from './components/modules/CleaningReport';
import { ResponsibilityMatrix } from './components/modules/ResponsibilityMatrix';
import { InspectionSheet } from './components/modules/InspectionSheet';
import { PhotoGallery } from './components/modules/PhotoGallery';
import { AdminPanel } from './components/modules/AdminPanel';
import { DDSRegister } from './components/modules/DDSRegister';
import { DDSSchedule } from './components/modules/DDSSchedule';
import { ProfileSettings } from './components/modules/ProfileSettings';
import { EquipmentInspections } from './components/modules/EquipmentInspections'; 
import { Logs } from './components/modules/Logs'; 
import { Reminders } from './components/modules/Reminders';
import { ResiduesAttendance } from './components/modules/ResiduesAttendance'; 
import { WorkPermits } from './components/modules/WorkPermits'; 
import { SiteInspections } from './components/modules/SiteInspections'; 
import { EmergencyContacts } from './components/modules/EmergencyContacts';
import { Appearance } from './components/modules/Appearance';
import { Login } from './components/Login';
import { ModuleType, Notification, Announcement, AppConfig } from './types';
import { AuthService, User } from './services/authService';
import { StorageService } from './services/storageService';

// Som de notificação suave (Base64 MP3 - Short Glass Ding)
const NOTIFICATION_SOUND = "data:audio/mpeg;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXA0MgBUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzb21tcDQyAFRTU0UAAAAPAAADTGF2ZjU3LjU2LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAIERhbmUAAAAAAAAAAAAAAAAAAACAAAAAAHQAAAAAAA27gAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAIERhbmUAAAAAAAAAAAAAAAAAAACAAAAAAHQAAAAAAA27gAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAIERhbmUAAAAAAAAAAAAAAAAAAACAAAAAAHQAAAAAAA27gAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAIERhbmUAAAAAAAAAAAAAAAAAAACAAAAAAHQAAAAAAA27gAAAAAAA//uQZAAACk0JWA0wQAAAAAAI4AAABRE9G+wQIqAAAAACEEAAABAAAAAAAAAAAAIERhbmUAAAAAAAAAAAAAAAAAAACAAAAAAHQAAAAAAA27gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAP8AAANAAAAAAAABAAAAAAABH5i7w0wQAAAAAAI4AAABAAAAAAAAAAAAIERhbmUAAAAAAAAAAAAAAAAAAACAAAAAAHQAAAAAAA27gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAP8AAANAAAAAAAABAAAAAAABH5i7w0wQAAAAAAI4AAABAAAAAAAAAAAAIERhbmUAAAAAAAAAAAAAAAAAAACAAAAAAHQAAAAAAA27gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAP8AAANAAAAAAAABAAAAAAABH5i7w0wQAAAAAAI4AAABAAAAAAAAAAAAIERhbmUAAAAAAAAAAAAAAAAAAACAAAAAAHQAAAAAAA27gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAANAAAAAAAABAAAAAAABH5i7w0wQAAAAAAI4AAABAAAAAAAAAAAAIERhbmUAAAAAAAAAAAAAAAAAAACAAAAAAHQAAAAAAA27gAAAAAAA";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  
  // Announcement State
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);

  // App Configuration State (Customization)
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

  // Color Modal State
  const [showColorInfo, setShowColorInfo] = useState(false);

  // Navigation Params
  const [navParams, setNavParams] = useState<any>({});

  // Refs para controle de som e cursor
  const previousNotifCount = useRef(0);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Simulação de Status Online/Offline
  const [isOnline, setIsOnline] = useState(true);

  // Reproduzir som
  const playSound = () => {
    try {
        const audio = new Audio(NOTIFICATION_SOUND);
        audio.volume = 0.4;
        audio.play().catch(e => console.log("Audio play blocked by browser policy:", e));
    } catch (e) {
        console.error("Error playing sound", e);
    }
  };

  // Lógica da Cor Proibida Mensal
  const getForbiddenColor = () => {
      const date = new Date();
      const month = date.getMonth(); // 0 a 11
      
      switch (month % 4) {
          case 0: return { bg: 'bg-red-600', border: 'border-red-700', text: 'text-red-100', name: 'Vermelha' };
          case 1: return { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-blue-100', name: 'Azul' };
          case 2: return { bg: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-yellow-900', name: 'Amarela' };
          case 3: return { bg: 'bg-green-600', border: 'border-green-700', text: 'text-green-100', name: 'Verde' };
          default: return { bg: 'bg-slate-500', border: 'border-slate-600', text: 'text-white', name: 'Indefinida' };
      }
  };

  const forbiddenColor = getForbiddenColor();

  const colorRules = [
      { name: 'Vermelha', class: 'bg-red-600 border-red-200 text-white shadow-red-200', months: ['Janeiro', 'Maio', 'Setembro'] },
      { name: 'Azul', class: 'bg-blue-600 border-blue-200 text-white shadow-blue-200', months: ['Fevereiro', 'Junho', 'Outubro'] },
      { name: 'Amarela', class: 'bg-yellow-500 border-yellow-200 text-black shadow-yellow-200', months: ['Março', 'Julho', 'Novembro'] },
      { name: 'Verde', class: 'bg-green-600 border-green-200 text-white shadow-green-200', months: ['Abril', 'Agosto', 'Dezembro'] },
  ];

  // Efeito do Cursor Neon
  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
        if (cursorRef.current) {
            cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        }
    };

    window.addEventListener('mousemove', moveCursor);
    
    // Simulação de checagem de conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('mousemove', moveCursor);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitorar mudanças para tocar som
  useEffect(() => {
      if (notifications.length > previousNotifCount.current) {
          playSound();
      }
      previousNotifCount.current = notifications.length;
  }, [notifications]);

  useEffect(() => {
      if (activeAnnouncement) {
          playSound();
      }
  }, [activeAnnouncement]);

  const checkGlobalReset = () => {
        const globalSignal = localStorage.getItem('painelSucena_GLOBAL_RESET_SIGNAL');
        const localAck = localStorage.getItem('painelSucena_RESET_ACK');

        if (globalSignal && globalSignal !== localAck) {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem('painelSucena_GLOBAL_RESET_SIGNAL', globalSignal);
            localStorage.setItem('painelSucena_RESET_ACK', globalSignal);
            alert("Atualização crítica do sistema: Seu cache foi limpo pelo administrador e você será desconectado.");
            window.location.reload();
        }
  };

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    
    const config = StorageService.getAppConfig();
    if (config) setAppConfig(config);

    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      loadNotifications(user.username);
      checkAnnouncement();
      AuthService.ping();
    }

    const today = new Date();
    if (today.getDate() === 1) {
        const monthKey = `forbidden_color_alert_${today.getMonth()}_${today.getFullYear()}`;
        const currentAnnouncement = StorageService.getAnnouncement();
        const isColorAnnouncement = currentAnnouncement?.title === "Mudança de Cor Proibida";
        
        if (!localStorage.getItem(monthKey) && !isColorAnnouncement) {
             const colorInfo = getForbiddenColor();
             const newAnnounce: Announcement = {
                  id: Date.now().toString(),
                  title: "Mudança de Cor Proibida",
                  message: ` Atenção Equipe!\n\nIniciamos o mês de ${today.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()}.\n\nA cor proibida para inspeções e fitas deste mês é: ${colorInfo.name.toUpperCase()}.\n\nPor favor, atualizem as marcações conforme o padrão de segurança.`,
                  active: true,
                  createdAt: new Date().toISOString(),
                  createdBy: 'SISTEMA'
             };
             
             StorageService.saveAnnouncement(newAnnounce);
             localStorage.setItem(monthKey, 'true');
        }
    }
    
    const interval = setInterval(() => {
        const u = AuthService.getCurrentUser();
        if (u) {
            loadNotifications(u.username);
            checkAnnouncement();
            AuthService.ping();
        }
        checkGlobalReset();
    }, 5000); 

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'painelSucena_GLOBAL_RESET_SIGNAL') checkGlobalReset();
        if (e.key === StorageService.KEYS.ANNOUNCEMENT) checkAnnouncement();
        if (e.key === StorageService.KEYS.NOTIFICATIONS) {
            const u = AuthService.getCurrentUser();
            if (u) loadNotifications(u.username);
        }
        if (e.key === StorageService.KEYS.APP_CONFIG) {
            const c = StorageService.getAppConfig();
            if (c) setAppConfig(c);
        }
    };

    const handleLocalUpdate = () => checkAnnouncement();
    const handleConfigUpdate = () => {
        const c = StorageService.getAppConfig();
        if (c) setAppConfig(c);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-announcement-update', handleLocalUpdate);
    window.addEventListener('app-config-update', handleConfigUpdate);

    return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('local-storage-announcement-update', handleLocalUpdate);
        window.removeEventListener('app-config-update', handleConfigUpdate);
    };
  }, []);

  const loadNotifications = (username: string) => {
      const list = StorageService.getNotifications(username);
      setNotifications(list);
  };

  const checkAnnouncement = () => {
      const announce = StorageService.getAnnouncement();
      if (announce && announce.active) {
          const seenKey = `sucena_announcement_seen_${announce.id}`;
          if (!localStorage.getItem(seenKey)) {
              setActiveAnnouncement(announce);
          } else {
              if (activeAnnouncement && activeAnnouncement.id === announce.id) {
              } else {
                 setActiveAnnouncement(null); 
              }
          }
      } else {
          setActiveAnnouncement(null);
      }
  };

  const handleCloseAnnouncement = () => {
      if (activeAnnouncement) {
          const seenKey = `sucena_announcement_seen_${activeAnnouncement.id}`;
          localStorage.setItem(seenKey, 'true');
          setActiveAnnouncement(null);
      }
  };

  const handleLogin = () => {
    const user = AuthService.getCurrentUser();
    if (user) {
        setCurrentUser(user);
        loadNotifications(user.username);
        checkAnnouncement();
    }
    setIsAuthenticated(true);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setActiveModule(ModuleType.DASHBOARD);
    setCurrentUser(null);
    setActiveAnnouncement(null);
  };

  const handleNotificationClick = (n: Notification) => {
      StorageService.markNotificationAsRead(n.id);
      if (currentUser) loadNotifications(currentUser.username);
      if (n.targetModule) {
          handleNavigate(n.targetModule, n.targetTab ? { tab: n.targetTab } : undefined);
          setShowNotifications(false);
      }
  };

  const handleNavigate = (module: ModuleType, params?: any) => {
      if (isModuleBlocked(module)) {
          alert("Este módulo está indisponível para seu perfil no momento.");
          return;
      }

      setActiveModule(module);
      if (params) {
          setNavParams((prev: any) => ({
              ...prev,
              [module]: params
          }));
      }
      if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      StorageService.markNotificationAsRead(id);
      if (currentUser) loadNotifications(currentUser.username);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  const baseMenuItems = [
    { id: ModuleType.DASHBOARD, label: 'Visão Geral', icon: LayoutDashboard }, 
    { id: ModuleType.DDS, label: 'DDS do Dia', icon: Megaphone },
    { id: ModuleType.DDS_SCHEDULE, label: 'Escala DDS', icon: CalendarDays }, 
    { id: ModuleType.RESIDUES_ATTENDANCE, label: 'Lista de Presença', icon: ListChecks }, 
    { id: ModuleType.REMINDERS, label: 'Minha Agenda', icon: StickyNote }, 
    { id: ModuleType.MATRIZ, label: 'Matriz Resp.', icon: Users },
    { id: ModuleType.INSPECTION, label: 'Ficha de Vistoria', icon: ClipboardCheck },
    { id: ModuleType.SAFETY, label: 'Segurança', icon: ShieldAlert },
    { id: ModuleType.SITE_INSPECTION, label: 'Vistoria Canteiro', icon: ClipboardCheck }, 
    { id: ModuleType.EQUIPMENT_INSPECTION, label: 'Vist. Equipamentos', icon: CalendarClock }, 
    { id: ModuleType.WORK_PERMITS, label: 'Permissão Trabalho', icon: Hammer }, 
    { id: ModuleType.GENERAL_REPORTS, label: 'Relatórios Gerais', icon: FileText },
    { id: ModuleType.STOCK, label: 'Almoxarifado', icon: PackageCheck },
    { id: ModuleType.DEVIATIONS, label: 'Desvios', icon: AlertTriangle },
    { id: ModuleType.CLEANING, label: 'Limpeza', icon: Brush },
    { id: ModuleType.GALLERY, label: 'Galeria', icon: Images }, 
    { id: ModuleType.LOGS, label: 'Logs Sistema', icon: ScrollText }, 
    { id: ModuleType.ADMIN, label: 'Administração', icon: Lock },
    { id: ModuleType.APPEARANCE, label: 'Personalização', icon: Palette },
    { id: ModuleType.EMERGENCY, label: 'Emergência', icon: Siren },
  ];

  const isModuleBlocked = (moduleId: string) => {
      if (currentUser?.role === 'ADMIN') return false;
      
      const blockedRules = appConfig?.blockedModules?.[moduleId];
      if (!blockedRules) return false;

      if (blockedRules.includes('ALL')) return true;
      if (currentUser?.jobTitle && blockedRules.includes(currentUser.jobTitle)) return true;

      return false;
  };

  const getOrderedMenuItems = () => {
      let items = [...baseMenuItems];
      
      const allowedResidueRoles = ['Encarregado', 'Encarregado Geral', 'Administrador do Sistema'];
      const hasResiduesAccess = currentUser?.role === 'ADMIN' || allowedResidueRoles.includes(currentUser?.jobTitle || '');
      
      if (!hasResiduesAccess) {
          items = items.filter(i => i.id !== ModuleType.RESIDUES_ATTENDANCE);
      }
      
      items = items.filter(item => !isModuleBlocked(item.id));

      if (appConfig?.menuOrder && appConfig.menuOrder.length > 0) {
          items.sort((a, b) => {
              const indexA = appConfig.menuOrder!.indexOf(a.id);
              const indexB = appConfig.menuOrder!.indexOf(b.id);
              
              if (indexA !== -1 && indexB !== -1) return indexA - indexB;
              if (indexA !== -1) return -1;
              if (indexB !== -1) return 1;
              return 0;
          });
      }

      return items;
  };

  const menuItems = getOrderedMenuItems();

  const renderContent = () => {
    if (isModuleBlocked(activeModule)) {
        setTimeout(() => setActiveModule(ModuleType.DASHBOARD), 0);
        return <Dashboard onNavigate={handleNavigate} />;
    }

    switch (activeModule) {
      case ModuleType.DASHBOARD: return <Dashboard onNavigate={handleNavigate} />;
      case ModuleType.REMINDERS: return <Reminders />;
      case ModuleType.DDS_SCHEDULE: return <DDSSchedule />;
      case ModuleType.WORK_PERMITS: return <WorkPermits preSelectedCategory={navParams[ModuleType.WORK_PERMITS]?.category} />;
      case ModuleType.SITE_INSPECTION: return <SiteInspections />;
      case ModuleType.RESIDUES_ATTENDANCE: return <ResiduesAttendance />;
      case ModuleType.GENERAL_REPORTS: return <GeneralReports />;
      case ModuleType.SAFETY: return <SafetyArea />;
      case ModuleType.STOCK: return <OrderRequests preSelectedTab={navParams[ModuleType.STOCK]?.tab} />;
      case ModuleType.DEVIATIONS: return <ServiceDeviations />;
      case ModuleType.CLEANING: return <CleaningReport />;
      case ModuleType.MATRIZ: return <ResponsibilityMatrix />;
      case ModuleType.INSPECTION: return <InspectionSheet />;
      case ModuleType.EQUIPMENT_INSPECTION: return <EquipmentInspections />;
      case ModuleType.GALLERY: return <PhotoGallery />;
      case ModuleType.DDS: return <DDSRegister />;
      case ModuleType.PROFILE: return <ProfileSettings />;
      case ModuleType.LOGS: return <Logs />;
      case ModuleType.EMERGENCY: return <EmergencyContacts />;
      case ModuleType.ADMIN: return <AdminPanel />; 
      case ModuleType.APPEARANCE: return <Appearance />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const userInitials = currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'GS';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative cursor-none md:cursor-auto">
      
      {/* CUSTOM NEON CURSOR */}
      <div 
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 w-3 h-3 bg-yellow-400 rounded-full z-[9999] hidden md:block mix-blend-screen shadow-[0_0_15px_#EAB308,0_0_30px_#EAB308] transition-transform duration-75 ease-out"
        style={{ marginTop: '-6px', marginLeft: '-6px' }}
      ></div>

      {/* --- FORBIDDEN COLOR FLOATING BADGE --- */}
      <div 
        onClick={() => setShowColorInfo(true)}
        className="fixed bottom-20 right-4 z-[9990] flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 group pointer-events-auto cursor-pointer"
      >
          <div className="mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded shadow-sm whitespace-nowrap">
              Cor proibida
          </div>
          <div 
            className={`w-12 h-12 rounded-full shadow-lg border-4 border-white ${forbiddenColor.bg} flex items-center justify-center relative transition-transform hover:scale-110 hover:shadow-xl`}
            title={`Cor proibida do mês: ${forbiddenColor.name}`}
          >
              <Ban size={20} className="text-white/90" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] font-bold text-slate-800 shadow-sm border border-slate-100">
                  !
              </div>
          </div>
      </div>

      {/* --- MODAL DE CORES DO MÊS --- */}
      {showColorInfo && (
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                  <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800">
                      <div className="flex items-center gap-3 text-white">
                          <CalendarDays size={24} className="text-yellow-500"/>
                          <div>
                              <h3 className="font-bold text-lg leading-none">Calendário de Cores</h3>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Padrão de Segurança Operacional</p>
                          </div>
                      </div>
                      <button 
                          onClick={() => setShowColorInfo(false)}
                          className="bg-slate-800 text-slate-400 hover:text-white p-2 rounded-full transition-colors"
                      >
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6 grid gap-4">
                      {colorRules.map((rule) => {
                          const isCurrent = rule.name === forbiddenColor.name;
                          return (
                              <div 
                                key={rule.name} 
                                className={`flex items-stretch rounded-xl overflow-hidden border ${isCurrent ? 'ring-2 ring-offset-2 ring-yellow-500 shadow-md' : 'border-slate-100'}`}
                              >
                                  <div className={`w-16 flex items-center justify-center ${rule.class} p-2`}>
                                      <Ban size={24} className="opacity-80" />
                                  </div>
                                  <div className="flex-1 p-3 bg-slate-50 flex flex-col justify-center">
                                      <span className="text-xs font-bold text-slate-500 uppercase mb-1">Meses de Aplicação</span>
                                      <div className="flex flex-wrap gap-2">
                                          {rule.months.map(m => (
                                              <span 
                                                key={m} 
                                                className={`text-xs font-medium px-2 py-0.5 rounded ${isCurrent && m.toLowerCase() === new Date().toLocaleDateString('pt-BR', {month:'long'}) ? 'bg-yellow-100 text-yellow-800 font-bold border border-yellow-200' : 'bg-white border border-slate-200 text-slate-700'}`}
                                              >
                                                  {m}
                                              </span>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
                  <div className="bg-slate-50 p-3 text-center border-t border-slate-200 text-xs text-slate-500 flex items-center justify-center gap-2">
                      <Info size={14} />
                      A cor proibida é usada para inspeções e fitas de isolamento.
                  </div>
              </div>
          </div>
      )}
      
      {/* GLOBAL ANNOUNCEMENT OVERLAY */}
      {activeAnnouncement && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative border border-white/20">
                  <div className="absolute inset-0 bg-purple-500/5 pointer-events-none"></div>
                  <div className="bg-gradient-to-r from-purple-700 to-purple-900 p-5 text-white flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-3">
                          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                             <Megaphone className="animate-pulse text-yellow-300" size={24} />
                          </div>
                          <div>
                              <span className="font-bold text-lg block leading-none">Comunicado Oficial</span>
                              <span className="text-[10px] text-purple-200 uppercase tracking-widest font-semibold">Administração</span>
                          </div>
                      </div>
                      <button 
                        onClick={handleCloseAnnouncement}
                        className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                      >
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-8 relative z-10">
                      <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 leading-tight">
                          {activeAnnouncement.title}
                      </h2>
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-slate-700 text-lg leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-y-auto shadow-inner">
                          {activeAnnouncement.message}
                      </div>
                      <div className="mt-8 flex justify-center">
                          <button 
                            onClick={handleCloseAnnouncement}
                            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                              <ClipboardCheck size={20} className="text-green-400"/>
                              Entendido, marcar como lido.
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Mobile Backdrop for Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Clean Minimalist */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 shadow-lg transform transition-transform duration-300 z-30 md:relative md:translate-x-0 flex flex-col border-r border-slate-100`}
        style={{
            backgroundColor: appConfig?.sidebarColor || '#ffffff',
            color: appConfig?.sidebarTextColor || '#475569'
        }}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-xl shadow-lg">
             {/* Logo do App (Dinâmica) */}
             {appConfig?.logoUrl ? (
                 <img src={appConfig.logoUrl} alt="Logo" className="w-6 h-6 object-contain filter brightness-0 invert" />
             ) : (
                 <LayoutDashboard className="text-white" size={20} />
             )}
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-800 leading-none">SUCENA</h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-1">Painel Operacional</p>
          </div>
          <button className="md:hidden ml-auto text-slate-400" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="px-6 pb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Menu Principal</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar pb-6">
          {menuItems.map((item) => {
            const isActive = activeModule === item.id;
            const Icon = item.icon;
            
            const activeBg = appConfig?.sidebarHighlightColor || '#f1f5f9';
            const iconColor = appConfig?.sidebarIconColor || '#475569';
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive ? 'shadow-sm font-semibold' : 'hover:bg-slate-50 font-medium'
                }`}
                style={isActive ? {
                    backgroundColor: activeBg,
                    color: '#0f172a'
                } : {
                    color: appConfig?.sidebarTextColor || '#64748b'
                }}
              >
                <div className="flex items-center gap-3">
                    <Icon 
                        size={20} 
                        className={`transition-colors ${isActive ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'}`}
                        strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className="text-sm tracking-wide">{item.label}</span>
                </div>
                {isActive && (
                    <ChevronRight size={16} className="text-slate-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer Minimalist */}
        <div className="p-4 border-t border-slate-100">
          <div 
            className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors group" 
            onClick={() => handleNavigate(ModuleType.PROFILE)}
          >
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm group-hover:border-slate-200 transition-colors">
                {currentUser?.photoUrl ? (
                    <img src={currentUser.photoUrl} alt="User" className="w-full h-full object-cover" />
                ) : (
                    <span className="font-bold text-slate-500">{userInitials}</span>
                )}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{currentUser?.name}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser?.jobTitle}</p>
            </div>
            <Settings size={16} className="text-slate-300 group-hover:text-slate-500" />
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 py-2.5 rounded-xl transition-all text-sm font-medium border border-slate-200 hover:border-red-100 shadow-sm"
          >
            <LogOut size={16} /> Sair do Sistema
          </button>
          
          <div className="text-center mt-3 flex items-center justify-center gap-1.5 opacity-50">
              {isOnline ? <Wifi size={10} className="text-green-600"/> : <WifiOff size={10} className="text-red-600"/>}
              <span className="text-[9px] font-medium uppercase tracking-widest text-slate-400">
                  {isOnline ? 'Conectado' : 'Offline'}
              </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative">
        {/* Header Mobile */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
           <div className="flex items-center gap-3">
               <button onClick={() => setIsSidebarOpen(true)} className="text-slate-700">
                 <Menu size={24} />
               </button>
               <span className="font-bold text-slate-800">Painel Sucena</span>
           </div>
           
           <div className="flex items-center gap-3">
               <div className="relative" ref={notifRef}>
                   <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                   >
                       <Bell size={24} />
                       {unreadCount > 0 && (
                           <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                       )}
                   </button>
                   
                   {showNotifications && (
                       <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in zoom-in-95 origin-top-right">
                           <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                               <h4 className="font-bold text-sm text-slate-700">Notificações</h4>
                               <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">{unreadCount} novas</span>
                           </div>
                           <div className="max-h-64 overflow-y-auto">
                               {notifications.length === 0 ? (
                                   <div className="p-4 text-center text-xs text-slate-400">Nenhuma notificação.</div>
                               ) : (
                                   notifications.map(n => (
                                       <div 
                                          key={n.id} 
                                          onClick={() => handleNotificationClick(n)}
                                          className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors relative ${!n.read ? 'bg-blue-50/50' : ''}`}
                                       >
                                           <div className="flex justify-between items-start mb-1">
                                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${n.type === 'MENTION' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                                   {n.type === 'MENTION' ? '@ Menção' : 'Sistema'}
                                               </span>
                                               <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                                           </div>
                                           <p className={`text-xs ${!n.read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{n.message}</p>
                                           
                                           {!n.read && (
                                               <button 
                                                  onClick={(e) => handleMarkAsRead(n.id, e)}
                                                  className="text-[10px] text-blue-600 hover:underline mt-1 block"
                                               >
                                                   Marcar como lida
                                               </button>
                                           )}
                                       </div>
                                   ))
                               )}
                           </div>
                       </div>
                   )}
               </div>
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
