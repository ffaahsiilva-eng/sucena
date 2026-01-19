
import React, { useState, useEffect } from 'react';
import { Card, Button, FileInput } from '../ui/Shared';
import { StorageService } from '../../services/storageService';
import { Palette, LayoutTemplate, ArrowUp, ArrowDown, Save, RefreshCw } from 'lucide-react';
import { ModuleType } from '../../types';

export const Appearance: React.FC = () => {
  // Customization State (Minimalist Defaults)
  const [logoUrl, setLogoUrl] = useState('');
  const [loginLogoUrl, setLoginLogoUrl] = useState(''); 
  const [sidebarColor, setSidebarColor] = useState('#ffffff'); // Fundo Branco
  const [sidebarTextColor, setSidebarTextColor] = useState('#475569'); // Slate 600
  const [sidebarIconColor, setSidebarIconColor] = useState('#475569'); // Slate 600
  const [sidebarHighlightColor, setSidebarHighlightColor] = useState('#f1f5f9'); // Slate 100
  
  // Menu Reordering State
  const [menuItemsOrder, setMenuItemsOrder] = useState<{id: ModuleType, label: string}[]>([]);

  // Lista de Módulos (Labels para exibição na reordenação)
  const moduleLabels: Record<string, string> = {
      [ModuleType.DASHBOARD]: 'Notícias',
      [ModuleType.REMINDERS]: 'Lembretes',
      [ModuleType.WORK_PERMITS]: 'Permissão Trabalho',
      [ModuleType.SITE_INSPECTION]: 'Vistoria Canteiro',
      [ModuleType.MATRIZ]: 'Matriz Responsabilidades',
      [ModuleType.DDS]: 'DDS do Dia',
      [ModuleType.INSPECTION]: 'Ficha de Vistoria',
      [ModuleType.EQUIPMENT_INSPECTION]: 'Vistoria Equipamentos',
      [ModuleType.GENERAL_REPORTS]: 'Relatórios Gerais',
      [ModuleType.SAFETY]: 'Segurança',
      [ModuleType.STOCK]: 'Pedidos',
      [ModuleType.DEVIATIONS]: 'Desvios',
      [ModuleType.CLEANING]: 'Limpeza',
      [ModuleType.GALLERY]: 'Galeria de Fotos',
      [ModuleType.LOGS]: 'Logs do Sistema',
      [ModuleType.RESIDUES_ATTENDANCE]: 'Lista de Presença',
      [ModuleType.EMERGENCY]: 'Emergência',
      [ModuleType.ADMIN]: 'Administração',
      [ModuleType.DDS_SCHEDULE]: 'Escala DDS',
      [ModuleType.APPEARANCE]: 'Personalização'
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
      const config = StorageService.getAppConfig();
      if (config) {
          if (config.logoUrl) setLogoUrl(config.logoUrl);
          if (config.loginLogoUrl) setLoginLogoUrl(config.loginLogoUrl);
          if (config.sidebarColor) setSidebarColor(config.sidebarColor);
          if (config.sidebarTextColor) setSidebarTextColor(config.sidebarTextColor);
          if (config.sidebarIconColor) setSidebarIconColor(config.sidebarIconColor);
          if (config.sidebarHighlightColor) setSidebarHighlightColor(config.sidebarHighlightColor);
          
          if (config.menuOrder && config.menuOrder.length > 0) {
              const allKeys = Object.keys(moduleLabels) as ModuleType[];
              const ordered = config.menuOrder.filter(id => allKeys.includes(id));
              const missing = allKeys.filter(id => !ordered.includes(id));
              
              const fullList = [...ordered, ...missing].map(id => ({
                  id,
                  label: moduleLabels[id]
              }));
              setMenuItemsOrder(fullList);
          } else {
              const defaultList = Object.keys(moduleLabels).map(key => ({
                  id: key as ModuleType,
                  label: moduleLabels[key]
              }));
              setMenuItemsOrder(defaultList);
          }
      } else {
          const defaultList = Object.keys(moduleLabels).map(key => ({
              id: key as ModuleType,
              label: moduleLabels[key]
          }));
          setMenuItemsOrder(defaultList);
      }
  };

  const handleSaveConfig = () => {
      const currentConfig = StorageService.getAppConfig();
      const blockedModules = currentConfig?.blockedModules || {};

      const config = {
          logoUrl,
          loginLogoUrl, 
          sidebarColor,
          sidebarTextColor,
          sidebarIconColor,
          sidebarHighlightColor,
          menuOrder: menuItemsOrder.map(i => i.id),
          blockedModules: blockedModules 
      };
      StorageService.saveAppConfig(config);
      alert("Personalização aplicada com sucesso!");
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
      const newOrder = [...menuItemsOrder];
      if (direction === 'up' && index > 0) {
          [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      } else if (direction === 'down' && index < newOrder.length - 1) {
          [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      }
      setMenuItemsOrder(newOrder);
  };

  const handleResetColors = () => {
      if(window.confirm("Restaurar as cores para o tema Clean/Minimalist?")) {
          setSidebarColor('#ffffff');
          setSidebarTextColor('#475569');
          setSidebarIconColor('#475569');
          setSidebarHighlightColor('#f1f5f9');
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-slate-100 rounded-lg text-slate-700 shadow-sm border border-slate-200">
             <Palette size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Personalização e Aparência</h2>
            <p className="text-slate-500">Altere cores, logos e organize o menu do aplicativo.</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           
           {/* Visual e Cores */}
           <Card className="border-t-4 border-t-slate-500">
               <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-lg flex items-center gap-2">
                       <Palette size={20} className="text-slate-600"/> Identidade Visual
                   </h3>
                   <button onClick={handleResetColors} className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                       <RefreshCw size={12}/> Tema Clean
                   </button>
               </div>
               
               <div className="space-y-6">
                   {/* Logo Sidebar */}
                   <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Logo do Sistema (Menu e PDFs)</label>
                       <p className="text-xs text-slate-500 mb-2">Esta logo será usada no menu lateral e em todos os documentos PDF gerados.</p>
                       <FileInput 
                           label="Alterar Logo Global" 
                           onImageUploaded={setLogoUrl}
                       />
                       {logoUrl && (
                           <div className="mt-2 bg-slate-100 p-2 rounded text-center border border-slate-200">
                               <img src={logoUrl} alt="Logo Preview" className="h-10 mx-auto object-contain" />
                           </div>
                       )}
                   </div>

                   {/* Logo Login */}
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Logo da Tela de Login</label>
                       <FileInput 
                           label="Alterar Logo Login" 
                           onImageUploaded={setLoginLogoUrl}
                       />
                       {loginLogoUrl && (
                           <div className="mt-2 bg-slate-100 p-2 rounded text-center border border-slate-200">
                               <img src={loginLogoUrl} alt="Login Logo Preview" className="h-20 mx-auto object-contain" />
                           </div>
                       )}
                   </div>

                   {/* Cores da Sidebar */}
                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                       <h4 className="font-bold text-sm text-slate-700 mb-3 border-b border-slate-200 pb-2">Cores da Barra Lateral</h4>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-bold text-slate-600 mb-1">Fundo (Menu)</label>
                               <div className="flex gap-2 items-center">
                                   <input 
                                       type="color" 
                                       className="h-8 w-full cursor-pointer rounded border border-slate-300"
                                       value={sidebarColor}
                                       onChange={e => setSidebarColor(e.target.value)}
                                   />
                               </div>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-600 mb-1">Cor da Fonte</label>
                               <div className="flex gap-2 items-center">
                                   <input 
                                       type="color" 
                                       className="h-8 w-full cursor-pointer rounded border border-slate-300"
                                       value={sidebarTextColor}
                                       onChange={e => setSidebarTextColor(e.target.value)}
                                   />
                               </div>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-600 mb-1">Cor dos Ícones</label>
                               <div className="flex gap-2 items-center">
                                   <input 
                                       type="color" 
                                       className="h-8 w-full cursor-pointer rounded border border-slate-300"
                                       value={sidebarIconColor}
                                       onChange={e => setSidebarIconColor(e.target.value)}
                                   />
                               </div>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-600 mb-1">Item Selecionado (Fundo)</label>
                               <div className="flex gap-2 items-center">
                                   <input 
                                       type="color" 
                                       className="h-8 w-full cursor-pointer rounded border border-slate-300"
                                       value={sidebarHighlightColor}
                                       onChange={e => setSidebarHighlightColor(e.target.value)}
                                   />
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </Card>

           {/* Organização do Menu */}
           <Card className="flex flex-col h-full">
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                   <LayoutTemplate size={20} className="text-slate-700"/> Organização do Menu
               </h3>
               
               <div className="flex-1 flex flex-col">
                   <p className="text-xs text-slate-500 mb-2">Reordene os itens do menu lateral conforme sua preferência. Esta alteração será aplicada para todos os usuários.</p>
                   
                   <div className="flex-1 border border-slate-200 rounded-lg overflow-y-auto bg-slate-50 p-2 space-y-1 custom-scrollbar min-h-[400px]">
                       {menuItemsOrder.map((item, index) => (
                           <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm text-sm border border-slate-100 hover:border-blue-300 transition-colors">
                               <span className="truncate flex-1 font-medium text-slate-700">{item.label}</span>
                               <div className="flex gap-1">
                                   <button 
                                       type="button" 
                                       onClick={() => handleMoveItem(index, 'up')}
                                       disabled={index === 0}
                                       className="p-1.5 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 transition-colors"
                                       title="Mover para cima"
                                   >
                                       <ArrowUp size={16} />
                                   </button>
                                   <button 
                                       type="button" 
                                       onClick={() => handleMoveItem(index, 'down')}
                                       disabled={index === menuItemsOrder.length - 1}
                                       className="p-1.5 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 transition-colors"
                                       title="Mover para baixo"
                                   >
                                       <ArrowDown size={16} />
                                   </button>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>

               <div className="mt-6 pt-4 border-t border-slate-100">
                   <Button onClick={handleSaveConfig} className="w-full bg-slate-800 hover:bg-slate-900 text-white">
                       <Save size={18} /> Salvar e Aplicar
                   </Button>
               </div>
           </Card>
       </div>
    </div>
  );
};
