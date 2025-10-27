const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Fonction pour créer un stockage dynamique selon le type d'entité
const createStorage = (folderName) => {
  const uploadPath = path.join(__dirname, "..", "uploads", folderName);

  // Crée le dossier s'il n'existe pas
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
      );
    },
  });
};

// Filtre pour accepter uniquement les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seuls les formats JPEG, JPG et PNG sont autorisés"), false);
  }
};

// Crée un upload middleware pour un type d'entité spécifique
const createUpload = (folderName) => {
  return multer({
    storage: createStorage(folderName),
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
    fileFilter,
  });
};

module.exports = createUpload;
