import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { RefreshCcw, History, ArrowDownToLine, ArrowUpToLine, FileBox } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

export default function HistoricoMovimentacoes() {
  const { signed } = useContext(AuthContext);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/movimentacoes');
      setMovimentacoes(response.data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold flex items-center text-gray-800">
          <History className="mr-2 h-6 w-6 text-blue-600" /> Histórico de Movimentações
        </h1>
        <button 
          onClick={loadMovements}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg transition"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
        {loading ? (
          <div className="flex justify-center p-12">
            <RefreshCcw className="animate-spin text-blue-600 h-8 w-8" />
          </div>
        ) : movimentacoes.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <FileBox size={40} className="mb-3 text-gray-300" />
            <p>Nenhuma movimentação registrada no sistema.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável/Solicitante</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movimentacoes.map((mov) => {
                  const isEntrada = mov.tipo === 'entrada';
                  const dateFormated = new Date(mov.data).toLocaleString('pt-BR');
                  return (
                    <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dateFormated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-l border-transparent hover:border-blue-500">
                        {mov.produto_nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          isEntrada ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isEntrada ? <ArrowDownToLine size={12} className="mr-1" /> : <ArrowUpToLine size={12} className="mr-1" />}
                          {isEntrada ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">
                        {isEntrada ? '+' : '-'}{mov.quantidade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {mov.usuario_nome || mov.nome_solicitante || 'Aprovado pelo Sistema'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
