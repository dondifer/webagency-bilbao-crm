import { getStore } from "@netlify/blobs";

function store() { return getStore({ name: "crm", consistency: "strong" }); }
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST requerido" }, 405);
  const s = store();
  await Promise.all([
    s.setJSON("clientes", []),
    s.setJSON("proyectos", []),
    s.setJSON("leads", []),
  ]);
  return json({ ok: true });
};

export const config = { path: "/api/clear-demo" };
