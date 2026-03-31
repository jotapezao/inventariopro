import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import CadastroProduto from '../pages/CadastroProduto';
import Configuracoes from '../pages/Configuracoes';
import NovaSolicitacao from '../pages/NovaSolicitacao';
import GerenciarSolicitacoes from '../pages/GerenciarSolicitacoes';
import SolicitacaoPublica from '../pages/SolicitacaoPublica';
import { Layout } from '../components/Layout';

const PrivateRoute = ({ children }) => {
  const { signed, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return signed ? children : <Navigate to="/login" />;
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rota pública de solicitação — sem login necessário */}
        <Route path="/solicitar" element={<SolicitacaoPublica />} />

        {/* Dashboard público */}
        <Route path="/" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />

        {/* Rotas Privadas */}
        <Route path="/cadastrar-produto" element={
          <PrivateRoute>
            <Layout>
              <CadastroProduto />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/configuracoes" element={
          <PrivateRoute>
            <Layout>
              <Configuracoes />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/solicitar-saida" element={
          <PrivateRoute>
            <Layout>
              <NovaSolicitacao />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/gerenciar-solicitacoes" element={
          <PrivateRoute>
            <Layout>
              <GerenciarSolicitacoes />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};
