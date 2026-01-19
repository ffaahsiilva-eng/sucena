
import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, FileInput } from '../ui/Shared';
import { InspectionRecord, Notification, ModuleType } from '../../types';
import { Plus, Calendar, CheckSquare, Camera, User, Loader2, Printer, FileText, ImagePlus, X, User as UserIcon, Trash2, Bell, UserPlus } from 'lucide-react';
import { PhotoService } from '../../services/photoService';
import { AuthService, User as UserType } from '../../services/authService';
import { StorageService } from '../../services/storageService';

export const InspectionSheet: React.FC = () => {
  const [tasks, setTasks] = useState<InspectionRecord[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<string | null>(null);
  const [taskToPrint, setTaskToPrint] = useState<InspectionRecord | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Logo personalizada para impressão (Carregada globalmente)
  const [printLogo, setPrintLogo] = useState<string | null>(null);

  // States para menção
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const [mentionSelectValue, setMentionSelectValue] = useState('');
  
  // State para Fotos Iniciais (na criação)
  const [tempInitialPhotos, setTempInitialPhotos] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<InspectionRecord>>({
    role: 'Encarregado Geral',
    task: '',
    deadline: '',
    requester: ''
  });

  useEffect(() => {
    // Carregar do Storage
    const loaded = StorageService.getGeneric(StorageService.KEYS.INSPECTION) as InspectionRecord[];
    setTasks(loaded);

    const user = AuthService.getCurrentUser();
    if (user) {
        setCurrentUser(user);
        if (user.role === 'ADMIN') setIsAdmin(true);
    }
    
    // Carregar lista de usuários para menção
    const allUsers = AuthService.getUsers();
    setAvailableUsers(allUsers);

    // Carregar logo global
    const config = StorageService.getAppConfig();
    if (config?.logoUrl) {
        setPrintLogo(config.logoUrl);
    }
  }, []);

  const roles = [
    'Encarregado Geral',
    'Encarregado',
    'Técnico Meio Ambiente',
    'Técnico de Segurança'
  ];

  const handleDelete = (id: string) => {
      if (window.confirm("Admin: Tem certeza que deseja excluir esta vistoria?")) {
          const updated = StorageService.deleteItem(StorageService.KEYS.INSPECTION, id);
          setTasks(updated);
      }
  };

  const handleAddMention = () => {
      if (mentionSelectValue && !selectedMentions.includes(mentionSelectValue)) {
          setSelectedMentions([...selectedMentions, mentionSelectValue]);
          setMentionSelectValue('');
      }
  };

  const handleRemoveMention = (username: string) => {
      setSelectedMentions(selectedMentions.filter(u => u !== username));
  };

  const handleInitialPhotoUpload = (url: string) => {
      setTempInitialPhotos([...tempInitialPhotos, url]);
  };
  
  const handleRemoveInitialPhoto = (index: number) => {
      setTempInitialPhotos(tempInitialPhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.task && formData.deadline && formData.requester) {
      const newTask: InspectionRecord = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        role: formData.role as any,
        task: formData.task!,
        deadline: formData.deadline!,
        requester: formData.requester!,
        completed: false,
        correctionPhotoUrls: [],
        photoUrls: tempInitialPhotos, // Fotos do contexto/solicitação
        createdBy: currentUser?.username || 'Sistema',
        authorName: currentUser?.name || 'Anônimo',
        authorRole: currentUser?.jobTitle || 'N/A',
        mentionedUsers: selectedMentions
      };
      
      StorageService.addGeneric(StorageService.KEYS.INSPECTION, newTask);
      
      // Criar notificações para usuários mencionados
      selectedMentions.forEach(username => {
            const notif: Notification = {
                id: Date.now().toString() + Math.random(),
                userId: username,
                message: `Você foi mencionado em uma Ficha de Vistoria por ${currentUser?.name}: "${formData.task?.substring(0, 30)}..."`,
                read: false,
                createdAt: new Date().toISOString(),
                type: 'MENTION',
                targetModule: ModuleType.INSPECTION
            };
            StorageService.addNotification(notif);
      });

      setTasks([newTask, ...tasks]);
      setFormData({ ...formData, task: '', deadline: '', requester: '' });
      setSelectedMentions([]);
      setTempInitialPhotos([]);
    }
  };

  const handleAddPhotoToTask = (id: string, photoUrl: string) => {
    const updatedTasks = tasks.map(t => {
        if (t.id === id) {
            const currentPhotos = t.correctionPhotoUrls || (t.correctionPhotoUrl ? [t.correctionPhotoUrl] : []);
            return { 
                ...t, 
                completed: true, 
                correctionPhotoUrls: [...currentPhotos, photoUrl],
                correctionPhotoUrl: photoUrl // Legacy support
            };
        }
        return t;
    });
    setTasks(updatedTasks);
    // Atualizar no storage
    StorageService.save(StorageService.KEYS.INSPECTION, updatedTasks);
    setLoadingTasks(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoadingTasks(taskId);
      try {
        const user = AuthService.getCurrentUser();
        const createdBy = user ? user.username : 'Sistema';
        const authorName = user ? user.name : 'Anônimo';
        const authorRole = user ? user.jobTitle : 'N/A';

        // Salvar com categoria INSPECTION
        const base64 = await PhotoService.savePhoto(file, createdBy, authorName, authorRole, 'INSPECTION');
        handleAddPhotoToTask(taskId, base64);
      } catch (err) {
        console.error("Failed to save photo", err);
        setLoadingTasks(null);
      }
    }
  };

  const handlePrint = (task: InspectionRecord) => {
    setTaskToPrint(task);
    setTimeout(() => {
        window.print();
    }, 100);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Encarregado Geral': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Encarregado': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Técnico Meio Ambiente': return 'bg-green-100 text-green-700 border-green-200';
      case 'Técnico de Segurança': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCorrectionPhotos = (task: InspectionRecord) => {
      if (task.correctionPhotoUrls && task.correctionPhotoUrls.length > 0) {
          return task.correctionPhotoUrls;
      }
      if (task.correctionPhotoUrl) {
          return [task.correctionPhotoUrl];
      }
      return [];
  };

  return (
    <div className="space-y-6">
      {/* Template de Impressão (Visível apenas na impressão) */}
      {taskToPrint && (
        <div className="print-only font-sans text-black">
            <div className="border-2 border-black p-8 h-full flex flex-col justify-between">
                <div>
                    {/* Cabeçalho */}
                    <div className="flex items-center justify-between border-b-2 border-black pb-6 mb-8">
                        <div className="flex items-center gap-4">
                            {/* Logo Dinâmica */}
                            <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                                {printLogo ? (
                                    <img src={printLogo} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-100 border border-black flex items-center justify-center">
                                        <span className="font-bold text-3xl">S</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold uppercase tracking-wide">Sucena Empreendimentos</h1>
                                <p className="text-sm uppercase">Ficha de Vistoria e Controle Operacional</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">Controle Nº: {taskToPrint.id.slice(-6)}</p>
                            <p className="text-sm">Data Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                            <p className="text-xs mt-1">Criado por: {taskToPrint.authorName} - {taskToPrint.authorRole}</p>
                        </div>
                    </div>

                    {/* Dados da Vistoria */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold bg-gray-200 p-2 border border-black mb-4 uppercase text-center">Dados da Solicitação</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="border border-black p-3">
                                <span className="block font-bold text-gray-600 uppercase text-xs">Função Responsável</span>
                                <span className="text-lg">{taskToPrint.role}</span>
                            </div>
                            <div className="border border-black p-3">
                                <span className="block font-bold text-gray-600 uppercase text-xs">Solicitante</span>
                                <span className="text-lg">{taskToPrint.requester}</span>
                            </div>
                            <div className="border border-black p-3">
                                <span className="block font-bold text-gray-600 uppercase text-xs">Data Limite</span>
                                <span className="text-lg">{new Date(taskToPrint.deadline).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="border border-black p-3">
                                <span className="block font-bold text-gray-600 uppercase text-xs">Status Atual</span>
                                <span className="text-lg">{taskToPrint.completed ? 'CONCLUÍDO' : 'PENDENTE'}</span>
                            </div>
                            <div className="col-span-2 border border-black p-3">
                                <span className="block font-bold text-gray-600 uppercase text-xs">Descrição da Tarefa / Vistoria</span>
                                <p className="text-lg mt-1">{taskToPrint.task}</p>
                            </div>
                        </div>
                    </div>

                    {/* Fotos Iniciais (se houver) */}
                    {taskToPrint.photoUrls && taskToPrint.photoUrls.length > 0 && (
                        <div className="mb-6">
                             <h2 className="text-xl font-bold bg-gray-200 p-2 border border-black mb-4 uppercase text-center">Fotos da Solicitação</h2>
                             <div className="border border-black p-4 bg-gray-50 grid grid-cols-2 gap-4">
                                  {taskToPrint.photoUrls.map((url, idx) => (
                                      <div key={idx} className="border border-gray-300 p-1 bg-white">
                                          <img src={url} alt={`Solicitação ${idx}`} className="w-full h-48 object-contain" />
                                      </div>
                                  ))}
                             </div>
                        </div>
                    )}
                    
                    {/* Usuários Mencionados na Impressão */}
                    {taskToPrint.mentionedUsers && taskToPrint.mentionedUsers.length > 0 && (
                        <div className="mb-6 border border-black p-3">
                             <span className="block font-bold text-gray-600 uppercase text-xs">Notificados / Envolvidos</span>
                             <div className="flex gap-2 flex-wrap mt-1">
                                 {taskToPrint.mentionedUsers.map(u => {
                                      const userObj = availableUsers.find(au => au.username === u);
                                      return (
                                          <span key={u} className="text-sm border border-gray-400 px-2 rounded">
                                              {userObj?.name || u}
                                          </span>
                                      );
                                 })}
                             </div>
                        </div>
                    )}

                    {/* Evidências (Execução) */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold bg-gray-200 p-2 border border-black mb-4 uppercase text-center">Evidências da Execução</h2>
                        <div className="border border-black p-4 min-h-[250px] bg-gray-50">
                            {getCorrectionPhotos(taskToPrint).length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {getCorrectionPhotos(taskToPrint).map((url, idx) => (
                                        <div key={idx} className="border border-gray-300 p-1 bg-white">
                                            <img 
                                                src={url} 
                                                alt={`Evidência ${idx + 1}`} 
                                                className="w-full h-48 object-contain"
                                            />
                                            <p className="text-xs text-center mt-1 text-gray-500">Foto {idx + 1}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 py-12">
                                    <p className="mb-2">Nenhuma evidência fotográfica anexada na conclusão.</p>
                                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 mx-auto mt-4"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Termo e Assinaturas */}
                <div className="mt-auto pt-4">
                     <div className="mb-8 px-4">
                         <h3 className="font-bold text-sm uppercase mb-2 border-b border-gray-300 pb-1">Termo de Compromisso</h3>
                         <p className="text-xs text-justify leading-relaxed">
                             Declaro ter realizado a inspeção dos itens acima descritos, verificando as condições de segurança e operacionais conforme as normas e procedimentos estabelecidos pela Sucena Empreendimentos. 
                             Garanto que as informações prestadas neste documento são verdadeiras e que as evidências fotográficas correspondem à realidade do local e momento da vistoria. 
                             Comprometo-me a reportar imediatamente quaisquer anomalias ou riscos não mitigados identificados durante a execução desta atividade.
                         </p>
                     </div>

                     <div className="grid grid-cols-2 gap-12">
                         <div className="text-center">
                             <div className="border-b border-black mb-2 h-8"></div>
                             <p className="font-bold uppercase">{taskToPrint.role}</p>
                             <p className="text-xs text-gray-500">Responsável pela Atividade</p>
                         </div>
                         <div className="text-center">
                             <div className="border-b border-black mb-2 h-8"></div>
                             <p className="font-bold uppercase">{taskToPrint.requester}</p>
                             <p className="text-xs text-gray-500">Solicitante</p>
                         </div>
                     </div>
                     <div className="text-center mt-8 text-xs text-gray-400">
                        Documento gerado eletronicamente pelo sistema PainelSucena em {new Date().toLocaleString('pt-BR')}
                     </div>
                </div>
            </div>
        </div>
      )}

      {/* Interface Normal (no-print) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Formulário de Criação */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
               <Plus className="text-accent" /> Nova Vistoria
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Função Responsável</label>
                <select
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-accent outline-none"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <Input 
                label="Solicitante" 
                placeholder="Nome de quem solicitou" 
                value={formData.requester} 
                onChange={e => setFormData({ ...formData, requester: e.target.value })} 
                required
              />

              <Input 
                label="Tarefa / Vistoria" 
                placeholder="Descreva o que deve ser vistoriado..." 
                value={formData.task} 
                onChange={e => setFormData({ ...formData, task: e.target.value })} 
                required
              />

              <Input 
                label="Previsão de Entrega" 
                type="date" 
                value={formData.deadline} 
                onChange={e => setFormData({ ...formData, deadline: e.target.value })} 
                required
              />

              {/* Área de Menção de Usuários */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                   <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                       <Bell size={14} className="text-yellow-600"/> Mencionar / Notificar
                   </label>
                   <div className="flex gap-2 mb-2">
                       <select 
                           className="flex-1 p-2 border rounded text-sm w-full outline-none"
                           value={mentionSelectValue}
                           onChange={e => setMentionSelectValue(e.target.value)}
                       >
                           <option value="">Selecione...</option>
                           {availableUsers.map(u => (
                               <option key={u.username} value={u.username}>
                                   {u.name} ({u.jobTitle})
                               </option>
                           ))}
                       </select>
                       <button 
                           type="button" 
                           onClick={handleAddMention}
                           className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 rounded"
                           disabled={!mentionSelectValue}
                       >
                           <UserPlus size={18} />
                       </button>
                   </div>
                   
                   {/* Lista de Selecionados */}
                   {selectedMentions.length > 0 && (
                       <div className="flex flex-wrap gap-2">
                           {selectedMentions.map(username => {
                               const userObj = availableUsers.find(u => u.username === username);
                               return (
                                   <div key={username} className="bg-white border border-slate-300 rounded-full px-3 py-1 text-xs flex items-center gap-2 shadow-sm">
                                       <span className="font-bold">{userObj?.name || username}</span>
                                       <button 
                                          type="button" 
                                          onClick={() => handleRemoveMention(username)}
                                          className="text-red-400 hover:text-red-600"
                                       >
                                           <X size={12} />
                                       </button>
                                   </div>
                               );
                           })}
                       </div>
                   )}
              </div>

              {/* Upload Múltiplo para a Solicitação */}
              <div>
                   <FileInput 
                       label="Fotos do Local/Solicitação" 
                       onImageUploaded={handleInitialPhotoUpload}
                       category="INSPECTION" 
                   />
                   {tempInitialPhotos.length > 0 && (
                       <div className="grid grid-cols-3 gap-2 mt-2">
                           {tempInitialPhotos.map((url, idx) => (
                               <div key={idx} className="relative group aspect-square">
                                   <img src={url} alt={`Temp ${idx}`} className="w-full h-full object-cover rounded border border-slate-200" />
                                   <button
                                       type="button"
                                       onClick={() => handleRemoveInitialPhoto(idx)}
                                       className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                   >
                                       <Trash2 size={12} />
                                   </button>
                               </div>
                           ))}
                       </div>
                   )}
              </div>

              <Button type="submit" className="w-full">
                Adicionar Vistoria
              </Button>
            </form>
          </Card>
        </div>

        {/* Lista de Vistorias */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-700">Tarefas Agendadas</h3>
          </div>
          
          {tasks.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-400">Nenhuma vistoria pendente.</p>
              </div>
          )}

          {tasks.map(task => {
              const correctionPhotos = getCorrectionPhotos(task);
              return (
                <div 
                  key={task.id} 
                  className={`bg-white rounded-lg border p-4 transition-all relative ${task.completed ? 'border-green-200 bg-green-50' : 'border-slate-200 shadow-sm hover:shadow-md'}`}
                >
                  {isAdmin && (
                        <button 
                            onClick={() => handleDelete(task.id)}
                            className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
                            title="Admin: Excluir"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3 pr-6">
                     <div className="flex gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(task.role)} flex items-center gap-1`}>
                            <User size={12} /> {task.role}
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-600 border-slate-200">
                            Solic: {task.requester}
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500 mr-2">
                            <Calendar size={14} className={new Date(task.deadline) < new Date() && !task.completed ? "text-red-500" : ""} />
                            <span className={new Date(task.deadline) < new Date() && !task.completed ? "text-red-600 font-bold" : ""}>
                                {new Date(task.deadline).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                        <button 
                            onClick={() => handlePrint(task)}
                            className="flex items-center gap-1 p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-slate-200 transition-colors"
                            title="Baixar/Imprimir Ficha para Campo"
                        >
                            <Printer size={16} /> <span className="text-xs font-bold hidden sm:inline">Imprimir</span>
                        </button>
                     </div>
                  </div>

                  <div className="mb-2">
                     <h4 className={`text-lg font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {task.task}
                     </h4>
                  </div>

                  {/* Fotos da Solicitação (Contexto) */}
                  {task.photoUrls && task.photoUrls.length > 0 && (
                      <div className="mb-3">
                          <p className="text-xs text-slate-500 mb-1">Fotos da Solicitação:</p>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                              {task.photoUrls.map((url, idx) => (
                                  <img 
                                    key={idx} 
                                    src={url} 
                                    alt="Solicitação" 
                                    className="w-16 h-16 object-cover rounded border border-slate-200 cursor-pointer" 
                                    onClick={() => window.open(url, '_blank')}
                                  />
                              ))}
                          </div>
                      </div>
                  )}

                  {/* Usuários Mencionados */}
                  {task.mentionedUsers && task.mentionedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                           {task.mentionedUsers.map(u => {
                               const userObj = availableUsers.find(au => au.username === u);
                               return (
                                   <div key={u} className="flex items-center gap-1 text-[10px] bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full font-bold">
                                       <Bell size={10} />
                                       {userObj?.name || u}
                                   </div>
                               );
                           })}
                      </div>
                  )}

                  {/* Área de Execução / Fotos de Correção */}
                  <div className="border-t pt-3">
                      {correctionPhotos.length > 0 && (
                          <div className="mb-2">
                               <p className="text-xs text-slate-500 mb-1">Evidências de Execução:</p>
                               <div className="flex gap-2 overflow-x-auto pb-2">
                                    {correctionPhotos.map((url, idx) => (
                                        <div key={idx} className="relative w-16 h-16 shrink-0 group">
                                            <img src={url} alt="Execução" className="w-full h-full object-cover rounded border border-slate-300 cursor-pointer" onClick={() => window.open(url, '_blank')} />
                                        </div>
                                    ))}
                               </div>
                          </div>
                      )}
                      
                      <div className="flex items-center gap-4 w-full">
                           <div className="flex-1">
                               <label className={`flex items-center justify-center w-full p-2 bg-slate-50 rounded-lg border border-dashed border-slate-300 cursor-pointer hover:bg-slate-100 transition-colors ${loadingTasks === task.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                  <span className="flex items-center gap-2 text-sm text-slate-600">
                                     {loadingTasks === task.id ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                                     {loadingTasks === task.id ? 'Salvando...' : 'Adicionar Evidência de Execução'}
                                  </span>
                                  <input 
                                     type="file" 
                                     className="hidden" 
                                     accept="image/*"
                                     disabled={loadingTasks === task.id}
                                     onChange={(e) => handleFileUpload(e, task.id)} 
                                   />
                               </label>
                           </div>
                           
                           {task.completed && (
                               <div className="flex items-center gap-2 text-green-700 font-bold bg-white px-3 py-2 rounded-lg border border-green-200 shadow-sm shrink-0">
                                  <CheckSquare size={18} /> <span className="hidden sm:inline">Concluído</span>
                               </div>
                           )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/50 text-xs text-slate-500 flex items-center gap-1 justify-end">
                            <UserIcon size={12} /> Enviado por: 
                            <span className="font-bold text-slate-700">{task.authorName || task.createdBy || 'Anônimo'}</span>
                            {task.authorRole && <span className="bg-slate-100 px-1 rounded text-slate-500">- {task.authorRole}</span>}
                      </div>
                  </div>
                </div>
              );
          })}
        </div>
      </div>
    </div>
  );
};
