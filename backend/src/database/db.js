const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'inventario.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
    createTables();
  }
});

function createTables() {
  db.serialize(() => {
    // Tabela Usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS Usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        usuario TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        tipo TEXT NOT NULL,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela Categorias
    db.run(`
      CREATE TABLE IF NOT EXISTS Categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE NOT NULL
      )
    `, (err) => {
      if (!err) {
        // Inserir categorias padrão se a tabela estiver vazia
        db.get("SELECT COUNT(*) as count FROM Categorias", (err, row) => {
          if (row && row.count === 0) {
            const defaultCategories = ['Elétrica', 'Hidráulica', 'Construção', 'Ferramentas', 'Outros'];
            const stmt = db.prepare("INSERT INTO Categorias (nome) VALUES (?)");
            defaultCategories.forEach(cat => stmt.run(cat));
            stmt.finalize();
          }
        });
      }
    });

    // Tabela Produtos
    db.run(`
      CREATE TABLE IF NOT EXISTS Produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        categoria TEXT NOT NULL,
        codigo TEXT,
        quantidade INTEGER DEFAULT 0,
        unidade TEXT NOT NULL,
        localizacao TEXT,
        foto TEXT,
        data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela Movimentacoes
    db.run(`
      CREATE TABLE IF NOT EXISTS Movimentacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'saida')),
        quantidade INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        data DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES Produtos (id),
        FOREIGN KEY (usuario_id) REFERENCES Usuarios (id)
      )
    `);

    // Tabela Solicitacoes
    db.run(`
      CREATE TABLE IF NOT EXISTS Solicitacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente', 'aprovada', 'rejeitada')),
        observacao TEXT,
        data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_aprovacao DATETIME,
        aprovado_por INTEGER,
        FOREIGN KEY (usuario_id) REFERENCES Usuarios (id),
        FOREIGN KEY (aprovado_por) REFERENCES Usuarios (id)
      )
    `);

    // Tabela ItensSolicitacao
    db.run(`
      CREATE TABLE IF NOT EXISTS ItensSolicitacao (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        solicitacao_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL,
        FOREIGN KEY (solicitacao_id) REFERENCES Solicitacoes (id),
        FOREIGN KEY (produto_id) REFERENCES Produtos (id)
      )
    `);
  });
}

module.exports = db;
