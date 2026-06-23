// claude proxy
const https = require("https");
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" }, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  return new Promise((resolve) => {
    const body = event.body;
    const req = https.request({ hostname: "api.anthropic.com", path: "/v1/messages", method: "POST", headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json", "content-length": Buffer.byteLength(body) } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ statusCode: res.statusCode, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: data }));
    });
    req.on("error", (e) => resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) }));
    req.write(body); req.end();
  });
};