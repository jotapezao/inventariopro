import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, ShoppingCart, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NovaSolicitacao() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [basket, setBasket] = useState([]);
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim()) loadProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const loadProducts = async () => {
    try {
      const response = await api.get(`/produtos?busca=${search}`);
      setProducts(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addToBasket = (product) => {
    const exists = basket.find(item => item.produto_id === product.id);
    if (exists) return;
    
    setBasket([...basket, { 
      produto_id: product.id, 
      nome: product.nome, 
      unidade: product.unidade,
      estoque: product.quantidade,
      quantidade: 1 
    }]);
  };

  const removeFromBasket = (id) => {
    setBasket(basket.filter(item => item.produto_id !== id));
  };

  const updateQuantity = (id, qtd) => {
    setBasket(basket.map(item => 
      item.produto_id === id ? { ...item, quantidade: Math.max(1, parseInt(qtd) || 0) } : item
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (basket.length === 0) return setError('Adicione ao menos um item.');
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('/solicitacoes', {
        observacao,
        itens: basket.map(item => ({ produto_id: item.produto_id, quantidade: item.quantidade }))
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-10 bg-white rounded-xl shadow-lg text-center border-t-4 border-green-500">
        <CheckCircle className="mx-auto text-green-500 h-16 w-16 mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Solicitação Enviada!</h2>
        <p className="text-gray-600">Sua solicitação foi registrada com sucesso e aguarda aprovação do administrador.</p>
        <p className="text-sm text-gray-400 mt-6 italic">Redirecionando para o início...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center mb-8">
        <ShoppingCart className="text-blue-600 mr-3" size={32} />
        <h2 className="text-3xl font-extrabold text-gray-800">Nova Solicitação de Saída</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lado Esquerdo: Busca e Seleção */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-700 mb-4">1. Buscar Itens</h3>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Pesquisar grampo, fita, material..." 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
              {products.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition group">
                  <div>
                    <span className="block font-medium text-gray-800 group-hover:text-blue-700">{p.nome}</span>
                    <span className="text-xs text-gray-400">Saldo: {p.quantidade} {p.unidade}</span>
                  </div>
                  <button 
                    onClick={() => addToBasket(p)}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-xs font-bold hover:bg-blue-600 hover:text-white transition"
                  >
                    Selecionar
                  </button>
                </div>
              ))}
              {search && products.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Nenhum resultado.</p>}
            </div>
          </div>
        </div>

        {/* Lado Direito: Cesta e Observação */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border border-blue-50">
            <h3 className="text-lg font-bold text-gray-700 mb-4">2. Itens Selecionados</h3>
            
            {basket.length === 0 ? (
              <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                Sua cesta está vazia.
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {basket.map(item => (
                  <div key={item.produto_id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex-1">
                      <span className="text-sm font-bold text-gray-800">{item.nome}</span>
                      <span className="block text-xs text-blue-500">Disponível: {item.estoque}</span>
                    </div>
                    <div className="w-24">
                      <input 
                        type="number" 
                        className="w-full text-center border rounded py-1"
                        value={item.quantidade}
                        onChange={e => updateQuantity(item.produto_id, e.target.value)}
                      />
                    </div>
                    <button type="button" onClick={() => removeFromBasket(item.produto_id)} className="text-red-400 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 border-t pt-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Observações / Requerente</label>
              <textarea 
                rows="3" 
                placeholder="Ex: Saída para obra Central - Nome: João da Silva"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                required
              ></textarea>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                <AlertTriangle size={16} className="mr-2" /> {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || basket.length === 0}
              className="w-full mt-6 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Confirmar Solicitação'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
