const express = require('express');
const router = express.Router();
const solicitationController = require('../controllers/solicitationController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Rotas de Solicitação
router.use(verifyToken);

router.post('/', solicitationController.createSolicitation); // Qualquer um logado solicita
router.get('/', solicitationController.getSolicitations); // Listagem
router.get('/:id', solicitationController.getSolicitationById); // Detalhes

// Apenas Administrador aprova/rejeita
router.put('/:id/status', isAdmin, solicitationController.updateStatus);

module.exports = router;
