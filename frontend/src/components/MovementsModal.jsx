import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAppConfig } from '../contexts/AppConfigContext';

export function MovementsModal({ product, type, onClose, onSuccess }) {
  const { config } = useAppConfig();
  const [quantidade, setQuantidade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successWhatsappUrl, setSuccessWhatsappUrl] = useState('');

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

      const whatsappNumber = config.whatsapp_notificacao || config.whatsapp_admin;
      if (whatsappNumber) {
        const numToUse = whatsappNumber.replace(/\D/g, '');
        if (numToUse) {
          const msg = `📦 *Nova Movimentação de Estoque*\n\n*Tipo:* ${isEntrada ? 'Entrada' : 'Saída'}\n*Produto:* ${product.nome}\n*Quantidade:* ${quantidade} ${product.unidade}\n\n_Registrado via API_`;
          const url = `https://wa.me/${numToUse}?text=${encodeURIComponent(msg)}`;
          setSuccessWhatsappUrl(url);
          return; // Para a execução para mostrar a tela de sucesso
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

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full animate-in fade-in zoom-in-95 duration-200">
          {successWhatsappUrl ? (
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start text-center sm:text-left flex-col items-center">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4 sm:mx-0">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-xl leading-6 font-bold text-gray-900 mb-2">
                  Movimentação Concluída!
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Deseja enviar o comprovante desta operação via WhatsApp para o número configurado do administrador?
                </p>

                <div className="w-full flex gap-3 mt-2 sm:mt-4">
                  <button
                    onClick={() => {
                      window.open(successWhatsappUrl, '_blank', 'noopener,noreferrer');
                      onSuccess();
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-md"
                  >
                    Enviar WhatsApp
                  </button>
                  <button
                    onClick={onSuccess}
                    className="flex-1 border bg-white border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-lg transition"
                  >
                    Agora Não
                  </button>
                </div>
              </div>
            </div>
          ) : (
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

                      <div className="mt-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Quantidade</label>
                        <div className="mt-1 flex rounded-xl shadow-sm overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                          <input
                            type="number"
                            min="1"
                            className="flex-1 block w-full py-2.5 px-4 outline-none sm:text-sm bg-gray-50 focus:bg-white transition-colors"
                            value={quantidade}
                            onChange={e => setQuantidade(e.target.value)}
                            placeholder="Digite a quantidade"
                            required
                          />
                          {!isEntrada && (
                            <button
                              type="button"
                              onClick={() => setQuantidade(product.quantidade.toString())}
                              className="inline-flex items-center px-4 bg-gray-100 text-gray-600 font-medium text-sm hover:bg-gray-200 hover:text-gray-900 transition-colors border-l border-gray-200"
                            >
                              Tudo
                            </button>
                          )}
                          {isEntrada && <span className="inline-flex items-center px-4 bg-gray-100 text-gray-500 text-sm border-l border-gray-200">{product.unidade}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full inline-flex justify-center rounded-xl shadow-sm px-5 py-2.5 ${isEntrada ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-base font-bold text-white transition-all sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 hover:-translate-y-0.5`}
                >
                  {loading ? 'Processando...' : 'Confirmar'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-5 py-2.5 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 transition-all sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
