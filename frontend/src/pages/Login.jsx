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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px] animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[120px]" style={{ backgroundColor: 'var(--accent)' }} />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white/70 dark:bg-gray-900/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/20 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Lado Esquerdo — Branding (Oculto em Mobile) */}
        <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden text-white" style={{ backgroundColor: 'var(--bg-nav)' }}>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:32px_32px]" />
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner border border-white/10">
              {config.logo_emoji || '📦'}
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">
              {config.nome_sistema || 'Inventário Pro'}
            </span>
          </div>

          <div className="relative z-10">
            <h1 className="text-5xl font-black leading-tight mb-6 tracking-tight">
              A inteligência por trás do seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300" style={{ backgroundImage: `linear-gradient(to right, var(--accent-light), #fff)` }}>estoque.</span>
            </h1>
            <p className="text-lg text-white/70 font-medium max-w-md leading-relaxed">
              Plataforma robusta para gestão simplificada de materiais, entradas e saídas em tempo real.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            {[
              { icon: <ArrowRight size={14} />, text: 'Tempo Real' },
              { icon: <Lock size={14} />, text: 'Segurança' },
              { icon: <LogIn size={14} />, text: 'Multi-usuário' },
              { icon: <User size={14} />, text: 'Log Próprio' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider">
                 <span style={{ color: 'var(--accent-light)' }}>{item.icon}</span>
                 {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Lado Direito — Formulário */}
        <div className="p-8 sm:p-16 flex flex-col justify-center bg-white/40 dark:bg-transparent">
          
          {/* Mobile Header */}
          <div className="lg:hidden flex flex-col items-center mb-12">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl mb-4 shadow-xl">
              {config.logo_emoji || '📦'}
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase italic" style={{ color: 'var(--text-main)' }}>
              {config.nome_sistema || 'Inventário Pro'}
            </h2>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--text-main)' }}>Acesso Restrito</h3>
            <p className="text-gray-500 font-medium" style={{ color: 'var(--text-sub)' }}>Identifique-se para gerenciar o almoxarifado</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl text-sm font-bold animate-shake"
                style={{ backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #ffe4e6' }}>
                <Lock size={18} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 opacity-60" style={{ color: 'var(--text-main)' }}>Usuário</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={usuario}
                    onChange={e => setUsuario(e.target.value)}
                    placeholder="ex: joao.silva"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold text-gray-700 dark:text-gray-200 placeholder:text-gray-400 placeholder:font-normal"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 opacity-60" style={{ color: 'var(--text-main)' }}>Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold text-gray-700 dark:text-gray-200 placeholder:text-gray-400 placeholder:font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-white transition-all shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:translate-y-0 overflow-hidden"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer" />
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validando...</span>
                </div>
              ) : (
                <>
                  <span>ACESSAR SISTEMA</span>
                  <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-sub)' }}>
                Área Administrativa · <a href="/" className="font-bold hover:underline" style={{ color: 'var(--accent)' }}>Voltar ao Início</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
