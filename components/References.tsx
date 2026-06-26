import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Save, X, DollarSign, Calendar, UserCheck } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

export interface ReferenceItem {
  id: string;
  inquilino: string;
  vencimento: string;
  valorAReceber: number;
}

const PRESET_REFERENCES: ReferenceItem[] = [
  { id: 'ref_1', inquilino: 'LUIZ EDUARDO (placa LUC9H30 FIAT)', vencimento: '5', valorAReceber: 200.00 },
  { id: 'ref_2', inquilino: 'RONEI (garagem)', vencimento: '7', valorAReceber: 170.00 },
  { id: 'ref_3', inquilino: 'MORELLI VEICULOS', vencimento: '10', valorAReceber: 4552.00 },
  { id: 'ref_4', inquilino: 'IGREJA EVANGÉLICA AMOR ÁGAPE', vencimento: '12', valorAReceber: 7100.00 },
  { id: 'ref_5', inquilino: 'ISAIAS (impressoras)', vencimento: '20 a 25', valorAReceber: 1160.00 },
  { id: 'ref_6', inquilino: 'ELIANE PEREIRA SILVA (mulher pastor espaço + 2 garagens)', vencimento: '25', valorAReceber: 1450.00 },
  { id: 'ref_7', inquilino: 'CASA MACHADO ASSIS', vencimento: '10', valorAReceber: 2934.00 }
];

const LOCAL_STORAGE_KEY = 'casa_finance_references_user_sucesso';

export const References: React.FC = () => {
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const [items, setItems] = useState<ReferenceItem[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading references', e);
    }
    return [...PRESET_REFERENCES];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);

  // Form State
  const [inquilino, setInquilino] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [valorAReceber, setValorAReceber] = useState<string>('');

  // Persist whenever items change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const openAddModal = () => {
    setEditingItem(null);
    setInquilino('');
    setVencimento('');
    setValorAReceber('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ReferenceItem) => {
    setEditingItem(item);
    setInquilino(item.inquilino);
    setVencimento(item.vencimento);
    setValorAReceber(item.valorAReceber.toString());
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquilino.trim()) {
      showToast('O nome do inquilino é obrigatório', 'error');
      return;
    }
    if (!vencimento.trim()) {
      showToast('O vencimento é obrigatório', 'error');
      return;
    }
    const parsedValue = parseFloat(valorAReceber);
    if (isNaN(parsedValue) || parsedValue < 0) {
      showToast('Por favor, informe um valor a receber válido', 'error');
      return;
    }

    if (editingItem) {
      // Edit mode
      setItems(prev => prev.map(item => item.id === editingItem.id ? {
        ...item,
        inquilino: inquilino.trim(),
        vencimento: vencimento.trim(),
        valorAReceber: parsedValue
      } : item));
      showToast('Referência atualizada com sucesso!', 'success');
    } else {
      // Create mode
      const newItem: ReferenceItem = {
        id: `ref_${Date.now()}`,
        inquilino: inquilino.trim(),
        vencimento: vencimento.trim(),
        valorAReceber: parsedValue
      };
      setItems(prev => [...prev, newItem]);
      showToast('Referência adicionada com sucesso!', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    confirm({
      message: `Deseja realmente excluir a referência do inquilino "${name}"?`,
      onConfirm: () => {
        setItems(prev => prev.filter(item => item.id !== id));
        showToast('Referência excluída com sucesso!', 'info');
      }
    });
  };

  const handleRestoreDefault = () => {
    confirm({
      message: 'Deseja restaurar as referências padrão exibidas no anexo original? Isso removerá as alterações atuais.',
      onConfirm: () => {
        setItems([...PRESET_REFERENCES]);
        showToast('Referências padrão restauradas com sucesso!', 'success');
      }
    });
  };

  const filteredItems = items.filter(item => 
    item.inquilino.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vencimento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReceber = filteredItems.reduce((acc, item) => acc + item.valorAReceber, 0);

  const formatCurrencyValue = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Referências Fixas</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Lista permanente de inquilinos e valores a receber (Salvos permanentemente independente de backup/restore).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRestoreDefault}
            className="px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
          >
            Padrões do Sistema
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} /> Nova Referência
          </button>
        </div>
      </div>

      {/* Search and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar inquilino ou vencimento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white transition-all shadow-sm"
          />
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Total das Referências</span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">
              {formatCurrencyValue(totalReceber)}
            </span>
          </div>
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Mobile scroll hint */}
      <p className="text-xs text-gray-400 dark:text-gray-500 block md:hidden text-right pr-1">
        * Deslize para o lado para ver a tabela completa ↔
      </p>

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700/80 overflow-hidden">
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-red-600 text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Inquilino</th>
                <th className="py-3 px-4 sm:px-6 text-center w-36">Vencimento</th>
                <th className="py-3 px-4 sm:px-6 text-right w-44">Valor a receber</th>
                <th className="py-3 px-4 sm:px-6 text-center w-28">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    <UserCheck size={40} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    Nenhuma referência encontrada.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base block">
                        {item.inquilino}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <Calendar size={12} />
                        Dia {item.vencimento}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <span className="font-mono font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                        {formatCurrencyValue(item.valorAReceber)}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          title="Editar"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.inquilino)}
                          title="Excluir"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50/80 dark:bg-gray-900/40 border-t border-gray-150 dark:border-gray-700">
                  <td colSpan={2} className="py-4 px-4 sm:px-6 text-right font-bold text-gray-500 dark:text-gray-400 text-sm">
                    TOTAL
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-base sm:text-lg">
                    {formatCurrencyValue(totalReceber)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-white/10 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {editingItem ? 'Editar Referência' : 'Nova Referência'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Inquilino
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: LUIZ EDUARDO (placa LUC9H30 FIAT)"
                  value={inquilino}
                  onChange={(e) => setInquilino(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none text-sm transition-all"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                    Vencimento
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 5 ou 20 a 25"
                    value={vencimento}
                    onChange={(e) => setVencimento(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                    Valor a Receber (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={valorAReceber}
                    onChange={(e) => setValorAReceber(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none text-sm font-mono transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 dark:border-gray-700/60 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-sm transition-all"
                >
                  <Save size={16} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
