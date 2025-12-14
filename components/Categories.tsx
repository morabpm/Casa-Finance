import React, { useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { Category, TransactionType } from '../types';
import { generateId } from '../utils';
import { Modal } from './ui/Modal';

interface CategoriesProps {
  categories: Category[];
  onAdd: (c: Category) => void;
  onDelete: (id: number) => void;
}

export const Categories: React.FC<CategoriesProps> = ({ categories, onAdd, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    type: 'DESPESA',
    color: '#3b82f6',
    fixed: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ 
      ...formData as Category, 
      id: generateId(categories.map(c => ({ id: c.id }))) 
    });
    setIsModalOpen(false);
    setFormData({ name: '', type: 'DESPESA', color: '#3b82f6', fixed: false });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gerenciar Categorias</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={18} /> Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-gray-200 dark:border-gray-700 relative group" style={{ borderLeftColor: cat.color }}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Tag size={16} style={{ color: cat.color }} />
                <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
              </div>
              <button onClick={() => onDelete(cat.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex gap-2">
              <span className={`px-2 py-0.5 rounded-full ${cat.type === 'RECEITA' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} bg-opacity-30`}>
                {cat.type === 'RECEITA' ? 'Receita' : 'Despesa'}
              </span>
              {cat.fixed && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Fixa</span>}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Categoria">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select 
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
              >
                <option value="DESPESA">Despesa</option>
                <option value="RECEITA">Receita</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor</label>
              <input 
                type="color" 
                className="w-full h-10 rounded-md cursor-pointer"
                value={formData.color}
                onChange={e => setFormData({...formData, color: e.target.value})}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="fixed"
              checked={formData.fixed}
              onChange={e => setFormData({...formData, fixed: e.target.checked})}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="fixed" className="text-sm text-gray-700 dark:text-gray-300">Despesa/Receita Fixa?</label>
          </div>
          <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 rounded-md">Salvar</button>
        </form>
      </Modal>
    </div>
  );
};