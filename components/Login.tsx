
import React, { useState, useEffect } from 'react';
import { Card } from './ui/Shared';
import { Loader2, Lock, LogIn, AlertCircle, User as UserIcon, CheckSquare, Square } from 'lucide-react';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';
import { AppConfig } from '../types';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  // Carregar usuário e senha salvos se existirem e Configurações de App
  useEffect(() => {
    const savedUsername = localStorage.getItem('painelSucena_remembered_user');
    const savedPassword = localStorage.getItem('painelSucena_remembered_pass');
    
    if (savedUsername) {
      setFormData(prev => ({ 
          ...prev, 
          username: savedUsername,
          password: savedPassword || '' // Carrega senha se existir
      }));
      setRememberMe(true);
    }

    // Carregar configurações visuais
    const appConfig = StorageService.getAppConfig();
    setConfig(appConfig);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await AuthService.login(formData.username, formData.password);
      
      // Lógica de Salvar/Esquecer Usuário E Senha
      if (rememberMe) {
        localStorage.setItem('painelSucena_remembered_user', formData.username);
        localStorage.setItem('painelSucena_remembered_pass', formData.password);
      } else {
        localStorage.removeItem('painelSucena_remembered_user');
        localStorage.removeItem('painelSucena_remembered_pass');
      }

      onLogin();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* CSS Personalizado para animação lenta */}
      <style>{`
        @keyframes slow-pulse {
          0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 0 rgba(0,0,0,0)); }
          50% { opacity: 0.6; transform: scale(1.02); filter: drop-shadow(0 0 5px rgba(234, 179, 8, 0.3)); }
        }
        .animate-slow-pulse {
          animation: slow-pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <div className="w-full max-w-md">
        
        {/* Logo Section - Custom Image or Text */}
        <div className="flex justify-center items-center mb-12 w-full">
           {config?.loginLogoUrl ? (
               <img 
                  src={config.loginLogoUrl} 
                  alt="Logo" 
                  className="h-24 md:h-32 max-w-full object-contain mx-auto animate-in fade-in zoom-in duration-500" 
               />
           ) : (
               <h1 className="text-5xl font-light tracking-[0.3em] text-black uppercase font-sans select-none text-center w-full animate-slow-pulse">
                 SUCENA
               </h1>
           )}
        </div>
        
        <Card className="border-t-4 border-t-yellow-500 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Painel Operacional</h2>
            <p className="text-slate-500 mt-2 text-sm uppercase tracking-wide font-medium">
              Acesso Restrito
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-200">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Campo Usuário */}
              <div className="relative">
                <UserIcon className="absolute top-3 left-3 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Usuário"
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>

              {/* Campo Senha */}
              <div className="relative">
                <Lock className="absolute top-3 left-3 text-slate-400" size={18} />
                <input
                  type="password"
                  placeholder="Senha"
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>

              {/* Checkbox Lembrar-me */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none"
                >
                  {rememberMe ? (
                    <CheckSquare size={20} className="text-yellow-500 fill-current" />
                  ) : (
                    <Square size={20} className="text-slate-400" />
                  )}
                  <span className="text-sm font-medium select-none">Lembrar usuário e senha</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-black hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md mt-6 border border-slate-800"
            >
              {isLoading ? (
                <Loader2 className="animate-spin text-yellow-500" size={20} />
              ) : (
                <><LogIn size={18} className="text-yellow-500" /> Entrar</>
              )}
            </button>
          </form>
        </Card>
        
        <div className="text-center mt-6 text-slate-400 text-xs">
            &copy; by powered FabrícioSilva I {new Date().getFullYear()} Sucena Empreendimentos.
        </div>
      </div>
    </div>
  );
};
