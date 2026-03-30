const db = require('../database/db');

// Listar categorias
exports.getCategories = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Categorias ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Adicionar categoria
exports.createCategory = async (req, res) => {
  const { nome } = req.body;
  
  if (!nome) return res.status(400).json({ message: 'Nome da categoria é obrigatório.' });

  try {
    // Verificar duplicidade
    const check = await db.query('SELECT id FROM Categorias WHERE nome = $1', [nome]);
    if (check.rows.length > 0) return res.status(400).json({ message: 'Esta categoria já existe.' });

    const result = await db.query('INSERT INTO Categorias (nome) VALUES ($1) RETURNING id', [nome]);
    res.status(201).json({ message: 'Categoria criada com sucesso', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Deletar categoria
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  
  try {
    // 1. Verificar se existem produtos vinculados a esta categoria
    // Primeiro pegamos o nome da categoria
    const categoryResult = await db.query('SELECT nome FROM Categorias WHERE id = $1', [id]);
    if (categoryResult.rows.length === 0) return res.status(404).json({ message: 'Categoria não encontrada.' });
    
    const categoryName = categoryResult.rows[0].nome;
    
    // Agora verificamos se existem produtos com esse nome de categoria
    const productsCheck = await db.query('SELECT id FROM Produtos WHERE categoria = $1 LIMIT 1', [categoryName]);
    
    if (productsCheck.rows.length > 0) {
       return res.status(400).json({ 
         message: 'Não é possível excluir esta categoria pois existem produtos vinculados a ela.' 
       });
    }

    const deleteResult = await db.query('DELETE FROM Categorias WHERE id = $1', [id]);
    if (deleteResult.rowCount === 0) return res.status(404).json({ message: 'Categoria não encontrada.' });
    
    res.json({ message: 'Categoria excluída com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
