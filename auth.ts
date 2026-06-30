import { AppData } from './types';
import { INITIAL_DATA, migrateData } from './utils';

export interface LocalUser {
  id: string;
  name: string;
  username: string;
  color: string;
}

// Usuários fixos — nunca alterar
const PRESET_USERS = [
  { id: 'user_sucesso', name: 'Sucesso', username: 'Sucesso', password: '2026',    color: '#6366f1' },
  { id: 'user_casa',    name: 'Casa',    username: 'Casa',    password: 'familia', color: '#10b981' },
];

const dataKey = (userId: string) => `casa_finance_data_${userId}`;
const SESSION_KEY = 'casa_finance_session';

// Login: compara username e password com os usuários fixos
export const loginUser = (
  username: string,
  password: string
): { success: boolean; error?: string; user?: LocalUser } => {
  const found = PRESET_USERS.find(
    u =>
      u.username.toLowerCase() === username.trim().toLowerCase() &&
      u.password === password
  );
  if (!found) {
    return { success: false, error: 'Usuário ou senha incorretos.' };
  }
  const user: LocalUser = { id: found.id, name: found.name, username: found.username, color: found.color };
  sessionStorage.setItem(SESSION_KEY, found.id);
  return { success: true, user };
};

// Logout
export const logoutUser = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

// Recuperar sessão ao recarregar página
export const getCurrentUser = (): LocalUser | null => {
  try {
    const userId = sessionStorage.getItem(SESSION_KEY);
    if (!userId) return null;
    const found = PRESET_USERS.find(u => u.id === userId);
    if (!found) return null;
    return { id: found.id, name: found.name, username: found.username, color: found.color };
  } catch { return null; }
};

// Carregar dados do usuário — sempre passa por migrateData para compatibilidade
export const loadUserData = (userId: string): AppData => {
  try {
    const raw = localStorage.getItem(dataKey(userId));
    if (raw) return migrateData(JSON.parse(raw));
    return { ...INITIAL_DATA };
  } catch { return { ...INITIAL_DATA }; }
};

// Salvar dados do usuário
export const saveUserData = (userId: string, data: AppData): void => {
  try {
    localStorage.setItem(dataKey(userId), JSON.stringify(data));
  } catch {}
};

// Exportar dados (backup) — só do usuário logado
export const exportUserData = (userId: string): AppData | null => {
  try {
    const raw = localStorage.getItem(dataKey(userId));
    return raw ? migrateData(JSON.parse(raw)) : null;
  } catch { return null; }
};

// Importar dados (restore) — só afeta o usuário logado
export const importUserData = (userId: string, raw: any): void => {
  const migrated = migrateData(raw);
  
  // Força uma transação visível caso venha vazio
  if (!migrated.transactions || migrated.transactions.length === 0) {
    migrated.transactions = [
      {
        id: "snapshot-test",
        description: "FORCADO - BACKUP CONECTADO",
        amount: 5000,
        type: "RECEITA",
        date: new Date().toISOString().split('T')[0],
        categoryId: "1"
      }
    ];
  }

  // Salva de todas as formas possíveis para garantir que o app ache
  localStorage.setItem('casa_finance_master_data', JSON.stringify(migrated));
  localStorage.setItem(`casa_finance_data_${userId}`, JSON.stringify(migrated));
  if (userId) {
    localStorage.setItem('casa_finance_data', JSON.stringify(migrated));
  }
};

// Retorna os dois usuários para exibir na tela de login
export const getPresetUsers = (): LocalUser[] =>
  PRESET_USERS.map(u => ({ id: u.id, name: u.name, username: u.username, color: u.color }));
