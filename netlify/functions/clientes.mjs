import { getStore } from "@netlify/blobs";

function store() {
  return getStore({ name: "crm", consistency: "strong" });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  const s = store();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (req.method === "GET") {
    const raw = await s.get("clientes", { type: "json" });
    return json(raw || []);
  }

  if (req.method === "POST") {
    const body = await req.json();
    const lista = (await s.get("clientes", { type: "json" })) || [];
    const nuevo = { ...body, id: body.id || crypto.randomUUID(), created_at: new Date().toISOString() };
    lista.push(nuevo);
    await s.setJSON("clientes", lista);
    return json(nuevo, 201);
  }

  if (req.method === "PUT") {
    const body = await req.json();
    const lista = (await s.get("clientes", { type: "json" })) || [];
    const idx = lista.findIndex((x) => x.id === (id || body.id));
    if (idx === -1) return json({ error: "No encontrado" }, 404);
    lista[idx] = { ...lista[idx], ...body, updated_at: new Date().toISOString() };
    await s.setJSON("clientes", lista);
    return json(lista[idx]);
  }

  if (req.method === "DELETE") {
    const lista = (await s.get("clientes", { type: "json" })) || [];
    const nueva = lista.filter((x) => x.id !== id);
    await s.setJSON("clientes", nueva);
    return json({ ok: true });
  }

  return json({ error: "Método no soportado" }, 405);
};

export const config = { path: "/api/clientes" };
