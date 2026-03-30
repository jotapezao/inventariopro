import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { PackageOpen, LogOut, PlusSquare, Settings, HelpCircle, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Layout = ({ children }) => {
  const { user, logout, signed } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-blue-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <div className="flex-shrink-0 flex items-center text-white cursor-pointer" onClick={() => window.location.href = '/'}>
              <PackageOpen className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl tracking-tight">Inventário Pro</span>
            </div>
            
            <nav className="flex items-center space-x-4">
              <Link to="/solicitar-saida" className="text-white hover:bg-blue-700 px-3 py-2 rounded-md font-medium transition duration-150">
                Solicitar Material
              </Link>
              {user?.tipo === 'Administrador' && (
                <>
                  <Link to="/gerenciar-solicitacoes" className="text-white hover:bg-blue-700 px-3 py-2 rounded-md font-medium transition duration-150">
                    Aprovações
                  </Link>
                  <Link to="/cadastrar-produto" className="text-white hover:bg-blue-700 px-3 py-2 rounded-md font-medium transition duration-150 flex items-center">
                    <PlusSquare className="h-5 w-5 mr-1" /> Produto
                  </Link>
                  <Link to="/configuracoes" className="text-white hover:bg-blue-700 px-3 py-2 rounded-md font-medium transition duration-150 flex items-center">
                    <Settings className="h-5 w-5 mr-1" /> Configs
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center space-x-4 text-white">
              {signed ? (
                <>
                  <span className="hidden sm:inline-block text-sm">Olá, {user?.nome}</span>
                  <button 
                    onClick={logout}
                    className="flex items-center hover:bg-red-600 px-3 py-2 rounded-md transition duration-150 bg-blue-700 font-semibold"
                  >
                    <LogOut className="h-5 w-5 mr-1" /> Sair
                  </button>
                </>
              ) : (
                <Link 
                  to="/login"
                  className="flex items-center hover:bg-green-600 px-3 py-2 rounded-md transition duration-150 bg-green-500 font-semibold"
                >
                  <LogIn className="h-5 w-5 mr-1" /> Entrar
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
        <div className="absolute bottom-14 right-0 bg-white border border-gray-200 shadow-xl rounded-lg p-3 w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-gray-800 text-sm">
           <strong className="block text-blue-600 mb-1">Suporte do Sistema</strong>
           João Paulo Fernandes<br/>
           WhatsApp: (65) 99285-9585<br/>
           joaopaulo@modaverao.com.br
        </div>
      </a>
    </div>
  );
};
