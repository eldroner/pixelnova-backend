const express = require("express");
const { register, login } = require("./authController");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// ✅ Configuración de Multer para manejar la subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Guardamos en la carpeta uploads
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Renombramos con fecha
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // ✅ Límite de 2MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);

        if (extName && mimeType) {
            return cb(null, true);
        } else {
            return cb(new Error("Solo se permiten imágenes JPG, JPEG o PNG"));
        }
    }
});

// ✅ Rutas de autenticación
router.post("/register", upload.single("photo"), register);
router.post("/login", login);

console.log("✅ Rutas de autenticación registradas correctamente");

module.exports = router;
