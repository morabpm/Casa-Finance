import React from 'react';
import { ArrowUp, ArrowDown, DollarSign, Activity, Percent } from 'lucide-react';
import { formatCurrency } from '../../utils';

interface StatCardProps {
  title: string;
  value: number | string;
  type: 'income' | 'expense' | 'balance' | 'total' | 'savings';
  comparison?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, type, comparison }) => {
  let icon = <Activity className="w-6 h-6" />;
  let colorClass = 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
  let valueColor = 'text-gray-900 dark:text-white';

  if (type === 'income') {
    icon = <ArrowUp className="w-6 h-6" />;
    colorClass = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
    valueColor = 'text-emerald-600 dark:text-emerald-400';
  } else if (type === 'expense') {
    icon = <ArrowDown className="w-6 h-6" />;
    colorClass = 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
    valueColor = 'text-rose-600 dark:text-rose-400';
  } else if (type === 'balance') {
    icon = <DollarSign className="w-6 h-6" />;
    const numValue = typeof value === 'number' ? value : 0;
    colorClass = numValue >= 0 
      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    valueColor = numValue >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400';
  } else if (type === 'savings') {
    icon = <Percent className="w-6 h-6" />;
    colorClass = 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
    valueColor = 'text-purple-600 dark:text-purple-400';
  }

  const displayValue = type === 'savings' ? value : formatCurrency(Number(value));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-transform hover:-translate-y-1 duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className={`text-2xl font-bold ${valueColor}`}>{displayValue}</h3>
          {comparison !== undefined && (
            <div className="flex items-center mt-2 text-xs">
              <span className={comparison >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                {comparison >= 0 ? '+' : ''}{formatCurrency(comparison)}
              </span>
              <span className="text-gray-400 ml-1">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};