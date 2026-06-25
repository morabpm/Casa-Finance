import React, { useState, useMemo } from 'react';
import { Download, BarChart2, PieChart, Calendar } from 'lucide-react';
import { AppData } from '../types';
import { calculateTotals, getMonthName, formatCurrency } from '../utils';

interface ReportsProps {
  data: AppData;
}

type TabType = 'cashflow' | 'categories' | 'fixed';

export const Reports: React.FC<ReportsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<TabType>('cashflow');
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState(currentMonth);

  // Tab 1: Fluxo de Caixa
  const cashflowRows = useMemo(() => {
    let accumulated = 0;
    const rows = [];
    let totalIncome = 0;
    let totalExpense = 0;
    let totalBalance = 0;

    for (let i = 0; i < 12; i++) {
      const totals = calculateTotals(data.transactions, i, filterYear);
      accumulated += totals.balance;
      rows.push({
        name: getMonthName(i),
        income: totals.income,
        expense: totals.expense,
        balance: totals.balance,
        accumulated: accumulated
      });
      totalIncome += totals.income;
      totalExpense += totals.expense;
      totalBalance += totals.balance;
    }
    return { rows, totalIncome, totalExpense, totalBalance, finalAccumulated: accumulated };
  }, [data.transactions, filterYear]);

  const exportCSV = () => {
    const csvContent = [
      ['Mês','Receitas','Despesas','Saldo','Acumulado'].join(','),
      ...cashflowRows.rows.map(r => [r.name, r.income, r.expense, r.balance, r.accumulated].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fluxo-caixa-${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tab 2: Por Categoria
  const categoryRows = useMemo(() => {
    const expenses = data.transactions.filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    });

    let totalExpenseInMonth = 0;
    const grouped: Record<string, { total: number; type: 'RECEITA' | 'DESPESA', cat: any }> = {};

    expenses.forEach(t => {
      if (t.type === 'DESPESA') totalExpenseInMonth += t.amount;
      const cat = data.categories.find(c => c.id === t.category);
      if (cat) {
        if (!grouped[cat.id]) {
          grouped[cat.id] = { total: 0, type: t.type, cat };
        }
        grouped[cat.id].total += t.amount;
      }
    });

    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .map(item => ({
        ...item,
        pct: item.type === 'DESPESA' && totalExpenseInMonth > 0 ? (item.total / totalExpenseInMonth) * 100 : 0
      }));
  }, [data.transactions, data.categories, filterMonth, filterYear]);

  // Tab 3: Gastos Fixos
  const fixedRows = useMemo(() => {
    const fixedCats = data.categories.filter(c => c.fixed && c.type === 'DESPESA');
    
    return fixedCats.map(cat => {
      const realSpent = data.transactions
        .filter(t => {
          const d = new Date(t.date + 'T12:00:00');
          return t.category === cat.id && d.getMonth() === filterMonth && d.getFullYear() === filterYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const budget = data.budgets.find(b => b.category === cat.id && b.month === filterMonth && b.year === filterYear);
      const budgetAmount = budget ? budget.amount : null;

      const pct = budgetAmount ? Math.min((realSpent / budgetAmount) * 100, 100) : 0;
      
      return {
        cat,
        realSpent,
        budgetAmount,
        pct
      };
    }).sort((a, b) => b.realSpent - a.realSpent);
  }, [data.categories, data.transactions, data.budgets, filterMonth, filterYear]);


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Relatórios</h2>
        
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-md">
          <button 
            onClick={() => setActiveTab('cashflow')}
            className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${activeTab === 'cashflow' ? 'bg-white dark:bg-gray-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <BarChart2 size={16} /> <span className="hidden sm:inline">Fluxo de Caixa</span>
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${activeTab === 'categories' ? 'bg-white dark:bg-gray-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <PieChart size={16} /> <span className="hidden sm:inline">Por Categoria</span>
          </button>
          <button 
            onClick={() => setActiveTab('fixed')}
            className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${activeTab === 'fixed' ? 'bg-white dark:bg-gray-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <Calendar size={16} /> <span className="hidden sm:inline">Gastos Fixos</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header de Filtros */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-2">
            {activeTab !== 'cashflow' && (
              <select 
                className="form-select rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm text-sm"
                value={filterMonth}
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>{getMonthName(i)}</option>
                ))}
              </select>
            )}
            <select 
              className="form-select rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm text-sm"
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          {activeTab === 'cashflow' && (
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm transition-colors"
            >
              <Download size={16} /> Exportar CSV
            </button>
          )}
        </div>

        {/* Tabelas Baseadas na Aba */}
        <div className="overflow-x-auto">
          {activeTab === 'cashflow' && (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700/80 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3">Mês</th>
                  <th className="px-6 py-3 text-right">Receitas</th>
                  <th className="px-6 py-3 text-right">Despesas</th>
                  <th className="px-6 py-3 text-right">Saldo do Mês</th>
                  <th className="px-6 py-3 text-right">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {cashflowRows.rows.map(row => (
                  <tr key={row.name} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{row.name}</td>
                    <td className="px-6 py-3 text-right text-emerald-600">{formatCurrency(row.income)}</td>
                    <td className="px-6 py-3 text-right text-rose-600">{formatCurrency(row.expense)}</td>
                    <td className={`px-6 py-3 text-right font-medium ${row.balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatCurrency(row.balance)}
                    </td>
                    <td className={`px-6 py-3 text-right font-medium ${row.accumulated < 0 ? 'text-rose-600' : 'text-blue-600 dark:text-blue-400'}`}>
                      {formatCurrency(row.accumulated)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-bold bg-gray-50 dark:bg-gray-700/80 border-t-2 border-gray-200 dark:border-gray-600">
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">Total do Ano</td>
                  <td className="px-6 py-4 text-right text-emerald-600">{formatCurrency(cashflowRows.totalIncome)}</td>
                  <td className="px-6 py-4 text-right text-rose-600">{formatCurrency(cashflowRows.totalExpense)}</td>
                  <td className={`px-6 py-4 text-right ${cashflowRows.totalBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(cashflowRows.totalBalance)}
                  </td>
                  <td className={`px-6 py-4 text-right ${cashflowRows.finalAccumulated < 0 ? 'text-rose-600' : 'text-blue-600 dark:text-blue-400'}`}>
                    {formatCurrency(cashflowRows.finalAccumulated)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          {activeTab === 'categories' && (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700/80 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3">Representatividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {categoryRows.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhum dado encontrado para o período.</td></tr>
                ) : categoryRows.map(row => (
                  <tr key={row.cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: row.cat.color }}></span>
                        {row.cat.name}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${row.type === 'RECEITA' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-right font-medium ${row.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(row.total)}
                    </td>
                    <td className="px-6 py-3">
                      {row.type === 'DESPESA' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-8">{row.pct.toFixed(1)}%</span>
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div style={{ width: `${row.pct}%`, backgroundColor: row.cat.color }} className="h-full rounded-full" />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'fixed' && (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700/80 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3">Categoria (Gasto Fixo)</th>
                  <th className="px-6 py-3 text-right">Realizado</th>
                  <th className="px-6 py-3 text-right">Orçamento</th>
                  <th className="px-6 py-3">Progresso do Orçamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {fixedRows.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhum gasto fixo cadastrado.</td></tr>
                ) : fixedRows.map(row => (
                  <tr key={row.cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: row.cat.color }}></span>
                        {row.cat.name}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(row.realSpent)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {row.budgetAmount !== null ? (
                        <span className="text-gray-600 dark:text-gray-400">{formatCurrency(row.budgetAmount)}</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Sem orçamento</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {row.budgetAmount !== null ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs w-8 ${row.pct > 100 ? 'text-rose-600 font-bold' : 'text-gray-500'}`}>{row.pct.toFixed(0)}%</span>
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${Math.min(row.pct, 100)}%`, backgroundColor: row.pct > 100 ? '#ef4444' : row.cat.color }} 
                              className="h-full rounded-full transition-all" 
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
