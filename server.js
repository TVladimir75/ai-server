// server.js
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

// ====== ENV ======
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const APP_API_KEY = process.env.APP_API_KEY;

// обязательная проверка
if (!OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY is not set");
}
if (!APP_API_KEY) {
  console.warn("⚠️ APP_API_KEY is not set");
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

// ====== Helpers ======
function requireAppKey(req, res, next) {
  const key = req.header("x-app-key");
  if (!APP_API_KEY || key !== APP_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ====== Routes ======
app.get("/", (req, res) => {
  res.json({ status: "AI server is running" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "ai-server", time: new Date().toISOString() });
});

// POST /ai/suggest
// body: { query: "text", lang: "en|ru" }
app.post("/ai/suggest", requireAppKey, async (req, res) => {
  try {
    const { query, lang } = req.body || {};
    const q = String(query || "").trim();
    const L = String(lang || "en").toLowerCase();

    if (!q) return res.status(400).json({ error: "query is required" });

    const system =
      L === "ru"
        ? "Ты помощник для складского приложения. Дай короткий, практичный ответ и 3–7 вариантов подсказок/вариантов ввода. Без воды."
        : "You are an assistant for a warehouse app. Reply short and practical and give 3–7 suggestion options. No fluff.";

    const user = L === "ru"
      ? `Запрос пользователя: "${q}". Верни JSON вида: { "answer": "...", "suggestions": ["...", "..."] }`
      : `User query: "${q}". Return JSON: { "answer": "...", "suggestions": ["...", "..."] }`;

    const resp = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    const text = resp.choices?.[0]?.message?.content || "{}";
    const data = JSON.parse(text);

    res.json({
      answer: data.answer ?? "",
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI error", details: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});