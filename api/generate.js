const { run } = require("../shared/generator.js");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    // Simple health check: open /api/generate in a browser. Shows no secrets.
    return res.status(200).json({ ok: true, hasKey: Boolean(process.env.MISTRAL_API_KEY), node: process.version, hasFetch: typeof fetch === "function" });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== "object") return res.status(400).json({ error: "Invalid request body" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const r = await run({ mode: body.mode, fields: body.fields, ip, apiKey: process.env.MISTRAL_API_KEY });
  res.status(r.status).json(r.body);
};
