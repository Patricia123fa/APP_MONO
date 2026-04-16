import { useMemo, useState, useEffect } from "react";

const PALETA_PASTEL = ["#F0F4FF", "#F5F5DC", "#E6FFFA", "#FFF5F5", "#FAF5FF", "#F0FFF4", "#FFF9E6"];
const ORDEN_PRIORIDAD = ["Monognomo", "Neozink", "Yurmuvi", "Picofino", "Castrillo2", "EDP"];

const formatearMesAnio = (mesAnioStr) => {
  if (!mesAnioStr) return "";
  if (mesAnioStr === "9999-12" || mesAnioStr === "999912") return "✨ SIEMPRE ACTIVO";
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
  const [busquedaProyecto, setBusquedaProyecto] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  
  // ACTUALIZACIÓN: Añadido 'workers' al estado para no perder el equipo al guardar
  const [editando, setEditando] = useState({ 
    project_id: "", name: "", originalName: "", meses: [], isActive: false, workers: "" 
  }); 

  const mesActual = new Date().toISOString().slice(0, 7); 

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

  const handleGuardarCambios = async (e) => {
    e.preventDefault();
    if (!editando.name.trim()) return alert("El nombre del proyecto no puede estar vacío.");

    let mesesFinales = [...editando.meses];

    if (editando.isActive) {
      if (!mesesFinales.includes("9999-12")) mesesFinales.push("9999-12");
    } else {
      mesesFinales = mesesFinales.filter(m => m !== "9999-12" && m !== "999912");
      if (!mesesFinales.includes(mesActual)) mesesFinales.push(mesActual);
    }

    try {
      // Enviamos todo el objeto 'editando' que ahora incluye el nombre y el equipo
      const resp = await fetch(`https://registromono.monognomo.com/api.php?action=edit_full_project_details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editando, meses: mesesFinales })
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

    data.forEach(reg => {
      const empRaw = reg.company || "Sin Empresa";
      const empKey = empRaw.trim().toLowerCase();
      let finalKey = Object.keys(agrupado).find(k => k.toLowerCase() === empKey) || empRaw.trim();
      
      if (!agrupado[finalKey]) agrupado[finalKey] = { id: finalKey, name: finalKey, projects: {} };

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
      if (reg.month_key) agrupado[finalKey].projects[proyID].mesesSet.add(reg.month_key);
    });

    return Object.values(agrupado)
      .map((emp) => {
        const proyectosProcesados = Object.values(emp.projects).map(p => {
          const lista = Array.from(p.mesesSet);
          const sinMes = lista.length === 0;
          const textoBusqueda = `${p.name} ${emp.name}`.toLowerCase();
          const coincideBusqueda = !busquedaProyecto.trim() || textoBusqueda.includes(busquedaProyecto.trim().toLowerCase());
          return {
            ...p,
            mesesList: lista.sort().reverse(),
            isActive: lista.includes("9999-12") || lista.includes("999912"),
            sinMes,
            coincideBusqueda
          };
        }).filter(p => {
          if (busquedaProyecto.trim() && !p.coincideBusqueda) return false;
          if (!mesSeleccionado) return true;
          return p.sinMes || p.isActive || p.mesesList.includes(mesSeleccionado);
        });
        return { ...emp, projects: proyectosProcesados };
      })
      .filter(emp => emp.projects.length > 0)
      .sort((a, b) => {
        let idxA = ORDEN_PRIORIDAD.indexOf(a.name);
        let idxB = ORDEN_PRIORIDAD.indexOf(b.name);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB) || a.name.localeCompare(b.name);
      })
      .map((emp, i) => ({ ...emp, color: PALETA_PASTEL[i % PALETA_PASTEL.length] }));
  }, [data, mesSeleccionado, busquedaProyecto]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-3 md:p-6 font-sans mb-6 text-left">
      
      {/* HEADER */}
      <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="text-left">
          <span className="text-[10px] md:text-xs font-black text-gray-800 uppercase tracking-widest leading-none">Gestión de Proyectos</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input
            type="text"
            value={busquedaProyecto}
            onChange={(e) => setBusquedaProyecto(e.target.value)}
            placeholder="Buscar proyecto o empresa"
            className="w-full sm:w-72 bg-gray-50 px-4 py-2 rounded-2xl border-none text-[11px] font-bold outline-none focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-300"
          />
          <div className="flex gap-2">
            <input
              type="month"
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="bg-gray-50 px-4 py-2 rounded-2xl border-none text-[11px] font-bold outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
            />
            <button
              onClick={() => setMesSeleccionado("")}
              className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase bg-gray-400 text-white active:scale-95 transition-transform"
            >
              Quitar mes
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {companiesData.map((company) => (
          <div key={company.id} className="bg-white rounded-4xl shadow-sm border border-gray-50 overflow-hidden text-left">
            <button onClick={() => setAbiertos(prev => ({ ...prev, [company.id]: !prev[company.id] }))} className="w-full flex justify-between items-center px-6 py-5 transition-all" style={{ backgroundColor: company.color }}>
              <span className="font-black uppercase text-[10px] md:text-[11px] text-gray-700 tracking-widest">{company.name} ({company.projects.length})</span>
              <span className="text-gray-500 font-bold">{abiertos[company.id] ? "−" : "+"}</span>
            </button>

            {abiertos[company.id] && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Proyecto</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipo</th>
                      <th className="px-8 py-4 w-[10%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {company.projects.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/30 transition-colors align-top">
                        <td className="px-8 py-5 text-xs font-bold uppercase text-gray-800 leading-relaxed">
                          {p.name}
                          <div className="flex flex-wrap gap-1 mt-2">
                             {p.mesesList.filter(m => m !== '9999-12').slice(0, 2).map(m => (
                               <span key={m} className="text-[8px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-100">{m}</span>
                             ))}
                             {p.sinMes && (
                               <span className="text-[8px] text-gray-500 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-dashed border-gray-300">Sin mes</span>
                             )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center items-center h-full">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${p.sinMes ? 'bg-gray-100 border-gray-200 text-gray-500' : p.isActive ? 'bg-green-100 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${p.sinMes ? 'bg-gray-400' : p.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                              {p.sinMes ? "Sin mes" : p.isActive ? "Activo" : "Cerrado"}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-[10px] text-gray-400 italic">👥 {p.display_workers}</td>
                        <td className="px-8 py-5 text-right">
                          {/* ACTUALIZACIÓN: Ahora pasamos p.display_workers al abrir el modal */}
                          <button onClick={() => { 
                            setEditando({ 
                              project_id: p.id, 
                              name: p.name, 
                              originalName: p.name, 
                              meses: p.mesesList, 
                              isActive: p.isActive,
                              workers: p.display_workers // <--- Importante
                            }); 
                            setModalAbierto(true); 
                          }} className="text-lg hover:scale-125 transition-transform">✏️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-800">Editor de Ciclo de Vida</h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{editando.name}</p>
              </div>
              <button onClick={() => setModalAbierto(false)} className="text-3xl text-gray-300 hover:text-gray-500 transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleGuardarCambios} className="space-y-8">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre del Proyecto</label>
                <input 
                  type="text" value={editando.name}
                  onChange={(e) => setEditando({...editando, name: e.target.value})}
                  className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border-none outline-none text-[11px] font-bold text-gray-800 uppercase focus:ring-2 focus:ring-yellow-400 transition-all"
                />
              </div>

              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                   <div>
                      <p className="text-[11px] font-black text-gray-800 uppercase tracking-tight">Visibilidad activa</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Estado actual del proyecto</p>
                   </div>
                   <div 
                    onClick={() => setEditando({...editando, isActive: !editando.isActive})}
                    className={`relative w-14 h-7 rounded-full cursor-pointer transition-colors duration-300 ${editando.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                   >
                     <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ${editando.isActive ? 'translate-x-7' : 'translate-x-0'}`} />
                   </div>
                </div>
                
                {!editando.isActive && (
                   <p className="text-[9px] text-orange-600 font-bold italic bg-orange-50 p-3 rounded-xl border border-orange-100">
                     ⚠️ Al cerrar, se guardará en el historial de {formatearMesAnio(mesActual)} y dejará de aparecer en meses futuros.
                   </p>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setModalAbierto(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-yellow-400 text-black rounded-3xl text-[10px] font-black uppercase shadow-xl hover:bg-black hover:text-white transition-all active:scale-95">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
