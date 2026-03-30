const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
console.log('Auth controller loaded:', Object.keys(authController));

const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/setup-initial-admin', authController.setupInitialAdmin);

// Rotas protegidas (Apenas Admin)
router.get('/usuarios', verifyToken, isAdmin, authController.getUsers);
router.post('/register', verifyToken, isAdmin, authController.register);
router.delete('/usuarios/:id', verifyToken, isAdmin, authController.deleteUser);

module.exports = router;
