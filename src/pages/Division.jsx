import { useState, useEffect, useMemo } from "react";
import Exportacion from '../components/Exportación';

const PALETA_PASTEL = ["#F0F4FF", "#F5F5DC", "#E6FFFA", "#FFF5F5", "#FAF5FF", "#F0FFF4", "#FFF9E6"];
const ORDEN_PRIORIDAD = ["Monognomo", "Neozink", "Picofino", "Guardianes", "Escuela Energía", "Escuela Energia", "MANGO", "General"];

const Division = () => {
  const [eventos, setEventos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filtroWorker, setFiltroWorker] = useState(""); 
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7)); 
  
  const [showModalEvento, setShowModalEvento] = useState(false);
  const [expandido, setExpandido] = useState({});
  const [editId, setEditId] = useState(null);
  const [nochesPorTrabajador, setNochesPorTrabajador] = useState({});
  const [empresaSeleccionadaModal, setEmpresaSeleccionadaModal] = useState("");

  const initialForm = {
    project_id: "", place: "", event_date: "", setup_date: "", dismantle_date: "",
    coord_project_id: "", coord_prod_id: "", team_setup: "", team_dismantle: "",
    setup_vehicle: "", dismantle_vehicle: ""
  };
  const [form, setForm] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resEv, resInit] = await Promise.all([
        fetch(`https://registromono.monognomo.com/api.php?action=get_events&t=${Date.now()}`),
        fetch(`https://registromono.monognomo.com/api.php?action=get_initial_data`)
      ]);
      const dataEv = await resEv.json();
      const dataInit = await resInit.json();
      
      if (dataEv.success) setEventos(dataEv.data || []);
      if (dataInit.success) {
        setTrabajadores(dataInit.trabajadores || []);
        setProyectos(dataInit.proyectos || []);
      }
    } catch (err) { 
      console.error("Error cargando datos", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const deleteEvento = async (id, nombre) => {
    const confirmar = window.confirm(`⚠️ ¿Borrar "${nombre?.toUpperCase() || 'EVENTO'}"?`);
    if (!confirmar) return;
    try {
      const res = await fetch(`https://registromono.monognomo.com/api.php?action=delete_event&id=${id}`);
      const resJson = await res.json();
      if (resJson.success) fetchData();
    } catch (err) { alert("Error de conexión"); }
  };

  const { gruposPorEmpresa, filtradosParaExportar } = useMemo(() => {
    const filtrados = eventos.filter(ev => {
      // BLINDAJE: Si el evento no tiene fecha (ej. datos huerfanos), lo saltamos
      if (!ev.event_date) return false;

      const coincideMes = ev.event_date.startsWith(filtroMes);
      let coincideWorker = true;

      if (filtroWorker) {
        const idBuscado = filtroWorker.toString();
        // Verificamos si es coordinador o si está en el desglose de staff_detalle del API
        const esCoord = ev.coord_project_id?.toString() === idBuscado || ev.coord_prod_id?.toString() === idBuscado;
        const tieneNoches = ev.staff_detalle && ev.staff_detalle[idBuscado] !== undefined;
        coincideWorker = esCoord || tieneNoches;
      }
      return coincideMes && coincideWorker;
    });

    const grupos = {};
    filtrados.forEach(ev => {
      const proyectoInfo = proyectos.find(p => p.id == ev.project_id);
      const empresa = proyectoInfo?.company || "Sin Empresa";
      if (!grupos[empresa]) grupos[empresa] = [];
      grupos[empresa].push(ev);
    });

    const gruposOrdenados = {};
    ORDEN_PRIORIDAD.forEach(emp => { if (grupos[emp]) gruposOrdenados[emp] = grupos[emp]; });
    Object.keys(grupos).forEach(emp => { if (!gruposOrdenados[emp]) gruposOrdenados[emp] = grupos[emp]; });
    
    return { gruposPorEmpresa: gruposOrdenados, filtradosParaExportar: filtrados };
  }, [eventos, filtroWorker, filtroMes, proyectos]);

  const handleEditClick = (ev, e) => {
    e.stopPropagation();
    const proyectoInfo = proyectos.find(p => p.id == ev.project_id);
    setEmpresaSeleccionadaModal(proyectoInfo?.company || "");
    setEditId(ev.id);
    setForm({
      project_id: ev.project_id || "", 
      place: ev.place || "", 
      event_date: ev.event_date || "",
      setup_date: ev.setup_date || "", 
      dismantle_date: ev.dismantle_date || "",
      coord_project_id: ev.coord_project_id || "", 
      coord_prod_id: ev.coord_prod_id || "",
      team_setup: ev.team_setup || "", 
      team_dismantle: ev.team_dismantle || "",
      setup_vehicle: ev.setup_vehicle || "", 
      dismantle_vehicle: ev.dismantle_vehicle || ""
    });

    // CARGA LAS NOCHES REALES DESDE EL OBJETO staff_detalle QUE VIENE DEL PHP
    const nochesNormalizadas = {};
    if (ev.staff_detalle) {
      Object.entries(ev.staff_detalle).forEach(([id, val]) => {
        nochesNormalizadas[id.toString()] = val;
      });
    }
    setNochesPorTrabajador(nochesNormalizadas);
    setShowModalEvento(true);
  };

  const toggleTrabajador = (id) => {
    const idStr = id.toString();
    setNochesPorTrabajador(prev => {
      const n = { ...prev };
      if (n[idStr] !== undefined) delete n[idStr];
      else n[idStr] = 0;
      return n;
    });
  };

  const saveEvento = async () => {
    if (!form.project_id || !form.event_date) return alert("Proyecto y Fecha son obligatorios");
    
    const noches_staff = Object.entries(nochesPorTrabajador).map(([id, nights]) => ({
      worker_id: parseInt(id),
      nights: parseInt(nights) || 0
    }));

    const action = editId ? 'update_event' : 'add_event'; 
    const payload = { ...form, id: editId, noches_staff };

    try {
      const res = await fetch(`https://registromono.monognomo.com/api.php?action=${action}`, {
        method: 'POST', body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (resData.success) { 
        setShowModalEvento(false); setEditId(null); setNochesPorTrabajador({}); fetchData(); 
      } else { alert("Error: " + resData.message); }
    } catch (err) { alert("Error de red"); }
  };

  const empresasModal = [...new Set(proyectos.map(p => p.company))].sort();

  if (loading) return <div className="min-h-screen bg-[#fdc436] flex items-center justify-center font-black uppercase text-xs">Cargando División...</div>;

  return (
    <div className="bg-[#fdc436] min-h-screen p-0 sm:p-4 flex justify-center font-sans">
      <div className="w-full space-y-6 bg-transparent sm:bg-white/50 sm:p-6 sm:rounded-xl sm:shadow-lg sm:max-w-4xl sm:mx-auto">
        <h1 className="text-gray-700 text-center font-bold text-xl uppercase tracking-tight">división de trabajo</h1>

        <div className="grid grid-cols-2 gap-2">
          <input type="month" className="text-[11px] font-bold p-3 bg-white rounded-xl outline-none uppercase w-full" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} />
          <select className="text-[11px] font-bold p-3 bg-white rounded-xl outline-none uppercase text-gray-700 w-full" value={filtroWorker} onChange={(e) => setFiltroWorker(e.target.value)}>
            <option value="">🐵 Todos</option>
            {trabajadores.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <button onClick={() => { setEditId(null); setForm(initialForm); setNochesPorTrabajador({}); setEmpresaSeleccionadaModal(""); setShowModalEvento(true); }} className="bg-gray-400 text-white w-full py-4 rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95 transition-all">+ Nuevo Evento</button>

        <div className="space-y-6">
          {Object.keys(gruposPorEmpresa).map((empresa) => (
            <div key={empresa} className="space-y-2 text-left">
              <h3 className="text-[9px] font-black uppercase text-black/40 pl-2 tracking-widest">{empresa}</h3>
              {gruposPorEmpresa[empresa].map((ev, i) => (
                <div key={ev.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 flex justify-between items-center cursor-pointer" style={{borderLeft: `6px solid ${PALETA_PASTEL[i % PALETA_PASTEL.length]}`}} onClick={() => setExpandido({...expandido, [ev.id]: !expandido[ev.id]})}>
                    <div className="flex flex-col max-w-[65%]">
                      <div className="flex items-center gap-2">
                        {ev.noches_totales > 0 && <span>🌙</span>}
                        <span className="font-black text-[10px] uppercase text-gray-800 truncate">{ev.nombre_evento}</span>
                      </div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">{ev.event_date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => handleEditClick(ev, e)} className="p-2 opacity-40 hover:opacity-100 transition-all">✏️</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteEvento(ev.id, ev.nombre_evento); }} className="p-2 opacity-40 hover:opacity-100 transition-all hover:text-red-500">🗑️</button>
                      <span className="text-gray-300 text-xl font-light w-8 text-center">{expandido[ev.id] ? "−" : "+"}</span>
                    </div>
                  </div>
                  {expandido[ev.id] && (
                    <div className="p-4 text-[10px] space-y-4 bg-gray-50/50 border-t border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 font-black uppercase text-[8px] mb-1">Coordinación</p>
                          <p className="font-bold text-gray-700">PR: {ev.coordinador_proyecto || "—"}</p>
                          <p className="font-bold text-gray-700">PD: {ev.coordinador_produccion || "—"}</p>
                        </div>
                        <div>
                          <p className="text-amber-600 font-black uppercase text-[8px] mb-1">Staff y Noches</p>
                          <p className="font-bold italic text-gray-600 leading-tight">{ev.desglose_noches || "—"}</p>
                          {ev.noches_totales > 0 && <p className="mt-1 text-amber-700 font-black uppercase text-[8px]">🌙 Total: {ev.noches_totales} noches</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                          <span className="text-blue-600 font-black text-[7px] uppercase">Montaje</span>
                          <p className="font-bold text-blue-900 leading-tight">🚚 {ev.setup_vehicle || "—"}</p>
                          <p className="text-[8px] mt-1 text-blue-800/60">{ev.team_setup}</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
                          <span className="text-purple-600 font-black text-[7px] uppercase">Desmontaje</span>
                          <p className="font-bold text-purple-900 leading-tight">🚚 {ev.dismantle_vehicle || "—"}</p>
                          <p className="text-[8px] mt-1 text-purple-800/60">{ev.team_dismantle}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="pt-4 flex justify-center">
            <Exportacion eventos={filtradosParaExportar} />
        </div>
      </div>

      {showModalEvento && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 flex items-end sm:items-center justify-center font-sans text-left">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-black uppercase tracking-tight">{editId ? 'Editar Evento' : 'Nuevo Evento'}</h2>
                <button onClick={() => setShowModalEvento(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Empresa</label>
                    <select className="p-3 bg-gray-100 rounded-xl text-xs font-bold outline-none" value={empresaSeleccionadaModal} onChange={e => {setEmpresaSeleccionadaModal(e.target.value); setForm({...form, project_id:""})}}>
                      <option value="">Seleccionar empresa...</option>
                      {empresasModal.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Proyecto</label>
                    <select className="p-3 bg-gray-100 rounded-xl text-xs font-bold outline-none" value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}>
                      <option value="">Seleccionar proyecto...</option>
                      {proyectos.filter(p => p.company === empresaSeleccionadaModal).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl">
                  <div className="flex flex-col gap-1">
                      <label className="text-[7px] font-black uppercase text-gray-400 tracking-widest">Coord. PR</label>
                      <select className="p-2 bg-white rounded-lg text-[10px] outline-none border border-gray-200 font-bold" value={form.coord_project_id} onChange={e => setForm({...form, coord_project_id: e.target.value})}>
                          <option value="">Sin asignar</option>
                          {trabajadores.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                  </div>
                  <div className="flex flex-col gap-1">
                      <label className="text-[7px] font-black uppercase text-gray-400 tracking-widest">Coord. PD</label>
                      <select className="p-2 bg-white rounded-lg text-[10px] outline-none border border-gray-200 font-bold" value={form.coord_prod_id} onChange={e => setForm({...form, coord_prod_id: e.target.value})}>
                          <option value="">Sin asignar</option>
                          {trabajadores.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                  </div>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <label className="text-blue-600 uppercase text-[8px] font-black block mb-3 text-center tracking-widest underline">MonoGnomos y Noches</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {trabajadores.map(t => {
                        const tId = t.id.toString();
                        const estaActivo = nochesPorTrabajador[tId] !== undefined;
                        return (
                          <div key={tId} className={`p-2 rounded-xl border flex flex-col gap-2 transition-all ${estaActivo ? 'bg-white border-blue-400 shadow-sm' : 'bg-transparent border-gray-100 opacity-60'}`}>
                            <button type="button" onClick={() => toggleTrabajador(tId)} className="text-[8px] font-black uppercase text-left truncate">
                              {estaActivo ? '✅ ' : ''}{t.name}
                            </button>
                            {estaActivo && (
                              <div className="flex items-center gap-1 bg-blue-50 rounded-lg p-1">
                                <span className="text-[7px] font-black text-blue-400">🌙</span>
                                <input 
                                  type="number" 
                                  className="w-full bg-transparent text-[11px] font-bold outline-none text-blue-700"
                                  value={nochesPorTrabajador[tId]}
                                  onChange={(e) => setNochesPorTrabajador({...nochesPorTrabajador, [tId]: e.target.value})}
                                  min="0"
                                />
                              </div>
                            )}
                          </div>
                        );
                    })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 text-left">
                    <label className="text-[8px] font-black uppercase text-blue-500 tracking-widest">Montaje</label>
                    <input className="w-full p-2 bg-gray-50 rounded-lg text-xs font-bold" type="date" value={form.setup_date} onChange={e => setForm({...form, setup_date: e.target.value})} />
                    <input className="w-full p-2 bg-gray-50 rounded-lg text-xs font-bold" placeholder="Vehículo" type="text" value={form.setup_vehicle} onChange={e => setForm({...form, setup_vehicle: e.target.value})} />
                    <textarea className="w-full p-2 bg-gray-50 rounded-lg text-xs h-16 outline-none font-bold" placeholder="Notas montaje..." value={form.team_setup} onChange={e => setForm({...form, team_setup: e.target.value})} />
                </div>
                <div className="space-y-2 text-left">
                    <label className="text-[8px] font-black uppercase text-purple-500 tracking-widest">Desmontaje</label>
                    <input className="w-full p-2 bg-gray-50 rounded-lg text-xs font-bold" type="date" value={form.dismantle_date} onChange={e => setForm({...form, dismantle_date: e.target.value})} />
                    <input className="w-full p-2 bg-gray-50 rounded-lg text-xs font-bold" placeholder="Vehículo" type="text" value={form.dismantle_vehicle} onChange={e => setForm({...form, dismantle_vehicle: e.target.value})} />
                    <textarea className="w-full p-2 bg-gray-50 rounded-lg text-xs h-16 outline-none font-bold" placeholder="Notas desmontaje..." value={form.team_dismantle} onChange={e => setForm({...form, team_dismantle: e.target.value})} />
                </div>
              </div>
              <button onClick={saveEvento} className="bg-black text-white w-full py-4 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">Guardar Evento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Division;