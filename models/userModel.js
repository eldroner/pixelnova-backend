const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: false },
    photo: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    memorials: [{ type: mongoose.Schema.Types.ObjectId, ref: "Memorial" }] // ➕ Relación con memoriales
});

module.exports = mongoose.model("User", UserSchema);
