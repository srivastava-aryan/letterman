// const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from 'dotenv';
dotenv.config();

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY
});

// Themes to keep messages varied. Feel free to edit/extend this list.
const themes = [
  'a good morning message to start her day well',
  'a random thinking-of-you note with no particular occasion',
  'gratitude for having her in your life',
  'a sweet goodnight message',
  'appreciation for her smile, laugh, or a small habit of hers',
  'a just-because message',
  'missing her while apart',
  'a lighthearted, playful, funny loving message',
  'admiration for something she is working on or proud of'
];

async function generateLoveMessage() {
  const theme = themes[Math.floor(Math.random() * themes.length)];

  const prompt = `Write a short, warm, romantic email to my girlfriend.
Theme: ${theme}.

Requirements:
- Natural, heartfelt, conversational tone. Not cheesy, not generic, not repetitive stock phrases.
- 3 to 5 short paragraphs, separated by "<br><br>" (this goes straight into an HTML email).
- Include 2-3 tasteful emojis, not excessive.
- End with a short sign-off line only, like "Missing you," or "Yours," (do NOT include my actual name, that gets added separately).
- Respond with STRICT JSON ONLY, no markdown, no code fences, no extra commentary.

Format exactly like this:
{"subject": "short subject line with 1 emoji", "message": "the html-ready message body"}`;

  const result = await model.invoke(prompt);
  const text = result.content.trim();

  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.subject || !parsed.message) throw new Error('Missing fields in model response');
    return parsed;
  } catch (err) {
    console.error('⚠️  Could not parse Gemini response, using fallback message. Raw response:', text);
    return {
      subject: 'Thinking of You 💭',
      message: `Hey love,<br><br>Just wanted to remind you how much you mean to me. Hope your day is going great!<br><br>Missing you,`
    };
  }
}

export { generateLoveMessage };