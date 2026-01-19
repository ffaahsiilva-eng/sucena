
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, AITextArea, FileInput } from '../ui/Shared';
import { AuthService, User, UserRole } from '../../services/authService';
import { StorageService } from '../../services/storageService';
import { Trash2, UserPlus, Shield, ShieldAlert, Users, Pencil, X, Save, Briefcase, Plus, Megaphone, Send, Palette, LayoutTemplate, ArrowUp, ArrowDown, Lock, Unlock } from 'lucide-react';
import { Announcement, ModuleType } from '../../types';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Job Titles Management
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [newJobTitle, setNewJobTitle] = useState('');

  // Announcement State
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [announceForm, setAnnounceForm] = useState({ title: '', message: '' });

  // Customization State
  const [logoUrl, setLogoUrl] = useState('');
  const [loginLogoUrl, setLoginLogoUrl] = useState(''); 
  const [sidebarColor, setSidebarColor] = useState('#0f172a'); // Padrão slate-950
  const [sidebarTextColor, setSidebarTextColor] = useState('#cbd5e1'); // Padrão slate-300
  const [sidebarIconColor, setSidebarIconColor] = useState('#EAB308'); // Padrão yellow-500
  const [sidebarHighlightColor, setSidebarHighlightColor] = useState('#EAB308'); // Padrão yellow-500
  
  // Menu Reordering State
  const [menuItemsOrder, setMenuItemsOrder] = useState<{id: ModuleType, label: string}[]>([]);

  // Access Control State
  const [blockedModules, setBlockedModules] = useState<Record<string, string[]>>({});
  const [openAccessModule, setOpenAccessModule] = useState<string | null>(null); 

  // Form State Creation
  const [newUser, setNewUser] = useState({
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'USER' as UserRole,
      jobTitle: '', 
      whatsapp: ''
  });

  // Lista de Módulos (Labels para exibição na reordenação)
  const moduleLabels: Record<string, string> = {
      [ModuleType.DASHBOARD]: 'Notícias',
      [ModuleType.REMINDERS]: 'Lembretes',
      [ModuleType.WORK_PERMITS]: 'Permissão Trabalho',
      [ModuleType.SITE_INSPECTION]: 'Vistoria Canteiro',
      [ModuleType.MATRIZ]: 'Matriz Responsabilidades',
      [ModuleType.DDS]: 'DDS do Dia',
      [ModuleType.INSPECTION]: 'Ficha de Vistoria',
      [ModuleType.EQUIPMENT_INSPECTION]: 'Vistoria Equipamentos',
      [ModuleType.GENERAL_REPORTS]: 'Relatórios Gerais',
      [ModuleType.SAFETY]: 'Segurança',
      [ModuleType.STOCK]: 'Pedidos',
      [ModuleType.DEVIATIONS]: 'Desvios',
      [ModuleType.CLEANING]: 'Limpeza',
      [ModuleType.GALLERY]: 'Galeria de Fotos',
      [ModuleType.LOGS]: 'Logs do Sistema',
      [ModuleType.RESIDUES_ATTENDANCE]: 'Lista de Presença',
      [ModuleType.EMERGENCY]: 'Emergência',
      [ModuleType.ADMIN]: 'Administração',
      [ModuleType.DDS_SCHEDULE]: 'Escala DDS'
  };

  useEffect(() => {
    loadUsers();
    loadJobTitles();
    loadAnnouncement();
    loadConfig();
    const cur = AuthService.getCurrentUser();
    setCurrentUser(cur);
  }, []);

  const loadUsers = () => {
      setUsers(AuthService.getUsers());
  };

  const loadJobTitles = () => {
      const titles = StorageService.getJobTitles();
      setJobTitles(titles);
      // Set default for new user form if empty
      if (titles.length > 0 && !newUser.jobTitle) {
          setNewUser(prev => ({ ...prev, jobTitle: titles[0] }));
      }
  };

  const loadAnnouncement = () => {
      const active = StorageService.getAnnouncement();
      setAnnouncement(active);
      if (active) {
          setAnnounceForm({ title: active.title, message: active.message });
      } else {
          setAnnounceForm({ title: '', message: '' });
      }
  };

  const loadConfig = () => {
      const config = StorageService.getAppConfig();
      if (config) {
          if (config.logoUrl) setLogoUrl(config.logoUrl);
          if (config.loginLogoUrl) setLoginLogoUrl(config.loginLogoUrl);
          if (config.sidebarColor) setSidebarColor(config.sidebarColor);
          if (config.sidebarTextColor) setSidebarTextColor(config.sidebarTextColor);
          if (config.sidebarIconColor) setSidebarIconColor(config.sidebarIconColor);
          if (config.sidebarHighlightColor) setSidebarHighlightColor(config.sidebarHighlightColor);
          if (config.blockedModules) setBlockedModules(config.blockedModules);
          
          if (config.menuOrder && config.menuOrder.length > 0) {
              const allKeys = Object.keys(moduleLabels) as ModuleType[];
              const ordered = config.menuOrder.filter(id => allKeys.includes(id));
              const missing = allKeys.filter(id => !ordered.includes(id));
              
              const fullList = [...ordered, ...missing].map(id => ({
                  id,
                  label: moduleLabels[id]
              }));
              setMenuItemsOrder(fullList);
          } else {
              const defaultList = Object.keys(moduleLabels).map(key => ({
                  id: key as ModuleType,
                  label: moduleLabels[key]
              }));
              setMenuItemsOrder(defaultList);
          }
      } else {
          const defaultList = Object.keys(moduleLabels).map(key => ({
              id: key as ModuleType,
              label: moduleLabels[key]
          }));
          setMenuItemsOrder(defaultList);
      }
  };

  const handleSaveConfig = () => {
      const config = {
          logoUrl,
          loginLogoUrl,
          sidebarColor,
          sidebarTextColor,
          sidebarIconColor,
          sidebarHighlightColor,
          menuOrder: menuItemsOrder.map(i => i.id),
          blockedModules: blockedModules
      };
      StorageService.saveAppConfig(config);
      alert("Configurações salvas com sucesso!");
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
      const newOrder = [...menuItemsOrder];
      if (direction === 'up' && index > 0) {
          [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      } else if (direction === 'down' && index < newOrder.length - 1) {
          [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      }
      setMenuItemsOrder(newOrder);
  };

  // --- ACCESS CONTROL HANDLERS ---
  const toggleMaintenanceMode = (moduleId: string) => {
      const currentBlocks = blockedModules[moduleId] || [];
      const isAllBlocked = currentBlocks.includes('ALL');
      
      let newBlocks;
      if (isAllBlocked) {
          newBlocks = currentBlocks.filter(b => b !== 'ALL');
      } else {
          newBlocks = [...currentBlocks, 'ALL'];
      }
      
      setBlockedModules(prev => ({
          ...prev,
          [moduleId]: newBlocks
      }));
  };

  const toggleRoleBlock = (moduleId: string, role: string) => {
      const currentBlocks = blockedModules[moduleId] || [];
      const isBlocked = currentBlocks.includes(role);
      
      let newBlocks;
      if (isBlocked) {
          newBlocks = currentBlocks.filter(r => r !== role);
      } else {
          newBlocks = [...currentBlocks, role];
      }
      
      setBlockedModules(prev => ({
          ...prev,
          [moduleId]: newBlocks
      }));
  };
  // ------------------------------

  const handlePublishAnnouncement = () => {
      if (!announceForm.title || !announceForm.message) {
          alert("Preencha título e mensagem.");
          return;
      }

      if (window.confirm("Isso exibirá uma mensagem na tela de TODOS os usuários. Confirmar?")) {
          const newAnnounce: Announcement = {
              id: Date.now().toString(),
              title: announceForm.title,
              message: announceForm.message,
              active: true,
              createdAt: new Date().toISOString(),
              createdBy: currentUser?.username || 'admin'
          };
          StorageService.saveAnnouncement(newAnnounce);
          setAnnouncement(newAnnounce);
      }
  };

  const handleClearAnnouncement = () => {
      if (window.confirm("Deseja remover o comunicado ativo?")) {
          StorageService.clearAnnouncement();
          setAnnouncement(null);
          setAnnounceForm({ title: '', message: '' });
      }
  };

  const handleDelete = async (id: string) => {
      if (id === currentUser?.id) {
          alert("Você não pode excluir seu próprio usuário.");
          return;
      }
      if (id === 'admin-id') {
          alert("O Super Admin não pode ser excluído.");
          return;
      }

      if (window.confirm("Tem certeza que deseja remover este usuário permanentemente?")) {
          try {
              await AuthService.deleteUser(id);
              loadUsers(); 
              alert("Usuário removido com sucesso.");
          } catch (e: any) {
              alert(e.message);
          }
      }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          await AuthService.register(
              newUser.username,
              newUser.email, 
              newUser.password, 
              newUser.role, 
              newUser.name,
              newUser.jobTitle,
              newUser.whatsapp
          );
          setNewUser({ username: '', name: '', email: '', password: '', role: 'USER', jobTitle: jobTitles[0] || 'Encarregado', whatsapp: '' });
          loadUsers();
          alert("Usuário criado com sucesso!");
      } catch (e: any) {
          alert(e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;

      try {
          await AuthService.updateUser(editingUser);
          setEditingUser(null); 
          loadUsers(); 
          alert("Usuário atualizado com sucesso!");
      } catch (error) {
          alert("Erro ao atualizar usuário.");
      }
  };

  const handleAddJobTitle = () => {
      if (!newJobTitle.trim()) return;
      StorageService.addJobTitle(newJobTitle.trim());
      setNewJobTitle('');
      loadJobTitles();
  };

  const handleRemoveJobTitle = (title: string) => {
      if (window.confirm(`Deseja remover o cargo "${title}" da lista de opções?`)) {
          StorageService.removeJobTitle(title);
          loadJobTitles();
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-slate-900 rounded-lg text-yellow-500 shadow-md">
             <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Painel Administrativo</h2>
            <p className="text-slate-500">Gerencie usuários, personalização e acessos.</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 space-y-6">
              
               {/* Personalização do Sistema */}
               <Card className="border-t-4 border-t-pink-500">
                   <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                       <Palette size={20} className="text-pink-600"/> Personalização
                   </h3>
                   
                   <div className="space-y-4">
                       {/* Logo Sidebar */}
                       <div>
                           <label className="block text-sm font-bold text-slate-700 mb-1">Logo do Sistema (Menu e PDFs)</label>
                           <p className="text-xs text-slate-500 mb-2">Esta logo será usada no menu lateral e em todos os documentos PDF gerados.</p>
                           <FileInput 
                               label="Alterar Logo Global" 
                               onImageUploaded={setLogoUrl}
                           />
                           {logoUrl && (
                               <div className="mt-2 bg-slate-100 p-2 rounded text-center">
                                   <img src={logoUrl} alt="Logo Preview" className="h-10 mx-auto object-contain" />
                               </div>
                           )}
                       </div>

                       {/* Logo Login */}
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Logo da Tela de Login</label>
                           <FileInput 
                               label="Alterar Logo Login" 
                               onImageUploaded={setLoginLogoUrl}
                           />
                           {loginLogoUrl && (
                               <div className="mt-2 bg-slate-100 p-2 rounded text-center">
                                   <img src={loginLogoUrl} alt="Login Logo Preview" className="h-20 mx-auto object-contain" />
                               </div>
                           )}
                       </div>

                       {/* Cores da Sidebar */}
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1">Fundo (Menu)</label>
                               <div className="flex gap-2 items-center">
                                   <input 
                                       type="color" 
                                       className="h-8 w-full cursor-pointer rounded border border-slate-300"
                                       value={sidebarColor}
                                       onChange={e => setSidebarColor(e.target.value)}
                                   />
                               </div>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1">Cor da Fonte</label>
                               <div className="flex gap-2 items-center">
                                   <input 
                                       type="color" 
                                       className="h-8 w-full cursor-pointer rounded border border-slate-300"
                                       value={sidebarTextColor}
                                       onChange={e => setSidebarTextColor(e.target.value)}
                                   />
                               </div>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1">Cor dos Ícones</label>
                               <div className="flex gap-2 items-center">
                                   <input 
                                       type="color" 
                                       className="h-8 w-full cursor-pointer rounded border border-slate-300"
                                       value={sidebarIconColor}
                                       onChange={e => setSidebarIconColor(e.target.value)}
                                   />
                               </div>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1">Destaque (Fundo)</label>
                               <div className="flex gap-2 items-center">
                                   <input 
                                       type="color" 
                                       className="h-8 w-full cursor-pointer rounded border border-slate-300"
                                       value={sidebarHighlightColor}
                                       onChange={e => setSidebarHighlightColor(e.target.value)}
                                   />
                               </div>
                           </div>
                       </div>

                       {/* Reordenar Menu */}
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                               <LayoutTemplate size={14}/> Ordem do Menu Lateral
                           </label>
                           <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto bg-slate-50 p-2 space-y-1 custom-scrollbar">
                               {menuItemsOrder.map((item, index) => (
                                   <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded shadow-sm text-xs border border-slate-100">
                                       <span className="truncate flex-1 font-medium text-slate-700">{item.label}</span>
                                       <div className="flex gap-1">
                                           <button 
                                               type="button" 
                                               onClick={() => handleMoveItem(index, 'up')}
                                               disabled={index === 0}
                                               className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30"
                                           >
                                               <ArrowUp size={12} />
                                           </button>
                                           <button 
                                               type="button" 
                                               onClick={() => handleMoveItem(index, 'down')}
                                               disabled={index === menuItemsOrder.length - 1}
                                               className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30"
                                           >
                                               <ArrowDown size={12} />
                                           </button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>

                       <Button onClick={handleSaveConfig} className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                           <Save size={16} /> Salvar Personalização
                       </Button>
                   </div>
               </Card>

               {/* Comunicado Geral */}
               <Card className="border-t-4 border-t-purple-600">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Megaphone size={20} className="text-purple-600"/> Comunicado Geral
                  </h3>
                  <div className="space-y-3">
                      <Input 
                          label="Título do Comunicado"
                          placeholder="Ex: Manutenção no sistema..."
                          value={announceForm.title}
                          onChange={e => setAnnounceForm({...announceForm, title: e.target.value})}
                      />
                      <AITextArea 
                          label="Mensagem"
                          placeholder="Digite a mensagem que aparecerá para todos..."
                          value={announceForm.message}
                          onChange={e => setAnnounceForm({...announceForm, message: e.target.value})}
                          rows={3}
                      />
                      <div className="flex gap-2">
                          <Button 
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={handlePublishAnnouncement}
                          >
                              <Send size={16} /> {announcement ? 'Atualizar' : 'Publicar'}
                          </Button>
                          {announcement && (
                              <Button 
                                variant="danger"
                                onClick={handleClearAnnouncement}
                                className="px-3"
                                title="Remover Comunicado"
                              >
                                  <Trash2 size={16} />
                              </Button>
                          )}
                      </div>
                      {announcement && (
                          <div className="text-xs text-green-600 font-bold bg-green-50 p-2 rounded border border-green-200 mt-2 text-center">
                              ● Comunicado Ativo
                          </div>
                      )}
                  </div>
              </Card>

              {/* Gerenciar Cargos */}
              <Card className="border-t-4 border-t-blue-500">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Briefcase size={20} className="text-slate-700"/> Gerenciar Cargos
                  </h3>
                  <div className="flex gap-2 mb-4">
                      <input 
                          type="text"
                          placeholder="Novo Cargo..."
                          className="flex-1 p-2 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          value={newJobTitle}
                          onChange={e => setNewJobTitle(e.target.value)}
                      />
                      <button 
                          type="button"
                          onClick={handleAddJobTitle}
                          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
                          disabled={!newJobTitle.trim()}
                      >
                          <Plus size={20} />
                      </button>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {jobTitles.map(title => (
                          <div key={title} className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm group border border-slate-100">
                              <span>{title}</span>
                              <button 
                                  onClick={() => handleRemoveJobTitle(title)}
                                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remover Cargo"
                              >
                                  <X size={14} />
                              </button>
                          </div>
                      ))}
                  </div>
              </Card>
          </div>

          {/* Coluna 2: Usuários e Controle de Acesso */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* === CARD DE GESTÃO DE ACESSO (NOVO) === */}
              <Card className="border-t-4 border-t-red-600 bg-white">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <Lock size={20} className="text-red-600"/> Gestão de Acesso e Manutenção
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">Bloqueie módulos para manutenção geral ou restrinja o acesso a cargos específicos.</p>
                  
                  <div className="border rounded-lg overflow-hidden border-slate-200">
                      <div className="grid grid-cols-12 bg-slate-50 p-3 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                          <div className="col-span-6">Módulo</div>
                          <div className="col-span-3 text-center">Status Global</div>
                          <div className="col-span-3 text-center">Restrições</div>
                      </div>
                      
                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto custom-scrollbar">
                          {menuItemsOrder.map((module) => {
                              const blocks = blockedModules[module.id] || [];
                              const isAllBlocked = blocks.includes('ALL');
                              const restrictedRolesCount = blocks.filter(b => b !== 'ALL').length;
                              
                              return (
                                  <div key={module.id} className="text-sm">
                                      <div className={`grid grid-cols-12 p-3 items-center hover:bg-slate-50 transition-colors ${isAllBlocked ? 'bg-red-50/50' : ''}`}>
                                          <div className="col-span-6 font-medium text-slate-800 flex items-center gap-2">
                                              {isAllBlocked ? <Lock size={14} className="text-red-500"/> : <div className="w-3.5"/>}
                                              {module.label}
                                          </div>
                                          
                                          <div className="col-span-3 flex justify-center">
                                              <button 
                                                  onClick={() => toggleMaintenanceMode(module.id)}
                                                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                                                      isAllBlocked 
                                                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                  }`}
                                              >
                                                  {isAllBlocked ? 'MANUTENÇÃO' : 'ATIVO'}
                                              </button>
                                          </div>
                                          
                                          <div className="col-span-3 flex justify-center">
                                              <button 
                                                  onClick={() => setOpenAccessModule(openAccessModule === module.id ? null : module.id)}
                                                  className={`text-xs flex items-center gap-1 hover:underline ${restrictedRolesCount > 0 ? 'text-orange-600 font-bold' : 'text-slate-400'}`}
                                              >
                                                  {restrictedRolesCount > 0 ? `${restrictedRolesCount} cargo(s)` : 'Nenhuma'}
                                                  {openAccessModule === module.id ? <ArrowUp size={10}/> : <ArrowDown size={10}/>}
                                              </button>
                                          </div>
                                      </div>
                                      
                                      {/* Expanded Area for Role Selection */}
                                      {openAccessModule === module.id && (
                                          <div className="bg-slate-50 p-4 border-t border-b border-slate-200 animate-in slide-in-from-top-2">
                                              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Bloquear acesso para os cargos:</p>
                                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                  {jobTitles.map(role => (
                                                      <label key={role} className="flex items-center gap-2 text-xs cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-slate-300">
                                                          <input 
                                                              type="checkbox"
                                                              checked={blocks.includes(role)}
                                                              onChange={() => toggleRoleBlock(module.id, role)}
                                                              className="rounded text-red-600 focus:ring-red-500"
                                                          />
                                                          <span className={blocks.includes(role) ? 'text-red-700 font-medium' : 'text-slate-600'}>
                                                              {role}
                                                          </span>
                                                      </label>
                                                  ))}
                                              </div>
                                              <p className="text-[10px] text-slate-400 mt-2 italic">* Administradores nunca são bloqueados.</p>
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                      <Button onClick={handleSaveConfig} className="bg-red-600 hover:bg-red-700 text-white">
                          <Save size={16} /> Salvar Regras de Acesso
                      </Button>
                  </div>
              </Card>

              {/* Formulário de Cadastro */}
              <Card className="border-t-4 border-t-slate-800">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <UserPlus size={20} className="text-slate-700"/> Adicionar Usuário
                  </h3>
                  <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                          label="Usuário (Login)" 
                          value={newUser.username}
                          onChange={e => setNewUser({...newUser, username: e.target.value})}
                          required
                      />
                      <Input 
                          label="Nome Completo" 
                          value={newUser.name}
                          onChange={e => setNewUser({...newUser, name: e.target.value})}
                          required
                      />
                      <Input 
                          label="E-mail" 
                          type="email" 
                          value={newUser.email}
                          onChange={e => setNewUser({...newUser, email: e.target.value})}
                          required
                      />
                      
                      <Input 
                          label="WhatsApp (com DDD)" 
                          placeholder="Ex: 5591988887777"
                          value={newUser.whatsapp}
                          onChange={e => setNewUser({...newUser, whatsapp: e.target.value})}
                      />
                      
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Cargo / Função</label>
                          <select 
                              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                              value={newUser.jobTitle}
                              onChange={e => setNewUser({...newUser, jobTitle: e.target.value})}
                          >
                              {jobTitles.map(title => (
                                  <option key={title} value={title}>{title}</option>
                              ))}
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Acesso (Role)</label>
                          <select 
                              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                              value={newUser.role}
                              onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                          >
                              <option value="USER">Usuário Comum</option>
                              <option value="ADMIN">Administrador</option>
                          </select>
                      </div>

                      <Input 
                          label="Senha" 
                          type="password"
                          value={newUser.password}
                          onChange={e => setNewUser({...newUser, password: e.target.value})}
                          required
                      />
                      
                      <div className="md:col-span-2">
                          <Button type="submit" disabled={loading} className="w-full">
                              {loading ? 'Criando...' : 'Criar Usuário'}
                          </Button>
                      </div>
                  </form>
              </Card>

              {/* Lista de Usuários */}
              <Card>
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                          <Users size={20} className="text-slate-700"/> Usuários Cadastrados
                      </h3>
                      <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                          Total: {users.length}
                      </span>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="min-w-full bg-white">
                          <thead className="bg-slate-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usuário</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cargo</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acesso</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                              {users.map((user) => (
                                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center">
                                              <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 uppercase overflow-hidden">
                                                  {user.photoUrl ? (
                                                      <img src={user.photoUrl} alt="Av" className="w-full h-full object-cover" />
                                                  ) : (
                                                      user.name.substring(0,2)
                                                  )}
                                              </div>
                                              <div className="ml-4">
                                                  <div className="text-sm font-medium text-slate-900">{user.username}</div>
                                                  <div className="text-xs text-slate-500">{user.email}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <span className="text-sm text-slate-700 font-medium">
                                              {user.jobTitle || '-'}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                              user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                          }`}>
                                              {user.role === 'ADMIN' ? <span className="flex items-center gap-1"><Shield size={10}/> ADMIN</span> : 'USUÁRIO'}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                          <div className="flex justify-end gap-2">
                                              <button 
                                                  onClick={() => setEditingUser(user)}
                                                  className="text-blue-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full"
                                                  title="Editar Usuário"
                                              >
                                                  <Pencil size={18} />
                                              </button>
                                              
                                              {/* Botão de Excluir visível para todos (exceto admin e eu mesmo) */}
                                              {user.id !== 'admin-id' && user.id !== currentUser?.id && (
                                                  <button 
                                                      onClick={() => handleDelete(user.id)}
                                                      className="text-red-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
                                                      title="Excluir Usuário"
                                                  >
                                                      <Trash2 size={18} />
                                                  </button>
                                              )}
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </Card>
          </div>
      </div>

      {/* Modal de Edição */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Pencil size={24} className="text-yellow-500" /> Editar Usuário
                    </h3>
                    <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Nome Completo" 
                            value={editingUser.name} 
                            onChange={e => setEditingUser({...editingUser, name: e.target.value})} 
                        />
                         <Input 
                            label="Usuário (Login)" 
                            value={editingUser.username} 
                            readOnly
                            className="bg-slate-100 cursor-not-allowed text-slate-500"
                        />
                    </div>

                    <Input 
                        label="E-mail" 
                        value={editingUser.email} 
                        onChange={e => setEditingUser({...editingUser, email: e.target.value})} 
                    />
                    
                    <Input 
                        label="WhatsApp (com DDD)" 
                        value={editingUser.whatsapp || ''} 
                        placeholder="Ex: 5591988887777"
                        onChange={e => setEditingUser({...editingUser, whatsapp: e.target.value})} 
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cargo / Função</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                            value={editingUser.jobTitle}
                            onChange={e => setEditingUser({...editingUser, jobTitle: e.target.value})}
                        >
                            {jobTitles.map(title => (
                                <option key={title} value={title}>{title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Acesso</label>
                          <select 
                              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                              value={editingUser.role}
                              onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                          >
                              <option value="USER">Usuário Comum</option>
                              <option value="ADMIN">Administrador</option>
                          </select>
                    </div>

                    <Input 
                        label="Alterar Senha" 
                        type="text"
                        value={editingUser.password} 
                        onChange={e => setEditingUser({...editingUser, password: e.target.value})} 
                    />

                    <div className="flex gap-3 mt-6 pt-4 border-t">
                        <Button type="button" variant="secondary" onClick={() => setEditingUser(null)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                            <Save size={18} /> Salvar Alterações
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
      )}
    </div>
  );
};
