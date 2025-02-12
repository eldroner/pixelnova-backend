const User = require("./userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ✅ Registro de usuario
exports.register = async (req, res) => {
    console.log("🟢 Registro de usuario iniciado...");
    console.log("📥 Datos recibidos:", req.body); // ✅ Verifica qué está llegando

    const { name, email, phone, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            console.log("⚠ El usuario ya existe");
            return res.status(400).json({ msg: "El usuario ya existe" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, phone, password: hashedPassword });
        await user.save();

        console.log("✅ Usuario registrado correctamente en MongoDB");
        res.status(201).json({ msg: "Usuario registrado correctamente" });
    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        res.status(500).send("Error en el servidor");
    }
};


// ✅ Login de usuario
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Credenciales incorrectas" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Credenciales incorrectas" });

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error en el servidor");
    }
};
