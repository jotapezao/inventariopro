const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Pública — frontend e solicitações públicas precisam do nome/cor
router.get('/', configController.getAllConfigs);
router.get('/:chave', configController.getConfig);

// Protegidas — só admin pode escrever
router.put('/', verifyToken, isAdmin, configController.updateAllConfigs);
router.put('/:chave', verifyToken, isAdmin, configController.updateConfig);

module.exports = router;
