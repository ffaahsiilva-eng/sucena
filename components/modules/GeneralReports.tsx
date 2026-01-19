
import React, { useState, useEffect } from 'react';
import { Card, Input, AITextArea, Button } from '../ui/Shared';
import { GeneralReport } from '../../types';
import { StorageService } from '../../services/storageService';
import { AuthService, User } from '../../services/authService';
import { Plus, Clock, Share2, Sun, Cloud, CloudRain, HardHat, Truck, FileText, Users, Wrench, Trash2, User as UserIcon } from 'lucide-react';

// Componente auxiliar para Input Numérico
const NumberInput: React.FC<{ label: string, value?: number, onChange: (val: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col">
      <label className="text-xs font-bold text-slate-500 uppercase mb-1 truncate" title={label}>{label}</label>
      <input 
          type="number" 
          min="0"
          className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-yellow-500 outline-none text-center"
          value={value || 0}
          onChange={e => onChange(parseInt(e.target.value) || 0)}
      />
  </div>
);

export const GeneralReports: React.FC = () => {
  const [reports, setReports] = useState<GeneralReport[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Lista de funções personalizadas carregadas do Storage
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  
  useEffect(() => {
    setReports(StorageService.getReports());
    const user = AuthService.getCurrentUser();
    if (user) {
        setCurrentUser(user);
        if (user.role === 'ADMIN') setIsAdmin(true);
    }

    // Carregar Funções Operacionais e filtrar as que já existem no layout padrão
    const allRoles = StorageService.getOperationalRoles();
    const standardKeys = [
        'Jardineiro', 'Ajudante', 'Motorista do Pipa', 'Motorista do Munck', 
        'Sinaleiro', 'Mecânico montador', 'Auxiliar de elétrica',
        // Outros mapeamentos do formulário padrão
        'Polivalente', 'Meia Oficial', 'Eletricista'
    ];
    
    // Filtra apenas as funções NOVAS/CUSTOMIZADAS
    const newRoles = allRoles.filter(role => !standardKeys.some(std => std.toLowerCase() === role.toLowerCase()));
    setCustomRoles(newRoles);

  }, []);
  
  const handleDelete = (id: string) => {
      if (window.confirm("Admin: Tem certeza que deseja excluir este relatório?")) {
          const updated = StorageService.deleteItem(StorageService.KEYS.REPORTS, id);
          setReports(updated);
      }
  };

  // Estado inicial
  const [formData, setFormData] = useState<Partial<GeneralReport>>({
    date: new Date().toISOString().split('T')[0],
    contract: '460001269',
    management: 'Hydro',
    leadership: 'Eng. Luís Araújo',
    tst: 'Alexia Chaves',
    location: 'Alunorte Barcarena',
    startTime: '07:00',
    endTime: '17:00',
    
    activitiesJardinagem: 'DRS1\n* Roçagem Coroamento 114 unidades berma 30 (Faixa 3)\n* Irrigação com pipas ( Faixa 3 e 4 )',
    activitiesGabiao: 'Atividades na área faixa 2 Fase 1 elevação 28\n* Escavação manual\n* Retirada de tubulação 30mt de piad\n* Reposição de tubulação de 6 polegada\n* Reposição de silte 4 m²\n* Limpeza e organização\n* Adequação da tenda',
    
    // Contadores Padrão (Jardinagem)
    qtyJardineiroJardinagem: 2,
    qtyAjudanteJardinagemNew: 2,
    qtyMotoristaPipaJardinagem: 2,
    qtyMotoristaMunckJardinagem: 0,
    qtySinaleiroJardinagem: 0,
    qtyMecanicoJardinagem: 0,
    qtyAuxEletricaJardinagem: 0,

    // Contadores Padrão (Gabião)
    qtyJardineiroGabiao: 0,
    qtyAjudanteGabiaoNew: 4,
    qtyMotoristaPipaGabiao: 0,
    qtyMotoristaMunckGabiao: 0,
    qtySinaleiroGabiao: 0,
    qtyMecanicoGabiao: 1,
    qtyAuxEletricaGabiao: 1,

    // Inicializa objeto vazio para extras
    extraLabor: {},

    // Equipamentos
    qtyVeiculoLeve: 1,
    qtyOnibus: 1,
    qtyCaminhaoPipa: 3,
    qtyMunck: 1,
    equipmentDetails: 'Placas Pipas: RQS3F79 - RQN2D45 - RQM5G02',

    weatherMorning: 'Sol',
    weatherAfternoon: 'Sol',
    occurrences: 'Não Houve.',
    
    sector: 'Operacional',
    responsible: 'Gestor'
  });

  const generateWhatsAppText = (data: Partial<GeneralReport>) => {
    const dayOfWeek = new Date(data.date!).toLocaleDateString('pt-BR', { weekday: 'long' });
    const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    const dateFormatted = new Date(data.date!).toLocaleDateString('pt-BR');

    const fmtQty = (qty?: number, label?: string) => {
        if (!qty || qty <= 0) return '';
        const num = qty.toString().padStart(2, '0');
        return `${num} ${label}\n`;
    };

    let efetivoJardinagem = '';
    // Prioriza novos campos, fallback para antigos se necessário
    const j_jardineiro = data.qtyJardineiroJardinagem ?? data.qtyJardineiro;
    const j_ajudante = data.qtyAjudanteJardinagemNew ?? data.qtyAjudanteJardinagem;
    const j_motPipa = data.qtyMotoristaPipaJardinagem ?? data.qtyAjudantePipa; // Ajudante Pipa virou Mot. Pipa aqui
    
    efetivoJardinagem += fmtQty(j_jardineiro, 'Jardineiro');
    efetivoJardinagem += fmtQty(j_ajudante, 'Ajudante');
    efetivoJardinagem += fmtQty(j_motPipa, 'Motorista Pipa');
    efetivoJardinagem += fmtQty(data.qtyMotoristaMunckJardinagem, 'Motorista Munck');
    efetivoJardinagem += fmtQty(data.qtySinaleiroJardinagem, 'Sinaleiro');
    efetivoJardinagem += fmtQty(data.qtyMecanicoJardinagem, 'Mecânico');
    efetivoJardinagem += fmtQty(data.qtyAuxEletricaJardinagem, 'Aux. Elétrica');
    
    // Adicionar Extras Jardinagem
    if (data.extraLabor) {
        Object.keys(data.extraLabor).forEach(role => {
            const count = data.extraLabor![role]?.jardinagem || 0;
            efetivoJardinagem += fmtQty(count, role);
        });
    }

    if (efetivoJardinagem) efetivoJardinagem = `*Equipe Jardinagem*\n${efetivoJardinagem}`;

    let efetivoGabiao = '';
    // Prioriza novos campos
    const g_ajudante = data.qtyAjudanteGabiaoNew ?? data.qtyAjudanteGabiao;
    const g_auxEletrica = data.qtyAuxEletricaGabiao ?? data.qtyAuxEletrica;
    const g_mecanico = data.qtyMecanicoGabiao ?? data.qtyMecanico;

    efetivoGabiao += fmtQty(data.qtyJardineiroGabiao, 'Jardineiro');
    efetivoGabiao += fmtQty(g_ajudante, 'Ajudante');
    efetivoGabiao += fmtQty(data.qtyMotoristaPipaGabiao, 'Motorista Pipa');
    efetivoGabiao += fmtQty(data.qtyMotoristaMunckGabiao, 'Motorista Munck');
    efetivoGabiao += fmtQty(data.qtySinaleiroGabiao, 'Sinaleiro');
    efetivoGabiao += fmtQty(g_mecanico, 'Mecânico');
    efetivoGabiao += fmtQty(g_auxEletrica, 'Aux. Elétrica');
    // Campos legados que podem ser usados se preenchidos (Polivalente/Meia Oficial)
    efetivoGabiao += fmtQty(data.qtyPolivalente, 'Polivalente');
    efetivoGabiao += fmtQty(data.qtyMeiaOficial, 'Meia Oficial');
    efetivoGabiao += fmtQty(data.qtyEletricista, 'Eletricista');

    // Adicionar Extras Gabião
    if (data.extraLabor) {
        Object.keys(data.extraLabor).forEach(role => {
            const count = data.extraLabor![role]?.gabiao || 0;
            efetivoGabiao += fmtQty(count, role);
        });
    }

    if (efetivoGabiao) efetivoGabiao = `*Equipe Gabião*\n${efetivoGabiao}`;

    let equipamentos = '';
    equipamentos += fmtQty(data.qtyVeiculoLeve, 'Veículo Leve');
    equipamentos += fmtQty(data.qtyOnibus, 'Ônibus');
    equipamentos += fmtQty(data.qtyCaminhaoPipa, 'Caminhão Pipa');
    equipamentos += fmtQty(data.qtyMunck, 'Caminhão Munck');
    
    const totalEquip = (data.qtyVeiculoLeve || 0) + (data.qtyOnibus || 0) + (data.qtyCaminhaoPipa || 0) + (data.qtyMunck || 0);

    return `🏗 EMPRESA: Sucena Empreendimentos 

📄 CONTRATO - ${data.contract}

➡ GERÊNCIA: ${data.management}

➡ LIDERANÇA: ${data.leadership}
 
➡ TST: ${data.tst}

➡ LOCAL: ${data.location}

➡ DATA: ${dateFormatted} (${capitalizedDay})

➡ HORÁRIO: ${data.startTime} as ${data.endTime}

🛠 ATIVIDADES:
 
*Jardinagem*
${data.activitiesJardinagem}

*Manutenção de Gabião*
${data.activitiesGabiao}
 
👷🏻Efetivo👷🏾‍♂
${efetivoJardinagem}
${efetivoGabiao}

🚜 EQUIPAMENTOS 
${equipamentos}
*Detalhes:* ${data.equipmentDetails || '-'}
Total: ${totalEquip.toString().padStart(2, '0')} Equipamentos

Condições climáticas:
• MANHÃ = ${data.weatherMorning}
• TARDE = ${data.weatherAfternoon}

⚠ DIFICULDADES/DESVIOS
${data.occurrences || 'Não Houve.'}`;
  };

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    const text = generateWhatsAppText(formData);
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: GeneralReport = {
      ...formData as GeneralReport,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      description: `${formData.activitiesJardinagem}\n${formData.activitiesGabiao}`,
      createdBy: currentUser?.username || 'Sistema',
      authorName: currentUser?.name || 'Anônimo',
      authorRole: currentUser?.jobTitle || 'N/A'
    };
    StorageService.addReport(newReport);
    setReports([newReport, ...reports]);
    setIsFormOpen(false);
  };

  // Handler para inputs dinâmicos
  const handleExtraLaborChange = (role: string, area: 'jardinagem' | 'gabiao', val: number) => {
      setFormData(prev => {
          const currentExtras = prev.extraLabor || {};
          const roleData = currentExtras[role] || { jardinagem: 0, gabiao: 0 };
          
          return {
              ...prev,
              extraLabor: {
                  ...currentExtras,
                  [role]: {
                      ...roleData,
                      [area]: val
                  }
              }
          };
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="font-bold text-lg text-slate-800">Relatórios Gerais</h3>
           <p className="text-slate-500 text-sm">Gerador de relatórios diários padronizados.</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>
            {isFormOpen ? 'Fechar Formulário' : <><Plus size={18} /> Novo Relatório</>}
        </Button>
      </div>

      {isFormOpen && (
        <Card className="animate-in fade-in slide-in-from-top-4 duration-300 border-t-4 border-t-yellow-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Seção 1: Cabeçalho */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="lg:col-span-3 pb-2 border-b border-slate-200 mb-2 font-bold text-slate-700 flex items-center gap-2">
                    <FileText size={18} className="text-yellow-600"/> Informações do Contrato
                </div>
                <Input label="Contrato" value={formData.contract} onChange={e => setFormData({...formData, contract: e.target.value})} />
                <Input label="Gerência" value={formData.management} onChange={e => setFormData({...formData, management: e.target.value})} />
                <Input label="Liderança" value={formData.leadership} onChange={e => setFormData({...formData, leadership: e.target.value})} />
                <Input label="TST Responsável" value={formData.tst} onChange={e => setFormData({...formData, tst: e.target.value})} />
                <Input label="Local" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                <Input label="Data" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                <div className="flex gap-4 lg:col-span-3">
                    <Input label="Início" type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full" />
                    <Input label="Fim" type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full" />
                </div>
            </div>

            {/* Seção 2: Atividades */}
            <div className="space-y-4">
                <h4 className="font-bold text-slate-700 border-l-4 border-yellow-500 pl-2">🛠 Atividades Realizadas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AITextArea 
                        label="Jardinagem" 
                        value={formData.activitiesJardinagem} 
                        onChange={e => setFormData({...formData, activitiesJardinagem: e.target.value})}
                        rows={6}
                    />
                    <AITextArea 
                        label="Manutenção de Gabião" 
                        value={formData.activitiesGabiao} 
                        onChange={e => setFormData({...formData, activitiesGabiao: e.target.value})}
                        rows={6}
                    />
                </div>
            </div>

            {/* Seção 3: Recursos (Efetivo Separado com mesmos cargos) */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-4"><Users size={18} /> Controle de Efetivo</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Equipe Jardinagem */}
                    <div>
                        <h5 className="text-sm font-bold text-green-700 border-b border-green-200 pb-2 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Equipe Jardinagem
                        </h5>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            <NumberInput label="Jardineiro" value={formData.qtyJardineiroJardinagem} onChange={v => setFormData(p => ({...p, qtyJardineiroJardinagem: v}))} />
                            <NumberInput label="Ajudante" value={formData.qtyAjudanteJardinagemNew} onChange={v => setFormData(p => ({...p, qtyAjudanteJardinagemNew: v}))} />
                            <NumberInput label="Mot. Pipa" value={formData.qtyMotoristaPipaJardinagem} onChange={v => setFormData(p => ({...p, qtyMotoristaPipaJardinagem: v}))} />
                            <NumberInput label="Mot. Munck" value={formData.qtyMotoristaMunckJardinagem} onChange={v => setFormData(p => ({...p, qtyMotoristaMunckJardinagem: v}))} />
                            <NumberInput label="Sinaleiro" value={formData.qtySinaleiroJardinagem} onChange={v => setFormData(p => ({...p, qtySinaleiroJardinagem: v}))} />
                            <NumberInput label="Mecânico" value={formData.qtyMecanicoJardinagem} onChange={v => setFormData(p => ({...p, qtyMecanicoJardinagem: v}))} />
                            <NumberInput label="Aux. Elét." value={formData.qtyAuxEletricaJardinagem} onChange={v => setFormData(p => ({...p, qtyAuxEletricaJardinagem: v}))} />
                            
                            {/* Extras Dinâmicos */}
                            {customRoles.map(role => (
                                <NumberInput 
                                    key={`j-${role}`} 
                                    label={role} 
                                    value={formData.extraLabor?.[role]?.jardinagem} 
                                    onChange={v => handleExtraLaborChange(role, 'jardinagem', v)} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Equipe Gabião */}
                    <div>
                        <h5 className="text-sm font-bold text-blue-700 border-b border-blue-200 pb-2 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Equipe Gabião
                        </h5>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            <NumberInput label="Jardineiro" value={formData.qtyJardineiroGabiao} onChange={v => setFormData(p => ({...p, qtyJardineiroGabiao: v}))} />
                            <NumberInput label="Ajudante" value={formData.qtyAjudanteGabiaoNew} onChange={v => setFormData(p => ({...p, qtyAjudanteGabiaoNew: v}))} />
                            <NumberInput label="Mot. Pipa" value={formData.qtyMotoristaPipaGabiao} onChange={v => setFormData(p => ({...p, qtyMotoristaPipaGabiao: v}))} />
                            <NumberInput label="Mot. Munck" value={formData.qtyMotoristaMunckGabiao} onChange={v => setFormData(p => ({...p, qtyMotoristaMunckGabiao: v}))} />
                            <NumberInput label="Sinaleiro" value={formData.qtySinaleiroGabiao} onChange={v => setFormData(p => ({...p, qtySinaleiroGabiao: v}))} />
                            <NumberInput label="Mecânico" value={formData.qtyMecanicoGabiao} onChange={v => setFormData(p => ({...p, qtyMecanicoGabiao: v}))} />
                            <NumberInput label="Aux. Elét." value={formData.qtyAuxEletricaGabiao} onChange={v => setFormData(p => ({...p, qtyAuxEletricaGabiao: v}))} />
                            
                             {/* Extras Dinâmicos */}
                             {customRoles.map(role => (
                                <NumberInput 
                                    key={`g-${role}`} 
                                    label={role} 
                                    value={formData.extraLabor?.[role]?.gabiao} 
                                    onChange={v => handleExtraLaborChange(role, 'gabiao', v)} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Equipamentos */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-fit">
                <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-4"><Truck size={18} /> Equipamentos</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <NumberInput label="Veículo Leve" value={formData.qtyVeiculoLeve} onChange={v => setFormData(p => ({...p, qtyVeiculoLeve: v}))} />
                    <NumberInput label="Ônibus" value={formData.qtyOnibus} onChange={v => setFormData(p => ({...p, qtyOnibus: v}))} />
                    <NumberInput label="Caminhão Pipa" value={formData.qtyCaminhaoPipa} onChange={v => setFormData(p => ({...p, qtyCaminhaoPipa: v}))} />
                    <NumberInput label="Caminhão Munck" value={formData.qtyMunck} onChange={v => setFormData(p => ({...p, qtyMunck: v}))} />
                </div>
                <Input 
                    label="Detalhes / Placas" 
                    placeholder="Ex: RQS3F79, RQN2D45..."
                    value={formData.equipmentDetails} 
                    onChange={e => setFormData({...formData, equipmentDetails: e.target.value})} 
                />
            </div>

            {/* Seção 4: Clima e Desvios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Cloud size={18}/> Condições Climáticas</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Manhã</label>
                            <select 
                                className="w-full p-2 rounded border border-blue-200 bg-white"
                                value={formData.weatherMorning}
                                onChange={e => setFormData({...formData, weatherMorning: e.target.value as any})}
                            >
                                <option value="Sol">Sol</option>
                                <option value="Nublado">Nublado</option>
                                <option value="Chuva">Chuva</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tarde</label>
                            <select 
                                className="w-full p-2 rounded border border-blue-200 bg-white"
                                value={formData.weatherAfternoon}
                                onChange={e => setFormData({...formData, weatherAfternoon: e.target.value as any})}
                            >
                                <option value="Sol">Sol</option>
                                <option value="Nublado">Nublado</option>
                                <option value="Chuva">Chuva</option>
                            </select>
                        </div>
                    </div>
                 </div>

                 <AITextArea 
                    label="⚠ Dificuldades / Desvios"
                    value={formData.occurrences}
                    onChange={e => setFormData({...formData, occurrences: e.target.value})}
                    rows={3}
                    className="border-red-200 focus:ring-red-200"
                 />
            </div>

            <div className="flex flex-col md:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" onClick={handleShareWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
                 <Share2 size={18} /> Enviar no WhatsApp
              </Button>
              <Button type="submit">
                 Salvar no Sistema
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            Nenhum relatório registrado ainda.
          </div>
        ) : (
          reports.map(report => (
            <Card key={report.id} className="hover:shadow-md transition-shadow relative">
              {isAdmin && (
                  <button 
                      onClick={() => handleDelete(report.id)} 
                      className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                      title="Admin: Excluir Relatório"
                  >
                      <Trash2 size={18} />
                  </button>
              )}

              <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-2 pr-10">
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-slate-800">Relatório Diário - {report.location}</span>
                  <span className="text-slate-500 text-sm flex items-center gap-1"><Clock size={14}/> {new Date(report.date).toLocaleDateString('pt-BR')} ({report.startTime} - {report.endTime})</span>
                </div>
                <Button 
                    variant="secondary" 
                    className="text-xs py-1 h-8"
                    onClick={() => {
                        const text = generateWhatsAppText(report);
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                >
                    <Share2 size={14} /> Reenviar
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                  <div>
                      <p className="font-bold text-slate-700">Liderança:</p>
                      <p className="text-slate-600 mb-2">{report.leadership} / {report.tst}</p>
                  </div>
                  <div>
                      <p className="font-bold text-slate-700">Clima:</p>
                      <div className="flex gap-2">
                         <span className="flex items-center gap-1"><Sun size={12} className="text-orange-400"/> M: {report.weatherMorning}</span>
                         <span className="flex items-center gap-1"><Sun size={12} className="text-orange-400"/> T: {report.weatherAfternoon}</span>
                      </div>
                  </div>
              </div>

              <div className="mt-3 bg-slate-50 p-3 rounded text-sm text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                 <span className="font-bold block mb-1">Resumo Atividades:</span>
                 {report.activitiesJardinagem}
              </div>

              {report.occurrences && report.occurrences !== 'Não Houve.' && (
                 <div className="mt-3 bg-red-50 p-2 rounded text-xs border border-red-100 text-red-700">
                    <span className="font-bold">⚠ Desvios:</span> {report.occurrences}
                 </div>
              )}

              {/* Created By Footer */}
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-500">
                  <UserIcon size={12} /> Enviado por: 
                  <span className="font-bold text-slate-700">{report.authorName || report.createdBy || 'Anônimo'}</span>
                  {report.authorRole && <span className="bg-slate-100 px-1 rounded text-slate-500">- {report.authorRole}</span>}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
