import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Search, Plus, Minus, FileBox, RefreshCcw, LogIn, PackageMinus, PackagePlus, ChevronDown, Filter } from 'lucide-react';
import { MovementsModal } from '../components/MovementsModal';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { signed } = useContext(AuthContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Filtros
  const [categories, setCategories] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalType, setModalType] = useState('entrada');

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
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('busca', search);
      if (filterCategoria) params.append('categoria_id', filterCategoria);
      if (filterTipo) params.append('tipo_id', filterTipo);
      const response = await api.get(`/produtos?${params.toString()}`);
      setProducts(response.data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, filterCategoria, filterTipo]);

  const handleCategoriaChange = (e) => {
    setFilterCategoria(e.target.value);
    setFilterTipo('');
    loadTipos(e.target.value);
  };

  const openModal = (product, type) => {
    setSelectedProduct(product);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleMovementSuccess = () => {
    setIsModalOpen(false);
    loadProducts();
  };

  const selectCls = "bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none pr-7";

  return (
    <div>
      {/* Cabeçalho com botões públicos para não logados */}
      {!signed && (
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-white">
            <h2 className="text-xl font-bold">Almoxarifado — Acesso Público</h2>
            <p className="text-blue-100 text-sm mt-1">Faça uma solicitação sem precisar de login. O Admin aprovará seu pedido.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => navigate('/solicitar?tipo=saida')}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold px-5 py-2.5 rounded-lg transition"
            >
              <PackageMinus size={20} />
              Solicitar Saída
            </button>
            <button
              onClick={() => navigate('/solicitar?tipo=entrada')}
              className="flex items-center gap-2 bg-white font-bold px-5 py-2.5 rounded-lg text-blue-700 hover:bg-blue-50 transition shadow"
            >
              <PackagePlus size={20} />
              Registrar Entrada
            </button>
          </div>
        </div>
      )}

      {/* Cabeçalho logado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold flex items-center text-gray-800">
          <FileBox className="mr-2" /> Estoque de Materiais
        </h1>

        <div className="flex bg-white items-center border border-gray-300 rounded-md px-3 py-2 w-full sm:w-auto shadow-sm">
          <Search className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none w-full sm:w-56"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
        <Filter size={16} className="text-gray-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-600">Filtrar:</span>

        <div className="relative">
          <select value={filterCategoria} onChange={handleCategoriaChange} className={selectCls}>
            <option value="">Todas as Categorias</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>

        {filterCategoria && (
          <div className="relative">
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className={selectCls}>
              <option value="">Todos os Tipos</option>
              {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        )}

        {(filterCategoria || filterTipo || search) && (
          <button
            onClick={() => { setFilterCategoria(''); setFilterTipo(''); setSearch(''); setTipos([]); }}
            className="text-xs text-red-500 hover:text-red-700 font-medium underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center my-20">
          <RefreshCcw className="animate-spin text-blue-600 h-8 w-8" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {(!products || products.length === 0) ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum produto encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria / Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                    {signed && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {product.foto ? (
                              <img className="h-10 w-10 rounded object-cover" src={`/${product.foto}`} alt={product.nome} />
                            ) : (
                              <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-500">
                                <FileBox size={20} />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.nome}</div>
                            {product.codigo && <div className="text-xs text-gray-400">#{product.codigo}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{product.categoria_nome || '—'}</div>
                        {product.tipo_nome && (
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{product.tipo_nome}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.localizacao || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.quantidade > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {product.quantidade} {product.unidade}
                        </span>
                      </td>
                      {signed && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => openModal(product, 'entrada')} className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded transition-colors" title="Registrar Entrada">
                              <Plus size={16} />
                            </button>
                            <button onClick={() => openModal(product, 'saida')} className="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded transition-colors" title="Registrar Saída">
                              <Minus size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <MovementsModal
          product={selectedProduct}
          type={modalType}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleMovementSuccess}
        />
      )}
    </div>
  );
}
