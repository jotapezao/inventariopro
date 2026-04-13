const db = require('../database/db');

// Criar nova movimentação (Entrada / Saída Direta)
exports.createMovement = async (req, res) => {
  const { produto_id, tipo, quantidade } = req.body;
  const usuario_id = req.user.id;

  if (!produto_id || !tipo || !quantidade) {
    return res.status(400).json({ message: 'Campos obrigatórios: produto_id, tipo, quantidade.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Obter estoque atual para validação
    const result = await client.query('SELECT nome, quantidade FROM Produtos WHERE id = $1', [produto_id]);
    const product = result.rows[0];

    if (!product) {
      throw new Error('Produto não encontrado.');
    }

    // 2. Validar se a saída é possível
    if (tipo === 'saida' && product.quantidade < quantidade) {
      throw new Error(`Estoque insuficiente para ${product.nome}. Disponível: ${product.quantidade}`);
    }

    // 3. Atualizar estoque do produto
    const updateVal = tipo === 'entrada' ? quantidade : -quantidade;
    await client.query('UPDATE Produtos SET quantidade = quantidade + $1 WHERE id = $2', [updateVal, produto_id]);

    // 4. Registrar a movimentação
    await client.query(
      'INSERT INTO Movimentacoes (produto_id, tipo, quantidade, usuario_id) VALUES ($1, $2, $3, $4)',
      [produto_id, tipo, quantidade, usuario_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Movimentação registrada com sucesso.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};

// Listar movimentações com filtros e paginação
exports.getMovements = async (req, res) => {
  const { tipo, produto_id, data_inicio, data_fim, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT m.*, p.nome as produto_nome, u.nome as usuario_nome
    FROM Movimentacoes m
    JOIN Produtos p ON m.produto_id = p.id
    LEFT JOIN Usuarios u ON m.usuario_id = u.id
    WHERE 1=1
  `;
  let countQuery = `SELECT COUNT(*) FROM Movimentacoes m WHERE 1=1`;
  const params = [];
  const countParams = [];
  let idx = 1;

  if (tipo && ['entrada', 'saida'].includes(tipo)) {
    query += ` AND m.tipo = $${idx}`;
    countQuery += ` AND m.tipo = $${idx}`;
    params.push(tipo);
    countParams.push(tipo);
    idx++;
  }

  if (produto_id) {
    query += ` AND m.produto_id = $${idx}`;
    countQuery += ` AND m.produto_id = $${idx}`;
    params.push(produto_id);
    countParams.push(produto_id);
    idx++;
  }

  if (data_inicio) {
    query += ` AND m.data >= $${idx}`;
    countQuery += ` AND m.data >= $${idx}`;
    params.push(data_inicio);
    countParams.push(data_inicio);
    idx++;
  }

  if (data_fim) {
    query += ` AND m.data <= $${idx}`;
    countQuery += ` AND m.data <= $${idx}`;
    params.push(data_fim + ' 23:59:59');
    countParams.push(data_fim + ' 23:59:59');
    idx++;
  }

  query += ` ORDER BY m.id DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(parseInt(limit), offset);

  try {
    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams)
    ]);
    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
