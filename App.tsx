import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
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
  Truck
} from 'lucide-react';

import { AppData, Transaction, Category, Budget, DateFilter, Supplier, UserProfile } from './types';
import { loadData, saveData, INITIAL_DATA } from './utils';

// Views
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Categories } from './components/Categories';
import { Budgets } from './components/Budgets';
import { Suppliers } from './components/Suppliers';
import { Settings } from './components/Settings';

// Contexts
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';

function App() {
  // State Management
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('casa_finance_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Dashboard Filter State (Lifted up to persist across tab switches)
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
      localStorage.setItem('casa_finance_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('casa_finance_theme', 'light');
    }
  }, [isDark]);

  // Handlers
  const addTransaction = (t: Transaction) => setData(prev => ({ ...prev, transactions: [...prev.transactions, t] }));
  const editTransaction = (t: Transaction) => setData(prev => ({ ...prev, transactions: prev.transactions.map(item => item.id === t.id ? t : item) }));
  const deleteTransaction = (id: string) => setData(prev => ({ ...prev, transactions: prev.transactions.filter(item => item.id !== id) }));

  const addCategory = (c: Category) => setData(prev => ({ ...prev, categories: [...prev.categories, c] }));
  const editCategory = (c: Category) => setData(prev => ({ ...prev, categories: prev.categories.map(item => item.id === c.id ? c : item) }));
  const deleteCategory = (id: string) => setData(prev => ({ ...prev, categories: prev.categories.filter(item => item.id !== id) }));

  const addBudget = (b: Budget) => setData(prev => ({ ...prev, budgets: [...prev.budgets, b] }));
  const editBudget = (b: Budget) => setData(prev => ({ ...prev, budgets: prev.budgets.map(item => item.id === b.id ? b : item) }));
  const deleteBudget = (id: string) => setData(prev => ({ ...prev, budgets: prev.budgets.filter(item => item.id !== id) }));

  const addSupplier = (s: Supplier) => setData(prev => ({ ...prev, suppliers: [...(prev.suppliers || []), s] }));
  const editSupplier = (s: Supplier) => setData(prev => ({ ...prev, suppliers: prev.suppliers.map(item => item.id === s.id ? s : item) }));
  const deleteSupplier = (id: string) => setData(prev => ({ ...prev, suppliers: prev.suppliers.filter(item => item.id !== id) }));

  const updateProfile = (profile: UserProfile) => setData(prev => ({ ...prev, userProfile: profile }));

  const handleImport = (newData: AppData) => setData(newData);

  // Navigation Links Configuration
  const navLinks = [
    { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/transactions", icon: <WalletCards size={20} />, label: "Lançamentos" },
    { to: "/categories", icon: <Tags size={20} />, label: "Categorias" },
    { to: "/budgets", icon: <PieChart size={20} />, label: "Orçamentos" },
    { to: "/suppliers", icon: <Truck size={20} />, label: "Fornecedores" },
    { to: "/settings", icon: <SettingsIcon size={20} />, label: "Configurações" },
  ];

  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
            
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
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                title="Toggle Theme"
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
                <Route path="/suppliers" element={
                  <Suppliers 
                    suppliers={data.suppliers || []} 
                    categories={data.categories}
                    onAdd={addSupplier}
                    onEdit={editSupplier}
                    onDelete={deleteSupplier}
                  />
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
    </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;