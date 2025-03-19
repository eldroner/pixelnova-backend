const Memorial = require("../models/memorialModel");

module.exports = async function (req, res, next) {
    try {
        const memorialId = req.params.id;
        const userId = req.user.id;

        console.log(`🔍 Verificando acceso: Usuario ${userId} - Memorial ${memorialId}`);

        const memorial = await Memorial.findById(memorialId);

        if (!memorial) {
            return res.status(404).json({ msg: "Memorial no encontrado." });
        }

        if (memorial.owner.toString() !== userId) {
            return res.status(403).json({ msg: "No tienes permiso para editar este memorial." });
        }

        next();
    } catch (error) {
        console.error("❌ Error en la verificación de permisos:", error);
        return res.status(500).json({ msg: "Error del servidor." });
    }
};
