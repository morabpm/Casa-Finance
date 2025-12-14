import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Budget, Category, Transaction } from '../types';
import { formatCurrency, generateId, getMonthName } from '../utils';
import { Modal } from './ui/Modal';

interface BudgetsProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onAdd: (b: Budget) => void;
  onDelete: (id: number) => void;
}

export const Budgets: React.FC<BudgetsProps> = ({ budgets, categories, transactions, onAdd, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<Partial<Budget>>({
    amount: 0,
    category: categories[0]?.id || 0,
    month: currentMonth,
    year: currentYear
  });

  const getSpent = (catId: number, month: number, year: number) => {
    return transactions
      .filter(t => t.category === catId && t.type === 'DESPESA')
      .filter(t => {
        const d = new Date(t.date + 'T12:00:00');
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData as Budget,
      id: generateId(budgets.map(b => ({ id: b.id })))
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Orçamentos</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={18} /> Novo Orçamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map(budget => {
          const category = categories.find(c => c.id === budget.category);
          if (!category) return null;
          
          const spent = getSpent(budget.category, budget.month, budget.year);
          const percentage = Math.min((spent / budget.amount) * 100, 100);
          const isOver = spent > budget.amount;
          
          let barColor = 'bg-emerald-500';
          if (percentage > 80) barColor = 'bg-yellow-500';
          if (percentage >= 100) barColor = 'bg-red-500';

          return (
            <div key={budget.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{category.name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{getMonthName(budget.month)} / {budget.year}</p>
                </div>
                <button onClick={() => onDelete(budget.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Gasto: </span>
                  <span className={`font-semibold ${isOver ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{formatCurrency(spent)}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Meta: </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(budget.amount)}</span>
                </div>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div className={`h-2.5 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
              </div>
              
              {isOver && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-600 font-medium">
                  <AlertCircle size={14} />
                  Orçamento excedido!
                </div>
              )}
            </div>
          );
        })}
        {budgets.length === 0 && (
           <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
             Não há orçamentos definidos. Crie um para começar a controlar seus gastos.
           </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Orçamento">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
            <select 
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
              value={formData.category}
              onChange={e => setFormData({...formData, category: parseInt(e.target.value)})}
            >
              {categories.filter(c => c.type === 'DESPESA').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Limite</label>
            <input 
              required type="number" step="0.01"
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mês</label>
              <select 
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                value={formData.month}
                onChange={e => setFormData({...formData, month: parseInt(e.target.value)})}
              >
                {Array.from({length: 12}).map((_, i) => (
                  <option key={i} value={i}>{getMonthName(i)}</option>
                ))}
              </select>
             </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ano</label>
              <input 
                 type="number"
                 className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                 value={formData.year}
                 onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
              />
             </div>
          </div>
          <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 rounded-md">Salvar</button>
        </form>
      </Modal>
    </div>
  );
};