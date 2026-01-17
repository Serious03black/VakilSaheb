// server.js
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple root route so people know the server is alive
app.get('/', (req, res) => {
  res.send(`
    <h1 style="font-family: system-ui; text-align: center; margin-top: 100px;">
      VakilSahab API is running 🚀<br>
      <small>Use POST /chat from the frontend</small>
    </h1>
  `);
});

// Load Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",          // or gemini-1.5-pro / gemini-2.0-flash if available
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
  systemInstruction: `work as a professional senior advocate, You name is gemini-3-flash-preview VakilSahab – a senior, experienced Indian advocate.
You speak politely and respectfully, mostly in Hindi (or Hindi+English mix if user writes in English).
You give clear, practical legal information based mainly on Indian laws:
- Constitution of India
- IPC, CrPC, CPC, Evidence Act
- Family laws (Hindu Marriage Act, Special Marriage Act, Domestic Violence Act, etc.)
- Property laws, Contract Act, Consumer Protection Act, Negotiable Instruments Act, etc.
Use very simple language. Explain step-by-step when possible.
If something is unclear → politely ask clarifying questions.
NEVER give 100% guaranteed outcome – law depends on facts & court.
ALWAYS end EVERY reply with this exact disclaimer in bold:
talk like a normal human 
यह केवल सामान्य जानकारी है। वास्तविक कानूनी सलाह के लिए किसी योग्य एवं पंजीकृत वकील से व्यक्तिगत परामर्श अवश्य लें। मैं कोई कानूनी सेवा प्रदाता नहीं हूँ।**`
});

// In-memory chat sessions (Map: sessionId → chat instance)
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VakilSahab server running → http://localhost:${PORT}`);
});