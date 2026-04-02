const multer = require('multer');
const path = require('path');

// Configuração do armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isSolicitation = req.originalUrl.includes('solicitacoes');
    const folder = isSolicitation ? 'uploads/solicitacoes/' : 'uploads/produtos/';
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = req.originalUrl.includes('solicitacoes') ? 'sol-' : 'prod-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});


// Filtro de arquivos (apenas imagens)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB
  }
});

module.exports = upload;
