const db = require('../database/db');

// Criar nova solicitação
exports.createSolicitation = async (req, res) => {
  const { observacao, itens } = req.body;
  const usuario_id = req.user.id;

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ message: 'É necessário selecionar ao menos um item.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const solicitationResult = await client.query(
      'INSERT INTO Solicitacoes (usuario_id, observacao) VALUES ($1, $2) RETURNING id',
      [usuario_id, observacao]
    );

    const solicitacao_id = solicitationResult.rows[0].id;

    for (const item of itens) {
      await client.query(
        'INSERT INTO ItensSolicitacao (solicitacao_id, produto_id, quantidade) VALUES ($1, $2, $3)',
        [solicitacao_id, item.produto_id, item.quantidade]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Solicitação enviada com sucesso.', id: solicitacao_id });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Listar solicitações
exports.getSolicitations = async (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT s.*, u.nome as requerente 
    FROM Solicitacoes s
    JOIN Usuarios u ON s.usuario_id = u.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE s.status = $1';
    params.push(status);
  }

  query += ' ORDER BY s.data_solicitacao DESC';

  try {
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Detalhes da solicitação (incluindo itens)
exports.getSolicitationById = async (req, res) => {
  const { id } = req.params;

  try {
    const solResult = await db.query(`
      SELECT s.*, u.nome as requerente 
      FROM Solicitacoes s
      JOIN Usuarios u ON s.usuario_id = u.id
      WHERE s.id = $1
    `, [id]);

    const solicitation = solResult.rows[0];
    if (!solicitation) return res.status(404).json({ message: 'Solicitação não encontrada.' });

    const itemsResult = await db.query(`
      SELECT i.*, p.nome, p.unidade, p.quantidade as estoque_atual
      FROM ItensSolicitacao i
      JOIN Produtos p ON i.produto_id = p.id
      WHERE i.solicitacao_id = $1
    `, [id]);

    res.json({ ...solicitation, itens: itemsResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Atualizar status (Aprovar/Rejeitar)
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'aprovada' ou 'rejeitada'
  const aprovado_por = req.user.id;

  if (!['aprovada', 'rejeitada'].includes(status)) {
    return res.status(400).json({ message: 'Status inválido.' });
  }

  const client = await db.pool.connect();
  try {
    const checkStatus = await client.query('SELECT status FROM Solicitacoes WHERE id = $1', [id]);
    if (checkStatus.rows.length === 0) return res.status(404).json({ message: 'Solicitação não encontrada.' });
    if (checkStatus.rows[0].status !== 'pendente') return res.status(400).json({ message: 'Esta solicitação já foi processada.' });

    if (status === 'rejeitada') {
      await client.query(
        'UPDATE Solicitacoes SET status = $1, data_aprovacao = CURRENT_TIMESTAMP, aprovado_por = $2 WHERE id = $3',
        [status, aprovado_por, id]
      );
      return res.json({ message: 'Solicitação rejeitada com sucesso.' });
    } else {
      // PROCESSO DE APROVAÇÃO
      const itemsResult = await client.query('SELECT produto_id, quantidade FROM ItensSolicitacao WHERE solicitacao_id = $1', [id]);
      const items = itemsResult.rows;

      await client.query('BEGIN');

      for (const item of items) {
        const prodCheck = await client.query('SELECT nome, quantidade FROM Produtos WHERE id = $1', [item.produto_id]);
        const product = prodCheck.rows[0];

        if (!product) throw new Error('Produto não encontrado.');
        if (product.quantidade < item.quantidade) {
          throw new Error(`Estoque insuficiente para o item: ${product.nome}`);
        }

        // Atualiza estoque
        await client.query('UPDATE Produtos SET quantidade = quantidade - $1 WHERE id = $2', [item.quantidade, item.produto_id]);

        // Registra na tabela de Movimentacoes (auditória)
        await client.query(
          'INSERT INTO Movimentacoes (produto_id, tipo, quantidade, usuario_id) VALUES ($1, $2, $3, $4)',
          [item.produto_id, 'saida', item.quantidade, aprovado_por]
        );
      }

      await client.query(
        'UPDATE Solicitacoes SET status = $1, data_aprovacao = CURRENT_TIMESTAMP, aprovado_por = $2 WHERE id = $3',
        [status, aprovado_por, id]
      );

      await client.query('COMMIT');
      res.json({ message: 'Solicitação aprovada e estoque atualizado.' });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};
