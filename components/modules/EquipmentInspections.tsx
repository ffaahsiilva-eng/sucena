import React, { useState, useEffect } from 'react';
import { Card, Input, Button } from '../ui/Shared';
import { EquipmentInspectionRecord } from '../../types';
import { StorageService } from '../../services/storageService';
import { AuthService, User } from '../../services/authService';
import { Trash2, Truck, CalendarClock, User as UserIcon } from 'lucide-react';

export const EquipmentInspections: React.FC = () => {
  const [inspections, setInspections] = useState<EquipmentInspectionRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [formData, setFormData] = useState<Partial<EquipmentInspectionRecord>>({
    vehicleName: '',
    plate: '',
    driverName: '',
    nextInspectionDate: ''
  });

  useEffect(() => {
    const loaded = StorageService.getGeneric(StorageService.KEYS.EQUIPMENT_INSPECTION) as EquipmentInspectionRecord[];
    // Ordenar por data de vistoria (mais próxima primeiro)
    loaded.sort((a, b) => new Date(a.nextInspectionDate).getTime() - new Date(b.nextInspectionDate).getTime());
    setInspections(loaded);

    const user = AuthService.getCurrentUser();
    if (user) {
        setCurrentUser(user);
        if (user.role === 'ADMIN') setIsAdmin(true);
    }
  }, []);

  const handleDelete = (id: string) => {
      if (window.confirm("Admin: Deseja excluir este agendamento de vistoria?")) {
          const updated = StorageService.deleteItem(StorageService.KEYS.EQUIPMENT_INSPECTION, id);
          updated.sort((a: EquipmentInspectionRecord, b: EquipmentInspectionRecord) => new Date(a.nextInspectionDate).getTime() - new Date(b.nextInspectionDate).getTime());
          setInspections(updated);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.vehicleName && formData.plate && formData.driverName && formData.nextInspectionDate) {
      const newRecord: EquipmentInspectionRecord = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        vehicleName: formData.vehicleName,
        plate: formData.plate.toUpperCase(),
        driverName: formData.driverName,
        nextInspectionDate: formData.nextInspectionDate,
        createdBy: currentUser?.username || 'Sistema',
        authorName: currentUser?.name || 'Anônimo',
        authorRole: currentUser?.jobTitle || 'N/A'
      };

      StorageService.addGeneric(StorageService.KEYS.EQUIPMENT_INSPECTION, newRecord);
      
      const newInspections = [...inspections, newRecord];
      newInspections.sort((a, b) => new Date(a.nextInspectionDate).getTime() - new Date(b.nextInspectionDate).getTime());
      
      setInspections(newInspections);
      setFormData({ vehicleName: '', plate: '', driverName: '', nextInspectionDate: '' });
    }
  };

  // Helper para verificar status da data
  const getStatusColor = (dateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const date = new Date(dateStr);
    date.setHours(0,0,0,0);
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-600 bg-red-50 border-red-200'; // Vencido
    if (diffDays <= 2) return 'text-orange-600 bg-orange-50 border-orange-200'; // Vencendo
    return 'text-green-600 bg-green-50 border-green-200'; // No prazo
  };

  const getStatusText = (dateStr: string) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const date = new Date(dateStr);
      date.setHours(0,0,0,0);

      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return `Venceu há ${Math.abs(diffDays)} dia(s)`;
      if (diffDays === 0) return 'Vence Hoje';
      if (diffDays === 1) return 'Vence Amanhã';
      return `Vence em ${diffDays} dias`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="md:col-span-1">
           <Card className="sticky top-6">
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                   <CalendarClock className="text-accent" /> Agendar Vistoria
               </h3>
               <form onSubmit={handleSubmit} className="space-y-4">
                   <Input 
                      label="Veículo / Equipamento" 
                      placeholder="Ex: Hilux, Caminhão Munck..."
                      value={formData.vehicleName} 
                      onChange={e => setFormData({...formData, vehicleName: e.target.value})}
                      required
                   />
                   <Input 
                      label="Placa" 
                      placeholder="ABC-1234"
                      value={formData.plate} 
                      onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})}
                      required
                   />
                   <Input 
                      label="Motorista Responsável" 
                      value={formData.driverName} 
                      onChange={e => setFormData({...formData, driverName: e.target.value})}
                      required
                   />
                   <Input 
                      label="Data da Próxima Vistoria" 
                      type="date"
                      value={formData.nextInspectionDate} 
                      onChange={e => setFormData({...formData, nextInspectionDate: e.target.value})}
                      required
                   />
                   <Button type="submit" className="w-full">Agendar</Button>
               </form>
           </Card>
        </div>

        {/* Lista */}
        <div className="md:col-span-2 space-y-4">
            <h3 className="font-bold text-lg text-slate-700">Controle de Vistorias</h3>
            {inspections.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                   <p className="text-slate-400">Nenhum equipamento agendado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {inspections.map(item => (
                        <div 
                            key={item.id} 
                            className={`relative border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shadow-sm hover:shadow-md transition-shadow`}
                        >
                            {isAdmin && (
                                <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{item.vehicleName}</h4>
                                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-sm text-slate-500">
                                        <span className="font-mono bg-slate-100 px-1 rounded text-slate-700 border border-slate-200">{item.plate}</span>
                                        <span className="flex items-center gap-1"><UserIcon size={12}/> {item.driverName}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={`px-4 py-2 rounded-lg border text-center min-w-[140px] ${getStatusColor(item.nextInspectionDate)}`}>
                                <span className="block text-xs font-bold uppercase tracking-wider">Vistoria</span>
                                <span className="block font-bold text-lg">{new Date(item.nextInspectionDate).toLocaleDateString('pt-BR')}</span>
                                <span className="block text-xs mt-1 font-medium">{getStatusText(item.nextInspectionDate)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};