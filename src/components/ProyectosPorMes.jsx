import { useMemo, useState, useEffect } from "react";

const PALETA_PASTEL = ["#F0F4FF", "#F5F5DC", "#E6FFFA", "#FFF5F5", "#FAF5FF", "#F0FFF4", "#FFF9E6"];

const formatearMesAnio = (mesAnioStr) => {
  if (!mesAnioStr) return "";
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
    project_id: "", name: "", originalName: "", workers: "", meses: [], nuevoMes: "" 
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

  const handleBorrarProyecto = async (id, nombre) => {
    const confirmar = window.confirm(`⚠️ ¿Borrar el proyecto "${nombre.toUpperCase()}"?\nSe eliminarán todos los registros asociados.`);
    if (confirmar) {
      try {
        const response = await fetch(`https://registromono.monognomo.com/api.php?action=delete_full_project&id=${id}`);
        const result = await response.json();
        if (result.success) fetchData();
      } catch (err) { alert("Error de conexión"); }
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
      const res = await resp.json();
      if (res.success) {
        await fetchData();
        setModalAbierto(false);
      } else {
        alert("Error al guardar: " + (res.message || "desconocido"));
      }
    } catch (err) { alert("Error al conectar con la API"); }
  };

  const companiesData = useMemo(() => {
    if (!data.length) return [];
    const agrupado = {};
    const datosFiltrados = mesSeleccionado 
      ? data.filter(reg => (reg.date_work && reg.date_work.startsWith(mesSeleccionado)) || reg.month_key === mesSeleccionado)
      : data;

    datosFiltrados.forEach(reg => {
      const empName = reg.company || "Sin Empresa";
      const proyID = reg.project_id; // USAMOS EL ID COMO LLAVE ÚNICA

      if (!agrupado[empName]) agrupado[empName] = { id: empName, name: empName, projects: {} };
      
      if (!agrupado[empName].projects[proyID]) {
        agrupado[empName].projects[proyID] = { 
          id: proyID, 
          name: reg.name, 
          mesesSet: new Set(), 
          workers: reg.manual_workers || "Sin equipo asignado", 
          company: empName 
        };
      }
      const mesAnio = reg.date_work ? reg.date_work.slice(0, 7) : reg.month_key;
      if (mesAnio) agrupado[empName].projects[proyID].mesesSet.add(mesAnio);
    });

    return Object.values(agrupado).map((emp, i) => ({
      ...emp,
      color: PALETA_PASTEL[i % PALETA_PASTEL.length],
      projects: Object.values(emp.projects).map(p => ({
        ...p,
        mesesList: Array.from(p.mesesSet).sort().reverse()
      }))
    }));
  }, [data, mesSeleccionado]);

  if (loading) return <div className="p-10 text-center text-gray-400 text-xs font-bold tracking-widest uppercase">Cargando Proyectos...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-3 md:p-6 font-sans mb-20">
      
      {/* FILTRO SUPERIOR */}
      <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <span className="text-[10px] md:text-xs font-black text-gray-800 uppercase tracking-widest">Gestión por mes</span>
          <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase mt-0.5">Modifica los meses asociados</p>
        </div>
        
        <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
          <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="w-full md:w-48 rounded-2xl border-none bg-gray-50 px-4 py-3 text-[11px] font-bold outline-none" />
          <button onClick={() => setMesSeleccionado("")} className="w-full md:w-auto px-6 py-3 rounded-2xl text-[10px] font-black uppercase bg-gray-800 text-white">Ver Todo</button>
        </div>
      </div>

      {/* LISTADO */}
      <div className="space-y-5">
        {companiesData.map((company) => (
          <div key={company.id} className="bg-white rounded-4xl shadow-sm border border-gray-50 overflow-hidden">
            <button onClick={() => setAbiertos(prev => ({ ...prev, [company.id]: !prev[company.id] }))} className="w-full flex justify-between items-center px-6 py-5" style={{ backgroundColor: company.color }}>
              <span className="font-black uppercase tracking-[0.15em] text-[10px] md:text-[11px] text-gray-700">{company.name}</span>
              <span className="text-gray-500 font-bold text-lg">{abiertos[company.id] ? "−" : "+"}</span>
            </button>

            {abiertos[company.id] && (
              <div className="overflow-hidden">
                <table className="hidden md:table w-full table-fixed text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="w-1/3 px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Proyecto</th>
                      <th className="w-1/4 px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Meses</th>
                      <th className="w-1/4 px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipo</th>
                      <th className="w-24 px-8 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {company.projects.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-8 py-5 text-xs font-bold uppercase text-gray-800 truncate">{p.name}</td>
                        <td className="px-8 py-5">
                          <div className="flex flex-wrap gap-1.5">
                            {p.mesesList.map(m => (
                              <span key={m} className="text-[9px] px-2 py-1 rounded-lg font-bold bg-white border border-gray-100 text-gray-500">{formatearMesAnio(m)}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-[10px] text-gray-400 italic truncate capitalize">{p.workers}</td>
                        <td className="px-8 py-5 text-right flex justify-end gap-4">
                          <button onClick={() => { setEditando({ project_id: p.id, name: p.name, originalName: p.name, workers: p.workers, meses: p.mesesList, nuevoMes: "" }); setModalAbierto(true); }} className="text-sm">✏️</button>
                          <button onClick={() => handleBorrarProyecto(p.id, p.name)} className="text-sm">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* VISTA MÓVIL */}
                <div className="md:hidden divide-y divide-gray-50">
                  {company.projects.map((p) => (
                    <div key={p.id} className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="font-black text-gray-800 text-[11px] uppercase w-2/3">{p.name}</span>
                        <div className="flex gap-4">
                          <button onClick={() => { setEditando({ project_id: p.id, name: p.name, originalName: p.name, workers: p.workers, meses: p.mesesList, nuevoMes: "" }); setModalAbierto(true); }} className="text-base">✏️</button>
                          <button onClick={() => handleBorrarProyecto(p.id, p.name)} className="text-base">🗑️</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.mesesList.map(m => (
                          <span key={m} className="text-[8px] px-2 py-0.5 rounded-md font-bold bg-gray-50 text-gray-400">{formatearMesAnio(m)}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 italic">{p.workers}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL */}
      {modalAbierto && (
        <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-800">Editor</h3>
              <button onClick={() => setModalAbierto(false)} className="text-3xl text-gray-300">&times;</button>
            </div>
            <form onSubmit={handleGuardarCambios} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Proyecto (Solo Lectura)</label>
                <input type="text" value={editando.name} readOnly className="w-full mt-2 p-4 bg-gray-100 rounded-2xl text-sm font-bold text-gray-400 cursor-not-allowed outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Monognomos Asignados</label>
                <textarea value={editando.workers} onChange={e => setEditando({...editando, workers: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#fdc436] outline-none h-20 resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Meses</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editando.meses.map(m => (
                    <div key={m} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-xl">
                      <span className="text-[9px] font-bold text-gray-600 uppercase">{formatearMesAnio(m)}</span>
                      <button type="button" onClick={() => setEditando({...editando, meses: editando.meses.filter(x => x !== m)})} className="text-red-400 font-bold text-lg">&times;</button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <input type="month" value={editando.nuevoMes} onChange={e => setEditando({...editando, nuevoMes: e.target.value})} className="flex-1 p-3 bg-gray-50 rounded-2xl text-xs font-bold outline-none" />
                  <button type="button" onClick={() => { if(editando.nuevoMes && !editando.meses.includes(editando.nuevoMes)) { setEditando(prev => ({...prev, meses: [...prev.meses, prev.nuevoMes].sort().reverse(), nuevoMes: ""})); } }} className="px-6 bg-gray-800 text-white rounded-2xl text-[10px] font-black uppercase">Añadir</button>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setModalAbierto(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-[#fdc436] text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-black transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}