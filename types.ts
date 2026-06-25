export type TransactionType = 'RECEITA' | 'DESPESA';
export type TransactionStatus = 'REALIZADO' | 'PLANEJADO';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // In a real app this would be a blob URL or S3 link
  uploadedAt?: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: string; // ID reference
  type: TransactionType;
  status: TransactionStatus;
  attachments?: Attachment[];
  notes?: string;
  supplierId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  fixed: boolean;
}

export interface Budget {
  id: string;
  category: string; // ID reference
  amount: number;
  month: number;
  year: number;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  whatsapp: string;
  pixKey: string;
  pixType: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
  categoryId: string;
  description: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  companyName: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  color: string;
  icon: string; // emoji
}

export interface ActivityLog {
  id: string;
  action: 'CREATE' | 'EDIT' | 'DELETE';
  entity: 'TRANSACTION' | 'CATEGORY' | 'BUDGET' | 'SUPPLIER' | 'GOAL';
  entityId: string;
  description: string;
  timestamp: string; // ISO
}

export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  suppliers: Supplier[];
  userProfile: UserProfile;
  family: string; // Legacy field, kept for compatibility
  goals: Goal[];
  activityLog: ActivityLog[];
}

export interface DateFilter {
  month: number;
  year: number;
}