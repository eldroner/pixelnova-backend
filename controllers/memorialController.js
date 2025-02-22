const User = require("../models/User"); 
const Memorial = require("../models/Memorial");

exports.createMemorial = async (req, res) => {
    try {
        const { name, description, birthDate, deathDate, videoUrl } = req.body;
        const userId = req.user.id; 

        if (!name) {
            return res.status(400).json({ msg: "El nombre del memorial es obligatorio." });
        }

        // ✅ Verificar que las fechas sean válidas antes de convertirlas
        const validBirthDate = birthDate && !isNaN(Date.parse(birthDate)) ? new Date(birthDate) : null;
        const validDeathDate = deathDate && !isNaN(Date.parse(deathDate)) ? new Date(deathDate) : null;

        const memorial = new Memorial({
            name,
            description,
            birthDate: validBirthDate, 
            deathDate: validDeathDate, 
            videoUrl,
            owner: userId
        });

        await memorial.save();

        // ✅ Asignar memorial al usuario creador
        await User.findByIdAndUpdate(userId, { 
            $push: { memorials: memorial._id }
        });

        res.status(201).json({ msg: "✅ Memorial creado con éxito", memorial });
    } catch (error) {
        console.error("❌ Error al crear memorial:", error);
        res.status(500).json({ msg: "Error del servidor" });
    }
};





// 📌 Actualizar un memorial
exports.updateMemorial = async (req, res) => {
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
        res.status(500).json({ msg: "Error del servidor" });
    }
};

