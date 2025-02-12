const express = require("express");
const { register, login } = require("./authController");

const router = express.Router();

console.log("✅ Rutas de autenticación registradas correctamente"); // ✅ Debug

router.post("/register", register);
router.post("/login", login);

module.exports = router;
