import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, User, ClipboardList, AlertCircle, RefreshCw } from 'lucide-react';

export default function GerenciarSolicitacoes() {
  const { user } = useContext(AuthContext);
  const [solicitations, setSolicitations] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pendente');
  const [globalWhatsapp, setGlobalWhatsapp] = useState('');
  const [successWhatsappUrl, setSuccessWhatsappUrl] = useState('');

  useEffect(() => {
    loadSolicitations();
    api.get('/config/whatsapp_notificacao')
      .then(res => setGlobalWhatsapp(res.data?.valor || ''))
      .catch(() => {});
  }, [activeTab]);

  const loadSolicitations = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/solicitacoes?status=${activeTab}`);
      setSolicitations(response.data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar solicitações.');
    } finally {
      setLoading(false);
    }
  };

  const handleDetails = async (id) => {
    if (selectedRequest?.id === id) return setSelectedRequest(null);
    try {
      const response = await api.get(`/solicitacoes/${id}`);
      setSelectedRequest(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    if (!window.confirm(`Tem certeza que deseja ${status === 'aprovada' ? 'aprovar' : 'rejeitar'} esta solicitação?`)) return;
    
    setActionLoading(true);
    try {
      await api.put(`/solicitacoes/${id}/status`, { status });
      
      if (status === 'aprovada' && globalWhatsapp && selectedRequest) {
        const numToUse = globalWhatsapp.replace(/\D/g, '');
        if (numToUse) {
          const itensTexto = selectedRequest.itens?.map(i => `- ${i.nome} (${i.quantidade} ${i.unidade || ''})`).join('\n') || '';
          const msg = `✅ *Solicitação Aprovada (#${id})*\n\n*Solicitante:* ${selectedRequest.requerente}\n*Tipo:* ${selectedRequest.tipo_solicitacao?.toUpperCase() || 'SAÍDA'}\n*Itens:*\n${itensTexto}\n\n_Registrado via API_`;
          const url = `https://wa.me/${numToUse}?text=${encodeURIComponent(msg)}`;
          setSuccessWhatsappUrl(url);
        }
      }

      setSelectedRequest(null);
      loadSolicitations();
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao processar solicitação.');
    } finally {
      setActionLoading(false);
    }
  };

  if (user?.tipo !== 'Administrador') {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Acesso Negado</h2>
        <p className="text-gray-600 mt-2">Apenas administradores podem gerenciar solicitações.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <ClipboardList className="text-blue-600 mr-3" size={32} />
          <h2 className="text-3xl font-extrabold text-gray-800">Gerenciar Aprovações</h2>
        </div>
        <button onClick={loadSolicitations} className="text-gray-400 hover:text-blue-600 transition">
          <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-8">
        {['pendente', 'aprovada', 'rejeitada'].map(status => (
          <button 
            key={status}
            onClick={() => setActiveTab(status)}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition border-b-2 ${activeTab === status ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            {status === 'pendente' ? 'Pendentes' : status === 'aprovada' ? 'Aprovadas' : 'Rejeitadas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Carregando solicitações...</div>
      ) : solicitations.length === 0 ? (
        <div className="py-20 text-center text-gray-400 bg-white rounded-xl border-2 border-dashed">Nenhuma solicitação encontrada nesta categoria.</div>
      ) : (
        <div className="space-y-4">
          {solicitations.map(s => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div 
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
                onClick={() => handleDetails(s.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${s.status === 'pendente' ? 'bg-orange-100 text-orange-600' : s.status === 'aprovada' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Solicitação #{s.id} - {s.requerente}</h4>
                    <span className="text-xs text-gray-400">{new Date(s.data_solicitacao).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase">{s.status}</span>
                  {selectedRequest?.id === s.id ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {selectedRequest?.id === s.id && (
                <div className="p-6 bg-gray-50 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Detalhes e Itens */}
                    <div>
                      <h5 className="text-sm font-bold text-gray-700 uppercase mb-4 tracking-widest border-b pb-1">Observação do Funcionário</h5>
                      <p className="text-gray-600 text-sm italic mb-6">"{s.observacao}"</p>
                      
                      <h5 className="text-sm font-bold text-gray-700 uppercase mb-4 tracking-widest border-b pb-1">Itens Solicitados</h5>
                      <div className="space-y-2">
                        {selectedRequest.itens?.map(item => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 text-sm">
                            <span className="font-medium">{item.nome}</span>
                            <div className="flex gap-4">
                               <span className="text-gray-400 text-xs">Estoque Atual: {item.estoque_atual}</span>
                               <span className="font-bold text-blue-600">{item.quantidade} {item.unidade}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ações da Solicitação */}
                    {s.status === 'pendente' && (
                      <div className="bg-white p-6 rounded-xl shadow-inner flex flex-col justify-center border-l-4 border-blue-500">
                        <h5 className="text-center font-bold text-gray-800 mb-6">Decisão do Administrador</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button 
                            disabled={actionLoading}
                            onClick={() => updateStatus(s.id, 'aprovada')}
                            className="bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center hover:bg-green-700 transition shadow-lg shadow-green-100 disabled:opacity-50"
                          >
                            <CheckCircle size={20} className="mr-2" /> Aprovar Saída
                          </button>
                          <button 
                            disabled={actionLoading}
                            onClick={() => updateStatus(s.id, 'rejeitada')}
                            className="bg-white border-2 border-red-500 text-red-500 font-bold py-4 rounded-xl flex items-center justify-center hover:bg-red-50 transition disabled:opacity-50"
                          >
                            <XCircle size={20} className="mr-2" /> Rejeitar
                          </button>
                        </div>
                        <p className="text-center text-[10px] text-gray-400 mt-4 uppercase font-bold tracking-widest">Ao aprovar, o sistema baixará automaticamente o estoque dos itens listados.</p>
                      </div>
                    )}

                    {s.status !== 'pendente' && (
                      <div className="p-6 bg-white rounded-xl border border-gray-100 flex items-center">
                        <div className="flex-1">
                          <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Processado pelo Admin</span>
                          <span className="text-sm font-bold text-gray-700">Em {new Date(s.data_aprovacao).toLocaleString('pt-BR')}</span>
                        </div>
                        <CheckCircle className={s.status === 'aprovada' ? 'text-green-500' : 'text-red-500'} size={32} />
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Sucesso / Confirmação do WhatsApp */}
      {successWhatsappUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-500 bg-opacity-75">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-lg w-full p-6 text-center animate-in fade-in zoom-in duration-200">
             <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                 <span className="text-3xl">✅</span>
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">Solicitação Aprovada!</h3>
             <p className="text-sm text-gray-500 mb-6">Deseja enviar o comprovante desta operação via WhatsApp para o número configurado do administrador?</p>
             <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    window.open(successWhatsappUrl, '_blank', 'noopener,noreferrer');
                    setSuccessWhatsappUrl('');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-md"
                >
                  Enviar WhatsApp
                </button>
                <button
                  onClick={() => setSuccessWhatsappUrl('')}
                  className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-lg transition"
                >
                  Agora Não
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
