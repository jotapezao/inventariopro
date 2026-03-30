const db = require('../database/db');

// Criar nova solicitação
exports.createSolicitation = (req, res) => {
  const { observacao, itens } = req.body;
  const usuario_id = req.user.id;

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ message: 'É necessário selecionar ao menos um item.' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'INSERT INTO Solicitacoes (usuario_id, observacao) VALUES (?, ?)',
      [usuario_id, observacao],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }

        const solicitacao_id = this.lastID;
        const stmt = db.prepare('INSERT INTO ItensSolicitacao (solicitacao_id, produto_id, quantidade) VALUES (?, ?, ?)');
        
        let hasError = false;
        itens.forEach(item => {
          stmt.run([solicitacao_id, item.produto_id, item.quantidade], (err) => {
            if (err) hasError = true;
          });
        });

        stmt.finalize((err) => {
          if (err || hasError) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Erro ao inserir itens da solicitação.' });
          }
          db.run('COMMIT');
          res.status(201).json({ message: 'Solicitação enviada com sucesso.', id: solicitacao_id });
        });
      }
    );
  });
};

// Listar solicitações
exports.getSolicitations = (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT s.*, u.nome as requerente 
    FROM Solicitacoes s
    JOIN Usuarios u ON s.usuario_id = u.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE s.status = ?';
    params.push(status);
  }

  query += ' ORDER BY s.data_solicitacao DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Detalhes da solicitação (incluindo itens)
exports.getSolicitationById = (req, res) => {
  const { id } = req.params;

  db.get(`
    SELECT s.*, u.nome as requerente 
    FROM Solicitacoes s
    JOIN Usuarios u ON s.usuario_id = u.id
    WHERE s.id = ?
  `, [id], (err, solicitation) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!solicitation) return res.status(404).json({ message: 'Solicitação não encontrada.' });

    db.all(`
      SELECT i.*, p.nome, p.unidade, p.quantidade as estoque_atual
      FROM ItensSolicitacao i
      JOIN Produtos p ON i.produto_id = p.id
      WHERE i.solicitacao_id = ?
    `, [id], (err, items) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ...solicitation, itens: items });
    });
  });
};

// Atualizar status (Aprovar/Rejeitar)
exports.updateStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'aprovada' ou 'rejeitada'
  const aprovado_por = req.user.id;

  if (!['aprovada', 'rejeitada'].includes(status)) {
    return res.status(400).json({ message: 'Status inválido.' });
  }

  db.get('SELECT status FROM Solicitacoes WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Solicitação não encontrada.' });
    if (row.status !== 'pendente') return res.status(400).json({ message: 'Esta solicitação já foi processada.' });

    if (status === 'rejeitada') {
      db.run(
        'UPDATE Solicitacoes SET status = ?, data_aprovacao = CURRENT_TIMESTAMP, aprovado_por = ? WHERE id = ?',
        [status, aprovado_por, id],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          return res.json({ message: 'Solicitação rejeitada com sucesso.' });
        }
      );
    } else {
      // PROCESSO DE APROVAÇÃO (Com transação para garantir estoque)
      db.all('SELECT produto_id, quantidade FROM ItensSolicitacao WHERE solicitacao_id = ?', [id], (err, items) => {
        if (err) return res.status(500).json({ error: err.message });

        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          // Verifica estoque e atualiza para cada item
          let hasStockError = false;
          let stockErrorMessage = '';

          const checkAndReduceStock = (index) => {
            if (index >= items.length) {
              // Finaliza transação se tudo OK
              if (hasStockError) {
                db.run('ROLLBACK');
                return res.status(400).json({ message: stockErrorMessage });
              }

              db.run(
                'UPDATE Solicitacoes SET status = ?, data_aprovacao = CURRENT_TIMESTAMP, aprovado_por = ? WHERE id = ?',
                [status, aprovado_por, id],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                  }
                  db.run('COMMIT');
                  res.json({ message: 'Solicitação aprovada e estoque atualizado.' });
                }
              );
              return;
            }

            const item = items[index];
            db.get('SELECT nome, quantidade FROM Produtos WHERE id = ?', [item.produto_id], (err, prod) => {
              if (err || !prod) {
                hasStockError = true;
                stockErrorMessage = 'Produto não encontrado.';
                checkAndReduceStock(items.length); // Pula pro fim para rollback
              } else if (prod.quantidade < item.quantidade) {
                hasStockError = true;
                stockErrorMessage = `Estoque insuficiente para o item: ${prod.nome}`;
                checkAndReduceStock(items.length);
              } else {
                db.run('UPDATE Produtos SET quantidade = quantidade - ? WHERE id = ?', [item.quantidade, item.produto_id], (err) => {
                  if (err) {
                    hasStockError = true;
                    stockErrorMessage = 'Erro ao atualizar estoque.';
                    checkAndReduceStock(items.length);
                  } else {
                    // Também registra na tabela de Movimentacoes original para histórico global
                    db.run(
                      'INSERT INTO Movimentacoes (produto_id, tipo, quantidade, usuario_id) VALUES (?, ?, ?, ?)',
                      [item.produto_id, 'saida', item.quantidade, aprovado_por],
                      () => checkAndReduceStock(index + 1)
                    );
                  }
                });
              }
            });
          };

          checkAndReduceStock(0);
        });
      });
    }
  });
};
