import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useAppConfig } from '../contexts/AppConfigContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ArrowRight, Lock, User } from 'lucide-react';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const { config } = useAppConfig();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usuario, senha);
      navigate('/');
    } catch {
      setError('Usuário ou senha inválidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-base)' }}>

      {/* Lado Esquerdo — Branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg-nav)' }}
      >
        {/* Blob decorativo */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: 'var(--accent)' }}
        />
        <div
          className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ backgroundColor: 'var(--accent)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <span className="text-4xl">{config.logo_emoji || '📦'}</span>
            <span className="text-2xl font-bold text-white tracking-tight">
              {config.nome_sistema || 'Inventário Pro'}
            </span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Controle seu<br />estoque com<br />
            <span style={{ color: 'var(--accent-light)' }}>precisão.</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-xs">
            Gerencie entradas, saídas e solicitações de materiais de forma simples e eficiente.
          </p>
        </div>

        {/* Features list */}
        <div className="relative z-10 space-y-3">
          {[
            'Controle de estoque em tempo real',
            'Aprovação de solicitações via WhatsApp',
            'Histórico completo de movimentações',
            'Acesso por múltiplos usuários',
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-3 text-white/70 text-sm">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--accent)', opacity: 0.8 }}>
                <ArrowRight size={11} className="text-white" />
              </div>
              {feat}
            </div>
          ))}
        </div>

        {/* Footer branding */}
        <div className="relative z-10 text-white/30 text-xs">
          {new Date().getFullYear()} · {config.nome_sistema || 'Inventário Pro'}
        </div>
      </div>

      {/* Lado Direito — Formulário */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <span className="text-3xl">{config.logo_emoji || '📦'}</span>
          <span className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
            {config.nome_sistema || 'Inventário Pro'}
          </span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
              Bem-vindo de volta
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-sub)' }}>
              Faça login para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-xl text-sm font-medium"
                style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                <Lock size={15} />
                {error}
              </div>
            )}

            {/* Campo Usuário */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-sub)' }}>
                Usuário / E-mail
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-3.5 opacity-40"
                  style={{ color: 'var(--text-main)' }} />
                <input
                  type="text"
                  required
                  autoFocus
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  placeholder="seu.usuario"
                  className="input-base pl-10"
                  style={{ backgroundColor: 'var(--input-bg)' }}
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-sub)' }}>
                Senha
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-3.5 opacity-40"
                  style={{ color: 'var(--text-main)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="input-base pl-10 pr-12"
                  style={{ backgroundColor: 'var(--input-bg)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-3.5 opacity-40 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-main)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Entrando...
                </span>
              ) : (
                <>
                  <LogIn size={18} />
                  Entrar no Sistema
                </>
              )}
            </button>

            {/* Link público */}
            <div className="text-center pt-4">
              <p className="text-sm" style={{ color: 'var(--text-sub)' }}>
                Sem conta?{' '}
                <a href="/" className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
                  Acesse como convidado
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
