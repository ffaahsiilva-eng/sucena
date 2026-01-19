
import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button } from '../ui/Shared';
import { 
    Folder, 
    ArrowLeft, 
    Briefcase, 
    UserCog, 
    HardHat, 
    Shield, 
    CheckCircle2, 
    Circle,
    ChevronRight,
    Lock
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { MatrixRole, MatrixTask } from '../../types';
import { AuthService, User } from '../../services/authService';

const Icons: any = { Briefcase, UserCog, HardHat, Shield };

export const ResponsibilityMatrix: React.FC = () => {
    const [roles, setRoles] = useState<MatrixRole[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const loaded = StorageService.getMatrix();
        setRoles(loaded);
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
    }, []);

    const saveChanges = (newRoles: MatrixRole[]) => {
        setRoles(newRoles);
        StorageService.saveMatrix(newRoles);
    };

    // Função para verificar se o usuário pode editar esta função específica da matriz
    const canEditRole = (roleId: string): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === 'ADMIN') return true; // Admins têm acesso total

        const userJob = currentUser.jobTitle;

        // Mapeamento entre ID da Matriz e Nome do Cargo no Sistema
        switch (roleId) {
            case 'preposto':
                return userJob === 'Preposto';
            case 'enc_geral':
                return userJob === 'Encarregado Geral';
            case 'encarregado':
            case 'encarregado_verde': // Permite editar o duplicado também
                return userJob === 'Encarregado';
            case 'tec_seguranca':
                return userJob === 'Técnico de Segurança' || userJob === 'Téc. Segurança';
            default:
                return false;
        }
    };

    const selectedRole = useMemo(() => 
        roles.find(r => r.id === selectedRoleId), 
    [roles, selectedRoleId]);

    const handleToggleTask = (roleId: string, taskId: string) => {
        if (!canEditRole(roleId)) {
            alert("Acesso Negado: Você só pode editar a matriz de responsabilidade referente ao seu cargo.");
            return;
        }

        const newRoles = roles.map(role => {
            if (role.id !== roleId) return role;
            return {
                ...role,
                tasks: role.tasks.map(task => {
                    if (task.id !== taskId) return task;
                    return { ...task, completed: !task.completed };
                })
            };
        });
        saveChanges(newRoles);
    };

    const calculateProgress = (tasks: MatrixTask[]) => {
        if (tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.completed).length;
        return Math.round((completed / tasks.length) * 100);
    };

    if (selectedRole) {
        const progress = calculateProgress(selectedRole.tasks);
        const IconComponent = Icons[selectedRole.iconName];
        const isEditable = canEditRole(selectedRole.id);
        
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 mb-6">
                    <Button onClick={() => setSelectedRoleId(null)} variant="secondary" className="pr-3 pl-2">
                        <ArrowLeft size={18} /> Voltar
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <IconComponent className={`w-6 h-6 ${selectedRole.color.replace('bg-', 'text-')}`} />
                            {selectedRole.title}
                        </h2>
                        <div className="flex items-center gap-2">
                            <p className="text-slate-500 text-sm">Gerencie as responsabilidades e checklists desta função.</p>
                            {!isEditable && (
                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded flex items-center gap-1 border border-slate-200">
                                    <Lock size={10} /> Somente Leitura
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-1 h-fit">
                        <div className="flex flex-col items-center p-4">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${selectedRole.color} text-white shadow-lg`}>
                                <IconComponent size={40} />
                            </div>
                            <span className="text-3xl font-bold text-slate-800">{progress}%</span>
                            <span className="text-slate-500 text-sm mb-4">Conclusão Geral</span>
                            
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${selectedRole.color}`} 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            
                            <div className="mt-6 w-full text-center">
                                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">Status Atual</p>
                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${progress === 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {progress === 100 ? 'Completo' : 'Em Andamento'}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="md:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold text-lg text-slate-700">Lista de Responsabilidades</h3>
                             {!isEditable && (
                                 <span className="text-xs text-red-500 flex items-center gap-1 bg-red-50 px-2 py-1 rounded border border-red-100">
                                     <Lock size={12} /> Edição restrita ao cargo
                                 </span>
                             )}
                        </div>
                        
                        <div className="space-y-3">
                            {selectedRole.tasks.map((task) => (
                                <div 
                                    key={task.id}
                                    onClick={() => handleToggleTask(selectedRole.id, task.id)}
                                    className={`
                                        flex items-start gap-3 p-4 rounded-lg border transition-all group
                                        ${isEditable 
                                            ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm bg-white' 
                                            : 'cursor-not-allowed bg-slate-50 border-slate-200 opacity-80'}
                                        ${task.completed && isEditable ? 'bg-slate-50 border-slate-200 opacity-70' : ''}
                                    `}
                                    title={!isEditable ? "Você não tem permissão para alterar este item" : ""}
                                >
                                    <div className={`mt-0.5 shrink-0 transition-colors ${
                                        task.completed 
                                            ? 'text-green-500' 
                                            : (isEditable ? 'text-slate-300 group-hover:text-blue-400' : 'text-slate-300')
                                    }`}>
                                        {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                            {task.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-slate-800">Matriz de Responsabilidades</h3>
                <p className="text-slate-600 mt-1">Selecione uma função para visualizar e atualizar o progresso das atividades.</p>
                <p className="text-xs text-orange-500 mt-2 font-medium">* O progresso é zerado automaticamente no dia 01 de cada mês.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {roles.map((role) => {
                    const progress = calculateProgress(role.tasks);
                    const IconComponent = Icons[role.iconName];
                    const isEditable = canEditRole(role.id);
                    
                    return (
                        <div 
                            key={role.id}
                            onClick={() => setSelectedRoleId(role.id)}
                            className={`
                                bg-white rounded-xl shadow-sm border p-6 cursor-pointer transition-all group relative overflow-hidden
                                ${isEditable ? 'border-slate-200 hover:shadow-md hover:border-blue-300' : 'border-slate-200 opacity-90 hover:bg-slate-50'}
                            `}
                        >
                            <div className={`absolute top-0 left-0 w-full h-1 ${role.color}`}></div>
                            
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-lg ${role.color} bg-opacity-10 text-opacity-100`}>
                                    <IconComponent className={`w-8 h-8 ${role.color.replace('bg-', 'text-')}`} />
                                </div>
                                <div className={`p-2 rounded-full transition-colors ${isEditable ? 'bg-slate-50 group-hover:bg-blue-50' : 'bg-slate-100'}`}>
                                    {isEditable ? (
                                        <ChevronRight size={20} className="text-slate-400 group-hover:text-blue-500" />
                                    ) : (
                                        <Lock size={16} className="text-slate-400" />
                                    )}
                                </div>
                            </div>

                            <h4 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">
                                {role.title}
                            </h4>
                            <p className="text-sm text-slate-500 mb-6 flex items-center gap-1">
                                <Folder size={14} /> 
                                {role.tasks.length} atividades cadastradas
                            </p>

                            <div className="flex items-end justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase">Progresso</span>
                                <span className="text-sm font-bold text-slate-800">{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-700 ${role.color}`} 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
