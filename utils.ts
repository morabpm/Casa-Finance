import { Transaction, Category, Budget, AppData, ActivityLog } from './types';

// Initial Seed Data
export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Salário', type: 'RECEITA', color: '#10b981', fixed: true },
  { id: '2', name: 'Alimentação', type: 'DESPESA', color: '#ef4444', fixed: false },
  { id: '3', name: 'Transporte', type: 'DESPESA', color: '#f59e0b', fixed: false },
  { id: '4', name: 'Moradia', type: 'DESPESA', color: '#3b82f6', fixed: true },
  { id: '5', name: 'Lazer', type: 'DESPESA', color: '#8b5cf6', fixed: false },
  { id: '6', name: 'Fornecedores', type: 'DESPESA', color: '#6366f1', fixed: false },
];

export const INITIAL_DATA: AppData = {
  transactions: [],
  categories: INITIAL_CATEGORIES,
  budgets: [],
  suppliers: [],
  userProfile: { name: 'Admin', email: 'admin@casafinance.com', role: 'Administrador', companyName: 'Minha Empresa' },
  family: 'Família Feliz',
  goals: [],
  activityLog: [],
  // Sem transações ainda: não há "primeiro lançamento", então usamos hoje como referência.
  initialBalance: 0,
  initialBalanceDate: new Date().toISOString().split('T')[0],
};

const STORAGE_KEY = 'casa_finance_pro_v1';

export const migrateData = (raw: any): AppData => {
  const migratedTransactions = (raw.transactions || []).map((t: any) => {
    let defaultStatus = 'REALIZADO';
    if (!t.status) {
      const today = new Date().toISOString().split('T')[0];
      if (t.date > today) {
        defaultStatus = 'PLANEJADO';
      }
    }
    return {
      ...t,
      id: String(t.id),
      category: String(t.category),
      supplierId: t.supplierId ? String(t.supplierId) : undefined,
      status: t.status || defaultStatus,
      notes: t.notes || undefined,
      attachments: t.attachments || [],
    };
  });

  // Retrocompatibilidade do Saldo Inicial de Referência:
  // - initialBalance: se ausente no backup/estado antigo, assume 0 (comportamento anterior).
  // - initialBalanceDate: se ausente, assume a data do primeiro lançamento já existente.
  //   Se não houver nenhum lançamento, usa a data de hoje.
  const firstTransactionDate = migratedTransactions
    .map((t: any) => t.date)
    .filter(Boolean)
    .sort()[0];

  const initialBalance = typeof raw.initialBalance === 'number' && !isNaN(raw.initialBalance)
    ? raw.initialBalance
    : 0;

  const initialBalanceDate = typeof raw.initialBalanceDate === 'string' && raw.initialBalanceDate
    ? raw.initialBalanceDate
    : (firstTransactionDate || new Date().toISOString().split('T')[0]);

  return {
    ...INITIAL_DATA,
    ...raw,
    transactions: migratedTransactions,
    categories: (raw.categories || []).map((c: any) => ({
      ...c,
      id: String(c.id),
    })),
    budgets: (raw.budgets || []).map((b: any) => ({
      ...b,
      id: String(b.id),
      category: String(b.category),
    })),
    suppliers: (raw.suppliers || []).map((s: any) => ({
      ...s,
      id: String(s.id),
      categoryId: String(s.categoryId),
    })),
    goals: (raw.goals || []).map((g: any) => ({ ...g, id: String(g.id) })),
    activityLog: raw.activityLog || [],
    userProfile: raw.userProfile || INITIAL_DATA.userProfile,
    family: raw.family || INITIAL_DATA.family,
    initialBalance,
    initialBalanceDate,
  };
};

export const loadData = (): AppData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return migrateData(JSON.parse(saved));
    return INITIAL_DATA;
  } catch { return INITIAL_DATA; }
};

export const saveData = (data: AppData) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
};

export const createLog = (
  action: ActivityLog['action'],
  entity: ActivityLog['entity'],
  entityId: string,
  description: string
): ActivityLog => ({
  id: crypto.randomUUID(),
  action,
  entity,
  entityId,
  description,
  timestamp: new Date().toISOString(),
});

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export const getMonthName = (monthIndex: number) => {
  const names = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return names[monthIndex] || '';
};

export const calculateTotals = (transactions: Transaction[], month: number, year: number) => {
  let income = 0, expense = 0;
  transactions.forEach(t => {
    const d = new Date(t.date + 'T12:00:00');
    if (d.getMonth() === month && d.getFullYear() === year) {
      if (t.type === 'RECEITA') income += t.amount;
      else expense += t.amount;
    }
  });
  return { income, expense, balance: income - expense };
};

// Encontra o mês/ano do lançamento mais recente. Usado para não deixar o app
// parecer "vazio" quando o mês/ano real de hoje ainda não tem nenhum lançamento
// (ex.: logo após restaurar um backup antigo, ou virada de mês) — nesse caso as
// telas que filtram por mês corrente mostram R$ 0,00 mesmo com centenas de
// lançamentos existentes, o que parece (mas não é) perda de dados.
export const getLatestPeriodWithData = (transactions: Transaction[]): { month: number; year: number } | null => {
  if (!transactions || transactions.length === 0) return null;
  let latest: Date | null = null;
  for (const t of transactions) {
    if (!t.date) continue;
    const d = new Date(t.date + 'T12:00:00');
    if (isNaN(d.getTime())) continue;
    if (!latest || d > latest) latest = d;
  }
  if (!latest) return null;
  return { month: latest.getMonth(), year: latest.getFullYear() };
};