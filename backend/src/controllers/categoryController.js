const db = require('../database/db');

// Listar categorias
exports.getCategories = (req, res) => {
  db.all('SELECT * FROM Categorias ORDER BY nome ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Criar categoria
exports.createCategory = (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ message: 'Nome da categoria é obrigatório.' });

  db.run('INSERT INTO Categorias (nome) VALUES (?)', [nome], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ message: 'Esta categoria já existe.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, nome });
  });
};

// Deletar categoria
exports.deleteCategory = (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM Categorias WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Categoria não encontrada.' });
    res.json({ message: 'Categoria excluída com sucesso.' });
  });
};
