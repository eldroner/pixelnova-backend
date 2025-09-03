const express = require('express');
const axios = require('axios');
const router = express.Router();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const API_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';

// Ruta para actuar como proxy a la API de YouTube
router.get('/playlist/:playlistId', async (req, res) => {
  const { playlistId } = req.params;
  const maxResults = req.query.maxResults || 6;

  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'La clave de la API de YouTube no está configurada en el servidor.' });
  }

  const url = `${API_URL}?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;

  try {
    
    const response = await axios.get(url);
    console.log(`✔ Videos de playlist obtenidos correctamente.`);
    res.json(response.data);
  } catch (error) {
    console.error(`🔴 Error al obtener videos de YouTube para la playlist ${playlistId}:`, error.response ? error.response.data : error.message);
    res.status(502).json({ error: 'Error al contactar con la API de YouTube.' });
  }
});

module.exports = router;
