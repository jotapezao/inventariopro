require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./src/database/db'); // Garante que o DB seja inicializado

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Servir arquivos estáticos

// Rotas Base
app.get('/api', (req, res) => {
  res.json({ message: 'API do Inventário rodando!' });
});

// Importar e usar rotas (serão criadas depois)
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const movementRoutes = require('./src/routes/movementRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const solicitationRoutes = require('./src/routes/solicitationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/produtos', productRoutes);
app.use('/api/movimentacoes', movementRoutes);
app.use('/api/categorias', categoryRoutes);
app.use('/api/solicitacoes', solicitationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
