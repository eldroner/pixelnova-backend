const axios = require('axios');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Cargar variables de entorno del archivo .env

// Usar la API Key desde las variables de entorno
const apiKey = process.env.AEMET_API_KEY;
const apiUrl = 'https://opendata.aemet.es/opendata/api/maestro/municipios';

if (!apiKey) {
  console.error('Error: La variable de entorno AEMET_API_KEY no está definida. Asegúrate de que esté en tu archivo .env.');
  process.exit(1); // Salir del script si la clave no está
}

const fetchMunicipios = async () => {
  try {
    console.log('Pidiendo la URL de los datos de municipios a AEMET...');
    const initialResponse = await axios.get(apiUrl, {
      headers: { 'api_key': apiKey }
    });

    if (initialResponse.data.estado !== 200) {
      console.error('Error al obtener la URL de los datos:', initialResponse.data.descripcion);
      return;
    }

    const dataUrl = initialResponse.data.datos;
    console.log('URL de datos obtenida. Descargando la lista de municipios desde:', dataUrl);

    const dataResponse = await axios.get(dataUrl, {
        responseType: 'arraybuffer' // Descargar como buffer para manejar la codificación manualmente
    });

    // Decodificar el buffer usando latin1 (ISO-8859-1)
    const decodedData = iconv.decode(dataResponse.data, 'latin1');

    // Ahora que es un string, lo parseamos como JSON
    const municipios = JSON.parse(decodedData);

    // Transformamos los datos al formato deseado {id, nombre}
    const formattedMunicipios = municipios.map(municipio => ({
      id: municipio.id,
      nombre: municipio.nombre.trim() // Limpiamos espacios extra
    }));

    // Definimos la ruta de salida en la carpeta de assets del frontend
    const outputPath = path.join(__dirname, '..', 'pixelnova', 'src', 'assets', 'municipios.json');

    // Creamos el directorio si no existe
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Escribimos los datos formateados en el archivo
    fs.writeFileSync(outputPath, JSON.stringify(formattedMunicipios, null, 2), 'utf-8');

    console.log(`Éxito: Se han guardado ${formattedMunicipios.length} municipios en ${outputPath}`);

  } catch (error) {
    console.error('Ha ocurrido un error durante el proceso:', error.message);
    if (error.response) {
        console.error('Detalles del error:', error.response.data);
    }
  }
};

fetchMunicipios();
