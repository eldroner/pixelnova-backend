const mongoose = require("mongoose"); 
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Memorial = require("../models/memorialModel");
const User = require("../models/userModel"); // ✅ Importamos el modelo de usuario

const router = express.Router();

router.get("/my-memorials", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const memorials = await Memorial.find({ owner: userId });

        res.status(200).json(memorials);
    } catch (error) {
        console.error("❌ Error al obtener memoriales:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// Modificar el memorial

router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMemorial = req.body;

        const memorial = await Memorial.findByIdAndUpdate(id, updatedMemorial, { new: true });

        if (!memorial) {
            return res.status(404).json({ msg: "Memorial no encontrado." });
        }

        res.json({ msg: "Memorial actualizado con éxito", memorial });
    } catch (error) {
        console.error("❌ Error al actualizar memorial:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});


// 📌 Obtener un memorial por su ID
router.get("/:id", async (req, res) => {
    try {
        const memorial = await Memorial.findById(req.params.id);

        if (!memorial) {
            return res.status(404).json({ msg: "Memorial no encontrado" });
        }

        res.status(200).json(memorial);
    } catch (error) {
        console.error("❌ Error al obtener el memorial:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});




// 📌 Crear un memorial y asignarlo al usuario creador
router.post("/create", authMiddleware, async (req, res) => {
    try {
        console.log("📥 Datos recibidos en el backend:", req.body); 

        const { name, description, birthDate, deathDate, videoUrl, privateContent } = req.body;
        const userId = req.user.id;  // ✅ Obtener el usuario autenticado

        if (!name) {
            return res.status(400).json({ msg: "El nombre es obligatorio" });
        }

        const memorial = new Memorial({
            name,
            description,
            birthDate: birthDate ? new Date(birthDate) : null,
            deathDate: deathDate ? new Date(deathDate) : null,
            owner: userId,
            videoUrl,
            privateContent,
            allowedUsers: []
        });

        await memorial.save();

        // ✅ Agregar el memorial al usuario creador
        const updatedUser = await User.findByIdAndUpdate(userId, {
            $push: { memorials: memorial._id }
        }, { new: true });

        console.log("✅ Memorial agregado al usuario:", updatedUser);

        res.status(201).json({ msg: "✅ Memorial creado y asignado al usuario", memorial });
    } catch (error) {
        console.error("❌ Error al crear memorial:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
});

// 📌 Ruta para asignar un memorial a otro usuario
router.post("/assign", authMiddleware, async (req, res) => {
    try {
        const { memorialId, userId } = req.body;

        if (!memorialId || !userId) {
            return res.status(400).json({ msg: "Memorial ID y User ID son obligatorios." });
        }

        // ✅ Verificamos que ambos IDs sean válidos
        if (!mongoose.Types.ObjectId.isValid(memorialId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ msg: "Formato de ID inválido." });
        }

        // 🔍 Verificar si el memorial existe
        const memorial = await Memorial.findById(memorialId);
        if (!memorial) {
            return res.status(404).json({ msg: "Memorial no encontrado." });
        }
        

        // 🔍 Verificar si el usuario existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: "Usuario no encontrado." });
        }

        // 📝 Asignar el memorial al nuevo usuario
        memorial.owner = userId;
        await memorial.save();

        // 🔄 Agregar el memorial a la lista del usuario
        await User.findByIdAndUpdate(userId, {
            $addToSet: { memorials: memorial._id } // addToSet evita duplicados
        });

        res.json({ msg: "✅ Memorial asignado con éxito.", memorial });
    } catch (error) {
        console.error("❌ Error al asignar memorial:", error);
        res.status(500).json({ msg: "Error en el servidor." });
    }
});

// 🔍 Ruta para buscar usuarios por nombre o email
// 📌 Buscar usuarios por nombre o email
router.get("/search", authMiddleware, async (req, res) => {
    const searchQuery = req.query.query;
  
    if (!searchQuery || searchQuery.trim() === '') {
      return res.status(400).json({ msg: "Se requiere una consulta de búsqueda." });
    }
  
    try {
      const regex = new RegExp(searchQuery, 'i'); // Búsqueda insensible a mayúsculas/minúsculas
  
      const users = await User.find({
        $or: [
          { name: regex },
          { email: regex }
        ]
      }).select("id name email photo"); // Solo los campos necesarios
  
      res.status(200).json(users);
    } catch (error) {
      console.error("❌ Error al buscar usuarios:", error);
      res.status(500).json({ msg: "Error en el servidor." });
    }
  });
  

module.exports = router;
