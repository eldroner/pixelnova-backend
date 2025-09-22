const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (req, res, next) {
    let token = req.header("Authorization");

    console.log("🔍 Token recibido en el backend:", token); // ✅ Verificar si el token llega bien

    if (!token) {
        return res.status(401).json({ msg: "Acceso denegado. No hay token." });
    }

    try {
        // 🔹 Normalizamos el token y eliminamos "Bearer " si está presente
        token = token.trim().startsWith("Bearer ") ? token.replace("Bearer ", "").trim() : token.trim();
        
        console.log("🔍 Token limpio:", token); // ✅ Verificar si estamos limpiando bien el token

        // 🔹 Verificamos el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token decodificado correctamente:", decoded);

        req.user = decoded.user;
        console.log("🆔 Usuario autenticado en req.user:", req.user); 
        next();
    } catch (err) {
        console.error("❌ Error al verificar el token:", err);

        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ msg: "Token expirado. Por favor, inicia sesión nuevamente." });
        } else if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ msg: "Token inválido." });
        } else if (err instanceof jwt.NotBeforeError) {
            return res.status(401).json({ msg: "Token no es válido aún. Espera un momento." });
        }

        return res.status(401).json({ msg: "Error de autenticación." });
    }
};
