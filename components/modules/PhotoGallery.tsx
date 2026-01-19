
import React, { useEffect, useState, useRef } from 'react';
import { Card, Button, Input, FileInput } from '../ui/Shared';
import { PhotoService, PhotoRecord } from '../../services/photoService';
import { StorageService } from '../../services/storageService';
import { Image, Calendar, Loader2, ZoomIn, X, Trash2, Wand2, Download, Upload, RefreshCw } from 'lucide-react';
import { AuthService } from '../../services/authService';

// Logo Sucena Empreendimentos (SVG Base64)
const SUCENA_LOGO = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnPgogIDx0ZXh0IGZvbnQtd2VpZ2h0PSJib2xkIiB4bWw6c3BhY2U9InByZXNlcnZlIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIGZvbnQtZmFtaWx5PSInSW50ZXInLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEzMCIgeT0iMTE1IiB4PSIxMCIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsPSIjRUFCMzA4Ij5TPC90ZXh0PgogIDx0ZXh0IGZvbnQtd2VpZ2h0PSJib2xkIiB4bWw6c3BhY2U9InByZXNlcnZlIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIGZvbnQtZmFtaWx5PSInSW50ZXInLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjkwIiB5PSIxMTAiIHg9Ijk1IiBzdHJva2Utd2lkdGg9IjAiIGZpbGw9IiMxZjI5MzciPlVDRU5BPC90ZXh0PgogIDx0ZXh0IHhtbDpzcGFjZT0icHJlc2VydmUiIHRleHQtYW5jaG9yPSJzdGFydCIgZm9udC1mYW1pbHk9IidJbnRlcicsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHk9IjE0MCIgeD0iOTgiIHN0cm9rZS13aWR0aD0iMCIgZmlsbD0iIzRiNTU2MyIgbGV0dGVyLXNwYWNpbmc9IjEuNSI+RW1wcmVlbmRpbWVudG9zPC90ZXh0PgogPC9nPgo8L3N2Zz4=`;

export const PhotoGallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'generator'>('gallery');
  
  // Gallery States
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Generator States
  const [genFile, setGenFile] = useState<File | null>(null);
  const [genPreview, setGenPreview] = useState<string | null>(null);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  
  // Date & Time States
  const [genDate, setGenDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [genTime, setGenTime] = useState<string>(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user?.role === 'ADMIN') setIsAdmin(true);
    loadPhotos();

    // Carregar logo global para o gerador
    const config = StorageService.getAppConfig();
    if (config?.logoUrl) {
        setCustomLogo(config.logoUrl);
    }
  }, []);

  const loadPhotos = async () => {
    try {
      const data = await PhotoService.getAllPhotos();
      // FILTRA FOTOS DA CATEGORIA 'EVIDENCE', 'DEVIATION', 'INSPECTION'
      const evidencePhotos = data.filter(p => {
          return p.category === 'EVIDENCE' || p.category === 'DEVIATION' || p.category === 'INSPECTION';
      });
      setPhotos(evidencePhotos);
    } catch (error) {
      console.error("Erro ao carregar fotos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Tem certeza que deseja excluir esta foto permanentemente?")) {
          try {
              await PhotoService.deletePhoto(id);
              loadPhotos(); // Recarrega
          } catch (e) {
              alert("Erro ao excluir foto");
          }
      }
  };

  // --- Lógica do Gerador de Fotos ---

  const handleGenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setGenFile(e.target.files[0]);
          setGenPreview(null); // Reset preview to force regeneration
      }
  };

  const processImage = async () => {
      if (!genFile || !canvasRef.current) return;
      setIsGenerating(true);

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const img = new window.Image();
      const objectUrl = URL.createObjectURL(genFile);

      img.onload = () => {
          // 1. Setup Canvas Dimensions
          const canvas = canvasRef.current!;
          canvas.width = img.width;
          canvas.height = img.height;

          // 2. Draw Original Image
          ctx.drawImage(img, 0, 0);

          // 3. Draw Date & Time (Bottom Right)
          const dateParts = genDate.split('-');
          const dateStr = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
          const dateTimeStr = `${dateStr} - ${genTime}`;
          
          const fontSize = Math.max(24, img.height * 0.035); // Slightly smaller font
          ctx.font = `bold ${fontSize}px sans-serif`;
          
          const padding = fontSize; 
          const textMetrics = ctx.measureText(dateTimeStr);
          const textX = canvas.width - textMetrics.width - padding;
          const textY = canvas.height - padding;

          // Shadow for readability on date
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          ctx.fillStyle = "#ffffff";
          ctx.fillText(dateTimeStr, textX, textY);

          // Reset Shadow for Logo processing
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // 4. Draw Company Logo (Top Right)
          const logoImg = new window.Image();
          logoImg.onload = () => {
              // Calculate Logo Size (Reduzido para 15% da largura da imagem)
              const targetWidth = canvas.width * 0.15; 
              
              const aspectRatio = logoImg.width / logoImg.height;
              const targetHeight = targetWidth / aspectRatio;
              
              const logoPadding = canvas.width * 0.03; // 3% padding
              
              const logoX = canvas.width - targetWidth - logoPadding;
              const logoY = logoPadding;

              // Adicionar sombra na logo para garantir contraste sem o fundo branco
              ctx.shadowColor = "rgba(0,0,0,0.5)"; // Sombra preta suave
              ctx.shadowBlur = 10;
              ctx.shadowOffsetX = 2;
              ctx.shadowOffsetY = 2;

              // Draw Logo (Sem fundo/rect branco)
              ctx.drawImage(logoImg, logoX, logoY, targetWidth, targetHeight);

              // 5. Generate Preview URL
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              setGenPreview(dataUrl);
              
              URL.revokeObjectURL(objectUrl);
              setIsGenerating(false);
          };
          
          // Set source to Custom Logo (from config) or Default SUCENA SVG
          logoImg.src = customLogo || SUCENA_LOGO;
      };

      img.src = objectUrl;
  };

  const handleDownload = () => {
      if (!genPreview) return;
      const link = document.createElement('a');
      link.href = genPreview;
      link.download = `Relatorio_Sucena_${genDate}_${genTime.replace(':','')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- Fim Lógica Gerador ---

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <Image className="text-blue-600" /> Galeria & Ferramentas
           </h3>
           <p className="text-slate-500 text-sm">Mostrando fotos de Vistorias, Desvios e Evidências.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-200 p-1 rounded-lg self-start md:self-auto">
            <button 
                onClick={() => setActiveTab('gallery')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'gallery' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Image size={16} /> Banco de Imagens
            </button>
            <button 
                onClick={() => setActiveTab('generator')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'generator' ? 'bg-white text-yellow-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Wand2 size={16} /> Gerador de Relatório
            </button>
        </div>
      </div>

      {/* --- ABA: GERADOR --- */}
      {activeTab === 'generator' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Controles */}
                  <div className="lg:col-span-1 space-y-4">
                      <Card className="border-t-4 border-t-yellow-500">
                          <h3 className="font-bold text-lg mb-4 text-slate-700">Configurar Foto</h3>
                          
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-2">1. Selecione a Foto Principal</label>
                                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                      <input 
                                          type="file" 
                                          accept="image/*" 
                                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                          onChange={handleGenFileChange}
                                      />
                                      <div className="flex flex-col items-center pointer-events-none">
                                          <Upload className="text-yellow-500 mb-2" size={32} />
                                          <span className="text-sm font-medium text-slate-600">
                                              {genFile ? genFile.name : "Clique para carregar"}
                                          </span>
                                      </div>
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-2">2. Data</label>
                                      <Input 
                                          label="" 
                                          type="date" 
                                          value={genDate} 
                                          onChange={e => setGenDate(e.target.value)} 
                                          className="mb-0"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-2">Hora</label>
                                      <Input 
                                          label="" 
                                          type="time" 
                                          value={genTime} 
                                          onChange={e => setGenTime(e.target.value)} 
                                          className="mb-0"
                                      />
                                  </div>
                              </div>

                              <Button 
                                  onClick={processImage} 
                                  disabled={!genFile || isGenerating}
                                  className="w-full bg-slate-800 text-white hover:bg-black"
                              >
                                  {isGenerating ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />}
                                  {genPreview ? 'Regerar Foto' : 'Gerar Foto com Logo'}
                              </Button>

                              {genPreview && (
                                  <div className="pt-4 border-t border-slate-100">
                                      <Button 
                                          onClick={handleDownload} 
                                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                                      >
                                          <Download size={18} /> Baixar Foto Pronta
                                      </Button>
                                      <p className="text-xs text-center text-slate-400 mt-2">
                                          A foto será baixada com qualidade alta.
                                      </p>
                                  </div>
                              )}
                          </div>
                      </Card>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                          <p className="font-bold flex items-center gap-2 mb-1"><Wand2 size={16}/> Como funciona:</p>
                          <ul className="list-disc list-inside space-y-1 pl-1">
                              <li>A logo configurada no Painel Administrativo será inserida automaticamente.</li>
                              <li>A data e a hora aparecerão no canto inferior direito.</li>
                              <li>O arquivo final é otimizado para relatórios.</li>
                          </ul>
                      </div>
                  </div>

                  {/* Preview Area */}
                  <div className="lg:col-span-2">
                      <Card className="h-full min-h-[400px] flex items-center justify-center bg-slate-100 border-2 border-slate-200 border-dashed overflow-hidden relative">
                          <canvas ref={canvasRef} className="hidden" /> 
                          
                          {genPreview ? (
                              <div className="relative w-full h-full flex items-center justify-center bg-slate-800 rounded-lg">
                                  <img 
                                      src={genPreview} 
                                      alt="Preview" 
                                      className="max-w-full max-h-[600px] object-contain shadow-2xl" 
                                  />
                              </div>
                          ) : (
                              <div className="text-center text-slate-400">
                                  <Image size={64} className="mx-auto mb-4 opacity-30" />
                                  <p className="font-medium">A pré-visualização aparecerá aqui</p>
                                  <p className="text-sm">Carregue uma imagem e clique em "Gerar"</p>
                              </div>
                          )}
                      </Card>
                  </div>
              </div>
          </div>
      )}

      {/* --- ABA: GALERIA (CÓDIGO EXISTENTE) --- */}
      {activeTab === 'gallery' && (
        <>
            {loading ? (
                <div className="flex justify-center items-center h-64 text-slate-400 gap-2">
                    <Loader2 className="animate-spin" /> Carregando banco de imagens...
                </div>
            ) : photos.length === 0 ? (
                <Card className="text-center py-12">
                <div className="flex flex-col items-center text-slate-400">
                    <Image size={48} strokeWidth={1} className="mb-4 opacity-50" />
                    <p>Nenhuma foto de evidência encontrada.</p>
                    <p className="text-sm mt-1">Envie fotos em Desvios ou Vistorias para vê-las aqui.</p>
                </div>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
                {photos.map((photo) => (
                    <div 
                        key={photo.id} 
                        className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedPhoto(photo)}
                    >
                    <div className="aspect-square overflow-hidden bg-slate-100 relative">
                        <img 
                            src={photo.data} 
                            alt="Registro Operacional" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="text-white w-8 h-8" />
                        </div>
                        
                        {/* Categoria Badge */}
                        <div className="absolute top-2 left-2 z-10">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold shadow-sm uppercase ${
                                photo.category === 'DEVIATION' ? 'bg-red-500 text-white' : 
                                photo.category === 'INSPECTION' ? 'bg-indigo-500 text-white' : 
                                'bg-green-500 text-white'
                            }`}>
                                {photo.category === 'DEVIATION' ? 'Desvio' : photo.category === 'INSPECTION' ? 'Vistoria' : 'Geral'}
                            </span>
                        </div>

                        {/* Admin Delete Button */}
                        {isAdmin && (
                            <button 
                                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700 z-10"
                                onClick={(e) => handleDelete(photo.id, e)}
                                title="Excluir Foto"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs font-medium truncate">{photo.name}</p>
                        </div>
                    </div>
                    <div className="p-3">
                        <div className="flex flex-col gap-1 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>{new Date(photo.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            
                            <div className="mt-1 pt-1 border-t border-slate-100">
                                <span className="block font-bold text-slate-700 truncate">{photo.authorName || photo.createdBy || 'Anônimo'}</span>
                                <span className="block text-slate-400 text-[10px] uppercase tracking-wider">{photo.authorRole || 'Colaborador'}</span>
                            </div>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
        </>
      )}

      {/* Modal de Visualização de Foto (Galeria) */}
      {selectedPhoto && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedPhoto(null)}
        >
            <button 
                className="absolute top-4 right-4 text-white hover:text-yellow-500 transition-colors p-2 bg-black/50 rounded-full"
                onClick={() => setSelectedPhoto(null)}
            >
                <X size={32} />
            </button>
            
            <div className="max-w-7xl max-h-screen w-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                <img 
                    src={selectedPhoto.data} 
                    alt="Visualização Ampliada" 
                    className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
                />
                <div className="mt-4 text-center text-white">
                    <p className="font-medium text-lg">{selectedPhoto.name}</p>
                    <p className="text-sm text-slate-400">
                        {new Date(selectedPhoto.createdAt).toLocaleDateString('pt-BR')} às {new Date(selectedPhoto.createdAt).toLocaleTimeString('pt-BR')}
                    </p>
                    <div className="mt-2 text-sm">
                         <span className="text-slate-400">Enviado por: </span>
                         <span className="text-yellow-500 font-bold">{selectedPhoto.authorName || selectedPhoto.createdBy}</span>
                         {selectedPhoto.authorRole && <span className="text-slate-500 ml-1">({selectedPhoto.authorRole})</span>}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
