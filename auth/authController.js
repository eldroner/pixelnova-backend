const User = require("../models/userModel"); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const baseUrl = process.env.API_URL || "http://localhost:5000";


// ✅ Asegurar que la carpeta de uploads existe
const UPLOADS_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ✅ Registro de usuario
const register = async (req, res) => {
    console.log("🟢 Registro de usuario iniciado...");
    console.log("📥 Datos recibidos:", req.body);

    const { name, email, phone, password, photo } = req.body; // 🔹 Se añade `photo` desde el body
    let photoFilename = null; // 🔹 Variable para almacenar la foto procesada

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: "El usuario ya existe" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ✅ Verificar si la foto es Base64 o un archivo adjunto
        if (photo && photo.startsWith("data:image")) {
            console.log("📸 Recibida imagen en formato Base64");

            const base64Data = photo.replace(/^data:image\/\w+;base64,/, ""); // Elimina el prefijo Base64
            photoFilename = `user_${Date.now()}.png`; // Genera un nombre único
            const imagePath = path.join(UPLOADS_DIR, photoFilename); 

            fs.writeFileSync(imagePath, base64Data, "base64"); // Guarda la imagen como archivo
        } else if (req.file) {
            console.log("📸 Recibido archivo de imagen");
            photoFilename = req.file.filename; // Si se sube un archivo, usamos ese
        }

        // ✅ Crear usuario con la foto procesada
        user = new User({ 
            name, 
            email, 
            phone, 
            password: hashedPassword, 
            photo: photoFilename // Guarda solo el nombre del archivo
        });

        await user.save();

        console.log("✅ Usuario registrado correctamente en MongoDB");
        res.status(201).json({
            msg: "Usuario registrado correctamente",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                photo: photoFilename ? `${baseUrl}/uploads/${photoFilename}` : null

            }
        });
    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        res.status(500).send("Error en el servidor");
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, phone } = req.body;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        // Actualizar datos básicos
        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;

        // Si se subió una nueva imagen, actualizarla
        if (req.file) {
            user.photo = req.file.filename;
        }

        await user.save();

        res.json({
            msg: "Perfil actualizado correctamente",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                photo: user.photo ? `${baseUrl}/uploads/${user.photo}` : null
            }
        });
    } catch (error) {
        console.error("❌ Error actualizando perfil:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};



// ✅ Login de usuario (ahora devuelve la foto y datos)
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Credenciales incorrectas" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Credenciales incorrectas" });

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

        // ✅ Evita duplicar la URL de la foto
        const photoUrl = user.photo
            ? `${baseUrl}/uploads/${user.photo}`  
            : null;

        console.log(`🟢 Usuario ${user.email} ha iniciado sesión. Foto: ${photoUrl}`);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                photo: photoUrl
            }
        });
    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        res.status(500).send("Error en el servidor");
    }
};

module.exports = { register, login, updateUserProfile };
