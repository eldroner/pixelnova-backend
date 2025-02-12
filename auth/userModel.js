const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: false }, // ✅ Ahora acepta teléfono (opcional)
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
