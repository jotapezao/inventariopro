const { Pool } = require('pg');
require('dotenv').config();

// Configuração do Pool de conexão (Railway fornece DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tabela Usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS Usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        usuario TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        tipo TEXT NOT NULL,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela Categorias
    await client.query(`
      CREATE TABLE IF NOT EXISTS Categorias (
        id SERIAL PRIMARY KEY,
        nome TEXT UNIQUE NOT NULL
      )
    `);

    // Inserir categorias padrão se a tabela estiver vazia
    const catCheck = await client.query("SELECT COUNT(*) FROM Categorias");
    if (parseInt(catCheck.rows[0].count) === 0) {
      const defaultCategories = ['Elétrica', 'Hidráulica', 'Construção', 'Ferramentas', 'Outros'];
      for (const cat of defaultCategories) {
        await client.query("INSERT INTO Categorias (nome) VALUES ($1)", [cat]);
      }
    }

    // Tabela Produtos
    await client.query(`
      CREATE TABLE IF NOT EXISTS Produtos (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        categoria TEXT NOT NULL,
        codigo TEXT,
        quantidade INTEGER DEFAULT 0,
        unidade TEXT NOT NULL,
        localizacao TEXT,
        foto TEXT,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela Movimentacoes
    await client.query(`
      CREATE TABLE IF NOT EXISTS Movimentacoes (
        id SERIAL PRIMARY KEY,
        produto_id INTEGER NOT NULL REFERENCES Produtos(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'saida')),
        quantidade INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL REFERENCES Usuarios(id),
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela Solicitacoes
    await client.query(`
      CREATE TABLE IF NOT EXISTS Solicitacoes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES Usuarios(id),
        status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente', 'aprovada', 'rejeitada')),
        observacao TEXT,
        data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_aprovacao TIMESTAMP,
        aprovado_por INTEGER REFERENCES Usuarios(id)
      )
    `);

    // Tabela ItensSolicitacao
    await client.query(`
      CREATE TABLE IF NOT EXISTS ItensSolicitacao (
        id SERIAL PRIMARY KEY,
        solicitacao_id INTEGER NOT NULL REFERENCES Solicitacoes(id) ON DELETE CASCADE,
        produto_id INTEGER NOT NULL REFERENCES Produtos(id) ON DELETE CASCADE,
        quantidade INTEGER NOT NULL
      )
    `);

    await client.query('COMMIT');
    console.log('Tabelas PostgreSQL verificadas/criadas com sucesso.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar tabelas:', e);
    throw e;
  } finally {
    client.release();
  }
};

// Inicializa as tabelas na primeira execução
createTables().catch(err => console.error(err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
