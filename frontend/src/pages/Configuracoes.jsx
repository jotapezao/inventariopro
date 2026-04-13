import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useAppConfig } from '../contexts/AppConfigContext';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../components/ConfirmModal';
import {
  Users, AlertCircle, Trash2, UserPlus, CheckCircle,
  XCircle, Tag, Layers, ChevronDown, KeyRound, Eye, EyeOff, X, Plus,
  MessageCircle, Settings, Palette, Brush, Phone, Mail, Save
} from 'lucide-react';

// ─── Modal de Troca de Senha ───
function PasswordModal({ user: targetUser, onClose, onSuccess, toast }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (novaSenha !== confirmar) return toast.warning('As senhas não coincidem.');
    if (novaSenha.length < 4) return toast.warning('A senha deve ter ao menos 4 caracteres.');
    setLoading(true);
    try {
      await api.put(`/auth/usuarios/${targetUser.id}/senha`, { novaSenha });
      toast.success(`Senha de "${targetUser.nome}" alterada com sucesso!`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao alterar senha.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" style={{ backgroundColor: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
            <KeyRound size={20} style={{ color: 'var(--accent)' }} /> Trocar Senha — {targetUser.nome}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-sub)' }}>Nova Senha</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required placeholder="Mínimo 4 caracteres" className="input-base pr-10" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 opacity-50 hover:opacity-100 transition" style={{ color: 'var(--text-main)' }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-sub)' }}>Confirmar Senha</label>
            <input type={show ? 'text' : 'password'} value={confirmar} onChange={e => setConfirmar(e.target.value)} required placeholder="Repita a senha" className="input-base" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 text-white rounded-xl py-2.5 font-bold transition disabled:opacity-50" style={{ backgroundColor: 'var(--accent)' }}>
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border rounded-xl py-2.5 font-bold hover:opacity-80 transition" style={{ borderColor: 'var(--border)', color: 'var(--text-sub)' }}>
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
  const { config, setConfig, EMOJI_OPTIONS, COLOR_OPTIONS } = useAppConfig();
  const toast = useToast();
  const [confirm, ConfirmModal] = useConfirm();

  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null);
  const [newUser, setNewUser] = useState({ nome: '', usuario: '', email: '', senha: '', tipo: 'Funcionário' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCatForTipo, setSelectedCatForTipo] = useState('');
  const [newTipoName, setNewTipoName] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Estado local do form de identidade visual
  const [localConfig, setLocalConfig] = useState({
    nome_sistema: '',
    logo_emoji: '📦',
    cor_primaria: 'violet',
    whatsapp_admin: '',
    whatsapp_notificacao: '',
    nome_suporte: '',
    email_suporte: '',
  });

  useEffect(() => {
    if (user?.tipo === 'Administrador') loadData();
  }, [user]);

  useEffect(() => {
    setLocalConfig({
      nome_sistema: config.nome_sistema || '',
      logo_emoji: config.logo_emoji || '📦',
      cor_primaria: config.cor_primaria || 'violet',
      whatsapp_admin: config.whatsapp_admin || '',
      whatsapp_notificacao: config.whatsapp_notificacao || '',
      nome_suporte: config.nome_suporte || '',
      email_suporte: config.email_suporte || '',
    });
  }, [config]);

  useEffect(() => {
    if (selectedCatForTipo) loadTipos(selectedCatForTipo);
    else setTipos([]);
  }, [selectedCatForTipo]);

  const loadData = async () => {
    try {
      const [usersRes, catRes] = await Promise.all([
        api.get('/auth/usuarios'),
        api.get('/categorias'),
      ]);
      setUsers(usersRes.data);
      setCategories(catRes.data);
    } catch (e) { console.error(e); }
  };

  const loadTipos = async (catId) => {
    try {
      const res = await api.get(`/tipos?categoria_id=${catId}`);
      setTipos(res.data);
    } catch (e) { console.error(e); }
  };

  // ─── Salvar todas as configs de uma vez ───
  const handleSaveAllConfigs = async () => {
    setSavingConfig(true);
    try {
      await api.put('/configuracoes', localConfig);
      setConfig(prev => ({ ...prev, ...localConfig }));
      toast.success('Configurações salvas com sucesso!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao salvar configurações.');
    } finally { setSavingConfig(false); }
  };

  // ─── Usuários ───
  const handleCreateUser = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/auth/register', newUser);
      toast.success('Usuário criado com sucesso!');
      setNewUser({ nome: '', usuario: '', email: '', senha: '', tipo: 'Funcionário' });
      setShowUserForm(false); loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Erro ao criar usuário.'); }
    finally { setLoading(false); }
  };

  const handleDeleteUser = async (u) => {
    const ok = await confirm({
      title: 'Excluir Usuário?',
      message: `Tem certeza que deseja excluir o usuário "${u.nome}"?`,
      confirmLabel: 'Excluir',
      variant: 'danger'
    });
    if (!ok) return;
    try { 
      await api.delete(`/auth/usuarios/${u.id}`); 
      toast.success('Usuário excluído!'); 
      loadData(); 
    }
    catch (err) { toast.error(err.response?.data?.message || 'Erro ao excluir.'); }
  };

  // ─── Categorias ───
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try { 
      await api.post('/categorias', { nome: newCategoryName }); 
      setNewCategoryName(''); 
      loadData(); 
      toast.success('Categoria adicionada!'); 
    }
    catch (err) { toast.error(err.response?.data?.message || 'Erro ao adicionar categoria.'); }
  };

  const handleDeleteCategory = async (cat) => {
    const ok = await confirm({
      title: 'Excluir Categoria?',
      message: `Tem certeza que deseja excluir "${cat.nome}"? Isso excluirá todos os tipos associados a ela.`,
      confirmLabel: 'Excluir',
      variant: 'danger'
    });
    if (!ok) return;
    try { 
      await api.delete(`/categorias/${cat.id}`); 
      if (String(selectedCatForTipo) === String(cat.id)) setSelectedCatForTipo(''); 
      loadData(); 
      toast.success('Categoria excluída!');
    }
    catch (err) { toast.error(err.response?.data?.message || 'Erro ao excluir categoria.'); }
  };

  // ─── Tipos ───
  const handleAddTipo = async () => {
    if (!newTipoName.trim() || !selectedCatForTipo) return;
    try { 
      await api.post('/tipos', { nome: newTipoName, categoria_id: selectedCatForTipo }); 
      setNewTipoName(''); 
      loadTipos(selectedCatForTipo); 
      toast.success('Tipo adicionado!'); 
    }
    catch (err) { toast.error(err.response?.data?.message || 'Erro ao adicionar tipo.'); }
  };

  const handleDeleteTipo = async (tipo) => {
    const ok = await confirm({
      title: 'Excluir Tipo?',
      message: `Tem certeza que deseja excluir "${tipo.nome}"?`,
      confirmLabel: 'Excluir',
      variant: 'danger'
    });
    if (!ok) return;
    try { 
      await api.delete(`/tipos/${tipo.id}`); 
      loadTipos(selectedCatForTipo); 
      toast.success('Tipo excluído!');
    }
    catch (err) { toast.error(err.response?.data?.message || 'Erro ao excluir tipo.'); }
  };

  if (user?.tipo !== 'Administrador') {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <AlertCircle size={56} className="mb-4" style={{ color: 'var(--accent)' }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-main)' }}>Acesso Negado</h2>
        <p style={{ color: 'var(--text-sub)' }}>Você precisa ser um administrador para acessar as configurações.</p>
      </div>
    );
  }

  const cardCls = "rounded-2xl border p-6";
  const cardStyle = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--card-shadow)' };

  return (
    <div className="max-w-6xl mx-auto pb-12">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
            ⚙️ Configurações
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-sub)' }}>
            Personalização, usuários e categorias do sistema
          </p>
        </div>
      </div>

      {/* ─── SEÇÃO: Identidade Visual ─── */}
      <div className={`${cardCls} mb-8 relative overflow-hidden`} style={cardStyle}>
        {/* Decoração */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5 -mr-20 -mt-20"
          style={{ backgroundColor: 'var(--accent)' }} />

        <h3 className="text-lg font-bold flex items-center gap-2 mb-6" style={{ color: 'var(--text-main)' }}>
          <Palette size={20} style={{ color: 'var(--accent)' }} /> Identidade Visual
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Nome do Sistema */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-sub)' }}>
              Nome do Sistema
            </label>
            <input
              type="text"
              value={localConfig.nome_sistema}
              onChange={e => setLocalConfig(p => ({ ...p, nome_sistema: e.target.value }))}
              placeholder="Ex: Almoxarifado Central"
              className="input-base"
            />
          </div>

          {/* Nome de Suporte */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-sub)' }}>
              Nome do Responsável (Suporte)
            </label>
            <input
              type="text"
              value={localConfig.nome_suporte}
              onChange={e => setLocalConfig(p => ({ ...p, nome_suporte: e.target.value }))}
              placeholder="Ex: João da Silva"
              className="input-base"
            />
          </div>

          {/* WhatsApp Admin / Notificações */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-sub)' }}>
              <span className="inline-flex items-center gap-1"><Phone size={12} /> WhatsApp do Admin (Notificações)</span>
            </label>
            <input
              type="text"
              value={localConfig.whatsapp_notificacao || localConfig.whatsapp_admin}
              onChange={e => setLocalConfig(p => ({ ...p, whatsapp_admin: e.target.value, whatsapp_notificacao: e.target.value }))}
              placeholder="Ex: 5565999999999"
              className="input-base"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-sub)' }}>DDI + DDD + Número, só números.</p>
          </div>

          {/* Email suporte */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-sub)' }}>
              <span className="inline-flex items-center gap-1"><Mail size={12} /> E-mail de Contato</span>
            </label>
            <input
              type="email"
              value={localConfig.email_suporte}
              onChange={e => setLocalConfig(p => ({ ...p, email_suporte: e.target.value }))}
              placeholder="Ex: contato@empresa.com"
              className="input-base"
            />
          </div>

          {/* Emoji / Logo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-sub)' }}>
              <span className="inline-flex items-center gap-1"><Brush size={12} /> Ícone do Sistema</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setLocalConfig(p => ({ ...p, logo_emoji: emoji }))}
                  className="text-2xl w-12 h-12 rounded-xl transition-all flex items-center justify-center border-2"
                  style={{
                    borderColor: localConfig.logo_emoji === emoji ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: localConfig.logo_emoji === emoji ? 'var(--accent-light)' : 'var(--input-bg)',
                    boxShadow: localConfig.logo_emoji === emoji ? '0 0 0 3px var(--accent-light)' : 'none',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Cor do Tema */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-sub)' }}>
              Cor do Tema
            </label>
            <div className="flex flex-wrap gap-3">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setLocalConfig(p => ({ ...p, cor_primaria: c.value }))}
                  title={c.label}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: localConfig.cor_primaria === c.value ? c.hex : 'var(--border)',
                    boxShadow: localConfig.cor_primaria === c.value ? `0 0 0 3px ${c.hex}33` : 'none',
                    backgroundColor: 'var(--input-bg)',
                  }}
                >
                  <div className="w-7 h-7 rounded-full shadow-sm" style={{ backgroundColor: c.hex }} />
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--text-sub)' }}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--input-bg)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-sub)' }}>Preview</p>
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-nav)' }}>
            <span className="text-2xl">{localConfig.logo_emoji}</span>
            <span className="font-bold text-white">{localConfig.nome_sistema || 'Inventário Pro'}</span>
            <div className="ml-auto flex gap-2">
              {COLOR_OPTIONS.filter(c => c.value === localConfig.cor_primaria).map(c => (
                <span key={c.value} className="text-xs text-white/60 font-medium">{c.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Botão salvar */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveAllConfigs}
            disabled={savingConfig}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Save size={18} />
            {savingConfig ? 'Salvando...' : 'Salvar Identidade Visual'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">

        {/* ─── Gestão de Usuários ─── */}
        <div className="xl:col-span-3 space-y-4">
          <div className={cardCls} style={cardStyle}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <Users size={20} style={{ color: 'var(--accent)' }} /> Usuários
              </h3>
              <button
                onClick={() => setShowUserForm(!showUserForm)}
                className="text-white px-4 py-2 rounded-xl transition flex items-center gap-2 text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <UserPlus size={16} /> Novo Usuário
              </button>
            </div>

            {showUserForm && (
              <div className="mb-5 p-4 rounded-xl border" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)' }}>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Nome Completos" value={newUser.nome} onChange={e => setNewUser({ ...newUser, nome: e.target.value })} required className="input-base" />
                  <input placeholder="Login (usuário)" value={newUser.usuario} onChange={e => setNewUser({ ...newUser, usuario: e.target.value })} required className="input-base" />
                  <input type="email" placeholder="E-mail" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required className="input-base" />
                  <input type="password" placeholder="Senha inicial" value={newUser.senha} onChange={e => setNewUser({ ...newUser, senha: e.target.value })} required className="input-base" />
                  <select value={newUser.tipo} onChange={e => setNewUser({ ...newUser, tipo: e.target.value })} className="input-base">
                    <option value="Funcionário">Funcionário</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" disabled={loading} className="flex-1 text-white rounded-xl py-2.5 font-bold transition disabled:opacity-50 text-sm" style={{ backgroundColor: 'var(--accent)' }}>Criar</button>
                    <button type="button" onClick={() => setShowUserForm(false)} className="flex-1 border rounded-xl py-2.5 font-bold text-sm hover:opacity-80 transition" style={{ borderColor: 'var(--border)', color: 'var(--text-sub)' }}>Cancelar</button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ borderBottom: `2px solid var(--border)` }}>
                    <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-sub)' }}>Nome</th>
                    <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-sub)' }}>Login</th>
                    <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-sub)' }}>Nível</th>
                    <th className="pb-3 text-right text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-sub)' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: `1px solid var(--border)` }} className="hover:opacity-80 transition group">
                      <td className="py-3 text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: 'var(--accent)' }}>
                            {u.nome.charAt(0).toUpperCase()}
                          </div>
                          {u.nome} {u.id === user.id && <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>Você</span>}
                        </div>
                      </td>
                      <td className="py-3 text-sm" style={{ color: 'var(--text-sub)' }}>{u.usuario}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${u.tipo === 'Administrador' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                          {u.tipo}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setPasswordModal(u)} title="Trocar Senha" className="p-1.5 rounded-lg hover:bg-violet-50 transition" style={{ color: 'var(--accent)' }}>
                            <KeyRound size={16} />
                          </button>
                          <button onClick={() => handleDeleteUser(u)} disabled={u.id === user.id} title="Excluir" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 disabled:opacity-20 transition">
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

        {/* ─── Categorias e Tipos ─── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Categorias */}
          <div className={cardCls} style={cardStyle}>
            <h3 className="text-base font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-main)' }}>
              <Tag size={18} style={{ color: 'var(--accent)' }} /> Categorias
            </h3>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Nova categoria..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} className="input-base" />
              <button onClick={handleAddCategory} className="text-white px-3 rounded-xl font-bold transition flex items-center flex-shrink-0" style={{ backgroundColor: 'var(--accent)' }}>
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <span key={cat.id} className="group flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition cursor-default border" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent-light)' }}>
                  {cat.nome}
                  <button onClick={() => handleDeleteCategory(cat)} className="hover:text-red-500 transition ml-1 leading-none opacity-60 hover:opacity-100">&times;</button>
                </span>
              ))}
              {categories.length === 0 && <p className="text-xs" style={{ color: 'var(--text-sub)' }}>Nenhuma categoria.</p>}
            </div>
          </div>

          {/* Tipos */}
          <div className={cardCls} style={cardStyle}>
            <h3 className="text-base font-bold flex items-center gap-2 mb-1" style={{ color: 'var(--text-main)' }}>
              <Layers size={18} style={{ color: 'var(--accent)' }} /> Tipos por Categoria
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-sub)' }}>Selecione uma categoria para gerenciar seus tipos.</p>
            <div className="relative mb-4">
              <select value={selectedCatForTipo} onChange={e => setSelectedCatForTipo(e.target.value)} className="input-base appearance-none pr-8">
                <option value="">Escolha a categoria...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-sub)' }} />
            </div>

            {selectedCatForTipo && (
              <>
                <div className="flex gap-2 mb-4">
                  <input type="text" placeholder="Novo tipo..." value={newTipoName} onChange={e => setNewTipoName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTipo()} className="input-base" />
                  <button onClick={handleAddTipo} className="text-white px-3 rounded-xl font-bold transition flex items-center flex-shrink-0" style={{ backgroundColor: 'var(--accent)' }}>
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tipos.length === 0
                    ? <p className="text-xs" style={{ color: 'var(--text-sub)' }}>Nenhum tipo nesta categoria.</p>
                    : tipos.map(t => (
                      <span key={t.id} className="group flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition cursor-default border" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent-light)' }}>
                        {t.nome}
                        <button onClick={() => handleDeleteTipo(t)} className="hover:text-red-500 transition ml-1 leading-none opacity-60 hover:opacity-100">&times;</button>
                      </span>
                    ))
                  }
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {passwordModal && (
        <PasswordModal
          user={passwordModal}
          onClose={() => setPasswordModal(null)}
          onSuccess={loadData}
          toast={toast}
        />
      )}
      {ConfirmModal}
    </div>
  );
}
