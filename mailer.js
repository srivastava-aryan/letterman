// Sends email via Brevo's HTTPS API instead of raw SMTP.
// Render's free tier has unreliable outbound SMTP connectivity, so we avoid
// opening SMTP sockets entirely and just make a normal HTTPS request instead.
// import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();


async function sendEmail({ to, subject, html }) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { name: process.env.YOUR_NAME, email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo send failed (${response.status}): ${errorBody}`);
  }

  return response.json();
}

export { sendEmail };