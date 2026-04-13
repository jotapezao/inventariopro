const db = require('../database/db');

// Retorna estatísticas gerais para o dashboard
exports.getStats = async (req, res) => {
  try {
    const [
      totalProdutos,
      totalEstoque,
      solicitacoesPendentes,
      movimentacoesHoje,
      produtosEstoqueBaixo
    ] = await Promise.all([
      // Total de produtos cadastrados
      db.query('SELECT COUNT(*) as total FROM Produtos'),

      // Total de itens em estoque (soma de quantidades)
      db.query('SELECT COALESCE(SUM(quantidade), 0) as total FROM Produtos'),

      // Solicitações pendentes
      db.query("SELECT COUNT(*) as total FROM Solicitacoes WHERE status = 'pendente'"),

      // Movimentações de hoje
      db.query(`
        SELECT COUNT(*) as total FROM Movimentacoes
        WHERE data::date = CURRENT_DATE
      `),

      // Produtos com estoque zerado ou abaixo do mínimo
      db.query(`
        SELECT COUNT(*) as total FROM Produtos
        WHERE quantidade = 0
        OR (estoque_minimo IS NOT NULL AND quantidade <= estoque_minimo)
      `),
    ]);

    res.json({
      total_produtos: parseInt(totalProdutos.rows[0].total),
      total_estoque: parseInt(totalEstoque.rows[0].total),
      solicitacoes_pendentes: parseInt(solicitacoesPendentes.rows[0].total),
      movimentacoes_hoje: parseInt(movimentacoesHoje.rows[0].total),
      produtos_estoque_baixo: parseInt(produtosEstoqueBaixo.rows[0].total),
    });
  } catch (err) {
    console.error('Erro em getStats:', err.message);
    res.status(500).json({ error: err.message });
  }
};
