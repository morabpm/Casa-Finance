import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { AppData, DateFilter } from '../types';
import { calculateTotals, getMonthName, formatCurrency, formatDate } from '../utils';
import { StatCard } from './ui/Cards';

interface DashboardProps {
  data: AppData;
  filter: DateFilter;
  setFilter: (f: DateFilter) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, filter, setFilter }) => {
  const navigate = useNavigate();
  
  // Current Month Totals
  const currentTotals = useMemo(() => 
    calculateTotals(data.transactions, filter.month, filter.year), 
  [data.transactions, filter]);

  // Previous Month Totals for comparison
  const previousTotals = useMemo(() => {
    let prevMonth = filter.month - 1;
    let prevYear = filter.year;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    return calculateTotals(data.transactions, prevMonth, prevYear);
  }, [data.transactions, filter]);

  // Yearly Total
  const yearlyBalance = useMemo(() => {
    return data.transactions
      .filter(t => new Date(t.date).getFullYear() === filter.year)
      .reduce((acc, t) => acc + (t.type === 'RECEITA' ? t.amount : -t.amount), 0);
  }, [data.transactions, filter.year]);

  // Savings Rate
  const savingsRate = useMemo(() => {
    if (currentTotals.income === 0) return '—';
    const rate = ((currentTotals.income - currentTotals.expense) / currentTotals.income) * 100;
    return `${rate.toFixed(1)}%`;
  }, [currentTotals]);

  // Fixed vs Variable Expenses
  const expenseStats = useMemo(() => {
    const expenses = data.transactions.filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return t.type === 'DESPESA' && d.getMonth() === filter.month && d.getFullYear() === filter.year;
    });

    let fixed = 0;
    let variable = 0;

    expenses.forEach(t => {
      const cat = data.categories.find(c => c.id === t.category);
      if (cat?.fixed) fixed += t.amount;
      else variable += t.amount;
    });

    const total = fixed + variable;
    const fixedPct = total > 0 ? (fixed / total) * 100 : 0;
    const varPct = total > 0 ? (variable / total) * 100 : 0;

    return { fixed, variable, total, fixedPct, varPct };
  }, [data.transactions, data.categories, filter]);

  // Upcoming Bills (next 7 days)
  const upcomingBills = useMemo(() => {
    return data.transactions.filter(t => {
      if (t.status !== 'PLANEJADO') return false;
      const diff = (new Date(t.date + 'T12:00:00').getTime() - Date.now()) / 86400000;
      return diff >= 0 && diff <= 7;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [data.transactions]);

  // Last 5 Transactions for current month
  const lastTransactions = useMemo(() => {
    return data.transactions
      .filter(t => {
        const d = new Date(t.date + 'T12:00:00');
        return d.getMonth() === filter.month && d.getFullYear() === filter.year;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [data.transactions, filter]);

  // Chart Data: Monthly Evolution
  const trendData = useMemo(() => {
    const res = [];
    for (let i = 0; i < 12; i++) {
      const t = calculateTotals(data.transactions, i, filter.year);
      res.push({
        name: getMonthName(i).substring(0, 3),
        Receitas: t.income,
        Despesas: t.expense
      });
    }
    return res;
  }, [data.transactions, filter.year]);

  // Chart Data: Accumulated Balance
  const accumulatedData = useMemo(() => {
    let acc = 0;
    return Array.from({ length: 12 }).map((_, i) => {
      const t = calculateTotals(data.transactions, i, filter.year);
      acc += t.balance;
      return { name: getMonthName(i).substring(0, 3), 'Saldo Acumulado': acc };
    });
  }, [data.transactions, filter.year]);

  // Chart Data: Top Expenses by Category
  const expensePieData = useMemo(() => {
    const expenses = data.transactions.filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return t.type === 'DESPESA' && d.getMonth() === filter.month && d.getFullYear() === filter.year;
    });

    const grouped: Record<string, number> = {};
    expenses.forEach(t => {
      const cat = data.categories.find(c => c.id === t.category);
      if (cat) {
        grouped[cat.name] = (grouped[cat.name] || 0) + t.amount;
      }
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data.transactions, filter, data.categories]);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Visão Geral</h2>
        <div className="flex gap-2">
          <select 
            className="form-select rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50"
            value={filter.month}
            onChange={(e) => setFilter({ ...filter, month: parseInt(e.target.value) })}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>{getMonthName(i)}</option>
            ))}
          </select>
          <select 
            className="form-select rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-200 focus:ring-opacity-50"
            value={filter.year}
            onChange={(e) => setFilter({ ...filter, year: parseInt(e.target.value) })}
          >
            {[filter.year - 1, filter.year, filter.year + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Receitas" 
          value={currentTotals.income} 
          type="income" 
          comparison={currentTotals.income - previousTotals.income}
        />
        <StatCard 
          title="Despesas" 
          value={currentTotals.expense} 
          type="expense" 
          comparison={-(currentTotals.expense - previousTotals.expense)}
        />
        <StatCard 
          title="Saldo Mensal" 
          value={currentTotals.balance} 
          type="balance"
          comparison={currentTotals.balance - previousTotals.balance}
        />
        <StatCard 
          title="Acumulado Ano" 
          value={yearlyBalance} 
          type="total"
        />
        <StatCard 
          title="Taxa de Poupança" 
          value={savingsRate} 
          type="savings"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Despesas Fixas vs Variáveis */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Despesas Fixas vs Variáveis</h3>
          <div className="flex flex-col sm:flex-row justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fixas ({expenseStats.fixedPct.toFixed(0)}%)</p>
              <p className="font-semibold text-blue-600">{formatCurrency(expenseStats.fixed)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Variáveis ({expenseStats.varPct.toFixed(0)}%)</p>
              <p className="font-semibold text-orange-500">{formatCurrency(expenseStats.variable)}</p>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${expenseStats.fixedPct}%` }} />
            <div className="h-full bg-orange-500 transition-all" style={{ width: `${expenseStats.varPct}%` }} />
          </div>
        </div>

        {/* Goals Widget */}
        {data.goals && data.goals.length > 0 && (
          <div onClick={() => navigate('/goals')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Suas Metas</h3>
            <div className="space-y-4">
              {data.goals.slice(0, 3).map(g => {
                const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
                return (
                  <div key={g.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{g.icon} {g.name}</span>
                      <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        style={{ width: `${pct}%`, backgroundColor: g.color || '#3b82f6' }} 
                        className="h-full rounded-full transition-all" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Evolução Mensal (Receitas vs Despesas)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
                <Legend />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accumulated Balance Line Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Saldo Acumulado no Ano</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accumulatedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
                <Line type="monotone" dataKey="Saldo Acumulado" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Top 5 Despesas (Categorias)</h3>
          <div className="h-64 w-full">
            {expensePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                     formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Sem dados de despesas para este mês.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Bills & Last Transactions Container */}
        <div className="space-y-6">
          {/* Upcoming Bills */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Próximos Vencimentos (7 dias)</h3>
            {upcomingBills.length > 0 ? (
              <div className="space-y-3">
                {upcomingBills.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border-l-4" style={{ borderColor: t.type === 'RECEITA' ? '#10b981' : '#f43f5e' }}>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{t.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${t.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(t.amount)}
                      </p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        t.type === 'RECEITA' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {t.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-emerald-600 dark:text-emerald-400 py-4 font-medium flex items-center justify-center gap-2">
                Nenhum vencimento nos próximos 7 dias ✓
              </div>
            )}
          </div>

          {/* Last Transactions */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Últimas 5 Transações</h3>
            {lastTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                  <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Data</th>
                      <th className="px-4 py-2 font-semibold">Descrição</th>
                      <th className="px-4 py-2 font-semibold">Categoria</th>
                      <th className="px-4 py-2 font-semibold text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {lastTransactions.map(t => {
                      const cat = data.categories.find(c => c.id === t.category);
                      return (
                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDate(t.date)}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white truncate max-w-[120px]" title={t.description}>{t.description}</td>
                          <td className="px-4 py-3">
                            {cat && (
                              <span 
                                className="px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap" 
                                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                              >
                                {cat.name}
                              </span>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${t.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === 'RECEITA' ? '+' : '-'}{formatCurrency(t.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Nenhuma transação encontrada no mês filtrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
