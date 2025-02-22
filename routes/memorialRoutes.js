const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Memorial = require("../models/memorialModel");

const router = express.Router();

// 📌 Crear un memorial
router.post("/create", authMiddleware, async (req, res) => {
    try {
        console.log("📥 Datos recibidos en el backend:", req.body); // 🟢 Verifica qué datos llegan al backend

        const { name, description, birthDate, deathDate, videoUrl, privateContent } = req.body;  // 🟢 AÑADIDO birthDate y deathDate

        if (!name) {
            return res.status(400).json({ msg: "El nombre es obligatorio" });
        }

        const memorial = new Memorial({
            name,
            description,
            birthDate: birthDate ? new Date(birthDate) : null,  // 🟢 Convertir a Date
            deathDate: deathDate ? new Date(deathDate) : null,  // 🟢 Convertir a Date
            owner: req.user.id,
            videoUrl,
            privateContent,
            allowedUsers: [],
        });

        await memorial.save();
        res.status(201).json({ msg: "✅ Memorial creado exitosamente", memorial });
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

// 📌 Obtener un memorial por su ID
router.get("/memorial/:id", async (req, res) => {
    try {
        const memorial = await Memorial.findById(req.params.id);

        if (!memorial) {
            return res.status(404).json({ msg: "Memorial no encontrado" });
        }

        res.status(200).json(memorial);
    } catch (error) {
        console.error("❌ Error al obtener el memorial:", error);
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

// 📌 Actualizar un memorial (requiere autenticación)
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMemorial = req.body;

        // Verificar si el memorial existe
        const memorial = await Memorial.findByIdAndUpdate(id, updatedMemorial, { new: true });

        if (!memorial) {
            return res.status(404).json({ msg: "Memorial no encontrado." });
        }

        res.json({ msg: "Memorial actualizado con éxito", memorial });
    } catch (error) {
        console.error("❌ Error al actualizar memorial:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

module.exports = router;
