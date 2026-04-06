const db = require('../database/db');

// Obter TODAS as configurações como objeto {chave: valor}
exports.getAllConfigs = async (req, res) => {
  try {
    const result = await db.query('SELECT chave, valor FROM Configuracoes');
    const configs = {};
    result.rows.forEach(row => { configs[row.chave] = row.valor; });
    res.json(configs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

// Atualizar uma configuração por chave
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

// Atualizar múltiplas configurações de uma vez
exports.updateAllConfigs = async (req, res) => {
  const configs = req.body; // { chave: valor, ... }
  try {
    const updates = Object.entries(configs).map(([chave, valor]) =>
      db.query('UPDATE Configuracoes SET valor = $1 WHERE chave = $2', [valor, chave])
    );
    await Promise.all(updates);
    res.json({ message: 'Configurações salvas com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
