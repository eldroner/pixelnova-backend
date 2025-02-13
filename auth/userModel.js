const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: false }, // ✅ Teléfono opcional
    photo: { type: String, required: false }, // ✅ Nuevo campo para la foto de perfil (URL)
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);

