
import React, { useState, useEffect } from 'react';
import { Card, Input, AITextArea, Button } from '../ui/Shared';
import { ReminderRecord, Notification, ModuleType, ReminderVisibility } from '../../types';
import { StorageService } from '../../services/storageService';
import { AuthService, User } from '../../services/authService';
import { Calendar, Plus, Trash2, StickyNote, Bell, Eye, Lock, Users, Briefcase } from 'lucide-react';

export const Reminders: React.FC = () => {
    const [reminders, setReminders] = useState<ReminderRecord[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [jobTitles, setJobTitles] = useState<string[]>([]);

    const [formData, setFormData] = useState<Partial<ReminderRecord>>({
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        visibility: 'ME',
        targetRoles: [],
        mentionedUser: ''
    });

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
        
        // Carregar usuários e cargos
        setAvailableUsers(AuthService.getUsers());
        setJobTitles(StorageService.getJobTitles());

        if (user) {
            loadReminders(user.username, user.jobTitle);
        }
    }, []);

    const loadReminders = (username: string, userRole: string) => {
        const all = StorageService.getReminders();
        
        // Filtra lembretes baseados na visibilidade
        const myReminders = all.filter(r => {
            // 1. Eu criei (sempre vejo)
            if (r.createdBy === username) return true;

            // 2. Visibilidade "TODOS"
            if (r.visibility === 'ALL') return true;

            // 3. Visibilidade "CARGOS" (e eu tenho o cargo)
            if (r.visibility === 'ROLES' && r.targetRoles?.includes(userRole)) return true;

            // 4. Visibilidade "USUÁRIO" (e eu sou o mencionado) - incluindo suporte a legado
            if ((r.visibility === 'USER' || !r.visibility) && r.mentionedUser === username) return true;

            return false;
        });
        
        // Ordena por data (mais próximo primeiro)
        myReminders.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setReminders(myReminders);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Excluir este lembrete?")) {
            StorageService.deleteItem(StorageService.KEYS.REMINDERS, id);
            if (currentUser) loadReminders(currentUser.username, currentUser.jobTitle);
        }
    };

    const toggleTargetRole = (role: string) => {
        const currentRoles = formData.targetRoles || [];
        if (currentRoles.includes(role)) {
            setFormData({ ...formData, targetRoles: currentRoles.filter(r => r !== role) });
        } else {
            setFormData({ ...formData, targetRoles: [...currentRoles, role] });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        // Validação básica
        if (formData.visibility === 'ROLES' && (!formData.targetRoles || formData.targetRoles.length === 0)) {
            alert("Selecione pelo menos um cargo.");
            return;
        }
        if (formData.visibility === 'USER' && !formData.mentionedUser) {
            alert("Selecione um usuário.");
            return;
        }

        const newReminder: ReminderRecord = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            createdBy: currentUser.username,
            authorName: currentUser.name,
            authorRole: currentUser.jobTitle,
            date: formData.date!,
            title: formData.title || 'Lembrete Sem Título',
            description: formData.description || '',
            visibility: formData.visibility || 'ME',
            targetRoles: formData.targetRoles || [],
            mentionedUser: formData.mentionedUser || undefined
        };

        StorageService.addReminder(newReminder);

        // Se for para usuário específico, enviar notificação
        if (newReminder.visibility === 'USER' && newReminder.mentionedUser) {
             const notif: Notification = {
                id: Date.now().toString() + Math.random(),
                userId: newReminder.mentionedUser,
                message: `Lembrete de ${currentUser.name}: "${newReminder.title}" para ${new Date(newReminder.date).toLocaleDateString('pt-BR')}`,
                read: false,
                createdAt: new Date().toISOString(),
                type: 'MENTION',
                targetModule: ModuleType.REMINDERS 
            };
            StorageService.addNotification(notif);
        }

        loadReminders(currentUser.username, currentUser.jobTitle);
        
        // Reset form
        setFormData({
            date: new Date().toISOString().split('T')[0],
            title: '',
            description: '',
            visibility: 'ME',
            targetRoles: [],
            mentionedUser: ''
        });
    };

    const getVisibilityIcon = (visibility: ReminderVisibility) => {
        switch(visibility) {
            case 'ALL': return <Users size={14} />;
            case 'ROLES': return <Briefcase size={14} />;
            case 'USER': return <Bell size={14} />;
            case 'ME': default: return <Lock size={14} />;
        }
    };

    const getVisibilityLabel = (r: ReminderRecord) => {
        switch(r.visibility) {
            case 'ALL': return 'Para Todos';
            case 'ROLES': return `Cargos: ${r.targetRoles?.length || 0}`;
            case 'USER': return `Para: ${availableUsers.find(u => u.username === r.mentionedUser)?.name || r.mentionedUser}`;
            case 'ME': default: return 'Apenas Eu';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-yellow-500 rounded-lg text-black shadow-md">
                    <StickyNote size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Lembretes & Agenda</h2>
                    <p className="text-slate-500">Agende lembretes pessoais ou para a equipe.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulário de Criação */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6 border-t-4 border-t-yellow-500">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Plus size={20} className="text-slate-700" /> Novo Lembrete
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input 
                                label="Data do Lembrete" 
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                required
                            />
                            
                            {/* Seletor de Visibilidade */}
                            <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                                    <Eye size={16} className="text-blue-500"/> Quem irá ver?
                                </label>
                                <select 
                                    className="w-full p-2 border border-slate-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.visibility}
                                    onChange={e => setFormData({...formData, visibility: e.target.value as ReminderVisibility})}
                                >
                                    <option value="ME">Apenas Eu (Privado)</option>
                                    <option value="ALL">Todos os Usuários</option>
                                    <option value="ROLES">Cargos Específicos</option>
                                    <option value="USER">Usuário Específico</option>
                                </select>

                                {/* Opções Condicionais */}
                                <div className="mt-3">
                                    {formData.visibility === 'ROLES' && (
                                        <div className="max-h-32 overflow-y-auto border border-slate-200 rounded bg-white p-2 space-y-1">
                                            <p className="text-xs text-slate-400 mb-1">Selecione os cargos:</p>
                                            {jobTitles.map(role => (
                                                <label key={role} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 p-1 rounded">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formData.targetRoles?.includes(role)}
                                                        onChange={() => toggleTargetRole(role)}
                                                        className="rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    {role}
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {formData.visibility === 'USER' && (
                                        <select 
                                            className="w-full p-2 border border-slate-300 rounded-md bg-white text-sm"
                                            value={formData.mentionedUser}
                                            onChange={e => setFormData({...formData, mentionedUser: e.target.value})}
                                        >
                                            <option value="">Selecione o usuário...</option>
                                            {availableUsers
                                                .filter(u => u.username !== currentUser?.username)
                                                .map(u => (
                                                <option key={u.username} value={u.username}>
                                                    {u.name} ({u.jobTitle})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    
                                    {formData.visibility === 'ME' && (
                                        <p className="text-[10px] text-slate-400">
                                            Somente você verá este lembrete no seu painel.
                                        </p>
                                    )}
                                    
                                    {formData.visibility === 'ALL' && (
                                        <p className="text-[10px] text-slate-400">
                                            Este lembrete aparecerá nas Notícias de todos.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Input 
                                label="Título" 
                                placeholder="Ex: Reunião, Entrega de EPI..."
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                required
                            />
                            <AITextArea 
                                label="Descrição / Detalhes"
                                placeholder="Detalhes adicionais..."
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                rows={4}
                            />
                            <Button type="submit" className="w-full">
                                Criar Lembrete
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Lista de Lembretes */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-lg text-slate-700">Meus Lembretes e Avisos</h3>
                    
                    {reminders.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                            <StickyNote className="mx-auto text-slate-300 mb-2" size={48} />
                            <p className="text-slate-400">Nenhum lembrete visível para você.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {reminders.map(reminder => {
                                const isToday = new Date().toISOString().split('T')[0] === reminder.date;
                                const isPast = new Date(reminder.date) < new Date(new Date().setHours(0,0,0,0));
                                
                                // Cores baseadas na visibilidade
                                let cardBg = 'bg-white';
                                let borderColor = 'border-slate-200';
                                
                                if (reminder.visibility === 'ME') {
                                    cardBg = 'bg-slate-50';
                                } else if (reminder.visibility === 'ALL') {
                                    cardBg = 'bg-yellow-50';
                                    borderColor = 'border-yellow-200';
                                } else if (reminder.visibility === 'ROLES') {
                                    cardBg = 'bg-indigo-50';
                                    borderColor = 'border-indigo-200';
                                } else if (reminder.visibility === 'USER' && reminder.mentionedUser === currentUser?.username) {
                                    cardBg = 'bg-blue-50';
                                    borderColor = 'border-blue-200';
                                }

                                return (
                                    <div 
                                        key={reminder.id} 
                                        className={`p-4 rounded-lg border shadow-sm relative group transition-colors ${cardBg} ${borderColor} ${isToday ? 'ring-2 ring-offset-1 ring-yellow-400' : ''}`}
                                    >
                                        {/* Só permite excluir se for o criador */}
                                        {reminder.createdBy === currentUser?.username && (
                                            <button 
                                                onClick={() => handleDelete(reminder.id)}
                                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors p-1"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}

                                        <div className="flex items-center justify-between mb-3 pr-6">
                                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                                <Calendar size={12} className={isToday ? 'text-yellow-600' : 'text-slate-400'} />
                                                <span className={isToday ? 'text-yellow-700' : (isPast ? 'text-red-400' : 'text-slate-500')}>
                                                    {isToday ? 'Hoje' : new Date(reminder.date).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                            
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border bg-white/50 border-black/10 text-slate-600`}>
                                                {getVisibilityIcon(reminder.visibility || (reminder.mentionedUser ? 'USER' : 'ME'))}
                                                {getVisibilityLabel(reminder)}
                                            </span>
                                        </div>

                                        <h4 className={`font-bold text-lg mb-1 ${isPast ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                            {reminder.title}
                                        </h4>
                                        
                                        <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                            {reminder.description || 'Sem descrição.'}
                                        </p>
                                        
                                        <div className="mt-3 pt-2 border-t border-black/5 text-[10px] text-slate-400 flex justify-between">
                                            <span>Criado por: <strong>{reminder.authorName || reminder.createdBy}</strong></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
