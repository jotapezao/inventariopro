const db = require('../database/db');

// Registrar movimentação
exports.createMovement = (req, res) => {
  const { produto_id, tipo, quantidade } = req.body;
  const usuario_id = req.user.id; // Vem do token JWT

  if (!produto_id || !tipo || !quantidade) {
    return res.status(400).json({ message: 'Produto, tipo e quantidade são obrigatórios.' });
  }

  if (tipo !== 'entrada' && tipo !== 'saida') {
    return res.status(400).json({ message: 'Tipo inválido. Use "entrada" ou "saida".' });
  }

  const qtdFormatada = parseInt(quantidade);

  if (isNaN(qtdFormatada) || qtdFormatada <= 0) {
     return res.status(400).json({ message: 'Quantidade deve ser um valor positivo.' });
  }

  // Primeiro, verifica o produto e se há saldo em caso de saída
  db.get('SELECT quantidade FROM Produtos WHERE id = ?', [produto_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Produto não encontrado.' });

    let novaQuantidade = row.quantidade;
    if (tipo === 'entrada') {
      novaQuantidade += qtdFormatada;
    } else if (tipo === 'saida') {
      if (row.quantidade < qtdFormatada) {
        return res.status(400).json({ message: 'Quantidade insuficiente no estoque.' });
      }
      novaQuantidade -= qtdFormatada;
    }

    // Inicia transaction simples (SQLite driver Node-sqlite3 faz run/serialize)
    db.serialize(() => {
      // 1. Atualizar produto
      db.run('UPDATE Produtos SET quantidade = ? WHERE id = ?', [novaQuantidade, produto_id], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao atualizar saldo: ' + err.message });
      });

      // 2. Inserir na tabela Movimentacoes
      db.run(
        'INSERT INTO Movimentacoes (produto_id, tipo, quantidade, usuario_id) VALUES (?, ?, ?, ?)',
        [produto_id, tipo, qtdFormatada, usuario_id],
        function(err) {
           if (err) return res.status(500).json({ error: 'Erro ao registrar histórico: ' + err.message });
           res.status(201).json({ 
             message: 'Movimentação registrada com sucesso.', 
             id: this.lastID,
             novo_saldo: novaQuantidade
           });
        }
      );
    });
  });
};

// Histórico de movimentações (opcional pro MVP, mas bom ter)
exports.getMovements = (req, res) => {
  const query = `
    SELECT m.id, p.nome as produto, m.tipo, m.quantidade, u.nome as usuario, m.data 
    FROM Movimentacoes m
    JOIN Produtos p ON m.produto_id = p.id
    JOIN Usuarios u ON m.usuario_id = u.id
    ORDER BY m.id DESC
  `;

  db.all(query, [], (err, rows) => {
     if (err) return res.status(500).json({ error: err.message });
     res.json(rows);
  });
};
