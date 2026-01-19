import React, { useState, useEffect } from 'react';
import { Card, Input, FileInput, Button, AITextArea } from '../ui/Shared';
import { VehicleChecklistRecord } from '../../types';
import { AuthService, User } from '../../services/authService';
import { User as UserIcon } from 'lucide-react';

export const VehicleChecklist: React.FC = () => {
    const [checklists, setChecklists] = useState<VehicleChecklistRecord[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<VehicleChecklistRecord>>({
        driverName: '',
        vehiclePlate: '',
        mileage: 0,
        fuelLevel: 50,
        condition: 'OK',
        damageDescription: '',
        photoUrl: ''
    });

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) setCurrentUser(user);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setChecklists([{
            ...formData, 
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.username || 'Sistema',
            authorName: currentUser?.name || 'Anônimo',
            authorRole: currentUser?.jobTitle || 'N/A'
        } as VehicleChecklistRecord, ...checklists]);
        setFormData({ driverName: '', vehiclePlate: '', mileage: 0, fuelLevel: 50, condition: 'OK', damageDescription: '', photoUrl: '' });
    };

    const getConditionLabel = (condition: string) => {
        switch(condition) {
            case 'OK': return 'Em Ordem';
            case 'DAMAGE': return 'Com Avarias';
            case 'DIRTY': return 'Sujo';
            default: return condition;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="font-bold text-lg mb-4">Troca de Motorista</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Motorista" value={formData.driverName} onChange={e => setFormData({...formData, driverName: e.target.value})} required />
                        <Input label="Placa" value={formData.vehiclePlate} onChange={e => setFormData({...formData, vehiclePlate: e.target.value})} required />
                        <Input label="Quilometragem" type="number" value={formData.mileage} onChange={e => setFormData({...formData, mileage: parseInt(e.target.value)})} required />
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Combustível ({formData.fuelLevel}%)</label>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                value={formData.fuelLevel} 
                                onChange={e => setFormData({...formData, fuelLevel: parseInt(e.target.value)})} 
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>Vazio</span><span>Cheio</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Estado Geral</label>
                        <select 
                            className="w-full p-2 border rounded-md"
                            value={formData.condition}
                            onChange={e => setFormData({...formData, condition: e.target.value})}
                        >
                            <option value="OK">Em Ordem</option>
                            <option value="DAMAGE">Com Avarias</option>
                            <option value="DIRTY">Sujo</option>
                        </select>
                    </div>

                    {formData.condition !== 'OK' && (
                        <AITextArea label="Descrição das Avarias" value={formData.damageDescription} onChange={e => setFormData({...formData, damageDescription: e.target.value})} />
                    )}

                    <FileInput 
                        label="Fotos do Veículo (Frente/Lateral/Traseira)" 
                        onImageUploaded={(url) => setFormData({...formData, photoUrl: url})} 
                    />
                    <Button type="submit">Salvar Checklist</Button>
                </form>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checklists.map(chk => (
                    <Card key={chk.id} className="text-sm flex flex-col h-full">
                        <div className="flex justify-between font-bold text-base mb-2">
                            <span>{chk.vehiclePlate}</span>
                            <span className={chk.condition === 'OK' ? 'text-green-600' : 'text-red-600'}>{getConditionLabel(chk.condition)}</span>
                        </div>
                        {chk.photoUrl && (
                             <img src={chk.photoUrl} alt="Veículo" className="w-full h-32 object-cover rounded mb-3" />
                        )}
                        <p>Motorista: {chk.driverName}</p>
                        <p>KM: {chk.mileage}</p>
                        <p>Tanque: {chk.fuelLevel}%</p>
                        {chk.damageDescription && <p className="text-red-500 mt-1">Obs: {chk.damageDescription}</p>}
                        
                        <div className="mt-auto pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1 justify-end">
                            <UserIcon size={12} />
                            <span className="font-bold text-slate-700">{chk.authorName || chk.createdBy || 'Anônimo'}</span>
                            {chk.authorRole && <span className="bg-slate-100 px-1 rounded text-slate-500">- {chk.authorRole}</span>}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};