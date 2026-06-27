import { getStore } from "@netlify/blobs";

function store() { return getStore({ name: "crm", consistency: "strong" }); }
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST requerido" }, 405);
  const s = store();

  const clientes = [
    { id: "c1", nombre: "Taller Etxebarri", sector: "Taller mecánico", zona: "Barakaldo", email: "taller@etxebarri.com", telefono: "+34 944 000 001", plan: "starter", estado: "activo", created_at: new Date().toISOString() },
    { id: "c2", nombre: "Fisio Amara Bilbao", sector: "Fisioterapia", zona: "Bilbao", email: "info@fisioamara.com", telefono: "+34 944 000 002", plan: "negocio", estado: "activo", created_at: new Date().toISOString() },
    { id: "c3", nombre: "Estética Ana Bilbao", sector: "Estética", zona: "Bilbao", email: "ana@estetica.com", telefono: "+34 944 000 003", plan: "negocio", estado: "activo", created_at: new Date().toISOString() },
    { id: "c4", nombre: "Academia Ingenieros", sector: "Academia", zona: "Leioa", email: "info@academiabi.com", telefono: "+34 944 000 004", plan: "premium", estado: "activo", created_at: new Date().toISOString() },
    { id: "c5", nombre: "Restaurante Kaia", sector: "Hostelería", zona: "Getxo", email: "kaia@restaurante.com", telefono: "+34 944 000 005", plan: "starter", estado: "activo", created_at: new Date().toISOString() },
  ];

  const proyectos = [
    { id: "p1", nombre: "Web corporativa", cliente_id: "c2", cliente_nombre: "Fisio Amara Bilbao", tipo: "Web Starter", estado: "en_curso", fecha_entrega: "2026-07-10", valor: 490, created_at: new Date().toISOString() },
    { id: "p2", nombre: "CRM + Web", cliente_id: "c4", cliente_nombre: "Academia Ingenieros", tipo: "Ecosistema", estado: "en_curso", fecha_entrega: "2026-07-20", valor: 990, created_at: new Date().toISOString() },
    { id: "p3", nombre: "Web landing", cliente_id: "c3", cliente_nombre: "Estética Ana Bilbao", tipo: "Web Starter", estado: "entregado", fecha_entrega: "2026-06-15", valor: 490, created_at: new Date().toISOString() },
  ];

  const leads = [
    { id: "l1", empresa: "Clínica Fisio Getxo", sector: "Fisioterapia", zona: "Getxo", contacto: "Miren Txurruka", estado: "propuesta_enviada", producto_interes: "Ecosistema Negocio", valor_estimado: 990, created_at: new Date().toISOString() },
    { id: "l2", empresa: "Taller Motos Erandio", sector: "Taller", zona: "Erandio", contacto: "Joseba Aguirre", estado: "reunion", producto_interes: "Web Starter", valor_estimado: 490, created_at: new Date().toISOString() },
    { id: "l3", empresa: "Hotel Rural Urkiola", sector: "Hostelería", zona: "Durango", contacto: "Ane Bilbao", estado: "contactado", producto_interes: "Ecosistema Premium", valor_estimado: 1800, created_at: new Date().toISOString() },
    { id: "l4", empresa: "Fontanería Bilbao Norte", sector: "Instalador", zona: "Bilbao", contacto: "Iñaki López", estado: "contactado", producto_interes: "Web Starter", valor_estimado: 490, created_at: new Date().toISOString() },
  ];

  await Promise.all([
    s.setJSON("clientes", clientes),
    s.setJSON("proyectos", proyectos),
    s.setJSON("leads", leads),
  ]);

  return json({ ok: true, datos: { clientes: clientes.length, proyectos: proyectos.length, leads: leads.length } });
};

export const config = { path: "/api/seed-demo" };
