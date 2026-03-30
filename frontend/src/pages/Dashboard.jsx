import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Search, Plus, Minus, FileBox, RefreshCcw } from 'lucide-react';
import { MovementsModal } from '../components/MovementsModal';

export default function Dashboard() {
  const { signed } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalType, setModalType] = useState('entrada'); // entrada | saida

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/produtos?busca=${search}`);
      setProducts(response.data);
    } catch (error) {
       console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search]);

  const openModal = (product, type) => {
    setSelectedProduct(product);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleMovementSuccess = () => {
    setIsModalOpen(false);
    loadProducts(); // recarrega a lista
  };

  return (
    <div>
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
         <h1 className="text-2xl font-bold flex items-center text-gray-800">
           <FileBox className="mr-2" /> Estoque de Materiais
         </h1>
         
         <div className="flex bg-white items-center border border-gray-300 rounded-md px-3 py-2 w-full sm:w-auto shadow-sm">
            <Search className="h-5 w-5 text-gray-400 mr-2" />
            <input 
               type="text" 
               placeholder="Buscar por nome ou código..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="outline-none w-full sm:w-64"
            />
         </div>
       </div>

       {loading ? (
         <div className="flex justify-center my-20">
            <RefreshCcw className="animate-spin text-blue-600 h-8 w-8" />
         </div>
       ) : (
         <div className="bg-white rounded-lg shadow overflow-hidden">
           {products.length === 0 ? (
             <div className="p-8 text-center text-gray-500">
                Nenhum produto encontrado.
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                     {signed && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>}
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {products.map((product) => (
                     <tr key={product.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           <div className="flex-shrink-0 h-10 w-10 relative">
                              {product.foto ? (
                                <img className="h-10 w-10 rounded object-cover" src={`/${product.foto}`} alt={product.nome} />
                              ) : (
                                <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-500">
                                   <FileBox size={20}/>
                                </div>
                              )}
                           </div>
                           <div className="ml-4">
                             <div className="text-sm font-medium text-gray-900">{product.nome}</div>
                             <div className="text-sm text-gray-500">{product.localizacao}</div>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.codigo}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.categoria}</td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.quantidade > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                           {product.quantidade} {product.unidade}
                         </span>
                       </td>
                       {signed && (
                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                               <button 
                                 onClick={() => openModal(product, 'entrada')}
                                 className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded transition-colors"
                                 title="Registrar Entrada"
                               >
                                  <Plus size={16}/>
                               </button>
                               <button 
                                 onClick={() => openModal(product, 'saida')}
                                 className="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded transition-colors"
                                 title="Registrar Saída"
                               >
                                  <Minus size={16}/>
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

       {/* Componente Modal */}
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
