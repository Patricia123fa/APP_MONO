import { useState, useEffect, useMemo } from "react";
import Exportacion from '../components/Exportación';

const PALETA_PASTEL = ["#F0F4FF", "#F5F5DC", "#E6FFFA", "#FFF5F5", "#FAF5FF", "#F0FFF4", "#FFF9E6"];

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
  const [staffSeleccionado, setStaffSeleccionado] = useState([]);

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
      if (dataEv.success) setEventos(dataEv.data);
      if (dataInit.success) {
        setTrabajadores(dataInit.trabajadores);
        setProyectos(dataInit.proyectos);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const deleteEvento = async (id, nombre) => {
    const confirmar = window.confirm(`⚠️ ¿Borrar "${nombre.toUpperCase()}"?`);
    if (!confirmar) return;
    try {
      const res = await fetch(`https://registromono.monognomo.com/api.php?action=delete_event&id=${id}`);
      if ((await res.json()).success) fetchData();
    } catch (err) { alert("Error de conexión"); }
  };

  const { filtradosParaExportar, gruposPorEmpresa } = useMemo(() => {
    const filtrados = eventos.filter(ev => {
      const coincideMes = ev.fecha_evento.startsWith(filtroMes);
      let coincideWorker = true;
      if (filtroWorker) {
        const workerObj = trabajadores.find(t => t.id.toString() === filtroWorker.toString());
        const nombreBuscado = workerObj ? workerObj.name : "";
        const esCoord = ev.coord_project_id?.toString() === filtroWorker.toString() || ev.coord_prod_id?.toString() === filtroWorker.toString();
        const estaAsignado = nombreBuscado && ev.desglose_noches?.includes(nombreBuscado);
        coincideWorker = esCoord || estaAsignado;
      }
      return coincideMes && coincideWorker;
    });
    const grupos = {};
    filtrados.forEach(ev => {
      const proyectoInfo = proyectos.find(p => p.id === ev.project_id);
      const empresa = proyectoInfo?.company || "Sin Empresa";
      if (!grupos[empresa]) grupos[empresa] = [];
      grupos[empresa].push(ev);
    });
    return { filtradosParaExportar: filtrados, gruposPorEmpresa: grupos };
  }, [eventos, filtroWorker, filtroMes, proyectos, trabajadores]);

  const handleEditClick = (ev, e) => {
    e.stopPropagation();
    setEditId(ev.id);
    setForm({
      project_id: ev.project_id || "", place: ev.lugar || "", event_date: ev.fecha_evento || "",
      setup_date: ev.setup_date || "", dismantle_date: ev.dismantle_date || "",
      coord_project_id: ev.coord_project_id || "", coord_prod_id: ev.coord_prod_id || "",
      team_setup: ev.equipo_montaje || "", team_dismantle: ev.equipo_desmontaje || "",
      setup_vehicle: ev.setup_vehicle || "", dismantle_vehicle: ev.dismantle_vehicle || ""
    });
    const asignadosDB = trabajadores.filter(t => ev.desglose_noches?.includes(t.name)).map(t => t.id);
    setStaffSeleccionado(asignadosDB);
    setShowModalEvento(true);
  };

  const saveEvento = async () => {
    if (!form.project_id || !form.event_date) return alert("Proyecto y Fecha son obligatorios");
    const action = editId ? 'update_event' : 'add_event'; 
    const noches_staff = staffSeleccionado.map(id => ({ worker_id: id, nights: 0 }));
    const payload = { ...form, id: editId, noches_staff };
    const res = await fetch(`https://registromono.monognomo.com/api.php?action=${action}`, {
      method: 'POST', body: JSON.stringify(payload)
    });
    if ((await res.json()).success) { 
      setShowModalEvento(false); setEditId(null); setStaffSeleccionado([]); fetchData(); 
    }
  };

  return (
    <div className="bg-[#fdc436] min-h-screen p-2 sm:p-4 flex justify-center font-sans">
      <div className="bg-white/40 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl w-full sm:max-w-4xl space-y-4">
        
        <h1 className="text-black text-center font-bold text-xl uppercase tracking-tight">división de trabajo</h1>

        <div className="grid grid-cols-2 gap-2">
          <input type="month" className="text-[11px] font-bold p-3 bg-white rounded-xl outline-none shadow-sm border-none uppercase w-full" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} />
          <select className="text-[11px] font-bold p-3 bg-white rounded-xl outline-none uppercase text-red-600 shadow-sm border-none w-full" value={filtroWorker} onChange={(e) => setFiltroWorker(e.target.value)}>
            <option value="">🐵 Todos</option>
            {trabajadores.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <button onClick={() => { setEditId(null); setForm(initialForm); setStaffSeleccionado([]); setShowModalEvento(true); }} className="bg-yellow-400 text-white w-full py-4 rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95 transition-all">+ Nueva Planificación</button>

        <div className="space-y-6">
          {Object.keys(gruposPorEmpresa).map((empresa) => (
            <div key={empresa} className="space-y-2">
              <h3 className="text-[9px] font-black uppercase text-black/40 pl-2 tracking-widest">{empresa}</h3>
              {gruposPorEmpresa[empresa].map((ev, i) => (
                <div key={ev.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <div 
                    className="p-4 flex justify-between items-center active:bg-black/5 transition-colors" 
                    style={{borderLeft: `6px solid ${PALETA_PASTEL[i % PALETA_PASTEL.length]}`}} 
                    onClick={() => setExpandido({...expandido, [ev.id]: !expandido[ev.id]})}
                  >
                    <div className="flex flex-col max-w-[50%]">
                      <span className="font-black text-[10px] uppercase text-gray-800 truncate">{ev.nombre_evento}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">{ev.fecha_evento}</span>
                    </div>

                    {/* BOTONES: EDITAR | ELIMINAR | EXPANDIR */}
                    <div className="flex items-center gap-1 sm:gap-3">
                      <button onClick={(e) => handleEditClick(ev, e)} className="p-2 text-base opacity-40 hover:opacity-100 transition-all">
                        ✏️
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteEvento(ev.id, ev.nombre_evento); }} 
                        className="p-2 text-base opacity-40 hover:opacity-100 hover:text-red-500 transition-all"
                      >
                        🗑️
                      </button>
                      <span className="text-gray-300 text-xl font-light w-8 text-center">
                        {expandido[ev.id] ? "−" : "+"}
                      </span>
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
                          <p className="text-amber-600 font-black uppercase text-[8px] mb-1">Equipo</p>
                          <p className="font-bold italic text-gray-600 leading-tight">{ev.desglose_noches || "—"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                          <span className="text-blue-600 font-black text-[7px] uppercase">Montaje</span>
                          <p className="font-bold text-blue-900 leading-tight">🚚 {ev.setup_vehicle || "—"}</p>
                          <p className="text-[8px] mt-1 text-blue-800/60">{ev.equipo_montaje}</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
                          <span className="text-purple-600 font-black text-[7px] uppercase">Desmontaje</span>
                          <p className="font-bold text-purple-900 leading-tight">🚚 {ev.dismantle_vehicle || "—"}</p>
                          <p className="text-[8px] mt-1 text-purple-800/60">{ev.equipo_desmontaje}</p>
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

      {/* MODAL RESPONSIVE */}
      {showModalEvento && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-black uppercase">{editId ? 'Editar' : 'Nuevo'}</h2>
                <button onClick={() => setShowModalEvento(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-gray-400">Proyecto</label>
                    <select disabled={!!editId} className="p-3 bg-gray-100 rounded-xl text-xs outline-none" value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}>
                      <option value="">Seleccionar...</option>
                      {proyectos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-gray-400">Fecha Evento</label>
                    <input className="p-3 bg-gray-100 rounded-xl text-xs" type="date" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl">
                  <div className="flex flex-col gap-1">
                      <label className="text-[7px] font-black uppercase text-gray-400">Coord. Proyecto</label>
                      <select className="p-2 bg-white rounded-lg text-[10px] outline-none border border-gray-200" value={form.coord_project_id} onChange={e => setForm({...form, coord_project_id: e.target.value})}>
                          <option value="">Sin asignar</option>
                          {trabajadores.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                  </div>
                  <div className="flex flex-col gap-1">
                      <label className="text-[7px] font-black uppercase text-gray-400">Coord. Producción</label>
                      <select className="p-2 bg-white rounded-lg text-[10px] outline-none border border-gray-200" value={form.coord_prod_id} onChange={e => setForm({...form, coord_prod_id: e.target.value})}>
                          <option value="">Sin asignar</option>
                          {trabajadores.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                  </div>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <label className="text-blue-600 uppercase text-[8px] font-black block mb-2 text-center underline">MonoGnomos Asignados</label>
                <div className="flex flex-wrap gap-1.5 justify-center">
                    {trabajadores.map(t => (
                        <button key={t.id} onClick={() => setStaffSeleccionado(prev => prev.includes(t.id) ? prev.filter(i => i !== t.id) : [...prev, t.id])}
                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${staffSeleccionado.includes(t.id) ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                            {t.name}
                        </button>
                    ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-blue-500">Montaje</label>
                    <input className="w-full p-2 bg-gray-50 rounded-lg text-xs" type="date" value={form.setup_date} onChange={e => setForm({...form, setup_date: e.target.value})} />
                    <input className="w-full p-2 bg-gray-50 rounded-lg text-xs" type="text" value={form.setup_vehicle} placeholder="Vehículo" onChange={e => setForm({...form, setup_vehicle: e.target.value})} />
                    <textarea className="w-full p-2 bg-gray-50 rounded-lg text-xs h-16 outline-none" value={form.team_setup} placeholder="Notas equipo..." onChange={e => setForm({...form, team_setup: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-purple-500">Desmontaje</label>
                    <input className="w-full p-2 bg-gray-50 rounded-lg text-xs" type="date" value={form.dismantle_date} onChange={e => setForm({...form, dismantle_date: e.target.value})} />
                    <input className="w-full p-2 bg-gray-50 rounded-lg text-xs" type="text" value={form.dismantle_vehicle} placeholder="Vehículo" onChange={e => setForm({...form, dismantle_vehicle: e.target.value})} />
                    <textarea className="w-full p-2 bg-gray-50 rounded-lg text-xs h-16 outline-none" value={form.team_dismantle} placeholder="Notas equipo..." onChange={e => setForm({...form, team_dismantle: e.target.value})} />
                </div>
              </div>
              <button onClick={saveEvento} className="bg-black text-white w-full py-4 rounded-xl text-[10px] font-black uppercase mt-4">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Division;