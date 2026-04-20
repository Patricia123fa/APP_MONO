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
  const [filtroBusquedaProyecto, setFiltroBusquedaProyecto] = useState("");
  const [ocultarSinRegistros, setOcultarSinRegistros] = useState(false);
  
  const [showModalEvento, setShowModalEvento] = useState(false);
  const [expandido, setExpandido] = useState({});
  const [editId, setEditId] = useState(null);
  const [nochesPorTrabajador, setNochesPorTrabajador] = useState({});
  const [empresaSeleccionadaModal, setEmpresaSeleccionadaModal] = useState("");

  // === NUEVOS ESTADOS VISUALES (No rompen lógica antigua) ===
  const [modoFecha, setModoFecha] = useState("day"); // 'day' o 'month'
  const [rangoMontaje, setRangoMontaje] = useState(false);
  const [rangoDesmontaje, setRangoDesmontaje] = useState(false);

  const getWorkerByRef = (ref) => {
    if (!ref) return null;
    const refStr = ref.toString().trim().toLowerCase();
    return trabajadores.find(t => {
      const idMatch = t.id?.toString() === ref.toString();
      const nameMatch = (t.name || "").trim().toLowerCase() === refStr;
      return idMatch || nameMatch;
    }) || null;
  };

  const getWorkerNameById = (id) => {
    if (!id) return "—";
    const encontrado = getWorkerByRef(id);
    return encontrado?.name || "—";
  };

  const getWorkerPhotoSrc = (ref) => {
    const trabajador = getWorkerByRef(ref);
    const fallbackName = trabajador?.name || (ref ? ref.toString() : "Staff");
    const slug = fallbackName.replace(/\s+/g, "");
    return `https://registromono.monognomo.com/assets/${slug}.jpeg`;
  };

  const getFechaPrevistaCompacta = (date, precision) => {
    if (!date) return "SIN\nLOG";

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "SIN\nLOG";

    const month = new Intl.DateTimeFormat("es-ES", { month: "short" })
      .format(d)
      .replace(".", "")
      .toUpperCase();
    const year = d.getFullYear();

    if (precision === "month") {
      return `${month}\n${year}`;
    }

    const day = String(d.getDate()).padStart(2, "0");
    return `${day} ${month}\n${year}`;
  };

  const getFechaReferenciaProyecto = (proyecto, evento = null) => {
    const fechaEvento = evento?.event_date || "";
    if (fechaEvento) {
      return {
        fecha: fechaEvento,
        precision: evento?.event_date_precision || "day",
        tieneRegistros: true,
        siempreActivo: false,
      };
    }

    const monthKeyRaw = String(proyecto?.month_key || "").trim();
    if (!monthKeyRaw) {
      return {
        fecha: "",
        precision: "month",
        tieneRegistros: false,
        siempreActivo: false,
      };
    }

    const monthKeyNorm = monthKeyRaw.replace(/-/g, "");
    if (monthKeyNorm === "999912") {
      return {
        fecha: "9999-12-01",
        precision: "month",
        tieneRegistros: false,
        siempreActivo: true,
      };
    }

    if (/^\d{4}-\d{2}$/.test(monthKeyRaw)) {
      return {
        fecha: `${monthKeyRaw}-01`,
        precision: "month",
        tieneRegistros: false,
        siempreActivo: false,
      };
    }

    return {
      fecha: monthKeyRaw,
      precision: monthKeyRaw.length > 7 ? "day" : "month",
      tieneRegistros: false,
      siempreActivo: false,
    };
  };

  const initialForm = {
    project_id: "", place: "", 
    event_date: "", event_date_precision: "day", // Nuevo campo (invisible si no se usa)
    setup_date: "", setup_date_end: "",          // Nuevo campo
    dismantle_date: "", dismantle_date_end: "",  // Nuevo campo
    coord_project_id: "", coord_prod_id: "", coord_disenio_id: "", team_setup: "", team_dismantle: "",
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

  // --- HELPER PARA PINTAR FECHAS BONITAS ---
  const formatearFechaDisplay = (date, precision, dateEnd = null) => {
    if (!date) return "—";
    
    // Si la base de datos dice que es solo mes
    if (precision === 'month') {
        const d = new Date(date);
        // Devuelve: "OCTUBRE 2026"
        return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
    }
    
    // Si tiene fecha de fin (es un rango)
    if (dateEnd && dateEnd !== "0000-00-00" && dateEnd !== date) {
        const d1 = new Date(date);
        const d2 = new Date(dateEnd);
        // Si es el mismo mes: "13 - 16 MAY"
        if(d1.getMonth() === d2.getMonth()) {
             return `${d1.getDate()} - ${d2.getDate()} ${d1.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}`;
        }
        // Meses distintos: "30/4 - 2/5"
        return `${d1.getDate()}/${d1.getMonth()+1} - ${d2.getDate()}/${d2.getMonth()+1}`;
    }

    // Comportamiento de siempre
    return date;
  };

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
    const mapaEventos = new Map();
    eventos.forEach(ev => mapaEventos.set(ev.project_id?.toString(), ev));
    const mesActivo = Boolean(filtroMes);

    const proyectosUnicos = new Map();
    
    proyectos.forEach(p => {
        const pExistente = proyectosUnicos.get(p.id);
        const eventoData = mapaEventos.get(p.id.toString());
        const refMeta = getFechaReferenciaProyecto(p, eventoData);
        const coincideMes = !mesActivo || refMeta.siempreActivo || (refMeta.fecha && refMeta.fecha.slice(0, 7) === filtroMes);

        if (!pExistente) {
            if (coincideMes) {
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
        
        if (filtroBusquedaProyecto.trim()) {
            const busqueda = filtroBusquedaProyecto.trim().toLowerCase();
            if (!(p.name || "").toLowerCase().includes(busqueda)) return;
        }

        if (filtroWorker) {
            if (!eventoAsociado) return; 
            const idBuscado = filtroWorker.toString();
            const esCoord = eventoAsociado.coord_project_id?.toString() === idBuscado || eventoAsociado.coord_prod_id?.toString() === idBuscado;
            const tieneNoches = eventoAsociado.staff_detalle && eventoAsociado.staff_detalle[idBuscado] !== undefined;
            if (!esCoord && !tieneNoches) return;
        }

        if (ocultarSinRegistros && !eventoAsociado) return;

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
    
    // --- FUNCIÓN DE ORDENACIÓN INTERNA (NUEVO) ---
    const sortItemsInternos = (items) => {
        const getSortMeta = (item) => {
            const refMeta = getFechaReferenciaProyecto(item.proyecto, item.evento);
            const fechaBase = refMeta.fecha ? new Date(refMeta.fecha) : null;
            const fechaValida = fechaBase && !Number.isNaN(fechaBase.getTime());

            return {
                grupo: item.tipo !== 'completo'
                  ? 2
                  : refMeta.precision === 'day'
                    ? 0
                    : 1,
                fecha: fechaValida ? fechaBase.getTime() : Number.POSITIVE_INFINITY,
                precision: refMeta.precision,
                nombre: item.proyecto.name || ""
            };
        };

        return items.sort((a, b) => {
            const metaA = getSortMeta(a);
            const metaB = getSortMeta(b);

            if (metaA.grupo !== metaB.grupo) return metaA.grupo - metaB.grupo;
            if (metaA.fecha !== metaB.fecha) return metaA.fecha - metaB.fecha;

            // Si empatan, mantener un orden estable por nombre
            return metaA.nombre.localeCompare(metaB.nombre);
        });
    };
    // ----------------------------------------------

    ORDEN_PRIORIDAD.forEach(empPrioridad => {
        const empDetectada = empresasDetectadas.find(e => e.toLowerCase() === empPrioridad.toLowerCase());
        if (empDetectada && grupos[empDetectada]) {
            // Aplicamos la ordenación interna aquí
            gruposOrdenados[empDetectada] = sortItemsInternos(grupos[empDetectada]);
        }
    });
    
    empresasDetectadas.forEach(emp => {
        if (!Object.values(gruposOrdenados).includes(grupos[emp])) { 
             const yaEsta = Object.keys(gruposOrdenados).some(k => k.toLowerCase() === emp.toLowerCase());
             if(!yaEsta) {
                // Aplicamos la ordenación interna aquí también
                gruposOrdenados[emp] = sortItemsInternos(grupos[emp]);
             }
        }
    });

    return { gruposPorEmpresa: gruposOrdenados };

  }, [proyectos, eventos, filtroMes, filtroWorker, filtroBusquedaProyecto, ocultarSinRegistros]);


  // --- ABRIR MODAL (Actualizado para leer los nuevos campos) ---
  const handleEditClick = (item, e) => {
    e.stopPropagation();
    
    const esPendiente = item.tipo === 'pendiente';
    const proyectoData = item.proyecto;
    const eventoData = item.evento;

    setEmpresaSeleccionadaModal(proyectoData.company || "");
    setEditId(esPendiente ? null : eventoData.id);

    // 1. Detectar precisión de fecha
    const precision = eventoData.event_date_precision || 'day';
    setModoFecha(precision);
    
    let eDate = eventoData.event_date || "";
    // Si es modo mes, cortamos el string para que el input type="month" lo entienda
    if (precision === 'month' && eDate.length > 7) eDate = eDate.substring(0, 7);

    // 2. Detectar rangos activos
    const tieneFinM = eventoData.setup_date_end && eventoData.setup_date_end !== "0000-00-00";
    setRangoMontaje(tieneFinM);
    
    const tieneFinD = eventoData.dismantle_date_end && eventoData.dismantle_date_end !== "0000-00-00";
    setRangoDesmontaje(tieneFinD);

    setForm({
      project_id: proyectoData.id,
      place: eventoData.place || "", 
      event_date: eDate, 
      event_date_precision: precision,
      setup_date: eventoData.setup_date || "", 
      setup_date_end: eventoData.setup_date_end || "",
      dismantle_date: eventoData.dismantle_date || "",
      dismantle_date_end: eventoData.dismantle_date_end || "",
      coord_project_id: eventoData.coord_project_id || "", 
      coord_prod_id: eventoData.coord_prod_id || "",
      coord_disenio_id: eventoData.coord_disenio_id || "",
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

  // --- GUARDAR (Prepara datos seguros para BD) ---
  const saveEvento = async () => {
    if (!form.project_id || !form.event_date) return alert("Proyecto y Fecha son obligatorios");
    
    const noches_staff = Object.entries(nochesPorTrabajador).map(([id, nights]) => ({
      worker_id: parseInt(id),
      nights: parseInt(nights) || 0
    }));

    const payload = { ...form, id: editId, noches_staff };

    // ASEGURAR FECHAS:
    // Si elegiste solo mes, añadimos "-01" para que la BD (Type DATE) no se rompa
    if (modoFecha === 'month') {
        payload.event_date = form.event_date + "-01"; 
        payload.event_date_precision = 'month';
    } else {
        payload.event_date_precision = 'day';
    }

    // Si los rangos están desactivados, mandamos NULL a las fechas de fin
    if (!rangoMontaje) payload.setup_date_end = null;
    if (!rangoDesmontaje) payload.dismantle_date_end = null;

    const action = editId ? 'update_event' : 'add_event'; 

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

  // --- EXPORTACIÓN (Sin cambios lógicos, solo visuales) ---
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
        const headers = ["FECHA", "EMPRESA", "PROYECTO", "LUGAR", "STAFF_DETALLE", "TOTAL_NOCHES", "COORD. PROYECTO", "COORD. PRODUCCION", "MONTAJE", "EQUIPO_M", "DESMONTAJE", "EQUIPO_D"];
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
            
            // Usamos el helper para exportar texto bonito
            const fechaBonita = formatearFechaDisplay(ev.event_date, ev.event_date_precision);
            const montajeBonito = formatearFechaDisplay(ev.setup_date, 'day', ev.setup_date_end);
            const desmontajeBonito = formatearFechaDisplay(ev.dismantle_date, 'day', ev.dismantle_date_end);

            return [
                fechaBonita, 
                clean(p?.company || "—"), 
                clean(ev.nombre_evento || p?.name), 
                clean(ev.place || ""), 
                clean(detalleStaffStr), 
                ev.noches_totales || 0,
                clean(ev.coordinador_proyecto), 
                clean(ev.coordinador_produccion), 
                clean(`${montajeBonito} (${ev.setup_vehicle})`),
                clean(ev.team_setup), 
                clean(`${desmontajeBonito} (${ev.dismantle_vehicle})`), 
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
                    
                    // Helpers en PDF
                    const fechaBonita = formatearFechaDisplay(ev.event_date, ev.event_date_precision);
                    const montajeBonito = formatearFechaDisplay(ev.setup_date, 'day', ev.setup_date_end);
                    const desmontajeBonito = formatearFechaDisplay(ev.dismantle_date, 'day', ev.dismantle_date_end);

                    return `<tr>
                        <td class="font-bold text-slate-400">${fechaBonita}</td>
                        <td>
                            <div class="font-black text-slate-900 uppercase text-[10px] mb-1">${ev.nombre_evento || p?.name}</div>
                            ${ev.place ? `<div class="text-[8px] font-bold text-blue-500 uppercase mb-1">📍 ${ev.place}</div>` : ''}
                            <div class="text-[8px] text-slate-500">Coord. Proyecto: ${ev.coordinador_proyecto || "—"}</div>
                            <div class="text-[8px] text-slate-500">Coord. Producci\u00f3n: ${ev.coordinador_produccion || "—"}</div>
                        </td>
                        <td><div class="text-slate-600 mb-1 leading-tight">${ev.desglose_noches || "—"}</div>${ev.noches_totales > 0 ? `<span class="badge">🌙 TOTAL: ${ev.noches_totales}</span>` : ''}</td>
                        <td><div class="text-[9px] font-bold text-blue-600">${montajeBonito}</div><div class="text-[9px] font-black text-slate-700 mt-1">🚚 ${ev.setup_vehicle || "—"}</div><div class="team-note">${ev.team_setup || "—"}</div></td>
                        <td><div class="text-[9px] font-bold text-purple-600">${desmontajeBonito}</div><div class="text-[9px] font-black text-slate-700 mt-1">🚚 ${ev.dismantle_vehicle || "—"}</div><div class="team-note">${ev.team_dismantle || "—"}</div></td>
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

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            className="text-[11px] font-bold p-3 bg-white rounded-xl outline-none uppercase w-full"
            value={filtroBusquedaProyecto}
            onChange={(e) => setFiltroBusquedaProyecto(e.target.value)}
            placeholder="Buscar proyecto por nombre"
          />
          <button
            type="button"
            onClick={() => setFiltroBusquedaProyecto("")}
            className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase border border-gray-200"
          >
            Limpiar
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="month"
            className="text-[11px] font-bold p-3 bg-white rounded-xl outline-none uppercase w-full"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setFiltroMes(prev => prev ? "" : new Date().toISOString().slice(0, 7))}
            className="px-3 py-3 rounded-xl text-[9px] font-black uppercase border transition-all whitespace-nowrap bg-white text-gray-500 border-gray-200"
          >
            {filtroMes ? "Mostrar todos" : "Ver mes actual"}
          </button>
          <select className="text-[11px] font-bold p-3 bg-white rounded-xl outline-none uppercase text-gray-700 w-full" value={filtroWorker} onChange={(e) => setFiltroWorker(e.target.value)}>
            <option value="">🐵 Todos</option>
            {trabajadores.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setOcultarSinRegistros(prev => !prev)}
            className={`px-3 py-3 rounded-xl text-[9px] font-black uppercase border transition-all whitespace-nowrap ${ocultarSinRegistros ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}
          >
            {ocultarSinRegistros ? "Ver todos" : "Ver solo con registros"}
          </button>
        </div>

        <div className="hidden md:block space-y-6">
          {Object.keys(gruposPorEmpresa).length === 0 && (
              <div className="text-center py-10 opacity-50 font-bold uppercase text-xs">No hay proyectos para este mes</div>
          )}

          {Object.keys(gruposPorEmpresa).map((empresa) => (
            <div key={empresa} className="space-y-2 text-left">
              <h3 className="text-[9px] font-black uppercase text-black/40 pl-2 tracking-widest">{empresa}</h3>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full table-fixed border-collapse">
                  <thead className="bg-slate-50/80">
                    <tr className="text-left">
                      <th className="px-2 py-2 text-[8px] font-black uppercase tracking-widest text-gray-400 w-[4%]">Fecha</th>
                      <th className="px-2 py-2 text-[8px] font-black uppercase tracking-widest text-gray-400 w-[38%]">Proyecto</th>
                      <th className="px-1 py-2 text-[8px] font-black uppercase tracking-widest text-gray-400 text-center w-[6%]">Coord. Proyecto</th>
                      <th className="px-1 py-2 text-[8px] font-black uppercase tracking-widest text-gray-400 text-center w-[6%]">Coord. Producción</th>
                      <th className="px-1 py-2 text-[8px] font-black uppercase tracking-widest text-gray-400 text-center w-[6%]">Coord. Diseño</th>
                      <th className="px-1 py-2 text-[8px] font-black uppercase tracking-widest text-gray-400 text-right w-[8%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {gruposPorEmpresa[empresa].map((item, i) => {
                      const { tipo, proyecto, evento } = item;
                      const esCompleto = tipo === 'completo';
                      const idUnico = esCompleto ? evento.id : `pend_${proyecto.id}`;
                      const colorBorde = esCompleto ? PALETA_PASTEL[i % PALETA_PASTEL.length] : '#e5e7eb';
                      const estiloOpacidad = esCompleto ? 'opacity-100' : 'opacity-60 grayscale-[0.5]';
                      const refMeta = getFechaReferenciaProyecto(proyecto, evento);
                      const fechaPrevista = getFechaPrevistaCompacta(refMeta.fecha, refMeta.precision);
                      const nombreProyecto = esCompleto ? (evento.nombre_evento || proyecto.name) : proyecto.name;
                      const lugarProyecto = evento.place || "—";
                      const coordProyectoRef = evento.coord_project_id || evento.coordinador_proyecto;
                      const coordProduccionRef = evento.coord_prod_id || evento.coordinador_produccion;
                      const coordDisenioRef = evento.coord_disenio_id || evento.coordinador_disenio;

                      return (
                        <>
                          <tr
                            key={idUnico}
                            className={`cursor-pointer transition-colors ${expandido[idUnico] ? 'bg-gray-50' : 'hover:bg-gray-50'} ${estiloOpacidad}`}
                            onClick={() => esCompleto ? setExpandido({...expandido, [idUnico]: !expandido[idUnico]}) : handleEditClick(item, { stopPropagation: () => {} })}
                          >
                            <td className="px-0 py-2 align-middle w-[48px] min-w-[48px]">
                              <div
                                className="w-[48px] min-h-[82px] rounded-r-2xl px-1 py-1 flex flex-col items-center justify-center text-center whitespace-pre-line"
                                style={{ backgroundColor: colorBorde }}
                              >
                                {esCompleto && evento.noches_totales > 0 && (
                                  <span className="text-[10px] leading-none mb-0.5">🌙</span>
                                )}
                                <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.04em] text-gray-700">
                                  {fechaPrevista}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-2 align-middle w-[38%]">
                              <div className="flex flex-col justify-center min-w-0 h-full">
                                <div className="flex items-center gap-1.5 min-w-0 leading-none">
                                  {!esCompleto && <span className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded shrink-0">PENDIENTE</span>}
                                  <span className="font-black text-[9px] uppercase text-gray-800 truncate">
                                    {nombreProyecto}
                                  </span>
                                </div>
                                <span className="text-[7px] text-blue-400 font-black uppercase mt-0.5 block truncate leading-none">
                                  📍 {lugarProyecto}
                                </span>
                              </div>
                            </td>
                            <td className="pr-0.5 pl-1 py-2 align-middle text-center w-[6%]">
                              {getWorkerByRef(coordProyectoRef) ? (
                                <img
                                  src={getWorkerPhotoSrc(coordProyectoRef)}
                                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getWorkerNameById(coordProyectoRef) || "Staff")}&background=random&color=fff`; }}
                                  alt="Coord. Proyecto"
                                  title={getWorkerNameById(coordProyectoRef)}
                                  className="mx-auto h-8 w-8 rounded-full object-cover border border-gray-200 shadow-sm"
                                />
                              ) : (
                                <div className="mx-auto h-8 w-8 rounded-full bg-gray-200 border border-gray-200 shadow-sm" />
                              )}
                            </td>
                            <td className="px-0.5 py-2 align-middle text-center w-[6%]">
                              {getWorkerByRef(coordProduccionRef) ? (
                                <img
                                  src={getWorkerPhotoSrc(coordProduccionRef)}
                                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getWorkerNameById(coordProduccionRef) || "Staff")}&background=random&color=fff`; }}
                                  alt="Coord. Producción"
                                  title={getWorkerNameById(coordProduccionRef)}
                                  className="mx-auto h-8 w-8 rounded-full object-cover border border-gray-200 shadow-sm"
                                />
                              ) : (
                                <div className="mx-auto h-8 w-8 rounded-full bg-gray-200 border border-gray-200 shadow-sm" />
                              )}
                            </td>
                            <td className="px-0.5 py-2 align-middle text-center w-[6%]">
                              {getWorkerByRef(coordDisenioRef) ? (
                                <img
                                  src={getWorkerPhotoSrc(coordDisenioRef)}
                                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getWorkerNameById(coordDisenioRef) || "Staff")}&background=random&color=fff`; }}
                                  alt="Coord. Diseño"
                                  title={getWorkerNameById(coordDisenioRef)}
                                  className="mx-auto h-8 w-8 rounded-full object-cover border border-gray-200 shadow-sm"
                                />
                              ) : (
                                <div className="mx-auto h-8 w-8 rounded-full bg-gray-200 border border-gray-200 shadow-sm" />
                              )}
                            </td>
                            <td className="pl-6 pr-1 py-2 align-middle text-right w-[8%]">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={(e) => handleEditClick(item, e)}
                                  className="p-1.5 rounded-full transition-all text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                                >
                                  ✏️
                                </button>

                                {esCompleto && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); deleteEvento(evento.id, proyecto.name); }} className="p-2 opacity-40 hover:opacity-100 transition-all hover:text-red-500">🗑️</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {esCompleto && expandido[idUnico] && (
                            <tr>
                              <td colSpan={6} className="bg-gray-50/50 p-3 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200 text-left">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[10px]">
                                  <div>
                                    <div className="mb-3 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                      <p className="text-gray-400 font-black uppercase text-[7px] mb-0.5">📅 Fecha del Evento</p>
                                      <p className="font-bold text-gray-800 text-[11px]">
                                        {formatearFechaDisplay(evento.event_date, evento.event_date_precision)}
                                      </p>
                                      {evento.place && (
                                        <p className="text-[9px] font-black text-blue-500 uppercase mt-1">📍 {evento.place}</p>
                                      )}
                                    </div>
                                    <p className="text-gray-400 font-black uppercase text-[8px] mb-1">Coordinación</p>
                                    <p className="font-bold text-gray-700">Coord. Proyecto: {evento.coordinador_proyecto || getWorkerNameById(evento.coord_project_id) || "—"}</p>
                                    <p className="font-bold text-gray-700">Coord. Producción: {evento.coordinador_produccion || getWorkerNameById(evento.coord_prod_id) || "—"}</p>
                                    <p className="font-bold text-gray-700">Coord. Diseño: {evento.coordinador_disenio || getWorkerNameById(evento.coord_disenio_id) || "—"}</p>
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                  <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                                    <span className="text-blue-600 font-black text-[7px] uppercase block mb-1">
                                      Montaje ({formatearFechaDisplay(evento.setup_date, 'day', evento.setup_date_end)})
                                    </span>
                                    <p className="font-bold text-blue-900 leading-tight">🚚 {evento.setup_vehicle || "—"}</p>
                                    <p className="text-[8px] mt-1 text-blue-800/60 whitespace-pre-wrap">{evento.team_setup}</p>
                                  </div>
                                  <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
                                    <span className="text-purple-600 font-black text-[7px] uppercase block mb-1">
                                      Desmontaje ({formatearFechaDisplay(evento.dismantle_date, 'day', evento.dismantle_date_end)})
                                    </span>
                                    <p className="font-bold text-purple-900 leading-tight">🚚 {evento.dismantle_vehicle || "—"}</p>
                                    <p className="text-[8px] mt-1 text-purple-800/60 whitespace-pre-wrap">{evento.team_dismantle}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* LISTADO DE PROYECTOS */}
        <div className="space-y-6 md:hidden">
          {Object.keys(gruposPorEmpresa).length === 0 && (
              <div className="text-center py-10 opacity-50 font-bold uppercase text-xs">No hay proyectos para este mes</div>
          )}

          {Object.keys(gruposPorEmpresa).map((empresa) => (
            <div key={empresa} className="space-y-2 text-left">
              <h3 className="text-[9px] font-black uppercase text-black/40 pl-2 tracking-widest">{empresa}</h3>

              <div className="grid grid-cols-[42px_minmax(0,1fr)_68px_34px] items-center gap-1 px-2 text-[7px] font-black uppercase tracking-widest text-black/30">
                <div>Fecha</div>
                <div>Proyecto</div>
                <div className="text-center">Coord.</div>
                <div></div>
              </div>

              {gruposPorEmpresa[empresa].map((item, i) => {
                const { tipo, proyecto, evento } = item;
                const esCompleto = tipo === 'completo';
                const idUnico = esCompleto ? evento.id : `pend_${proyecto.id}`;
                const refMeta = getFechaReferenciaProyecto(proyecto, evento);
                const fechaPrevista = getFechaPrevistaCompacta(refMeta.fecha, refMeta.precision);
                const nombreProyecto = esCompleto ? (evento.nombre_evento || proyecto.name) : proyecto.name;
                const coordProyectoRef = evento.coord_project_id || evento.coordinador_proyecto;
                const coordProduccionRef = evento.coord_prod_id || evento.coordinador_produccion;
                const coordDisenioRef = evento.coord_disenio_id || evento.coordinador_disenio;

                const colorBorde = esCompleto ? PALETA_PASTEL[i % PALETA_PASTEL.length] : '#e5e7eb';
                const estiloOpacidad = esCompleto ? 'opacity-100' : 'opacity-60 grayscale-[0.5]';

                const renderCoordStack = (refs) => {
                  return (
                    <div className="px-0 py-2 -ml-4 flex items-center justify-start">
                      <div className="flex items-center justify-start -space-x-2.5">
                        {refs.map((ref, idx) => {
                          const trabajador = getWorkerByRef(ref);
                          return trabajador ? (
                            <img
                              key={`${ref || 'sin'}-${idx}`}
                              src={getWorkerPhotoSrc(ref)}
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getWorkerNameById(ref) || 'Staff')}&background=random&color=fff`;
                              }}
                              alt={getWorkerNameById(ref) || 'Staff'}
                              className="h-7 w-7 rounded-full object-cover border border-white shadow-sm ring-1 ring-gray-200"
                              title={getWorkerNameById(ref) || 'Staff'}
                            />
                          ) : (
                            <div
                              key={`empty-${idx}`}
                              className="h-7 w-7 rounded-full bg-gray-200 border border-white shadow-sm ring-1 ring-gray-200"
                              title="Sin asignar"
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                };

                return (
                <div key={idUnico} className={`bg-white rounded-xl overflow-hidden shadow-sm transition-all ${estiloOpacidad}`}>
                  <div
                    className="grid grid-cols-[42px_minmax(0,1fr)_68px_34px] items-stretch cursor-pointer hover:bg-gray-50"
                    style={{borderLeft: `6px solid ${colorBorde}`}}
                    onClick={() => esCompleto ? setExpandido({...expandido, [idUnico]: !expandido[idUnico]}) : handleEditClick(item, {stopPropagation:()=>{}})}
                  >
                    <div
                      className="w-[42px] shrink-0 rounded-r-2xl px-1 py-2 flex flex-col items-center justify-center text-center whitespace-pre-line"
                      style={{ backgroundColor: colorBorde }}
                    >
                      {esCompleto && evento.noches_totales > 0 && (
                        <span className="text-[10px] leading-none mb-0.5">🌙</span>
                      )}
                      <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.04em] text-gray-700">
                        {fechaPrevista}
                      </span>
                    </div>

                    <div className="px-1 py-2 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-1 min-w-0 leading-none">
                        {!esCompleto && <span className="text-[8px] bg-gray-100 text-gray-500 px-1 rounded shrink-0">PENDIENTE</span>}
                        <span className="block max-w-[132px] font-black text-[9px] uppercase text-gray-800 truncate">
                          {nombreProyecto}
                        </span>
                      </div>
                      {esCompleto && evento.place && (
                        <span className="text-[7px] text-blue-400 font-black uppercase mt-0.5 block truncate leading-none">
                          📍 {evento.place}
                        </span>
                      )}
                    </div>

                    {renderCoordStack([coordProyectoRef, coordProduccionRef, coordDisenioRef])}

                    <div className="px-0.5 py-2 flex items-center justify-end -space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleEditClick(item, e)}
                        className={`p-1.5 rounded-full transition-all relative z-10 ${esCompleto ? 'text-gray-400 hover:text-blue-500 hover:bg-blue-50' : 'text-blue-600 bg-blue-50 hover:bg-blue-100 font-bold text-[9px] px-3 shadow-sm'}`}
                      >
                        {esCompleto ? '✏️' : '+ AÑADIR'}
                      </button>

                      {esCompleto && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteEvento(evento.id, proyecto.name); }}
                          className="p-1 opacity-40 hover:opacity-100 transition-all hover:text-red-500 relative -ml-1"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {esCompleto && expandido[idUnico] && (
                    <div className="p-4 text-[10px] space-y-4 bg-gray-50/50 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                        <div className="mb-3 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                            <p className="text-gray-400 font-black uppercase text-[7px] mb-0.5">Proyecto</p>
                            <p
                              className="font-black text-gray-800 text-[12px] leading-tight uppercase"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {nombreProyecto}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <div className="mb-3 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                    <p className="text-gray-400 font-black uppercase text-[7px] mb-0.5">📅 Fecha del Evento</p>
                                    <p className="font-bold text-gray-800 text-[11px]">
                                        {formatearFechaDisplay(evento.event_date, evento.event_date_precision)}
                                    </p>
                                    {evento.place && (
                                        <p className="text-[9px] font-black text-blue-500 uppercase mt-1">📍 {evento.place}</p>
                                    )}
                                </div>
                                <p className="text-gray-400 font-black uppercase text-[8px] mb-1">Coordinación</p>
                                <p className="font-bold text-gray-700">Coord. Proyecto: {evento.coordinador_proyecto || "—"}</p>
                                <p className="font-bold text-gray-700">{"Coord. Producción: "}{evento.coordinador_produccion || "—"}</p>
                                <p className="font-bold text-gray-700">Coord. Diseño: {evento.coordinador_disenio || getWorkerNameById(evento.coord_disenio_id)}</p>
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
                                <span className="text-blue-600 font-black text-[7px] uppercase block mb-1">
                                    Montaje ({formatearFechaDisplay(evento.setup_date, 'day', evento.setup_date_end)})
                                </span>
                                <p className="font-bold text-blue-900 leading-tight">🚚 {evento.setup_vehicle || "—"}</p>
                                <p className="text-[8px] mt-1 text-blue-800/60 whitespace-pre-wrap">{evento.team_setup}</p>
                            </div>
                            <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
                                <span className="text-purple-600 font-black text-[7px] uppercase block mb-1">
                                    Desmontaje ({formatearFechaDisplay(evento.dismantle_date, 'day', evento.dismantle_date_end)})
                                </span>
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

              {/* === FECHA PRINCIPAL === */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 bg-amber-50 p-3 rounded-2xl border border-amber-100">
                      <div className="flex justify-between items-center mb-1">
                          <label className="text-[8px] font-black uppercase text-amber-600 tracking-widest">📅 Fecha Evento</label>
                          <div className="flex gap-1">
                            <button onClick={()=>setModoFecha('day')} className={`text-[6px] uppercase font-black px-2 py-1 rounded ${modoFecha==='day'?'bg-amber-500 text-white':'bg-amber-100 text-amber-400'}`}>Día</button>
                            <button onClick={()=>setModoFecha('month')} className={`text-[6px] uppercase font-black px-2 py-1 rounded ${modoFecha==='month'?'bg-amber-500 text-white':'bg-amber-100 text-amber-400'}`}>Mes</button>
                          </div>
                      </div>
                      <input 
                        type={modoFecha === 'month' ? "month" : "date"} 
                        className="p-2 bg-white rounded-lg text-xs font-bold outline-none border border-amber-200" 
                        value={form.event_date} 
                        onChange={e => setForm({...form, event_date: e.target.value})} 
                      />
                  </div>
                  <div className="flex flex-col gap-1 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">📍 Lugar</label>
                      <input type="text" className="p-2 bg-white rounded-lg text-xs font-bold outline-none border border-gray-200" placeholder="Ej: Madrid, IFEMA..." value={form.place} onChange={e => setForm({...form, place: e.target.value})} />
                  </div>
              </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50 p-3 rounded-2xl">
                    <div className="flex flex-col gap-1">
                        <label className="text-[7px] font-black uppercase text-gray-400 tracking-widest">Coor. Proyecto</label>
                        <select className="p-2 bg-white rounded-lg text-[10px] outline-none border border-gray-200 font-bold" value={form.coord_project_id} onChange={e => setForm({...form, coord_project_id: e.target.value})}>
                            <option value="">Sin asignar</option>
                            {trabajadores.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[7px] font-black uppercase text-gray-400 tracking-widest">{"Coord. Producción"}</label>
                        <select className="p-2 bg-white rounded-lg text-[10px] outline-none border border-gray-200 font-bold" value={form.coord_prod_id} onChange={e => setForm({...form, coord_prod_id: e.target.value})}>
                            <option value="">Sin asignar</option>
                            {trabajadores.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[7px] font-black uppercase text-gray-400 tracking-widest">{"Coord. Diseño"}</label>
                        <select className="p-2 bg-white rounded-lg text-[10px] outline-none border border-gray-200 font-bold" value={form.coord_disenio_id} onChange={e => setForm({...form, coord_disenio_id: e.target.value})}>
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
                    {/* === MONTAJE === */}
                    <div className="space-y-2 text-left bg-gray-50 p-2 rounded-xl">
                        <div className="flex justify-between items-center">
                            <label className="text-[8px] font-black uppercase text-blue-500 tracking-widest">Montaje</label>
                            <button onClick={()=>setRangoMontaje(!rangoMontaje)} className="text-[7px] font-bold text-blue-400 bg-white px-2 py-1 rounded shadow-sm hover:text-blue-600">{rangoMontaje ? 'Quitar Rango' : '+ Rango'}</button>
                        </div>
                        <div className="flex gap-1">
                            <input className="w-full p-2 bg-white rounded-lg text-xs font-bold" type="date" value={form.setup_date} onChange={e => setForm({...form, setup_date: e.target.value})} />
                            {rangoMontaje && (
                                <input className="w-full p-2 bg-white rounded-lg text-xs font-bold animate-in slide-in-from-left-2" type="date" value={form.setup_date_end} onChange={e => setForm({...form, setup_date_end: e.target.value})} />
                            )}
                        </div>
                        <input className="w-full p-2 bg-white rounded-lg text-xs font-bold" placeholder="Vehículo" type="text" value={form.setup_vehicle} onChange={e => setForm({...form, setup_vehicle: e.target.value})} />
                        <textarea className="w-full p-2 bg-white rounded-lg text-xs h-16 outline-none font-bold" placeholder="Notas montaje..." value={form.team_setup} onChange={e => setForm({...form, team_setup: e.target.value})} />
                    </div>

                    {/* === DESMONTAJE === */}
                    <div className="space-y-2 text-left bg-gray-50 p-2 rounded-xl">
                        <div className="flex justify-between items-center">
                            <label className="text-[8px] font-black uppercase text-purple-500 tracking-widest">Desmontaje</label>
                            <button onClick={()=>setRangoDesmontaje(!rangoDesmontaje)} className="text-[7px] font-bold text-purple-400 bg-white px-2 py-1 rounded shadow-sm hover:text-purple-600">{rangoDesmontaje ? 'Quitar Rango' : '+ Rango'}</button>
                        </div>
                        <div className="flex gap-1">
                            <input className="w-full p-2 bg-white rounded-lg text-xs font-bold" type="date" value={form.dismantle_date} onChange={e => setForm({...form, dismantle_date: e.target.value})} />
                            {rangoDesmontaje && (
                                <input className="w-full p-2 bg-white rounded-lg text-xs font-bold animate-in slide-in-from-left-2" type="date" value={form.dismantle_date_end} onChange={e => setForm({...form, dismantle_date_end: e.target.value})} />
                            )}
                        </div>
                        <input className="w-full p-2 bg-white rounded-lg text-xs font-bold" placeholder="Vehículo" type="text" value={form.dismantle_vehicle} onChange={e => setForm({...form, dismantle_vehicle: e.target.value})} />
                        <textarea className="w-full p-2 bg-white rounded-lg text-xs h-16 outline-none font-bold" placeholder="Notas desmontaje..." value={form.team_dismantle} onChange={e => setForm({...form, team_dismantle: e.target.value})} />
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



