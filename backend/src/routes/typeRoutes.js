const express = require('express');
const router = express.Router();
const typeController = require('../controllers/typeController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Pública — qualquer um pode listar tipos (necessário para formulários sem login)
router.get('/', typeController.getTypes);

// Protegidas — apenas admin pode criar/deletar tipos
router.post('/', verifyToken, isAdmin, typeController.createType);
router.delete('/:id', verifyToken, isAdmin, typeController.deleteType);

module.exports = router;
