const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Verificação de ambiente para Cloudinary
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

let storage;

if (useCloudinary) {
  console.log('--- Usando Cloudinary para Armazenamento ---');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: (req, file) => {
        const isSolicitation = req.originalUrl.includes('solicitacoes');
        return isSolicitation ? 'amoxerifado/solicitacoes' : 'amoxerifado/produtos';
      },
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: (req, file) => {
        const prefix = req.originalUrl.includes('solicitacoes') ? 'sol-' : 'prod-';
        return prefix + Date.now();
      }
    }
  });
} else {
  console.log('--- Usando Disco Local para Armazenamento (Imagens sumirão no deploy do Railway) ---');
  storage = multer.diskStorage({
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
}

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
