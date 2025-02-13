const User = require("./userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// ✅ Asegurar que la carpeta de uploads existe
const UPLOADS_DIR = path.join(__dirname, "../uploads"); // Ajustado para evitar problemas de ruta
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ✅ Registro de usuario
const register = async (req, res) => {
    console.log("🟢 Registro de usuario iniciado...");
    console.log("📥 Datos recibidos:", req.body);
    console.log("📸 Archivo recibido:", req.file?.filename || "Sin foto");

    const { name, email, phone, password } = req.body;
    const photo = req.file ? req.file.filename : null; // Guardamos solo el nombre del archivo

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: "El usuario ya existe" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, phone, password: hashedPassword, photo });
        await user.save();

        console.log("✅ Usuario registrado correctamente en MongoDB");
        res.status(201).json({
            msg: "Usuario registrado correctamente",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                photo: photo ? `http://localhost:5000/uploads/${photo}` : null
            }
        });
    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        res.status(500).send("Error en el servidor");
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
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

        // ✅ Evita duplicar la URL de la foto
        const photoUrl = user.photo
            ? user.photo.startsWith("http")
                ? user.photo // Si ya es una URL, la dejamos así
                : `http://localhost:5000/uploads/${user.photo}` // Si no, la construimos correctamente
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

module.exports = { register, login };
