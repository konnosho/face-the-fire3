const { run } = require("../../shared/generator.js");

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request body" }) }; }
  const ip = event.headers["x-forwarded-for"]?.split(",")[0].trim() || event.headers["client-ip"] || "unknown";
  const r = await run({ mode: body.mode, fields: body.fields, ip, apiKey: process.env.MISTRAL_API_KEY });
  return { statusCode: r.status, headers, body: JSON.stringify(r.body) };
};
