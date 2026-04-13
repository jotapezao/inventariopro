import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import {
  Search, Trash2, CheckCircle, AlertTriangle,
  PackageMinus, PackagePlus, ChevronDown, User, ArrowLeft, Camera, Image as ImageIcon
} from 'lucide-react';

export default function SolicitacaoPublica() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const tipo = searchParams.get('tipo') || 'saida'; // 'saida' ou 'entrada'

  const isSaida = tipo === 'saida';

  const [nomeSolicitante, setNomeSolicitante] = useState('');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Para SAÍDA: busca e seleção de produtos existentes
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [basket, setBasket] = useState([]);

  // Para ENTRADA: produto novo (com selects de categoria e tipo)
  const [entradaItens, setEntradaItens] = useState([
    { nome_produto_livre: '', categoria_id: '', categoria_livre: '', tipo_id: '', tipo_livre: '', quantidade: 1, foto: null, preview: null }
  ]);
  const [tiposPorItem, setTiposPorItem] = useState([[]]); // array de arrays por item


  const [adminPhone, setAdminPhone] = useState(null);

  useEffect(() => {
    loadCategories();
    api.get('/configuracoes').then(res => {
      // Fallback: busca whatsapp_notificacao se whatsapp_admin estiver vazio
      const phone = res.data?.whatsapp_admin || res.data?.whatsapp_notificacao;
      setAdminPhone(phone);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isSaida) loadProducts();
  }, [search, filterCategoria, filterTipo]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categorias');
      setCategories(res.data);
    } catch (e) { console.error(e); }
  };

  const loadTipos = async (categoria_id) => {
    if (!categoria_id) { setTipos([]); return; }
    try {
      const res = await api.get(`/tipos?categoria_id=${categoria_id}`);
      setTipos(res.data);
    } catch (e) { console.error(e); }
  };

  const loadProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('busca', search);
      if (filterCategoria) params.append('categoria_id', filterCategoria);
      if (filterTipo) params.append('tipo_id', filterTipo);
      const res = await api.get(`/produtos?${params.toString()}`);
      setProducts(res.data);
    } catch (e) { console.error(e); }
  };

  const handleCategoriaChange = (e) => {
    setFilterCategoria(e.target.value);
    setFilterTipo('');
    loadTipos(e.target.value);
  };

  // Saída: cesta
  const addToBasket = (product) => {
    if (basket.find(i => i.produto_id === product.id)) return;
    setBasket([...basket, {
      produto_id: product.id,
      nome: product.nome,
      unidade: product.unidade,
      estoque: product.quantidade,
      quantidade: 1
    }]);
  };

  const removeFromBasket = (id) => setBasket(basket.filter(i => i.produto_id !== id));
  const updateQty = (id, qtd) => setBasket(basket.map(i =>
    i.produto_id === id ? { ...i, quantidade: Math.max(1, parseInt(qtd) || 1) } : i
  ));

  // Entrada: itens
  const addEntradaItem = () => {
    setEntradaItens([...entradaItens, { nome_produto_livre: '', categoria_id: '', categoria_livre: '', tipo_id: '', tipo_livre: '', quantidade: 1, foto: null, preview: null }]);
    setTiposPorItem([...tiposPorItem, []]);
  };
  const removeEntradaItem = (idx) => {
    if (entradaItens.length === 1) return;
    setEntradaItens(entradaItens.filter((_, i) => i !== idx));
    setTiposPorItem(tiposPorItem.filter((_, i) => i !== idx));
  };
  const updateEntradaItem = (idx, field, value) => {
    setEntradaItens(entradaItens.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const handleEntradaCategoria = async (idx, categoriaId) => {
    const cat = categories.find(c => String(c.id) === String(categoriaId));
    setEntradaItens(entradaItens.map((item, i) =>
      i === idx ? { ...item, categoria_id: categoriaId, categoria_livre: cat?.nome || '', tipo_id: '', tipo_livre: '' } : item
    ));
    if (categoriaId) {
      try {
        const res = await api.get(`/tipos?categoria_id=${categoriaId}`);
        setTiposPorItem(tiposPorItem.map((t, i) => i === idx ? res.data : t));
      } catch { setTiposPorItem(tiposPorItem.map((t, i) => i === idx ? [] : t)); }
    } else {
      setTiposPorItem(tiposPorItem.map((t, i) => i === idx ? [] : t));
    }
  };
  const handleEntradaTipo = (idx, tipoId) => {
    const t = tiposPorItem[idx]?.find(t => String(t.id) === String(tipoId));
    setEntradaItens(entradaItens.map((item, i) =>
      i === idx ? { ...item, tipo_id: tipoId, tipo_livre: t?.nome || '' } : item
    ));
  };

  const handleFileChange = (idx, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEntradaItens(entradaItens.map((item, i) =>
        i === idx ? { ...item, foto: file, preview: reader.result } : item
      ));
    };
    reader.readAsDataURL(file);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomeSolicitante.trim()) {
      toast.warning('Informe seu nome para continuar.');
      return setError('Informe seu nome para continuar.');
    }

    const itens = isSaida
      ? basket.map(i => ({ produto_id: i.produto_id, quantidade: i.quantidade }))
      : entradaItens.map(i => ({
          nome_produto_livre: i.nome_produto_livre,
          categoria_livre: i.categoria_livre,
          tipo_livre: i.tipo_livre,
          quantidade: i.quantidade
        }));

    if (isSaida && itens.length === 0) {
      toast.warning('Selecione ao menos um produto.');
      return setError('Selecione ao menos um produto.');
    }
    if (!isSaida && entradaItens.every(i => !i.nome_produto_livre.trim())) {
      toast.warning('Informe ao menos um produto.');
      return setError('Informe ao menos um produto.');
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('nome_solicitante', nomeSolicitante);
      formData.append('tipo_solicitacao', tipo);
      formData.append('observacao', observacao);
      
      const itensComHasPhoto = itens.map((it, idx) => ({
        ...it,
        hasPhoto: !!(isSaida ? null : entradaItens[idx].foto)
      }));
      formData.append('itens', JSON.stringify(itensComHasPhoto));

      if (!isSaida) {
        entradaItens.forEach(item => {
          if (item.foto) {
            formData.append('fotos', item.foto);
          }
        });
      }

      await api.post('/solicitacoes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      toast.success('Solicitação enviada com sucesso!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao enviar. Tente novamente.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const buildWhatsappLink = () => {
    if (!adminPhone) return '#';
    const date = new Date().toLocaleString('pt-BR');
    let itemsText = '';
    
    if (isSaida) {
      itemsText = basket.map(i => `- ${i.quantidade}x ${i.nome}`).join('%0A');
    } else {
      itemsText = entradaItens.map(i => `- ${i.quantidade}x ${i.nome_produto_livre}`).join('%0A');
    }

    const text = `*Nova ${isSaida ? 'Solicitação de Saída' : 'Aviso de Entrada'}*%0A`
               + `*Data:* ${date}%0A`
               + `*Nome:* ${nomeSolicitante}%0A`
               + `*Observação:* ${observacao || 'Nenhuma'}%0A%0A`
               + `*Itens:*%0A${itemsText}`;
               
    const cleanPhone = adminPhone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}?text=${text}`;
  };

  const handleFinish = () => {
    const link = buildWhatsappLink();
    if (adminPhone && link !== '#') {
      window.open(link, '_blank');
    }
    navigate('/');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-green-100 animate-in fade-in zoom-in-95 duration-300">
          <CheckCircle className="mx-auto text-green-500 h-20 w-20 mb-6" />
          <h2 className="text-3xl font-extrabold text-gray-800 mb-3 tracking-tight">Solicitação Enviada!</h2>
          <p className="text-gray-600 mb-4 font-medium">
            {isSaida
              ? 'Sua solicitação de saída foi enviada e aguarda aprovação do administrador.'
              : 'Seu aviso de entrada foi enviado e aguarda confirmação do administrador.'}
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-8">O administrador será notificado em breve.</p>
          
          <div className="space-y-3">
            <button 
              onClick={handleFinish} 
              className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Voltar ao Início
            </button>
            <p className="text-[10px] text-gray-400 font-medium">Auto-enviar comprovante ao retornar</p>
          </div>
        </div>
      </div>
    );
  }

  const selectCls = "w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none transition-all";
  const inputCls = "w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topo */}
      <div className={`bg-gradient-to-r ${isSaida ? 'from-red-600 to-rose-700' : 'from-emerald-600 to-teal-700'} text-white py-8 px-4 shadow-md`}>
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/')} className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition backdrop-blur-sm">
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              {isSaida ? <PackageMinus size={28} /> : <PackagePlus size={28} />}
              <h1 className="text-2xl font-bold">
                {isSaida ? 'Solicitação de Saída' : 'Avisar Entrada de Material'}
              </h1>
            </div>
            <p className="text-white/80 text-sm mt-1">
              {isSaida
                ? 'Selecione os itens que deseja retirar. O admin aprovará o pedido.'
                : 'Informe os materiais que chegaram. O admin confirmará a entrada.'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 -mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Nome do solicitante */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <h3 className="font-extrabold text-gray-800 mb-6 flex items-center gap-2 text-lg">
              <User size={20} className="text-indigo-600" /> Identificação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Seu Nome *</label>
                <input
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={nomeSolicitante}
                  onChange={e => setNomeSolicitante(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Para obra da rua Central"
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* SAÍDA: busca de produtos */}
          {isSaida && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Busca */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <h3 className="font-extrabold text-gray-800 mb-6 text-lg">Buscar Produtos</h3>

                {/* Filtros */}
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <select value={filterCategoria} onChange={handleCategoriaChange} className={selectCls + " pr-7"}>
                      <option value="">Categoria</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  {filterCategoria && (
                    <div className="relative flex-1">
                      <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className={selectCls + " pr-7"}>
                        <option value="">Tipo</option>
                        {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                </div>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Pesquisar produto..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {products.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition group">
                      <div>
                        <span className="block text-sm font-medium text-gray-800">{p.nome}</span>
                        <span className="text-xs text-gray-400">
                          {p.categoria_nome}{p.tipo_nome ? ` › ${p.tipo_nome}` : ''} · Saldo: {p.quantidade} {p.unidade}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToBasket(p)}
                        disabled={p.quantidade === 0}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-xs font-bold hover:bg-blue-600 hover:text-white transition disabled:opacity-40"
                      >
                        Selecionar
                      </button>
                    </div>
                  ))}
                  {products.length === 0 && <p className="text-center text-sm text-gray-400 py-4">Nenhum produto.</p>}
                </div>
              </div>

              {/* Cesta */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-50 p-6">
                <h3 className="font-bold text-gray-800 mb-4">Itens Selecionados</h3>

                {basket.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                    Selecione produtos ao lado →
                  </div>
                ) : (
                  <div className="space-y-3">
                    {basket.map(item => (
                      <div key={item.produto_id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex-1">
                          <span className="text-sm font-bold text-gray-800">{item.nome}</span>
                          <span className="block text-xs text-blue-500">Disponível: {item.estoque} {item.unidade}</span>
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            max={item.estoque}
                            className="w-full text-center border rounded py-1 text-sm"
                            value={item.quantidade}
                            onChange={e => updateQty(item.produto_id, e.target.value)}
                          />
                        </div>
                        <button type="button" onClick={() => removeFromBasket(item.produto_id)} className="text-red-400 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ENTRADA: itens com selects */}
          {!isSaida && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-2">Materiais Recebidos</h3>
              <p className="text-sm text-gray-500 mb-4">Informe os materiais que chegaram. O administrador confirmará a entrada.</p>

              <div className="space-y-4">
                {entradaItens.map((item, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Nome do Produto */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nome do Produto *</label>
                        <input
                          type="text"
                          placeholder="Ex: Cano PVC 3/4"
                          value={item.nome_produto_livre}
                          onChange={e => updateEntradaItem(idx, 'nome_produto_livre', e.target.value)}
                          className={inputCls}
                          required
                        />
                      </div>

                      {/* Categoria — select */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
                        <div className="relative">
                          <select
                            value={item.categoria_id}
                            onChange={e => handleEntradaCategoria(idx, e.target.value)}
                            className={selectCls + ' appearance-none pr-8'}
                          >
                            <option value="">Selecione a categoria...</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Tipo — select filtrado por categoria */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                        <div className="relative">
                          <select
                            value={item.tipo_id}
                            onChange={e => handleEntradaTipo(idx, e.target.value)}
                            disabled={!item.categoria_id}
                            className={selectCls + ' appearance-none pr-8 disabled:text-gray-400'}
                          >
                            <option value="">
                              {item.categoria_id ? 'Selecione o tipo...' : 'Selecione uma categoria primeiro'}
                            </option>
                            {(tiposPorItem[idx] || []).map(t => (
                              <option key={t.id} value={t.id}>{t.nome}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Quantidade + Remover */}
                    <div className="flex items-end justify-between gap-3 pt-4">
                      <div className="w-32 sm:w-40">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Qtd *</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={e => updateEntradaItem(idx, 'quantidade', parseInt(e.target.value) || 1)}
                          className={inputCls}
                        />
                      </div>
                      
                      {entradaItens.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeEntradaItem(idx)} 
                          className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all text-xs font-bold border border-red-200"
                        >
                          <Trash2 size={14} /> Remover
                        </button>
                      )}
                    </div>

                    {/* Foto Material / Câmera */}
                    <div className="pt-2 border-t border-gray-100">
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Foto do Material / Comprovante</label>
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="relative flex items-center gap-2 bg-white border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30 px-4 py-3 rounded-xl cursor-pointer transition-all group">
                          <Camera size={20} className="text-gray-400 group-hover:text-indigo-500" />
                          <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-700">Tirar Foto</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            className="hidden" 
                            onChange={e => handleFileChange(idx, e.target.files[0])}
                          />
                        </label>
                        
                        <label className="relative flex items-center gap-2 bg-white border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30 px-4 py-3 rounded-xl cursor-pointer transition-all group">
                          <ImageIcon size={20} className="text-gray-400 group-hover:text-emerald-500" />
                          <span className="text-sm font-medium text-gray-600 group-hover:text-emerald-700">Anexar Galeria</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={e => handleFileChange(idx, e.target.files[0])}
                          />
                        </label>

                        {item.preview && (
                          <div className="relative h-14 w-14 rounded-lg overflow-hidden border-2 border-indigo-500 group">
                            <img src={item.preview} alt="Preview" className="h-full w-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => updateEntradaItem(idx, 'foto', null) || updateEntradaItem(idx, 'preview', null)}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} className="text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addEntradaItem}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                + Adicionar outro produto
              </button>
            </div>
          )}


          {/* Erro */}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Botão submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-extrabold py-5 rounded-2xl shadow-xl transition-all text-white disabled:opacity-50 text-lg hover:-translate-y-0.5
              ${isSaida ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {loading ? 'Enviando...' : isSaida ? '📤 Confirmar Solicitação de Saída' : '📥 Confirmar Aviso de Entrada'}
          </button>
        </form>
      </div>
    </div>
  );
}
