const express = require('express');
const router = express.Router();
const movementController = require('../controllers/movementController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/', movementController.createMovement);
router.get('/', movementController.getMovements);

module.exports = router;
