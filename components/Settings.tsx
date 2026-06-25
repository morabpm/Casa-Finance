import React, { useState } from 'react';
import { Download, Upload, Save, FileJson, User, Database, Check, FileText } from 'lucide-react';
import { AppData, UserProfile } from '../types';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

interface SettingsProps {
  data: AppData;
  onImport: (data: AppData) => void;
  onUpdateProfile: (profile: UserProfile) => void;
}

export const Settings: React.FC<SettingsProps> = ({ data, onImport, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'data'>('profile');
  const [profileForm, setProfileForm] = useState<UserProfile>(data.userProfile || {
    name: '', email: '', role: '', companyName: ''
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);
  
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const handleExport = () => {
    // Ensure we export the current state fully
    const exportData = {
      ...data,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(exportData, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `casa_finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleExportCSV = () => {
    // CSV Header
    const headers = ['ID', 'Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status'];
    
    // CSV Rows
    const rows = data.transactions.map(t => {
      const categoryName = data.categories.find(c => c.id === t.category)?.name || 'Desconhecida';
      return [
        t.id,
        t.date,
        `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
        `"${categoryName}"`,
        t.type,
        t.amount.toFixed(2),
        t.status
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `casa_finance_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          if (event.target?.result) {
            const parsed = JSON.parse(event.target.result as string);
            // Basic validation
            if (parsed.transactions && parsed.categories) {
              confirm({
                message: "Isso substituirá TODOS os dados atuais (transações, categorias, fornecedores, etc). Continuar?",
                onConfirm: () => {
                  onImport(parsed);
                  if (parsed.userProfile) {
                    setProfileForm(parsed.userProfile);
                  }
                  showToast("Backup restaurado com sucesso!", "success");
                }
              });
            } else {
              showToast("Arquivo inválido. Verifique se é um backup do Casa Finance Pro.", "error");
            }
          }
        } catch (err) {
          showToast("Erro ao ler o arquivo. O JSON pode estar corrompido.", "error");
        }
      };
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileError('Nome e Email são obrigatórios.');
      return;
    }
    setProfileError(null);
    onUpdateProfile(profileForm);
    setSaveStatus('saved');
    showToast('Perfil atualizado com sucesso!', 'success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Configurações</h2>
         
         <div className="flex p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
           <button 
             onClick={() => setActiveTab('profile')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-white dark:bg-gray-600 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
           >
             <User size={16} /> Perfil
           </button>
           <button 
             onClick={() => setActiveTab('data')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'data' ? 'bg-white dark:bg-gray-600 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
           >
             <Database size={16} /> Dados & Backup
           </button>
         </div>
      </div>
      
      {activeTab === 'profile' ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 animate-in slide-in-from-left-4 duration-300">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Perfil do Operador</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
             {profileError && (
               <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                 {profileError}
               </div>
             )}
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
               <input 
                 type="text" 
                 required
                 className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2 text-sm dark:text-white"
                 value={profileForm.name}
                 onChange={e => {
                   setProfileForm({...profileForm, name: e.target.value});
                   if (profileError) setProfileError(null);
                 }}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
               <input 
                 type="email" 
                 required
                 className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2 text-sm dark:text-white"
                 value={profileForm.email}
                 onChange={e => {
                   setProfileForm({...profileForm, email: e.target.value});
                   if (profileError) setProfileError(null);
                 }}
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cargo / Função</label>
                  <input 
                    type="text" 
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2 text-sm dark:text-white"
                    value={profileForm.role}
                    onChange={e => setProfileForm({...profileForm, role: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Empresa</label>
                  <input 
                    type="text" 
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2 text-sm dark:text-white"
                    value={profileForm.companyName}
                    onChange={e => setProfileForm({...profileForm, companyName: e.target.value})}
                  />
                </div>
             </div>
             
             <div className="pt-4">
               <button 
                 type="submit" 
                 className={`flex items-center gap-2 px-6 py-2 rounded-md text-white font-medium transition-colors ${saveStatus === 'saved' ? 'bg-green-600' : 'bg-brand-600 hover:bg-brand-700'}`}
               >
                 {saveStatus === 'saved' ? <><Check size={18} /> Salvo!</> : <><Save size={18} /> Salvar Alterações</>}
               </button>
             </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
          {/* Export Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4 text-brand-600 dark:text-brand-400">
              <Download size={24} />
              <h3 className="text-lg font-semibold">Exportar Dados</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Baixe uma cópia completa de suas transações, categorias, orçamentos e fornecedores em formato JSON.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md mb-6 text-xs text-gray-500 font-mono">
              {data.transactions.length} transações<br/>
              {data.categories.length} categorias<br/>
              {data.suppliers?.length || 0} fornecedores<br/>
              {data.budgets.length} orçamentos
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md transition-colors"
              >
                <Save size={18} /> Baixar Backup (JSON)
              </button>
              <button 
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors"
              >
                <FileText size={18} /> Exportar para Excel (CSV)
              </button>
            </div>
          </div>

          {/* Import Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-3 mb-4 text-brand-600 dark:text-brand-400">
              <Upload size={24} />
              <h3 className="text-lg font-semibold">Restaurar Dados</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Restaure seus dados a partir de um arquivo de backup (.json). 
              <span className="text-red-500 font-semibold block mt-1">Atenção: Isso substituirá os dados atuais.</span>
            </p>
            
            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
               <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               <div className="flex flex-col items-center">
                 <FileJson size={32} className="text-gray-400 group-hover:text-brand-500 mb-2" />
                 <span className="text-sm text-gray-500 group-hover:text-brand-600">Clique para selecionar o arquivo</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};