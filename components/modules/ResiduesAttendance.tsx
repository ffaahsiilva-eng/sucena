
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, FileInput } from '../ui/Shared';
import { AuthService, User } from '../../services/authService';
import { StorageService } from '../../services/storageService';
import { AttendanceRecord } from '../../types';
import { Users, Share2, Save, Trash2, CheckCircle2, XCircle, HeartHandshake, UserPlus, Plus, Printer, ImagePlus } from 'lucide-react';

const TEAM_TEMPLATE = [
    { role: 'Jardineiro', name: 'JEFFERSON SILVA' },
    { role: 'Jardineiro', name: 'EDSON DARLEY' },
    { role: 'Jardineiro', name: 'RONALDINHO DOS SANTOS' },
    { role: 'Ajudante', name: 'ANDERSON DE ARAUJO' },
    { role: 'Ajudante', name: 'ARTHUR MENEZES' },
    { role: 'Ajudante', name: 'JOSIEL SOUZA' },
    { role: 'Motorista do Pipa', name: 'EDIELSON MARINHO' },
    { role: 'Motorista do Pipa', name: 'ANDERSON DA CRUZ' },
    { role: 'Motorista do Pipa', name: 'PAULO FÉLIX' },
    { role: 'Motorista do Pipa', name: 'Wellington' },
    { role: 'Motorista do Pipa', name: 'Fábio remédio' },
    { role: 'Motorista do Munck', name: 'MARCELINO' },
    { role: 'Sinaleiro', name: 'THAYLON SILVA' },
    { role: 'Mecânico montador', name: 'ANTÔNIO ERICK' },
    { role: 'Auxiliar de elétrica', name: 'MARCELO PINHEIRO' },
];

// Lista base de funções
const BASE_ROLES = [
    'Jardineiro', 
    'Ajudante', 
    'Motorista do Pipa', 
    'Motorista do Munck', 
    'Sinaleiro', 
    'Mecânico montador', 
    'Auxiliar de elétrica'
];

export const ResiduesAttendance: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    
    // Form States
    const [tstName, setTstName] = useState('ITAMAR DE SOUZA');
    const [encGeralName, setEncGeralName] = useState('DOMINGUES FABRICIO');
    const [encName, setEncName] = useState('RUDNEY SILVA');
    
    // Novo Colaborador States
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('Ajudante');
    const [customRoleName, setCustomRoleName] = useState(''); 
    
    // Lista de funções disponíveis (Base + Personalizadas do Storage)
    const [availableRoles, setAvailableRoles] = useState<string[]>(BASE_ROLES);

    // Configuração de Impressão (Carregada globalmente)
    const [printLogo, setPrintLogo] = useState<string | null>(null);

    // Estado da equipe atual
    const [teamStatus, setTeamStatus] = useState(
        TEAM_TEMPLATE.map(m => ({ ...m, name: m.name.toUpperCase(), present: true }))
    );

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
        setHistory(StorageService.getAttendance());

        // Carregar funções salvas globalmente
        const storedRoles = StorageService.getOperationalRoles();
        const uniqueRoles = Array.from(new Set([...BASE_ROLES, ...storedRoles]));
        setAvailableRoles(uniqueRoles);

        // --- CARREGAR EQUIPE SALVA DO STORAGE ---
        const storedTeam = StorageService.get(StorageService.KEYS.RESIDUES_TEAM);
        if (storedTeam && Array.isArray(storedTeam) && storedTeam.length > 0) {
            // Recarrega a equipe salva, definindo 'present' como true por padrão
            setTeamStatus(storedTeam.map((m: any) => ({ 
                role: m.role, 
                name: m.name, 
                present: true 
            })));
        }

        // Tentar carregar logo global como padrão inicial
        const config = StorageService.getAppConfig();
        if (config?.logoUrl) {
            setPrintLogo(config.logoUrl);
        }
    }, []);

    // Função auxiliar para atualizar o Storage da Equipe
    const updateTeamStorage = (newTeam: typeof teamStatus) => {
        // Salva apenas nome e função, sem o status de presença (que é diário)
        const templateToSave = newTeam.map(({ role, name }) => ({ role, name }));
        StorageService.save(StorageService.KEYS.RESIDUES_TEAM, templateToSave);
    };

    const togglePresence = (index: number) => {
        const newStatus = [...teamStatus];
        newStatus[index].present = !newStatus[index].present;
        setTeamStatus(newStatus);
    };

    const handleRemoveMember = (index: number) => {
        if (window.confirm("Remover este colaborador permanentemente da lista?")) {
            const newStatus = [...teamStatus];
            newStatus.splice(index, 1);
            setTeamStatus(newStatus);
            updateTeamStorage(newStatus); // Salva remoção no storage
        }
    };

    const handleAddMember = () => {
        if (!newMemberName.trim()) return;
        
        let finalRole = newMemberRole;
        if (newMemberRole === 'CUSTOM') {
            if (!customRoleName.trim()) {
                alert("Por favor, digite o nome da nova função.");
                return;
            }
            finalRole = customRoleName.trim();
            finalRole = finalRole.charAt(0).toUpperCase() + finalRole.slice(1);
            
            // Salvar função no Storage global (para Relatórios Gerais)
            StorageService.addOperationalRole(finalRole);
            
            if (!availableRoles.includes(finalRole)) {
                setAvailableRoles([...availableRoles, finalRole]);
            }
        }

        const newMember = {
            role: finalRole,
            name: newMemberName.toUpperCase(),
            present: true
        };

        const newStatus = [...teamStatus, newMember];
        setTeamStatus(newStatus);
        updateTeamStorage(newStatus); // Salva novo membro no storage
        
        // Resetar campos
        setNewMemberName('');
        setCustomRoleName('');
        setNewMemberRole('Ajudante'); 
    };

    const generateText = () => {
        const formatList = (list: typeof teamStatus) => {
            return list.map(m => `${m.name.toUpperCase()} ${m.present ? '✅' : '❌'}`).join('\n');
        };

        // Grupos Padrão (Base)
        const jardineiros = teamStatus.filter(m => m.role === 'Jardineiro');
        const ajudantes = teamStatus.filter(m => m.role === 'Ajudante');
        const pipas = teamStatus.filter(m => m.role === 'Motorista do Pipa');
        const munck = teamStatus.filter(m => m.role === 'Motorista do Munck');
        const sinaleiros = teamStatus.filter(m => m.role === 'Sinaleiro');
        const mecanicos = teamStatus.filter(m => m.role === 'Mecânico montador');
        const eletrica = teamStatus.filter(m => m.role === 'Auxiliar de elétrica');

        // Grupos Personalizados
        const customRolesList = teamStatus
            .filter(m => !BASE_ROLES.includes(m.role))
            .reduce((acc, curr) => {
                if (!acc.includes(curr.role)) acc.push(curr.role);
                return acc;
            }, [] as string[]);

        let customSections = '';
        customRolesList.forEach(role => {
            const members = teamStatus.filter(m => m.role === role);
            if (members.length > 0) {
                customSections += `\n 👷🏼 ${role}:\n${formatList(members)}\n`;
            }
        });

        return `CONTRATO RESÍDUOS ❇                     
 ❇ ÁREA DRS1 ❇ 
  
✳  ROÇAGEM  ✳

🚨PONTO DE AMBULÂNCIA 33🚨

❇ATIVIDADE ❇
 
🛠 ROÇAGEM E PODAGEM

✴EQUIPE DE SUPORTE✴ 
🙋‍♀ TST : ${tstName.toUpperCase()}
🙋‍♂ ENC GERAL: ${encGeralName.toUpperCase()} 
🙋‍♂ ENC: ${encName.toUpperCase()}


✴EQUIPE DE EXECUÇÃO✴

👷🏼‍♂Jardineiro:
${formatList(jardineiros)}
 
👷🏼‍♂ Ajudante:  
${formatList(ajudantes)}

👷🏼 Motorista do Pipa
${formatList(pipas)}

 👷🏼 Motorista do Munck
${formatList(munck)}

👷🏼 Sinaleiro
${formatList(sinaleiros)}

👷🏼 Mecânico montador 
${formatList(mecanicos)}

👷🏼 Auxiliar de elétrica 
${formatList(eletrica)}
${customSections}
 🧡🟢 FAZER SEGURANÇA É CUIDAR DE PESSOAS 🟢🧡`;
    };

    const handleShare = () => {
        const text = generateText();
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSave = () => {
        if (!currentUser) return;
        
        const record: AttendanceRecord = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            date: new Date().toISOString(),
            createdBy: currentUser.username,
            authorName: currentUser.name,
            authorRole: currentUser.jobTitle,
            tstName: tstName.toUpperCase(),
            encGeralName: encGeralName.toUpperCase(),
            encName: encName.toUpperCase(),
            team: teamStatus
        };

        StorageService.addAttendance(record);
        setHistory([record, ...history]);
        alert("Lista de presença salva com sucesso!");
    };

    const handleDelete = (id: string) => {
        if (currentUser?.role === 'ADMIN' && window.confirm("Deseja excluir este registro?")) {
            const updated = StorageService.deleteItem(StorageService.KEYS.RESIDUES_ATTENDANCE, id);
            setHistory(updated);
        }
    };

    return (
        <div className="space-y-6">
            
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
                            <p className="text-sm">Lista de Presença Diária - Contrato Resíduos (DRS1)</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-bold">{new Date().toLocaleDateString('pt-BR')}</h2>
                        <p className="text-xs">Gerado às: {new Date().toLocaleTimeString('pt-BR')}</p>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-3 gap-4 border border-black p-4 text-sm bg-gray-50">
                    <div>
                        <span className="font-bold block text-gray-500 text-xs uppercase">TST Responsável</span>
                        <span>{tstName}</span>
                    </div>
                    <div>
                        <span className="font-bold block text-gray-500 text-xs uppercase">Encarregado Geral</span>
                        <span>{encGeralName}</span>
                    </div>
                    <div>
                        <span className="font-bold block text-gray-500 text-xs uppercase">Encarregado</span>
                        <span>{encName}</span>
                    </div>
                </div>

                <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-black p-2 text-left w-1/3">Nome do Colaborador</th>
                            <th className="border border-black p-2 text-left w-1/4">Função</th>
                            <th className="border border-black p-2 text-center w-16">Presença</th>
                            <th className="border border-black p-2 text-left">Assinatura</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teamStatus.map((member, idx) => (
                            <tr key={idx}>
                                <td className="border border-black p-2 uppercase font-medium">{member.name}</td>
                                <td className="border border-black p-2">{member.role}</td>
                                <td className="border border-black p-2 text-center font-bold">
                                    {member.present ? 'P' : 'F'}
                                </td>
                                <td className="border border-black p-2"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-12 grid grid-cols-3 gap-8 text-xs text-center">
                    <div>
                        <div className="border-b border-black mb-1 h-8"></div>
                        <p className="font-bold">{tstName}</p>
                        <p>TST</p>
                    </div>
                    <div>
                        <div className="border-b border-black mb-1 h-8"></div>
                        <p className="font-bold">{encGeralName}</p>
                        <p>Encarregado Geral</p>
                    </div>
                    <div>
                        <div className="border-b border-black mb-1 h-8"></div>
                        <p className="font-bold">{encName}</p>
                        <p>Encarregado</p>
                    </div>
                </div>
            </div>
            {/* --- FIM ÁREA DE IMPRESSÃO --- */}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-600 rounded-lg text-white shadow-md">
                        <Users size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Lista de Presença (DRS1)</h2>
                        <p className="text-slate-500">Controle diário de efetivo.</p>
                    </div>
                </div>
                
                {/* Botão de Print sem opção de config */}
                <Button variant="secondary" onClick={handlePrint}>
                    <Printer size={16} /> Gerar PDF / Imprimir
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
                
                {/* Cartão de Preenchimento */}
                <Card className="border-t-4 border-t-green-600">
                    <div className="bg-slate-100 p-3 rounded mb-4 text-center font-bold text-green-800 border border-green-200">
                        CONTRATO RESÍDUOS - ÁREA DRS1
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-50 p-3 rounded border border-slate-200">
                            <h4 className="font-bold text-sm text-slate-700 mb-2 border-b pb-1">Equipe de Suporte</h4>
                            <div className="space-y-2">
                                <Input label="TST" value={tstName} onChange={e => setTstName(e.target.value.toUpperCase())} className="mb-0 uppercase"/>
                                <Input label="Enc. Geral" value={encGeralName} onChange={e => setEncGeralName(e.target.value.toUpperCase())} className="mb-0 uppercase"/>
                                <Input label="Encarregado" value={encName} onChange={e => setEncName(e.target.value.toUpperCase())} className="mb-0 uppercase"/>
                            </div>
                        </div>

                        {/* Adicionar Colaborador */}
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                            <h4 className="font-bold text-sm text-yellow-800 mb-2 flex items-center gap-2">
                                <UserPlus size={16} /> Adicionar Novo Colaborador
                            </h4>
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <input 
                                            type="text"
                                            placeholder="NOME COMPLETO"
                                            className="w-full p-2 border border-slate-300 rounded text-sm uppercase"
                                            value={newMemberName}
                                            onChange={e => setNewMemberName(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                    <div className="w-1/3">
                                        <select 
                                            className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
                                            value={newMemberRole}
                                            onChange={e => setNewMemberRole(e.target.value)}
                                        >
                                            {availableRoles.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                            <option value="CUSTOM">✨ Nova Função...</option>
                                        </select>
                                    </div>
                                    <button 
                                        onClick={handleAddMember}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded transition-colors"
                                        disabled={!newMemberName.trim() || (newMemberRole === 'CUSTOM' && !customRoleName.trim())}
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                
                                {/* Input condicional para Nova Função */}
                                {newMemberRole === 'CUSTOM' && (
                                    <div className="animate-in fade-in slide-in-from-top-1">
                                        <input 
                                            type="text"
                                            placeholder="Digite o nome da nova função (Ex: Pintor, Vigia...)"
                                            className="w-full p-2 border border-yellow-300 rounded text-sm bg-yellow-100 placeholder-yellow-600/50 focus:ring-2 focus:ring-yellow-500 outline-none"
                                            value={customRoleName}
                                            onChange={e => setCustomRoleName(e.target.value)}
                                            autoFocus
                                        />
                                        <p className="text-[10px] text-yellow-700 mt-1">* Esta função será salva automaticamente nos Relatórios Gerais.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm text-slate-700 mb-2 flex justify-between items-end">
                                <span>Equipe de Execução</span>
                                <span className="text-xs text-slate-400 font-normal">Toque no ícone para presença | Lixeira para remover</span>
                            </h4>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                                {teamStatus.map((member, idx) => (
                                    <div 
                                        key={idx}
                                        className={`flex items-center justify-between p-3 rounded border transition-all ${
                                            member.present 
                                            ? 'bg-green-50 border-green-200' 
                                            : 'bg-red-50 border-red-200 opacity-70'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Botão de Remover */}
                                            <button 
                                                onClick={() => handleRemoveMember(idx)}
                                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                                title="Remover colaborador permanentemente da lista"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{member.name}</p>
                                                <p className="text-xs text-slate-500">{member.role}</p>
                                            </div>
                                        </div>
                                        
                                        <div 
                                            onClick={() => togglePresence(idx)}
                                            className="cursor-pointer hover:scale-110 transition-transform"
                                        >
                                            {member.present 
                                                ? <CheckCircle2 className="text-green-600" size={24} /> 
                                                : <XCircle className="text-red-500" size={24} />
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-orange-50 text-orange-700 text-center text-xs font-bold p-2 rounded border border-orange-200 flex items-center justify-center gap-2">
                            <HeartHandshake size={16} />
                            FAZER SEGURANÇA É CUIDAR DE PESSOAS
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleShare}>
                                <Share2 size={18} /> Gerar WhatsApp
                            </Button>
                            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handlePrint}>
                                <Printer size={18} /> Gerar PDF / Imprimir
                            </Button>
                            <Button className="flex-1 bg-slate-800 hover:bg-slate-900 text-white" onClick={handleSave}>
                                <Save size={18} /> Salvar Histórico
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Histórico */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-slate-700">Histórico de Chamadas</h3>
                    {history.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                            <p className="text-slate-400">Nenhum registro salvo.</p>
                        </div>
                    )}
                    {history.map(rec => {
                        const presentCount = rec.team.filter(t => t.present).length;
                        const totalCount = rec.team.length;
                        return (
                            <Card key={rec.id} className="relative">
                                {currentUser?.role === 'ADMIN' && (
                                    <button 
                                        onClick={() => handleDelete(rec.id)}
                                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-slate-800">Resíduos DRS1</h4>
                                        <p className="text-xs text-slate-500">{new Date(rec.createdAt).toLocaleDateString('pt-BR')} - {new Date(rec.createdAt).toLocaleTimeString('pt-BR')}</p>
                                    </div>
                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                                        {presentCount}/{totalCount} Presentes
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 flex flex-wrap gap-1">
                                    {rec.team.filter(t => !t.present).length > 0 ? (
                                        <>
                                            <span className="font-bold text-red-500">Ausentes:</span>
                                            {rec.team.filter(t => !t.present).map(t => t.name).join(', ')}
                                        </>
                                    ) : (
                                        <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle2 size={10}/> Equipe Completa</span>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
