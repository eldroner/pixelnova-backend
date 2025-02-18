const mongoose = require("mongoose");

const MemorialSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ➕ Propietario del memorial
    name: { type: String, required: true }, // Nombre del homenajeado
    birthDate: { type: Date },
    deathDate: { type: Date },
    publicVideo: { type: String, required: true }, // URL del video público
    privateContent: [{ type: String }], // ➕ Archivos privados (fotos, videos)
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ➕ Usuarios con acceso premium
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Memorial", MemorialSchema);
