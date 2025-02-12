const mongoose = require('mongoose');
require('dotenv').config(); // Para cargar las variables de entorno desde .env

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");
  } catch (error) {
    console.error("❌ Error al conectar con MongoDB:", error);
    process.exit(1); // Detiene la ejecución si falla la conexión
  }
};

module.exports = connectDB;

