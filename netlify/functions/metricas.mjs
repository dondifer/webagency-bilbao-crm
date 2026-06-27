import { getStore } from "@netlify/blobs";

function store() { return getStore({ name: "crm", consistency: "strong" }); }
function json(data) {
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

export default async () => {
  const s = store();
  const [clientes, proyectos, leads] = await Promise.all([
    s.get("clientes", { type: "json" }),
    s.get("proyectos", { type: "json" }),
    s.get("leads", { type: "json" }),
  ]);
  const c = clientes || [], p = proyectos || [], l = leads || [];

  const mrr = c.filter(x => x.estado === "activo").reduce((acc, x) => {
    const planes = { "starter": 39, "negocio": 69, "premium": 99 };
    return acc + (planes[x.plan?.toLowerCase()] || 0);
  }, 0);

  return json({
    mrr,
    clientes_activos: c.filter(x => x.estado === "activo").length,
    proyectos_en_curso: p.filter(x => x.estado === "en_curso").length,
    leads_activos: l.filter(x => x.estado !== "entregado").length,
    pipeline_valor: l.reduce((acc, x) => acc + (parseInt(x.valor_estimado) || 0), 0),
  });
};

export const config = { path: "/api/metricas" };
