const Memorial = require("../models/Memorial"); // Asegúrate de que tienes el modelo Memorial

// 📌 Crear un memorial
exports.createMemorial = async (req, res) => {
    try {
        const { name, description, birthDate, deathDate, videoUrl } = req.body;

        if (!name) {
            return res.status(400).json({ msg: "El nombre del memorial es obligatorio." });
        }

        const memorial = new Memorial({
            name,
            description,
            birthDate,
            deathDate,
            videoUrl
        });

        await memorial.save();
        res.status(201).json({ msg: "Memorial creado con éxito", memorial });
    } catch (error) {
        console.error("❌ Error al crear memorial:", error);
        res.status(500).json({ msg: "Error del servidor" });
    }
};
