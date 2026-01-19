
import React, { useState, useEffect } from 'react';
import { Card, Input, FileInput, Button, AITextArea } from '../ui/Shared';
import { OrderRecord, MeasureUnit, OrderStatus, Notification, ModuleType } from '../../types';
import { AuthService, User as UserType } from '../../services/authService';
import { User as UserIcon, Trash2, Bell, Share2, Send, CheckCircle, Clock, Package, ShoppingCart, ListChecks, XCircle, ArchiveX, Wand2, Loader2, ImagePlus, Check, X, ShieldCheck } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { generateProductImage } from '../../services/geminiService';

const UNITS: MeasureUnit[] = ['UNIDADE', 'METRO', 'CENTIMETRO', 'LITRO', 'CAIXA', 'KG', 'PACOTE', 'GALAO', 'METRO_CUBICO', 'PAR'];
const PROCUREMENT_ROLE = 'Aux. Administrativo';

interface OrderRequestsProps {
    preSelectedTab?: 'requests' | 'management' | 'canceled';
}

export const OrderRequests: React.FC<OrderRequestsProps> = ({ preSelectedTab }) => {
    const [orders, setOrders] = useState<OrderRecord[]>([]);
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<'requests' | 'management' | 'canceled'>('requests');
    
    // States para IA e Imagens
    const [loadingImage, setLoadingImage] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    
    // States para menção
    const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);

    const [formData, setFormData] = useState<Partial<OrderRecord>>({
        materialName: '',
        description: '',
        quantity: 1,
        unit: 'UNIDADE',
        requiredDate: '',
        status: 'PENDENTE',
        assignedTo: '',
        photoUrl: '',
        caNumber: '' // Inicializa CA vazio
    });

    useEffect(() => {
        // Carregar dados de PEDIDOS (antigo Stock)
        const loaded = StorageService.getGeneric(StorageService.KEYS.STOCK) as OrderRecord[];
        // Ordenar: Pendentes primeiro, depois por data
        loaded.sort((a, b) => {
            if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
            if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setOrders(loaded);

        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            if (user.role === 'ADMIN') setIsAdmin(true);
        }

        // Carregar lista de usuários para menção
        const allUsers = AuthService.getUsers();
        setAvailableUsers(allUsers);
    }, []);

    // Atualiza a aba se vier via props (Notificação)
    useEffect(() => {
        if (preSelectedTab) {
            setActiveTab(preSelectedTab);
        }
    }, [preSelectedTab]);

    const handleDelete = (id: string) => {
        if (window.confirm("Admin: Tem certeza que deseja excluir este pedido permanentemente?")) {
            const updated = StorageService.deleteItem(StorageService.KEYS.STOCK, id);
            setOrders(updated);
        }
    };

    const handleAIGenerateImage = async () => {
        if (!formData.materialName) {
            alert("Por favor, digite o Nome do Material antes de usar a IA.");
            return;
        }
        setLoadingImage(true);
        setAiSuggestion(null); // Limpa sugestão anterior
        
        const base64 = await generateProductImage(formData.materialName, formData.description);
        
        if (base64) {
            setAiSuggestion(base64);
        } else {
            alert("A IA não conseguiu encontrar/gerar uma imagem para este item. Tente detalhar mais a descrição.");
        }
        setLoadingImage(false);
    };

    const handleConfirmSuggestion = () => {
        if (aiSuggestion) {
            setFormData(prev => ({ ...prev, photoUrl: aiSuggestion }));
            setAiSuggestion(null); // Limpa a sugestão após aceitar
        }
    };

    const handleDiscardSuggestion = () => {
        setAiSuggestion(null);
    };

    const handleRemovePhoto = () => {
        if (window.confirm("Remover a foto selecionada?")) {
            setFormData(prev => ({ ...prev, photoUrl: '' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newRecord: OrderRecord = { 
            ...formData as OrderRecord,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(), // Data inicial
            status: 'PENDENTE',
            createdBy: currentUser?.username || 'Sistema',
            authorName: currentUser?.name || 'Anônimo',
            authorRole: currentUser?.jobTitle || 'N/A'
        };

        StorageService.addGeneric(StorageService.KEYS.STOCK, newRecord);
        
        // Notificar usuário mencionado
        if (newRecord.assignedTo) {
             const notif: Notification = {
                id: Date.now().toString() + Math.random(),
                userId: newRecord.assignedTo,
                message: `Novo Pedido atribuído a você: ${newRecord.materialName}`,
                read: false,
                createdAt: new Date().toISOString(),
                type: 'MENTION',
                targetModule: ModuleType.STOCK,
                targetTab: 'requests'
            };
            StorageService.addNotification(notif);
        }

        setOrders([newRecord, ...orders]);
        setFormData({ 
            materialName: '', 
            description: '', 
            quantity: 1, 
            unit: 'UNIDADE', 
            requiredDate: '', 
            status: 'PENDENTE', 
            assignedTo: '',
            photoUrl: '',
            caNumber: ''
        });
        setAiSuggestion(null);
        // Se for Aux. Administrativo, muda para aba de gestão
        if (currentUser?.jobTitle === PROCUREMENT_ROLE) {
            setActiveTab('management');
        }
    };

    const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return;

        // Atualiza status E data de atualização
        const updatedOrder = { 
            ...orders[orderIndex], 
            status: newStatus,
            updatedAt: new Date().toISOString() 
        };
        
        // Atualizar no storage
        StorageService.updateItem(StorageService.KEYS.STOCK, updatedOrder);
        
        // Atualizar estado local
        const newOrders = [...orders];
        newOrders[orderIndex] = updatedOrder;
        setOrders(newOrders);

        // Notificar o criador do pedido se quem mudou não for ele mesmo
        if (updatedOrder.createdBy !== currentUser?.username) {
            let msg = `Seu pedido "${updatedOrder.materialName}" mudou para: ${getStatusLabel(newStatus)}`;
            let tab = 'requests';

            if (newStatus === 'CANCELADO') {
                msg = `ATENÇÃO: Seu pedido de "${updatedOrder.materialName}" foi CANCELADO.`;
                tab = 'canceled';
            }

             const notif: Notification = {
                id: Date.now().toString() + Math.random(),
                userId: updatedOrder.createdBy || '',
                message: msg,
                read: false,
                createdAt: new Date().toISOString(),
                type: 'SYSTEM',
                targetModule: ModuleType.STOCK,
                targetTab: tab
            };
            StorageService.addNotification(notif);
        }
    };

    const handleCancelOrder = (order: OrderRecord) => {
        if (window.confirm("Deseja realmente CANCELAR este pedido? Ele será movido para a aba de cancelados.")) {
            handleStatusUpdate(order.id, 'CANCELADO');
        }
    };

    const generateWhatsAppText = (order: OrderRecord) => {
        const assignedName = availableUsers.find(u => u.username === order.assignedTo)?.name || 'N/A';
        const dateRequired = order.requiredDate ? new Date(order.requiredDate).toLocaleDateString('pt-BR') : 'Sem data';
        const caText = order.caNumber ? `\n🛡 *CA:* ${order.caNumber}` : '';

        return `📦 SOLICITAÇÃO DE MATERIAL - SUCENA
        
👤 Solicitante: *${order.authorName}*
👤 Responsável: *${assignedName}*

🛒 *Material:* ${order.materialName}
🔢 *Qtd:* ${order.quantity} ${order.unit}${caText}
📅 *Previsão/Necessidade:* ${dateRequired}

📝 *Obs:* ${order.description || '-'}

📊 *Status:* ${getStatusLabel(order.status)}
`;
    };

    const handleShareWhatsApp = (order: OrderRecord) => {
        const text = generateWhatsAppText(order);
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const getStatusLabel = (status: OrderStatus) => {
        switch(status) {
            case 'PENDENTE': return 'Pedido Pendente';
            case 'SOLICITADO': return 'Pedido Solicitado';
            case 'FEITO': return 'Pedido Feito (Comprado)';
            case 'ENTREGUE': return 'Pedido Entregue';
            case 'CANCELADO': return 'Cancelado';
            default: return status;
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch(status) {
            case 'PENDENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'SOLICITADO': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'FEITO': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'ENTREGUE': return 'bg-green-100 text-green-800 border-green-200';
            case 'CANCELADO': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const isProcurement = currentUser?.jobTitle === PROCUREMENT_ROLE || isAdmin;

    // Filtros de exibição atualizados
    const displayedOrders = (() => {
        if (activeTab === 'requests') {
            // Minhas solicitações (mostra tudo que eu pedi, inclusive cancelados, para eu saber)
            return orders.filter(o => o.createdBy === currentUser?.username);
        }
        if (activeTab === 'management') {
            // Gestão: Mostra tudo EXCETO cancelados (fila ativa)
            return orders.filter(o => o.status !== 'CANCELADO');
        }
        if (activeTab === 'canceled') {
            // Aba Exclusiva Cancelados
            return orders.filter(o => o.status === 'CANCELADO');
        }
        return [];
    })();

    return (
        <div className="space-y-6">
            
            {/* Navegação de Abas */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                <button 
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${
                        activeTab === 'requests' 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <ShoppingCart size={16} /> Solicitar / Meus Pedidos
                </button>
                
                {isProcurement && (
                    <>
                        <button 
                            onClick={() => setActiveTab('management')}
                            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${
                                activeTab === 'management' 
                                    ? 'bg-purple-600 text-white shadow-sm' 
                                    : 'bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            <ListChecks size={16} /> Gestão de Compras
                        </button>
                        <button 
                            onClick={() => setActiveTab('canceled')}
                            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${
                                activeTab === 'canceled' 
                                    ? 'bg-red-600 text-white shadow-sm' 
                                    : 'bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            <ArchiveX size={16} /> Pedidos Cancelados
                        </button>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form Side - Visível apenas na aba de solicitações */}
                {activeTab === 'requests' && (
                    <div className="lg:col-span-1">
                        <Card className="sticky top-6 border-t-4 border-t-blue-500">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Package className="text-blue-600"/> Solicitar Material
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input 
                                    label="Nome do Material / Ferramenta" 
                                    placeholder="Ex: Cimento, Luvas, Martelete..."
                                    value={formData.materialName} 
                                    onChange={e => setFormData({...formData, materialName: e.target.value})} 
                                    required 
                                />
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        label="Quantidade" 
                                        type="number" 
                                        min="0"
                                        value={formData.quantity} 
                                        onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})} 
                                        required 
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                                        <select 
                                            className="w-full p-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.unit}
                                            onChange={e => setFormData({...formData, unit: e.target.value as MeasureUnit})}
                                        >
                                            {UNITS.map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Campo Opcional de CA */}
                                <Input 
                                    label="Nº CA (Opcional - Para EPIs)" 
                                    placeholder="Ex: 12345"
                                    value={formData.caNumber} 
                                    onChange={e => setFormData({...formData, caNumber: e.target.value})} 
                                />

                                <AITextArea 
                                    label="Descrição / Detalhes"
                                    placeholder="Especifique marca, tamanho, cor ou aplicação..."
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />

                                <Input 
                                    label="Data de Previsão / Necessidade" 
                                    type="date"
                                    value={formData.requiredDate} 
                                    onChange={e => setFormData({...formData, requiredDate: e.target.value})} 
                                    required 
                                />

                                {/* Mention User */}
                                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                                        <Bell size={14} className="text-yellow-600"/> Atribuir a (Opcional)
                                    </label>
                                    <select 
                                        className="w-full p-2 border rounded text-sm bg-white"
                                        value={formData.assignedTo}
                                        onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                                    >
                                        <option value="">Selecione um responsável...</option>
                                        {availableUsers.map(u => (
                                            <option key={u.username} value={u.username}>
                                                {u.name} ({u.jobTitle})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-sm font-medium text-slate-700">Foto do Produto (Opcional)</label>
                                        <button 
                                            type="button"
                                            onClick={handleAIGenerateImage}
                                            disabled={loadingImage || !formData.materialName}
                                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {loadingImage ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                            Buscar Foto com IA
                                        </button>
                                    </div>
                                    
                                    {/* SEÇÃO DE SUGESTÃO IA */}
                                    {aiSuggestion && (
                                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 animate-in fade-in zoom-in-95">
                                            <p className="text-xs font-bold text-purple-800 mb-2 flex items-center gap-1">
                                                <Wand2 size={12} /> Sugestão da IA
                                            </p>
                                            <div className="relative aspect-square w-full bg-white rounded border border-purple-100 overflow-hidden mb-3">
                                                <img src={aiSuggestion} alt="Sugestão IA" className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={handleConfirmSuggestion}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded font-bold flex items-center justify-center gap-1"
                                                >
                                                    <Check size={14} /> Adicionar ao Pedido
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={handleDiscardSuggestion}
                                                    className="px-3 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs py-1.5 rounded font-bold"
                                                    title="Descartar"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!aiSuggestion && (
                                        <FileInput 
                                            label="" 
                                            onImageUploaded={(url) => setFormData({...formData, photoUrl: url})} 
                                        />
                                    )}
                                    
                                    {/* Preview se já tiver foto Selecionada */}
                                    {formData.photoUrl && !aiSuggestion && (
                                        <div className="relative w-full h-32 bg-slate-100 rounded border border-slate-200 overflow-hidden flex items-center justify-center group">
                                            <img src={formData.photoUrl} alt="Preview" className="h-full object-contain" />
                                            {/* Botão de Remover Foto */}
                                            <button 
                                                type="button"
                                                onClick={handleRemovePhoto}
                                                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 transition-colors z-10"
                                                title="Remover Foto"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center text-white text-xs pointer-events-none">
                                                Imagem Selecionada
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                    <Send size={18} /> Enviar Pedido
                                </Button>
                            </form>
                        </Card>
                    </div>
                )}

                {/* List Side - Expande se estiver na aba de gestão ou cancelados */}
                <div className={`${activeTab !== 'requests' ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-4`}>
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-700">
                            {activeTab === 'management' && 'Fila de Processamento de Compras'}
                            {activeTab === 'canceled' && 'Histórico de Pedidos Cancelados'}
                            {activeTab === 'requests' && 'Meus Pedidos'}
                        </h3>
                        {activeTab !== 'requests' && (
                            <span className={`text-xs px-2 py-1 rounded font-bold border ${activeTab === 'canceled' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>
                                Acesso Restrito: Aux. Administrativo
                            </span>
                        )}
                    </div>
                    
                    {displayedOrders.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                            <Package className="mx-auto text-slate-300 mb-2" size={48} />
                            <p className="text-slate-400">Nenhum pedido encontrado nesta visualização.</p>
                        </div>
                    )}

                    {displayedOrders.map(order => {
                        const assignedUser = availableUsers.find(u => u.username === order.assignedTo);
                        const isMyOrder = order.createdBy === currentUser?.username;

                        return (
                            <Card key={order.id} className={`relative hover:shadow-md transition-shadow 
                                ${activeTab === 'management' ? 'border-l-4 border-l-purple-500' : ''}
                                ${activeTab === 'canceled' ? 'border-l-4 border-l-red-500 opacity-80 bg-slate-50' : ''}
                            `}>
                                {isAdmin && (
                                    <button 
                                        onClick={() => handleDelete(order.id)}
                                        className="absolute top-4 right-4 text-red-300 hover:text-red-600 p-1"
                                        title="Admin: Excluir Permanentemente"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}

                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Imagem Thumb */}
                                    <div className="w-full md:w-24 h-24 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center relative cursor-pointer group" onClick={() => order.photoUrl && window.open(order.photoUrl, '_blank')}>
                                        {order.photoUrl ? (
                                            <>
                                                <img src={order.photoUrl} alt="Material" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <ImagePlus className="text-white opacity-0 group-hover:opacity-100" size={20}/>
                                                </div>
                                            </>
                                        ) : (
                                            <Package className="text-slate-300" size={32} />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-lg text-slate-800">{order.materialName}</h4>
                                                <p className="text-sm font-bold text-blue-600">
                                                    {order.quantity} {order.unit}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border mt-2 sm:mt-0 ${getStatusColor(order.status)}`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </div>

                                        <div className="text-sm text-slate-600 mb-3 bg-slate-50 p-2 rounded">
                                            <p>{order.description || 'Sem descrição.'}</p>
                                            {order.caNumber && (
                                                <p className="mt-1 flex items-center gap-1 font-bold text-slate-500 text-xs uppercase border-t border-slate-200 pt-1">
                                                    <ShieldCheck size={12} className="text-slate-400"/> CA: {order.caNumber}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-3">
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} /> Previsão: <span className="font-bold text-slate-700">{new Date(order.requiredDate).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            {(activeTab === 'management' || activeTab === 'canceled') && (
                                                <div className="flex items-center gap-1">
                                                    <UserIcon size={12} /> Solicitante: <span className="font-bold text-slate-700">{order.authorName}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <UserIcon size={12} /> Atribuído: <span className="font-bold text-slate-700 bg-yellow-50 px-1 rounded border border-yellow-100">{assignedUser?.name || order.assignedTo || 'N/A'}</span>
                                            </div>
                                            {order.status === 'CANCELADO' && order.updatedAt && (
                                                <div className="flex items-center gap-1 text-red-600">
                                                    <XCircle size={12} /> Cancelado em: <span className="font-bold">{new Date(order.updatedAt).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                                            <Button 
                                                variant="secondary" 
                                                className="text-xs h-8 px-2"
                                                onClick={() => handleShareWhatsApp(order)}
                                            >
                                                <Share2 size={14} /> WhatsApp
                                            </Button>

                                            {/* Cancel Button (Available in Management, Requests, but NOT in Canceled tab) */}
                                            {order.status !== 'CANCELADO' && order.status !== 'ENTREGUE' && (
                                                (isProcurement || (isMyOrder && order.status === 'PENDENTE')) && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order)}
                                                        className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1 ml-auto sm:ml-2"
                                                    >
                                                        <XCircle size={12} /> Cancelar
                                                    </button>
                                                )
                                            )}
                                            
                                            {/* Restore Button (Optional: Only in Canceled Tab for Procurement) */}
                                            {activeTab === 'canceled' && isProcurement && (
                                                <button
                                                    onClick={() => {
                                                        if(window.confirm('Reativar este pedido para PENDENTE?')) handleStatusUpdate(order.id, 'PENDENTE');
                                                    }}
                                                    className="bg-slate-100 text-slate-600 border border-slate-300 px-3 py-1 rounded text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1 ml-auto"
                                                >
                                                    Reativar Pedido
                                                </button>
                                            )}

                                            {/* Procurement Status Buttons (Not visible in Canceled tab) */}
                                            {isProcurement && order.status !== 'ENTREGUE' && order.status !== 'CANCELADO' && (
                                                <div className="flex gap-1 flex-wrap justify-end ml-auto">
                                                    {order.status === 'PENDENTE' && (
                                                        <button 
                                                            onClick={() => handleStatusUpdate(order.id, 'SOLICITADO')}
                                                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 transition-colors"
                                                        >
                                                            Marcar como Solicitado
                                                        </button>
                                                    )}
                                                    {order.status === 'SOLICITADO' && (
                                                        <button 
                                                            onClick={() => handleStatusUpdate(order.id, 'FEITO')}
                                                            className="bg-purple-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-purple-700 transition-colors"
                                                        >
                                                            Marcar como Feito/Comprado
                                                        </button>
                                                    )}
                                                    {order.status === 'FEITO' && (
                                                        <button 
                                                            onClick={() => handleStatusUpdate(order.id, 'ENTREGUE')}
                                                            className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700 transition-colors flex items-center gap-1"
                                                        >
                                                            <CheckCircle size={12} /> Confirmar Entrega
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
