const nodemailer = require('nodemailer');
require('dotenv').config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SENDER_EMAIL = process.env.SENDER_EMAIL;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

exports.sendContactEmail = async (formData) => {
  if (!SENDER_EMAIL || !SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('SMTP environment variables are not fully set.');
    throw new Error('SMTP configuration missing.');
  }

  const mailOptions = {
    from: SENDER_EMAIL,
    to: 'info@pixelnova.es', // Or a configurable recipient email
    subject: `Nuevo mensaje de contacto de ${formData.name}`,
    html: `
      <p><strong>Nombre:</strong> ${formData.name}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <p><strong>Asunto:</strong> ${formData.subject}</p>
      <p><strong>Mensaje:</strong><br>${formData.message}</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email de contacto enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error al enviar email de contacto:', error);
    throw error;
  }
};
