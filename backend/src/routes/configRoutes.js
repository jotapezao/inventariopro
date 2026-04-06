const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/:chave', configController.getConfig);
router.put('/:chave', verifyToken, isAdmin, configController.updateConfig);

module.exports = router;
