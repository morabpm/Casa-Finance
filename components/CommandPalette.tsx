import React, { useState, useEffect, useMemo } from 'react';
import { Search, WalletCards, Tags, Truck, Target, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppData } from '../types';
import { formatCurrency } from '../utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, data }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return null;
    const q = debouncedQuery.toLowerCase();
    return {
      transactions: data.transactions
        .filter(t => t.description.toLowerCase().includes(q))
        .slice(0, 5),
      categories: data.categories
        .filter(c => c.name.toLowerCase().includes(q))
        .slice(0, 5),
      suppliers: data.suppliers
        .filter(s => s.name.toLowerCase().includes(q))
        .slice(0, 5),
      goals: (data.goals || [])
        .filter(g => g.name.toLowerCase().includes(q))
        .slice(0, 5),
    };
  }, [debouncedQuery, data]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <Search size={20} className="text-gray-400 mr-3" />
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 text-base"
            placeholder="Buscar lançamentos, categorias, metas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={onClose} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
            ESC
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {!results ? (
            <div className="p-6">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Atalhos Rápidos</h4>
              <div className="space-y-2">
                <button onClick={() => handleNavigate('/dashboard')} className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-750 rounded text-left transition-colors">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><Command size={16}/> Dashboard</span>
                  <kbd className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-500">Alt+D</kbd>
                </button>
                <button onClick={() => handleNavigate('/transactions')} className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-750 rounded text-left transition-colors">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><WalletCards size={16}/> Lançamentos</span>
                  <kbd className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-500">Alt+T</kbd>
                </button>
                <div className="w-full flex items-center justify-between p-2 opacity-50">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><Search size={16}/> Busca Rápida</span>
                  <kbd className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-500">Ctrl+K</kbd>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2">
              {results.transactions.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lançamentos</div>
                  {results.transactions.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => handleNavigate('/transactions')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-750 flex justify-between items-center transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <WalletCards size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{t.description}</span>
                      </div>
                      <span className={`text-sm font-medium ${t.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(t.amount)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.categories.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categorias</div>
                  {results.categories.map(c => (
                    <button 
                      key={c.id}
                      onClick={() => handleNavigate('/categories')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-750 flex items-center gap-2 transition-colors"
                    >
                      <Tags size={16} style={{ color: c.color }} />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.suppliers.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fornecedores</div>
                  {results.suppliers.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => handleNavigate('/suppliers')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-750 flex items-center gap-2 transition-colors"
                    >
                      <Truck size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{s.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.goals.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Metas</div>
                  {results.goals.map(g => (
                    <button 
                      key={g.id}
                      onClick={() => handleNavigate('/goals')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-750 flex justify-between items-center transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{g.icon}</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{g.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}</span>
                    </button>
                  ))}
                </div>
              )}

              {Object.values(results).every(arr => arr.length === 0) && (
                <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  Nenhum resultado encontrado para "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
