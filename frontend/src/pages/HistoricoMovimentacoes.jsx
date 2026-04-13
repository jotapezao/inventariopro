import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import {
  RefreshCcw, History, ArrowDownToLine, ArrowUpToLine,
  FileBox, Filter, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

export default function HistoricoMovimentacoes() {
  const { signed } = useContext(AuthContext);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterTipo, setFilterTipo] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');

  // Paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 30;

  const loadMovements = async (currentPage = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', LIMIT);
      if (filterTipo) params.append('tipo', filterTipo);
      if (filterDataInicio) params.append('data_inicio', filterDataInicio);
      if (filterDataFim) params.append('data_fim', filterDataFim);

      const response = await api.get(`/movimentacoes?${params.toString()}`);

      // Suporta tanto resposta paginada ({ data, total, totalPages }) quanto array simples (retrocompatível)
      if (Array.isArray(response.data)) {
        setMovimentacoes(response.data);
        setTotalPages(1);
        setTotal(response.data.length);
      } else {
        setMovimentacoes(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadMovements(1);
  }, [filterTipo, filterDataInicio, filterDataFim]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadMovements(newPage);
  };

  const clearFilters = () => {
    setFilterTipo('');
    setFilterDataInicio('');
    setFilterDataFim('');
  };

  const hasFilters = filterTipo || filterDataInicio || filterDataFim;

  const inputCls = "bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all";

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center text-gray-800">
            <History className="mr-2 h-6 w-6 text-indigo-600" /> Histórico de Movimentações
          </h1>
          {total > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={() => loadMovements(page)}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl transition shadow-sm"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 text-gray-500 self-center">
            <Filter size={16} />
            <span className="text-sm font-medium">Filtros:</span>
          </div>

          {/* Tipo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</label>
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              <option value="entrada">✅ Entradas</option>
              <option value="saida">📤 Saídas</option>
            </select>
          </div>

          {/* Data início */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">De</label>
            <input
              type="date"
              value={filterDataInicio}
              onChange={e => setFilterDataInicio(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Data fim */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Até</label>
            <input
              type="date"
              value={filterDataFim}
              onChange={e => setFilterDataFim(e.target.value)}
              className={inputCls}
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold underline self-end pb-2"
            >
              <X size={14} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-16">
            <RefreshCcw className="animate-spin text-indigo-500 h-8 w-8" />
          </div>
        ) : movimentacoes.length === 0 ? (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center gap-3">
            <FileBox size={48} className="text-gray-200" />
            <p className="font-medium">Nenhuma movimentação encontrada.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-indigo-500 hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Quantidade</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Responsável</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {movimentacoes.map((mov) => {
                  const isEntrada = mov.tipo === 'entrada';
                  // Compatível com data ou created_at
                  const rawDate = mov.data || mov.created_at;
                  const dateStr = rawDate
                    ? new Date(rawDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                    : '—';
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dateStr}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                        {mov.produto_nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isEntrada
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {isEntrada
                            ? <ArrowDownToLine size={12} />
                            : <ArrowUpToLine size={12} />}
                          {isEntrada ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-extrabold ${isEntrada ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isEntrada ? '+' : '-'}{mov.quantidade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mov.usuario_nome || mov.nome_solicitante || 'Sistema'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50">
            <p className="text-xs text-gray-500">
              Página <span className="font-bold text-gray-700">{page}</span> de <span className="font-bold text-gray-700">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
