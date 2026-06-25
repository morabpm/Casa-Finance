import React, { useState, useMemo } from 'react';
import { Plus, Trash2, AlertCircle, Edit2, Copy } from 'lucide-react';
import { Budget, Category, Transaction } from '../types';
import { formatCurrency, getMonthName } from '../utils';
import { Modal } from './ui/Modal';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

interface BudgetsProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onAdd: (b: Budget) => void;
  onEdit: (b: Budget) => void;
  onDelete: (id: string) => void;
}

export const Budgets: React.FC<BudgetsProps> = ({ budgets, categories, transactions, onAdd, onEdit, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Partial<Budget>>({
    amount: 0,
    category: categories[0]?.id || '',
    month: currentMonth,
    year: currentYear
  });

  const handleOpenModal = (b?: Budget) => {
    if (b) {
      setEditingId(b.id);
      setFormData(b);
    } else {
      setEditingId(null);
      setFormData({
        amount: 0,
        category: categories[0]?.id || '',
        month: filterMonth,
        year: filterYear
      });
    }
    setIsModalOpen(true);
  };

  const getSpent = (catId: string, month: number, year: number) => {
    return transactions
      .filter(t => t.category === catId && t.type === 'DESPESA')
      .filter(t => {
        const d = new Date(t.date + 'T12:00:00');
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const filteredBudgets = useMemo(() => {
    return budgets
      .filter(b => b.month === filterMonth && b.year === filterYear)
      .map(b => {
        const spent = getSpent(b.category, b.month, b.year);
        const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
        return { ...b, spent, percentage };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [budgets, filterMonth, filterYear, transactions]);

  const handleCopyFromPrevious = () => {
    const prevMonth = filterMonth === 0 ? 11 : filterMonth - 1;
    const prevYear = filterMonth === 0 ? filterYear - 1 : filterYear;

    const prevBudgets = budgets.filter(b => b.month === prevMonth && b.year === prevYear);
    const currentBudgets = budgets.filter(b => b.month === filterMonth && b.year === filterYear);
    
    let addedCount = 0;
    prevBudgets.forEach(pb => {
      const exists = currentBudgets.some(cb => cb.category === pb.category);
      if (!exists) {
        onAdd({
          id: crypto.randomUUID(),
          category: pb.category,
          amount: pb.amount,
          month: filterMonth,
          year: filterYear
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      showToast(`${addedCount} orçamentos copiados do mês anterior.`, 'success');
    } else {
      showToast('Nenhum orçamento novo para copiar.', 'info');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEdit({ ...formData, id: editingId } as Budget);
      showToast('Orçamento atualizado com sucesso.', 'success');
    } else {
      onAdd({
        ...formData as Budget,
        id: crypto.randomUUID()
      });
      showToast('Orçamento definido com sucesso.', 'success');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Orçamentos</h2>
        
        <div className="flex flex-wrap items-center gap-2">
          <select 
            className="rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm dark:text-white p-2"
            value={filterMonth}
            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{getMonthName(i)}</option>
            ))}
          </select>
          <select 
            className="rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm dark:text-white p-2"
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          
          <button 
            onClick={handleCopyFromPrevious}
            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors ml-auto md:ml-0"
            title="Copiar do mês anterior"
          >
            <Copy size={16} /> <span className="hidden sm:inline">Copiar Anterior</span>
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBudgets.map(budget => {
          const category = categories.find(c => c.id === budget.category);
          if (!category) return null;
          
          const { spent, percentage } = budget;
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
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenModal(budget)} className="text-blue-500 hover:text-blue-700 p-1" title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => confirm({
                    message: 'Tem certeza que deseja excluir este orçamento?',
                    onConfirm: () => {
                      onDelete(budget.id);
                      showToast('Orçamento excluído com sucesso.', 'success');
                    }
                  })} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Excluir">
                    <Trash2 size={16} />
                  </button>
                </div>
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
                <div className={`h-2.5 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
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
        {filteredBudgets.length === 0 && (
           <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
             Não há orçamentos definidos para este período. Crie um ou copie do mês anterior.
           </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Orçamento" : "Novo Orçamento"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
            <select 
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              disabled={!!editingId}
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