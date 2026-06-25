import { Transaction, Category, Budget, AppData } from './types';

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
  userProfile: {
    name: 'Admin',
    email: 'admin@casafinance.com',
    role: 'Administrador',
    companyName: 'Minha Empresa',
  },
  family: 'Família Feliz',
};

// Storage Helpers
const STORAGE_KEY = 'casa_finance_pro_v1';

export const loadData = (): AppData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate legacy numbers to strings
      if (parsed.categories) {
        parsed.categories = parsed.categories.map((c: any) => ({ ...c, id: String(c.id) }));
      }
      if (parsed.transactions) {
        parsed.transactions = parsed.transactions.map((t: any) => ({ ...t, id: String(t.id), category: String(t.category) }));
      }
      if (parsed.budgets) {
        parsed.budgets = parsed.budgets.map((b: any) => ({ ...b, id: String(b.id), category: String(b.category) }));
      }
      if (parsed.suppliers) {
        parsed.suppliers = parsed.suppliers.map((s: any) => ({ ...s, id: String(s.id), categoryId: String(s.categoryId) }));
      }
      return { ...INITIAL_DATA, ...parsed };
    }
    return INITIAL_DATA;
  } catch (e) {
    console.error("Failed to load data", e);
    return INITIAL_DATA;
  }
};

export const saveData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};

// Formatting Helpers
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export const getMonthName = (monthIndex: number) => { // 0-11
  const names = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return names[monthIndex] || '';
};

export const generateId = () => {
  return crypto.randomUUID();
};

// Calculation Helpers
export const calculateTotals = (transactions: Transaction[], month: number, year: number) => {
  let income = 0;
  let expense = 0;

  transactions.forEach(t => {
    const d = new Date(t.date + 'T12:00:00'); // avoid timezone issues
    if (d.getMonth() === month && d.getFullYear() === year) {
      if (t.type === 'RECEITA') income += t.amount;
      else expense += t.amount;
    }
  });

  return { income, expense, balance: income - expense };
};