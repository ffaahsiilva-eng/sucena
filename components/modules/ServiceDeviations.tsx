
import React, { useState, useEffect } from 'react';
import { Card, AITextArea, Button, FileInput } from '../ui/Shared';
import { DeviationRecord, Notification, ModuleType } from '../../types';
import { StorageService } from '../../services/storageService';
import { AuthService, User, User as UserType } from '../../services/authService';
import { User as UserIcon, Trash2, UserPlus, Bell, X } from 'lucide-react';

export const ServiceDeviations: React.FC = () => {
    const [deviations, setDeviations] = useState<DeviationRecord[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    
    // States para menção de usuários
    const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
    const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
    const [mentionSelectValue, setMentionSelectValue] = useState('');
    
    // States para Fotos
    const [tempPhotos, setTempPhotos] = useState<string[]>([]);

    const [formData, setFormData] = useState<Partial<DeviationRecord>>({
        type: 'PROCESS_FAILURE',
        description: '',
        cause: '',
        correction: ''
    });

    useEffect(() => {
        setDeviations(StorageService.getDeviations());
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
        if (window.confirm("Admin: Tem certeza que deseja excluir este desvio?")) {
            const updated = StorageService.deleteItem(StorageService.KEYS.DEVIATIONS, id);
            setDeviations(updated);
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

    const handlePhotoUpload = (url: string) => {
        setTempPhotos([...tempPhotos, url]);
    };

    const handleRemovePhoto = (index: number) => {
        setTempPhotos(tempPhotos.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newRecord = {
            ...formData, 
            id: Date.now().toString(), 
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.username || 'Sistema',
            authorName: currentUser?.name || 'Anônimo',
            authorRole: currentUser?.jobTitle || 'N/A',
            mentionedUsers: selectedMentions,
            photoUrls: tempPhotos
        } as DeviationRecord;
        
        StorageService.addDeviation(newRecord);

        // Criar notificações para usuários mencionados
        selectedMentions.forEach(username => {
            const notif: Notification = {
                id: Date.now().toString() + Math.random(),
                userId: username,
                message: `Você foi mencionado em um Desvio por ${currentUser?.name}: "${formData.description?.substring(0, 30)}..."`,
                read: false,
                createdAt: new Date().toISOString(),
                type: 'MENTION',
                targetModule: ModuleType.DEVIATIONS
            };
            StorageService.addNotification(notif);
        });

        setDeviations([newRecord, ...deviations]);
        setFormData({ type: 'PROCESS_FAILURE', description: '', cause: '', correction: '' });
        setSelectedMentions([]);
        setTempPhotos([]);
    };

    const getTypeLabel = (type: string) => {
        switch(type) {
            case 'PROCESS_FAILURE': return 'Falha de Processo';
            case 'DELAY': return 'Atraso';
            case 'NON_STANDARD': return 'Fora do Padrão';
            case 'OTHER': return 'Outro';
            default: return type;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="sticky top-6 h-fit">
                <h3 className="font-bold text-lg mb-4 text-red-700">Relatar Desvio</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo de Desvio</label>
                        <select 
                            className="w-full p-2 border rounded-md"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value as any})}
                        >
                            <option value="PROCESS_FAILURE">Falha de Processo</option>
                            <option value="DELAY">Atraso</option>
                            <option value="NON_STANDARD">Fora do Padrão</option>
                            <option value="OTHER">Outro</option>
                        </select>
                    </div>
                    <AITextArea label="Descrição do Ocorrido" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <AITextArea label="Possíveis Causas" value={formData.cause} onChange={e => setFormData({...formData, cause: e.target.value})} context="Análise de causa raiz" />
                    <AITextArea label="Ação Corretiva" value={formData.correction} onChange={e => setFormData({...formData, correction: e.target.value})} context="Ações corretivas" />
                    
                    {/* Área de Menção de Usuários */}
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                            <Bell size={14} className="text-yellow-600"/> Notificar Responsável
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
                    
                    {/* Upload Múltiplo */}
                    <div>
                        <FileInput 
                            label="Fotos do Desvio" 
                            onImageUploaded={handlePhotoUpload}
                            category="DEVIATION" 
                        />
                        {tempPhotos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {tempPhotos.map((url, idx) => (
                                    <div key={idx} className="relative group aspect-square">
                                        <img src={url} alt={`Temp ${idx}`} className="w-full h-full object-cover rounded border border-slate-200" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePhoto(idx)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button type="submit" variant="danger" className="w-full">Registrar</Button>
                </form>
            </Card>

            <div className="space-y-4">
                <h3 className="font-bold text-lg">Histórico de Desvios</h3>
                {deviations.length === 0 && <p className="text-slate-400">Nenhum desvio registrado.</p>}
                {deviations.map(dev => (
                    <Card key={dev.id} className="border-l-4 border-l-red-400 relative">
                        {isAdmin && (
                            <button 
                                onClick={() => handleDelete(dev.id)}
                                className="absolute top-4 right-4 text-red-300 hover:text-red-600 p-1"
                                title="Admin: Excluir"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <div className="flex justify-between pr-8">
                            <span className="font-bold text-xs uppercase text-slate-500">{getTypeLabel(dev.type)}</span>
                            <span className="text-xs text-slate-400">{new Date(dev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="font-medium mt-2">{dev.description}</p>
                        <div className="mt-3 bg-slate-50 p-2 rounded text-sm">
                            <span className="font-semibold text-slate-700">Causa:</span> {dev.cause}
                        </div>
                        <div className="mt-1 bg-green-50 p-2 rounded text-sm">
                            <span className="font-semibold text-green-700">Correção:</span> {dev.correction}
                        </div>
                        
                        {/* Menções Visualização */}
                        {dev.mentionedUsers && dev.mentionedUsers.length > 0 && (
                           <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                               <Bell size={12} className="text-yellow-600" />
                               <span>Notificados: </span>
                               {dev.mentionedUsers.map(u => {
                                   const name = availableUsers.find(au => au.username === u)?.name || u;
                                   return <span key={u} className="font-bold text-slate-700 bg-slate-100 px-1 rounded">{name}</span>
                               })}
                           </div>
                        )}
                        
                        {/* Fotos Visualização */}
                        {dev.photoUrls && dev.photoUrls.length > 0 && (
                            <div className="mt-3 border-t pt-2">
                                <p className="text-xs text-slate-500 mb-1">Evidências:</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {dev.photoUrls.map((url, idx) => (
                                        <img 
                                            key={idx} 
                                            src={url} 
                                            alt={`Evidencia ${idx}`} 
                                            className="w-full h-16 object-cover rounded border border-slate-200 cursor-pointer hover:scale-105 transition-transform" 
                                            onClick={() => window.open(url, '_blank')}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1 justify-end">
                            <UserIcon size={12} /> Enviado por: 
                            <span className="font-bold text-slate-700">{dev.authorName || dev.createdBy || 'Anônimo'}</span>
                            {dev.authorRole && <span className="bg-slate-100 px-1 rounded text-slate-500">- {dev.authorRole}</span>}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
