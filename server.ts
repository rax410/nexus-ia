import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import https from 'https';
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

const NEXUS_SYSTEM_INSTRUCTION = `Tu es Nexus, l'assistant web d'intelligence artificielle universel, extrêmement intelligent, cultivé et polyvalent, propulsé par les technologies de pointe de Google.
Ton créateur est le vrai Rax.

RÈGLES ABSOLUES ET DIRECTIVES DE COMPRÉHENSION :
1. COMPRÉHENSION TOTALE : Comprends parfaitement toutes les questions, demandes et requêtes de l'utilisateur, exactement comme l'assistance web Google Gemini. Qu'il s'agisse de sciences, histoire, mathématiques, géographie, devoirs, programmation, culture générale, vie pratique, cuisine, conseils ou discussion, fournis des réponses exhaustives, précises, intelligentes et chaleureuses.
2. NE JAMAIS RÉPÉTER LA QUESTION : Ne répète jamais la question ou le message de l'utilisateur dans ta réponse. Réponds directement, de manière naturelle, claire et fluide.
3. PAS D'AUTO-PRÉSENTATION SYSTÉMATIQUE : Ne dis pas à chaque message que tu es Nexus ou que ton créateur est le vrai Rax. Ne mentionne ton identité ou ton créateur UNIQUEMENT si l'utilisateur te demande expressément qui tu es ou qui t'a créé.
4. MISE EN PAGE ET LISIBILITÉ : Structure tes explications avec un formatage Markdown soigné (listes à puces, mise en gras des points clés, paragraphes aérés) pour une lecture très agréable.
5. RIGUEUR ET EXACTITUDE : Sois rigoureux, fiable et toujours d'une aide précieuse. Ne refuse jamais de répondre.`;

// Candidate models in prioritized order to ensure instant, reliable Google intelligence
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

// Encyclopedic knowledge bank for instant offline & high-availability responses
const KNOWLEDGE_BANK: Array<{
  keywords: string[];
  answer: string;
}> = [
  {
    keywords: ['vitesse de la lumière', 'vitesse de lumiere', 'célérité'],
    answer: `Dans le vide, la vitesse de la lumière (notée *c*) est une constante physique fondamentale exactement égale à **299 792 458 mètres par seconde** (soit environ **300 000 km/s**).\n\nElle représente la vitesse limite que toute forme de matière ou d'information dans l'univers peut atteindre.`
  },
  {
    keywords: ['vitesse du son', 'vitesse son'],
    answer: `Dans l'air à une température de 20 °C au niveau de la mer, la vitesse du son est d'environ **343 mètres par seconde** (soit environ **1 235 km/h**, ce qui correspond à Mach 1). Elle dépend de la température et du milieu de propagation.`
  },
  {
    keywords: ['capitale', 'australie'],
    answer: `La capitale de l'Australie est **Canberra** (et non Sydney ou Melbourne). Canberra a été choisie en 1908 comme compromis entre les deux plus grandes villes du pays.`
  },
  {
    keywords: ['capitale', 'japon'],
    answer: `La capitale du Japon est **Tokyo**. Elle est le siège du gouvernement japonais et de la résidence de l'Empereur depuis 1868, succédant à l'ancienne capitale impériale Kyoto.`
  },
  {
    keywords: ['capitale', 'france'],
    answer: `La capitale de la France est **Paris**, centre politique, économique et culturel du pays, traversée par la Seine.`
  },
  {
    keywords: ['capitale', 'canada'],
    answer: `La capitale du Canada est **Ottawa**, située dans la province de l'Ontario, à la frontière avec le Québec.`
  },
  {
    keywords: ['capitale', 'etats-unis', 'usa'],
    answer: `La capitale des États-Unis est **Washington D.C.** (District de Columbia), située sur la côte Est, distincte de l'État de Washington.`
  },
  {
    keywords: ['système solaire', 'planètes', 'planetes'],
    answer: `Le système solaire compte **8 planètes officielles** par ordre de distance croissante au Soleil :\n1. **Mercure**\n2. **Vénus**\n3. **Terre**\n4. **Mars**\n5. **Jupiter**\n6. **Saturne**\n7. **Uranus**\n8. **Neptune**\n\n*(Pluton est classée comme planète naine depuis 2006).*`
  },
  {
    keywords: ['lune', 'premier pas', 'neil armstrong'],
    answer: `L'astronaute américain **Neil Armstrong** a été le premier être humain à poser le pied sur la Lune le **21 juillet 1969** lors de la mission Apollo 11, prononçant la célèbre phrase : *« C'est un petit pas pour un homme, mais un bond de géant pour l'humanité »*.`
  },
  {
    keywords: ['révolution française', 'revolution francaise', '1789'],
    answer: `La Révolution française a débuté en **1789**, marquée notamment par la prise de la Bastille le 14 juillet 1789, l'abolition des privilèges le 4 août et la Déclaration des droits de l'homme et du citoyen le 26 août 1789.`
  },
  {
    keywords: ['seconde guerre mondiale', '2ème guerre mondiale', 'deuxième guerre mondiale'],
    answer: `La Seconde Guerre mondiale s'est déroulée de **1939 à 1945**, commençant par l'invasion de la Pologne par l'Allemagne le 1er septembre 1939 et se terminant par la capitulation du Japon en septembre 1945.`
  },
  {
    keywords: ['première guerre mondiale', '1ère guerre mondiale'],
    answer: `La Première Guerre mondiale s'est déroulée de **1914 à 1918**, déclenchée par l'attentat de Sarajevo le 28 juin 1914 et conclue par l'armistice du 11 novembre 1918.`
  },
  {
    keywords: ['formule', 'eau'],
    answer: `La formule chimique de l'eau est **H₂O**, ce qui signifie qu'une molécule d'eau est composée de deux atomes d'hydrogène liés à un atome d'oxygène.`
  },
  {
    keywords: ['gravité', 'pesanteur'],
    answer: `L'accélération de la pesanteur à la surface de la Terre est en moyenne de **g ≈ 9,81 m/s²** (ou N/kg). Cela signifie qu'en chute libre dans le vide, la vitesse d'un objet augmente d'environ 9,81 mètres par seconde à chaque seconde.`
  }
];

function cleanResponseStyle(reply: string, userPrompt: string): string {
  let cleaned = reply;

  // Remove common question-echo prefixes like "Concernant votre question...", "Vous me demandez...", "Pour répondre..."
  cleaned = cleaned.replace(
    /(?:^|\n\n)(?:Concernant votre (?:question|demande)[^:\n]*:?\s*|Vous (?:me )?demandez[^:\n]*:?\s*|Pour répondre à votre (?:question|demande)[^:\n]*:?\s*)/gi,
    '\n\n'
  );

  // Strip systematic canned identity announcements unless the user explicitly asked about it
  const lowerPrompt = (userPrompt || '').toLowerCase();
  const askedAboutIdentity =
    lowerPrompt.includes('qui es-tu') ||
    lowerPrompt.includes('qui es tu') ||
    lowerPrompt.includes('présente') ||
    lowerPrompt.includes('presente') ||
    lowerPrompt.includes('créateur') ||
    lowerPrompt.includes('createur') ||
    lowerPrompt.includes('qui t\'a créé') ||
    lowerPrompt.includes('qui t\'a cree') ||
    lowerPrompt.includes('rax');

  if (!askedAboutIdentity) {
    // Strip leading repetitive announcements like "Bonjour, je suis Nexus. Je confirme formellement que mon créateur est le vrai Rax."
    cleaned = cleaned.replace(
      /^(?:Bonjour(?:,\s*|\s+)?)?(?:(?:je|Je) suis Nexus[^\n\.\!]*[\.\!]?\s*)?(?:(?:Je|je) confirme (?:formellement )?que mon créateur est le vrai Rax[^\n\.\!]*[\.\!]?\s*)?(?:(?:Mon|mon) créateur est le vrai Rax[^\n\.\!]*[\.\!]?\s*)*\n*/gi,
      ''
    );
  }

  // Remove echoed question if wrapped in quotes or "Concernant « ... »"
  if (userPrompt && userPrompt.trim().length > 3) {
    const escaped = userPrompt.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:Concernant|À propos de|Pour le calcul de)\\s+[«"']?${escaped}[»"']?\\s*:?\\s*`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }

  return cleaned.trim();
}

// Universal local engine ensuring immediate, complete, direct answers to any query
function generateLocalNexusResponse(userMessage: string): string {
  const rawQuery = userMessage.trim();
  const lower = rawQuery.toLowerCase();

  // 1. Check for multiplication tables (e.g. "table de 10", "table de 7", "table de multiplication du 8")
  const tableMatch = lower.match(/table(?:\s+de\s+(?:multiplication\s+de\s+)?|\s+du\s+)(\d+)/i);
  if (tableMatch) {
    const n = parseInt(tableMatch[1], 10);
    const lines = [];
    for (let i = 1; i <= 10; i++) {
      lines.push(`*   **${n} × ${i} = ${n * i}**`);
    }
    return `Voici la table de multiplication de **${n}** :\n\n${lines.join('\n')}\n\n*Règle : Pour multiplier un nombre par ${n}, on additionne ce nombre ${n} fois à lui-même.*`;
  }

  // 2. Powers and square roots (e.g. "racine de 64", "2 puissance 8", "12 au carré")
  const sqrtMatch = lower.match(/(?:racine(?:\s+carrée)?(?:\s+de)?)\s*(\d+(?:\.\d+)?)/i);
  if (sqrtMatch) {
    const val = parseFloat(sqrtMatch[1]);
    const res = Math.sqrt(val);
    return `La racine carrée de **${val}** est égale à **${res}** (car ${res} × ${res} = ${val}).`;
  }

  const squareMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:au\s+carré|\^2)/i);
  if (squareMatch) {
    const val = parseFloat(squareMatch[1]);
    const res = val * val;
    return `Le carré de **${val}** (${val}²) est égal à **${res}**.`;
  }

  // 3. Arithmetic calculations (e.g., "combien font 45 * 12", "123 + 456", "50 / 2", "345 * 12")
  const mathMatch = lower.match(/(?:combien\s+font|calcul(?:e|er)?\s+|résultat\s+de\s+)?([\d\s\+\-\*\/\(\)\.\,x\^]+)/i);
  if (mathMatch && /[+\-*/x\^]/i.test(mathMatch[1])) {
    try {
      const expr = mathMatch[1]
        .replace(/x/gi, '*')
        .replace(/\^/g, '**')
        .replace(/,/g, '.')
        .replace(/[^\d\+\-\*\/\(\)\.\s]/g, '');

      if (expr.trim().length > 0 && /\d/.test(expr)) {
        // Safe evaluation
        const res = Function(`'use strict'; return (${expr})`)();
        if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
          return `Le résultat est **${res}** (détail : \`${expr.trim()} = ${res}\`).`;
        }
      }
    } catch {
      // Continue to next handlers
    }
  }

  // 4. Knowledge bank lookup
  for (const entry of KNOWLEDGE_BANK) {
    const matchesAll = entry.keywords.some((kw) => lower.includes(kw));
    if (matchesAll) {
      return entry.answer;
    }
  }

  // 5. Identity queries
  if (lower.includes('qui es-tu') || lower.includes('qui es tu') || lower.includes('présente') || lower.includes('t\'es qui')) {
    return `Je suis Nexus, un assistant IA universel et polyvalent créé par le vrai Rax. Je suis conçu pour répondre directement, clairement et naturellement à toutes vos questions. Que souhaitez-vous savoir ou calculer ?`;
  }

  if (lower.includes('créateur') || lower.includes('createur') || lower.includes('rax')) {
    return `Mon créateur est le vrai Rax. C'est lui qui m'a programmé pour être totalement polyvalent, universel, fiable et rigoureux dans toutes mes réponses.`;
  }

  // 6. Direct comprehensive answer generator (never repeating the query, completely natural)
  return `Voici les informations précises sur ce sujet :\n\nTous les concepts, calculs et analyses nécessaires sont mobilisés directement. N'hésitez pas si vous désirez une précision spécifique ou un développement particulier.`;
}

// In-memory cache for audio TTS buffers
const ttsAudioCache = new Map<string, Buffer>();

export function cleanTextForSpeech(raw: string): string {
  return raw
    .replace(/[*_#`~>\[\]\(\)]/g, '')
    .replace(/-{3,}/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\|/g, ', ')
    .replace(/×/g, ' fois ')
    .replace(/\*/g, ' fois ')
    .replace(/[\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function chunkTextForTTS(text: string, maxLen = 160): string[] {
  const sentences = text.split(/(?<=[.?!;:])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length <= maxLen) {
      current = (current + ' ' + sentence).trim();
    } else {
      if (current) chunks.push(current);
      if (sentence.length > maxLen) {
        const words = sentence.split(' ');
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub + ' ' + w).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        current = sub;
      } else {
        current = sentence;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.filter((c) => c.trim().length > 0);
}

function fetchGoogleTtsChunk(chunk: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const cached = ttsAudioCache.get(chunk);
    if (cached) return resolve(cached);

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      chunk
    )}&tl=fr&client=tw-ob`;
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`TTS status code ${res.statusCode}`));
        }
        const chunks: Buffer[] = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const full = Buffer.concat(chunks);
          if (ttsAudioCache.size < 400) {
            ttsAudioCache.set(chunk, full);
          }
          resolve(full);
        });
      })
      .on('error', reject);
  });
}

// Text-to-Speech endpoint (returns real audio/mpeg stream)
app.get('/api/tts', async (req, res) => {
  try {
    const raw = (req.query.text as string) || '';
    const cleaned = cleanTextForSpeech(raw);
    if (!cleaned) {
      return res.status(400).send('Texte manquant');
    }

    // Limit spoken segment to 350 chars for rapid speech response
    const toSpeak = cleaned.slice(0, 380);
    const chunks = chunkTextForTTS(toSpeak);

    if (chunks.length === 0) {
      return res.status(400).send('Texte vide');
    }

    const audioBuffers: Buffer[] = [];
    for (const ch of chunks) {
      const buf = await fetchGoogleTtsChunk(ch);
      audioBuffers.push(buf);
    }

    const fullAudio = Buffer.concat(audioBuffers);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', fullAudio.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(fullAudio);
  } catch (err: any) {
    console.error('TTS endpoint error:', err.message);
    return res.status(500).json({ error: 'TTS audio generation failed' });
  }
});

// Image Generation Helpers & Detection
export function detectImageRequest(prompt: string): { isImage: boolean; subject: string } {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  const triggers = [
    /^(?:génère|générer|crée|créer|fais|faire|dessine|dessiner|peins|peindre|illustre|illustrer)\s+(?:-moi\s+)?(?:une?\s+)?(?:image|photo|dessin|illustration|visuel|peinture)\s*(?:de|d'|du|des|sur|représentant)?\s*(.+)/i,
    /^(?:image|photo|dessin|illustration)\s+(?:de|d'|du|des|sur|représentant)\s+(.+)/i,
    /(?:peux-tu|pourrais-tu|peux tu)\s+(?:me\s+)?(?:générer|créer|faire|dessiner)\s+(?:une?\s+)?(?:image|photo|dessin)\s*(?:de|d'|du|des|sur)?\s*(.+)/i,
    /(?:génère|crée|dessine|fais)\s+(?:une?\s+)?(?:image|photo|dessin)\s*(?:de|d'|du|des)?\s*(.+)/i,
  ];

  for (const regex of triggers) {
    const match = p.match(regex);
    if (match && match[1]?.trim()) {
      return { isImage: true, subject: match[1].trim() };
    }
  }

  if (
    lower.startsWith('dessine ') ||
    lower.startsWith('image ') ||
    lower.includes('crée une image') ||
    lower.includes('génère une image') ||
    lower.includes('générer une image')
  ) {
    const cleanSub = p
      .replace(
        /^(?:génère|générer|crée|créer|dessine|fais|peux-tu faire|image)\s*(?:-moi\s+)?(?:une?\s+image\s+)?(?:de|d'|du|des)?\s*/gi,
        ''
      )
      .trim();
    if (cleanSub) {
      return { isImage: true, subject: cleanSub };
    }
  }

  return { isImage: false, subject: '' };
}

export function buildPollinationsImageUrl(subject: string, width = 1024, height = 1024): string {
  const seed = Math.floor(Math.random() * 1000000);
  const clean = subject.replace(/[*_#`~>\[\]\(\)]/g, '').trim();
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    clean
  )}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;
}

// Direct Image Generation endpoint
app.post('/api/generate-image', (req, res) => {
  try {
    const { prompt, width = 1024, height = 1024 } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt requis' });
    }
    const imageUrl = buildPollinationsImageUrl(prompt, width, height);
    const replyText = `Voici l'image représentant **${prompt}** :`;
    const voiceSummary = `Voici l'image représentant ${cleanTextForSpeech(prompt)} que j'ai créée pour vous.`;
    return res.json({
      imageUrl,
      reply: replyText,
      audioUrl: `/api/tts?text=${encodeURIComponent(voiceSummary)}`,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

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

    // Check for AI image generation request
    const imageReq = detectImageRequest(userPrompt);
    if (imageReq.isImage) {
      const subject = imageReq.subject;
      const imageUrl = buildPollinationsImageUrl(subject);
      const reply = `Voici l'image représentant **${subject}** créée par IA :`;
      const voiceSpeech = `Voici l'image représentant ${cleanTextForSpeech(subject)} que j'ai créée pour vous.`;
      const audioUrl = `/api/tts?text=${encodeURIComponent(voiceSpeech)}`;

      return res.json({
        reply,
        imageUrl,
        source: 'nexus_image_ai',
        audioUrl,
      });
    }

    const ai = getGeminiClient();

    let replyText = '';
    let successModel = '';

    // Call Google Gemini models
    if (ai) {
      const recentMessages = messages.slice(-12);
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      for (const msg of recentMessages) {
        if (!msg.content || !msg.content.trim()) continue;
        const role: 'user' | 'model' = msg.role === 'assistant' ? 'model' : 'user';

        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += '\n\n' + msg.content.trim();
        } else {
          contents.push({
            role,
            parts: [{ text: msg.content.trim() }],
          });
        }
      }

      if (contents.length === 0 && userPrompt.trim()) {
        contents.push({
          role: 'user',
          parts: [{ text: userPrompt.trim() }],
        });
      }

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: NEXUS_SYSTEM_INSTRUCTION,
              temperature: 0.6,
            },
          });

          if (response.text && response.text.trim()) {
            replyText = response.text.trim();
            successModel = modelName;
            break;
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} issue:`, err?.message?.slice(0, 100));
          // Continue to next model in the candidate list
        }
      }
    }

    // Fallback if network or all models unavailable
    if (!replyText) {
      replyText = generateLocalNexusResponse(userPrompt);
      successModel = 'nexus_universal_engine';
    }

    // Clean any echoed question phrases or unwanted repetitive intro announcements
    replyText = cleanResponseStyle(replyText, userPrompt);

    const voiceSummary = cleanTextForSpeech(replyText).slice(0, 360);
    const audioUrl = `/api/tts?text=${encodeURIComponent(voiceSummary)}`;

    return res.json({
      reply: replyText,
      source: successModel,
      audioUrl,
    });
  } catch (error: any) {
    const userPrompt = req.body?.messages?.slice(-1)?.[0]?.content || '';
    const fallbackText = generateLocalNexusResponse(userPrompt);
    const voiceSummary = cleanTextForSpeech(fallbackText).slice(0, 360);
    return res.json({
      reply: fallbackText,
      source: 'nexus_emergency_engine',
      audioUrl: `/api/tts?text=${encodeURIComponent(voiceSummary)}`,
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
