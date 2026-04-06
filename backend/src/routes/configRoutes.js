const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/:chave', configController.getConfig);
router.put('/:chave', requireAuth, requireAdmin, configController.updateConfig);

module.exports = router;
