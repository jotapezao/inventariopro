const db = require('../database/db');

// Criar novo produto
exports.createProduct = (req, res) => {
  const { nome, categoria, codigo, quantidade, unidade, localizacao } = req.body;
  const foto = req.file ? req.file.path.replace(/\\/g, '/') : null;

  if (!nome || !categoria || !unidade) {
    return res.status(400).json({ message: 'Campos obrigatórios: nome, categoria, unidade.' });
  }

  const query = `
    INSERT INTO Produtos (nome, categoria, codigo, quantidade, unidade, localizacao, foto) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [nome, categoria, codigo || '', quantidade || 0, unidade, localizacao, foto], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Produto cadastrado com sucesso', id: this.lastID, foto });
  });
};

// Listar produtos
exports.getProducts = (req, res) => {
  const { busca, categoria } = req.query;
  
  let query = 'SELECT * FROM Produtos WHERE 1=1';
  let params = [];

  if (busca) {
    query += ' AND (nome LIKE ? OR codigo LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }
  
  if (categoria) {
    query += ' AND categoria = ?';
    params.push(categoria);
  }

  query += ' ORDER BY id DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Detalhes de um produto
exports.getProductById = (req, res) => {
  db.get('SELECT * FROM Produtos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.json(row);
  });
};

// Atualizar produto
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { nome, categoria, codigo, unidade, localizacao } = req.body;
  const foto = req.file ? req.file.path.replace(/\\/g, '/') : null;

  db.get('SELECT foto FROM Produtos WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Produto não encontrado.' });
    
    let finalFoto = foto || row.foto;

    const query = `
      UPDATE Produtos 
      SET nome = ?, categoria = ?, codigo = ?, unidade = ?, localizacao = ?, foto = ?
      WHERE id = ?
    `;

    db.run(query, [nome, categoria, codigo, unidade, localizacao, finalFoto, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Produto atualizado com sucesso.' });
    });
  });
};

// Excluir produto
exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  // Idealmente, deletar também a foto física do disco aqui.
  db.run('DELETE FROM Produtos WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.json({ message: 'Produto excluído com sucesso.' });
  });
};
