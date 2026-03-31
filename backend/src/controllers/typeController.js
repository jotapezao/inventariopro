const db = require('../database/db');

// Listar tipos (opcionalmente filtrados por categoria)
exports.getTypes = async (req, res) => {
  const { categoria_id } = req.query;
  try {
    let query = `
      SELECT t.*, c.nome as categoria_nome 
      FROM Tipos t
      LEFT JOIN Categorias c ON t.categoria_id = c.id
    `;
    const params = [];
    if (categoria_id) {
      query += ' WHERE t.categoria_id = $1';
      params.push(categoria_id);
    }
    query += ' ORDER BY t.nome ASC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Criar tipo
exports.createType = async (req, res) => {
  const { nome, categoria_id } = req.body;
  if (!nome || !categoria_id) {
    return res.status(400).json({ message: 'Nome e categoria são obrigatórios.' });
  }
  try {
    const check = await db.query(
      'SELECT id FROM Tipos WHERE nome = $1 AND categoria_id = $2',
      [nome, categoria_id]
    );
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Este tipo já existe nesta categoria.' });
    }
    const result = await db.query(
      'INSERT INTO Tipos (nome, categoria_id) VALUES ($1, $2) RETURNING id',
      [nome, categoria_id]
    );
    res.status(201).json({ message: 'Tipo criado com sucesso', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Deletar tipo
exports.deleteType = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM Tipos WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Tipo não encontrado.' });
    }
    res.json({ message: 'Tipo excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
