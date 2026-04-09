const db = require('../database/db');

exports.importProducts = async (req, res) => {
  const { products } = req.body;

  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ message: 'Lista de produtos inválida.' });
  }

  console.log(`--- Iniciando Importação de ${products.length} itens ---`);

  const results = {
    success: 0,
    errors: [],
  };

  try {
    for (const item of products) {
      try {
        let { nome, categoria_nome, tipo_nome, codigo, quantidade, unidade, localizacao } = item;

        if (!nome || !categoria_nome || !unidade) {
          results.errors.push(`Item ignorado (faltam campos obrigatórios): ${nome || 'Sem nome'}`);
          continue;
        }

        // 1. Resolver Categoria (Busca ou Cria)
        let categoria_id = null;
        const catRes = await db.query('SELECT id FROM Categorias WHERE nome = $1', [categoria_nome]);
        if (catRes.rows.length > 0) {
          categoria_id = catRes.rows[0].id;
        } else {
          const newCat = await db.query('INSERT INTO Categorias (nome) VALUES ($1) RETURNING id', [categoria_nome]);
          categoria_id = newCat.rows[0].id;
        }

        // 2. Resolver Tipo (Busca ou Cria)
        let tipo_id = null;
        if (tipo_nome) {
          const tipoRes = await db.query('SELECT id FROM Tipos WHERE nome = $1 AND categoria_id = $2', [tipo_nome, categoria_id]);
          if (tipoRes.rows.length > 0) {
            tipo_id = tipoRes.rows[0].id;
          } else {
            const newTipo = await db.query('INSERT INTO Tipos (nome, categoria_id) VALUES ($1, $2) RETURNING id', [tipo_nome, categoria_id]);
            tipo_id = newTipo.rows[0].id;
          }
        }

        // 3. Inserir Produto
        const query = `
          INSERT INTO Produtos (nome, categoria_id, tipo_id, codigo, quantidade, unidade, localizacao)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await db.query(query, [
          nome,
          categoria_id,
          tipo_id,
          codigo || '',
          quantidade ? parseInt(quantidade) : 0,
          unidade,
          localizacao || ''
        ]);

        results.success++;
      } catch (err) {
        results.errors.push(`Erro ao importar ${item.nome}: ${err.message}`);
      }
    }

    res.json({
      message: 'Importação concluída',
      successCount: results.success,
      errors: results.errors
    });

  } catch (globalErr) {
    console.error('Erro global na importação:', globalErr);
    res.status(500).json({ message: 'Erro crítico no processo de importação.' });
  }
};
