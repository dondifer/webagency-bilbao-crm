import { getStore } from "@netlify/blobs";

function store() { return getStore({ name: "crm", consistency: "strong" }); }
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Proxy-Secret",
    }
  });
}

// Secret para que solo Claude pueda llamar a este endpoint
const PROXY_SECRET = "wab-proxy-2025";

export default async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") return json({}, 200);

  // Auth básica por cabecera
  const secret = req.headers.get("x-proxy-secret");
  if (secret !== PROXY_SECRET) return json({ error: "No autorizado" }, 401);

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "onboarding";

  const s = store();
  const now = new Date().toISOString();

  // ── ACCIÓN: onboarding ──────────────────────────────────────────────
  if (action === "onboarding") {
    if (req.method !== "POST") return json({ error: "POST requerido" }, 405);

    const body = await req.json();
    const { cliente, proyecto } = body;
    if (!cliente?.nombre) return json({ error: "cliente.nombre obligatorio" }, 400);

    // Crear cliente
    const clientes = (await s.get("clientes", { type: "json" })) || [];
    const nuevoCliente = {
      id: crypto.randomUUID(),
      nombre: cliente.nombre,
      sector: cliente.sector || "",
      zona: cliente.zona || "",
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      plan: cliente.plan || "premium",
      estado: "activo",
      url_web: cliente.url_web || "",
      url_crm: cliente.url_crm || "",
      repo_github: cliente.repo_github || "",
      notas: cliente.notas || "",
      created_at: now,
    };
    clientes.push(nuevoCliente);
    await s.setJSON("clientes", clientes);

    // Crear proyecto
    let nuevoProyecto = null;
    if (proyecto) {
      const proyectos = (await s.get("proyectos", { type: "json" })) || [];
      nuevoProyecto = {
        id: crypto.randomUUID(),
        nombre: proyecto.nombre || `Ecosistema ${nuevoCliente.nombre}`,
        cliente_id: nuevoCliente.id,
        cliente_nombre: nuevoCliente.nombre,
        tipo: proyecto.tipo || "Ecosistema Premium",
        estado: proyecto.estado || "en_curso",
        fecha_entrega: proyecto.fecha_entrega || null,
        valor: proyecto.valor || 1800,
        url_web: proyecto.url_web || cliente.url_web || "",
        url_crm: proyecto.url_crm || cliente.url_crm || "",
        repo_github: proyecto.repo_github || cliente.repo_github || "",
        notas: proyecto.notas || "",
        created_at: now,
      };
      proyectos.push(nuevoProyecto);
      await s.setJSON("proyectos", proyectos);
    }

    // Cerrar lead si viene referenciado
    if (body.lead_id) {
      const leads = (await s.get("leads", { type: "json" })) || [];
      const idx = leads.findIndex(l => l.id === body.lead_id);
      if (idx !== -1) {
        leads[idx] = { ...leads[idx], estado: "cerrado", cliente_id: nuevoCliente.id, updated_at: now };
        await s.setJSON("leads", leads);
      }
    }

    return json({ ok: true, cliente: nuevoCliente, proyecto: nuevoProyecto,
      mensaje: `✓ ${nuevoCliente.nombre} registrado como cliente ${nuevoCliente.plan.toUpperCase()}` }, 201);
  }

  // ── ACCIÓN: ping ────────────────────────────────────────────────────
  if (action === "ping") {
    const clientes = (await s.get("clientes", { type: "json" })) || [];
    return json({ ok: true, clientes_total: clientes.length, timestamp: now });
  }

  return json({ error: `Acción desconocida: ${action}` }, 400);
};

export const config = { path: "/api/proxy" };
