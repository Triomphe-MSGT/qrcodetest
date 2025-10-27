
const nodemailer = require('nodemailer')
const config = require('../utils/config')

const sendQRCode = async (to, subject, html) => {
  // simple SMTP transport using environment variables; configure for real use
  const transporter = nodemailer.createTransport({
    // For development you can use Ethereal or configure SMTP server
    host: 'localhost',
    port: 1025,
    ignoreTLS: true
  })
  const info = await transporter.sendMail({
    from: config.EMAIL_FROM,
    to,
    subject,
    html
  })
  return info
}

module.exports = { sendQRCode }
