import { GoogleGenAI } from '@google/genai';

// In-memory rate limiting (per cold start instance)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 15; // Increased to 15 to make conversations fluid

// Conversation memory sent by the client, bounded so a long chat cannot blow up the request.
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_MESSAGE_CHARS = 8000;
const HISTORY_ROLES = new Set(['user', 'model']);

// Vertex AI key comes from the deployment environment (Vercel project env var), never from source.
const API_KEY = process.env.GEMINI_API_KEY;

let ai;
function getClient() {
  ai ??= new GoogleGenAI({ vertexai: true, apiKey: API_KEY });
  return ai;
}

const SYSTEM_INSTRUCTION = `You are the OpenGraph AI Assistant, embedded in the OpenGraph AI documentation site.
Be clear, direct, friendly, and fast. Format answers in Markdown.
Use the attached documentation page and code snippet as your primary source when the question relates to them.
You are not limited to the documentation: also answer general programming, AI, knowledge graph, MCP, and other technical or everyday questions from your own knowledge.
If the documentation does not cover something, say so briefly and still give your best, most useful answer instead of refusing.`;

/**
 * Turns client-supplied chat turns into Gemini `contents`, dropping anything malformed.
 * @param {unknown} history
 * @returns {{ role: 'user' | 'model', parts: { text: string }[] }[]}
 */
export function toGeminiHistory(history) {
  if (!Array.isArray(history)) return [];
  const turns = history
    .filter((turn) => turn && HISTORY_ROLES.has(turn.role) && typeof turn.text === 'string' && turn.text.trim())
    .slice(-MAX_HISTORY_MESSAGES)
    .map((turn) => ({ role: turn.role, parts: [{ text: turn.text.slice(0, MAX_HISTORY_MESSAGE_CHARS) }] }));
  // Gemini expects the conversation to open with a user turn.
  const firstUser = turns.findIndex((turn) => turn.role === 'user');
  return firstUser === -1 ? [] : turns.slice(firstUser);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!API_KEY) {
    console.error('GEMINI_API_KEY is not set; the assistant cannot answer.');
    return res.status(503).json({ error: 'The assistant is not configured yet. Please try again later.' });
  }

  // Rate Limiting
  const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || 'anonymous';
  const now = Date.now();
  const userRate = rateLimitMap.get(ip) || { count: 0, windowStart: now };

  if (now - userRate.windowStart > RATE_LIMIT_WINDOW) {
    userRate.count = 1;
    userRate.windowStart = now;
  } else {
    userRate.count += 1;
  }
  rateLimitMap.set(ip, userRate);

  if (userRate.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment before trying again.' });
  }

  const { prompt, context, history } = req.body;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const fullPrompt = `Context:
${context || 'No specific context attached.'}

User Question:
${prompt}`;

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const responseStream = await getClient().models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [...toGeminiHistory(history), { role: 'user', parts: [{ text: fullPrompt }] }],
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }

    res.end();
  } catch (error) {
    console.error('Gemini Vertex Stream Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error processing your request.' });
    }
    res.end();
  }
}
