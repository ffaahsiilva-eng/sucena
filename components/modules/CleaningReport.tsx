import React, { useState, useEffect } from 'react';
import { Card, Input, FileInput, Button, AITextArea } from '../ui/Shared';
import { CleaningRecord, CleaningArea } from '../../types';
import { StorageService } from '../../services/storageService';
import { AuthService, User } from '../../services/authService';
import { User as UserIcon, Trash2 } from 'lucide-react';

export const CleaningReport: React.FC = () => {
    const [records, setRecords] = useState<CleaningRecord[]>([]);
    const [area, setArea] = useState<CleaningArea>(CleaningArea.ALMOXARIFADO);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [formData, setFormData] = useState<Partial<CleaningRecord>>({
        responsible: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        photoUrl: ''
    });

    useEffect(() => {
        setRecords(StorageService.getCleaning());
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            if (user.role === 'ADMIN') setIsAdmin(true);
        }
    }, []);

    const handleDelete = (id: string) => {
        if (window.confirm("Admin: Tem certeza que deseja excluir este registro de limpeza?")) {
            const updated = StorageService.deleteItem(StorageService.KEYS.CLEANING, id);
            setRecords(updated);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newRecord = {
            ...formData, 
            area, 
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.username || 'Sistema',
            authorName: currentUser?.name || 'Anônimo',
            authorRole: currentUser?.jobTitle || 'N/A'
        } as CleaningRecord;
        
        StorageService.addCleaning(newRecord);
        setRecords([newRecord, ...records]);
        setFormData({ responsible: '', description: '', date: new Date().toISOString().split('T')[0], photoUrl: '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {Object.values(CleaningArea).map(a => (
                    <button
                        key={a}
                        onClick={() => setArea(a)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                            area === a ? 'bg-accent text-white' : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                    >
                        {a}
                    </button>
                ))}
            </div>

            <Card>
                <h3 className="font-bold text-lg mb-4">Registro: {area}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Data" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                        <Input label="Responsável" value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})} required />
                    </div>
                    <AITextArea 
                        label="O que foi limpo?" 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Descreva a limpeza..."
                    />
                    <FileInput 
                        label="Foto do local limpo" 
                        onImageUploaded={(url) => setFormData({...formData, photoUrl: url})} 
                    />
                    <Button type="submit">Confirmar Limpeza</Button>
                </form>
            </Card>

            <div>
                <h4 className="font-medium text-slate-500 mb-3">Últimas limpezas em {area}</h4>
                <div className="space-y-3">
                    {records.filter(r => r.area === area).length === 0 && <p className="text-slate-400 text-sm">Nenhum registro nesta área.</p>}
                    {records.filter(r => r.area === area).map(rec => (
                        <div key={rec.id} className="relative flex flex-col sm:flex-row bg-white p-3 rounded-lg border border-slate-200 gap-4 group">
                            {isAdmin && (
                                <button 
                                    onClick={() => handleDelete(rec.id)}
                                    className="absolute top-2 right-2 text-red-300 hover:text-red-600 p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white rounded-full shadow-sm"
                                    title="Admin: Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <div className="flex gap-4">
                                {rec.photoUrl ? (
                                    <img src={rec.photoUrl} alt="Clean" className="w-16 h-16 rounded object-cover" />
                                ) : (
                                    <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400">Sem foto</div>
                                )}
                                <div className="flex-1 pr-6">
                                    <p className="font-bold text-slate-800">{rec.responsible}</p>
                                    <p className="text-sm text-slate-500">{new Date(rec.date).toLocaleDateString('pt-BR')}</p>
                                    <p className="text-sm text-slate-600 mt-1">{rec.description}</p>
                                </div>
                            </div>
                            
                            <div className="sm:ml-auto flex items-end sm:items-center">
                                <div className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                    <UserIcon size={10} />
                                    <span>{rec.authorName || rec.createdBy} ({rec.authorRole})</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};