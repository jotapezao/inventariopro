import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Users, AlertCircle, Trash2, UserPlus, CheckCircle, XCircle, Tag } from 'lucide-react';

export default function Configuracoes() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // User Form State
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ nome: '', usuario: '', email: '', senha: '', tipo: 'Funcionário' });
  
  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.tipo === 'Administrador') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [usersRes, catRes] = await Promise.all([
        api.get('/auth/usuarios'),
        api.get('/categorias')
      ]);
      setUsers(usersRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // User Handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', newUser);
      showMsg('success', 'Usuário criado com sucesso!');
      setNewUser({ nome: '', usuario: '', email: '', senha: '', tipo: 'Funcionário' });
      setShowUserForm(false);
      loadData();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Erro ao criar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await api.delete(`/auth/usuarios/${id}`);
      showMsg('success', 'Usuário excluído!');
      loadData();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Erro ao excluir.');
    }
  };

  // Category Handlers
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await api.post('/categorias', { nome: newCategoryName });
      setNewCategoryName('');
      loadData();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Erro ao adicionar categoria.');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/categorias/${id}`);
      loadData();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Erro ao excluir categoria.');
    }
  };

  if (user?.tipo !== 'Administrador') {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Acesso Negado</h2>
        <p className="text-gray-600 mt-2">Você precisa ser um administrador para acessar as configurações.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <Users className="mr-3 text-blue-600" /> Configurações do Sistema
        </h2>
        
        {message.text && (
          <div className={`px-4 py-2 rounded-md flex items-center shadow-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle size={18} className="mr-2"/> : <XCircle size={18} className="mr-2"/>}
            {message.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gestão de Usuários */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">Gestão de Usuários</h3>
              <button 
                onClick={() => setShowUserForm(!showUserForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center text-sm font-semibold"
              >
                <UserPlus size={18} className="mr-2"/> Novo Usuário
              </button>
            </div>

            {showUserForm && (
              <div className="p-6 bg-blue-50 border-b border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Nome Completo" value={newUser.nome} onChange={e => setNewUser({...newUser, nome: e.target.value})} required className="bg-white border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input placeholder="Nome de Usuário (Login)" value={newUser.usuario} onChange={e => setNewUser({...newUser, usuario: e.target.value})} required className="bg-white border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="email" placeholder="E-mail" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required className="bg-white border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="password" placeholder="Senha" value={newUser.senha} onChange={e => setNewUser({...newUser, senha: e.target.value})} required className="bg-white border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  <select value={newUser.tipo} onChange={e => setNewUser({...newUser, tipo: e.target.value})} className="bg-white border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Funcionário">Funcionário</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-bold hover:bg-blue-700 disabled:opacity-50">Criar</button>
                    <button type="button" onClick={() => setShowUserForm(false)} className="flex-1 bg-white border text-gray-600 rounded-lg py-2 font-bold hover:bg-gray-50">Cancelar</button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Login</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Permissão</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{u.nome} {u.id === user.id && <span className="text-xs text-blue-500 ml-1">(Você)</span>}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.usuario}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.tipo === 'Administrador' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                          {u.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.id === user.id}
                          className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Gestão de Categorias */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Tag size={20} className="mr-2 text-blue-600"/> Categorias
            </h3>
            <p className="text-sm text-gray-500 mb-6">Personalize as categorias para organização do seu estoque.</p>
            
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Nova Categoria..." 
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
              />
              <button 
                onClick={handleAddCategory}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm transition"
              >
                +
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
               {categories.map(cat => (
                 <span key={cat.id} className="group bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center hover:bg-red-50 hover:border-red-100 hover:text-red-700 transition cursor-default">
                    {cat.nome}
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="ml-2 text-blue-300 group-hover:text-red-500 transition"
                    >
                      &times;
                    </button>
                 </span>
               ))}
            </div>
          </div>
          
          {/* Sessão de Ajustes Extras (Placeholder conforme sugestão do plano) */}
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center">
            <h4 className="text-sm font-bold text-gray-600 mb-1">Ajustes Adicionais</h4>
            <p className="text-xs text-gray-400">Opções avançadas de sistema em breve.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
