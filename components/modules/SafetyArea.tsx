
import React, { useState, useEffect } from 'react';
import { Card, AITextArea, Button, Input } from '../ui/Shared';
import { SafetyRecord, Notification, ModuleType } from '../../types';
import { analyzeSafetyRisk } from '../../services/geminiService';
import { AlertTriangle, CheckCircle, Shield, User, Trash2, UserPlus, X, Bell } from 'lucide-react';
import { AuthService, User as UserType } from '../../services/authService';
import { StorageService } from '../../services/storageService';

export const SafetyArea: React.FC = () => {
  const [records, setRecords] = useState<SafetyRecord[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // States para menção de usuários
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]); // Usernames
  const [mentionSelectValue, setMentionSelectValue] = useState('');

  const [formData, setFormData] = useState<Partial<SafetyRecord>>({
    type: 'RISK',
    description: '',
    riskLevel: 'MEDIUM',
    actionTaken: ''
  });

  useEffect(() => {
      // Carregar dados
      const loaded = StorageService.getGeneric(StorageService.KEYS.SAFETY) as SafetyRecord[];
      setRecords(loaded);

      // Carregar usuário atual
      const user = AuthService.getCurrentUser();
      if (user) {
          setCurrentUser(user);
          if (user.role === 'ADMIN') setIsAdmin(true);
      }

      // Carregar lista de usuários para menção
      const allUsers = AuthService.getUsers();
      setAvailableUsers(allUsers);
  }, []);

  const handleDelete = (id: string) => {
      if (window.confirm("Admin: Tem certeza que deseja excluir este registro de segurança?")) {
          const updated = StorageService.deleteItem(StorageService.KEYS.SAFETY, id);
          setRecords(updated);
      }
  };

  const handleAnalyze = async () => {
     if (!formData.description) return;
     setLoadingAI(true);
     const result = await analyzeSafetyRisk(formData.description);
     setFormData(prev => ({
         ...prev,
         riskLevel: result.riskLevel as any,
         actionTaken: result.suggestion
     }));
     setLoadingAI(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.description) {
        const newRecord = { 
            ...formData, 
            id: Date.now().toString(), 
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.username || 'Sistema',
            authorName: currentUser?.name || 'Anônimo',
            authorRole: currentUser?.jobTitle || 'N/A',
            mentionedUsers: selectedMentions
        } as SafetyRecord;

        StorageService.addGeneric(StorageService.KEYS.SAFETY, newRecord);
        
        // Criar notificações para usuários mencionados
        selectedMentions.forEach(username => {
            const notif: Notification = {
                id: Date.now().toString() + Math.random(),
                userId: username,
                message: `Você foi mencionado em um registro de Segurança por ${currentUser?.name}: "${formData.description?.substring(0, 30)}..."`,
                read: false,
                createdAt: new Date().toISOString(),
                type: 'MENTION',
                targetModule: ModuleType.SAFETY
            };
            StorageService.addNotification(notif);
        });

        setRecords([newRecord, ...records]);
        setFormData({ type: 'RISK', description: '', riskLevel: 'MEDIUM', actionTaken: '' });
        setSelectedMentions([]);
    }
  };

  // Helper para nome do risco na UI
  const getRiskLabel = (level: string) => {
      switch(level) {
          case 'LOW': return 'Baixo';
          case 'MEDIUM': return 'Médio';
          case 'HIGH': return 'Alto';
          default: return level;
      }
  };

  // Helper para traduzir o Tipo
  const getTypeLabel = (type: string) => {
      switch(type) {
          case 'INSPECTION': return 'Inspeção de Rotina';
          case 'RISK': return 'Situação de Risco';
          case 'COMMUNICATION': return 'Comunicado';
          default: return type;
      }
  };

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-orange-500">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Shield className="text-orange-500"/> Registro de Segurança</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-1">Tipo de Registro</label>
                 <select 
                    className="w-full p-2 border rounded-md"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                 >
                    <option value="INSPECTION">Inspeção de Rotina</option>
                    <option value="RISK">Situação de Risco</option>
                    <option value="COMMUNICATION">Comunicado</option>
                 </select>
               </div>
               
               <div>
                 <label className="block text-sm font-medium mb-1">Nível de Risco</label>
                 <select 
                    className={`w-full p-2 border rounded-md font-bold ${
                        formData.riskLevel === 'HIGH' ? 'text-red-600 border-red-200 bg-red-50' : 
                        formData.riskLevel === 'MEDIUM' ? 'text-orange-600 border-orange-200 bg-orange-50' : 
                        'text-green-600 border-green-200 bg-green-50'
                    }`}
                    value={formData.riskLevel}
                    onChange={e => setFormData({...formData, riskLevel: e.target.value as any})}
                 >
                    <option value="LOW">Baixo</option>
                    <option value="MEDIUM">Médio</option>
                    <option value="HIGH">Alto</option>
                 </select>
               </div>
           </div>
           
           <div className="relative">
             <AITextArea 
                label="Descrição do Ocorrido / Risco" 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
             />
             <button 
                type="button"
                onClick={handleAnalyze}
                disabled={loadingAI || !formData.description}
                className="absolute top-0 right-0 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 transition-colors"
             >
                {loadingAI ? 'Analisando...' : 'Analisar Risco com IA'}
             </button>
           </div>

           <Input 
                 label="Ação Corretiva (Sugerida)"
                 value={formData.actionTaken}
                 onChange={e => setFormData({...formData, actionTaken: e.target.value})}
           />

           {/* Área de Menção de Usuários */}
           <div className="bg-slate-50 p-3 rounded border border-slate-200">
               <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                   <Bell size={14} className="text-yellow-600"/> Notificar / Mencionar Usuários
               </label>
               <div className="flex gap-2 mb-2">
                   <select 
                       className="flex-1 p-2 border rounded text-sm"
                       value={mentionSelectValue}
                       onChange={e => setMentionSelectValue(e.target.value)}
                   >
                       <option value="">Selecione um usuário...</option>
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
                                   <span className="text-slate-400">| {userObj?.jobTitle}</span>
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

           <Button type="submit" variant="danger" className="w-full">Registrar Ocorrência & Notificar</Button>
        </form>
      </Card>

      <div className="grid gap-4">
         {records.map(rec => (
             <div key={rec.id} className={`relative p-4 rounded-lg border flex flex-col gap-2 ${rec.riskLevel === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                {isAdmin && (
                    <button 
                        onClick={() => handleDelete(rec.id)}
                        className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1"
                        title="Admin: Excluir"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
                <div className="flex items-start gap-4 pr-6">
                    {rec.riskLevel === 'HIGH' ? <AlertTriangle className="text-red-500 shrink-0" /> : <CheckCircle className="text-green-500 shrink-0" />}
                    <div className="flex-1">
                       <div className="flex justify-between items-start">
                           <h4 className="font-bold text-slate-800">{getTypeLabel(rec.type)}</h4>
                           <span className={`text-xs font-bold px-2 py-1 rounded border uppercase ${
                                rec.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700 border-red-200' : 
                                rec.riskLevel === 'MEDIUM' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                                'bg-green-100 text-green-700 border-green-200'
                           }`}>Risco {getRiskLabel(rec.riskLevel)}</span>
                       </div>
                       <p className="text-xs text-slate-400 mb-2">{new Date(rec.createdAt).toLocaleDateString()} - {new Date(rec.createdAt).toLocaleTimeString()}</p>
                       
                       <p className="text-slate-600 my-2 bg-white/50 p-2 rounded border border-transparent hover:border-slate-200 transition-colors">
                           {rec.description}
                       </p>
                       
                       <p className="text-sm font-medium text-slate-500 border-l-2 border-slate-300 pl-2">
                           Ação: {rec.actionTaken}
                       </p>

                       {rec.mentionedUsers && rec.mentionedUsers.length > 0 && (
                           <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                               <Bell size={12} className="text-yellow-600" />
                               <span>Notificados: </span>
                               {rec.mentionedUsers.map(u => {
                                   const name = availableUsers.find(au => au.username === u)?.name || u;
                                   return <span key={u} className="font-bold text-slate-700 bg-slate-100 px-1 rounded">{name}</span>
                               })}
                           </div>
                       )}
                    </div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-slate-200/50 text-xs text-slate-500 flex items-center gap-1 justify-end">
                    <User size={12} /> Enviado por: 
                    <span className="font-bold text-slate-700">{rec.authorName || rec.createdBy || 'Anônimo'}</span>
                    {rec.authorRole && <span className="bg-slate-100 px-1 rounded text-slate-500">- {rec.authorRole}</span>}
                </div>
             </div>
         ))}
      </div>
    </div>
  );
};
