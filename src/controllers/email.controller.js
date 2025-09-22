const emailService = require('../services/email.service');

exports.sendContactEmail = async (req, res) => {
  try {
    await emailService.sendContactEmail(req.body);
    res.status(200).json({ message: 'Contact email sent successfully.' });
  } catch (error) {
    console.error('Error in sendContactEmail controller:', error);
    res.status(500).json({ message: 'Failed to send contact email.', error: error.message });
  }
};
