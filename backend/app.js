require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./src/database/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const fs = require('fs');

// Criar pastas de upload se não existirem
const uploadDirs = ['uploads/produtos', 'uploads/solicitacoes'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Rotas Base
app.get('/api', (req, res) => {
  res.json({ message: 'API do Inventário rodando!' });
});

// Rotas
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const movementRoutes = require('./src/routes/movementRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const solicitationRoutes = require('./src/routes/solicitationRoutes');
const typeRoutes = require('./src/routes/typeRoutes');
const configRoutes = require('./src/routes/configRoutes');
const statsRoutes = require('./src/routes/statsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/produtos', productRoutes);
app.use('/api/movimentacoes', movementRoutes);
app.use('/api/categorias', categoryRoutes);
app.use('/api/solicitacoes', solicitationRoutes);
app.use('/api/tipos', typeRoutes);
app.use('/api/configuracoes', configRoutes);
app.use('/api/stats', statsRoutes);

// SERVIR FRONTEND
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    res.status(404).json({ message: 'API Route not found' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
