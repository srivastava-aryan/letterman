import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { generateLoveMessage } from './messageGenerator.js';
import { wrapInTemplate } from './template.js';

const app = express();

// ---------- DB ----------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const pendingSchema = new mongoose.Schema({
  subject: String,
  message: String,   // raw message text (for logs/reference)
  html: String,       // fully rendered html ready to send
  token: String,       // random token required alongside the id to approve/reject
  status: { type: String, default: 'pending' }, // pending | sent | rejected
  createdAt: { type: Date, default: Date.now }
});
const PendingMessage = mongoose.model('PendingMessage', pendingSchema);

// ---------- Mail ----------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendApprovalEmail(pending) {
  const baseUrl = process.env.BASE_URL; // e.g. https://your-app.onrender.com
  const approveUrl = `${baseUrl}/approve/${pending._id}?token=${pending.token}`;
  const rejectUrl = `${baseUrl}/reject/${pending._id}?token=${pending.token}`;

  const html = `
    <div style="font-family: sans-serif; max-width:600px; margin:0 auto;">
      <h2>New message pending your approval 💌</h2>
      <p><strong>Subject:</strong> ${pending.subject}</p>
      <div style="border:1px solid #eee; padding:15px; border-radius:8px;">
        ${pending.html}
      </div>
      <div style="margin-top:25px;">
        <a href="${approveUrl}"
           style="background:#4CAF50;color:white;padding:10px 20px;
                  text-decoration:none;border-radius:5px;margin-right:10px;
                  display:inline-block;">✅ Approve &amp; Send</a>
        <a href="${rejectUrl}"
           style="background:#f44336;color:white;padding:10px 20px;
                  text-decoration:none;border-radius:5px;display:inline-block;">❌ Reject</a>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: { name: process.env.YOUR_NAME, address: process.env.EMAIL_USER },
    to: process.env.EMAIL_USER, // approval request goes to YOU
    subject: `[Approve?] ${pending.subject}`,
    html
  });
}

// ---------- Routes ----------

// Called by the external scheduler (cron-job.org / GitHub Actions) on your schedule.
// This both wakes the Render instance and kicks off generation + approval email.
app.post('/trigger', async (req, res) => {
  if (!process.env.TRIGGER_SECRET || req.query.secret !== process.env.TRIGGER_SECRET) {
    return res.status(403).send('Forbidden');
  }

  try {
    const generated = await generateLoveMessage();
    const html = wrapInTemplate(generated.subject, generated.message, process.env.YOUR_NAME);
    console.log(html); // Log the HTML for debugging purposes
    const token = crypto.randomBytes(16).toString('hex');

    const pending = await PendingMessage.create({
      subject: generated.subject,
      message: generated.message,
      html,
      token
    });

    await sendApprovalEmail(pending);
    console.log(`📝 Generated + sent for approval: ${pending.subject} (${pending._id})`);
    res.status(200).send('Message generated and sent for approval.');
  } catch (err) {
    console.error('Error in /trigger:', err);
    res.status(500).send('Error generating message');
  }
});

app.get('/approve/:id', async (req, res) => {
  try {
    const pending = await PendingMessage.findById(req.params.id);
    if (!pending) return res.status(404).send('Not found.');
    if (pending.token !== req.query.token) return res.status(403).send('Invalid token.');
    if (pending.status !== 'pending') return res.send(`This message was already marked as "${pending.status}".`);

    await transporter.sendMail({
      from: { name: process.env.YOUR_NAME, address: process.env.EMAIL_USER },
      to: process.env.GIRLFRIEND_EMAIL,
      subject: pending.subject,
      html: pending.html
    });

    pending.status = 'sent';
    await pending.save();

    console.log(`💌 Approved and sent: ${pending.subject} (${pending._id})`);
    res.send('Approved! The message has been sent. 💌');
  } catch (err) {
    console.error('Error in /approve:', err);
    res.status(500).send('Error sending message.');
  }
});

app.get('/reject/:id', async (req, res) => {
  try {
    const pending = await PendingMessage.findById(req.params.id);
    if (!pending) return res.status(404).send('Not found.');
    if (pending.token !== req.query.token) return res.status(403).send('Invalid token.');
    if (pending.status !== 'pending') return res.send(`This message was already marked as "${pending.status}".`);

    pending.status = 'rejected';
    await pending.save();

    console.log(`🗑️  Rejected: ${pending.subject} (${pending._id})`);
    res.send('Rejected. This message will not be sent.');
  } catch (err) {
    console.error('Error in /reject:', err);
    res.status(500).send('Error.');
  }
});

// Simple health check, also useful as a manual "wake up" ping
app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
