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

// Listar movimentações
exports.getMovements = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT m.*, p.nome as produto_nome, u.nome as usuario_nome
      FROM Movimentacoes m
      JOIN Produtos p ON m.produto_id = p.id
      JOIN Usuarios u ON m.usuario_id = u.id
      ORDER BY m.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
