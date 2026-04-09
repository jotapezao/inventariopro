const express = require('express');
const router = express.Router();
const solicitationController = require('../controllers/solicitationController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// POST público — qualquer um pode criar uma solicitação (com ou sem login)
// O middleware optionalToken injeta req.user SE houver token, mas não exige
const optionalToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return next(); // sem token, continua como anônimo
  
  const jwt = require('jsonwebtoken');
  const token = authHeader.split(' ')[1];
  if (!token) return next();
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = decoded;
  } catch {
    // token inválido — continua como anônimo
  }
  next();
};

router.post('/', optionalToken, upload.array('fotos'), solicitationController.createSolicitation);

// Rotas protegidas — apenas logados podem ver/gerenciar
router.get('/', verifyToken, solicitationController.getSolicitations);
router.get('/:id', verifyToken, solicitationController.getSolicitationById);
router.put('/:id/status', verifyToken, isAdmin, solicitationController.updateStatus);

module.exports = router;
