
import React, { useState, useEffect } from 'react';
import { Card, AITextArea, Button, FileInput, Input } from '../ui/Shared';
import { EvidenceRecord } from '../../types';
import { Plus, Trash2, User } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { AuthService, User as UserType } from '../../services/authService';

export const ActivityEvidence: React.FC = () => {
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [formData, setFormData] = useState<Partial<EvidenceRecord>>({
    activity: '',
    comments: '',
    mediaUrls: []
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    // Carregando via Storage Genérico
    const data = StorageService.getGeneric(StorageService.KEYS.EVIDENCE) as EvidenceRecord[];
    setRecords(data);

    const user = AuthService.getCurrentUser();
    if (user) {
        setCurrentUser(user);
        if (user.role === 'ADMIN') setIsAdmin(true);
    }
  }, []);

  const handleDelete = (id: string) => {
      if (window.confirm("Admin: Excluir esta evidência?")) {
          const updated = StorageService.deleteItem(StorageService.KEYS.EVIDENCE, id);
          setRecords(updated);
      }
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: [...(prev.mediaUrls || []), url]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.activity) {
      const newRecord: EvidenceRecord = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        activity: formData.activity!,
        comments: formData.comments || '',
        mediaUrls: formData.mediaUrls || [], 
        createdBy: currentUser?.username || 'Sistema',
        authorName: currentUser?.name || 'Anônimo',
        authorRole: currentUser?.jobTitle || 'N/A'
      };
      
      StorageService.addGeneric(StorageService.KEYS.EVIDENCE, newRecord);
      setRecords([newRecord, ...records]);
      setFormData({ activity: '', comments: '', mediaUrls: [] });
    }
  };

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Side */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <h3 className="font-bold text-lg mb-4">Nova Evidência</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input 
                   label="Atividade"
                   placeholder="Título da atividade..."
                   value={formData.activity}
                   onChange={e => setFormData({...formData, activity: e.target.value})}
                   required
                />
                <AITextArea
                   label="Comentários"
                   value={formData.comments}
                   onChange={e => setFormData({...formData, comments: e.target.value})}
                   onEnhance={val => setFormData({...formData, comments: val})}
                />
                <FileInput 
                  label="Anexar Foto/Vídeo" 
                  onImageUploaded={handleImageUpload}
                  category="EVIDENCE" 
                />
                {formData.mediaUrls && formData.mediaUrls.length > 0 && (
                   <div className="text-xs text-green-600 font-medium">
                     {formData.mediaUrls.length} foto(s) anexada(s)
                   </div>
                )}
                <Button type="submit" className="w-full"><Plus size={18} /> Registrar Evidência</Button>
              </form>
            </Card>
          </div>

          {/* Feed Side */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-bold text-lg text-slate-700">Feed de Evidências</h3>
            {records.length === 0 && <p className="text-slate-400">Nenhuma evidência registrada.</p>}
            {records.map(rec => (
              <Card key={rec.id} className="relative">
                {isAdmin && (
                    <button 
                        onClick={() => handleDelete(rec.id)}
                        className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-2"
                        title="Admin: Excluir"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
                <div className="flex justify-between items-center mb-4 pr-8">
                   <h4 className="font-bold text-lg">{rec.activity}</h4>
                   <span className="text-xs text-slate-400">{new Date(rec.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {rec.mediaUrls.map((url, idx) => (
                    <img key={idx} src={url} alt="Evidencia" className="w-full h-48 object-cover rounded-lg border border-slate-100" />
                  ))}
                </div>
                <p className="text-slate-700">{rec.comments}</p>
                
                <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1">
                    <User size={12} /> Enviado por: 
                    <span className="font-bold text-slate-700">{rec.authorName || rec.createdBy || 'Anônimo'}</span>
                    {rec.authorRole && <span className="bg-slate-100 px-1 rounded text-slate-500">- {rec.authorRole}</span>}
                </div>
              </Card>
            ))}
          </div>
       </div>
    </div>
  );
};
