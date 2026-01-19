import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Shared';
import { LogRecord } from '../../types';
import { StorageService } from '../../services/storageService';
import { ScrollText, CheckCircle, XCircle, Info, Calendar } from 'lucide-react';

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogRecord[]>([]);

  useEffect(() => {
    const loaded = StorageService.getLogs();
    setLogs(loaded);
  }, []);

  const getIcon = (action: string) => {
      switch(action) {
          case 'APROVADO': return <CheckCircle size={20} className="text-green-500" />;
          case 'REPROVADO': return <XCircle size={20} className="text-red-500" />;
          default: return <Info size={20} className="text-blue-500" />;
      }
  };

  const getBadgeColor = (action: string) => {
    switch(action) {
        case 'APROVADO': return 'bg-green-100 text-green-700 border-green-200';
        case 'REPROVADO': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-slate-900 rounded-lg text-white shadow-md">
             <ScrollText size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Logs do Sistema</h2>
            <p className="text-slate-500">Histórico de ações, vistorias e registros importantes.</p>
          </div>
       </div>

       <div className="space-y-4">
           {logs.length === 0 ? (
               <Card className="py-12 text-center text-slate-400">
                   <Info className="mx-auto mb-2 opacity-50" size={48} />
                   <p>Nenhum registro encontrado no histórico.</p>
               </Card>
           ) : (
               logs.map(log => (
                   <Card key={log.id} className="flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow">
                       <div className="flex items-start gap-4 flex-1">
                           <div className="mt-1">{getIcon(log.action)}</div>
                           <div>
                               <div className="flex items-center gap-2 mb-1">
                                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeColor(log.action)}`}>
                                       {log.action}
                                   </span>
                                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                       {log.category}
                                   </span>
                               </div>
                               <h4 className="text-slate-800 font-medium">{log.description}</h4>
                               {log.details && (
                                   <p className="text-sm text-slate-500 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                                       {log.details}
                                   </p>
                               )}
                           </div>
                       </div>
                       
                       <div className="flex flex-row md:flex-col justify-between md:items-end text-xs text-slate-400 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 min-w-[150px]">
                           <div className="flex items-center gap-1">
                               <Calendar size={12} />
                               {new Date(log.createdAt).toLocaleDateString('pt-BR')}
                           </div>
                           <div className="text-right">
                               <span className="block">{new Date(log.createdAt).toLocaleTimeString('pt-BR')}</span>
                               <span className="block font-medium text-slate-600 mt-1">
                                   {log.authorName || log.createdBy || 'Sistema'}
                               </span>
                           </div>
                       </div>
                   </Card>
               ))
           )}
       </div>
    </div>
  );
};