import { getStore } from "@netlify/blobs";

function store() { return getStore({ name: "crm", consistency: "strong" }); }
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST requerido" }, 405);

  const body = await req.json();
  const { cliente, proyecto } = body;

  if (!cliente?.nombre) return json({ error: "cliente.nombre es obligatorio" }, 400);

  const s = store();
  const now = new Date().toISOString();

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

  // Crear proyecto asociado
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

  // Mover lead a cerrado si viene referenciado
  if (body.lead_id) {
    const leads = (await s.get("leads", { type: "json" })) || [];
    const idx = leads.findIndex(l => l.id === body.lead_id);
    if (idx !== -1) {
      leads[idx] = { ...leads[idx], estado: "cerrado", cliente_id: nuevoCliente.id, updated_at: now };
      await s.setJSON("leads", leads);
    }
  }

  return json({
    ok: true,
    cliente: nuevoCliente,
    proyecto: nuevoProyecto,
    mensaje: `✓ ${nuevoCliente.nombre} registrado en el CRM como cliente ${nuevoCliente.plan.toUpperCase()}`,
  }, 201);
};

export const config = { path: "/api/onboarding" };
