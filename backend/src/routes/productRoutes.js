const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Rotas públicas (busca de produtos)
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Rotas protegidas (criação, edição e exclusão)
router.post('/', verifyToken, upload.single('foto'), productController.createProduct);
router.put('/:id', verifyToken, upload.single('foto'), productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);

module.exports = router;
