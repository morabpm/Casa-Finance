import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  WalletCards, 
  Tags, 
  PieChart, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Menu,
  X,
  Truck,
  Target,
  FileBarChart,
  Search
} from 'lucide-react';

import { AppData, Transaction, Category, Budget, DateFilter, Supplier, UserProfile, Goal } from './types';
import { loadData, saveData, INITIAL_DATA, createLog, migrateData, formatCurrency } from './utils';

// Views
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Categories } from './components/Categories';
import { Budgets } from './components/Budgets';
import { Suppliers } from './components/Suppliers';
import { Settings } from './components/Settings';
import { Goals } from './components/Goals';
import { Reports } from './components/Reports';
import { CommandPalette } from './components/CommandPalette';

// Contexts
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';

function AppLayout() {
  const navigate = useNavigate();

  // State Management
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('casa_finance_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  
  // Dashboard Filter State
  const [filter, setFilter] = useState<DateFilter>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  // Initialization
  useEffect(() => {
    const loaded = loadData();
    setData(loaded);
  }, []);

  // Persist Data changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Dark Mode Toggle Effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 't') navigate('/transactions');
      if (e.altKey && e.key === 'd') navigate('/dashboard');
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('casa_finance_theme', next ? 'dark' : 'light');
  };

  // Handlers
  const addTransaction = (t: Transaction) => {
    const log = createLog(
      'CREATE', 'TRANSACTION', t.id,
      `${t.type === 'RECEITA' ? 'Receita' : 'Despesa'} "${t.description}" de ${formatCurrency(t.amount)} criada`
    );
    setData(prev => ({
      ...prev,
      transactions: [...prev.transactions, t],
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const editTransaction = (t: Transaction) => {
    const log = createLog('EDIT', 'TRANSACTION', t.id, `Transação "${t.description}" editada`);
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(item => item.id === t.id ? t : item),
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const deleteTransaction = (id: string) => {
    const t = data.transactions.find(x => x.id === id);
    const log = createLog('DELETE', 'TRANSACTION', id, `Transação "${t?.description || id}" excluída`);
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(item => item.id !== id),
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const addCategory = (c: Category) => {
    const log = createLog('CREATE', 'CATEGORY', c.id, `Categoria "${c.name}" criada`);
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, c],
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const editCategory = (c: Category) => {
    const log = createLog('EDIT', 'CATEGORY', c.id, `Categoria "${c.name}" editada`);
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(item => item.id === c.id ? c : item),
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const deleteCategory = (id: string) => {
    const c = data.categories.find(x => x.id === id);
    const log = createLog('DELETE', 'CATEGORY', id, `Categoria "${c?.name || id}" excluída`);
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(item => item.id !== id),
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const addBudget = (b: Budget) => {
    const cat = data.categories.find(c => c.id === b.category);
    const log = createLog('CREATE', 'BUDGET', b.id, `Orçamento de ${formatCurrency(b.amount)} criado para "${cat?.name || 'Categoria'}"`);
    setData(prev => ({
      ...prev,
      budgets: [...prev.budgets, b],
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const editBudget = (b: Budget) => {
    const cat = data.categories.find(c => c.id === b.category);
    const log = createLog('EDIT', 'BUDGET', b.id, `Orçamento de "${cat?.name || 'Categoria'}" editado`);
    setData(prev => ({
      ...prev,
      budgets: prev.budgets.map(item => item.id === b.id ? b : item),
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const deleteBudget = (id: string) => {
    const b = data.budgets.find(x => x.id === id);
    const cat = data.categories.find(c => c.id === b?.category);
    const log = createLog('DELETE', 'BUDGET', id, `Orçamento de "${cat?.name || id}" excluído`);
    setData(prev => ({
      ...prev,
      budgets: prev.budgets.filter(item => item.id !== id),
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const addSupplier = (s: Supplier) => {
    const log = createLog('CREATE', 'SUPPLIER', s.id, `Fornecedor "${s.name}" criado`);
    setData(prev => ({
      ...prev,
      suppliers: [...(prev.suppliers || []), s],
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const editSupplier = (s: Supplier) => {
    const log = createLog('EDIT', 'SUPPLIER', s.id, `Fornecedor "${s.name}" editado`);
    setData(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(item => item.id === s.id ? s : item),
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const deleteSupplier = (id: string) => {
    const s = data.suppliers.find(x => x.id === id);
    const log = createLog('DELETE', 'SUPPLIER', id, `Fornecedor "${s?.name || id}" excluído`);
    setData(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(item => item.id !== id),
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const addGoal = (g: Goal) => {
    const log = createLog('CREATE', 'GOAL', g.id, `Meta "${g.name}" criada`);
    setData(prev => ({
      ...prev,
      goals: [...(prev.goals || []), g],
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const editGoal = (g: Goal) => {
    const log = createLog('EDIT', 'GOAL', g.id, `Meta "${g.name}" editada`);
    setData(prev => ({
      ...prev,
      goals: (prev.goals || []).map(item => item.id === g.id ? g : item),
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const deleteGoal = (id: string) => {
    const g = data.goals?.find(x => x.id === id);
    const log = createLog('DELETE', 'GOAL', id, `Meta "${g?.name || id}" excluída`);
    setData(prev => ({
      ...prev,
      goals: (prev.goals || []).filter(item => item.id !== id),
      activityLog: [log, ...(prev.activityLog || [])].slice(0, 200),
    }));
  };

  const updateProfile = (profile: UserProfile) => setData(prev => ({ ...prev, userProfile: profile }));

  const handleImport = (raw: any) => {
    const migrated = migrateData(raw);
    setData(migrated);
  };

  // Navigation Links Configuration
  const navLinks = [
    { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/transactions", icon: <WalletCards size={20} />, label: "Lançamentos" },
    { to: "/categories", icon: <Tags size={20} />, label: "Categorias" },
    { to: "/budgets", icon: <PieChart size={20} />, label: "Orçamentos" },
    { to: "/goals", icon: <Target size={20} />, label: "Metas" },
    { to: "/suppliers", icon: <Truck size={20} />, label: "Fornecedores" },
    { to: "/reports", icon: <FileBarChart size={20} />, label: "Relatórios" },
    { to: "/settings", icon: <SettingsIcon size={20} />, label: "Configurações" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300">
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} data={data} />
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
           <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">CF</div>
           <h1 className="text-xl font-bold tracking-tight">Casa Finance Pro</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map(link => (
            <NavLink 
              key={link.to} 
              to={link.to}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 px-4 py-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
               {data.userProfile?.name ? data.userProfile.name.substring(0,2).toUpperCase() : 'US'}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium truncate">{data.userProfile?.name || 'Usuário'}</p>
               <p className="text-xs text-gray-500 truncate">{data.userProfile?.companyName || 'Pro Plan'}</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Overlay */}
      <div className={`md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
           <span className="font-bold text-lg">Menu</span>
           <button onClick={() => setIsMobileMenuOpen(false)}><X /></button>
         </div>
         <nav className="p-4 space-y-2">
          {navLinks.map(link => (
              <NavLink 
                key={link.to} 
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-md ${
                    isActive ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600' : 'text-gray-600 dark:text-gray-400'
                  }`
                }
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
         </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6">
          <button 
            className="md:hidden p-2 text-gray-600 dark:text-gray-300"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1"></div> {/* Spacer */}
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsCommandOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              title="Buscar (Cmd/Ctrl + K)"
            >
              <Search size={20} />
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              title="Alternar Tema"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <Dashboard data={data} filter={filter} setFilter={setFilter} />
              } />
              <Route path="/transactions" element={
                <Transactions 
                  transactions={data.transactions} 
                  categories={data.categories}
                  suppliers={data.suppliers || []}
                  onAdd={addTransaction}
                  onEdit={editTransaction}
                  onDelete={deleteTransaction}
                />
              } />
              <Route path="/categories" element={
                <Categories 
                  categories={data.categories}
                  transactions={data.transactions}
                  budgets={data.budgets}
                  onAdd={addCategory} 
                  onEdit={editCategory}
                  onDelete={deleteCategory} 
                />
              } />
              <Route path="/budgets" element={
                <Budgets 
                  budgets={data.budgets} 
                  categories={data.categories} 
                  transactions={data.transactions}
                  onAdd={addBudget} 
                  onEdit={editBudget}
                  onDelete={deleteBudget} 
                />
              } />
              <Route path="/goals" element={
                <Goals 
                  goals={data.goals || []} 
                  onAdd={addGoal} 
                  onEdit={editGoal} 
                  onDelete={deleteGoal} 
                />
              } />
              <Route path="/suppliers" element={
                <Suppliers 
                  suppliers={data.suppliers || []} 
                  categories={data.categories}
                  onAdd={addSupplier}
                  onEdit={editSupplier}
                  onDelete={deleteSupplier}
                />
              } />
              <Route path="/reports" element={
                <Reports data={data} />
              } />
              <Route path="/settings" element={
                <Settings 
                  data={data} 
                  onImport={handleImport} 
                  onUpdateProfile={updateProfile}
                />
              } />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;