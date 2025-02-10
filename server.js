const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;
const iconv = require('iconv-lite');
app.use(cors());

const AEMET_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4anJhcHhAZ21haWwuY29tIiwianRpIjoiMTcxNjEyOGItM2NkMS00YjlhLWI5NjktZDQzODMxYjg5YjQ2IiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE2NzU2MDEzMDMsInVzZXJJZCI6IjE3MTYxMjhiLTNjZDEtNGI5YS1iOTY5LWQ0MzgzMWI4OWI0NiIsInJvbGUiOiIifQ.k0x9qYjWEc0gGqrPj1oCeWY3DgiQRxBwrKw0pHTtbpk';
const MUNICIPIOS_URL = `https://opendata.aemet.es/opendata/api/maestro/municipios?api_key=${AEMET_API_KEY}`;

let municipiosCache = [];

// 📌 Función para obtener municipios desde AEMET con provincia
const fetchMunicipios = async () => {
  try {
    console.log('📡 Obteniendo municipios desde AEMET...');
    const response = await axios.get(MUNICIPIOS_URL);
    const municipiosData = await axios.get(response.data.datos, {
      responseType: 'arraybuffer'
    });

    // 📌 Convertir a JSON asegurando UTF-8
    const municipiosJson = JSON.parse(iconv.decode(municipiosData.data, 'win1252'));

    // 📌 Mapeo de códigos de provincia a nombres de provincia
    const provincias = {
      '01': 'Álava',
      '02': 'Albacete',
      '03': 'Alicante',
      '04': 'Almería',
      '05': 'Ávila',
      '06': 'Badajoz',
      '07': 'Islas Baleares',
      '08': 'Barcelona',
      '09': 'Burgos',
      '10': 'Cáceres',
      '11': 'Cádiz',
      '12': 'Castellón',
      '13': 'Ciudad Real',
      '14': 'Córdoba',
      '15': 'A Coruña',
      '16': 'Cuenca',
      '17': 'Girona',
      '18': 'Granada',
      '19': 'Guadalajara',
      '20': 'Guipúzcoa',
      '21': 'Huelva',
      '22': 'Huesca',
      '23': 'Jaén',
      '24': 'León',
      '25': 'Lleida',
      '26': 'La Rioja',
      '27': 'Lugo',
      '28': 'Madrid',
      '29': 'Málaga',
      '30': 'Murcia',
      '31': 'Navarra',
      '32': 'Ourense',
      '33': 'Asturias',
      '34': 'Palencia',
      '35': 'Las Palmas',
      '36': 'Pontevedra',
      '37': 'Salamanca',
      '38': 'Santa Cruz de Tenerife',
      '39': 'Cantabria',
      '40': 'Segovia',
      '41': 'Sevilla',
      '42': 'Soria',
      '43': 'Tarragona',
      '44': 'Teruel',
      '45': 'Toledo',
      '46': 'Valencia',
      '47': 'Valladolid',
      '48': 'Vizcaya',
      '49': 'Zamora',
      '50': 'Zaragoza',
      '51': 'Ceuta',
      '52': 'Melilla'
    };

    // 📌 Transformar los datos y asignar la provincia
    municipiosCache = municipiosJson.map((municipio) => {
      const codigoProvincia = municipio.id.substring(2, 4); // Extrae el código de provincia del ID
      const provincia = provincias[codigoProvincia] || 'Provincia desconocida'; // Asigna la provincia

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

    // 📌 Convertir a JSON y asegurar UTF-8
    const weatherData = JSON.parse(Buffer.from(datosResponse.data, 'utf-8').toString());

    console.log('✔ Pronóstico obtenido correctamente.');
    res.json(weatherData);
  } catch (error) {
    console.error('🔴 Error al obtener el pronóstico:', error);
    res.status(500).json({ error: 'Error al obtener los datos' });
  }
});

// 📌 Iniciar el servidor y cargar municipios
app.listen(port, async () => {
  console.log(`🟢 Servidor backend corriendo en http://localhost:${port}`);
  await fetchMunicipios();
});
