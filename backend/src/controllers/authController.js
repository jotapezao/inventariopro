const db = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Autenticação (Login)
exports.login = async (req, res) => {
  const { usuario, senha } = req.body;

  try {
    const result = await db.query('SELECT * FROM Usuarios WHERE usuario = $1', [usuario]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
    }

    const passwordMatch = await bcrypt.compare(senha, user.senha);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
    }

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, tipo: user.tipo },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, nome: user.nome, usuario: user.usuario, tipo: user.tipo }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Criar Administrador Inicial (Configuração)
exports.setupInitialAdmin = async (req, res) => {
  try {
    const check = await db.query('SELECT * FROM Usuarios WHERE usuario = $1', ['admin']);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Administrador já configurado.' });
    }

    const hashedPass = await bcrypt.hash('admin', 10);
    await db.query(
      'INSERT INTO Usuarios (nome, usuario, email, senha, tipo) VALUES ($1, $2, $3, $4, $5)',
      ['Administrador', 'admin', 'admin@sistema.com', hashedPass, 'Administrador']
    );

    res.status(201).json({ message: 'Administrador inicial criado: admin / admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Gestão de Usuários (Apenas Admin)
exports.getUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT id, nome, usuario, email, tipo, data_criacao FROM Usuarios ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  const { nome, usuario, email, senha, tipo } = req.body;
  try {
    const hashedPass = await bcrypt.hash(senha, 10);
    const result = await db.query(
      'INSERT INTO Usuarios (nome, usuario, email, senha, tipo) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [nome, usuario, email, hashedPass, tipo || 'Funcionário']
    );
    res.status(201).json({ message: 'Usuário criado com sucesso', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  const { id } = req.params;
  const { novaSenha } = req.body;
  if (!novaSenha || novaSenha.length < 4) {
    return res.status(400).json({ message: 'A nova senha deve ter ao menos 4 caracteres.' });
  }
  try {
    const hashedPass = await bcrypt.hash(novaSenha, 10);
    const result = await db.query(
      'UPDATE Usuarios SET senha = $1 WHERE id = $2',
      [hashedPass, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json({ message: 'Senha alterada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM Usuarios WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
