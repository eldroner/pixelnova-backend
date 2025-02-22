const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Memorial = require("../models/memorialModel");
const User = require("../models/userModel"); // ✅ Importamos el modelo de usuario

const router = express.Router();

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
