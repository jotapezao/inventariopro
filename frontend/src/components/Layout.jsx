import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { PackageOpen, LogOut, PlusSquare, Settings, HelpCircle, LogIn, Sun, Moon, History, FileBox } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Layout = ({ children }) => {
  const { user, logout, signed } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
    {/* Navbar */}
      <header style={{ backgroundColor: 'var(--bg-nav)' }} className="shadow-md sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between py-3 items-center gap-4">

            <div className="flex-shrink-0 flex items-center text-white cursor-pointer" onClick={() => window.location.href = '/'}>
              <PackageOpen className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl tracking-tight">Inventário Pro</span>
            </div>

            <nav className="flex flex-wrap items-center gap-1 w-full lg:w-auto order-3 lg:order-2 justify-center lg:justify-start">
              <Link to="/" className="text-white hover:bg-white/10 px-3 py-2 rounded-md font-medium transition text-sm flex items-center">
                <FileBox className="h-4 w-4 mr-1 hidden sm:block" /> Estoque
              </Link>
              <Link to="/solicitar-saida" className="text-white hover:bg-white/10 px-3 py-2 rounded-md font-medium transition text-sm">
                Solicitar Material
              </Link>
              {user?.tipo === 'Administrador' && (
                <>
                  <Link to="/gerenciar-solicitacoes" className="text-white hover:bg-white/10 px-3 py-2 rounded-md font-medium transition text-sm">
                    Aprovações
                  </Link>
                  <Link to="/cadastrar-produto" className="text-white hover:bg-white/10 px-3 py-2 rounded-md font-medium transition text-sm flex items-center">
                    <PlusSquare className="h-4 w-4 mr-1" /> Produto
                  </Link>
                  <Link to="/historico" className="text-white hover:bg-white/10 px-3 py-2 rounded-md font-medium transition text-sm flex items-center">
                    <History className="h-4 w-4 mr-1" /> Histórico
                  </Link>
                  <Link to="/configuracoes" className="text-white hover:bg-white/10 px-3 py-2 rounded-md font-medium transition text-sm flex items-center">
                    <Settings className="h-4 w-4 mr-1" /> Configs
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center gap-2 text-white order-2 lg:order-3">
              {/* Toggle Modo Escuro/Claro */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                className="p-2 rounded-md hover:bg-white/10 transition"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {signed ? (
                <>
                  <span className="hidden sm:inline-block text-sm opacity-90">Olá, {user?.nome}</span>
                  <button
                    onClick={logout}
                    className="flex items-center hover:bg-red-500 px-3 py-2 rounded-md transition bg-white/10 font-semibold text-sm"
                  >
                    <LogOut className="h-4 w-4 mr-1" /> Sair
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center hover:bg-green-500 px-3 py-2 rounded-md transition bg-green-600 font-semibold text-sm"
                >
                  <LogIn className="h-4 w-4 mr-1" /> Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Botão de Suporte Flutuante */}
      <a
        href="https://wa.me/5565992859585"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition flex items-center justify-center cursor-pointer group z-50"
      >
        <HelpCircle size={24} />
        <div className="absolute bottom-14 right-0 border border-gray-200 shadow-xl rounded-lg p-3 w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-sm"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>
          <strong className="block text-blue-600 mb-1">Suporte do Sistema</strong>
          João Paulo Fernandes<br />
          WhatsApp: (65) 99285-9585<br />
          joaopaulo@modaverao.com.br
        </div>
      </a>
    </div>
  );
};
