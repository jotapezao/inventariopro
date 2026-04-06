import { useState, useEffect } from 'react';
import api from '../services/api';

export function MovementsModal({ product, type, onClose, onSuccess }) {
  const [quantidade, setQuantidade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [globalWhatsapp, setGlobalWhatsapp] = useState('');

  useEffect(() => {
    api.get('/config/whatsapp_notificacao')
      .then(res => setGlobalWhatsapp(res.data?.valor || ''))
      .catch(() => {});
  }, []);

  const isEntrada = type === 'entrada';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!quantidade || parseInt(quantidade) <= 0) {
      setError('Por favor, insira uma quantidade válida.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/movimentacoes', {
        produto_id: product.id,
        tipo,
        quantidade: parseInt(quantidade)
      });
      
      if (globalWhatsapp) {
        const numToUse = globalWhatsapp.replace(/\D/g, '');
        if (numToUse) {
          const msg = `📦 *Nova Movimentação de Estoque*\n\n*Tipo:* ${isEntrada ? 'Entrada' : 'Saída'}\n*Produto:* ${product.nome}\n*Quantidade:* ${quantidade} ${product.unidade}\n\n_Registrado via API_`;
          const url = `https://wa.me/${numToUse}?text=${encodeURIComponent(msg)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao registrar movimentação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
               <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${isEntrada ? 'bg-green-100' : 'bg-red-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                     <span className={`text-xl font-bold ${isEntrada ? 'text-green-600' : 'text-red-600'}`}>
                       {isEntrada ? '+' : '-'}
                     </span>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                     <h3 className="text-lg leading-6 font-medium text-gray-900">
                       Registrar {isEntrada ? 'Entrada' : 'Saída'} - {product.nome}
                     </h3>
                     <div className="mt-2">
                       <p className="text-sm text-gray-500">
                          Estoque atual: <strong>{product.quantidade} {product.unidade}</strong>
                       </p>

                       {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                          <div className="mt-1 flex rounded-md shadow-sm">
                            <input 
                              type="number" 
                              min="1"
                              className="flex-1 block w-full border border-gray-300 rounded-none rounded-l-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              value={quantidade}
                              onChange={e => setQuantidade(e.target.value)}
                              required
                            />
                            {!isEntrada && (
                              <button
                                type="button"
                                onClick={() => setQuantidade(product.quantidade.toString())}
                                className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 transition"
                              >
                                Tudo
                              </button>
                            )}
                            {isEntrada && <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">{product.unidade}</span>}
                          </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${isEntrada ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-base font-medium text-white focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50`}
              >
                {loading ? 'Processando...' : 'Confirmar'}
              </button>
              <button 
                type="button" 
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
