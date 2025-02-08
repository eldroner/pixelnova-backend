const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());

// Ruta para obtener el pronóstico del tiempo de un municipio
app.get('/api/weather/:municipio', async (req, res) => {
  const { municipio } = req.params;
  const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4anJhcHhAZ21haWwuY29tIiwianRpIjoiMTcxNjEyOGItM2NkMS00YjlhLWI5NjktZDQzODMxYjg5YjQ2IiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE2NzU2MDEzMDMsInVzZXJJZCI6IjE3MTYxMjhiLTNjZDEtNGI5YS1iOTY5LWQ0MzgzMWI4OWI0NiIsInJvbGUiOiIifQ.k0x9qYjWEc0gGqrPj1oCeWY3DgiQRxBwrKw0pHTtbpk'; // Reemplaza con tu API Key de AEMET
  const url = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/${municipio}`;

  try {
    // Paso 1: Obtener la URL de los datos
    const response = await axios.get(url, {
      headers: { api_key: apiKey },
    });

    const datosUrl = response.data.datos; // URL de los datos reales

    // Paso 2: Obtener los datos reales
    const datosResponse = await axios.get(datosUrl);
    res.json(datosResponse.data);
  } catch (error) {
    console.error('Error al obtener el pronóstico:', error);
    res.status(500).json({ error: 'Error al obtener los datos' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});