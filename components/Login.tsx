import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Logo } from './Logo';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulated short delay for native feel
    setTimeout(() => {
      // Username is case-insensitive, Password is exact
      if (username.trim().toLowerCase() === 'sucesso' && password === '2026') {
        localStorage.setItem('casa_finance_auth', 'true');
        showToast('Login realizado com sucesso! Bem-vindo.', 'success');
        onLoginSuccess();
      } else {
        showToast('Usuário ou senha incorretos!', 'error');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500 my-auto">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-5 sm:p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700/80">
        <div className="flex flex-col items-center mb-6">
          <Logo variant="full" size={76} className="p-0 mb-1" />
        </div>

        <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center mb-5">
          Entrar no Sistema
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Usuário
            </label>
            <input
              type="text"
              required
              placeholder="Digite seu usuário"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Senha
              </label>
              <button
                type="button"
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                onClick={() => showToast('Entre em contato com o administrador para redefinir sua senha.', 'info')}
              >
                Esqueci minha senha?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full pl-4 pr-11 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-brand-600/10 active:scale-98 disabled:opacity-50 text-sm uppercase tracking-wide mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                Entrar <LogIn size={15} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-150 dark:border-gray-700/50 text-center">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed px-2">
            Ainda não tem conta? Solicite ao administrador da sua empresa.
          </p>
          <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-3 font-mono">
            © 2026 Casa Finance Pro
          </p>
        </div>
      </div>
    </div>
  );
};
