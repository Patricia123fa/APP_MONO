import { useState, useEffect, useMemo } from "react";
import Exportacion from '../components/Exportación';

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

const formatDisplayTime = (val) => {
  const totalMinutes = Math.round(val * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  return `${h}:${m.toString().padStart(2, '0')}h`;
};

const ORDEN_PRIORIDAD = ["Monognomo", "Neozink", "Picofino", "Guardianes", "Escuela Energía", "Escuela Energia", "MANGO", "General"];

const sortEmpresas = (a, b) => {
  let idxA = ORDEN_PRIORIDAD.indexOf(a);
  let idxB = ORDEN_PRIORIDAD.indexOf(b);
  if (idxA === -1) idxA = 99;
  if (idxB === -1) idxB = 99;
  return idxA - idxB || a.localeCompare(b);
};

export default function TodosLosProyectos() {
  const [data, setData] = useState([]);
  const [workersList, setWorkersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abiertos, setAbiertos] = useState({});

  const [filtroEmpleado, setFiltroEmpleado] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroProyecto, setFiltroProyecto] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [modoMesCompleto, setModoMesCompleto] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newEntry, setNewEntry] = useState({ worker_id: "", hours: 0, date_work: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
    try {
      const [resData, resInit] = await Promise.all([
        fetch(`https://registromono.monognomo.com/api.php?action=get_all_projects&t=${Date.now()}`),
        fetch(`https://registromono.monognomo.com/api.php?action=get_initial_data`)
      ]);
      const result = await resData.json();
      const initData = await resInit.json();
      if (result.success) {
        setData(result.data.filter(reg => parseFloat(reg.hours) > 0).map(reg => ({ ...reg, semanaReal: getISOWeek(reg.date_work) })));
      }
      if (initData.success) {
        setWorkersList(initData.trabajadores);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

 const handleExportarRegistro = (formato, alcance, fechaExport) => {
    let filtrados = data;
    let tituloPeriodo = "Historial Completo";

    if (alcance === "mes") {
        const mesAFiltrar = fechaExport || fechaSeleccionada;
        if (!mesAFiltrar) return alert("🐵 Selecciona un mes.");
        const mesID = mesAFiltrar.substring(0, 7);
        filtrados = data.filter(r => r.date_work?.includes(mesID));
        tituloPeriodo = getNombreMes(mesAFiltrar);
    }

    if (formato === "csv") {
        // ... (Tu lógica de CSV Pro que ya funciona bien)
        const headers = ["ID_MES", "SEMANA", "FECHA", "DIA", "EMPRESA", "PROYECTO", "TRABAJADOR", "HORAS", "RELOJ"];
        const datosOrdenados = [...filtrados].sort((a, b) => new Date(a.date_work) - new Date(b.date_work));
        const rows = datosOrdenados.map(r => {
            const d = new Date(r.date_work);
            const diaNombre = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(d);
            const clean = (t) => `"${(t || "").toString().replace(/;/g, ',').replace(/"/g, '""')}"`;
            return [r.date_work.substring(0, 7), r.semanaReal || getISOWeek(r.date_work), r.date_work, diaNombre.toUpperCase(), clean(r.company), clean(r.name), clean(r.worker), r.hours.toString().replace('.', ','), formatDisplayTime(parseFloat(r.hours)).replace('h', '')];
        });
        const csvContent = "\ufeff" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `MONO_${tituloPeriodo.toUpperCase()}.csv`;
        link.click();
        return;
    }

    // --- LÓGICA PDF MEJORADA (EVITA BLOQUEOS Y SALTOS) ---
    const agrupado = {};
    filtrados.forEach(r => {
        if (!agrupado[r.company]) agrupado[r.company] = {};
        if (!agrupado[r.company][r.name]) agrupado[r.company][r.name] = {};
        const sem = r.semanaReal || "S/S";
        if (!agrupado[r.company][r.name][sem]) agrupado[r.company][r.name][sem] = [];
        agrupado[r.company][r.name][sem].push(r);
    });

    const ventana = window.open('', '_blank');
    if (!ventana) return alert("Bloqueador de ventanas activo 🐵");

    ventana.document.write(`
        <html>
          <head>
            <title>Reporte MonoGnomo</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&display=swap');
              body { font-family: 'Outfit', sans-serif; -webkit-print-color-adjust: exact; padding: 40px; }
              .page-break { page-break-before: always; }
              .no-break { page-break-inside: avoid; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              @media print { 
                body { padding: 0; margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body class="bg-white text-slate-800">
            <div class="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
              <div class="flex items-center gap-3 text-left">
                <span class="text-4xl text-left">🐵</span>
                <div class="text-left">
                  <h1 class="text-2xl font-black tracking-tighter text-slate-900 text-left">MonoGnomo</h1>
                  <p class="text-[8px] font-black uppercase tracking-[0.4em] text-yellow-500 text-left">Timesheet</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-[14px] font-bold text-slate-700 capitalize">${tituloPeriodo}</p>
              </div>
            </div>

            ${Object.keys(agrupado).sort(sortEmpresas).map((empresa, index) => `
              <div class="no-break text-left">
                <h2 class="inline-block bg-slate-50 text-slate-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 mb-6 text-left">
                  ${empresa}
                </h2>

                ${Object.entries(agrupado[empresa]).map(([proyName, semanas]) => {
                  const totalProyecto = Object.values(semanas).flat().reduce((acc, curr) => acc + parseFloat(curr.hours), 0);
                  return `
                    <div class="mb-8 text-left border-l border-slate-50 pl-4">
                      <div class="flex justify-between items-center mb-4 text-left">
                        <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">${proyName}</h3>
                        <span class="text-[10px] font-black text-slate-900">${formatDisplayTime(totalProyecto)}</span>
                      </div>
                      
                      ${Object.entries(semanas).sort((a,b) => a[0] - b[0]).map(([numSem, registros]) => `
                        <div class="mb-4 text-left">
                          <p class="text-[8px] font-black text-slate-300 uppercase mb-2">Semana ${numSem}</p>
                          <table class="text-left">
                            <tbody>
                              ${registros.sort((a,b) => new Date(a.date_work) - new Date(b.date_work)).map(reg => `
                                <tr class="text-[10px] text-slate-600 border-b border-slate-50/50">
                                  <td class="py-1 w-24">${new Date(reg.date_work).toLocaleDateString('es-ES', {day: 'numeric', month: 'short'})}</td>
                                  <td class="py-1 font-bold text-slate-700">${reg.worker}</td>
                                  <td class="py-1 text-right font-black text-slate-900">${formatDisplayTime(parseFloat(reg.hours))}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>
                      `).join('')}
                    </div>
                  `}).join('')}
              </div>
            `).join('')}

            <div class="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center">
              <p class="text-[9px] text-slate-300 uppercase tracking-widest text-left font-black italic">Total Report</p>
              <p class="text-4xl font-black text-slate-900 tracking-tighter text-right">
                ${formatDisplayTime(filtrados.reduce((acc, curr) => acc + parseFloat(curr.hours), 0))}
              </p>
            </div>

            <script>
              // Ejecución inmediata del print al cargar Tailwind
              window.addEventListener('load', () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              });
            </script>
          </body>
        </html>
    `);
    ventana.document.close();
};
  const handleBorrar = async (id) => {
    if (!window.confirm("¿Borrar este registro?")) return;
    try {
      const resp = await fetch(`https://registromono.monognomo.com/api.php?action=delete_entry&id=${id}`);
      if ((await resp.json()).success) fetchData();
    } catch (err) { alert("Error al borrar"); }
  };

  const handleEditar = async (reg) => {
    const nuevaFecha = window.prompt(`Editar fecha (AAAA-MM-DD):`, reg.date_work);
    if (nuevaFecha === null) return;
    const nuevasHoras = window.prompt(`Editar horas (usa .25, .50, .75):`, reg.hours);
    if (nuevasHoras !== null && !isNaN(nuevasHoras)) {
      try {
        const resp = await fetch(`https://registromono.monognomo.com/api.php?action=edit_entry&id=${reg.id}&hours=${nuevasHoras}&date_work=${nuevaFecha}`);
        if ((await resp.json()).success) fetchData();
      } catch (err) { alert("Error al editar"); }
    }
  };

  const handleAddHours = async (e) => {
    e.preventDefault();
    if (!newEntry.worker_id || newEntry.hours <= 0) return alert("Selecciona quién eres y añade tiempo 🐵");
    try {
      const resp = await fetch(`https://registromono.monognomo.com/api.php?action=add_entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          worker_id: newEntry.worker_id,
          hours: newEntry.hours,
          date_work: newEntry.date_work
        })
      });
      if ((await resp.json()).success) {
        setShowAddModal(false);
        fetchData();
        setNewEntry({ worker_id: "", hours: 0, date_work: new Date().toISOString().split('T')[0] });
      }
    } catch (err) { alert("Error de conexión"); }
  };

  const adjustHours = (val) => {
    setNewEntry(prev => ({ ...prev, hours: Math.max(0, parseFloat((prev.hours + val).toFixed(2))) }));
  };

  const filtradoFinal = useMemo(() => {
    let res = data;
    if (filtroEmpleado) res = res.filter(r => r.worker === filtroEmpleado);
    if (filtroEmpresa) res = res.filter(r => r.company === filtroEmpresa);
    if (filtroProyecto) res = res.filter(r => r.name === filtroProyecto);
    if (fechaSeleccionada) {
      const mesID = fechaSeleccionada.substring(0, 7);
      const semana = getISOWeek(fechaSeleccionada);
      if (modoMesCompleto) res = res.filter(r => r.date_work?.includes(mesID));
      else res = res.filter(r => r.semanaReal === semana && r.date_work?.includes(mesID));
    }
    const agrupado = {}
    res.forEach(reg => {
      const emp = reg.company || "Sin Empresa";
      const proy = reg.name || "Sin Proyecto";
      if (!agrupado[emp]) agrupado[emp] = { name: emp, proyectos: {} };
      if (!agrupado[emp].proyectos[proy]) agrupado[emp].proyectos[proy] = { name: proy, id: reg.project_id, trabajadores: {} };
      const wk = agrupado[emp].proyectos[proy].trabajadores;
      if (!wk[reg.worker]) wk[reg.worker] = { total: 0, semanas: {} };
      const s = wk[reg.worker].semanas;
      const sem = reg.semanaReal;
      if (!s[sem]) s[sem] = { totalSemana: 0, entradas: [] };
      wk[reg.worker].total += parseFloat(reg.hours);
      s[sem].totalSemana += parseFloat(reg.hours);
      s[sem].entradas.push(reg);
    });
    return Object.values(agrupado).sort((a, b) => sortEmpresas(a.name, b.name));
  }, [data, filtroEmpleado, filtroEmpresa, filtroProyecto, fechaSeleccionada, modoMesCompleto]);

  const totalSumaFlotante = useMemo(() => {
    if (!filtroEmpleado || !fechaSeleccionada) return null;
    const mesID = fechaSeleccionada.substring(0, 7);
    let base = data.filter(r => r.worker === filtroEmpleado && r.date_work?.includes(mesID));
    if (!modoMesCompleto) base = base.filter(r => r.semanaReal === getISOWeek(fechaSeleccionada));
    return base.reduce((acc, curr) => acc + parseFloat(curr.hours), 0);
  }, [data, filtroEmpleado, fechaSeleccionada, modoMesCompleto]);

  if (loading) return <div className="p-10 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">Actualizando...</div>;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-20 pt-0 bg-transparent min-h-screen font-sans text-gray-700 text-left">
      <h1 className="text-gray-700 text-center mb-4 font-bold text-xl uppercase tracking-tight">VER TODOS LOS PROYECTOS</h1>
      
      {/* EXPORTACIÓN CORREGIDA */}
      <div className="flex justify-center mb-6 scale-[0.8] origin-top">
         <Exportacion 
           tipo="registro" 
           onExport={handleExportarRegistro} 
         />
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <select value={filtroEmpleado} onChange={e => setFiltroEmpleado(e.target.value)} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none">
            <option value="">🐵 ¿Quién eres?</option>
            {workersList.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
          </select>
          <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none">
            <option value="">Empresa</option>
            {[...new Set(data.map(r => r.company))].sort(sortEmpresas).map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={filtroProyecto} onChange={e => setFiltroProyecto(e.target.value)} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none">
            <option value="">Proyecto</option>
            {[...new Set(data.map(r => r.name))].sort().map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold text-gray-700 flex justify-between items-center pointer-events-none min-h-10.5">
                <span>{fechaSeleccionada ? new Date(fechaSeleccionada).toLocaleDateString() : "Fecha"}</span>
                <span className="opacity-40">📅</span>
              </div>
              <input type="date" value={fechaSeleccionada} onChange={e => setFechaSeleccionada(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <button onClick={() => { setFiltroEmpleado(""); setFiltroEmpresa(""); setFiltroProyecto(""); setFechaSeleccionada(""); }} className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase border border-gray-200">Ver Todos</button>
          </div>
        </div>

        {fechaSeleccionada && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-2 border border-gray-200">
              <span className="text-[10px] font-bold uppercase text-gray-500">{getNombreMes(fechaSeleccionada)}</span>
              <div className="w-px h-3 bg-gray-300"></div>
              <button onClick={() => setModoMesCompleto(!modoMesCompleto)} className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md transition-all ${modoMesCompleto ? 'bg-gray-700 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}>
                {modoMesCompleto ? "Mes Completo" : `Semana ${getISOWeek(fechaSeleccionada)}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RESULTADOS */}
      <div className="space-y-10">
        {filtradoFinal.map((emp) => (
          <div key={emp.name} className="space-y-4">
            <h3 className="text-center text-[11px] font-black text-black/30 uppercase tracking-[0.5em]">{emp.name}</h3>
            <div className="grid grid-cols-1 gap-4">
              {Object.values(emp.proyectos).map(p => (
                <div key={p.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 flex justify-between items-center border-l-8" style={{ borderColor: getProjectColor(p.name), backgroundColor: getProjectColor(p.name) }}>
                    <span className="font-black text-[11px] text-gray-700 uppercase tracking-tight">{p.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-500 bg-white/80 px-2.5 py-1 rounded-lg">
                        {formatDisplayTime(Object.values(p.trabajadores).reduce((acc, curr) => acc + curr.total, 0))}
                      </span>
                      <button onClick={() => { setSelectedProject(p); setShowAddModal(true); }} className="hover:scale-125 transition-transform text-lg grayscale hover:grayscale-0">🐵</button>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-50">
                    {Object.entries(p.trabajadores).map(([nom, info]) => {
                      const collapseKey = `${p.name}-${nom}`;
                      return (
                        <div key={nom}>
                          <div onClick={() => setAbiertos(prev => ({...prev, [collapseKey]: !prev[collapseKey]}))} className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <img src={`${URL_BASE_FOTOS}${nom.replace(/ /g, '')}.jpeg`} onError={e => e.target.src=`https://ui-avatars.com/api/?name=${nom}&background=random&color=fff`} className="w-9 h-9 rounded-xl border border-gray-100 object-cover" />
                              <span className="text-xs font-bold text-gray-700 uppercase">{nom}</span>
                            </div>
                            <span className="text-[11px] font-bold text-gray-300">{formatDisplayTime(info.total)}</span>
                          </div>
                          {abiertos[collapseKey] && (
                            <div className="bg-gray-50/50 px-4 py-4 space-y-4 border-t border-gray-50 animate-in slide-in-from-top-2">
                              {Object.entries(info.semanas).sort((a,b) => b[0] - a[0]).map(([numSem, det]) => (
                                <div key={numSem} className="space-y-2">
                                  <div className="flex justify-between px-1">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Semana {numSem}</span>
                                    <span className="text-[9px] font-bold text-gray-300">{formatDisplayTime(det.totalSemana)}</span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-1.5">
                                    {det.entradas.map((entry, idx) => (
                                      <div key={idx} className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex flex-col text-left leading-tight">
                                          <span className="text-[10px] font-bold text-gray-600 capitalize">{new Date(entry.date_work).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}</span>
                                          <span className="text-[8px] text-gray-300">{entry.date_work}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="font-black text-gray-700 text-[11px] mr-1">{formatDisplayTime(parseFloat(entry.hours))}</span>
                                          <button onClick={(e) => { e.stopPropagation(); handleEditar(entry); }} className="p-2 bg-gray-50 rounded-lg text-xs">✏️</button>
                                          <button onClick={(e) => { e.stopPropagation(); handleBorrar(entry.id); }} className="p-2 bg-red-50 text-red-300 rounded-lg text-xs">🗑️</button>
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
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* PÍLDORA FLOTANTE */}
      {totalSumaFlotante !== null && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 animate-in slide-in-from-bottom-10">
          <div className="bg-white/95 backdrop-blur-md text-gray-800 px-6 py-2.5 rounded-2xl shadow-lg flex items-center gap-4 border border-gray-200">
            <div className="flex flex-col pr-4 border-r border-gray-200 leading-none">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{modoMesCompleto ? "Total Mes" : `Semana ${getISOWeek(fechaSeleccionada)}`}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase">{filtroEmpleado}</span>
            </div>
            <div className="text-xl font-black tracking-tighter text-gray-700">{formatDisplayTime(totalSumaFlotante)}</div>
          </div>
        </div>
      )}

      {/* MODAL PARA AÑADIR */}
      {showAddModal && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-4xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-black uppercase text-gray-800 tracking-widest leading-none">Registrar Tiempo 🐵</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-300 text-3xl">&times;</button>
            </div>
            <form onSubmit={handleAddHours} className="space-y-6">
              <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Proyecto</span>
                <span className="text-xs font-bold text-gray-700 block truncate uppercase">{selectedProject?.name}</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <select required value={newEntry.worker_id} onChange={e => setNewEntry({...newEntry, worker_id: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none">
                  <option value="">¿Quién eres?</option>
                  {workersList.sort((a,b) => a.name.localeCompare(b.name)).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <input required type="date" value={newEntry.date_work} onChange={e => setNewEntry({...newEntry, date_work: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none" />
              </div>
              <div className="flex items-center justify-center gap-6 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <button type="button" onClick={() => adjustHours(-0.25)} className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-md text-2xl font-black text-red-400">-</button>
                <div className="flex flex-col items-center w-24">
                  <span className="text-2xl font-black text-gray-800">{formatDisplayTime(newEntry.hours)}</span>
                  <span className="text-[8px] font-bold text-gray-400 uppercase">({newEntry.hours.toFixed(2)}h)</span>
                </div>
                <button type="button" onClick={() => adjustHours(0.25)} className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-md text-2xl font-black text-green-400">+</button>
              </div>
              <button type="submit" className="w-full bg-yellow-400 text-black font-black uppercase text-[11px] py-5 rounded-2xl shadow-xl border-2 border-yellow-500">Guardar Registro 🐵</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}