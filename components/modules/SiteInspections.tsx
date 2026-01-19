
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, AITextArea } from '../ui/Shared';
import { SiteInspectionRecord, LogRecord } from '../../types';
import { StorageService } from '../../services/storageService';
import { AuthService, User as UserType } from '../../services/authService';
import { ClipboardCheck, Calendar, MapPin, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react';

export const SiteInspections: React.FC = () => {
    const [inspections, setInspections] = useState<SiteInspectionRecord[]>([]);
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const [formData, setFormData] = useState<Partial<SiteInspectionRecord>>({
        inspectionDate: '',
        location: '',
        notes: ''
    });

    useEffect(() => {
        loadInspections();
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            if (user.role === 'ADMIN') setIsAdmin(true);
        }
    }, []);

    const loadInspections = () => {
        const loaded = StorageService.getGeneric(StorageService.KEYS.SITE_INSPECTIONS) as SiteInspectionRecord[];
        // Ordenar por data (mais próxima primeiro)
        loaded.sort((a, b) => new Date(a.inspectionDate).getTime() - new Date(b.inspectionDate).getTime());
        setInspections(loaded);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Admin: Deseja excluir este agendamento?")) {
            const updated = StorageService.deleteItem(StorageService.KEYS.SITE_INSPECTIONS, id);
            setInspections(updated);
        }
    };

    const handleStatusChange = (id: string, newStatus: 'COMPLETED' | 'CANCELLED') => {
        const inspection = inspections.find(i => i.id === id);
        if (inspection) {
            const updated = { ...inspection, status: newStatus };
            StorageService.updateItem(StorageService.KEYS.SITE_INSPECTIONS, updated);
            loadInspections();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.inspectionDate && formData.location) {
            const newRecord: SiteInspectionRecord = {
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                inspectionDate: formData.inspectionDate,
                location: formData.location,
                notes: formData.notes || '',
                status: 'PENDING',
                createdBy: currentUser?.username || 'Sistema',
                authorName: currentUser?.name || 'Anônimo',
                authorRole: currentUser?.jobTitle || 'N/A'
            };

            StorageService.addGeneric(StorageService.KEYS.SITE_INSPECTIONS, newRecord);
            loadInspections();
            setFormData({ inspectionDate: '', location: '', notes: '' });
        }
    };

    const getStatusDisplay = (inspection: SiteInspectionRecord) => {
        if (inspection.status === 'COMPLETED') return { label: 'CONCLUÍDA', color: 'bg-green-100 text-green-700 border-green-200' };
        if (inspection.status === 'CANCELLED') return { label: 'CANCELADA', color: 'bg-red-100 text-red-700 border-red-200' };
        
        // Check dates for pending
        const today = new Date();
        today.setHours(0,0,0,0);
        const inspDate = new Date(inspection.inspectionDate);
        inspDate.setHours(0,0,0,0);
        const diffDays = Math.ceil((inspDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'ATRASADA', color: 'bg-red-50 text-red-600 border-red-200 font-bold' };
        if (diffDays <= 5) return { label: `EM ${diffDays} DIAS`, color: 'bg-orange-100 text-orange-700 border-orange-200 animate-pulse' };
        
        return { label: 'AGENDADA', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ClipboardCheck className="text-purple-600" /> Vistorias de Canteiro
                    </h3>
                    <p className="text-slate-500 text-sm">Agenda de inspeções e vistorias gerais.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6 border-t-4 border-t-purple-600">
                        <h4 className="font-bold text-lg mb-4 text-slate-700">Agendar Nova Vistoria</h4>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input 
                                label="Local / Canteiro" 
                                placeholder="Ex: Canteiro Principal, Almoxarifado..."
                                value={formData.location}
                                onChange={e => setFormData({...formData, location: e.target.value})}
                                required
                            />
                            <Input 
                                label="Data da Vistoria" 
                                type="date"
                                value={formData.inspectionDate}
                                onChange={e => setFormData({...formData, inspectionDate: e.target.value})}
                                required
                            />
                            <AITextArea 
                                label="Observações" 
                                placeholder="Pontos de atenção, responsáveis..."
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                            />
                            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                Agendar
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    {inspections.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                            <Calendar className="mx-auto text-slate-300 mb-2" size={48} />
                            <p className="text-slate-400">Nenhuma vistoria agendada.</p>
                        </div>
                    )}

                    {inspections.map(insp => {
                        const status = getStatusDisplay(insp);
                        return (
                            <Card key={insp.id} className="relative hover:shadow-md transition-shadow">
                                {isAdmin && (
                                    <button 
                                        onClick={() => handleDelete(insp.id)}
                                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1"
                                        title="Admin: Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                                            <MapPin size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">{insp.location}</h4>
                                            <p className="text-sm text-slate-500">Agendada por: {insp.authorName}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-md text-xs font-bold border text-center ${status.color}`}>
                                        <span className="block">{status.label}</span>
                                        <span className="block text-[10px] opacity-75">{new Date(insp.inspectionDate).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>

                                {insp.notes && (
                                    <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded mb-4 border border-slate-100">
                                        Obs: {insp.notes}
                                    </p>
                                )}

                                {insp.status === 'PENDING' && (
                                    <div className="flex gap-2 border-t pt-3">
                                        <button 
                                            onClick={() => handleStatusChange(insp.id, 'COMPLETED')}
                                            className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <CheckCircle size={14} /> Concluir Vistoria
                                        </button>
                                        <button 
                                            onClick={() => handleStatusChange(insp.id, 'CANCELLED')}
                                            className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 py-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <XCircle size={14} /> Cancelar
                                        </button>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
