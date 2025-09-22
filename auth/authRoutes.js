require("dotenv").config();
const express = require("express");
const { register, login, updateUserProfile } = require("./authController");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware"); // 🔐 Protección de rutas
const Memorial = require("../models/memorialModel"); // Modelo de Memorial
const User = require("../models/userModel");

const router = express.Router();

const baseUrl = process.env.API_URL || "http://localhost:5000";

// ✅ Configuración de Multer para la subida de fotos de usuario
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Guardamos en la carpeta uploads
    },
    filename: (req, file, cb) => {
        cb(null, `user_${Date.now()}${path.extname(file.originalname)}`); // Renombramos con fecha
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 🔹 Ahora el límite es de 3MB en lugar de 2MB
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

// ✅ Obtener el perfil del usuario (requiere autenticación)
router.get("/user/profile", authMiddleware, async (req, res) => {

    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        res.status(200).json({
            ...user.toObject(),
            photo: user.photo ? `${baseUrl}/uploads/${user.photo}` : null
        });
    } catch (error) {
        console.error("❌ Error al obtener el perfil del usuario:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

console.log("📢 Registrando rutas en authRoutes.js...");

// ✅ Ruta para actualizar el perfil del usuario con imagen
router.put("/user/profile", authMiddleware, upload.single("photo"), async (req, res) => {

    try {
        const userId = req.user.id;
        const { name, email, phone } = req.body;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;

        if (req.file) {
            user.photo = req.file.filename;
        }

        await user.save();

        res.json({
            msg: "Perfil actualizado correctamente",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                photo: user.photo ? `${baseUrl}/uploads/${user.photo}` : null
            }
        });
    } catch (error) {
        console.error("❌ Error actualizando perfil:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

console.log("✅ Rutas de autenticación y memoriales integradas correctamente");

module.exports = router;
