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
  id: number;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: number; // ID reference
  type: TransactionType;
  status: TransactionStatus;
  attachments?: Attachment[];
}

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  color: string;
  fixed: boolean;
}

export interface Budget {
  id: number;
  category: number; // ID reference
  amount: number;
  month: number;
  year: number;
}

export interface Supplier {
  id: number;
  name: string;
  cnpj: string;
  email: string;
  whatsapp: string;
  pixKey: string;
  pixType: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
  categoryId: number;
  description: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  companyName: string;
}

export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  suppliers: Supplier[];
  userProfile: UserProfile;
  family: string; // Legacy field, kept for compatibility
}

export interface DateFilter {
  month: number;
  year: number;
}