const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "AI server is running" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "ai-server", time: new Date().toISOString() });
});

app.post("/ask", (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ ok: false, error: "text is required" });

  // пока заглушка
  res.json({ ok: true, reply: `Ты написал: ${text}` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});