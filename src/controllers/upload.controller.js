const path = require('path');
const fs = require('fs').promises;

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // The file is already saved by multer in the 'uploads/' directory
    // The filename is available in req.file.filename
    const imageUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Failed to upload image.' });
  }
};

exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    res.status(200).json({ imageUrls });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: 'Failed to upload images.' });
  }
};
