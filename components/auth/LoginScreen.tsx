import React, { useState, useRef } from 'react';
import { CheckCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import { getPresetUsers, loginUser, LocalUser } from '../../auth';
import { Logo } from '../Logo';

interface LoginScreenProps {
  onLogin: (user: LocalUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Por favor, informe o usuário.');
      usernameRef.current?.focus();
      return;
    }
    setError('');
    setLoading(true);

    // Dynamic feel: a tiny delay to simulate authentication checking
    setTimeout(() => {
      const result = loginUser(username, password);
      if (result.success) {
        onLogin(result.user!);
      } else {
        setError(result.error || 'Usuário ou senha incorretos.');
        setPassword('');
        passwordRef.current?.focus();
        setLoading(false);
      }
    }, 450);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-indigo-700 via-purple-700 to-indigo-900 p-4 overflow-y-auto">
      {/* Decorative ambient blurred shapes */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none select-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none select-none"></div>

      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/15 dark:border-gray-700/80 animate-in fade-in zoom-in-95 duration-500 my-auto">
        {/* Logo and title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-2 bg-slate-50 dark:bg-slate-900/40 rounded-2xl mb-2">
            <Logo variant="icon" size={68} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Casa <span className="text-brand-600 dark:text-brand-400">Finance</span> Pro
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
            Acesso ao sistema
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Usuário
            </label>
            <input
              ref={usernameRef}
              type="text"
              required
              placeholder="Digite seu usuário"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm font-medium"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Digite sua senha"
                className="w-full pl-4 pr-11 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950/30 rounded-xl text-xs font-semibold text-center animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-600/10 active:scale-98 disabled:opacity-50 text-sm uppercase tracking-wide mt-2"
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

        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700/50 text-center">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed italic">
            Os dados são armazenados localmente neste navegador.
          </p>
          <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-3 font-mono">
            © 2026 Casa Finance Pro
          </p>
        </div>
      </div>
    </div>
  );
};