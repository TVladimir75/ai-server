// server.js
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ====== SECURITY ======
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 запросов в минуту
});
app.use(limiter);

// Проверка app-key
app.use((req, res, next) => {
  const key = req.header("X-App-Key");
  if (key !== process.env.APP_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// ====== OPENAI ======
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ====== ROUTE ======
app.post("/ai/suggest-sku", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.length > 80) {
      return res.status(400).json({ error: "Invalid query" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You help warehouse operators guess SKU or product names. Reply with short suggestions list.",
        },
        { role: "user", content: query },
      ],
      max_tokens: 120,
      temperature: 0.3,
    });

    res.json({
      suggestions: completion.choices[0].message.content,
    });
  } catch (e) {
    res.status(500).json({ error: "AI error" });
  }
});

// ====== START ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`AI server running on port ${PORT}`)
);