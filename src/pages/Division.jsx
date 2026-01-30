import { useState, useEffect, useMemo } from "react";
import Exportacion from '../components/Exportación';

const PALETA_PASTEL = ["#F0F4FF", "#F5F5DC", "#E6FFFA", "#FFF5F5", "#FAF5FF", "#F0FFF4", "#FFF9E6"];
const ORDEN_PRIORIDAD = ["Monognomo", "Neozink", "Picofino", "Yurmuvi", "Guardianes", "Escuela Energía", "Escuela Energia", "Castrillo2", "General"];

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

  // --- CARGA DE DATOS ---
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

  // --- BORRAR EVENTO ---
  const deleteEvento = async (id, nombre) => {
    const confirmar = window.confirm(`⚠️ ¿Borrar datos de logística de "${nombre?.toUpperCase() || 'EVENTO'}"?\n(El proyecto seguirá existiendo, solo se reinicia la logística)`);
    if (!confirmar) return;
    try {
      const res = await fetch(`https://registromono.monognomo.com/api.php?action=delete_event&id=${id}`);
      const resJson = await res.json();
      if (resJson.success) fetchData();
    } catch (err) { alert("Error de conexión"); }
  };

  // =================================================================================
  // LÓGICA CORE: DEDUPLICACIÓN Y AGRUPACIÓN
  // =================================================================================
  const { gruposPorEmpresa } = useMemo(() => {
    const mesBuscado = filtroMes.replace(/-/g, "").trim();
    const mapaEventos = new Map();
    eventos.forEach(ev => mapaEventos.set(ev.project_id?.toString(), ev));

    const proyectosUnicos = new Map();
    
    proyectos.forEach(p => {
        const mesBD = String(p.month_key || "").replace(/-/g, "").trim();
        
        // --- MODIFICACIÓN AQUÍ: EXCLUIR SIEMPRE ACTIVO ---
        if (mesBD === "999912") return; 
        // -------------------------------------------------

        const coincideMes = mesBD === mesBuscado; 
        const pExistente = proyectosUnicos.get(p.id);

        // --- CORRECCIÓN DE LOGISTICA ---
        // Recuperamos el evento específico para este proyecto
        const eventoData = mapaEventos.get(p.id.toString());
        // Verificamos si existe Y si su fecha pertenece al mes seleccionado
        const eventoCaeEnEsteMes = eventoData && eventoData.event_date && eventoData.event_date.startsWith(filtroMes);

        if (!pExistente) {
            // Se muestra si el proyecto es del mes O si tiene logística en este mes
            if (coincideMes || eventoCaeEnEsteMes) {
                proyectosUnicos.set(p.id, p);
            }
        } else {
            if (coincideMes) {
                proyectosUnicos.set(p.id, p);
            }
        }
    });

    const grupos = {};

    proyectosUnicos.forEach(p => {
        const eventoAsociado = mapaEventos.get(p.id.toString());
        
        if (filtroWorker) {
            if (!eventoAsociado) return; 
            const idBuscado = filtroWorker.toString();
            const esCoord = eventoAsociado.coord_project_id?.toString() === idBuscado || eventoAsociado.coord_prod_id?.toString() === idBuscado;
            const tieneNoches = eventoAsociado.staff_detalle && eventoAsociado.staff_detalle[idBuscado] !== undefined;
            if (!esCoord && !tieneNoches) return;
        }

        const empresaRaw = p.company || "Sin Empresa";
        const empresaKeyNorm = empresaRaw.trim().toLowerCase();
        const existingKey = Object.keys(grupos).find(k => k.toLowerCase() === empresaKeyNorm);
        const groupKey = existingKey || empresaRaw.trim(); 

        if (!grupos[groupKey]) grupos[groupKey] = [];

        grupos[groupKey].push({
            tipo: eventoAsociado ? 'completo' : 'pendiente',
            proyecto: p,
            evento: eventoAsociado || {} 
        });
    });

    const gruposOrdenados = {};
    const empresasDetectadas = Object.keys(grupos);
    
    ORDEN_PRIORIDAD.forEach(empPrioridad => {
        const empDetectada = empresasDetectadas.find(e => e.toLowerCase() === empPrioridad.toLowerCase());
        if (empDetectada && grupos[empDetectada]) {
            gruposOrdenados[empDetectada] = grupos[empDetectada].sort((a,b) => a.proyecto.name.localeCompare(b.proyecto.name));
        }
    });
    
    empresasDetectadas.forEach(emp => {
        if (!Object.values(gruposOrdenados).includes(grupos[emp])) { 
             const yaEsta = Object.keys(gruposOrdenados).some(k => k.toLowerCase() === emp.toLowerCase());
             if(!yaEsta) {
                gruposOrdenados[emp] = grupos[emp].sort((a,b) => a.proyecto.name.localeCompare(b.proyecto.name));
             }
        }
    });

    return { gruposPorEmpresa: gruposOrdenados };

  }, [proyectos, eventos, filtroMes, filtroWorker]);


  // --- ABRIR MODAL ---
  const handleEditClick = (item, e) => {
    e.stopPropagation();
    
    const esPendiente = item.tipo === 'pendiente';
    const proyectoData = item.proyecto;
    const eventoData = item.evento;

    setEmpresaSeleccionadaModal(proyectoData.company || "");
    setEditId(esPendiente ? null : eventoData.id);

    setForm({
      project_id: proyectoData.id,
      place: eventoData.place || "", 
      event_date: eventoData.event_date || "", 
      setup_date: eventoData.setup_date || "", 
      dismantle_date: eventoData.dismantle_date || "",
      coord_project_id: eventoData.coord_project_id || "", 
      coord_prod_id: eventoData.coord_prod_id || "",
      team_setup: eventoData.team_setup || "", 
      team_dismantle: eventoData.team_dismantle || "",
      setup_vehicle: eventoData.setup_vehicle || "", 
      dismantle_vehicle: eventoData.dismantle_vehicle || ""
    });

    const nochesNormalizadas = {};
    if (eventoData.staff_detalle) {
      Object.entries(eventoData.staff_detalle).forEach(([id, val]) => {
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

  // --- GUARDAR ---
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

  if (loading) return <div className="min-h-screen bg-[#fdc436] flex items-center justify-center font-black uppercase text-xs">Cargando División...</div>;

  // --- EXPORTACIÓN ---
  const handleExportarDivision = (formato, alcance, fechaExport) => {
    let eventosReales = eventos; 
    let tituloPeriodo = "Historial Logística Completo";

    if (alcance === "mes") {
        const mesAFiltrar = fechaExport || filtroMes;
        if (!mesAFiltrar) return alert("🐵 Selecciona un mes.");
        const mesID = mesAFiltrar.substring(0, 7);
        eventosReales = eventos.filter(ev => ev.event_date?.startsWith(mesID));
        tituloPeriodo = `Logística ${mesID}`;
    }

    const datosOrdenados = [...eventosReales].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

    if (formato === "csv") {
        const headers = ["FECHA", "EMPRESA", "PROYECTO", "LUGAR", "STAFF_DETALLE", "TOTAL_NOCHES", "PR", "PD", "MONTAJE", "EQUIPO_M", "DESMONTAJE", "EQUIPO_D"];
        const rows = datosOrdenados.map(ev => {
            const p = proyectos.find(proj => proj.id == ev.project_id);
            const clean = (t) => `"${(t || "").toString().replace(/;/g, ',').replace(/"/g, '""')}"`;
            let detalleStaffStr = "";
            if (ev.staff_detalle && Object.keys(ev.staff_detalle).length > 0) {
                detalleStaffStr = Object.entries(ev.staff_detalle)
                    .map(([wId, n]) => {
                        const t = trabajadores.find(trab => trab.id.toString() === wId.toString());
                        return `${t ? t.name : 'Staff'}: ${n}🌙`;
                    }).join(", ");
            }
            return [
                ev.event_date, 
                clean(p?.company || "—"), 
                clean(ev.nombre_evento || p?.name), 
                clean(ev.place || ""), 
                clean(detalleStaffStr), 
                ev.noches_totales || 0,
                clean(ev.coordinador_proyecto), 
                clean(ev.coordinador_produccion), 
                clean(`${ev.setup_date} (${ev.setup_vehicle})`),
                clean(ev.team_setup), 
                clean(`${ev.dismantle_date} (${ev.dismantle_vehicle})`), 
                clean(ev.team_dismantle)
            ];
        });
        const csvContent = "\ufeff" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `MONO_LOGISTICA_${tituloPeriodo.toUpperCase()}.csv`;
        link.click();
        return;
    }

    if (formato === "pdf") {
        const ventana = window.open('', '_blank');
        if (!ventana) return alert("Bloqueador de ventanas activo 🐵");
        ventana.document.write(`
          <html>
            <head>
              <title>Reporte Logística MonoGnomo</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&display=swap');
                body { font-family: 'Outfit', sans-serif; -webkit-print-color-adjust: exact; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
                th { background-color: #f8fafc; text-align: left; text-transform: uppercase; font-size: 7px; letter-spacing: 0.1em; padding: 10px 5px; border-bottom: 2px solid #e2e8f0; }
                td { padding: 8px 5px; border-bottom: 1px solid #f1f5f9; font-size: 9px; vertical-align: top; word-wrap: break-word; }
                .badge { background: #fef3c7; color: #92400e; padding: 2px 4px; border-radius: 4px; font-weight: bold; font-size: 8px; }
                .team-note { font-size: 8px; color: #64748b; font-style: italic; margin-top: 4px; line-height: 1.2; }
                @media print { body { padding: 0; } .no-print { display: none; } @page { size: landscape; } }
              </style>
            </head>
            <body class="bg-white text-slate-800">
              <div class="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div class="flex items-center gap-3">
                  <span class="text-4xl">🐵</span>
                  <div><h1 class="text-xl font-black tracking-tighter text-slate-900">MonoGnomo</h1><p class="text-[7px] font-black uppercase tracking-[0.4em] text-yellow-500">Logística e Informe de Equipo</p></div>
                </div>
                <div class="text-right"><p class="text-[12px] font-bold text-slate-700 capitalize">${tituloPeriodo}</p></div>
              </div>
              <table>
                <thead><tr><th style="width: 8%">Fecha</th><th style="width: 22%">Proyecto / Lugar</th><th style="width: 25%">Staff y Noches</th><th style="width: 22%">Montaje / Equipo</th><th style="width: 23%">Desmontaje / Equipo</th></tr></thead>
                <tbody>
                  ${datosOrdenados.map(ev => {
                    const p = proyectos.find(proj => proj.id == ev.project_id);
                    return `<tr>
                        <td class="font-bold text-slate-400">${ev.event_date}</td>
                        <td>
                            <div class="font-black text-slate-900 uppercase text-[10px] mb-1">${ev.nombre_evento || p?.name}</div>
                            ${ev.place ? `<div class="text-[8px] font-bold text-blue-500 uppercase mb-1">📍 ${ev.place}</div>` : ''}
                            <div class="text-[8px] text-slate-500">PR: ${ev.coordinador_proyecto || "—"}</div>
                            <div class="text-[8px] text-slate-500">PD: ${ev.coordinador_produccion || "—"}</div>
                        </td>
                        <td><div class="text-slate-600 mb-1 leading-tight">${ev.desglose_noches || "—"}</div>${ev.noches_totales > 0 ? `<span class="badge">🌙 TOTAL: ${ev.noches_totales}</span>` : ''}</td>
                        <td><div class="text-[9px] font-bold text-blue-600">${ev.setup_date || "—"}</div><div class="text-[9px] font-black text-slate-700 mt-1">🚚 ${ev.setup_vehicle || "—"}</div><div class="team-note">${ev.team_setup || "—"}</div></td>
                        <td><div class="text-[9px] font-bold text-purple-600">${ev.dismantle_date || "—"}</div><div class="text-[9px] font-black text-slate-700 mt-1">🚚 ${ev.dismantle_vehicle || "—"}</div><div class="team-note">${ev.team_dismantle || "—"}</div></td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>
              <div class="mt-8 no-print flex justify-center"><button onclick="window.print()" class="bg-black text-white px-8 py-3 rounded-full font-black uppercase text-[9px] tracking-widest shadow-xl">Generar PDF</button></div>
            </body>
          </html>`);
        ventana.document.close();
    }
  };

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

        {/* LISTADO DE PROYECTOS */}
        <div className="space-y-6">
          {Object.keys(gruposPorEmpresa).length === 0 && (
              <div className="text-center py-10 opacity-50 font-bold uppercase text-xs">No hay proyectos para este mes</div>
          )}

          {Object.keys(gruposPorEmpresa).map((empresa) => (
            <div key={empresa} className="space-y-2 text-left">
              <h3 className="text-[9px] font-black uppercase text-black/40 pl-2 tracking-widest">{empresa}</h3>
              
              {gruposPorEmpresa[empresa].map((item, i) => {
                const { tipo, proyecto, evento } = item;
                const esCompleto = tipo === 'completo'; 
                const idUnico = esCompleto ? evento.id : `pend_${proyecto.id}`;
                
                const colorBorde = esCompleto ? PALETA_PASTEL[i % PALETA_PASTEL.length] : '#e5e7eb';
                const estiloOpacidad = esCompleto ? 'opacity-100' : 'opacity-60 grayscale-[0.5]';

                return (
                <div key={idUnico} className={`bg-white rounded-xl overflow-hidden shadow-sm transition-all ${estiloOpacidad}`}>
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50" 
                    style={{borderLeft: `6px solid ${colorBorde}`}} 
                    onClick={() => esCompleto ? setExpandido({...expandido, [idUnico]: !expandido[idUnico]}) : handleEditClick(item, {stopPropagation:()=>{}})}
                  >
                    {/* AQUÍ ESTÁ EL CAMBIO VISUAL PARA MÓVIL: Flex-1 y min-w-0 */}
                    <div className="flex flex-col flex-1 min-w-0 mr-2">
                      <div className="flex items-center gap-2">
                        {esCompleto && evento.noches_totales > 0 && <span>🌙</span>}
                        {!esCompleto && <span className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded shrink-0">PENDIENTE</span>}
                        {/* El truncate funcionará porque el padre tiene min-w-0 */}
                        <span className="font-black text-[10px] uppercase text-gray-800 truncate">
                            {esCompleto ? (evento.nombre_evento || proyecto.name) : proyecto.name}
                        </span>
                      </div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">
                        {esCompleto ? evento.event_date : "Sin Logística"}
                      </span>
                      {esCompleto && evento.place && (
                          <span className="text-[8px] text-blue-400 font-black uppercase mt-0.5 block truncate">
                              📍 {evento.place}
                          </span>
                      )}
                    </div>
                    
                    {/* Botones con shrink-0 para que no se aplasten */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={(e) => handleEditClick(item, e)} 
                        className={`p-2 rounded-full transition-all ${esCompleto ? 'text-gray-400 hover:text-blue-500 hover:bg-blue-50' : 'text-blue-600 bg-blue-50 hover:bg-blue-100 font-bold text-[9px] px-3 shadow-sm'}`}
                      >
                        {esCompleto ? '✏️' : '+ AÑADIR'}
                      </button>

                      {esCompleto && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); deleteEvento(evento.id, proyecto.name); }} className="p-2 opacity-40 hover:opacity-100 transition-all hover:text-red-500">🗑️</button>
                            <span className="text-gray-300 text-xl font-light w-8 text-center">{expandido[idUnico] ? "−" : "+"}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {esCompleto && expandido[idUnico] && (
                    <div className="p-4 text-[10px] space-y-4 bg-gray-50/50 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <div className="mb-3 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                    <p className="text-gray-400 font-black uppercase text-[7px] mb-0.5">📅 Fecha del Evento</p>
                                    <p className="font-bold text-gray-800 text-[11px]">{evento.event_date || "—"}</p>
                                    {evento.place && (
                                        <p className="text-[9px] font-black text-blue-500 uppercase mt-1">📍 {evento.place}</p>
                                    )}
                                </div>
                                <p className="text-gray-400 font-black uppercase text-[8px] mb-1">Coordinación</p>
                                <p className="font-bold text-gray-700">PR: {evento.coordinador_proyecto || "—"}</p>
                                <p className="font-bold text-gray-700">PD: {evento.coordinador_produccion || "—"}</p>
                            </div>
                            <div>
                                <p className="text-amber-600 font-black uppercase text-[8px] mb-1">Staff y Noches</p>
                                <div className="flex flex-wrap gap-1">
                                {evento.staff_detalle && Object.keys(evento.staff_detalle).length > 0 ? (
                                    Object.entries(evento.staff_detalle).map(([wId, n]) => {
                                    const trabajador = trabajadores.find(t => t.id.toString() === wId.toString());
                                    return (
                                        <div key={wId} className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md font-bold text-[10px] border border-amber-200 flex items-center gap-1">
                                        {trabajador ? trabajador.name : 'Staff'}: <span className="text-amber-900">{parseInt(n)||0} 🌙</span>
                                        </div>
                                    );
                                    })
                                ) : <p className="font-bold italic text-gray-400 leading-tight">— Sin staff —</p>}
                                </div>
                                {evento.noches_totales > 0 && <p className="mt-2 text-amber-700 uppercase text-[7px] font-black">Total: {evento.noches_totales} noches</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                                <span className="text-blue-600 font-black text-[7px] uppercase block mb-1">Montaje ({evento.setup_date || "S/F"})</span>
                                <p className="font-bold text-blue-900 leading-tight">🚚 {evento.setup_vehicle || "—"}</p>
                                <p className="text-[8px] mt-1 text-blue-800/60 whitespace-pre-wrap">{evento.team_setup}</p>
                            </div>
                            <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
                                <span className="text-purple-600 font-black text-[7px] uppercase block mb-1">Desmontaje ({evento.dismantle_date || "S/F"})</span>
                                <p className="font-bold text-purple-900 leading-tight">🚚 {evento.dismantle_vehicle || "—"}</p>
                                <p className="text-[8px] mt-1 text-purple-800/60 whitespace-pre-wrap">{evento.team_dismantle}</p>
                            </div>
                        </div>
                    </div>
                  )}
                </div>
              );
             })}
            </div>
          ))}
        </div>
        <div className="pt-4 flex justify-center">
           <Exportacion onExport={handleExportarDivision} tipo="division" />
        </div>
    </div>

      {showModalEvento && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center font-sans text-left">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-black uppercase tracking-tight">
                    {editId ? 'Editar Logística' : 'Añadir Logística a Proyecto'}
                </h2>
                <button onClick={() => setShowModalEvento(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 opacity-70 pointer-events-none grayscale">
                <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Empresa</label>
                    <select className="p-3 bg-gray-100 rounded-xl text-xs font-bold outline-none" value={empresaSeleccionadaModal} readOnly>
                        <option value={empresaSeleccionadaModal}>{empresaSeleccionadaModal}</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Proyecto</label>
                    <select className="p-3 bg-gray-100 rounded-xl text-xs font-bold outline-none" value={form.project_id} readOnly>
                        {proyectos.filter(p => p.id == form.project_id).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
              </div>

              {/* === NUEVO CAMPO: LUGAR DEL EVENTO === */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 bg-amber-50 p-3 rounded-2xl border border-amber-100">
                      <label className="text-[8px] font-black uppercase text-amber-600 tracking-widest">📅 Fecha Principal</label>
                      <input type="date" className="p-2 bg-white rounded-lg text-xs font-bold outline-none border border-amber-200" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-1 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">📍 Lugar</label>
                      <input type="text" className="p-2 bg-white rounded-lg text-xs font-bold outline-none border border-gray-200" placeholder="Ej: Madrid, IFEMA..." value={form.place} onChange={e => setForm({...form, place: e.target.value})} />
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
                                    <button type="button" onClick={() => toggleTrabajador(tId)} className="text-[8px] font-black uppercase text-left truncate">{estaActivo ? '✅ ' : ''}{t.name}</button>
                                    {estaActivo && (
                                        <div className="flex items-center gap-1 bg-blue-50 rounded-lg p-1">
                                            <span className="text-[7px] font-black text-blue-400">🌙</span>
                                            <input type="number" className="w-full bg-transparent text-[11px] font-bold outline-none text-blue-700" value={nochesPorTrabajador[tId]} onChange={(e) => setNochesPorTrabajador({...nochesPorTrabajador, [tId]: e.target.value})} min="0" />
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

              <button onClick={saveEvento} className="bg-black text-white w-full py-4 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">
                {editId ? "Actualizar Logística" : "Crear Logística"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Division;