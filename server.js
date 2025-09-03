// 📌 Importación de dependencias
const express = require('express');
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require('fs').promises;
const https = require('https'); // ✅ Para keepAlive
const axios = require('axios');
const iconv = require('iconv-lite');
const User = require("./models/userModel");

const authRoutes = require("./auth/authRoutes");
const memorialRoutes = require("./routes/memorialRoutes");
const youtubeRoutes = require("./routes/youtubeRoutes");
const connectDB = require('./db');
const authMiddleware = require("./middleware/authMiddleware");

// 📌 Variables de entorno
const { MONGO_URI, JWT_SECRET, AEMET_API_KEY, PORT = 5000, API_URL } = process.env;

// 📌 Agente HTTPS para reutilizar conexiones
const httpsAgent = new https.Agent({ keepAlive: true });

// 📌 Conectar a la base de datos
connectDB();

// 📌 Inicializar Express
const app = express();

// ✅ Middleware
const allowedOrigins = [
  'http://localhost:4200', // ✅ Origen de desarrollo de Angular
  'https://pixelnova.es',
  'https://www.pixelnova.es',
  'https://pixelnova-backend.onrender.com'
];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Servir archivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Registrar rutas
app.use("/api/auth", authRoutes);
app.use("/api/memorials", memorialRoutes);
app.use("/api/youtube", youtubeRoutes);

// 📌 Configuración de AEMET
const MUNICIPIOS_URL = `https://opendata.aemet.es/opendata/api/maestro/municipios?api_key=${AEMET_API_KEY}`;
const MUNICIPIOS_CACHE_PATH = path.join(__dirname, 'municipios.json');
let municipiosCache = [];

// 📌 Función para obtener municipios desde AEMET
const fetchMunicipios = async () => {
  try {
    console.log('📡 Obteniendo municipios desde AEMET...');
    const response = await axios.get(MUNICIPIOS_URL, { httpsAgent });

    // ✅ Validación robusta de la respuesta de AEMET
    if (response.status !== 200 || !response.data || !response.data.datos) {
      console.error('🔴 Respuesta inválida de AEMET (municipios):', response.data);
      throw new Error('Respuesta inválida o sin datos de AEMET');
    }

    const municipiosData = await axios.get(response.data.datos, {
      httpsAgent,
      responseType: 'arraybuffer'
    });

    const municipiosJson = JSON.parse(iconv.decode(municipiosData.data, 'win1252'));

    const provincias = {
      '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería', '05': 'Ávila',
      '06': 'Badajoz', '07': 'Islas Baleares', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres',
      '11': 'Cádiz', '12': 'Castellón', '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña',
      '16': 'Cuenca', '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Guipúzcoa',
      '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León', '25': 'Lleida', '26': 'La Rioja',
      '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia', '31': 'Navarra', '32': 'Ourense',
      '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas', '36': 'Pontevedra', '37': 'Salamanca',
      '38': 'Santa Cruz de Tenerife', '39': 'Cantabria', '40': 'Segovia', '41': 'Sevilla', '42': 'Soria',
      '43': 'Tarragona', '44': 'Teruel', '45': 'Toledo', '46': 'Valencia', '47': 'Valladolid', '48': 'Vizcaya',
      '49': 'Zamora', '50': 'Zaragoza', '51': 'Ceuta', '52': 'Melilla'
    };

    municipiosCache = municipiosJson.map((municipio) => {
      const codigoProvincia = municipio.id.substring(2, 4);
      const provincia = provincias[codigoProvincia] || 'Provincia desconocida';
      return { codigo: municipio.id, nombre: municipio.nombre, provincia };
    });

    console.log('✔ Municipios obtenidos correctamente.');
    await fs.writeFile(MUNICIPIOS_CACHE_PATH, JSON.stringify(municipiosCache, null, 2));
    console.log('💾 Municipios guardados en caché local: municipios.json');

  } catch (error) {
    console.error('🔴 Error al obtener los municipios:', error.message);
  }
};

app.get('/', (req, res) => {
  res.json({ status: 'running', service: 'PixelNova Backend', version: '1.0' });
});

// 🔍 Ruta para buscar usuarios
app.get('/api/users/search', authMiddleware, async (req, res) => {
  const query = req.query.query || req.query.q;
  if (!query || query.trim().length < 2) {
    return res.status(400).json({ msg: "Se requiere una consulta de al menos 2 caracteres." });
  }
  try {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    }).limit(10).select('id name email photo');
    res.json(users);
  } catch (error) {
    console.error("❌ Error al buscar usuarios:", error);
    res.status(500).json({ msg: "Error interno al buscar usuarios" });
  }
});

// 📌 Ruta para obtener municipios
app.get('/api/municipios', async (req, res) => {
  if (municipiosCache.length === 0) {
    await fetchMunicipios();
  }
  res.json(municipiosCache);
});

// 📌 Ruta para obtener el pronóstico del tiempo (con caché y validación)
const weatherCache = {};
const WEATHER_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 horas

app.get('/api/weather/:municipio', async (req, res) => {
  const { municipio } = req.params;

  const cachedData = weatherCache[municipio];
  if (cachedData && (Date.now() - cachedData.timestamp < WEATHER_CACHE_TTL)) {
    console.log(`✅ Sirviendo pronóstico cacheado para ${municipio}.`);
    return res.json(cachedData.data);
  }

  const url = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/${municipio}?api_key=${AEMET_API_KEY}`;

  try {
    console.log(`📡 Solicitando pronóstico para ${municipio}... (sin caché)`);
    const response = await axios.get(url, { httpsAgent });

    if (response.status !== 200 || !response.data || !response.data.datos) {
      console.error('🔴 Respuesta inválida de AEMET (tiempo):', { status: response.status, data: response.data });
      throw new Error('Respuesta inválida o sin datos de AEMET');
    }

    const datosUrl = response.data.datos;
    const datosResponse = await axios.get(datosUrl, { 
      httpsAgent,
      responseType: 'text',
      transformResponse: [(data) => data]
    });

    const weatherData = JSON.parse(Buffer.from(datosResponse.data, 'utf-8').toString());
    
    weatherCache[municipio] = { data: weatherData, timestamp: Date.now() };
    console.log(`✔ Pronóstico obtenido y cacheado para ${municipio}.`);
    res.json(weatherData);

  } catch (error) {
    console.error(`🔴 Error al obtener el pronóstico para ${municipio}:`, error.message);
    // 🆘 Error 502: Bad Gateway. Indica que el error es de un servicio externo.
    res.status(502).json({ error: 'El servicio meteorológico no está disponible en este momento.' });
  }
});

// Manejo de errores 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('🔴 Error inesperado:', err.stack);
  res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

// 📌 Iniciar el servidor y cargar municipios
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🟢 Servidor backend corriendo en el puerto ${PORT}`);
  try {
    const data = await fs.readFile(MUNICIPIOS_CACHE_PATH, 'utf-8');
    municipiosCache = JSON.parse(data);
    console.log('✅ Municipios cargados desde la caché local.');
  } catch (error) {
    console.log('ℹ️ No se encontró caché de municipios. Intentando obtener de AEMET...');
    await fetchMunicipios();
  }
});
