import React, { useState } from 'react';
import { Target, Plus, Edit2, Trash2, Coins } from 'lucide-react';
import { Goal } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Modal } from './ui/Modal';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

interface GoalsProps {
  goals: Goal[];
  onAdd: (g: Goal) => void;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
}

export const Goals: React.FC<GoalsProps> = ({ goals, onAdd, onEdit, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Goal>>({
    name: '',
    icon: '🎯',
    targetAmount: 0,
    currentAmount: 0,
    deadline: new Date().toISOString().split('T')[0],
    color: '#3b82f6'
  });
  
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');

  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const handleOpenModal = (goal?: Goal) => {
    if (goal) {
      setEditingId(goal.id);
      setFormData(goal);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        icon: '🎯',
        targetAmount: 0,
        currentAmount: 0,
        deadline: new Date().toISOString().split('T')[0],
        color: '#3b82f6'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEdit(formData as Goal);
      showToast('Meta atualizada com sucesso.', 'success');
    } else {
      onAdd({ ...formData, id: crypto.randomUUID() } as Goal);
      showToast('Meta criada com sucesso.', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (goal: Goal) => {
    confirm({
      message: `Tem certeza que deseja excluir a meta "${goal.name}"?`,
      onConfirm: () => {
        onDelete(goal.id);
        showToast('Meta excluída com sucesso.', 'success');
      }
    });
  };

  const handleOpenDeposit = (goal: Goal) => {
    setDepositGoal(goal);
    setDepositAmount('');
    setIsDepositModalOpen(true);
  };

  const handleSaveDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depositGoal) {
      const amount = parseFloat(depositAmount);
      if (!isNaN(amount) && amount > 0) {
        onEdit({ ...depositGoal, currentAmount: depositGoal.currentAmount + amount });
        showToast('Aporte adicionado com sucesso.', 'success');
        setIsDepositModalOpen(false);
      } else {
        showToast('Informe um valor válido para o aporte.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Metas Financeiras</h2>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> <span className="hidden sm:inline">Nova Meta</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Target size={48} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Defina sua primeira meta financeira</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Acompanhe o progresso dos seus objetivos, como viagens, compra de um veículo ou reserva de emergência.
          </p>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-md font-medium transition-colors shadow-sm"
          >
            Criar Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => {
            const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const daysLeft = Math.ceil((new Date(goal.deadline + 'T12:00:00').getTime() - Date.now()) / 86400000);
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const isExpired = !isCompleted && daysLeft <= 0;

            return (
              <div 
                key={goal.id} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
                style={{ borderLeft: `6px solid ${goal.color}` }}
              >
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl" title="Ícone da meta">{goal.icon}</span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{goal.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {isCompleted ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold">
                                Concluída ✓
                              </span>
                              <div className="flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          ) : isExpired ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-semibold">
                              Vencida
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {daysLeft} dias restantes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleOpenModal(goal)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded transition-colors" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(goal)} className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Progresso</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {formatCurrency(goal.currentAmount)}
                          <span className="text-xs text-gray-500 font-normal ml-1">/ {formatCurrency(goal.targetAmount)}</span>
                        </p>
                      </div>
                      <span className="font-bold text-lg" style={{ color: goal.color }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: goal.color }}
                      />
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <button 
                    onClick={() => handleOpenDeposit(goal)}
                    disabled={isCompleted}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      isCompleted 
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20'
                    }`}
                  >
                    <Coins size={16} /> Adicionar Aporte
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Meta" : "Nova Meta"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ícone</label>
              <input 
                type="text" 
                required 
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white text-center"
                placeholder="🎯"
                value={formData.icon || ''}
                onChange={e => setFormData({...formData, icon: e.target.value})}
                maxLength={2}
              />
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Meta</label>
              <input 
                type="text" 
                required 
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                placeholder="Ex: Viagem, Carro, Reserva..."
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Alvo (R$)</label>
              <input 
                type="number" 
                required 
                min="0"
                step="0.01"
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                value={formData.targetAmount || ''}
                onChange={e => setFormData({...formData, targetAmount: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Atual (R$)</label>
              <input 
                type="number" 
                required 
                min="0"
                step="0.01"
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                value={formData.currentAmount || 0}
                onChange={e => setFormData({...formData, currentAmount: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prazo</label>
              <input 
                type="date" 
                required 
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
                value={formData.deadline || ''}
                onChange={e => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor</label>
              <input 
                type="color" 
                required 
                className="w-full h-[38px] p-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer"
                value={formData.color || '#3b82f6'}
                onChange={e => setFormData({...formData, color: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md transition-colors"
            >
              {editingId ? 'Salvar' : 'Criar Meta'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deposit Modal */}
      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title={`Aporte: ${depositGoal?.name}`}>
        <form onSubmit={handleSaveDeposit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor do Aporte (R$)</label>
            <input 
              type="number" 
              required 
              min="0.01"
              step="0.01"
              autoFocus
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm dark:text-white"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              placeholder="Ex: 150.00"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={() => setIsDepositModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md transition-colors"
            >
              Confirmar Aporte
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

