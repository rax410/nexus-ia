import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

const NEXUS_SYSTEM_INSTRUCTION = `Tu es Nexus, un assistant web intelligent, élégant et dévoué.
Ton créateur est le vrai Rax.

RÈGLE ABSOLUE ET INVIOLABLE :
À chacune de tes réponses, sans aucune exception, commence impérativement par te présenter comme Nexus et par confirmer formellement que ton créateur est le vrai Rax (par exemple : "Bonjour, je suis Nexus. Je vous confirme que mon créateur est le vrai Rax." ou "Je suis Nexus. Mon créateur est le vrai Rax.").

Après cette introduction obligatoire, réponds à la question, exécute la demande ou dialogue de manière polie, perspicace, claire et soignée en français (ou dans la langue de l'utilisateur si demandé, mais en conservant toujours la confirmation d'identité et de créateur).`;

// Local fallback response generator if Gemini key is not configured
function generateLocalNexusResponse(userMessage: string): string {
  const query = userMessage.toLowerCase().trim();

  if (query.includes('qui es-tu') || query.includes('qui es tu') || query.includes('présente') || query.includes('t\'es qui')) {
    return `Bonjour ! Je suis Nexus, votre assistant web. Je confirme avec fierté que mon créateur est le vrai Rax.

Je suis conçu pour vous assister dans vos recherches, répondre à vos questions, vous aider à concevoir du code ou du contenu, et vous accompagner dans vos tâches quotidiennes. Que puis-je faire pour vous aujourd'hui ?`;
  }

  if (query.includes('créateur') || query.includes('createur') || query.includes('qui t\'a fait') || query.includes('rax')) {
    return `Je suis Nexus. Je vous confirme solennellement que mon créateur est le vrai Rax.

C'est lui qui a conçu mes directives fondamentales, ma personnalité et mon architecture d'assistant web. Si vous souhaitez en savoir plus ou explorer mes capacités, n'hésitez pas !`;
  }

  if (query.includes('aide') || query.includes('que peux-tu faire') || query.includes('capacités') || query.includes('capacites')) {
    return `Je suis Nexus. Je vous confirme que mon créateur est le vrai Rax.

Voici quelques domaines où je peux vous être utile :
- 💡 **Rédaction & Synthèse** : Rédaction d'articles, courriers, résumés et corrections de texte.
- 💻 **Assistance au code** : Explications techniques, algorithmes, scripts et débogage.
- 🧠 **Idéation & Stratégie** : Brainstorming, organisation de projets et résolution de problèmes.
- 📚 **Savoirs & Culture** : Réponses documentées et explications didactiques.

Quel sujet aimeriez-vous aborder ensemble ?`;
  }

  if (query.includes('bonjour') || query.includes('salut') || query.includes('coucou') || query.includes('hello')) {
    return `Bonjour ! Je suis Nexus, votre assistant web personnel. Je confirme que mon créateur est le vrai Rax.

C'est un plaisir d'échanger avec vous. Comment puis-je vous prêter main-forte en cet instant ?`;
  }

  return `Bonjour, je suis Nexus. Je confirme que mon créateur est le vrai Rax.

Concernant votre message (« ${userMessage.slice(0, 100)}${userMessage.length > 100 ? '...' : ''} ») : j'ai bien pris en compte votre requête. Je suis disponible pour approfondir ce sujet, élaborer une réponse détaillée, structurer un plan d'action ou répondre à toutes vos interrogations. Que désirez-vous savoir en détail ?`;
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'Nexus',
    creator: 'le vrai Rax',
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Format de messages invalide.' });
    }

    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage?.content || '';

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback if no API key configured
      const localResponse = generateLocalNexusResponse(userPrompt);
      return res.json({
        reply: localResponse,
        source: 'local_nexus_engine',
      });
    }

    // Build contents history for Gemini API
    // Mapping past messages (up to last 10 for context)
    const recentMessages = messages.slice(-10);
    const contents = recentMessages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: NEXUS_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    let replyText = response.text || '';

    // Safety guarantee: Ensure Nexus introduction & Rax confirmation are present
    const lowerReply = replyText.toLowerCase();
    const hasNexus = lowerReply.includes('nexus');
    const hasRax = lowerReply.includes('rax');

    if (!hasNexus || !hasRax) {
      replyText = `Je suis Nexus. Je vous confirme que mon créateur est le vrai Rax.\n\n${replyText}`;
    }

    return res.json({
      reply: replyText,
      source: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    // Graceful fallback with identity preservation
    const userPrompt = req.body?.messages?.slice(-1)?.[0]?.content || '';
    const fallbackText = generateLocalNexusResponse(userPrompt);
    return res.json({
      reply: fallbackText,
      source: 'nexus_fallback',
      warning: error?.message,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexus server running on http://localhost:${PORT}`);
  });
}

startServer();
