
import React, { useState } from 'react';
import { Loader2, Wand2, Camera, Check } from 'lucide-react';
import { improveText } from '../../services/geminiService';
import { PhotoService } from '../../services/photoService';
import { AuthService } from '../../services/authService';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ 
  className = '', 
  variant = 'primary', 
  children, 
  ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base";
  const variants = {
    primary: "bg-primary text-white hover:bg-slate-800",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface AIInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  onEnhance?: (newText: string) => void;
  context?: string;
}

export const AITextArea: React.FC<AIInputProps> = ({ label, onEnhance, context = "Operational Report", value, onChange, className = '', ...props }) => {
  const [loading, setLoading] = useState(false);

  const handleEnhance = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!value || typeof value !== 'string') return;
    
    setLoading(true);
    const improved = await improveText(value, context);
    if (onEnhance) onEnhance(improved);
    setLoading(false);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        {onEnhance && (
          <button 
            onClick={handleEnhance}
            disabled={loading || !value}
            className="text-xs text-accent flex items-center gap-1 hover:underline disabled:text-slate-400"
            type="button"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
            Melhorar com IA
          </button>
        )}
      </div>
      <textarea
        value={value}
        onChange={onChange}
        className={`w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all ${className}`}
        {...props}
      />
    </div>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, className = '', ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input
      className={`w-full rounded-md border border-slate-300 p-2 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all ${className}`}
      {...props}
    />
  </div>
);

interface FileInputProps {
  label: string;
  onImageUploaded: (base64Url: string) => void;
  category?: string; // Propriedade opcional para categorizar a foto
  relatedRecordId?: string; // ID do registro pai para vincular no IndexedDB
}

export const FileInput: React.FC<FileInputProps> = ({ label, onImageUploaded, category = 'GENERAL', relatedRecordId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setIsSuccess(false);
      try {
        const user = AuthService.getCurrentUser();
        const createdBy = user ? user.username : 'Sistema';
        const authorName = user ? user.name : 'Anônimo';
        const authorRole = user ? user.jobTitle : 'N/A';
        
        // Passa a categoria e o ID relacionado para o serviço
        const base64 = await PhotoService.savePhoto(
            file, 
            createdBy, 
            authorName, 
            authorRole, 
            category, 
            relatedRecordId
        );
        
        onImageUploaded(base64);
        setIsSuccess(true);
      } catch (error) {
        console.error("Erro ao salvar foto", error);
        alert("Erro ao salvar a foto. Tente novamente.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className={`border-2 border-dashed ${isSuccess ? 'border-green-400 bg-green-50' : 'border-slate-300'} rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative`}>
         <input 
            type="file" 
            className="hidden" 
            id={`file-${label}`} 
            onChange={handleChange} 
            accept="image/*" 
            disabled={isUploading}
         />
         <label htmlFor={`file-${label}`} className="cursor-pointer flex flex-col items-center">
            {isUploading ? (
              <>
                 <Loader2 className="animate-spin text-accent mb-2" />
                 <span className="text-sm text-slate-600">Salvando foto...</span>
              </>
            ) : isSuccess ? (
              <>
                <Check className="text-green-500 mb-2" />
                <span className="text-sm text-green-700 font-medium">Foto salva com sucesso!</span>
                <span className="text-xs text-slate-400 mt-1">Clique para trocar</span>
              </>
            ) : (
              <>
                <Camera className="text-slate-400 mb-2" />
                <span className="text-sm text-slate-600">Clique para adicionar foto</span>
              </>
            )}
         </label>
      </div>
    </div>
  );
};
