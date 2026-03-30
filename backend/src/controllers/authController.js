const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

// Registro de usuário (Idealmente protegido para que apenas Admin possa criar outros)
exports.register = async (req, res) => {
  const { nome, usuario, email, senha, tipo } = req.body;
  
  if (!nome || !usuario || !email || !senha || !tipo) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);

    db.run(
      'INSERT INTO Usuarios (nome, usuario, email, senha, tipo) VALUES (?, ?, ?, ?, ?)',
      [nome, usuario, email, hashedPassword, tipo],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
             return res.status(400).json({ message: 'Usuário ou e-mail já existe.' });
          }
          return res.status(500).json({ message: 'Erro ao registrar usuário.', error: err.message });
        }
        res.status(201).json({ message: 'Usuário registrado com sucesso', id: this.lastID });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Erro interno.', error: err.message });
  }
};

// Login
exports.login = (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
      return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
  }

  db.get('SELECT * FROM Usuarios WHERE usuario = ? OR email = ?', [usuario, usuario], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Erro no banco de dados', error: err.message });
    if (!user) return res.status(400).json({ message: 'Usuário não encontrado.' });

    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) return res.status(400).json({ message: 'Senha inválida.' });

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, tipo: user.tipo, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user.id, nome: user.nome, usuario: user.usuario, tipo: user.tipo } });
  });
};

// Rota auxiliar para criar o primeiro administrador
exports.setupInitialAdmin = async (req, res) => {
  db.get('SELECT COUNT(*) as count FROM Usuarios', async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row.count > 0) return res.status(400).json({ message: 'Sistema já possui usuários.' });

    const { nome, usuario, email, senha } = req.body;
    
    if(!senha) return res.status(400).json({ message: 'Precisa enviar a senha' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);

    db.run(
      'INSERT INTO Usuarios (nome, usuario, email, senha, tipo) VALUES (?, ?, ?, ?, ?)',
      [nome || 'Admin', usuario || 'admin', email || 'admin@admin.com', hashedPassword, 'Administrador'],
      function (err) {
         if (err) return res.status(500).json({ error: err.message });
         res.status(201).json({ message: 'Primeiro admin criado com sucesso.' });
      }
    );
  });
};

// Listar todos os usuários (Admin apenas)
exports.getUsers = (req, res) => {
  db.all('SELECT id, nome, usuario, email, tipo, data_criacao FROM Usuarios ORDER BY nome ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Deletar usuário (Admin apenas)
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  
  // Impede de deletar a si mesmo (opcional, mas recomendado)
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'Você não pode excluir seu próprio usuário.' });
  }

  db.run('DELETE FROM Usuarios WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json({ message: 'Usuário excluído com sucesso.' });
  });
};
