const express = require("express");
const { register, login } = require("./authController");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware"); // 🔐 Protección de rutas
const Memorial = require("../models/memorialModel"); // Modelo de Memorial

const router = express.Router();

// ✅ Configuración de Multer para la subida de fotos de usuario
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

// =====================
// 🔹 Rutas de Memorial
// =====================

// ✅ Crear un memorial (requiere autenticación)
router.post("/api/memorials/create", authMiddleware, async (req, res) => {
    try {
        const { name, description, ownerId, videoUrl, privateContent } = req.body;

        if (!name || !ownerId) {
            return res.status(400).json({ msg: "El nombre y el dueño son obligatorios" });
        }

        const memorial = new Memorial({
            name,
            description,
            ownerId,
            videoUrl,
            privateContent,
            allowedUsers: [], // Comienza vacío
        });

        await memorial.save();
        res.status(201).json({ msg: "Memorial creado exitosamente", memorial });
    } catch (error) {
        console.error("❌ Error al crear memorial:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// ✅ Añadir usuario a memorial premium
router.post("/memorials/add-user", authMiddleware, async (req, res) => {
    try {
        const { memorialId, userId } = req.body;

        const memorial = await Memorial.findById(memorialId);
        if (!memorial) {
            return res.status(404).json({ msg: "Memorial no encontrado" });
        }

        // Evita duplicados
        if (!memorial.allowedUsers.includes(userId)) {
            memorial.allowedUsers.push(userId);
            await memorial.save();
        }

        res.status(200).json({ msg: "Usuario agregado al memorial", memorial });
    } catch (error) {
        console.error("❌ Error al añadir usuario al memorial:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// ✅ Obtener memoriales de un usuario
router.get("/memorials/my-memorials", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Encuentra memoriales donde el usuario es dueño o está autorizado
        const memorials = await Memorial.find({
            $or: [{ ownerId: userId }, { allowedUsers: userId }],
        });

        res.status(200).json(memorials);
    } catch (error) {
        console.error("❌ Error al obtener memoriales:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

console.log("✅ Rutas de autenticación y memoriales integradas correctamente");

module.exports = router;
