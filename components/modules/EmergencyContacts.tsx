
import React from 'react';
import { Card, Button } from '../ui/Shared';
import { Phone, Radio, MapPin, Ambulance, Flame, Leaf, Dog, Info, HeartPulse, RotateCcw } from 'lucide-react';

export const EmergencyContacts: React.FC = () => {
    
    const handleClearCache = () => {
        if (window.confirm("Isso limpará os cookies e o cache local do aplicativo e desconectará você.\n\nEsta ação é recomendada se você estiver enfrentando erros de carregamento ou problemas visuais.\n\nDeseja continuar?")) {
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            window.location.reload();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-red-600 rounded-lg text-white shadow-md animate-pulse">
                    <Ambulance size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Contatos de Emergência</h2>
                    <p className="text-slate-500">Procedimentos e comunicação em caso de acidentes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Canal de Rádio e Fixo */}
                <Card className="border-l-8 border-l-red-600 bg-red-50">
                    <h3 className="font-bold text-xl text-red-800 mb-4 flex items-center gap-2">
                        <Radio className="text-red-600" /> Comunicação Interna
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-red-200 shadow-sm">
                            <div>
                                <p className="text-sm text-slate-500 font-bold uppercase">Rádio Comunicador</p>
                                <p className="text-2xl font-black text-red-600">BOTÃO VERMELHO</p>
                            </div>
                            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white border-4 border-red-200">
                                <Radio size={24} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-red-200 shadow-sm">
                            <div>
                                <p className="text-sm text-slate-500 font-bold uppercase">Telefone Fixo</p>
                                <p className="text-2xl font-black text-slate-800">Ramal 9100</p>
                            </div>
                            <Phone className="text-slate-400" size={32} />
                        </div>
                    </div>
                </Card>

                {/* Telefones Celulares */}
                <Card className="border-l-8 border-l-orange-500">
                    <h3 className="font-bold text-xl text-orange-800 mb-4 flex items-center gap-2">
                        <Phone className="text-orange-600" /> Celulares de Emergência
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <a href="tel:91992071008" className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm flex items-center justify-between hover:bg-orange-50 transition-colors group">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Emergência 1</p>
                                <p className="text-xl font-bold text-slate-800 group-hover:text-orange-700">(91) 99207-1008</p>
                            </div>
                            <Phone className="text-green-500 fill-current" size={24} />
                        </a>
                        <a href="tel:91988717520" className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm flex items-center justify-between hover:bg-orange-50 transition-colors group">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Emergência 2</p>
                                <p className="text-xl font-bold text-slate-800 group-hover:text-orange-700">(91) 98871-7520</p>
                            </div>
                            <Phone className="text-green-500 fill-current" size={24} />
                        </a>
                    </div>
                </Card>
            </div>

            {/* Escopo de Atendimento */}
            <Card>
                <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                    <Info size={20} className="text-blue-600"/> Tipos de Ocorrência Atendidos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg border border-red-100 text-center">
                        <HeartPulse className="text-red-500 mb-2" size={32} />
                        <span className="font-bold text-red-800">Médica</span>
                        <span className="text-xs text-red-600">Acidentes e Mal súbito</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-orange-50 rounded-lg border border-orange-100 text-center">
                        <Flame className="text-orange-500 mb-2" size={32} />
                        <span className="font-bold text-orange-800">Incêndio</span>
                        <span className="text-xs text-orange-600">Fogo e Explosões</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg border border-green-100 text-center">
                        <Leaf className="text-green-500 mb-2" size={32} />
                        <span className="font-bold text-green-800">Ambiental</span>
                        <span className="text-xs text-green-600">Vazamentos e Danos</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-center">
                        <Dog className="text-yellow-600 mb-2" size={32} />
                        <span className="font-bold text-yellow-800">Fauna</span>
                        <span className="text-xs text-yellow-600">Captura de Animais</span>
                    </div>
                </div>
            </Card>

            {/* Ponto de Encontro */}
            <div className="bg-green-700 text-white rounded-xl p-6 shadow-lg border-4 border-green-500 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-white text-green-700 p-4 rounded-full">
                        <MapPin size={40} fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-widest">Ponto de Encontro</h3>
                        <p className="text-green-100">Dirija-se a este local em caso de evacuação.</p>
                    </div>
                </div>
                <div className="bg-white text-green-700 w-24 h-24 rounded-full flex items-center justify-center border-4 border-green-300 shadow-inner">
                    <span className="text-5xl font-black">33</span>
                </div>
            </div>

            {/* Área de Suporte Técnico / Limpeza de Cache */}
            <Card className="mt-8 border-t-4 border-t-slate-400 bg-slate-50">
                <h3 className="font-bold text-lg text-slate-700 mb-2 flex items-center gap-2">
                    <RotateCcw size={20} /> Manutenção do Aplicativo
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                    Se você estiver enfrentando problemas técnicos, lentidão ou erros de exibição, utilize o botão abaixo para limpar os dados locais do navegador e reiniciar o sistema.
                </p>
                <Button variant="secondary" onClick={handleClearCache} className="w-full border-slate-300 text-slate-700 hover:bg-slate-200">
                    Limpar Cookies e Cache do Sistema
                </Button>
            </Card>
        </div>
    );
};
