import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Truck, MessageCircle, Copy, Mail } from 'lucide-react';
import { Supplier, Category } from '../types';
import { Modal } from './ui/Modal';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

interface SuppliersProps {
  suppliers: Supplier[];
  categories: Category[];
  onAdd: (s: Supplier) => void;
  onEdit: (s: Supplier) => void;
  onDelete: (id: string) => void;
}

export const Suppliers: React.FC<SuppliersProps> = ({ suppliers, categories, onAdd, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cnpjError, setCnpjError] = useState<string | null>(null);

  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    cnpj: '',
    email: '',
    whatsapp: '',
    pixKey: '',
    pixType: 'CNPJ',
    categoryId: '',
    description: ''
  });

  const filteredSuppliers = suppliers
    .filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(s => filterCategory ? s.categoryId === filterCategory : true)
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleOpenModal = (s?: Supplier) => {
    if (s) {
      setEditingId(s.id);
      setFormData(s);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        cnpj: '',
        email: '',
        whatsapp: '',
        pixKey: '',
        pixType: 'CNPJ',
        categoryId: categories[0]?.id || '',
        description: ''
      });
    }
    setCnpjError(null);
    setIsModalOpen(true);
  };

  const handleCnpjBlur = () => {
    if (!formData.cnpj) {
      setCnpjError(null);
      return;
    }
    const digits = formData.cnpj.replace(/\D/g, '');
    if (digits.length !== 14) {
      setCnpjError('O CNPJ deve ter exatamente 14 dígitos.');
    } else {
      setCnpjError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cnpjError) {
      showToast('Por favor, corrija os erros no formulário antes de salvar.', 'error');
      return;
    }
    if (editingId) {
      onEdit({ ...formData, id: editingId } as Supplier);
      showToast('Fornecedor atualizado.', 'success');
    } else {
      onAdd({ ...formData, id: crypto.randomUUID() } as Supplier);
      showToast('Fornecedor adicionado.', 'success');
    }
    setIsModalOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copiado para a área de transferência!', 'success');
  };

  const formatWhatsApp = (number: string) => {
    return number.replace(/\D/g, '');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
           <Truck className="text-brand-600 dark:text-brand-400" size={24} />
           <h2 className="text-xl font-bold text-gray-800 dark:text-white">Fornecedores</h2>
        </div>
        
        <div className="flex flex-1 w-full md:w-auto gap-2 md:justify-end">
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar fornecedor..." 
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm dark:text-white p-2"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Todas Categorias</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => {
          const category = categories.find(c => c.id === supplier.categoryId);
          
          return (
            <div key={supplier.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                   <div>
                     <h3 className="font-bold text-gray-900 dark:text-white text-lg">{supplier.name}</h3>
                     <p className="text-xs text-gray-500 dark:text-gray-400">CNPJ: {supplier.cnpj || 'Não informado'}</p>
                   </div>
                   <span 
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: category ? `${category.color}20` : '#eee', color: category ? category.color : '#666' }}
                    >
                      {category?.name || 'Geral'}
                    </span>
                </div>

                <div className="space-y-2 mb-4">
                  {supplier.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{supplier.description}</p>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                   {supplier.email && (
                     <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                       <Mail size={14} className="text-gray-400" />
                       <a href={`mailto:${supplier.email}`} className="hover:text-brand-600 truncate">{supplier.email}</a>
                     </div>
                   )}
                   {supplier.pixKey && (
                     <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-dashed border-gray-200 dark:border-gray-600">
                       <span className="text-xs font-bold text-brand-600 dark:text-brand-400">PIX:</span>
                       <span className="flex-1 truncate font-mono text-xs">{supplier.pixKey}</span>
                       <button onClick={() => copyToClipboard(supplier.pixKey)} title="Copiar PIX" className="text-gray-400 hover:text-brand-500">
                         <Copy size={14} />
                       </button>
                     </div>
                   )}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 p-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-b-lg">
                 <div className="flex gap-2">
                    {supplier.whatsapp && (
                      <a 
                        href={`https://wa.me/55${formatWhatsApp(supplier.whatsapp)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                    )}
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(supplier)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-blue-900/20">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => confirm({
                      message: 'Tem certeza que deseja excluir este fornecedor?',
                      onConfirm: () => {
                        onDelete(supplier.id);
                        showToast('Fornecedor excluído com sucesso.', 'success');
                      }
                    })} className="p-1.5 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/20">
                      <Trash2 size={16} />
                    </button>
                 </div>
              </div>
            </div>
          );
        })}
        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            Nenhum fornecedor encontrado.
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome / Empresa</label>
            <input 
              required
              type="text" 
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
              <input 
                type="text" 
                placeholder="00.000.000/0000-00"
                className={`w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white ${cnpjError ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                value={formData.cnpj}
                onChange={e => {
                  setFormData({...formData, cnpj: e.target.value});
                  if (cnpjError) setCnpjError(null);
                }}
                onBlur={handleCnpjBlur}
              />
              {cnpjError && <p className="text-red-500 text-xs mt-1">{cnpjError}</p>}
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
              <select 
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                value={formData.categoryId}
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
              >
                <option value="">Selecione...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp</label>
               <input 
                 type="tel" 
                 placeholder="(11) 99999-9999"
                 className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                 value={formData.whatsapp}
                 onChange={e => setFormData({...formData, whatsapp: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
               <input 
                 type="email" 
                 className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                 value={formData.email}
                 onChange={e => setFormData({...formData, email: e.target.value})}
               />
             </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Dados Bancários / PIX</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                 <label className="block text-xs text-gray-500 mb-1">Tipo Chave</label>
                 <select 
                   className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                   value={formData.pixType}
                   onChange={e => setFormData({...formData, pixType: e.target.value as any})}
                 >
                   <option value="CNPJ">CNPJ</option>
                   <option value="CPF">CPF</option>
                   <option value="EMAIL">Email</option>
                   <option value="TELEFONE">Telefone</option>
                   <option value="ALEATORIA">Aleatória</option>
                 </select>
              </div>
              <div className="col-span-2">
                 <label className="block text-xs text-gray-500 mb-1">Chave PIX</label>
                 <input 
                  type="text" 
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                  value={formData.pixKey}
                  onChange={e => setFormData({...formData, pixKey: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição / Observações</label>
             <textarea 
               rows={3}
               className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white resize-none"
               value={formData.description}
               onChange={e => setFormData({...formData, description: e.target.value})}
             />
          </div>

          <button type="submit" disabled={!!cnpjError} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-md transition-colors mt-4">
            Salvar Fornecedor
          </button>
        </form>
      </Modal>
    </div>
  );
};