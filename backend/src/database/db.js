const { Pool } = require('pg');
require('dotenv').config();

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

    // Inserir Admin inicial ou atualizar a senha
    const bcrypt = require('bcrypt');
    const hashedPass = await bcrypt.hash('admin', 10);
    await client.query(`
      INSERT INTO Usuarios (nome, usuario, email, senha, tipo) 
      VALUES ('Administrador', 'admin', 'admin@sistema.com', $1, 'Administrador')
      ON CONFLICT (usuario) DO UPDATE SET senha = EXCLUDED.senha
    `, [hashedPass]);
    console.log('Verificação e reset de usuário admin concluída.');

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

    // Tabela Tipos (subtipo por categoria)
    await client.query(`
      CREATE TABLE IF NOT EXISTS Tipos (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        categoria_id INTEGER NOT NULL REFERENCES Categorias(id) ON DELETE CASCADE,
        UNIQUE(nome, categoria_id)
      )
    `);

    // Inserir tipos padrão se a tabela estiver vazia
    const tipoCheck = await client.query("SELECT COUNT(*) FROM Tipos");
    if (parseInt(tipoCheck.rows[0].count) === 0) {
      const catRows = await client.query("SELECT id, nome FROM Categorias");
      const catMap = {};
      catRows.rows.forEach(r => { catMap[r.nome] = r.id; });

      const defaultTipos = [
        { nome: 'Lâmpada', cat: 'Elétrica' },
        { nome: 'Disjuntor', cat: 'Elétrica' },
        { nome: 'DPS', cat: 'Elétrica' },
        { nome: 'Fio/Cabo', cat: 'Elétrica' },
        { nome: 'Refletor', cat: 'Elétrica' },
        { nome: 'Cano', cat: 'Hidráulica' },
        { nome: 'Joelho', cat: 'Hidráulica' },
        { nome: 'Cotovelo', cat: 'Hidráulica' },
        { nome: 'TE', cat: 'Hidráulica' },
        { nome: 'Registro', cat: 'Hidráulica' },
        { nome: 'Cimento', cat: 'Construção' },
        { nome: 'Tinta', cat: 'Construção' },
        { nome: 'Estrutura', cat: 'Construção' },
        { nome: 'Tijolo', cat: 'Construção' },
        { nome: 'Ferramenta Manual', cat: 'Ferramentas' },
        { nome: 'Ferramenta Elétrica', cat: 'Ferramentas' },
        { nome: 'EPI', cat: 'Ferramentas' },
        { nome: 'Geral', cat: 'Outros' },
      ];

      for (const t of defaultTipos) {
        if (catMap[t.cat]) {
          await client.query(
            "INSERT INTO Tipos (nome, categoria_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [t.nome, catMap[t.cat]]
          );
        }
      }
    }

    // Tabela Produtos com tipo_id
    await client.query(`
      CREATE TABLE IF NOT EXISTS Produtos (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        categoria_id INTEGER REFERENCES Categorias(id),
        tipo_id INTEGER REFERENCES Tipos(id),
        codigo TEXT,
        quantidade INTEGER DEFAULT 0,
        unidade TEXT NOT NULL,
        localizacao TEXT,
        foto TEXT,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migração segura: adicionar tipo_id se não existir
    await client.query(`
      ALTER TABLE Produtos ADD COLUMN IF NOT EXISTS tipo_id INTEGER REFERENCES Tipos(id)
    `);

    // Tabela Movimentacoes
    await client.query(`
      CREATE TABLE IF NOT EXISTS Movimentacoes (
        id SERIAL PRIMARY KEY,
        produto_id INTEGER NOT NULL REFERENCES Produtos(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'saida')),
        quantidade INTEGER NOT NULL,
        usuario_id INTEGER REFERENCES Usuarios(id),
        nome_solicitante TEXT,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migração segura: adicionar nome_solicitante em Movimentacoes
    await client.query(`
      ALTER TABLE Movimentacoes ADD COLUMN IF NOT EXISTS nome_solicitante TEXT
    `);

    // Tabela Solicitacoes com suporte a pedidos sem login
    await client.query(`
      CREATE TABLE IF NOT EXISTS Solicitacoes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES Usuarios(id),
        nome_solicitante TEXT,
        tipo_solicitacao TEXT NOT NULL DEFAULT 'saida',
        status TEXT NOT NULL DEFAULT 'pendente',
        observacao TEXT,
        data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_aprovacao TIMESTAMP,
        aprovado_por INTEGER REFERENCES Usuarios(id)
      )
    `);

    // Migrações seguras para Solicitacoes
    await client.query(`ALTER TABLE Solicitacoes ALTER COLUMN usuario_id DROP NOT NULL`).catch(e => console.log('Aviso (usuario_id null):', e.message));
    await client.query(`ALTER TABLE Solicitacoes ADD COLUMN IF NOT EXISTS nome_solicitante TEXT`);
    await client.query(`ALTER TABLE Solicitacoes ADD COLUMN IF NOT EXISTS tipo_solicitacao TEXT DEFAULT 'saida'`);

    // Migração para Produtos (adicionar categoria_id se nao existir e remover restrição se houver)
    await client.query(`ALTER TABLE Produtos ADD COLUMN IF NOT EXISTS categoria_id INTEGER REFERENCES Categorias(id)`).catch(e => console.log('Aviso (Produtos):', e.message));
    // Correção para quem ainda tem a coluna "categoria" da versão anterior
    await client.query(`ALTER TABLE Produtos ALTER COLUMN categoria DROP NOT NULL`).catch(e => console.log('Aviso (Produtos categoria nullable):', e.message));

    // Tabela ItensSolicitacao com campos para entrada livre (produto novo)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ItensSolicitacao (
        id SERIAL PRIMARY KEY,
        solicitacao_id INTEGER NOT NULL REFERENCES Solicitacoes(id) ON DELETE CASCADE,
        produto_id INTEGER REFERENCES Produtos(id) ON DELETE CASCADE,
        nome_produto_livre TEXT,
        categoria_livre TEXT,
        tipo_livre TEXT,
        foto TEXT,
        quantidade INTEGER NOT NULL
      )
    `);

    // Migrações seguras para ItensSolicitacao
    await client.query(`ALTER TABLE ItensSolicitacao ADD COLUMN IF NOT EXISTS nome_produto_livre TEXT`);
    await client.query(`ALTER TABLE ItensSolicitacao ADD COLUMN IF NOT EXISTS categoria_livre TEXT`);
    await client.query(`ALTER TABLE ItensSolicitacao ADD COLUMN IF NOT EXISTS tipo_livre TEXT`);
    await client.query(`ALTER TABLE ItensSolicitacao ADD COLUMN IF NOT EXISTS foto TEXT`);
    // Tabela Configuracoes
    await client.query(`
      CREATE TABLE IF NOT EXISTS Configuracoes (
        id SERIAL PRIMARY KEY,
        chave TEXT UNIQUE NOT NULL,
        valor TEXT
      )
    `);

    // Inserir configurações padrão
    const defaultConfigs = [
      ['whatsapp_notificacao', ''],
      ['whatsapp_admin', ''],
      ['nome_sistema', 'Inventário Pro'],
      ['logo_emoji', '📦'],
      ['cor_primaria', 'violet'],
      ['nome_suporte', 'Suporte'],
      ['email_suporte', ''],
    ];
    for (const [chave, valor] of defaultConfigs) {
      await client.query(
        `INSERT INTO Configuracoes (chave, valor) VALUES ($1, $2) ON CONFLICT (chave) DO NOTHING`,
        [chave, valor]
      );
    }

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

createTables().catch(err => console.error(err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
