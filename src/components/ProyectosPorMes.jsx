import { useMemo, useState, useEffect } from "react";

const PALETA_PASTEL = ["#F0F4FF", "#F5F5DC", "#E6FFFA", "#FFF5F5", "#FAF5FF", "#F0FFF4", "#FFF9E6"];

const ORDEN_PRIORIDAD = ["Monognomo", "Neozink", "Yurmuvi", "Picofino", "Castrillo2", "EDP"];

const formatearMesAnio = (mesAnioStr) => {
  if (!mesAnioStr) return "";
  if (mesAnioStr === "9999-12") return "✨ SIEMPRE ACTIVO";
  const [year, month] = mesAnioStr.split("-");
  const fecha = new Date(year, month - 1);
  const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fecha);
  return `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${year}`;
};

export default function ProyectosPorMes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abiertos, setAbiertos] = useState({});
  const [mesSeleccionado, setMesSeleccionado] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState({ 
    project_id: "", name: "", originalName: "", meses: [], nuevoMes: "" 
  }); 

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://registromono.monognomo.com/api.php?action=get_all_projects&t=${Date.now()}`);
      const result = await response.json();
      if (result.success) setData(result.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const activarSiempre = () => {
    if (!editando.meses.includes("9999-12")) {
      setEditando({ ...editando, meses: ["9999-12", ...editando.meses] });
    }
  };

  const handleBorrarProyecto = async (id, nombre) => {
    if (window.confirm(`⚠️ ¿Borrar el proyecto "${nombre.toUpperCase()}"?`)) {
      try {
        const response = await fetch(`https://registromono.monognomo.com/api.php?action=delete_full_project&id=${id}`);
        if ((await response.json()).success) fetchData();
      } catch (err) { alert("Error de conexión"); }
    }
  };

  const handleEliminarMes = (mes) => {
    if (window.confirm(`¡¡CUIDADO!! ⚠️\nVas a eliminar ${formatearMesAnio(mes)}...`)) {
      setEditando(prev => ({...prev, meses: prev.meses.filter(m => m !== mes)}));
    }
  };

  const handleGuardarCambios = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch(`https://registromono.monognomo.com/api.php?action=edit_full_project_details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editando)
      });
      if ((await resp.json()).success) {
        await fetchData();
        setModalAbierto(false);
      }
    } catch (err) { alert("Error al conectar"); }
  };

  const companiesData = useMemo(() => {
    if (!data.length) return [];
    const agrupado = {};
    const mesBuscado = mesSeleccionado.replace(/-/g, "").trim();

    const datosFiltrados = data.filter(reg => {
        if (!mesSeleccionado) return true;
        const mesBD = String(reg.month_key || "").replace(/-/g, "").trim();
        return (mesBD === mesBuscado || mesBD === "999912" || !reg.month_key);
    });

    datosFiltrados.forEach(reg => {
      const empRaw = reg.company || "Sin Empresa";
      const empKey = empRaw.trim().toLowerCase();
      let finalKey = Object.keys(agrupado).find(k => k.toLowerCase() === empKey) || empRaw.trim();
      
      if (!agrupado[finalKey]) {
          agrupado[finalKey] = { id: finalKey, name: finalKey, projects: {} };
      }

      const proyID = reg.project_id;
      if (!agrupado[finalKey].projects[proyID]) {
        agrupado[finalKey].projects[proyID] = { 
          id: proyID, 
          name: reg.name, 
          mesesSet: new Set(), 
          display_workers: reg.display_workers || "Sin equipo asignado", 
          company: finalKey 
        };
      }
      const mesAnio = reg.date_work ? reg.date_work.slice(0, 7) : reg.month_key;
      if (mesAnio) agrupado[finalKey].projects[proyID].mesesSet.add(mesAnio);
    });

    return Object.values(agrupado)
      .sort((a, b) => {
        let idxA = ORDEN_PRIORIDAD.indexOf(a.name);
        let idxB = ORDEN_PRIORIDAD.indexOf(b.name);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB) || a.name.localeCompare(b.name);
      })
      .map((emp, i) => ({
        ...emp,
        color: PALETA_PASTEL[i % PALETA_PASTEL.length],
        projects: Object.values(emp.projects).map(p => ({
          ...p,
          mesesList: Array.from(p.mesesSet).sort().reverse()
        }))
      }));
  }, [data, mesSeleccionado]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-3 md:p-6 font-sans mb-6 text-left">
      <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] md:text-xs font-black text-gray-800 uppercase tracking-widest leading-none">Gestión por mes</span>
          <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase mt-1">Equipo sincronizado con logística</p>
        </div>
        <div className="flex gap-2">
          <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="bg-gray-50 px-4 py-2 rounded-2xl border-none text-[11px] font-bold outline-none" />
          <button onClick={() => setMesSeleccionado("")} className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase bg-gray-400 text-white active:scale-95 transition-transform">Ver Todo</button>
        </div>
      </div>

      <div className="space-y-5">
        {companiesData.map((company) => (
          <div key={company.id} className="bg-white rounded-4xl shadow-sm border border-gray-50 overflow-hidden">
            <button onClick={() => setAbiertos(prev => ({ ...prev, [company.id]: !prev[company.id] }))} className="w-full flex justify-between items-center px-6 py-5 transition-all" style={{ backgroundColor: company.color }}>
              <span className="font-black uppercase text-[10px] md:text-[11px] text-gray-700 tracking-widest">{company.name}</span>
              <span className="text-gray-500 font-bold">{abiertos[company.id] ? "−" : "+"}</span>
            </button>

            {abiertos[company.id] && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-[30%]">Proyecto</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-[25%]">Meses</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-[35%]">Equipo Logística</th>
                      <th className="px-8 py-4 w-[10%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {company.projects.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/30 transition-colors align-top">
                        <td className="px-8 py-5 text-xs font-bold uppercase text-gray-800 leading-relaxed">{p.name}</td>
                        <td className="px-8 py-5">
                          <div className="flex flex-wrap gap-1">
                            {p.mesesList.map(m => (
                              <span key={m} className={`text-[9px] px-2 py-1 rounded-lg font-bold border ${m === '9999-12' ? 'bg-yellow-100 border-yellow-200 text-yellow-700' : 'bg-white border-gray-100 text-gray-500'}`}>
                                {formatearMesAnio(m)}
                              </span>
                            ))}
                          </div>
                        </td>
                        {/* CAMBIO ESTÉTICO: SIN TRUNCATE PARA VER TODOS LOS NOMBRES */}
                        <td className="px-8 py-5 text-[10px] text-gray-400 italic leading-relaxed">
                           <span className="not-italic mr-1">👥</span>
                           {p.display_workers}
                        </td>
                        <td className="px-8 py-5 text-right flex gap-3 justify-end">
                          <button onClick={() => { setEditando({ project_id: p.id, name: p.name, originalName: p.name, meses: p.mesesList, nuevoMes: "" }); setModalAbierto(true); }}>✏️</button>
                          <button onClick={() => handleBorrarProyecto(p.id, p.name)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* VISTA MÓVIL */}
                <div className="md:hidden divide-y divide-gray-100">
                  {company.projects.map((p) => (
                    <div key={p.id} className="p-5 space-y-3">
                      <div className="flex justify-between items-start gap-4 text-left">
                        <span className="font-black text-gray-800 text-[11px] uppercase leading-tight">{p.name}</span>
                        <div className="flex gap-4 shrink-0">
                          <button onClick={() => { setEditando({ project_id: p.id, name: p.name, originalName: p.name, meses: p.mesesList, nuevoMes: "" }); setModalAbierto(true); }} className="text-lg">✏️</button>
                          <button onClick={() => handleBorrarProyecto(p.id, p.name)} className="text-lg">🗑️</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {p.mesesList.map(m => (
                          <span key={m} className={`text-[8px] px-2 py-0.5 rounded-md font-bold border ${m === '9999-12' ? 'bg-yellow-100 border-yellow-200 text-yellow-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                            {formatearMesAnio(m)}
                          </span>
                        ))}
                      </div>
                      {/* TAMBIÉN EN MÓVIL SE VE COMPLETO */}
                      <p className="text-[9px] text-gray-400 italic font-medium leading-normal">👥 {p.display_workers}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL (SIN CAMBIOS) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-800">Editor de Meses</h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{editando.name}</p>
              </div>
              <button onClick={() => setModalAbierto(false)} className="text-3xl text-gray-300 hover:text-gray-500 transition-colors">&times;</button>
            </div>
            <form onSubmit={handleGuardarCambios} className="space-y-6">
              <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 text-left">
                <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest mb-1">Nota Informativa</p>
                <p className="text-[10px] text-blue-800/70 font-medium leading-relaxed">El equipo se gestiona automáticamente desde la sección de <b>División de Trabajo</b>.</p>
              </div>

              <div className="text-left">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Meses Activos</label>
                  <button type="button" onClick={activarSiempre} className="text-[9px] font-black px-3 py-1 bg-yellow-400 text-black rounded-full hover:bg-black hover:text-white transition-all shadow-sm">🚀 Activar Siempre</button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                  {editando.meses.map(m => (
                    <div key={m} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${m === '9999-12' ? 'bg-yellow-100 border border-yellow-200' : 'bg-gray-100'}`}>
                      <span className="text-[9px] font-bold text-gray-600 uppercase">{formatearMesAnio(m)}</span>
                      <button type="button" onClick={() => handleEliminarMes(m)} className="text-red-400 font-bold hover:text-red-600">&times;</button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                   <input type="month" value={editando.nuevoMes} onChange={e => setEditando({...editando, nuevoMes: e.target.value})} className="flex-1 p-3 bg-gray-50 rounded-2xl text-[11px] font-bold border-none outline-none focus:ring-2 focus:ring-yellow-400" />
                   <button type="button" onClick={() => { if(editando.nuevoMes && !editando.meses.includes(editando.nuevoMes)) setEditando(prev => ({...prev, meses: [...prev.meses, prev.nuevoMes].sort().reverse(), nuevoMes: ""})); }} className="px-6 bg-gray-800 text-white rounded-2xl text-[10px] font-black uppercase shadow-md active:scale-95 transition-transform">Añadir</button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setModalAbierto(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-yellow-400 text-black rounded-3xl text-[10px] font-black uppercase shadow-xl hover:bg-black hover:text-white transition-all active:scale-95">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}