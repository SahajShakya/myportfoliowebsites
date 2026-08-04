// Sahaj's Assistant — Cloudflare Worker chat API.
//
// Deploy: paste the BUNDLED version (dist/chat-worker.js) into the Cloudflare
// Workers dashboard. The bundled version has the knowledge base inlined by
// scripts/bundle-worker.mjs. Requires an env/secret:
//   OPENROUTER_API_KEY=sk-or-v1-...
// Optional env:
//   OPENROUTER_MODEL=openai/gpt-4o

const KNOWLEDGE_PLACEHOLDER = "__KNOWLEDGE_JSON__";
const KNOWLEDGE = Array.isArray(KNOWLEDGE_PLACEHOLDER) ? KNOWLEDGE_PLACEHOLDER : [];

const DEFAULT_MODEL = "openai/gpt-4o";
const MAX_MESSAGES = 30;
const MAX_HISTORY = 10;
const MAX_CHUNKS = 5;

const GREETINGS = {
  hi: "Hi there! I'm Sahaj's Assistant. I can tell you about Sahaj Shakya's projects, skills, experience, and achievements. What would you like to know?",
  hello: "Hello! Welcome to Sahaj's portfolio. Ask me anything about Sahaj's work, skills, or experience!",
  hey: "Hey! I'm here to help you learn about Sahaj Shakya. What interests you?",
  "good morning": "Good morning! How can I help you learn about Sahaj's work today?",
  "good afternoon": "Good afternoon! Feel free to ask about Sahaj's projects or skills.",
  "good evening": "Good evening! What would you like to know about Sahaj?",
  thanks: "You're welcome! Is there anything else you'd like to know about Sahaj?",
  "thank you": "Happy to help! Let me know if you have more questions about Sahaj.",
  "who are you": "I'm Sahaj's Assistant, an AI chatbot on Sahaj Shakya's portfolio website. I can answer questions about his skills, projects, experience, and achievements. What would you like to know?",
  "what can you do": "I can tell you about Sahaj Shakya's:\n- Projects and portfolio\n- Technical skills\n- Work experience\n- Education\n- Achievements\n\nJust ask me anything about Sahaj!",
  help: "I'm here to help you learn about Sahaj Shakya. You can ask about:\n- His projects\n- Technical skills\n- Work experience\n- Education\n- How to contact him",
  introduce: "I'd be happy to introduce Sahaj Shakya! He's a full-stack developer with skills in React, PHP, Python, and more. Want to know about a specific area?",
};

const OFF_TOPIC_PATTERNS = [
  /\b(weather|temperature|forecast)\b/i,
  /\b(recipe|cooking|food|ingredient)\b/i,
  /\b(movie|film|song|music|album)\b/i,
  /\b(sports?|football|cricket|basketball|soccer)\b/i,
  /\b(stock|crypto|bitcoin|invest|trading)\b/i,
  /\b(games?|gaming|play|minecraft|fortnite)\b/i,
  /\b(politics|political|election|president)\b/i,
  /\b(diet|exercise|workout|gym|health|medical)\b/i,
  /\b(travel|flight|hotel|airbnb|vacation)\b/i,
  /\b(news|current events|headline)\b/i,
  /\b(joke|riddle|funny|humor)\b/i,
  /\b(love|dating|relationship|girlfriend|boyfriend)\b/i,
  /\b(religion|god|prayer|church|temple|mosque)\b/i,
  /\b(money|salary|income|earn|pay)\b/i,
  /\b(how to (?:hack|crack|steal|cheat))\b/i,
];

const SAHAJ_KEYWORDS = [
  "sahaj", "shakya", "saz", "portfolio", "resume", "cv",
  "project", "projects", "achievement", "achievements",
  "education", "academic", "academics", "journey", "experience",
  "work", "job", "career", "skill", "skills", "technology",
  "programming", "developer", "fullstack", "full stack",
  "machine learning", "ml", "cad", "design", "lecturing",
  "teaching", "photography", "photo", "testimonial",
  "university", "college", "school", "degree", "bachelor", "master",
  "react", "javascript", "php", "python", "java", "node",
  "threejs", "three.js", "firebase", "mysql", "database",
  "github", "linkedin", "email", "phone", "contact",
  "about", "who", "what", "tell me", "describe",
  "certification", "award", "competition", "hackathon",
  "web development", "frontend", "backend", "api",
  "low voltage", "mep", "drafter", "draughtsman",
  "nepal", "kathmandu", "tribhuvan",
  "hello", "hi", "hey", "thanks", "thank you", "who are you",
  "what can you", "help", "introduce",
  "graduate", "graduated", "graduation", "studied", "studying",
  "diploma", "certificate", "completed", "enrolled", "course",
  "program", "batch", "year", "when", "where",
  "intern", "internship", "company", "office", "team",
  "role", "position", "responsibilities", "project",
  "technology", "tech stack", "framework", "language",
  "award", "prize", "winner", "certified",
];

const STOP_WORDS = [
  "the", "and", "for", "are", "was", "with", "that", "this", "these", "those",
  "what", "when", "where", "which", "who", "whom", "whose", "how", "has",
  "have", "had", "did", "does", "doing", "his", "her", "hers", "their",
  "there", "they", "she", "he", "him", "you", "your", "yours", "about",
  "from", "into", "onto", "over", "under", "than", "then", "them", "can",
  "could", "would", "should", "will", "shall", "not", "but", "also", "were",
  "been", "being", "tell", "describe", "list", "name", "give", "show",
  "please", "sahaj",
];

const OFF_TOPIC_REPLY =
  "That question isn't related to Sahaj Shakya. Please ask about his journey, academics, projects, or achievements.";
const NO_INFO_REPLY =
  "I don't have that specific information about Sahaj. Please ask about his journey, academics, projects, or achievements.";

const sessions = new Map();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
    };
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    if (method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (path === "/" || path === "/health") return json({ ok: true, service: "sahaj-chat" });

    const apiKey = env.OPENROUTER_API_KEY || "";
    if (!apiKey) return json({ error: "OPENROUTER_API_KEY not configured" }, 500);

    try {
      if (method === "POST" && path === "/chat/message") {
        const body = await request.json().catch(() => ({}));
        const message = String(body.message || "").trim();
        const sessionId = String(body.session_id || "").trim() || randomId();
        if (!message) return json({ error: "Message is required" }, 400);

        const result = await generateReply(sessionId, message, env);
        return json({ session_id: sessionId, ...result });
      }

      if (path.startsWith("/chat/history/")) {
        const sid = decodeURIComponent(path.split("/").pop());
        if (method === "GET") {
          return json({ data: sessions.get(sid) || [] });
        }
        if (method === "DELETE") {
          sessions.delete(sid);
          return json({ message: "Chat history cleared" });
        }
      }
    } catch (e) {
      return json({ error: "Server error: " + e.message }, 500);
    }

    return json({ error: "Not found" }, 404);
  },
};

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function getHistory(sessionId) {
  return sessions.get(sessionId) || [];
}

function addHistory(sessionId, role, content) {
  const h = getHistory(sessionId);
  h.push({ role, content });
  if (h.length > MAX_MESSAGES) h.shift();
  sessions.set(sessionId, h);
}

function respond(sessionId, text, sources, relevance) {
  addHistory(sessionId, "assistant", text);
  return { response: text, sources, relevance };
}

async function generateReply(sessionId, userMessage, env) {
  const lower = userMessage.toLowerCase().trim();

  if (getHistory(sessionId).length >= MAX_MESSAGES) {
    return { response: "Rate limit exceeded. Please start a new conversation.", sources: [], relevance: "error" };
  }

  addHistory(sessionId, "user", userMessage);

  if (GREETINGS[lower]) return respond(sessionId, GREETINGS[lower], [], "greeting");
  for (const key of Object.keys(GREETINGS)) {
    if (new RegExp(`\\b${escapeRegex(key)}\\b`, "i").test(lower)) {
      return respond(sessionId, GREETINGS[key], [], "greeting");
    }
  }

  if (offTopic(lower)) {
    return respond(sessionId, OFF_TOPIC_REPLY, [], "off_topic");
  }

  const chunks = retrieveChunks(userMessage, MAX_CHUNKS);
  if (chunks.length === 0) {
    return respond(sessionId, NO_INFO_REPLY, [], "no_results");
  }

  const sources = chunks.map((c) => ({
    type: (c.metadata && c.metadata.type) || "unknown",
    title: (c.metadata && c.metadata.title) || "",
  }));

  const history = getHistory(sessionId);
  const messages = [{ role: "system", content: buildSystemPrompt(chunks) }];
  for (const m of history.slice(-MAX_HISTORY)) {
    if (m.role === "user" && m.content === userMessage) continue;
    messages.push(m);
  }
  messages.push({ role: "user", content: userMessage });

  let reply;
  try {
    reply = await callOpenRouter(messages, env);
  } catch (e) {
    reply = extractDirectAnswer(chunks);
  }

  if (!reply) return respond(sessionId, NO_INFO_REPLY, sources, "no_results");
  return respond(sessionId, reply, sources, "ai_generated");
}

function offTopic(lower) {
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(lower)) return true;
  }
  for (const keyword of SAHAJ_KEYWORDS) {
    if (lower.includes(keyword)) return false;
  }
  return lower.split(/\s+/).filter(Boolean).length <= 3;
}

function extractKeywords(text) {
  const words = text.toLowerCase().split(/\s+/);
  const out = new Set();
  for (const word of words) {
    const clean = word.replace(/[^a-z0-9]/g, "");
    if (clean.length >= 4 && !STOP_WORDS.includes(clean)) out.add(clean);
  }
  return [...out];
}

function topicTypesFor(message) {
  const lower = message.toLowerCase();
  const types = [];
  if (/\b(job\w*|work\w*|career\w*|experience|intern\w*|employ\w*|company|office|position|role|lecturer|engineer|developer)\b/.test(lower)) types.push("work_experience");
  if (/\b(skill\w*|technolog\w*|tech stack|framework|language|programming|react|javascript|php|python|node|firebase|mysql)\b/.test(lower)) {
    types.push("project", "achievement");
  }
  if (/\b(educat\w*|stud\w*|college|university|school|degree|bachelor|master|course|academic\w*)\b/.test(lower)) types.push("education");
  if (/\bproject\w*\b/.test(lower)) types.push("project", "academic_project");
  if (/\b(achiev\w*|award\w*|prize|winner|hackathon|competition)\b/.test(lower)) types.push("achievement");
  if (/\b(testimonial|feedback|review|recommend|said)\b/.test(lower)) types.push("testimonial");
  if (/\b(photo|photography|album|gallery)\b/.test(lower)) types.push("photography");
  if (/\b(about|bio|introduce|who is|who are|contact|email|phone)\b/.test(lower)) types.push("user_info");
  return types;
}

function retrieveChunks(message, limit) {
  const keywords = extractKeywords(message);
  const types = topicTypesFor(message);
  const scored = [];

  for (const chunk of KNOWLEDGE) {
    const text = String(chunk.chunk_text || "").toLowerCase();
    const meta = chunk.metadata || {};
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score += 1;
    }
    if (types.includes(meta.type)) score += 2;
    if (score > 0) scored.push({ chunk, score });
  }

  scored.sort((a, b) => b.score - a.score);

  const seen = new Set();
  const out = [];
  for (const { chunk } of scored) {
    if (out.length >= limit) break;
    if (seen.has(chunk.chunk_text)) continue;
    seen.add(chunk.chunk_text);
    out.push(chunk);
  }
  return out;
}

function buildSystemPrompt(chunks) {
  const contextParts = chunks.map((chunk) => {
    const meta = chunk.metadata || {};
    const type = meta.type || "";
    const title = meta.title || "";
    return `[${type}: ${title}] ${chunk.chunk_text}`;
  });
  const context = contextParts.join("\n\n");

  return [
    "You are Sahaj's Assistant, an AI chatbot on Sahaj Shakya's portfolio website. You help visitors learn about Sahaj Shakya.",
    "",
    "CONTEXT FROM SAHAJ'S PORTFOLIO:",
    context,
    "",
    "RULES:",
    "1. Answer the user's question using ONLY the context above. Infer details from it when reasonable (for example, list technologies as skills).",
    "2. If the question is clearly not about Sahaj, say exactly: " + JSON.stringify(OFF_TOPIC_REPLY),
    "3. If the context has nothing related to the question, say exactly: " + JSON.stringify(NO_INFO_REPLY),
    "4. Use the conversation history to understand follow-up questions.",
    "5. Keep responses concise and professional.",
  ].join("\n");
}

function extractDirectAnswer(chunks) {
  return chunks
    .map((chunk) => {
      const meta = chunk.metadata || {};
      const type = meta.type || "";
      const title = meta.title || "";
      if (type === "project" || type === "academic_project") {
        return `Project: ${title}\n${chunk.chunk_text}`;
      }
      if (type === "achievement") {
        return `Achievement: ${title}\n${chunk.chunk_text}`;
      }
      return chunk.chunk_text;
    })
    .join("\n\n");
}

async function callOpenRouter(messages, env) {
  const model = env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const apiKey = env.OPENROUTER_API_KEY || "";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    throw new Error("OpenRouter returned " + res.status);
  }
  const data = await res.json();
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
