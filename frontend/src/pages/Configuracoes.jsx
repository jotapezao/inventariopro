import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Users, AlertCircle, Trash2, UserPlus, CheckCircle,
  XCircle, Tag, Layers, ChevronDown, KeyRound, Eye, EyeOff, X, Plus, MessageCircle, Settings
} from 'lucide-react';

// ─── Componente de Modal de Troca de Senha ───
function PasswordModal({ user: targetUser, onClose, onSuccess, showMsg }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (novaSenha !== confirmar) return showMsg('error', 'As senhas não coincidem.');
    if (novaSenha.length < 4) return showMsg('error', 'A senha deve ter ao menos 4 caracteres.');
    setLoading(true);
    try {
      await api.put(`/auth/usuarios/${targetUser.id}/senha`, { novaSenha });
      showMsg('success', `Senha de "${targetUser.nome}" alterada com sucesso!`);
      onClose();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" style={{ backgroundColor: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
            <KeyRound size={20} className="text-blue-600" /> Trocar Senha — {targetUser.nome}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-sub)' }}>Nova Senha</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                required
                placeholder="Mínimo 4 caracteres"
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border)' }}
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-gray-400">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-sub)' }}>Confirmar Senha</label>
            <input
              type={show ? 'text' : 'password'}
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              required
              placeholder="Repita a senha"
              className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border)' }}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 font-bold hover:bg-blue-700 disabled:opacity-50 transition">
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2.5 font-bold hover:bg-gray-50 transition"
              style={{ borderColor: 'var(--border)', color: 'var(--text-sub)' }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Componente Principal ───
export default function Configuracoes() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tipos, setTipos] = useState([]);

  const [showUserForm, setShowUserForm] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null); // { id, nome }
  const [newUser, setNewUser] = useState({ nome: '', usuario: '', email: '', senha: '', tipo: 'Funcionário' });

  const [newCategoryName, setNewCategoryName] = useState('');

  const [selectedCatForTipo, setSelectedCatForTipo] = useState('');
  const [newTipoName, setNewTipoName] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    if (user?.tipo === 'Administrador') loadData();
  }, [user]);

  useEffect(() => {
    if (selectedCatForTipo) loadTipos(selectedCatForTipo);
    else setTipos([]);
  }, [selectedCatForTipo]);

  const loadData = async () => {
    try {
      const [usersRes, catRes, configRes] = await Promise.all([
        api.get('/auth/usuarios'), 
        api.get('/categorias'),
        api.get('/config/whatsapp_notificacao').catch(() => ({ data: { valor: '' } }))
      ]);
      setUsers(usersRes.data);
      setCategories(catRes.data);
      if (configRes?.data?.valor) {
        setWhatsappNumber(configRes.data.valor);
      }
    } catch (e) { console.error(e); }
  };

  const loadTipos = async (catId) => {
    try {
      const res = await api.get(`/tipos?categoria_id=${catId}`);
      setTipos(res.data);
    } catch (e) { console.error(e); }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // ─── Configurações Globais ───
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.put('/config/whatsapp_notificacao', { valor: whatsappNumber });
      showMsg('success', 'Número de WhatsApp salvo com sucesso!');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Erro ao salvar configuração.');
    } finally {
      setSavingConfig(false);
    }
  };

  // ─── Usuários ───
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', newUser);
      showMsg('success', 'Usuário criado com sucesso!');
      setNewUser({ nome: '', usuario: '', email: '', senha: '', tipo: 'Funcionário' });
      setShowUserForm(false);
      loadData();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Erro ao criar usuário.');
    } finally { setLoading(false); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await api.delete(`/auth/usuarios/${id}`);
      showMsg('success', 'Usuário excluído!');
      loadData();
    } catch (err) { showMsg('error', err.response?.data?.message || 'Erro ao excluir.'); }
  };

  // ─── Categorias ───
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await api.post('/categorias', { nome: newCategoryName });
      setNewCategoryName('');
      loadData();
      showMsg('success', 'Categoria adicionada!');
    } catch (err) { showMsg('error', err.response?.data?.message || 'Erro ao adicionar categoria.'); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Excluir esta categoria? Os Tipos vinculados também serão removidos.')) return;
    try {
      await api.delete(`/categorias/${id}`);
      if (String(selectedCatForTipo) === String(id)) setSelectedCatForTipo('');
      loadData();
      showMsg('success', 'Categoria excluída!');
    } catch (err) { showMsg('error', err.response?.data?.message || 'Erro ao excluir categoria.'); }
  };

  // ─── Tipos ───
  const handleAddTipo = async () => {
    if (!newTipoName.trim() || !selectedCatForTipo) return;
    try {
      await api.post('/tipos', { nome: newTipoName, categoria_id: selectedCatForTipo });
      setNewTipoName('');
      loadTipos(selectedCatForTipo);
      showMsg('success', 'Tipo adicionado!');
    } catch (err) { showMsg('error', err.response?.data?.message || 'Erro ao adicionar tipo.'); }
  };

  const handleDeleteTipo = async (id) => {
    try {
      await api.delete(`/tipos/${id}`);
      loadTipos(selectedCatForTipo);
    } catch (err) { showMsg('error', err.response?.data?.message || 'Erro ao excluir tipo.'); }
  };

  if (user?.tipo !== 'Administrador') {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>Acesso Negado</h2>
        <p style={{ color: 'var(--text-sub)' }} className="mt-2">Você precisa ser um administrador para acessar as configurações.</p>
      </div>
    );
  }

  const cardCls = "rounded-xl shadow-sm border p-6";
  const cardStyle = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' };
  const inputCls = "w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition";
  const inputStyle = { backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border)' };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-main)' }}>
          <Users className="text-blue-600" /> Configurações do Sistema
        </h2>
        {message.text && (
          <div className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {message.text}
          </div>
        )}
      </div>

      {/* ─── Configurações Gerais ─── */}
      <div className={`${cardCls} mb-8`} style={cardStyle}>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-main)' }}>
          <Settings size={20} className="text-gray-600" /> Configurações Gerais
        </h3>
        <div className="max-w-md">
          <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--text-sub)' }}>
            <MessageCircle size={16} className="text-green-500" /> WhatsApp para Notificações (Entradas/Saídas)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: 5511999999999"
              value={whatsappNumber}
              onChange={e => setWhatsappNumber(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
            <button 
              onClick={handleSaveConfig} 
              disabled={savingConfig}
              className="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700 font-bold transition flex-shrink-0 disabled:opacity-50"
            >
              {savingConfig ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-sub)' }}>
             Informe o número completo (DDI + DDD + Número) apenas com números. Ex: 5511988887777.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">

        {/* ─── Gestão de Usuários (col 3) ─── */}
        <div className="xl:col-span-3 space-y-4">
          <div className={cardCls} style={cardStyle}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <Users size={20} className="text-blue-600" /> Usuários
              </h3>
              <button
                onClick={() => setShowUserForm(!showUserForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-semibold"
              >
                <UserPlus size={16} /> Novo Usuário
              </button>
            </div>

            {/* Formulário novo usuário */}
            {showUserForm && (
              <div className="mb-5 p-4 rounded-xl border" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)' }}>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Nome Completo" value={newUser.nome} onChange={e => setNewUser({ ...newUser, nome: e.target.value })} required className={inputCls} style={inputStyle} />
                  <input placeholder="Login (usuário)" value={newUser.usuario} onChange={e => setNewUser({ ...newUser, usuario: e.target.value })} required className={inputCls} style={inputStyle} />
                  <input type="email" placeholder="E-mail" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required className={inputCls} style={inputStyle} />
                  <input type="password" placeholder="Senha inicial" value={newUser.senha} onChange={e => setNewUser({ ...newUser, senha: e.target.value })} required className={inputCls} style={inputStyle} />
                  <select value={newUser.tipo} onChange={e => setNewUser({ ...newUser, tipo: e.target.value })} className={inputCls} style={inputStyle}>
                    <option value="Funcionário">Funcionário</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-bold hover:bg-blue-700 disabled:opacity-50 text-sm">Criar</button>
                    <button type="button" onClick={() => setShowUserForm(false)} className="flex-1 border rounded-lg py-2 font-bold text-sm hover:opacity-80 transition" style={{ borderColor: 'var(--border)', color: 'var(--text-sub)' }}>Cancelar</button>
                  </div>
                </form>
              </div>
            )}

            {/* Tabela de usuários */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid var(--border)` }}>
                    <th className="pb-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-sub)' }}>Nome</th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-sub)' }}>Login</th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-sub)' }}>Nível</th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text-sub)' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: `1px solid var(--border)` }} className="hover:opacity-80 transition">
                      <td className="py-3 text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        {u.nome} {u.id === user.id && <span className="text-xs text-blue-500 ml-1">(Você)</span>}
                      </td>
                      <td className="py-3 text-sm" style={{ color: 'var(--text-sub)' }}>{u.usuario}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${u.tipo === 'Administrador' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.tipo}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setPasswordModal(u)}
                            title="Trocar Senha"
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition"
                          >
                            <KeyRound size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user.id}
                            title="Excluir"
                            className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 disabled:opacity-20 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── Categorias e Tipos (col 2) ─── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Categorias */}
          <div className={cardCls} style={cardStyle}>
            <h3 className="text-base font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-main)' }}>
              <Tag size={18} className="text-blue-600" /> Categorias
            </h3>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Nova categoria..."
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                className={inputCls}
                style={inputStyle}
              />
              <button onClick={handleAddCategory} className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700 font-bold transition flex items-center">
                <Plus size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <span key={cat.id} className="group flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition cursor-default">
                  {cat.nome}
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-blue-300 group-hover:text-red-500 transition ml-1 leading-none">&times;</button>
                </span>
              ))}
              {categories.length === 0 && <p className="text-xs" style={{ color: 'var(--text-sub)' }}>Nenhuma categoria ainda.</p>}
            </div>
          </div>

          {/* Tipos por Categoria */}
          <div className={cardCls} style={cardStyle}>
            <h3 className="text-base font-bold flex items-center gap-2 mb-1" style={{ color: 'var(--text-main)' }}>
              <Layers size={18} className="text-indigo-600" /> Tipos por Categoria
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-sub)' }}>Selecione uma categoria para gerenciar seus tipos.</p>

            <div className="relative mb-4">
              <select
                value={selectedCatForTipo}
                onChange={e => setSelectedCatForTipo(e.target.value)}
                className={inputCls + ' appearance-none pr-8'}
                style={inputStyle}
              >
                <option value="">Escolha a categoria...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-sub)' }} />
            </div>

            {selectedCatForTipo && (
              <>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Novo tipo..."
                    value={newTipoName}
                    onChange={e => setNewTipoName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTipo()}
                    className={inputCls}
                    style={inputStyle}
                  />
                  <button onClick={handleAddTipo} className="bg-indigo-600 text-white px-3 rounded-lg hover:bg-indigo-700 font-bold transition flex items-center">
                    <Plus size={18} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tipos.length === 0
                    ? <p className="text-xs" style={{ color: 'var(--text-sub)' }}>Nenhum tipo nesta categoria.</p>
                    : tipos.map(t => (
                      <span key={t.id} className="group flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition cursor-default">
                        {t.nome}
                        <button onClick={() => handleDeleteTipo(t.id)} className="text-indigo-300 group-hover:text-red-500 transition ml-1 leading-none">&times;</button>
                      </span>
                    ))
                  }
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de troca de senha */}
      {passwordModal && (
        <PasswordModal
          user={passwordModal}
          onClose={() => setPasswordModal(null)}
          onSuccess={loadData}
          showMsg={showMsg}
        />
      )}
    </div>
  );
}
