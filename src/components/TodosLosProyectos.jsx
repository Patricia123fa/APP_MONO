import { useState, useEffect, useMemo } from "react";

const URL_BASE_FOTOS = "https://registromono.monognomo.com/assets/";

// --- UTILIDADES ---
const getISOWeek = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
};

const getNombreMes = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
};

const getProjectColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 40%, 94%)`; 
};

export default function TodosLosProyectos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abiertos, setAbiertos] = useState({});

  const [filtroEmpleado, setFiltroEmpleado] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroProyecto, setFiltroProyecto] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [modoMesCompleto, setModoMesCompleto] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch(`https://registromono.monognomo.com/api.php?action=get_all_projects&t=${Date.now()}`);
      const result = await response.json();
      if (result.success) {
        // --- FILTRO APLICADO AQUÍ ---
        // Solo guardamos registros que tengan más de 0 horas para limpiar la vista general
        const datosLimpios = result.data
          .filter(reg => parseFloat(reg.hours) > 0)
          .map(reg => ({ ...reg, semanaReal: getISOWeek(reg.date_work) }));
        
        setData(datosLimpios);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleBorrar = async (id) => {
    if (!window.confirm("¿Borrar este registro?")) return;
    try {
      const resp = await fetch(`https://registromono.monognomo.com/api.php?action=delete_entry&id=${id}`);
      const res = await resp.json();
      if (res.success) {
        setData(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) { alert("Error al borrar"); }
  };

  const handleEditar = async (reg) => {
    const nuevasHoras = window.prompt(`Editar horas:`, reg.hours);
    if (nuevasHoras !== null && nuevasHoras !== reg.hours && !isNaN(nuevasHoras)) {
      try {
        const resp = await fetch(`https://registromono.monognomo.com/api.php?action=edit_entry&id=${reg.id}&hours=${nuevasHoras}`);
        const res = await resp.json();
        if (res.success) {
          setData(prev => prev.map(item => item.id === reg.id ? { ...item, hours: nuevasHoras } : item));
        }
      } catch (err) { alert("Error al editar"); }
    }
  };

  const infoTemporal = useMemo(() => {
    if (!fechaSeleccionada) return null;
    return {
      mesNombre: getNombreMes(fechaSeleccionada),
      mesID: fechaSeleccionada.substring(0, 7),
      semana: getISOWeek(fechaSeleccionada)
    };
  }, [fechaSeleccionada]);

  const filtradoFinal = useMemo(() => {
    let res = data;
    if (filtroEmpleado) res = res.filter(r => r.worker === filtroEmpleado);
    if (filtroEmpresa) res = res.filter(r => r.company === filtroEmpresa);
    if (filtroProyecto) res = res.filter(r => r.name === filtroProyecto);
    if (infoTemporal) {
      if (modoMesCompleto) res = res.filter(r => r.date_work && r.date_work.includes(infoTemporal.mesID));
      else res = res.filter(r => r.semanaReal === infoTemporal.semana && r.date_work && r.date_work.includes(infoTemporal.mesID));
    }
    const agrupado = {};
    res.forEach(reg => {
      const emp = reg.company || "Sin Empresa";
      const proy = reg.name || "Sin Proyecto";
      const wk = reg.worker || "Desconocido";
      if (!agrupado[emp]) agrupado[emp] = { name: emp, proyectos: {} };
      if (!agrupado[emp].proyectos[proy]) agrupado[emp].proyectos[proy] = { name: proy, trabajadores: {} };
      if (!agrupado[emp].proyectos[proy].trabajadores[wk]) {
        agrupado[emp].proyectos[proy].trabajadores[wk] = { total: 0, semanas: {} };
      }
      const sem = reg.semanaReal;
      if (!agrupado[emp].proyectos[proy].trabajadores[wk].semanas[sem]) {
        agrupado[emp].proyectos[proy].trabajadores[wk].semanas[sem] = { totalSemana: 0, entradas: [] };
      }
      agrupado[emp].proyectos[proy].trabajadores[wk].total += parseFloat(reg.hours);
      agrupado[emp].proyectos[proy].trabajadores[wk].semanas[sem].totalSemana += parseFloat(reg.hours);
      agrupado[emp].proyectos[proy].trabajadores[wk].semanas[sem].entradas.push(reg);
    });
    return Object.values(agrupado);
  }, [data, filtroEmpleado, filtroEmpresa, filtroProyecto, infoTemporal, modoMesCompleto]);

  const totalPildora = useMemo(() => {
    if (!filtroEmpleado || !infoTemporal) return null;
    let base = data.filter(r => r.worker === filtroEmpleado && r.date_work && r.date_work.includes(infoTemporal.mesID));
    if (!modoMesCompleto) base = base.filter(r => r.semanaReal === infoTemporal.semana);
    return base.reduce((acc, curr) => acc + parseFloat(curr.hours), 0);
  }, [data, filtroEmpleado, infoTemporal, modoMesCompleto]);

  if (loading) return <div className="p-10 text-center text-gray-400 text-xs font-bold tracking-widest uppercase">Actualizando...</div>;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-4 pt-0 md:px-6 md:pb-6 md:pt-0 bg-transparent min-h-screen font-sans text-gray-700">
      <h1 className="text-black text-center mb-4 font-bold text-xl uppercase tracking-tight">VER TODOS LOS PROYECTOS</h1>
      
      {/* FILTROS */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <select value={filtroEmpleado} onChange={e => setFiltroEmpleado(e.target.value)} className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
            <option value="">MonoGnomo</option>
            {[...new Set(data.map(r => r.worker))].sort().map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
            <option value="">Empresa</option>
            {[...new Set(data.map(r => r.company))].sort().map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={filtroProyecto} onChange={e => setFiltroProyecto(e.target.value)} className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
            <option value="">Proyecto</option>
            {[...new Set(data.map(r => r.name))].sort().map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="date" value={fechaSeleccionada} onChange={e => setFechaSeleccionada(e.target.value)} className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none" />
        </div>

        {infoTemporal && (
          <div className="mt-4 flex items-center justify-center gap-2 animate-in fade-in duration-300">
            <div className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-2 border border-gray-200">
              <span className="text-[10px] font-bold uppercase text-gray-500">{infoTemporal.mesNombre}</span>
              <div className="w-px h-3 bg-gray-300"></div>
              <button 
                onClick={() => setModoMesCompleto(!modoMesCompleto)}
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md transition-all ${modoMesCompleto ? 'bg-gray-700 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}
              >
                {modoMesCompleto ? "Mes Completo" : `Semana ${infoTemporal.semana}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RESULTADOS */}
      <div className="space-y-8">
        {filtradoFinal.map((emp) => (
          <div key={emp.name} className="space-y-4">
            <h3 className="text-center text-[12px] font-black text-black uppercase tracking-[0.4em] mb-2">{emp.name}</h3>
            <div className="grid grid-cols-1 gap-4">
              {Object.values(emp.proyectos).map(p => {
                const totalProy = Object.values(p.trabajadores).reduce((a, b) => a + b.total, 0);
                const color = getProjectColor(p.name);
                return (
                  <div key={p.name} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 flex justify-between items-center border-l-4" style={{ borderColor: color, backgroundColor: `${color}` }}>
                      <span className="font-bold text-[10px] text-gray-600 uppercase tracking-tight">{p.name}</span>
                      <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-100">{totalProy.toFixed(2)}h</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {Object.entries(p.trabajadores).map(([nom, info]) => {
                        const id = `${p.name}-${nom}`;
                        return (
                          <div key={nom} className="flex flex-col">
                            <div onClick={() => setAbiertos(prev => ({...prev, [id]: !prev[id]}))} className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <img src={`${URL_BASE_FOTOS}${nom.replace(/ /g, '')}.jpeg`} onError={e => e.target.src=`https://ui-avatars.com/api/?name=${nom}&background=random&color=fff`} className="w-9 h-9 rounded-lg border border-gray-100 object-cover" alt={nom} />
                                <span className="text-xs font-semibold text-gray-700 uppercase">{nom}</span>
                              </div>
                              <span className="text-xs font-bold text-gray-300">{info.total.toFixed(2)}h</span>
                            </div>
                            {abiertos[id] && (
                              <div className="bg-gray-50/50 px-3 md:px-5 py-5 space-y-4 border-t border-gray-100">
                                {Object.entries(info.semanas).sort((a,b) => b[0] - a[0]).map(([numSem, det]) => (
                                  <div key={numSem} className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                      <span className="text-[9px] font-bold text-gray-400 uppercase">Sem {numSem}</span>
                                      <span className="text-[9px] font-medium text-gray-300 italic">{det.totalSemana.toFixed(2)}h</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1.5">
                                      {det.entradas.map((entry, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white px-4 py-3 rounded-lg border border-gray-100">
                                          <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-600 capitalize">{new Date(entry.date_work).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}</span>
                                            <span className="text-[8px] text-gray-300">{entry.date_work}</span>
                                          </div>
                                          
                                          <div className="flex items-center gap-1 md:gap-3">
                                            <span className="font-bold text-gray-700 text-xs mr-2">{parseFloat(entry.hours).toFixed(2)}h</span>
                                            <button onClick={(e) => { e.stopPropagation(); handleEditar(entry); }} className="p-2 bg-gray-50 rounded-md text-[13px] active:bg-gray-200" title="Editar">✏️</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleBorrar(entry.id); }} className="p-2 bg-red-50 text-red-300 rounded-md text-[13px] active:bg-red-100" title="Borrar">🗑️</button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* PÍLDORA FLOTANTE */}
      {totalPildora !== null && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-white/95 backdrop-blur-md text-gray-800 px-6 py-2.5 rounded-2xl shadow-lg flex items-center gap-4 border border-gray-200">
            <div className="flex flex-col pr-4 border-r border-gray-200 leading-none">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                {modoMesCompleto ? "Total Mes" : `Semana ${infoTemporal.semana}`}
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase">{filtroEmpleado}</span>
            </div>
            <div className="text-xl font-black tracking-tighter text-gray-700">
              {totalPildora.toFixed(2)}<span className="text-[10px] ml-0.5 text-gray-400 uppercase">h</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}