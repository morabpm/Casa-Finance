import React, { useState } from 'react';
import { UploadCloud, Check, Trash2, AlertCircle, FileSpreadsheet, CheckSquare, Square, RefreshCw, HelpCircle } from 'lucide-react';
import { Transaction, Category, TransactionType, TransactionStatus } from '../types';
import { useToast } from '../context/ToastContext';

interface ImportSpreadsheetProps {
  categories: Category[];
  onAdd: (t: Transaction) => void;
  onSuccess: () => void;
}

interface ParsedItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string; // ID
  type: TransactionType;
  status: TransactionStatus;
  selected: boolean;
  isValid: boolean;
  originalValue: string;
  dueDay: string;
}

interface ColMapping {
  index: number;
  month: number; // 0-11
  year: number;
  label: string;
}

const MONTH_NAMES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export const ImportSpreadsheet: React.FC<ImportSpreadsheetProps> = ({ categories, onAdd, onSuccess }) => {
  const { showToast } = useToast();
  
  const [pasteText, setPasteText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [globalCategory, setGlobalCategory] = useState<string>('');
  const [step, setStep] = useState<1 | 2>(1);

  // Helper to parse due day
  const parseDueDay = (dayStr: string): number => {
    const clean = dayStr.replace(/\D+/g, ' ').trim();
    const parts = clean.split(' ');
    if (parts.length > 0) {
      const d = parseInt(parts[0]);
      if (!isNaN(d) && d >= 1 && d <= 31) {
        return d;
      }
    }
    return 10; // Fallback
  };

  // Helper to parse Brazilian amounts (e.g., "1.304,10" or "158,56")
  const parseAmount = (valStr: string): number | null => {
    let clean = valStr.trim();
    if (!clean || clean === '-' || clean === 'vence') return null;
    
    // Remove symbols and trim
    clean = clean.replace(/R\$/gi, '').trim();
    
    // Handle negative numbers or credit indicators (e.g. "- 3.000,00" or "(3.000,00)")
    const isNegative = clean.includes('-') || (clean.startsWith('(') && clean.endsWith(')'));
    clean = clean.replace(/[-()]/g, '').trim();
    
    if (clean.includes('.') && clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(/,/g, '.');
    } else if (clean.includes(',')) {
      clean = clean.replace(/,/g, '.');
    }
    
    clean = clean.replace(/\s+/g, '');
    
    const parsed = parseFloat(clean);
    if (!isNaN(parsed)) {
      return isNegative ? -parsed : parsed;
    }
    return null;
  };

  // Main Parsing Logic
  const handleParse = () => {
    if (!pasteText.trim()) {
      showToast('Por favor, cole o conteúdo da planilha no campo de texto.', 'error');
      return;
    }

    try {
      const rawLines = pasteText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const mergedLines: string[] = [];

      const isHeaderLine = (text: string): boolean => {
        const t = text.toLowerCase();
        return t.includes('vence') || 
               MONTH_NAMES_PT.some(m => t.includes(m)) || 
               ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'].some(m => t.includes(m));
      };

      for (let i = 0; i < rawLines.length; i++) {
        const currentLine = rawLines[i];
        
        if (mergedLines.length === 0) {
          mergedLines.push(currentLine);
          continue;
        }

        const lastLineIndex = mergedLines.length - 1;
        const lastLine = mergedLines[lastLineIndex];

        // 1. If both are header lines, merge them!
        if (isHeaderLine(lastLine) && isHeaderLine(currentLine)) {
          mergedLines[lastLineIndex] += '\t' + currentLine;
          continue;
        }

        // 2. If the current line is pure numbers/whitespace, merge it into the previous line!
        const isPureNumbers = /^[0-9\s,.\-()R$]+$/i.test(currentLine);
        if (isPureNumbers) {
          mergedLines[lastLineIndex] += '\t' + currentLine;
          continue;
        }

        // Otherwise, it's a new line (starts with a new category/description)
        mergedLines.push(currentLine);
      }

      const parsedRows: string[][] = [];

      // Parse lines using a robust smart-splitter (supporting tabs, semicolons, multi-spaces, and quote/decimal-aware commas)
      const smartSplit = (line: string): string[] => {
        const cleanLine = line.trim();
        if (!cleanLine) return [];

        // 1. Tab separated (Excel / Google Sheets Copy-Paste)
        if (cleanLine.includes('\t')) {
          return cleanLine.split('\t').map(cell => {
            let c = cell.trim();
            if (c.startsWith('"') && c.endsWith('"')) {
              c = c.substring(1, c.length - 1);
            }
            return c.trim();
          });
        }

        // 2. Semicolon separated (Brazilian Portuguese standard CSV)
        if (cleanLine.includes(';')) {
          return cleanLine.split(';').map(cell => {
            let c = cell.trim();
            if (c.startsWith('"') && c.endsWith('"')) {
              c = c.substring(1, c.length - 1);
            }
            return c.trim();
          });
        }

        // 3. Multi-space separated (2 or more spaces)
        if (/\s{2,}/.test(cleanLine)) {
          return cleanLine.split(/\s{2,}/).map(cell => {
            let c = cell.trim();
            if (c.startsWith('"') && c.endsWith('"')) {
              c = c.substring(1, c.length - 1);
            }
            return c.trim();
          });
        }

        // 4. Comma separated, quote-aware and decimal-aware
        const row: string[] = [];
        let currentCell = '';
        let inQuotes = false;
        
        for (let i = 0; i < cleanLine.length; i++) {
          const char = cleanLine[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            // Check if this comma is a decimal separator (between two digits, e.g. "158,56")
            const isDecimalComma = i > 0 && i < cleanLine.length - 1 && 
                                   /\d/.test(cleanLine[i - 1]) && /\d/.test(cleanLine[i + 1]);
            if (isDecimalComma) {
              currentCell += char;
            } else {
              row.push(currentCell.trim());
              currentCell = '';
            }
          } else {
            currentCell += char;
          }
        }
        row.push(currentCell.trim());

        return row.map(cell => {
          let c = cell.trim();
          if (c.startsWith('"') && c.endsWith('"')) {
            c = c.substring(1, c.length - 1);
          }
          return c.trim();
        });
      };

      for (const line of mergedLines) {
        const row = smartSplit(line);
        if (row.length > 0) {
          parsedRows.push(row);
        }
      }

      if (parsedRows.length < 2) {
        showToast('Nenhum dado válido encontrado. Certifique-se de copiar as linhas da tabela.', 'error');
        return;
      }

      // Find Header row (the one with months like "Janeiro", "Fevereiro" or "vence")
      let headerRowIndex = -1;
      for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const joined = row.join(' ').toLowerCase();
        if (joined.includes('vence') || joined.includes('janeiro') || joined.includes('fevereiro')) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        // Fallback: Assume first row is header if we can find month names
        headerRowIndex = 0;
      }

      const headerRow = parsedRows[headerRowIndex];
      const colMappings: ColMapping[] = [];
      let venceColIndex = -1;

      // Detect months and years from the header
      let yearCounter = 2024; // Default starting year, can be auto-incremented
      let lastMonthNum = -1;

      for (let j = 0; j < headerRow.length; j++) {
        const cell = headerRow[j].toLowerCase().trim();
        
        if (cell.includes('vence')) {
          venceColIndex = j;
          continue;
        }

        // Check for specific year formats like jan.-26, 06-26, fev.-26
        const regexYear = /(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|\d{2})[-. ]*(25|26|2025|2026)/i;
        const matchYear = cell.match(regexYear);
        if (matchYear) {
          const mPart = matchYear[1].toLowerCase();
          const yPart = matchYear[2];
          const yearVal = yPart.length === 2 ? parseInt('20' + yPart) : parseInt(yPart);
          
          let mIndex = -1;
          if (mPart === '01' || mPart.startsWith('jan')) mIndex = 0;
          else if (mPart === '02' || mPart.startsWith('fev')) mIndex = 1;
          else if (mPart === '03' || mPart.startsWith('mar')) mIndex = 2;
          else if (mPart === '04' || mPart.startsWith('abr')) mIndex = 3;
          else if (mPart === '05' || mPart.startsWith('mai') || mPart.startsWith('maio')) mIndex = 4;
          else if (mPart === '06' || mPart.startsWith('jun')) mIndex = 5;
          else if (mPart === '07' || mPart.startsWith('jul')) mIndex = 6;
          else if (mPart === '08' || mPart.startsWith('ago')) mIndex = 7;
          else if (mPart === '09' || mPart.startsWith('set')) mIndex = 8;
          else if (mPart === '10' || mPart.startsWith('out')) mIndex = 9;
          else if (mPart === '11' || mPart.startsWith('nov')) mIndex = 10;
          else if (mPart === '12' || mPart.startsWith('dez')) mIndex = 11;

          if (mIndex !== -1) {
            colMappings.push({ index: j, month: mIndex, year: yearVal, label: headerRow[j] });
          }
          continue;
        }

        // Standard Portuguese month names matching
        const mIndex = MONTH_NAMES_PT.findIndex(m => cell === m || cell.startsWith(m.substring(0, 3)));
        if (mIndex !== -1) {
          if (mIndex <= lastMonthNum && lastMonthNum !== -1) {
            yearCounter++;
          }
          colMappings.push({ index: j, month: mIndex, year: yearCounter, label: `${headerRow[j]} (${yearCounter})` });
          lastMonthNum = mIndex;
        }
      }

      if (colMappings.length === 0) {
        showToast('Não foi possível identificar as colunas de meses na planilha.', 'error');
        return;
      }

      // Default category "Moradia" or the first category
      const defaultCatId = categories.find(c => 
        c.name.toLowerCase().includes('moradia') || 
        c.name.toLowerCase().includes('casa')
      )?.id || categories[0]?.id || '';

      const items: ParsedItem[] = [];

      // Parse values row by row
      for (let i = 0; i < parsedRows.length; i++) {
        if (i === headerRowIndex) continue; // Skip header row
        
        const row = parsedRows[i];
        
        // Find description from col 0, 1 or 2
        let description = '';
        if (row[1] && row[1].trim()) description = row[1].trim();
        else if (row[0] && row[0].trim()) description = row[0].trim();
        else if (row[2] && row[2].trim()) description = row[2].trim();

        if (!description) continue;

        // Skip aggregate/summary rows
        const lowerDesc = description.toLowerCase();
        if (
          lowerDesc === 'total' ||
          lowerDesc.startsWith('total ') ||
          lowerDesc.includes('cada um') ||
          lowerDesc === 'liquido' ||
          lowerDesc === 'renda' ||
          lowerDesc.includes('imposto') ||
          lowerDesc.startsWith('para cada')
        ) {
          continue; 
        }

        // Get due day (vence) if column found
        let dueDay = '10';
        if (venceColIndex !== -1 && row[venceColIndex]) {
          dueDay = row[venceColIndex].trim();
        }

        const parsedDay = parseDueDay(dueDay);

        // Scan month columns
        for (const mapping of colMappings) {
          if (mapping.index < row.length && row[mapping.index]) {
            const rawValue = row[mapping.index];
            const amount = parseAmount(rawValue);
            
            if (amount !== null && amount !== 0) {
              // Construct YYYY-MM-DD
              const mm = String(mapping.month + 1).padStart(2, '0');
              const dd = String(parsedDay).padStart(2, '0');
              const dateStr = `${mapping.year}-${mm}-${dd}`;

              // Determine if it's income or expense based on amount or label
              let type: TransactionType = 'DESPESA';
              let finalAmount = amount;

              if (amount < 0) {
                // If amount is negative in the sheet (e.g. discount or credit)
                // We keep it as absolute positive despesa OR negative despesa depending on user preference,
                // but let's make it a clean DESPESA with positive amount or keep negative.
                // Usually spreadsheet lists discounts as negative, so negative expense is fine,
                // but let's treat explicit negative receipts (like "- 1.900,00 RECEBIMENTO") as income!
                if (lowerDesc.includes('recebimento') || lowerDesc.includes('renda') || lowerDesc.includes('desconto')) {
                  type = 'RECEITA';
                  finalAmount = Math.abs(amount);
                } else {
                  // Keep negative despesa as-is for discounts
                  finalAmount = amount;
                }
              }

              items.push({
                id: crypto.randomUUID(),
                date: dateStr,
                description: `${description} (${mapping.label})`,
                amount: finalAmount,
                category: defaultCatId,
                type: type,
                status: 'REALIZADO',
                selected: true,
                isValid: true,
                originalValue: rawValue,
                dueDay: dueDay
              });
            }
          }
        }
      }

      if (items.length === 0) {
        showToast('Nenhum lançamento com valor numérico válido foi encontrado.', 'info');
        return;
      }

      setParsedItems(items);
      setStep(2);
      showToast(`${items.length} lançamentos identificados com sucesso!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao processar planilha. Verifique a formatação.', 'error');
    }
  };

  const handleImport = () => {
    const selectedItems = parsedItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      showToast('Por favor, selecione pelo menos um lançamento para importar.', 'info');
      return;
    }

    selectedItems.forEach(item => {
      onAdd({
        id: crypto.randomUUID(),
        date: item.date,
        description: item.description,
        amount: Math.abs(item.amount), // Standard positive amount
        category: item.category,
        type: item.type,
        status: item.status,
        notes: `Importado de planilha. Valor original: ${item.originalValue}. Dia de vencimento: ${item.dueDay}`
      });
    });

    showToast(`${selectedItems.length} lançamentos importados com sucesso!`, 'success');
    setParsedItems([]);
    setPasteText('');
    setStep(1);
    onSuccess();
  };

  const toggleSelectAll = () => {
    const allSelected = parsedItems.every(i => i.selected);
    setParsedItems(prev => prev.map(item => ({ ...item, selected: !allSelected })));
  };

  const toggleSelectItem = (id: string) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const handleCategoryChange = (id: string, catId: string) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, category: catId } : item));
  };

  const handleGlobalCategoryChange = (catId: string) => {
    setGlobalCategory(catId);
    if (catId) {
      setParsedItems(prev => prev.map(item => ({ ...item, category: catId })));
    }
  };

  const handleDeleteItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {step === 1 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
          <div className="flex items-start gap-3 bg-brand-50 dark:bg-brand-950/20 p-4 rounded-xl border border-brand-100 dark:border-brand-900/30">
            <FileSpreadsheet className="text-brand-600 dark:text-brand-400 shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Importador Inteligente de Planilha</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Copie as linhas e colunas de valores da sua planilha do Excel ou Google Sheets (como a de Água, Luz, Internet etc.) e cole no campo de texto abaixo. O sistema lerá os meses e criará automaticamente os lançamentos para cada mês correspondente sem quebras de layout!
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Conteúdo da Planilha (Cole aqui)
            </label>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Cole os dados aqui... Exemplo:&#10;, ÁGUA, 158.56, 158.56, 165.21, ... vence, 16"
              className="w-full h-80 px-4 py-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none text-sm font-mono transition-all"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleParse}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              <RefreshCw size={16} /> Processar e Visualizar Lançamentos
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Actions & Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Revisar Lançamentos Detectados</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Verifique os lançamentos e ajuste as categorias antes de confirmar a importação definitiva.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={globalCategory}
                onChange={e => handleGlobalCategoryChange(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs dark:text-white px-3 py-2 shadow-sm"
              >
                <option value="">Definir categoria para todos...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                Voltar e Colar Novamente
              </button>

              <button
                onClick={handleImport}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <Check size={14} /> Importar Selecionados ({parsedItems.filter(i => i.selected).length})
              </button>
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-150 dark:border-gray-700/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border-b border-gray-150 dark:border-gray-700 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">
                      <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                        {parsedItems.every(i => i.selected) ? (
                          <CheckSquare size={18} className="text-brand-500" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">Lançamento / Descrição</th>
                    <th className="py-3 px-4 w-32">Data</th>
                    <th className="py-3 px-4 w-36 text-right">Valor</th>
                    <th className="py-3 px-4 w-48">Categoria</th>
                    <th className="py-3 px-4 w-20 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {parsedItems.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-gray-50/50 dark:hover:bg-gray-750/20 transition-colors ${!item.selected ? 'opacity-60' : ''}`}
                    >
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => toggleSelectItem(item.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                          {item.selected ? (
                            <CheckSquare size={18} className="text-brand-500" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm block">
                          {item.description}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium block">
                          Valor original na planilha: {item.originalValue} (Vence dia: {item.dueDay})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-xs">
                        {item.date}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(item.amount))}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={item.category}
                          onChange={e => handleCategoryChange(item.id, e.target.value)}
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs dark:text-white p-1.5 focus:ring-1 focus:ring-brand-500"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
