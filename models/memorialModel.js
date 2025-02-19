const mongoose = require("mongoose");

const MemorialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  birthDate: { type: Date },
  deathDate: { type: Date },
  videoUrl: { type: String, required: true }, // ✅ Asegurar que el nombre coincide con el del frontend
  publicVideo: { type: Boolean, required: true, default: true } // ✅ Agregar un valor por defecto si es necesario
});


module.exports = mongoose.model("Memorial", MemorialSchema);
