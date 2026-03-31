import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { Camera, Upload, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CadastroProduto() {
  const defaultFormData = {
    nome: '',
    categoria_id: '',
    tipo_id: '',
    codigo: '',
    quantidade: '0',
    unidade: 'unidade',
    localizacao: ''
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [categories, setCategories] = useState([]);
  const [tipos, setTipos] = useState([]);

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [modoCamera, setModoCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const loadCategories = async () => {
    try {
      const response = await api.get('/categorias');
      setCategories(response.data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const loadTipos = async (categoria_id) => {
    if (!categoria_id) {
      setTipos([]);
      return;
    }
    try {
      const response = await api.get(`/tipos?categoria_id=${categoria_id}`);
      setTipos(response.data);
    } catch (error) {
      console.error("Erro ao carregar tipos:", error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'categoria_id') {
      setFormData(prev => ({ ...prev, categoria_id: value, tipo_id: '' }));
      loadTipos(value);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Comprimir imagem via canvas antes de usar
      compressImage(file);
      setModoCamera(false);
    }
  };

  const compressImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Reduzir resolução máxima para economizar armazenamento
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressed = new File([blob], 'foto.jpg', { type: 'image/jpeg' });
            setFoto(compressed);
            setPreview(URL.createObjectURL(compressed));
          }
        }, 'image/jpeg', 0.5); // qualidade 50% para economizar espaço
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setModoCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { max: 800 }, height: { max: 600 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Erro ao acessar a câmera. Tente enviar um arquivo.');
      setModoCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setModoCamera(false);
  };

  const tirarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'foto-camera.jpg', { type: 'image/jpeg' });
          setFoto(file);
          setPreview(URL.createObjectURL(file));
          stopCamera();
        }
      }, 'image/jpeg', 0.5); // qualidade reduzida
    }
  };

  const handleSubmit = async (e, actionType = 'back') => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') data.append(key, formData[key]);
      });

      if (foto) {
        data.append('foto', foto);
      }

      await api.post('/produtos', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Produto cadastrado com sucesso!');

      if (actionType === 'continue') {
        setFormData(defaultFormData);
        setFoto(null);
        setPreview(null);
        setTipos([]);
        window.scrollTo(0, 0);
      } else {
        setTimeout(() => navigate('/'), 2000);
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao cadastrar produto.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Cadastrar Novo Produto</h2>

      {success && <div className="mb-4 bg-green-100 p-3 rounded text-green-700 flex items-center"><CheckCircle className="mr-2" />{success}</div>}
      {error && <div className="mb-4 bg-red-100 p-3 rounded text-red-700 flex items-center"><XCircle className="mr-2" />{error}</div>}

      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 1. Categoria — primeiro */}
          <div>
            <label className={labelCls}>Categoria *</label>
            <div className="relative">
              <select
                name="categoria_id"
                value={formData.categoria_id}
                onChange={handleInputChange}
                required
                className={inputCls + " appearance-none pr-8"}
              >
                <option value="">Selecione a categoria...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* 2. Tipo — dependente da categoria */}
          <div>
            <label className={labelCls}>
              Tipo <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <select
                name="tipo_id"
                value={formData.tipo_id}
                onChange={handleInputChange}
                disabled={!formData.categoria_id}
                className={inputCls + " appearance-none pr-8 disabled:bg-gray-50 disabled:text-gray-400"}
              >
                <option value="">
                  {formData.categoria_id ? 'Selecione o tipo...' : 'Selecione uma categoria primeiro'}
                </option>
                {tipos.map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* 3. Nome do Produto */}
          <div className="md:col-span-2">
            <label className={labelCls}>Nome do Produto *</label>
            <input
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              required
              placeholder="Ex: Lâmpada LED 9W"
              className={inputCls}
            />
          </div>

          {/* 4. Código Interno */}
          <div>
            <label className={labelCls}>Código Interno <span className="text-gray-400 font-normal">(Opcional)</span></label>
            <input name="codigo" value={formData.codigo} onChange={handleInputChange} className={inputCls} />
          </div>

          {/* 5. Localização */}
          <div>
            <label className={labelCls}>Localização no Estoque</label>
            <input name="localizacao" value={formData.localizacao} onChange={handleInputChange} className={inputCls} placeholder="Ex: Prateleira A2" />
          </div>

          {/* 6. Quantidade + Unidade */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className={labelCls}>Estoque Inicial</label>
              <input name="quantidade" type="number" min="0" value={formData.quantidade} onChange={handleInputChange} className={inputCls} />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Unidade *</label>
              <select name="unidade" value={formData.unidade} onChange={handleInputChange} className={inputCls}>
                <option value="unidade">Unidade</option>
                <option value="metro">Metro</option>
                <option value="caixa">Caixa</option>
                <option value="kg">Kg</option>
                <option value="litro">Litro</option>
                <option value="rolo">Rolo</option>
                <option value="saco">Saco</option>
              </select>
            </div>
          </div>
        </div>

        {/* Foto */}
        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foto do Produto <span className="text-gray-400 font-normal text-xs">(Comprimida automaticamente para economizar espaço)</span>
          </label>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex space-x-2">
              <button type="button" onClick={startCamera} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-md font-medium flex items-center transition text-sm">
                <Camera className="mr-2 h-4 w-4" /> Abrir Câmera
              </button>
              <label className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-md font-medium flex items-center cursor-pointer transition text-sm">
                <Upload className="mr-2 h-4 w-4" /> Enviar Arquivo
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {preview && !modoCamera && (
              <div className="relative">
                <img src={preview} alt="Preview" className="h-32 w-32 object-cover rounded shadow" />
                <button type="button" onClick={() => { setPreview(null); setFoto(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                  <XCircle size={16} />
                </button>
              </div>
            )}
          </div>

          {modoCamera && (
            <div className="mt-4 border p-2 rounded bg-gray-50 flex flex-col items-center">
              <video ref={videoRef} autoPlay playsInline className="max-h-64 object-cover rounded mb-4" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex space-x-4">
                <button type="button" onClick={tirarFoto} className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 font-bold">Capturar Foto</button>
                <button type="button" onClick={stopCamera} className="bg-red-500 text-white px-6 py-2 rounded shadow hover:bg-red-600">Cancelar</button>
              </div>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row justify-end pt-5 gap-3 border-t border-gray-100">
          <button type="button" onClick={() => navigate('/')} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
            Voltar
          </button>
          <button type="button" onClick={(e) => handleSubmit(e, 'continue')} disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar e Continuar'}
          </button>
          <button type="button" onClick={(e) => handleSubmit(e, 'back')} disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </div>
      </form>
    </div>
  );
}
