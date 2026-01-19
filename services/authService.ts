
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  jobTitle: string; 
  photoUrl?: string; // Novo campo para foto de perfil
  whatsapp?: string; // Novo campo para WhatsApp
  lastSeen?: string; // Data ISO da última atividade
}

const DB_KEY = 'painelSucena_users_db_v2'; 
const SESSION_KEY = 'painelSucena_session_user';

export const AuthService = {
  // Inicializa com usuário admin e usuários padrão se não existirem
  init: () => {
    const usersStr = localStorage.getItem(DB_KEY);
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];
    let hasChanges = false;
    
    // Verifica se admin existe, se não, cria
    if (!users.find(u => u.username === 'admin')) {
        const adminUser: User = {
            id: 'admin-id',
            username: 'admin',
            email: 'admin@sucena.com',
            password: 'admin',
            name: 'Administrador',
            role: 'ADMIN',
            jobTitle: 'Administrador do Sistema'
        };
        users.push(adminUser);
        hasChanges = true;
    }

    // Lista de Usuários Padrão Solicitados
    const seedUsers = [
        { username: 'Luis', password: '1234', name: 'Luis', jobTitle: 'Preposto', role: 'USER' },
        { username: 'Itamar', password: '1234', name: 'Itamar', jobTitle: 'Técnico de Segurança', role: 'USER' },
        { username: 'Thiago', password: '1234', name: 'Thiago', jobTitle: 'Técnico Meio Ambiente', role: 'USER' },
        { username: 'Alexa', password: '1234', name: 'Alexa', jobTitle: 'Técnico de Segurança', role: 'USER' },
        { username: 'Rudney', password: '1234', name: 'Rudney', jobTitle: 'Encarregado', role: 'USER' },
        { username: 'Jose', password: '1234', name: 'Jose', jobTitle: 'Encarregado', role: 'USER' },
        { username: 'Fabricio', password: 'familia10', name: 'Fabricio', jobTitle: 'Encarregado Geral', role: 'USER' },
        { username: 'Creriane', password: '1234', name: 'Creriane', jobTitle: 'Aux. Administrativo', role: 'USER' },
        { username: 'Danieli', password: '1234', name: 'Danieli', jobTitle: 'Planejador (a)', role: 'USER' }
    ];

    seedUsers.forEach(seed => {
        // Verifica case-insensitive para evitar duplicatas (ex: luis vs Luis)
        if (!users.find(u => u.username.toLowerCase() === seed.username.toLowerCase())) {
            users.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                username: seed.username,
                email: `${seed.username.toLowerCase()}@sucena.com`, // Email fictício gerado
                password: seed.password,
                name: seed.name,
                role: seed.role as UserRole,
                jobTitle: seed.jobTitle
            });
            hasChanges = true;
        }
    });

    if (hasChanges) {
        localStorage.setItem(DB_KEY, JSON.stringify(users));
    }
  },

  // Busca todos os usuários (para o Admin Panel)
  getUsers: (): User[] => {
    AuthService.init(); // Garante que usuários existam
    const usersStr = localStorage.getItem(DB_KEY);
    return usersStr ? JSON.parse(usersStr) : [];
  },

  // Cria um novo usuário
  register: (username: string, email: string, password: string, role: UserRole = 'USER', name?: string, jobTitle?: string, whatsapp?: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        AuthService.init();
        const users = AuthService.getUsers();
        
        if (users.find(u => u.username === username)) {
          reject(new Error('Este usuário já está cadastrado.'));
          return;
        }

        const newUser: User = {
          id: Date.now().toString(),
          username,
          email,
          password,
          name: name || username, 
          role,
          jobTitle: jobTitle || 'Colaborador',
          whatsapp: whatsapp || ''
        };

        users.push(newUser);
        localStorage.setItem(DB_KEY, JSON.stringify(users));
        
        resolve(newUser);
      }, 500);
    });
  },

  // Atualiza um usuário existente
  updateUser: (updatedUser: User): Promise<User> => {
      return new Promise((resolve, reject) => {
          const users = AuthService.getUsers();
          const index = users.findIndex(u => u.id === updatedUser.id);
          
          if (index === -1) {
              reject(new Error("Usuário não encontrado."));
              return;
          }

          users[index] = updatedUser;
          localStorage.setItem(DB_KEY, JSON.stringify(users));

          // Se o usuário atualizado for o da sessão atual, atualiza a sessão também
          const sessionUser = AuthService.getCurrentUser();
          if (sessionUser && sessionUser.id === updatedUser.id) {
              localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
          }

          resolve(updatedUser);
      });
  },

  // Deleta usuário
  deleteUser: (id: string): Promise<void> => {
      return new Promise((resolve, reject) => {
          const users = AuthService.getUsers();
          if (id === 'admin-id') {
              reject(new Error("Não é possível remover o super administrador."));
              return;
          }
          const filtered = users.filter(u => u.id !== id);
          localStorage.setItem(DB_KEY, JSON.stringify(filtered));
          resolve();
      });
  },

  // Realiza login via Usuário e Senha
  login: (username: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        AuthService.init();
        const users = AuthService.getUsers();
        // Verifica username E password
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
          reject(new Error('Usuário ou senha inválidos.'));
          return;
        }

        // Atualiza lastSeen no login
        user.lastSeen = new Date().toISOString();
        const index = users.findIndex(u => u.id === user.id);
        if(index !== -1) {
            users[index] = user;
            localStorage.setItem(DB_KEY, JSON.stringify(users));
        }

        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        localStorage.setItem('painelSucenaAuth', 'true');
        resolve(user);
      }, 600);
    });
  },

  // Pega usuário atual da sessão
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(SESSION_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Atualiza o lastSeen do usuário atual (Ping)
  ping: () => {
      const sessionUser = AuthService.getCurrentUser();
      if (!sessionUser) return;

      const users = AuthService.getUsers();
      const index = users.findIndex(u => u.id === sessionUser.id);
      
      if (index !== -1) {
          users[index].lastSeen = new Date().toISOString();
          localStorage.setItem(DB_KEY, JSON.stringify(users));
      }
  },

  // Logout
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('painelSucenaAuth');
  }
};
