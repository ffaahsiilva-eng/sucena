
import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../ui/Shared';
import { StorageService } from '../../services/storageService';
import { AuthService, User } from '../../services/authService';
import { DDSScheduleRecord } from '../../types';
import { CalendarDays, Save, Shuffle, User as UserIcon, Mic2, Lock, Trash2, Printer, MessageCircle } from 'lucide-react';

export const DDSSchedule: React.FC = () => {
    const [schedule, setSchedule] = useState<DDSScheduleRecord[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [canEdit, setCanEdit] = useState(false);
    
    // Logo personalizada para impressão (Carregada globalmente)
    const [printLogo, setPrintLogo] = useState<string | null>(null);
    
    // Controle de data (Mês atual)
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
        
        // Permissão restrita: Apenas Técnico de Segurança ou Admin
        const isSafetyTech = user?.jobTitle?.toLowerCase().includes('segurança') || user?.role === 'ADMIN';
        setCanEdit(!!isSafetyTech);

        const loadedSchedule = StorageService.getDDSSchedule();
        setSchedule(loadedSchedule);

        const allUsers = AuthService.getUsers();
        setUsers(allUsers);

        // Carregar logo global
        const config = StorageService.getAppConfig();
        if (config?.logoUrl) {
            setPrintLogo(config.logoUrl);
        }
    }, []);

    // Gera dias úteis (Seg-Sex) do mês selecionado
    const getWeekdays = () => {
        const days = [];
        const date = new Date(currentYear, currentMonth, 1);
        while (date.getMonth() === currentMonth) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Ignora Dom (0) e Sáb (6)
                days.push(new Date(date));
            }
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const weekdays = getWeekdays();

    const handleUpdateRecord = (dateStr: string, field: 'speakerName' | 'theme', value: string) => {
        if (!canEdit) return;

        setSchedule(prev => {
            const index = prev.findIndex(r => r.date === dateStr);
            if (index !== -1) {
                // Atualiza existente
                const newSchedule = [...prev];
                newSchedule[index] = { ...newSchedule[index], [field]: value };
                return newSchedule;
            } else {
                // Cria novo
                return [...prev, { 
                    date: dateStr, 
                    speakerName: field === 'speakerName' ? value : '', 
                    theme: field === 'theme' ? value : '' 
                }];
            }
        });
    };

    const handleSave = () => {
        StorageService.saveDDSSchedule(schedule);
        alert("Escala de DDS salva com sucesso!");
    };

    const handleClearMonth = () => {
        if (!canEdit) return;
        if (!window.confirm(`ATENÇÃO: Deseja apagar toda a escala definida para ${monthName}? Esta ação não pode ser desfeita.`)) return;

        // Filtra para manter apenas registros que NÃO são deste mês/ano
        const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const newSchedule = schedule.filter(r => !r.date.startsWith(monthPrefix));

        setSchedule(newSchedule);
        StorageService.saveDDSSchedule(newSchedule);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleRandomize = () => {
        if (!canEdit) return;
        if (!window.confirm("Isso preencherá aleatoriamente os dias VAZIOS deste mês. Deseja continuar?")) return;

        // Filtra dias que ainda não têm palestrante definido
        const emptyDays = weekdays.filter(day => {
            const dateKey = day.toISOString().split('T')[0];
            const record = schedule.find(r => r.date === dateKey);
            return !record || !record.speakerName;
        });

        if (emptyDays.length === 0) {
            alert("Todos os dias já possuem palestrante definido.");
            return;
        }

        // Embaralha usuários
        const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
        let userIndex = 0;

        const newSchedule = [...schedule];

        emptyDays.forEach(day => {
            const dateKey = day.toISOString().split('T')[0];
            const user = shuffledUsers[userIndex % shuffledUsers.length];
            userIndex++;

            // Verifica se já existe registro para atualizar ou cria novo
            const index = newSchedule.findIndex(r => r.date === dateKey);
            if (index !== -1) {
                newSchedule[index] = { ...newSchedule[index], speakerName: user.name };
            } else {
                newSchedule.push({ date: dateKey, speakerName: user.name, theme: '' });
            }
        });

        setSchedule(newSchedule);
    };

    const handleNotifySpeaker = (record: DDSScheduleRecord) => {
        if (!record.speakerName) return;

        // Encontrar usuário pelo nome (aproximado)
        const user = users.find(u => u.name === record.speakerName);
        
        if (!user || !user.whatsapp) {
            alert(`O usuário ${record.speakerName} não possui número de WhatsApp cadastrado no sistema.`);
            return;
        }

        // Formatar data
        const dateObj = new Date(record.date + 'T12:00:00'); // Forçar meio dia para evitar fuso
        const formattedDate = dateObj.toLocaleDateString('pt-BR');
        
        // Criar mensagem
        const message = `Olá ${user.name}, lembrete do Sistema Sucena: Você está escalado para palestrar no DDS do dia ${formattedDate}. Tema: ${record.theme || 'A definir'}. Contamos com você!`;
        
        // Limpar número e criar link
        const cleanPhone = user.whatsapp.replace(/\D/g, '');
        const link = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        
        window.open(link, '_blank');
    };

    const getRecord = (dateStr: string) => schedule.find(r => r.date === dateStr) || { speakerName: '', theme: '' };

    // Navegação de Mês
    const changeMonth = (delta: number) => {
        const newDate = new Date(currentYear, currentMonth + delta, 1);
        setCurrentMonth(newDate.getMonth());
        setCurrentYear(newDate.getFullYear());
    };

    const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* --- ÁREA DE IMPRESSÃO (A4) --- */}
            <div className="print-only bg-white text-black p-8 hidden">
                <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {/* Logo Dinâmica */}
                        <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
                            {printLogo ? (
                                <img src={printLogo} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-16 h-16 bg-gray-100 border border-black flex items-center justify-center">
                                    <span className="font-bold text-2xl">S</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold uppercase">Sucena Empreendimentos</h1>
                            <p className="text-sm">Cronograma de DDS - Segurança do Trabalho</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-bold capitalize">{monthName}</h2>
                        <p className="text-xs">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>

                <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-black p-2 text-left w-24">Data</th>
                            <th className="border border-black p-2 text-left w-24">Dia</th>
                            <th className="border border-black p-2 text-left w-1/3">Palestrante Responsável</th>
                            <th className="border border-black p-2 text-left">Tema Proposto</th>
                            <th className="border border-black p-2 text-center w-20">Assinatura</th>
                        </tr>
                    </thead>
                    <tbody>
                        {weekdays.map(day => {
                            const dateStr = day.toISOString().split('T')[0];
                            const record = getRecord(dateStr);
                            return (
                                <tr key={dateStr}>
                                    <td className="border border-black p-2 font-bold">{day.toLocaleDateString('pt-BR')}</td>
                                    <td className="border border-black p-2 capitalize">{day.toLocaleDateString('pt-BR', { weekday: 'long' })}</td>
                                    <td className="border border-black p-2 uppercase font-medium">{record.speakerName || ''}</td>
                                    <td className="border border-black p-2">{record.theme || ''}</td>
                                    <td className="border border-black p-2"></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="mt-8 pt-8 border-t border-black flex justify-between text-xs">
                    <div className="text-center w-1/3">
                        <div className="border-b border-black mb-1 w-full h-8"></div>
                        <p>Técnico de Segurança</p>
                    </div>
                    <div className="text-center w-1/3">
                        <div className="border-b border-black mb-1 w-full h-8"></div>
                        <p>Encarregado Geral</p>
                    </div>
                </div>
            </div>
            {/* --- FIM ÁREA DE IMPRESSÃO --- */}


            <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-600 rounded-lg text-white shadow-md">
                        <CalendarDays size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Escala de DDS</h2>
                        <p className="text-slate-500">Planejamento mensal de palestrantes e temas.</p>
                    </div>
                </div>

                {/* Controles do Mês */}
                <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200">
                    <button onClick={() => changeMonth(-1)} className="px-4 py-2 hover:bg-slate-50 border-r border-slate-200">←</button>
                    <span className="px-6 py-2 font-bold text-slate-700 capitalize min-w-[200px] text-center">{monthName}</span>
                    <button onClick={() => changeMonth(1)} className="px-4 py-2 hover:bg-slate-50 border-l border-slate-200">→</button>
                </div>
            </div>

            {!canEdit && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg flex items-center gap-2 no-print">
                    <Lock size={18} />
                    <span className="text-sm font-medium">Modo de Visualização: Apenas Técnicos de Segurança podem alterar a escala.</span>
                </div>
            )}

            <Card className="no-print">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-slate-100 pb-4">
                    
                    <div className="flex flex-wrap gap-2 ml-auto">
                        <Button variant="secondary" onClick={handlePrint}>
                            <Printer size={16} /> Gerar PDF / Imprimir
                        </Button>

                        {canEdit && (
                            <>
                                <div className="border-l border-slate-200 mx-2 hidden md:block"></div>
                                <Button variant="secondary" onClick={handleRandomize} title="Preencher dias vazios com usuários aleatórios">
                                    <Shuffle size={16} /> Sorteio Aleatório
                                </Button>
                                <Button 
                                    className="bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 border-red-200" 
                                    variant="secondary"
                                    onClick={handleClearMonth} 
                                    title="Limpar todos os agendamentos deste mês"
                                >
                                    <Trash2 size={16} /> Limpar Mês
                                </Button>
                                <Button onClick={handleSave}>
                                    <Save size={16} /> Salvar Alterações
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-slate-600 uppercase text-xs font-bold">
                                <th className="p-3 rounded-tl-lg">Data</th>
                                <th className="p-3">Dia</th>
                                <th className="p-3">Palestrante</th>
                                <th className="p-3">Tema Proposto</th>
                                <th className="p-3 rounded-tr-lg w-20">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {weekdays.map(day => {
                                const dateStr = day.toISOString().split('T')[0];
                                const record = getRecord(dateStr);
                                const isToday = dateStr === new Date().toISOString().split('T')[0];
                                const hasSpeaker = !!record.speakerName;

                                return (
                                    <tr key={dateStr} className={`hover:bg-slate-50 transition-colors ${isToday ? 'bg-purple-50' : ''}`}>
                                        <td className="p-3 text-sm font-medium text-slate-700 whitespace-nowrap">
                                            {day.toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-3 text-xs text-slate-500 capitalize">
                                            {day.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                        </td>
                                        <td className="p-3">
                                            {canEdit ? (
                                                <select 
                                                    className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                                                    value={record.speakerName}
                                                    onChange={(e) => handleUpdateRecord(dateStr, 'speakerName', e.target.value)}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {users.map(u => (
                                                        <option key={u.id} value={u.name}>{u.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    {record.speakerName ? <UserIcon size={14} className="text-slate-400"/> : null}
                                                    {record.speakerName || <span className="text-slate-300 italic">Não definido</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {canEdit ? (
                                                <input 
                                                    type="text" 
                                                    className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                    placeholder="Digite o tema..."
                                                    value={record.theme}
                                                    onChange={(e) => handleUpdateRecord(dateStr, 'theme', e.target.value)}
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    {record.theme ? <Mic2 size={14} className="text-purple-500"/> : null}
                                                    {record.theme || <span className="text-slate-300 italic">-</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {hasSpeaker && (
                                                <button 
                                                    onClick={() => handleNotifySpeaker(record)}
                                                    className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded-full transition-colors"
                                                    title="Notificar Palestrante via WhatsApp"
                                                >
                                                    <MessageCircle size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
