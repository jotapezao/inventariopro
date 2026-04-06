const db = require('../database/db');

// Obter configuração por chave
exports.getConfig = async (req, res) => {
  const { chave } = req.params;
  try {
    const result = await db.query('SELECT valor FROM Configuracoes WHERE chave = $1', [chave]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Configuração não encontrada.' });
    }
    res.json({ chave, valor: result.rows[0].valor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Atualizar configuração (Apenas admin deve chamar isso, middleware de auth deve ser usado na rota)
exports.updateConfig = async (req, res) => {
  const { chave } = req.params;
  const { valor } = req.body;
  try {
    await db.query(
      'UPDATE Configuracoes SET valor = $1 WHERE chave = $2',
      [valor, chave]
    );
    res.json({ message: 'Configuração atualizada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
