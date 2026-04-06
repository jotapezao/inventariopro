import { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Image as ImageIcon, CheckCircle, RefreshCcw } from 'lucide-react';

export function EditProductModal({ product, onClose, onSuccess }) {
  const [nome, setNome] = useState(product?.nome || '');
  const [categoriaId, setCategoriaId] = useState(product?.categoria_id || '');
  const [tipoId, setTipoId] = useState(product?.tipo_id || '');
  const [codigo, setCodigo] = useState(product?.codigo || '');
  const [unidade, setUnidade] = useState(product?.unidade || '');
  const [localizacao, setLocalizacao] = useState(product?.localizacao || '');
  const [foto, setFoto] = useState(null);
  const getInitialPreview = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `/${path}`;
  };

  const [preview, setPreview] = useState(getInitialPreview(product?.foto));
  
  const [categories, setCategories] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
    if (product?.categoria_id) {
      loadTipos(product.categoria_id);
    }
  }, [product]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categorias');
      setCategories(res.data);
    } catch (e) { console.error(e); }
  };

  const loadTipos = async (catId) => {
    try {
      const res = await api.get(`/tipos?categoria_id=${catId}`);
      setTipos(res.data);
    } catch (e) { console.error(e); }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('categoria_id', categoriaId);
    formData.append('tipo_id', tipoId);
    formData.append('codigo', codigo);
    formData.append('unidade', unidade);
    formData.append('localizacao', localizacao);
    if (foto) {
      formData.append('foto', foto);
    }

    try {
      await api.put(`/produtos/${product.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao atualizar produto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300 my-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
            <ImageIcon className="text-indigo-600" size={24} /> Editar Produto
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Foto Section */}
            <div className="flex flex-col items-center">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 w-full">Imagem do Produto</label>
              <div className="relative group w-full aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center gap-2">
                    <ImageIcon size={48} />
                    <span className="text-xs font-medium">Sem imagem</span>
                  </div>
                )}
                
                <label className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="font-bold flex items-center gap-2">
                    <RefreshCcw size={18} /> Alterar Foto
                  </span>
                  <input type="file" onChange={handleFotoChange} className="hidden" accept="image/*" />
                </label>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-tighter">Clique na imagem para trocar</p>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nome do Produto *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Código (Referência)</label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Categoria *</label>
              <select
                value={categoriaId}
                onChange={(e) => { setCategoriaId(e.target.value); loadTipos(e.target.value); }}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="">Selecione...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tipo</label>
              <select
                value={tipoId}
                onChange={(e) => setTipoId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="">Selecione...</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Localização</label>
              <input
                type="text"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Ex: Prateleira A-1"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Unidade *</label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="">Selecione...</option>
                <option value="Un">Unidade (Un)</option>
                <option value="Cx">Caixa (Cx)</option>
                <option value="Kg">Quilo (Kg)</option>
                <option value="M">Metro (M)</option>
                <option value="L">Litro (L)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCcw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
