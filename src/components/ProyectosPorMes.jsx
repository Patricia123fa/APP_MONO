import { useMemo, useState } from "react";
import { empleados } from "../data/Trabajadores";

//GENERA UN COLOR PASTEL ALEATORIO USANDO RGB
const pastel = () => {
  const r = Math.floor(Math.random() * 156 + 100);
  const g = Math.floor(Math.random() * 156 + 100);
  const b = Math.floor(Math.random() * 156 + 100);
  return `rgb(${r},${g},${b})`;
};

//SEGÚN EL STATUS CAMBIA DE COLOR 
const StatusBadge = ({ status }) => {
  const map = {
    activo: "bg-emerald-100 text-emerald-700",
    pausado: "bg-amber-100 text-amber-700",
    finalizado: "bg-slate-200 text-slate-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
        map[status] || "bg-sky-100 text-sky-700"
      }`}
    >
      {status}
    </span>
  );
};

// RECIBE LOS DATOS DE LA COMPAÑÍA 
export default function ProyectosPorMes({ companiesData }) {
  const [mesSeleccionado, setMesSeleccionado] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [verTodos, setVerTodos] = useState(false);

  const empresaColors = useMemo(
    () => companiesData.map(() => pastel()),
    [companiesData]
  );

  return (
    <div className="space-y-10">
      {/* FILTRO */}
      <div className="mx-auto max-w-4xl rounded-xl bg-white/70 p-4 shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <label className="font-medium">Selecciona mes</label>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <input
              type="month"
              value={mesSeleccionado}
              onChange={(e) => {
                setMesSeleccionado(e.target.value);
                setVerTodos(false);
              }}
              className="w-full rounded-lg border px-3 py-2 sm:w-auto"
            />
            <button
              onClick={() => setVerTodos(true)}
              className="w-full rounded-lg bg-[#fdc436] px-4 py-2 text-white hover:bg-[#e4201e] sm:w-auto"
            >
              Ver todos
            </button>
          </div>
        </div>
      </div>

      {companiesData.map((company, i) => {
        const proyectosFiltrados = verTodos
          ? company.projects
          : company.projects.filter(
              (p) => p.startDate.slice(0, 7) === mesSeleccionado
            );

        if (!proyectosFiltrados.length) return null;

        return (
          <section
            key={company.id}
            className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lg"
          >
            {/* HEADER EMPRESA */}
            <header
              className="px-5 py-4 text-white"
              style={{ backgroundColor: empresaColors[i] }}
            >
              <h3 className="text-lg font-semibold">
                {company.name} · {company.location}
              </h3>
            </header>

            {/* TARJETAS POR CADA EMPRESA */}
            <div className="block sm:hidden space-y-4 p-4">
              {proyectosFiltrados.map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border bg-white p-4 shadow-sm"
                >
                  <h4 className="font-semibold text-lg mb-2">{project.name}</h4>

                  <div className="text-sm text-slate-600 space-y-1">
                    <p><strong>Mes:</strong> {project.startDate.slice(0, 7)}</p>
                    <p>
                      <strong>Monognomos asinados:</strong>{" "}
                      {project.empleados?.length
                        ? project.empleados
                            .map((id) => empleados.find((e) => e.id === id)?.name)
                            .join(", ")
                        : "-"}
                    </p>
                    <p>
                      <strong>Estado:</strong>{" "}
                      <StatusBadge status={project.status} />
                    </p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 rounded-lg bg-[#fdc436] py-2 text-white">
                      Editar
                    </button>
                    <button className="flex-1 rounded-lg bg-slate-500 py-2 text-white">
                      Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* TABLA */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Proyecto</th>
                    <th className="px-4 py-3">Mes</th>
                    <th className="px-4 py-3">Monognomos</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proyectosFiltrados.map((project, idx) => (
                    <tr
                      key={project.id}
                      className={`${idx % 2 ? "bg-slate-50" : "bg-white"} hover:bg-slate-100`}
                    >
                      <td className="px-4 py-3 font-medium">{project.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {project.startDate.slice(0, 7)}
                      </td>
                      <td className="px-4 py-3">
                        {project.empleados?.length
                          ? project.empleados
                              .map((id) => empleados.find((e) => e.id === id)?.name)
                              .join(", ")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button className="rounded bg-[#fdc436] px-3 py-1 text-white hover:bg-[#e4201e]">
                          Editar
                        </button>
                        <button className="rounded bg-slate-500 px-3 py-1 text-white hover:bg-red-600">
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
