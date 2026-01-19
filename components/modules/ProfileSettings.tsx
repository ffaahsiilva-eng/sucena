
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, FileInput } from '../ui/Shared';
import { AuthService, User } from '../../services/authService';
import { StorageService } from '../../services/storageService';
import { UserCog, Save, Loader2, Camera } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [password, setPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    const titles = StorageService.getJobTitles();
    setJobTitles(titles);

    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
        setUser(currentUser);
        setName(currentUser.name);
        setEmail(currentUser.email);
        setJobTitle(currentUser.jobTitle);
        setPassword(currentUser.password);
        setPhotoUrl(currentUser.photoUrl || '');
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      
      setLoading(true);
      setSuccessMsg('');

      try {
          const updatedUser: User = {
              ...user,
              name,
              email,
              jobTitle,
              password,
              photoUrl
          };
          
          await AuthService.updateUser(updatedUser);
          setUser(updatedUser);
          setSuccessMsg('Perfil atualizado com sucesso!');
          
          // Limpa mensagem após 3 segundos
          setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
          alert("Erro ao atualizar perfil.");
      } finally {
          setLoading(false);
      }
  };

  if (!user) return <div>Carregando perfil...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
       <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-yellow-500 rounded-lg text-black shadow-md">
             <UserCog size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Meu Perfil</h2>
            <p className="text-slate-500">Atualize suas informações pessoais e credenciais.</p>
          </div>
       </div>

       <Card>
           <form onSubmit={handleUpdate} className="space-y-6">
               
               {/* Foto de Perfil */}
               <div className="flex flex-col items-center justify-center mb-6">
                   <div className="relative w-32 h-32 mb-4">
                       {photoUrl ? (
                           <img src={photoUrl} alt="Perfil" className="w-full h-full rounded-full object-cover border-4 border-slate-100 shadow-lg" />
                       ) : (
                           <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-slate-400 border-4 border-white shadow-lg">
                               <UserCog size={48} />
                           </div>
                       )}
                       <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md">
                           <Camera size={20} className="text-slate-600"/>
                       </div>
                   </div>
                   <div className="w-full max-w-xs">
                        <FileInput 
                            label="Alterar Foto" 
                            onImageUploaded={(url) => setPhotoUrl(url)} 
                        />
                   </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Input 
                       label="Nome Completo" 
                       value={name} 
                       onChange={e => setName(e.target.value)} 
                       required
                   />
                   
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Cargo / Função</label>
                       <select 
                           className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                           value={jobTitle}
                           onChange={e => setJobTitle(e.target.value)}
                       >
                           {jobTitles.map(title => (
                               <option key={title} value={title}>{title}</option>
                           ))}
                       </select>
                   </div>

                   <Input 
                       label="E-mail" 
                       type="email" 
                       value={email} 
                       onChange={e => setEmail(e.target.value)} 
                       required
                   />
                   
                   <div className="relative">
                       <Input 
                           label="Senha" 
                           type="text" 
                           value={password} 
                           onChange={e => setPassword(e.target.value)} 
                           required
                       />
                       <span className="text-[10px] text-slate-400 absolute right-0 top-0 mt-1 mr-1">Visível para edição</span>
                   </div>
               </div>

               <div className="pt-4 border-t border-slate-100">
                   <Button type="submit" disabled={loading} className="w-full md:w-auto md:px-8">
                       {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Salvar Alterações</>}
                   </Button>
                   
                   {successMsg && (
                       <p className="text-green-600 font-bold text-center mt-3 animate-pulse">
                           {successMsg}
                       </p>
                   )}
               </div>
           </form>
       </Card>
    </div>
  );
};
