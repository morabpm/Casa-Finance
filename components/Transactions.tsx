import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Paperclip, X, FileText, Download, Copy, Repeat, ChevronLeft, ChevronRight, LayoutList, LayoutGrid, Truck, StickyNote } from 'lucide-react';
import { Transaction, Category, TransactionType, TransactionStatus, Attachment, Supplier } from '../types';
import { formatDate, formatCurrency, getMonthName } from '../utils';
import { Modal } from './ui/Modal';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  suppliers: Supplier[];
  onAdd: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ transactions, categories, suppliers, onAdd, onEdit, onDelete }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'TODOS'>('TODOS');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attachmentDateFilter, setAttachmentDateFilter] = useState('');
  
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  // Form State
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: '',
    type: 'DESPESA',
    status: 'REALIZADO',
    attachments: [],
    notes: '',
    supplierId: ''
  });
  
  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringCount, setRecurringCount] = useState(2);

  // Filters Reset on Month/Year change
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterMonth(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterYear(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
      })
      .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(t => filterType ? t.type === filterType : true)
      .filter(t => filterStatus !== 'TODOS' ? t.status === filterStatus : true)
      .filter(t => filterCategory ? t.category === filterCategory : true)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterMonth, filterYear, searchTerm, filterType, filterStatus, filterCategory]);

  // Totals
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === 'RECEITA') acc.totalIncome += t.amount;
        else acc.totalExpense += t.amount;
        acc.balance = acc.totalIncome - acc.totalExpense;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0 }
    );
  }, [filteredTransactions]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleOpenModal = (t?: Transaction, isDuplicate: boolean = false) => {
    setAttachmentDateFilter('');
    setIsRecurring(false);
    setRecurringCount(2);

    if (t) {
      if (isDuplicate) {
        setEditingId(null);
        setFormData({
          ...t,
          description: `${t.description} (Cópia)`,
          date: new Date().toISOString().split('T')[0],
          attachments: [] 
        });
      } else {
        setEditingId(t.id);
        setFormData({ ...t, attachments: t.attachments || [] });
      }
    } else {
      setEditingId(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        category: categories[0]?.id || '',
        type: 'DESPESA',
        status: 'REALIZADO',
        attachments: [],
        notes: '',
        supplierId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      onEdit({ ...formData, id: editingId } as Transaction);
      showToast('Transação atualizada.', 'success');
    } else {
      const baseTransaction = { ...formData };
      
      if (isRecurring && recurringCount > 1) {
        const baseDate = new Date((baseTransaction.date as string) + 'T12:00:00');
        for (let i = 0; i < recurringCount; i++) {
          const newDate = new Date(baseDate);
          newDate.setMonth(baseDate.getMonth() + i);
          
          const t: Transaction = {
            ...(baseTransaction as Transaction),
            id: crypto.randomUUID(),
            date: newDate.toISOString().split('T')[0],
            status: i === 0 ? (baseTransaction.status as TransactionStatus) : 'PLANEJADO'
          };
          onAdd(t);
        }
        showToast(`${recurringCount} transações adicionadas.`, 'success');
      } else {
        onAdd({ ...formData, id: crypto.randomUUID() } as Transaction);
        showToast('Transação adicionada.', 'success');
      }
    }
    setIsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const MAX_SIZE = 1024 * 1024; // 1MB

      const validFiles = files.filter(file => {
        if (file.size > MAX_SIZE) {
          showToast(`O arquivo "${file.name}" excede o limite de 1MB e será ignorado.`, 'error');
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      const fileReaders = validFiles.map(file => {
        return new Promise<Attachment>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              resolve({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: file.type,
                size: file.size,
                url: event.target.result as string,
                uploadedAt: new Date().toISOString()
              });
            }
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(fileReaders).then(newAttachments => {
        setFormData(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), ...newAttachments]
        }));
      });
      
      // Reset input value to allow selecting the same file again if needed
      e.target.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter(a => a.id !== id)
    }));
  };

  const getFileDate = (att: Attachment) => {
    if (att.uploadedAt) return new Date(att.uploadedAt);
    // Fallback: extract timestamp from ID (format: timestamp-random)
    const ts = parseInt(att.id.split('-')[0]);
    return !isNaN(ts) ? new Date(ts) : new Date();
  };

  const visibleAttachments = (formData.attachments || []).filter(att => {
    if (!attachmentDateFilter) return true;
    const date = getFileDate(att).toISOString().split('T')[0];
    return date === attachmentDateFilter;
  });

  // Helper to get category color/name
  const getCatDetails = (id: string) => categories.find(c => c.id === id) || { name: 'Unknown', color: '#9ca3af' };
  const getSupplierName = (id?: string) => suppliers.find(s => s.id === id)?.name;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Lançamentos</h2>
        
        <div className="flex flex-wrap items-center gap-2">
          <select 
            className="rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm dark:text-white p-2"
            value={filterMonth}
            onChange={handleMonthChange}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{getMonthName(i)}</option>
            ))}
          </select>
          <select 
            className="rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm dark:text-white p-2"
            value={filterYear}
            onChange={handleYearChange}
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors ml-auto md:ml-2"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Novo</span>
          </button>
          
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-md ml-2">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-sm transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              title="Modo Tabela"
            >
              <LayoutList size={16} />
            </button>
            <button 
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded text-sm transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              title="Modo Cards"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white shadow-sm"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <select 
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm dark:text-white p-2 shadow-sm"
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value as any); setCurrentPage(1); }}
        >
          <option value="">Tipo (Todos)</option>
          <option value="RECEITA">Receitas</option>
          <option value="DESPESA">Despesas</option>
        </select>
        <select 
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm dark:text-white p-2 shadow-sm"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as any); setCurrentPage(1); }}
        >
          <option value="TODOS">Status (Todos)</option>
          <option value="REALIZADO">Realizado</option>
          <option value="PLANEJADO">Planejado</option>
        </select>
        <select 
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm dark:text-white p-2 shadow-sm"
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
        >
          <option value="">Categoria (Todas)</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Totals Summary */}
      <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-[150px]">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Receitas (Filtro)</p>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="flex-1 min-w-[150px]">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Despesas (Filtro)</p>
          <p className="text-lg font-bold text-rose-600">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="flex-1 min-w-[150px]">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Saldo (Filtro)</p>
          <p className={`text-lg font-bold ${balance >= 0 ? 'text-brand-600' : 'text-rose-600'}`}>{formatCurrency(balance)}</p>
        </div>
      </div>

      {/* List View (Table or Cards) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Descrição</th>
                  <th className="px-6 py-3">Fornecedor</th>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map(t => {
                    const cat = getCatDetails(t.category);
                    const supplierName = getSupplierName(t.supplierId);
                    return (
                      <tr key={t.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(t.date)}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[200px]" title={t.description}>{t.description}</span>
                            {t.notes && (
                              <StickyNote size={14} className="text-gray-400" title={t.notes} />
                            )}
                            {t.attachments && t.attachments.length > 0 && (
                              <div className="flex items-center text-gray-400 dark:text-gray-500" title={`${t.attachments.length} arquivo(s) anexado(s)`}>
                                 <Paperclip size={14} />
                                 {t.attachments.length > 1 && <span className="text-[10px] font-bold ml-0.5">{t.attachments.length}</span>}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {supplierName ? (
                            <div className="flex items-center gap-1" title={supplierName}>
                              <Truck size={14} />
                              <span className="truncate max-w-[100px] text-xs">{supplierName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            {cat.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            t.status === 'REALIZADO' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {t.status === 'REALIZADO' ? 'Realizado' : 'Planejado'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 font-bold ${t.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'RECEITA' ? '+' : '-'} {formatCurrency(t.amount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleOpenModal(t, true)} className="text-gray-500 hover:text-brand-600 p-1" title="Duplicar">
                              <Copy size={16} />
                            </button>
                            <button onClick={() => handleOpenModal(t)} className="text-blue-500 hover:text-blue-700 p-1" title="Editar">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => confirm({
                              message: 'Tem certeza que deseja excluir este lançamento?',
                              onConfirm: () => {
                                onDelete(t.id);
                                showToast('Lançamento excluído com sucesso.', 'success');
                              }
                            })} className="text-red-500 hover:text-red-700 p-1" title="Excluir">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50">
            {paginatedTransactions.length === 0 ? (
              <div className="col-span-1 sm:col-span-2 py-8 text-center text-gray-500">
                Nenhum lançamento encontrado.
              </div>
            ) : (
              paginatedTransactions.map(t => {
                const cat = getCatDetails(t.category);
                const supplierName = getSupplierName(t.supplierId);
                return (
                  <div key={t.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{formatDate(t.date)}</span>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{t.description}</h3>
                          {t.notes && <StickyNote size={14} className="text-gray-400 shrink-0" title={t.notes} />}
                        </div>
                        {supplierName && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1" title={supplierName}>
                            <Truck size={12} />
                            <span className="truncate">{supplierName}</span>
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        t.status === 'REALIZADO' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {t.status === 'REALIZADO' ? 'Realizado' : 'Planejado'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-end mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        {cat.name}
                      </span>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`font-bold ${t.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'RECEITA' ? '+' : '-'} {formatCurrency(t.amount)}
                        </span>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleOpenModal(t, true)} className="text-gray-400 hover:text-brand-600 p-1" title="Duplicar">
                            <Copy size={14} />
                          </button>
                          <button onClick={() => handleOpenModal(t)} className="text-gray-400 hover:text-blue-600 p-1" title="Editar">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => confirm({
                            message: 'Tem certeza que deseja excluir este lançamento?',
                            onConfirm: () => {
                              onDelete(t.id);
                              showToast('Lançamento excluído com sucesso.', 'success');
                            }
                          })} className="text-gray-400 hover:text-red-600 p-1" title="Excluir">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Transação' : 'Nova Transação'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
            <input 
              required
              type="text" 
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
              <input 
                required
                type="number" 
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
              <input 
                required
                type="date" 
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
              <select 
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                value={formData.category}
                onChange={e => {
                  const catId = e.target.value;
                  const cat = categories.find(c => c.id === catId);
                  setFormData({
                    ...formData, 
                    category: catId,
                    type: cat ? cat.type : 'DESPESA' // Auto-switch type based on category
                  });
                }}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
               <select 
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as TransactionStatus})}
              >
                <option value="REALIZADO">Realizado</option>
                <option value="PLANEJADO">Planejado</option>
              </select>
            </div>
          </div>
          
          {formData.type === 'DESPESA' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fornecedor (Opcional)</label>
              <select 
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                value={formData.supplierId || ''}
                onChange={e => {
                  const supplierId = e.target.value;
                  const updates: Partial<Transaction> = { supplierId };
                  const sup = suppliers.find(s => s.id === supplierId);
                  if (sup && !formData.description) {
                    updates.description = sup.name;
                  }
                  setFormData(prev => ({ ...prev, ...updates }));
                }}
              >
                <option value="">Nenhum</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações (Opcional)</label>
            <textarea 
              rows={3}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white resize-none"
              placeholder="Adicione notas adicionais aqui..."
              value={formData.notes || ''}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          {/* Recurring Option (Only for new transactions) */}
          {!editingId && (
            <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-md border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="checkbox" 
                  id="recurring"
                  checked={isRecurring}
                  onChange={e => setIsRecurring(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Repeat size={14} /> Repetir lançamento
                </label>
              </div>
              
              {isRecurring && (
                <div className="flex items-center gap-2 mt-2 animate-in slide-in-from-top-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Repetir por</span>
                  <input 
                    type="number" 
                    min="2" 
                    max="60" 
                    value={recurringCount}
                    onChange={e => setRecurringCount(parseInt(e.target.value))}
                    className="w-16 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1 text-sm text-center"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">meses (mensalmente)</span>
                </div>
              )}
            </div>
          )}

          {/* Attachments Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comprovantes / Anexos</label>
              {/* Filter Controls */}
              {(formData.attachments?.length || 0) > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                  <input 
                    type="date" 
                    value={attachmentDateFilter}
                    onChange={(e) => setAttachmentDateFilter(e.target.value)}
                    className="text-xs p-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-brand-500"
                    title="Filtrar por data"
                  />
                  {attachmentDateFilter && (
                    <button 
                      type="button" 
                      onClick={() => setAttachmentDateFilter('')}
                      className="text-xs text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
               {visibleAttachments.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {visibleAttachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                         <div className="p-1.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-500 dark:text-gray-300">
                           <FileText size={16} />
                         </div>
                         <div className="flex flex-col min-w-0">
                           <span className="text-sm truncate dark:text-gray-200 font-medium">{att.name}</span>
                           <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                             <span>{(att.size / 1024).toFixed(1)} KB</span>
                             <span>•</span>
                             <span>{formatDate(getFileDate(att).toISOString().split('T')[0])}</span>
                           </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-1">
                         <a 
                           href={att.url} 
                           download={att.name}
                           className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                           title="Baixar"
                         >
                           <Download size={16} />
                         </a>
                         <button 
                           type="button" 
                           onClick={() => removeAttachment(att.id)} 
                           className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                           title="Remover"
                         >
                           <X size={16} />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
               ) : (formData.attachments?.length || 0) > 0 ? (
                 <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 rounded border border-dashed border-gray-200 dark:border-gray-700">
                   Nenhum anexo encontrado nesta data.
                 </div>
               ) : null}

              <div className="flex">
                <label className="cursor-pointer bg-white dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-4 py-3 rounded-md text-sm flex items-center justify-center gap-2 transition-all w-full group">
                  <Paperclip size={18} className="group-hover:text-brand-500" /> 
                  <span className="group-hover:text-brand-600">Adicionar anexo (Múltiplos)</span>
                  <input type="file" className="hidden" multiple onChange={handleFileChange} />
                </label>
              </div>
            </div>
          </div>
          
          <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 rounded-md transition-colors mt-4">
            Salvar
          </button>
        </form>
      </Modal>
    </div>
  );
};