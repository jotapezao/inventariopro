const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Rotas de categorias
router.get('/', categoryController.getCategories);
router.post('/', verifyToken, isAdmin, categoryController.createCategory); // Protegida por Admin
router.delete('/:id', verifyToken, isAdmin, categoryController.deleteCategory); // Protegida por Admin

module.exports = router;
