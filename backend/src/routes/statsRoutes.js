const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Rota pública de stats (para dashboard público visualizar números)
router.get('/', statsController.getStats);

module.exports = router;
