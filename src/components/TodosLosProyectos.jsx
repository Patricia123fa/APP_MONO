import { useState, useMemo } from "react";
import { empleados } from "../data/Trabajadores";

//COLORES ALEATORIOS PASTEL
const pastel = () => {
  const r = Math.floor(Math.random() * 156 + 100);
  const g = Math.floor(Math.random() * 156 + 100);
  const b = Math.floor(Math.random() * 156 + 100);
  return `rgb(${r},${g},${b})`;
};
//SEGÚN EL ESTADO SE VE DE OTRO COLOR LA PALABRA
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

export default function TodosLosProyectos({ companiesData }) {
  const [filtroEmpleado, setFiltroEmpleado] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroProyecto, setFiltroProyecto] = useState("");
  const [filtroMes, setFiltroMes] = useState(""); // "" significa todos los meses

  // COLORES POR EMPRESA
  const empresaColors = useMemo(() => companiesData.map(() => pastel()), [companiesData]);

  // PROYECTOS DISPONIBLES SEGÚN LA EMPRESA SELECCIONADA
  const proyectosDisponibles = useMemo(() => {
    const company = companiesData.find(c => filtroEmpresa && c.name === filtroEmpresa);
    return company ? company.projects : [];
  }, [filtroEmpresa, companiesData]);

  // FILTRADO DE LOS PROYECTOS
  const proyectosFiltrados = useMemo(() => {
    const resultado = [];

    companiesData.forEach((company, i) => {
      if (filtroEmpresa && company.name !== filtroEmpresa) return;

      let proyectos = company.projects;

      if (filtroProyecto) proyectos = proyectos.filter(p => p.name === filtroProyecto);
      if (filtroMes) proyectos = proyectos.filter(p => p.startDate.slice(0, 7) === filtroMes);
      if (filtroEmpleado) proyectos = proyectos.filter(p => p.empleados?.includes(filtroEmpleado));

      if (proyectos.length) resultado.push({ company, proyectos, color: empresaColors[i] });
    });

    return resultado;
  }, [companiesData, filtroEmpleado, filtroEmpresa, filtroMes, filtroProyecto, empresaColors]);

  // TOTAL GENERAL DE HORAS
  const totalGeneralHoras = useMemo(() => {
    return proyectosFiltrados.reduce(
      (total, { proyectos }) =>
        total +
        proyectos.reduce((sum, p) => sum + Object.values(p.horas || {}).reduce((a, b) => a + b, 0), 0),
      0
    );
  }, [proyectosFiltrados]);

  return (
    <div className="space-y-8">
      {/* PANEL DE FILTROS */}
      <div className="mx-auto max-w-4xl rounded-xl bg-white/70 p-4 shadow">
        <div className="mb-2">
          <label className="font-medium text-lg block">Todos los proyectos</label>
          <label className="text-black text-sm block">
            Filtra por monognomo, empresa, proyecto o mes
          </label>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* EMPLEADO*/}
          <select
            value={filtroEmpleado}
            onChange={e => setFiltroEmpleado(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Todos los Monognomos</option>
            {empleados.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>

          {/* EMPRESA */}
          <select
            value={filtroEmpresa}
            onChange={e => {
              setFiltroEmpresa(e.target.value);
              setFiltroProyecto(""); // reset proyecto al cambiar empresa
            }}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Todas las empresas</option>
            {companiesData.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* PROYECTO */}
          <select
            value={filtroProyecto}
            onChange={e => setFiltroProyecto(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            disabled={!filtroEmpresa}
          >
            <option value="">Todos los proyectos</option>
            {proyectosDisponibles.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>

          {/* MES */}
          <input
            type="month"
            value={filtroMes}
            onChange={e => setFiltroMes(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />

          {/* BOTÓN DE TODOS LOS MESES*/}
          <button
            onClick={() => setFiltroMes("")}
            className="w-full rounded-lg bg-[#fdc436] px-4 py-2 text-white hover:bg-[#e4201e]"
          >
            Todos los meses
          </button>
        </div>
      </div>

      {/* LISTA DE PROYECTOS */}
      {proyectosFiltrados.map(({ company, proyectos, color }) => (
        <section key={company.id} className="mx-auto max-w-4xl rounded-2xl bg-white shadow-lg overflow-hidden">
          <header className="px-5 py-4 text-white" style={{ backgroundColor: color }}>
            <h3 className="text-lg font-semibold">{company.name} · {company.location}</h3>
          </header>

          <div className="p-4 space-y-4">
            {proyectos.map(p => {
              const empleadosConHoras = p.empleados
                ?.map(id => ({ ...empleados.find(e => e.id === id), horas: p.horas?.[id] || 0 }))
                .filter(emp => emp.horas > 0);

              const totalHorasProyecto = empleadosConHoras.reduce((sum, emp) => sum + emp.horas, 0);

              if (!empleadosConHoras.length) return null;

              return (
                <div key={p.id} className="border rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-lg">{p.name}</h4>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="space-y-2">
                    {empleadosConHoras.map(emp => (
                      <div key={emp.id} className="flex items-center gap-3">
                        <img src={emp.image} alt={emp.name} className="h-10 w-10 rounded-full object-cover" />
                        <span className="font-medium">{emp.name}</span>
                        <span className="ml-auto font-semibold">{emp.horas} h</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-right font-bold">Total proyecto: {totalHorasProyecto} h</div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* TOTAL GENERAL */}
      <div className="mx-auto max-w-4xl rounded-xl bg-white/70 p-4 shadow text-right font-bold">
        Total general de horas: {totalGeneralHoras} h
      </div>
    </div>
  );
}
