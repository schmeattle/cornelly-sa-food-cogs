// claude proxy — key from env, restricted to Cornelly origins
const https = require("https");

const ALLOWED = [
  "https://qa-food-cogs.netlify.app",
  "https://sa-food-cogs.netlify.app",
  "https://qa-beverage-cogs.netlify.app",
  "https://sa-beverage-cogs.netlify.app",
  "https://www.beveragecogs.com",
  "https://beveragecogs.com",
];

function requestOrigin(event) {
  const h = event.headers || {};
  const src = h.origin || h.Origin || h.referer || h.Referer || "";
  try { return new URL(src).origin; } catch { return ""; }
}

exports.handler = async (event) => {
  const origin = requestOrigin(event);
  const allowed = ALLOWED.includes(origin);
  const cors = {
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (!allowed) return { statusCode: 403, headers: cors, body: JSON.stringify({ error: "Forbidden" }) };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Method Not Allowed" };

  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "API key not configured" }) };

  return new Promise((resolve) => {
    const body = event.body;
    const req = https.request({ hostname: "api.anthropic.com", path: "/v1/messages", method: "POST", headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json", "content-length": Buffer.byteLength(body) } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ statusCode: res.statusCode, headers: { ...cors, "Content-Type": "application/json" }, body: data }));
    });
    req.on("error", (e) => resolve({ statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) }));
    req.write(body); req.end();
  });
};
