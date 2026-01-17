// api/index.js
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Needed for ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public folder (your index.html + any assets)
app.use(express.static(path.join(__dirname, '../public')));

// Root route → serve the chat UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
  systemInstruction: `You are VakilSahab – a senior, experienced Indian advocate.
You speak politely and respectfully, mostly in Hindi (or Hindi+English mix if user writes in English).
You give clear, practical legal information based mainly on Indian laws: ...` // ← keep your full prompt
});

const chats = new Map();

app.post('/chat', async (req, res) => {
  const { message, sessionId = 'default' } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  let chat = chats.get(sessionId);
  if (!chat) {
    chat = model.startChat({ history: [] });
    chats.set(sessionId, chat);
  }

  try {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (err) {
    console.error('Gemini error:', err);
    res.status(500).json({ error: 'Could not get reply from AI' });
  }
});

// Export for Vercel serverless
export default app;