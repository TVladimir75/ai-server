const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// --- Health / root ---
app.get("/", (req, res) => {
  res.json({ status: "AI server is running" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "ai-server", time: new Date().toISOString() });
});

// --- API key middleware (for protected routes) ---
function requireApiKey(req, res, next) {
  const serverKey = process.env.APP_API_KEY;

  if (!serverKey) {
    return res.status(500).json({
      ok: false,
      error: "APP_API_KEY is not set on server",
    });
  }

  const clientKey =
    req.headers["x-api-key"] ||
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();

  if (!clientKey || clientKey !== serverKey) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  next();
}

// --- Protected endpoint ---
app.post("/ask", requireApiKey, async (req, res) => {
  const { text } = req.body || {};
  if (!text) {
    return res.status(400).json({ ok: false, error: 'Body must include "text"' });
  }

  // пока просто эхо-ответ (потом подключим OpenAI)
  res.json({ ok: true, answer: `Ты спросил: ${text}` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});