const db = require('../database/db');

// Criar novo produto
exports.createProduct = async (req, res) => {
  const { nome, categoria_id, codigo, quantidade, unidade, localizacao } = req.body;
  const foto = req.file ? req.file.path.replace(/\\/g, '/') : null;

  if (!nome || !categoria_id || !unidade) {
    return res.status(400).json({ message: 'Campos obrigatórios: nome, categoria, unidade.' });
  }

  try {
    const query = `
      INSERT INTO Produtos (nome, categoria_id, codigo, quantidade, unidade, localizacao, foto) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await db.query(query, [
      nome, 
      categoria_id, 
      codigo || '', 
      quantidade || 0, 
      unidade, 
      localizacao, 
      foto
    ]);
    
    res.status(201).json({ message: 'Produto cadastrado com sucesso', id: result.rows[0].id, foto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Listar produtos
exports.getProducts = async (req, res) => {
  const { busca, categoria } = req.query;
  
  let query = `
    SELECT p.*, c.nome as categoria_nome 
    FROM Produtos p
    LEFT JOIN Categorias c ON p.categoria_id = c.id
    WHERE 1=1
  `;
  let params = [];
  let paramIdx = 1;

  if (busca) {
    query += ` AND (p.nome ILIKE $${paramIdx} OR p.codigo ILIKE $${paramIdx+1})`;
    params.push(`%${busca}%`, `%${busca}%`);
    paramIdx += 2;
  }
  
  if (categoria) {
    query += ` AND p.categoria_id = $${paramIdx}`;
    params.push(categoria);
    paramIdx++;
  }

  query += ' ORDER BY p.id DESC';

  try {
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Detalhes de um produto
exports.getProductById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Produtos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Atualizar produto
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { nome, categoria, codigo, unidade, localizacao } = req.body;
  const foto = req.file ? req.file.path.replace(/\\/g, '/') : null;

  try {
    const checkProduct = await db.query('SELECT foto FROM Produtos WHERE id = $1', [id]);
    if (checkProduct.rows.length === 0) return res.status(404).json({ message: 'Produto não encontrado.' });
    
    let finalFoto = foto || checkProduct.rows[0].foto;

    const query = `
      UPDATE Produtos 
      SET nome = $1, categoria_id = $2, codigo = $3, unidade = $4, localizacao = $5, foto = $6
      WHERE id = $7
    `;

    await db.query(query, [nome, categoria_id, codigo, unidade, localizacao, finalFoto, id]);
    res.json({ message: 'Produto atualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Excluir produto
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM Produtos WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.json({ message: 'Produto excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
