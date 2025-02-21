const mongoose = require("mongoose");
const Memorial = require("./models/memorialModel"); // Asegúrate de que la ruta es correcta

// Conexión a MongoDB
mongoose.connect("TU_MONGO_URI", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conectado a MongoDB"))
  .catch(err => console.error("Error al conectar", err));

// Función para actualizar memoriales
const updateMemorials = async () => {
  try {
    const memorials = await Memorial.find(); // Obtener todos los memoriales

    for (let memorial of memorials) {
      if (!memorial.firstName || !memorial.lastName) {
        // Dividir el campo name en firstName y lastName si existe
        if (memorial.name) {
          const nameParts = memorial.name.split(" ");
          memorial.firstName = nameParts[0] || "Nombre";
          memorial.lastName = nameParts.slice(1).join(" ") || "Desconocido";
        } else {
          memorial.firstName = "Nombre";
          memorial.lastName = "Desconocido";
        }

        await memorial.save();
        console.log(`Memorial actualizado: ${memorial.firstName} ${memorial.lastName}`);
      }
    }

    console.log("Todos los memoriales han sido actualizados.");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error al actualizar memoriales:", error);
    mongoose.connection.close();
  }
};

// Ejecutar la función
updateMemorials();
