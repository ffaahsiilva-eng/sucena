
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, AITextArea } from '../ui/Shared';
import { WorkPermitRecord, WorkPermitCategory, LogRecord } from '../../types';
import { StorageService } from '../../services/storageService';
import { AuthService, User as UserType } from '../../services/authService';
import { FileText, Calendar, AlertTriangle, RefreshCw, XCircle, Trash2, CheckCircle2, Hammer, HardHat, Truck } from 'lucide-react';

interface WorkPermitsProps {
    preSelectedCategory?: WorkPermitCategory;
}

export const WorkPermits: React.FC<WorkPermitsProps> = ({ preSelectedCategory }) => {
    const [permits, setPermits] = useState<WorkPermitRecord[]>([]);
    const [activeCategory, setActiveCategory] = useState<WorkPermitCategory>('VERTEDOURO');
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<WorkPermitRecord>>({
        description: '',
        location: '',
        expirationDate: '',
    });

    // Update Form State (Renewal)
    const [renewModal, setRenewModal] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });
    const [newExpirationDate, setNewExpirationDate] = useState('');

    useEffect(() => {
        loadPermits();
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            if (user.role === 'ADMIN') setIsAdmin(true);
        }
    }, []);

    // Atualiza a categoria se vier via props (Navegação do Dashboard)
    useEffect(() => {
        if (preSelectedCategory) {
            setActiveCategory(preSelectedCategory);
        }
    }, [preSelectedCategory]);

    const loadPermits = () => {
        const loaded = StorageService.getGeneric(StorageService.KEYS.WORK_PERMITS) as WorkPermitRecord[];
        // Ordenar: Ativas primeiro, depois por data de vencimento
        loaded.sort((a, b) => {
            if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
            if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
            return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
        });
        setPermits(loaded);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Admin: Deseja excluir este registro de PT permanentemente?")) {
            const updated = StorageService.deleteItem(StorageService.KEYS.WORK_PERMITS, id);
            setPermits(updated);
        }
    };

    const handleCancel = (permit: WorkPermitRecord) => {
        if (window.confirm("Deseja cancelar esta Permissão de Trabalho?")) {
            const updatedPermit: WorkPermitRecord = { ...permit, status: 'CANCELLED' };
            StorageService.updateItem(StorageService.KEYS.WORK_PERMITS, updatedPermit);
            loadPermits();
        }
    };

    const handleRenew = () => {
        if (!renewModal.id || !newExpirationDate) return;
        
        const permit = permits.find(p => p.id === renewModal.id);
        if (permit) {
            const updatedPermit: WorkPermitRecord = { 
                ...permit, 
                expirationDate: newExpirationDate,
                status: 'ACTIVE' // Reativar se estiver expirada
            };
            StorageService.updateItem(StorageService.KEYS.WORK_PERMITS, updatedPermit);
            
            // Log de Renovação
            const log: LogRecord = {
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                category: 'PT',
                action: 'ATUALIZACAO',
                description: `PT Renovada: ${permit.category}`,
                details: `Nova validade: ${new Date(newExpirationDate).toLocaleDateString('pt-BR')}`,
                createdBy: currentUser?.username || 'Sistema',
                authorName: currentUser?.name || 'Anônimo',
                authorRole: currentUser?.jobTitle || 'N/A'
            };
            StorageService.addLog(log);

            loadPermits();
            setRenewModal({ isOpen: false, id: null });
            setNewExpirationDate('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.description && formData.expirationDate && formData.location) {
            const newRecord: WorkPermitRecord = {
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                category: activeCategory,
                description: formData.description,
                location: formData.location,
                expirationDate: formData.expirationDate,
                status: 'ACTIVE',
                createdBy: currentUser?.username || 'Sistema',
                authorName: currentUser?.name || 'Anônimo',
                authorRole: currentUser?.jobTitle || 'N/A'
            };

            StorageService.addGeneric(StorageService.KEYS.WORK_PERMITS, newRecord);
            loadPermits();
            setFormData({ description: '', location: '', expirationDate: '' });
        }
    };

    const getStatusInfo = (dateStr: string, status: string) => {
        if (status === 'CANCELLED') return { label: 'CANCELADA', color: 'bg-red-100 text-red-700 border-red-200' };
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const expDate = new Date(dateStr);
        expDate.setHours(0,0,0,0);
        
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'VENCIDA', color: 'bg-slate-200 text-slate-600 border-slate-300' };
        if (diffDays <= 5) return { label: `VENCE EM ${diffDays} DIAS`, color: 'bg-orange-100 text-orange-700 border-orange-200 animate-pulse' };
        
        return { label: 'VIGENTE', color: 'bg-green-100 text-green-700 border-green-200' };
    };

    // Filter permits by active category
    const displayedPermits = permits.filter(p => p.category === activeCategory);

    return (
        <div className="space-y-6">
            
            {/* Header Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-blue-600" /> Permissões de Trabalho (PT)
                    </h3>
                    <p className="text-slate-500 text-sm">Gerenciamento de validades e status de PTs.</p>
                </div>
                
                <div className="flex bg-slate-200 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveCategory('VERTEDOURO')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeCategory === 'VERTEDOURO' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Hammer size={16} /> Vertedouro
                    </button>
                    <button 
                        onClick={() => setActiveCategory('ESCAVACAO')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeCategory === 'ESCAVACAO' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <HardHat size={16} /> Escavação
                    </button>
                    <button 
                        onClick={() => setActiveCategory('MUNK')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeCategory === 'MUNK' ? 'bg-white text-yellow-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Truck size={16} /> Munck
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form */}
                <div className="lg:col-span-1">
                    <Card className={`sticky top-6 border-t-4 ${
                        activeCategory === 'VERTEDOURO' ? 'border-t-blue-500' : 
                        activeCategory === 'ESCAVACAO' ? 'border-t-orange-500' : 'border-t-yellow-500'
                    }`}>
                        <h4 className="font-bold text-lg mb-4 text-slate-700">Nova PT - {activeCategory}</h4>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input 
                                label="Local de Trabalho" 
                                placeholder="Ex: Área 51, Talude..."
                                value={formData.location}
                                onChange={e => setFormData({...formData, location: e.target.value})}
                                required
                            />
                            <AITextArea 
                                label="Descrição da Atividade" 
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                            <Input 
                                label="Data de Vencimento" 
                                type="date"
                                value={formData.expirationDate}
                                onChange={e => setFormData({...formData, expirationDate: e.target.value})}
                                required
                            />
                            <Button type="submit" className="w-full">
                                Cadastrar PT
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    {displayedPermits.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                            <FileText className="mx-auto text-slate-300 mb-2" size={48} />
                            <p className="text-slate-400">Nenhuma PT cadastrada nesta categoria.</p>
                        </div>
                    )}

                    {displayedPermits.map(permit => {
                        const statusInfo = getStatusInfo(permit.expirationDate, permit.status);
                        return (
                            <Card key={permit.id} className="relative hover:shadow-md transition-shadow">
                                {isAdmin && (
                                    <button 
                                        onClick={() => handleDelete(permit.id)}
                                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1"
                                        title="Admin: Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}

                                <div className="flex flex-col md:flex-row justify-between items-start mb-3 gap-2">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{permit.location}</h4>
                                        <p className="text-sm text-slate-500">PT: {permit.description}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded text-xs font-bold border flex items-center gap-1 whitespace-nowrap ${statusInfo.color}`}>
                                        {statusInfo.label === 'VIGENTE' ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
                                        {statusInfo.label}
                                    </span>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center text-sm border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Calendar size={16} />
                                        <span>Vence em: <strong>{new Date(permit.expirationDate).toLocaleDateString('pt-BR')}</strong></span>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {permit.status !== 'CANCELLED' && (
                                            <>
                                                <button 
                                                    onClick={() => setRenewModal({ isOpen: true, id: permit.id })}
                                                    className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors font-medium text-xs"
                                                >
                                                    <RefreshCw size={14} /> Renovar
                                                </button>
                                                <button 
                                                    onClick={() => handleCancel(permit)}
                                                    className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors font-medium text-xs"
                                                >
                                                    <XCircle size={14} /> Cancelar
                                                </button>
                                            </>
                                        )}
                                        {permit.status === 'CANCELLED' && (
                                            <span className="text-xs text-red-500 font-bold italic">Cancelada em {new Date().toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Modal de Renovação */}
            {renewModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm animate-in zoom-in duration-200">
                        <h3 className="font-bold text-lg mb-4 text-slate-800">Renovar Permissão</h3>
                        <p className="text-sm text-slate-500 mb-4">Selecione a nova data de vencimento para esta PT.</p>
                        <Input 
                            label="Nova Data de Vencimento" 
                            type="date"
                            value={newExpirationDate}
                            onChange={e => setNewExpirationDate(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2 mt-4">
                            <Button variant="secondary" onClick={() => setRenewModal({ isOpen: false, id: null })} className="flex-1">
                                Voltar
                            </Button>
                            <Button onClick={handleRenew} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                Confirmar
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
