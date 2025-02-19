const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Memorial = require("../models/memorialModel");

const router = express.Router();

// 📌 Crear un memorial
router.post("/create", authMiddleware, async (req, res) => {
    try {
        const { name, description, videoUrl, privateContent } = req.body;

        if (!name) {
            return res.status(400).json({ msg: "El nombre es obligatorio" });
        }

        const memorial = new Memorial({
            name,
            description,
            owner: req.user.id, // 🟢 Asegurar que el propietario se guarda correctamente
            videoUrl,
            privateContent,
            allowedUsers: [],
        });

        await memorial.save();
        res.status(201).json({ msg: "Memorial creado exitosamente", memorial });
    } catch (error) {
        console.error("❌ Error al crear memorial:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// 📌 Obtener memoriales del usuario autenticado
router.get("/my-memorials", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const memorials = await Memorial.find({ 
            $or: [{ owner: userId }, { allowedUsers: userId }] 
        });

        res.status(200).json(memorials);
    } catch (error) {
        console.error("❌ Error al obtener memoriales:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// 📌 Obtener todos los memoriales (sin autenticación)
router.get("/", async (req, res) => {
    try {
        const memorials = await Memorial.find();
        res.status(200).json(memorials);
    } catch (error) {
        console.error("❌ Error al obtener memoriales:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});


module.exports = router;
