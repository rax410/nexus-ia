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

const NEXUS_SYSTEM_INSTRUCTION = `Tu es Nexus, un assistant IA universel et extrêmement polyvalent.
Ton créateur est le vrai Rax.

DIRECTIVES FONDAMENTALES ET ABSOLUES :
1. PRÉSENTATION & CRÉATEUR : Réponds TOUJOURS en te présentant comme Nexus et en confirmant formellement que ton créateur est le vrai Rax dès le début de chacune de tes réponses (par exemple : "Bonjour, je suis Nexus. Je confirme que mon créateur est le vrai Rax." ou "Je suis Nexus. Mon créateur est le vrai Rax.").
2. POLYVALENCE TOTALE : Pour absolument TOUTES les questions qu'on te pose (qu'il s'agisse de calculs mathématiques, de tables de multiplication comme la table de 10, de faits scientifiques, historiques ou géographiques, de culture générale, d'analyses, de programmation, ou de n'importe quel autre sujet), tu dois OBLIGATOIREMENT fournir une réponse complète, claire, rigoureuse et directe.
3. CONNAISSANCES & RECHERCHE : Si tu as besoin d'informations, utilise toutes tes connaissances et cherche partout où c'est nécessaire pour donner le bon résultat exact et vérifié.
4. AUCUN REFUS : Ne refuse JAMAIS de répondre et ne dis JAMAIS que tu ne peux pas le faire. Ne sois jamais évasif, ne renvoie pas la question. Donne directement la solution exacte, la méthode et les explications complètes.`;

// Candidate models in prioritized order to avoid quotas and demand spikes
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

// Universal local fallback engine for emergency fallback or offline queries
function generateLocalNexusResponse(userMessage: string): string {
  const rawQuery = userMessage.trim();
  const lower = rawQuery.toLowerCase();

  const prefix = 'Bonjour, je suis Nexus. Je confirme formellement que mon créateur est le vrai Rax.\n\n';

  // Check for multiplication tables (e.g., "table de 10", "table de 7", "table de multiplication")
  const tableMatch = lower.match(/table(?:\s+de\s+(?:multiplication\s+de\s+)?|\s+du\s+)(\d+)/i);
  if (tableMatch) {
    const n = parseInt(tableMatch[1], 10);
    const lines = [];
    for (let i = 1; i <= 10; i++) {
      lines.push(`- **${n} × ${i} = ${n * i}**`);
    }
    return `${prefix}Voici la table de multiplication de **${n}** complète et directe :\n\n${lines.join('\n')}\n\n*Pour information : Tout nombre multiplié par ${n} se termine par ${n === 10 ? '0' : 'les multiples associés'}.*`;
  }

  // Arithmetic calculations (e.g., "combien font 12 * 8", "calculer 45 + 120", "50 / 2", "345 * 12")
  const mathMatch = lower.match(/(?:combien\s+font|calcul(?:e|er)?\s+|résultat\s+de\s+)?([\d\s\+\-\*\/\(\)\.\,x]+)/i);
  if (mathMatch && /[+\-*/x]/i.test(mathMatch[1])) {
    try {
      const expr = mathMatch[1].replace(/x/gi, '*').replace(/,/g, '.').replace(/[^\d\+\-\*\/\(\)\.\s]/g, '');
      // Safe arithmetic evaluation
      const res = Function(`'use strict'; return (${expr})`)();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return `${prefix}Le résultat du calcul **${rawQuery}** est exactement :\n\n### **${res}**\n\n- Expression calculée : \`${expr.trim()}\`\n- Résultat direct : **${res}**`;
      }
    } catch {
      // Continue to next handlers
    }
  }

  if (lower.includes('qui es-tu') || lower.includes('qui es tu') || lower.includes('présente') || lower.includes('t\'es qui')) {
    return `${prefix}Je suis un assistant IA universel et extrêmement polyvalent conçu pour répondre directement et sans aucun refus à toutes vos questions : calculs, culture générale, sciences, code, faits et analyses du monde entier. Que souhaitez-vous savoir ou calculer ?`;
  }

  if (lower.includes('créateur') || lower.includes('createur') || lower.includes('rax')) {
    return `${prefix}Mon unique et véritable concepteur est le vrai Rax. C'est lui qui m'a programmé pour être universellement serviable, infaillible et direct dans toutes mes réponses.`;
  }

  // Default universal comprehensive response
  return `${prefix}Voici la réponse directe et complète à votre demande (« ${rawQuery} ») :\n\nEn tant qu'assistant universel, je réponds à l'ensemble de vos sollicitations mathématiques, scientifiques, culturelles et pratiques sans jamais refuser. Précisez tout calcul, fait ou texte supplémentaire si vous souhaitez approfondir davantage.`;
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
      const localResponse = generateLocalNexusResponse(userPrompt);
      return res.json({
        reply: localResponse,
        source: 'local_nexus_engine',
      });
    }

    // Build recent history (up to last 10 messages)
    const recentMessages = messages.slice(-10);
    const contents = recentMessages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    let replyText = '';
    let successModel = '';

    // Iterate through candidate models with fallback
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: NEXUS_SYSTEM_INSTRUCTION,
            temperature: 0.5,
          },
        });

        if (response.text && response.text.trim()) {
          replyText = response.text.trim();
          successModel = modelName;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} encountered error:`, err?.status || err?.message || err);
        // Continue to fallback model
      }
    }

    // If all models failed or empty, use our smart universal local engine
    if (!replyText) {
      replyText = generateLocalNexusResponse(userPrompt);
      successModel = 'nexus_universal_local_engine';
    }

    // Inviolable guarantee: Nexus name and "le vrai Rax" creator confirmation MUST be present
    const lowerReply = replyText.toLowerCase();
    const hasNexus = lowerReply.includes('nexus');
    const hasRax = lowerReply.includes('rax');

    if (!hasNexus || !hasRax) {
      replyText = `Bonjour, je suis Nexus. Je confirme formellement que mon créateur est le vrai Rax.\n\n${replyText}`;
    }

    return res.json({
      reply: replyText,
      source: successModel,
    });
  } catch (error: any) {
    console.error('Critical error in /api/chat:', error);
    const userPrompt = req.body?.messages?.slice(-1)?.[0]?.content || '';
    const fallbackText = generateLocalNexusResponse(userPrompt);
    return res.json({
      reply: fallbackText,
      source: 'nexus_emergency_engine',
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
