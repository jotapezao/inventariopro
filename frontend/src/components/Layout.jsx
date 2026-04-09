import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppConfig } from '../contexts/AppConfigContext';
import { LogOut, PlusSquare, Settings, HelpCircle, LogIn, Sun, Moon, History, FileBox, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout = ({ children }) => {
  const { user, logout, signed } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const { config } = useAppConfig();
  const location = useLocation();

  const navLink = (to, label, icon) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all text-sm
          ${active
            ? 'bg-white/20 text-white shadow-sm'
            : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>

      {/* Navbar */}
      <header
        style={{ backgroundColor: 'var(--bg-nav)' }}
        className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">

            {/* Logo + Nome */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <span className="text-xl sm:text-2xl leading-none select-none">{config.logo_emoji || '📦'}</span>
              <span className="font-bold text-base sm:text-lg text-white tracking-tight group-hover:opacity-80 transition-opacity truncate max-w-[120px] sm:max-w-none">
                {config.nome_sistema || 'Inventário Pro'}
              </span>
            </Link>

            {/* Nav Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {navLink('/', 'Estoque', <FileBox size={16} />)}
              {navLink('/solicitar-saida', 'Solicitar', <PlusSquare size={16} />)}
              {user?.tipo === 'Administrador' && (
                <>
                  {navLink('/gerenciar-solicitacoes', 'Aprovações', null)}
                  {navLink('/cadastrar-produto', 'Produto', <PlusSquare size={15} />)}
                  {navLink('/historico', 'Histórico', <History size={15} />)}
                  {navLink('/configuracoes', 'Config', <Settings size={15} />)}
                </>
              )}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                className="p-1.5 sm:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {signed ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="hidden xs:flex items-center gap-2 bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white"
                      style={{ backgroundColor: 'var(--accent)' }}>
                      {user?.nome?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm text-white/90 font-medium">{user?.nome?.split(' ')[0]}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-red-500/20 transition-all"
                    title="Sair"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs transition-all text-white shadow-md hover:shadow-lg"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <LogIn size={15} /> <span className="hidden xs:inline">Entrar</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav (Navegação secundária compacta) */}
        <div className="md:hidden border-t border-white/5 bg-black/10 backdrop-blur-sm px-2 py-1.5 flex gap-1 overflow-x-auto no-scrollbar">
          {navLink('/', 'Estoque', <FileBox size={16} />)}
          {navLink('/solicitar-saida', 'Solicitar', <PlusSquare size={16} />)}
          {user?.tipo === 'Administrador' && (
            <>
              {navLink('/gerenciar-solicitacoes', 'Pedidos', <CheckCircle size={16} />)}
              {navLink('/cadastrar-produto', 'Novo', <PlusSquare size={16} />)}
              {navLink('/historico', 'Logs', <History size={16} />)}
              {navLink('/configuracoes', 'Config', <Settings size={16} />)}
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 px-6 text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-sub)' }}>
        {config.nome_sistema || 'Inventário Pro'} &mdash; {new Date().getFullYear()}
        {config.email_suporte && (
          <span className="ml-3 opacity-60">{config.email_suporte}</span>
        )}
      </footer>

      {/* Botão de Suporte Flutuante */}
      {(config.whatsapp_notificacao || config.whatsapp_admin) && (
        <a
          href={`https://wa.me/55${(config.whatsapp_notificacao || config.whatsapp_admin || '').replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 p-4 rounded-full shadow-xl hover:shadow-2xl text-white transition-all hover:-translate-y-1 flex items-center justify-center cursor-pointer group z-50"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <HelpCircle size={24} />
          <div className="absolute bottom-16 right-0 border shadow-xl rounded-2xl p-4 w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-sm"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', borderColor: 'var(--border)' }}>
            <strong className="block mb-1" style={{ color: 'var(--accent)' }}>Suporte</strong>
            {config.nome_suporte && <span className="block">{config.nome_suporte}</span>}
            {config.email_suporte && <span className="block text-xs opacity-70">{config.email_suporte}</span>}
          </div>
        </a>
      )}
    </div>
  );
};
