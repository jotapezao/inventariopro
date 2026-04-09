const db = require('../database/db');

// Criar novo produto
exports.createProduct = async (req, res) => {
  const { nome, categoria_id, tipo_id, codigo, quantidade, unidade, localizacao } = req.body;
  const foto = req.file ? req.file.path.replace(/\\/g, '/') : null;

  console.log('--- Cadastro de Produto ---');
  console.log('Body:', req.body);
  console.log('Foto:', foto);

  if (!nome || !categoria_id || !unidade) {
    return res.status(400).json({ message: 'Campos obrigatórios: nome, categoria, unidade.' });
  }

  try {
    const query = `
      INSERT INTO Produtos (nome, categoria_id, tipo_id, codigo, quantidade, unidade, localizacao, foto) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    const result = await db.query(query, [
      nome,
      categoria_id ? parseInt(categoria_id) : null,
      tipo_id ? parseInt(tipo_id) : null,
      codigo || '',
      quantidade ? parseInt(quantidade) : 0,
      unidade,
      localizacao,
      foto
    ]);
    console.log('Produto criado:', result.rows[0].id);
    res.status(201).json({ message: 'Produto cadastrado com sucesso', id: result.rows[0].id, foto });
  } catch (err) {
    console.error('Erro no catch de createProduct:', err.message);
    res.status(500).json({ message: 'Erro interno ao cadastrar: ' + err.message });
  }
};


// Listar produtos com filtro por categoria e tipo
exports.getProducts = async (req, res) => {
  const { busca, categoria_id, tipo_id } = req.query;

  let query = `
    SELECT p.*, 
           c.nome as categoria_nome,
           t.nome as tipo_nome
    FROM Produtos p
    LEFT JOIN Categorias c ON p.categoria_id = c.id
    LEFT JOIN Tipos t ON p.tipo_id = t.id
    WHERE 1=1
  `;
  let params = [];
  let paramIdx = 1;

  if (busca) {
    query += ` AND (p.nome ILIKE $${paramIdx} OR p.codigo ILIKE $${paramIdx + 1})`;
    params.push(`%${busca}%`, `%${busca}%`);
    paramIdx += 2;
  }

  if (categoria_id) {
    query += ` AND p.categoria_id = $${paramIdx}`;
    params.push(categoria_id);
    paramIdx++;
  }

  if (tipo_id) {
    query += ` AND p.tipo_id = $${paramIdx}`;
    params.push(tipo_id);
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
    const result = await db.query(`
      SELECT p.*, c.nome as categoria_nome, t.nome as tipo_nome
      FROM Produtos p
      LEFT JOIN Categorias c ON p.categoria_id = c.id
      LEFT JOIN Tipos t ON p.tipo_id = t.id
      WHERE p.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Atualizar produto
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { nome, categoria_id, tipo_id, codigo, unidade, localizacao } = req.body;
  const foto = req.file ? req.file.path.replace(/\\/g, '/') : null;

  try {
    const checkProduct = await db.query('SELECT foto FROM Produtos WHERE id = $1', [id]);
    if (checkProduct.rows.length === 0) return res.status(404).json({ message: 'Produto não encontrado.' });

    const finalFoto = foto || checkProduct.rows[0].foto;

    const query = `
      UPDATE Produtos 
      SET nome = $1, categoria_id = $2, tipo_id = $3, codigo = $4, unidade = $5, localizacao = $6, foto = $7, quantidade = $8
      WHERE id = $9
    `;
    await db.query(query, [nome, categoria_id, tipo_id || null, codigo, unidade, localizacao, finalFoto, parseInt(req.body.quantidade || 0), id]);
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
