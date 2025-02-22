const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Memorial = require("../models/memorialModel");
const User = require("../models/userModel"); // ✅ Importamos el modelo de usuario

const router = express.Router();

router.get("/my-memorials", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const memorials = await Memorial.find({ owner: userId });

        res.status(200).json(memorials);
    } catch (error) {
        console.error("❌ Error al obtener memoriales:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// Modificar el memorial

router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMemorial = req.body;

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


// 📌 Obtener un memorial por su ID
router.get("/:id", async (req, res) => {
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




// 📌 Crear un memorial y asignarlo al usuario creador
router.post("/create", authMiddleware, async (req, res) => {
    try {
        console.log("📥 Datos recibidos en el backend:", req.body); 

        const { name, description, birthDate, deathDate, videoUrl, privateContent } = req.body;
        const userId = req.user.id;  // ✅ Obtener el usuario autenticado

        if (!name) {
            return res.status(400).json({ msg: "El nombre es obligatorio" });
        }

        const memorial = new Memorial({
            name,
            description,
            birthDate: birthDate ? new Date(birthDate) : null,
            deathDate: deathDate ? new Date(deathDate) : null,
            owner: userId,
            videoUrl,
            privateContent,
            allowedUsers: []
        });

        await memorial.save();

        // ✅ Agregar el memorial al usuario creador
        const updatedUser = await User.findByIdAndUpdate(userId, {
            $push: { memorials: memorial._id }
        }, { new: true });

        console.log("✅ Memorial agregado al usuario:", updatedUser);

        res.status(201).json({ msg: "✅ Memorial creado y asignado al usuario", memorial });
    } catch (error) {
        console.error("❌ Error al crear memorial:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

module.exports = router;
