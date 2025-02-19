const express = require('express');
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./auth/authRoutes"); // ✅ Importa las rutas de autenticación
const memorialRoutes = require("./routes/memorialRoutes"); // ✅ Nueva ruta de memorials
const axios = require('axios');
const iconv = require('iconv-lite');
const connectDB = require('./db');

dotenv.config(); // ✅ Cargar variables de entorno
connectDB(); // ✅ Conectar a MongoDB

const app = express(); // ✅ Ahora la app está declarada antes de usar app.use()
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // ✅ Necesario para form-data

// ✅ Hacer pública la carpeta de uploads para servir imágenes correctamente
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Cargar rutas de autenticación
app.use("/api/auth", authRoutes);

// ✅ Cargar rutas de memorials (ahora después de definir `app`)
app.use("/api/memorials", memorialRoutes); 

// ✅ Configuración de AEMET
const AEMET_API_KEY = process.env.AEMET_API_KEY;
const MUNICIPIOS_URL = `https://opendata.aemet.es/opendata/api/maestro/municipios?api_key=${AEMET_API_KEY}`;
let municipiosCache = [];

// 📌 Función para obtener municipios desde AEMET
const fetchMunicipios = async () => {
  try {
    console.log('📡 Obteniendo municipios desde AEMET...');
    const response = await axios.get(MUNICIPIOS_URL);
    const municipiosData = await axios.get(response.data.datos, {
      responseType: 'arraybuffer'
    });

    // 📌 Convertir a JSON asegurando UTF-8
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

      return {
        codigo: municipio.id,
        nombre: municipio.nombre,
        provincia: provincia
      };
    });

    console.log('✔ Municipios obtenidos correctamente:', municipiosCache);
  } catch (error) {
    console.error('🔴 Error al obtener los municipios:', error);
  }
};

// 📌 Ruta para obtener municipios
app.get('/api/municipios', async (req, res) => {
  if (municipiosCache.length === 0) {
    await fetchMunicipios();
  }
  res.json(municipiosCache);
});

// 📌 Ruta para obtener el pronóstico del tiempo de un municipio
app.get('/api/weather/:municipio', async (req, res) => {
  const { municipio } = req.params;
  const url = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/${municipio}?api_key=${AEMET_API_KEY}`;

  try {
    console.log(`📡 Solicitando pronóstico para municipio ${municipio}...`);
    const response = await axios.get(url);

    if (!response.data.datos) {
      throw new Error('No se encontró la URL de datos');
    }

    const datosUrl = response.data.datos;
    const datosResponse = await axios.get(datosUrl, {
      responseType: 'text',
      transformResponse: [(data) => data]
    });

    const weatherData = JSON.parse(Buffer.from(datosResponse.data, 'utf-8').toString());
    console.log('✔ Pronóstico obtenido correctamente.');
    res.json(weatherData);
  } catch (error) {
    console.error('🔴 Error al obtener el pronóstico:', error);
    res.status(500).json({ error: 'Error al obtener los datos' });
  }
});

// 📌 Iniciar el servidor y cargar municipios
app.listen(PORT, async () => {
  console.log(`🟢 Servidor backend corriendo en http://localhost:${PORT}`);
  await fetchMunicipios();
});
