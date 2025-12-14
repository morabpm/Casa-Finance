import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Paperclip, X, FileText, Download, Calendar } from 'lucide-react';
import { Transaction, Category, TransactionType, TransactionStatus, Attachment } from '../types';
import { formatDate, formatCurrency, generateId } from '../utils';
import { Modal } from './ui/Modal';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onAdd: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: number) => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ transactions, categories, onAdd, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [attachmentDateFilter, setAttachmentDateFilter] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: 0,
    type: 'DESPESA',
    status: 'REALIZADO',
    attachments: []
  });

  const filteredTransactions = transactions
    .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(t => filterType ? t.type === filterType : true)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenModal = (t?: Transaction) => {
    setAttachmentDateFilter('');
    if (t) {
      setEditingId(t.id);
      setFormData({ ...t, attachments: t.attachments || [] });
    } else {
      setEditingId(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        category: categories[0]?.id || 0,
        type: 'DESPESA',
        status: 'REALIZADO',
        attachments: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEdit({ ...formData, id: editingId } as Transaction);
    } else {
      onAdd({ ...formData, id: generateId(transactions.map(t => ({ id: t.id }))) } as Transaction);
    }
    setIsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const MAX_SIZE = 1024 * 1024; // 1MB

      const validFiles = files.filter(file => {
        if (file.size > MAX_SIZE) {
          alert(`O arquivo "${file.name}" excede o limite de 1MB e será ignorado.`);
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
  const getCatDetails = (id: number) => categories.find(c => c.id === id) || { name: 'Unknown', color: '#9ca3af' };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Lançamentos</h2>
        
        <div className="flex flex-1 w-full md:w-auto gap-2 md:justify-end">
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm dark:text-white p-2"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="">Todos</option>
            <option value="RECEITA">Receitas</option>
            <option value="DESPESA">Despesas</option>
          </select>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const cat = getCatDetails(t.category);
                  return (
                    <tr key={t.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px]" title={t.description}>{t.description}</span>
                          {t.attachments && t.attachments.length > 0 && (
                            <div className="flex items-center text-gray-400 dark:text-gray-500" title={`${t.attachments.length} arquivo(s) anexado(s)`}>
                               <Paperclip size={14} />
                               {t.attachments.length > 1 && <span className="text-[10px] font-bold ml-0.5">{t.attachments.length}</span>}
                            </div>
                          )}
                        </div>
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
                          <button onClick={() => handleOpenModal(t)} className="text-blue-500 hover:text-blue-700 p-1">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => onDelete(t.id)} className="text-red-500 hover:text-red-700 p-1">
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
                  const catId = parseInt(e.target.value);
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