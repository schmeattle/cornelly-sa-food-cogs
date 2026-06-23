import { getStore } from "@netlify/blobs";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const store = getStore("sa-food-cogs");

  if (path === "/api/data" && req.method === "GET") {
    const data = await store.get("state", { type: "json" });
    return json(data || { ingredients: [], recipes: [], inHousePreps: [] });
  }

  if (path === "/api/data" && req.method === "POST") {
    let body;
    try { body = await req.json(); } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    if (!body || typeof body !== "object" || !Array.isArray(body.ingredients)) {
      return json({ error: "Invalid state" }, 400);
    }
    await store.setJSON("state", body);
    return json({ ok: true });
  }

  return json({ error: "Not found" }, 404);
};

export const config = {
  path: ["/api/data"],
};
