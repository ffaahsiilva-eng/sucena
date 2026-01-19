
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, FileInput } from '../ui/Shared';
import { DDSRecord } from '../../types';
import { StorageService } from '../../services/storageService';
import { PhotoService, PhotoRecord } from '../../services/photoService';
import { Megaphone, Users, User, Trash2, Loader2, ImageOff } from 'lucide-react';
import { AuthService, User as UserType } from '../../services/authService';

// Componente Interno para Listar Fotos do DDS
const DDSPhotoList: React.FC<{ recordId: string, legacyPhotos?: string[] }> = ({ recordId, legacyPhotos }) => {
    const [photos, setPhotos] = useState<string[]>(legacyPhotos || []);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPhotos = async () => {
            // Se já tem fotos legadas (salvas no LocalStorage como base64), usa elas
            if (legacyPhotos && legacyPhotos.length > 0) {
                setPhotos(legacyPhotos);
                setLoading(false);
                return;
            }

            // Caso contrário, busca do IndexedDB pelo ID do registro
            try {
                const dbPhotos = await PhotoService.getPhotosByRelatedId(recordId);
                const urls = dbPhotos.map(p => p.data);
                setPhotos(urls);
            } catch (error) {
                console.error("Erro ao carregar fotos do DDS:", error);
            } finally {
                setLoading(false);
            }
        };

        loadPhotos();
    }, [recordId, legacyPhotos]);

    if (loading) return <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin"/> Carregando fotos...</div>;
    
    if (photos.length === 0) return null;

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {photos.map((url, idx) => (
                <img 
                    key={idx} 
                    src={url} 
                    alt={`DDS Evidencia ${idx}`} 
                    className="w-full h-24 object-cover rounded border border-slate-200 hover:scale-105 transition-transform cursor-pointer" 
                    onClick={() => window.open(url, '_blank')}
                />
            ))}
        </div>
    );
};

export const DDSRegister: React.FC = () => {
  const [records, setRecords] = useState<DDSRecord[]>([]);
  
  // Fotos temporárias para PREVIEW apenas (não salva no record final para economizar LocalStorage)
  const [tempPhotos, setTempPhotos] = useState<string[]>([]);
  
  // ID do rascunho atual (para vincular fotos antes de salvar o formulário)
  const [draftId, setDraftId] = useState<string>('');

  const [formData, setFormData] = useState<Partial<DDSRecord>>({
    date: new Date().toISOString().split('T')[0],
    theme: '',
    speaker: '',
    employeesCount: 0,
    visitorsCount: 0,
  });
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    setRecords(StorageService.getDDS());
    const user = AuthService.getCurrentUser();
    if (user) {
        setCurrentUser(user);
        if (user.role === 'ADMIN') setIsAdmin(true);
    }
    // Gerar um ID inicial para o novo registro
    setDraftId(Date.now().toString());
  }, []);

  const handleDelete = (id: string) => {
      if (window.confirm("Admin: Tem certeza que deseja excluir este DDS?")) {
          const updated = StorageService.deleteItem(StorageService.KEYS.DDS, id);
          setRecords(updated);
      }
  };

  const handlePhotoUpload = (url: string) => {
    // Adiciona ao preview
    setTempPhotos([...tempPhotos, url]);
  };

  const handleRemovePhotoPreview = (index: number) => {
    setTempPhotos(tempPhotos.filter((_, i) => i !== index));
    // Nota: A foto continua no IndexedDB, apenas removemos do preview visual.
    // Para uma limpeza completa, precisaríamos deletar do IDB, mas para simplicidade mantemos assim.
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.theme && formData.speaker) {
      const newRecord: DDSRecord = {
        id: draftId, // Usa o ID que foi passado para as fotos
        createdAt: new Date().toISOString(),
        date: formData.date!,
        theme: formData.theme!,
        speaker: formData.speaker!,
        employeesCount: formData.employeesCount || 0,
        visitorsCount: formData.visitorsCount || 0,
        // NÃO SALVA MAIS BASE64 GIGANTES NO LOCALSTORAGE
        // As fotos já estão no IndexedDB vinculadas pelo `draftId`
        photoUrls: [], 
        createdBy: currentUser?.username || 'Sistema',
        authorName: currentUser?.name || 'Anônimo',
        authorRole: currentUser?.jobTitle || 'N/A'
      };

      StorageService.addDDS(newRecord);
      setRecords([newRecord, ...records]);
      
      // Reset form & Gerar novo ID para o próximo
      setFormData({
        date: new Date().toISOString().split('T')[0],
        theme: '',
        speaker: '',
        employeesCount: 0,
        visitorsCount: 0,
      });
      setTempPhotos([]);
      setDraftId(Date.now().toString());
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Megaphone className="text-accent" /> Registrar DDS do Dia
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                label="Data" 
                type="date" 
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})} 
                required 
              />
              <Input 
                label="Tema do DDS" 
                placeholder="Ex: Uso correto de EPIs"
                value={formData.theme} 
                onChange={e => setFormData({...formData, theme: e.target.value})} 
                required 
              />
              <Input 
                label="Palestrante" 
                placeholder="Nome do responsável"
                value={formData.speaker} 
                onChange={e => setFormData({...formData, speaker: e.target.value})} 
                required 
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Qtd. Colaboradores" 
                  type="number"
                  min="0"
                  value={formData.employeesCount} 
                  onChange={e => setFormData({...formData, employeesCount: parseInt(e.target.value)})} 
                />
                <Input 
                  label="Qtd. Visitantes" 
                  type="number"
                  min="0"
                  value={formData.visitorsCount} 
                  onChange={e => setFormData({...formData, visitorsCount: parseInt(e.target.value)})} 
                />
              </div>

              <div>
                <FileInput 
                  label="Adicionar Fotos do DDS" 
                  onImageUploaded={handlePhotoUpload}
                  category="DDS"
                  relatedRecordId={draftId} // Vincula a foto a este ID no IndexedDB
                />
                {/* Visualização de fotos temporárias antes de salvar */}
                {tempPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {tempPhotos.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square">
                        <img src={url} alt={`Temp ${idx}`} className="w-full h-full object-cover rounded border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhotoPreview(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {tempPhotos.length > 0 && (
                   <p className="text-xs text-slate-500 mt-1 text-right">{tempPhotos.length} fotos anexadas.</p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Salvar Registro
              </Button>
            </form>
          </Card>
        </div>

        {/* Histórico */}
        <div className="lg:col-span-2 space-y-4">
           <h3 className="font-bold text-lg text-slate-700">Histórico de DDS</h3>
           {records.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
               <p className="text-slate-400">Nenhum registro de DDS encontrado.</p>
             </div>
           ) : (
             records.map(record => (
               <Card key={record.id} className="hover:shadow-md transition-shadow relative">
                 {isAdmin && (
                    <button 
                        onClick={() => handleDelete(record.id)} 
                        className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-2 bg-white rounded-full shadow-sm hover:bg-red-50 transition-colors z-10"
                        title="Admin: Excluir DDS"
                    >
                        <Trash2 size={18} />
                    </button>
                 )}
               
                 <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2 pr-10">
                   <div>
                     <span className="font-bold text-lg text-slate-800">{record.theme}</span>
                     <p className="text-xs text-slate-500">Realizado em: {new Date(record.date).toLocaleDateString('pt-BR')}</p>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600 flex items-center gap-1">
                       <User size={12} /> {record.speaker}
                     </span>
                   </div>
                 </div>

                 <div className="flex gap-6 mb-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-blue-500"/> 
                      <span className="font-bold">{record.employeesCount}</span> Colaboradores
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-orange-500"/> 
                      <span className="font-bold">{record.visitorsCount}</span> Visitantes
                    </div>
                 </div>

                 {/* Lista de Fotos (Híbrida: Legado + IndexedDB) */}
                 <DDSPhotoList recordId={record.id} legacyPhotos={record.photoUrls} />

                 <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1 justify-end">
                     <User size={10} /> Registrado por: 
                     <span className="font-bold text-slate-700">{record.authorName || record.createdBy || 'Anônimo'}</span>
                     {record.authorRole && <span className="bg-slate-100 px-1 rounded text-slate-500">- {record.authorRole}</span>}
                 </div>
               </Card>
             ))
           )}
        </div>
      </div>
    </div>
  );
};
