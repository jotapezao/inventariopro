import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Search, Plus, Minus, FileBox, RefreshCcw, LogIn, PackageMinus, PackagePlus, ChevronDown, Filter, Download, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { MovementsModal } from '../components/MovementsModal';
import { EditProductModal } from '../components/EditProductModal';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalType, setModalType] = useState('entrada');
  const [selectedImage, setSelectedImage] = useState(null);
  const [importing, setImporting] = useState(false);

  // Ordenação
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

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

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleMovementSuccess = () => {
    setIsModalOpen(false);
    loadProducts();
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    // Tratamento especial para nomes de categorias/tipos que vêm de joins
    if (sortConfig.key === 'categoria') aVal = a.categoria_nome;
    if (sortConfig.key === 'categoria') bVal = b.categoria_nome;
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-indigo-500" /> 
      : <ArrowDown size={14} className="ml-1 text-indigo-500" />;
  };

  const handleDeleteProduct = async (id, nome) => {
    if (window.confirm(`Tem certeza que deseja excluir permanentemente o produto "${nome}"? Esta ação não pode ser desfeita.`)) {
      try {
        await api.delete(`/produtos/${id}`);
        loadProducts();
      } catch (err) {
        alert('Erro ao excluir produto: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const exportToCSV = () => {
    if (!products || products.length === 0) return;
    
    // Cabeçalhos (adicionando BOM para acentos abrirem corretamente no Excel)
    let csvContent = '\uFEFF';
    
    csvContent += 'ID;Nome do Produto;Código;Categoria;Tipo;Localização;Quantidade;Unidade\n';
    
    products.forEach(p => {
      const nome = p.nome ? p.nome.replace(/;/g, ',') : '';
      const codigo = p.codigo || '';
      const categoria = p.categoria_nome || '';
      const tipo = p.tipo_nome || '';
      const loc = p.localizacao ? p.localizacao.replace(/;/g, ',') : '';
      
      csvContent += `${p.id};${nome};${codigo};${categoria};${tipo};${loc};${p.quantidade};${p.unidade}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'estoque_materiais.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n').map(row => row.split(';'));
        
        if (rows.length < 2) {
          alert('Planilha vazia ou com formato incorreto.');
          return;
        }

        const headers = rows[0].map(h => h.trim().toLowerCase());
        const dataRows = rows.slice(1);

        const productsToImport = dataRows.map(row => {
          if (row.length < 2) return null;
          
          const getVal = (search) => {
            const idx = headers.findIndex(h => h.includes(search));
            return idx !== -1 ? row[idx]?.trim() : '';
          };

          return {
            nome: getVal('nome'),
            codigo: getVal('código'),
            categoria_nome: getVal('categoria'),
            tipo_nome: getVal('tipo'),
            localizacao: getVal('localização'),
            quantidade: getVal('quantidade') || 0,
            unidade: getVal('unidade')
          };
        }).filter(p => p && p.nome && p.categoria_nome);

        if (productsToImport.length === 0) {
          alert('Nenhum produto válido encontrado. Verifique as colunas (Nome, Categoria, Unidade).');
          return;
        }

        const response = await api.post('/produtos/importar', { products: productsToImport });
        alert(`Importação concluída!\nSucessos: ${response.data.successCount}\nErros: ${response.data.errors.length}`);
        loadProducts();
      } catch (err) {
        console.error(err);
        alert('Erro ao processar planilha: ' + (err.response?.data?.message || err.message));
      } finally {
        setImporting(false);
        e.target.value = ''; // Reset input
      }
    };

    reader.readAsText(file);
  };

  const selectCls = "bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none pr-7";

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // Remove caminhos absolutos do servidor se existirem (correção para deploys anteriores)
    const cleanPath = path.replace(/.*\/uploads\//, 'uploads/');
    return `/${cleanPath}`;
  };

  return (
    <div>
      {/* Cabeçalho com botões públicos para não logados */}
      {!signed && (
        <div className="mb-6 bg-gradient-to-br from-slate-800 to-indigo-900 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row gap-6 items-center justify-between relative overflow-hidden">
          {/* Light flare effect */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-indigo-500 blur-[80px] opacity-20 pointer-events-none"></div>

          <div className="text-white z-10 w-full text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Almoxarifado Aberto</h2>
            <p className="text-indigo-200 text-sm mt-1 sm:mt-2">Faça sua solicitação rapidamente sem uso de senha.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 w-full sm:w-auto z-10">
            <button
              onClick={() => navigate('/solicitar?tipo=saida')}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-3 rounded-xl transition backdrop-blur-sm w-full sm:w-auto hover:shadow-lg"
            >
              <PackageMinus size={20} />
              Solicitar Material
            </button>
            <button
              onClick={() => navigate('/solicitar?tipo=entrada')}
              className="flex items-center justify-center gap-2 bg-white font-bold px-6 py-3 rounded-xl text-indigo-900 hover:bg-indigo-50 hover:shadow-lg transition shadow-md w-full sm:w-auto hover:-translate-y-0.5"
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

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex bg-white items-center border border-gray-200 hover:border-gray-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 rounded-xl px-4 py-2.5 w-full sm:w-auto shadow-sm transition-all duration-200">
            <Search className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none w-full sm:w-56"
            />
          </div>
          {signed && (
            <div className="flex gap-2">
              {/* Importador Escondido */}
              <input 
                type="file" 
                id="csvImport" 
                accept=".csv" 
                className="hidden" 
                onChange={handleImportCSV}
                disabled={importing}
              />
              <button 
                onClick={() => document.getElementById('csvImport').click()}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                title="Importar Planilha"
                disabled={importing}
              >
                {importing ? <RefreshCcw size={18} className="animate-spin" /> : <Plus size={18} />}
                <span className="hidden sm:inline">Importar CSV</span>
              </button>

              <button 
                onClick={exportToCSV}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 hover:-translate-y-0.5 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
                title="Exportar Estoque"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Exportar Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {(!products || products.length === 0) ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum produto encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('nome')}
                    >
                      <div className="flex items-center">Produto {getSortIcon('nome')}</div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('categoria')}
                    >
                      <div className="flex items-center">Categoria / Tipo {getSortIcon('categoria')}</div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('quantidade')}
                    >
                      <div className="flex items-center">Estoque {getSortIcon('quantidade')}</div>
                    </th>
                    {signed && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {sortedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {product.foto ? (
                              <img 
                                className="h-10 w-10 rounded object-cover shadow-sm cursor-zoom-in hover:opacity-80 transition-opacity" 
                                src={getImageUrl(product.foto)} 
                                alt={product.nome} 
                                onClick={() => setSelectedImage(getImageUrl(product.foto))}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-100">
                                <FileBox size={18} />
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
                            <button onClick={() => openModal(product, 'entrada')} className="bg-green-50 text-green-600 hover:bg-green-600 hover:text-white p-2.5 rounded-lg transition-all" title="Registrar Entrada">
                              <Plus size={18} />
                            </button>
                            <button onClick={() => openModal(product, 'saida')} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-2.5 rounded-lg transition-all" title="Registrar Saída">
                              <Minus size={18} />
                            </button>
                            <button onClick={() => openEditModal(product)} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white p-2.5 rounded-lg transition-all" title="Editar Produto">
                              <Pencil size={18} />
                            </button>
                            <button onClick={() => handleDeleteProduct(product.id, product.nome)} className="bg-red-100 text-red-600 hover:bg-red-600 hover:text-white p-2.5 rounded-lg transition-all" title="Excluir Produto">
                              <Trash2 size={18} />
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
      {isEditModalOpen && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => { setIsEditModalOpen(false); loadProducts(); }}
        />
      )}

      {/* Modal de Zoom de Imagem */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Zoom" 
              className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-300" 
            />
            <button 
              className="absolute top-[-40px] right-0 text-white hover:text-gray-300 font-bold flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg backdrop-blur-md"
              onClick={() => setSelectedImage(null)}
            >
               Fechar [X]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
