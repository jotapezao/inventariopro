import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AppConfigContext = createContext({});

const EMOJI_OPTIONS = ['📦', '🏗️', '🔧', '🏢', '📋', '🏛️', '⚙️', '🛠️', '📊', '🗂️'];
const COLOR_OPTIONS = [
  { value: 'violet', label: 'Violet', hex: '#7c3aed' },
  { value: 'indigo', label: 'Indigo', hex: '#4f46e5' },
  { value: 'emerald', label: 'Esmeralda', hex: '#059669' },
  { value: 'rose', label: 'Rosa', hex: '#e11d48' },
  { value: 'amber', label: 'Âmbar', hex: '#d97706' },
];

export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState({
    nome_sistema: 'Inventário Pro',
    logo_emoji: '📦',
    cor_primaria: 'violet',
    whatsapp_admin: '',
    whatsapp_notificacao: '',
    nome_suporte: 'Suporte',
    email_suporte: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/configuracoes')
      .then(res => {
        setConfig(prev => ({ ...prev, ...res.data }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Aplicar tema no <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.cor_primaria || 'violet');
    document.title = config.nome_sistema || 'Inventário Pro';
  }, [config.cor_primaria, config.nome_sistema]);

  const refreshConfig = () => {
    api.get('/configuracoes').then(res => setConfig(prev => ({ ...prev, ...res.data }))).catch(() => {});
  };

  return (
    <AppConfigContext.Provider value={{ config, setConfig, refreshConfig, loading, EMOJI_OPTIONS, COLOR_OPTIONS }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  return useContext(AppConfigContext);
}
