import { AppData } from './types';
import { INITIAL_DATA, migrateData } from './utils';
import { idbGet, idbSet, requestPersistentStorage } from './db';

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
  // Pede armazenamento persistente ao navegador (evita que o IndexedDB seja limpo
  // automaticamente sob pressão de espaço). Não bloqueia o login se não for suportado.
  requestPersistentStorage();
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

// Carregar dados do usuário — sempre passa por migrateData para compatibilidade.
// Armazenamos em IndexedDB (muito mais espaço que localStorage). Se o navegador
// ainda tiver dados de uma versão antiga do app (salvos em localStorage), eles são
// migrados automaticamente para o IndexedDB na primeira vez que o usuário loga,
// e o localStorage é limpo em seguida — assim nada se perde na transição.
export const loadUserData = async (userId: string): Promise<AppData> => {
  try {
    const fromDB = await idbGet<any>(dataKey(userId));
    if (fromDB) return migrateData(fromDB);

    const legacyRaw = localStorage.getItem(dataKey(userId));
    if (legacyRaw) {
      const migrated = migrateData(JSON.parse(legacyRaw));
      try {
        await idbSet(dataKey(userId), migrated);
        localStorage.removeItem(dataKey(userId));
      } catch {
        // Se por algum motivo a migração para o IndexedDB falhar agora, não há problema:
        // os dados antigos continuam intactos no localStorage e serão migrados na próxima tentativa.
      }
      return migrated;
    }

    return { ...INITIAL_DATA };
  } catch (err) {
    console.error('Erro ao carregar dados do usuário:', err);
    return { ...INITIAL_DATA };
  }
};

// Salvar dados do usuário.
// Retorna { success, error } em vez de só um booleano, para que a tela consiga
// mostrar o motivo real da falha (ex.: "sem espaço em disco") em vez de uma
// mensagem genérica — isso era o que fazia parecer que o backup "sumia" sem
// nenhuma pista de por quê.
export const saveUserData = async (
  userId: string,
  data: AppData
): Promise<{ success: boolean; error?: string }> => {
  try {
    await idbSet(dataKey(userId), data);
    return { success: true };
  } catch (err) {
    console.error('Erro ao salvar dados do usuário:', err);
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao salvar.';
    return { success: false, error: message };
  }
};

// Retorna os dois usuários para exibir na tela de login
export const getPresetUsers = (): LocalUser[] =>
  PRESET_USERS.map(u => ({ id: u.id, name: u.name, username: u.username, color: u.color }));