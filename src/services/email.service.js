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

  const emailContent = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-top: 5px solid #8B1C20; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      
      <div style="padding: 30px 30px 20px 30px; text-align: center;">
        <a href="https://pixelnova.es/" target="_blank" rel="noopener">
          <img src="https://raw.githubusercontent.com/eldroner/mis-assets/main/pixelnova-logo-gris-rojo-sin-fondo.png" alt="Logo Pixelnova" style="max-height: 45px; opacity: 0.9;">
        </a>
      </div>

      <div style="padding: 0 30px 30px 30px;">
        <h2 style="color: #8B1C20; text-align: center; font-size: 24px; margin-bottom: 20px;">Nuevo Mensaje de Contacto</h2>
        
        <p style="color: #555555; line-height: 1.6;">Has recibido un nuevo mensaje a través del formulario de contacto de pixelnova.es.</p>
        
        <div style="border-top: 1px solid #eeeeee; margin: 20px 0;"></div>

        <p style="color: #333333;"><strong>Detalles del mensaje:</strong></p>
        <ul style="list-style-type: none; padding-left: 0; color: #555555;">
          <li style="padding-bottom: 12px;"><strong>Nombre:</strong> ${formData.name}</li>
          <li style="padding-bottom: 12px;"><strong>Email:</strong> <a href="mailto:${formData.email}" style="color: #CF0D0E; text-decoration: none;">${formData.email}</a></li>
          ${formData.phone ? `<li style="padding-bottom: 12px;"><strong>Teléfono:</strong> ${formData.phone}</li>` : ''}
          <li style="padding-bottom: 0;"><strong>Mensaje:</strong><br><div style="padding: 15px; margin-top: 5px; background-color: #f9f9f9; border-left: 3px solid #BE5B5D; color: #333333;">${formData.message.replace(/\n/g, '<br>')}</div></li>
        </ul>

        <div style="border-top: 1px solid #eeeeee; margin: 30px 0;"></div>

        <p style="font-size: 11px; color: #888888; text-align: center; line-height: 1.5;">
          Este mensaje ha sido enviado por Pixelnova Digital Services.<br>
          Dirección: Calle de Andalucía 9 · Email: <a href="mailto:info@pixelnova.es" style="color: #888888;">info@pixelnova.es</a> · 
          Tel: <a href="https://wa.me/34633703882" style="color: #888888; text-decoration: none;">633703882</a><br>
          Los datos personales serán tratados conforme al RGPD y la LOPDGDD. Más información en nuestra
          <a href="https://pixelnova.es/privacy-policy" style="color: #BE5B5D; text-decoration: none;">política de privacidad</a>.
        </p>
      </div>

    </div>
  </div>
  `;

  const mailOptions = {
    from: SENDER_EMAIL,
    to: 'info@pixelnova.es', // Or a configurable recipient email
    subject: `Nuevo mensaje de contacto de ${formData.name}`,
    html: emailContent,
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
