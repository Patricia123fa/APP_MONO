import React, { useState, useMemo } from "react";
//CONVIERTE LA FECHA DEL AÑO
const formatearMesAnio = (mesAnioStr) => {
  if (!mesAnioStr) return "";
  // SI EL MARCADOR ES ESPECIAL SE ESCRIBE "SIEMPRE ACTIVO"
  if (mesAnioStr === "9999-12") return "✨ Siempre Activo";
  
  const [year, month] = mesAnioStr.split("-");
  const fecha = new Date(year, month - 1);
  const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fecha);
  return `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${year}`;
};
//USA LOS DATOS DE LOS PROYECTOS
export default function SeleccionProyecto({ 
  proyectoSeleccionado, 
  setProyectoSeleccionado, 
  proyectos = [], 
  empresaPadre, 
  fechaPadre, // RECIBE EL MES DE INTROHORAS
  alActualizarDatos 
}) {
  const [mostrandoFormNuevo, setMostrandoFormNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [cargando, setCargando] = useState(false);

  // FILTRADO 
  const proyectosFiltrados = useMemo(() => {
    if (!empresaPadre || !fechaPadre) return [];
    
    const unicos = new Map();

    proyectos.forEach(p => {
      // NORMALIZAMOS EMPRESA
      const empresaBD = (p.company || "Sin Empresa").trim();
      const coincideEmpresa = empresaBD === empresaPadre.trim();
      
      // NORMALIZAMOS MES
      const mesBD = String(p.month_key || "").trim();
      const mesBuscado = String(fechaPadre).trim();
      const coincideMes = mesBD === mesBuscado || mesBD === "9999-12";

      if (coincideEmpresa && coincideMes) {
        unicos.set(p.id, p);
      }
    });

    // CONVERTIMOS EN ARRAY Y ORDENAMOS ALFABÉTICAMENTE
    return Array.from(unicos.values()).sort((a, b) => 
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }, [empresaPadre, fechaPadre, proyectos]);

  const handleGuardarNuevo = async () => {
    if (!nuevoNombre.trim()) return;
    setCargando(true);

    const datos = {
      action: 'add_custom',
      tipo: 'proyecto', 
      nombre: nuevoNombre,
      empresa_relacionada: empresaPadre,
      month_key: fechaPadre 
    };

    try {
      const resp = await fetch(`https://registromono.monognomo.com/api.php?action=add_custom`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      const res = await resp.json();
      if (res.success) {
        if (alActualizarDatos) await alActualizarDatos();
        setMostrandoFormNuevo(false);
        setNuevoNombre("");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  if (!empresaPadre) return null;
//VISUAL
  return (
    <div className="mx-auto w-full max-w-4xl rounded-xl bg-white/70 p-4 shadow space-y-3 animate-in fade-in duration-300">
      <div className="flex justify-between items-center px-1">
        <label className="font-black text-gray-400 uppercase text-[9px] tracking-[0.2em]">
          3. Proyectos de {empresaPadre} ({formatearMesAnio(fechaPadre)})
        </label>
        {proyectosFiltrados.length === 0 && (
          <span className="text-[8px] font-bold text-red-500 uppercase bg-red-50 px-2 py-1 rounded animate-pulse">
            Sin proyectos en {formatearMesAnio(fechaPadre)}
          </span>
        )}
      </div>

      <select
        value={proyectoSeleccionado ? proyectoSeleccionado.id : ""}
        onChange={(e) => {
          if (e.target.value === "nuevo") {
            setMostrandoFormNuevo(true);
          } else {
            const proy = proyectosFiltrados.find((p) => p.id == e.target.value);
            setProyectoSeleccionado(proy);
            setMostrandoFormNuevo(false);
          }
        }}
        className="w-full p-3.5 border-none rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-black outline-none text-sm font-bold text-gray-700 appearance-none"
      >
        <option value="">-- Elige Proyecto ({proyectosFiltrados.length} disponibles) --</option>
        {proyectosFiltrados.map((proy) => (
          <option key={proy.id} value={proy.id}>{proy.name}</option>
        ))}
        <option value="nuevo" className="text-blue-600 font-bold italic">+ AÑADIR NUEVO PROYECTO A ESTE MES</option>
      </select>

      {mostrandoFormNuevo && (
        <div className="p-5 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-inner space-y-4 animate-in zoom-in-95">
          <input 
            type="text" 
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none"
            placeholder="Nombre del nuevo proyecto..."
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <button onClick={() => setMostrandoFormNuevo(false)} className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Cancelar</button>
            <button onClick={handleGuardarNuevo} disabled={cargando} className="bg-black text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px]">
              {cargando ? "Guardando..." : "Crear 🐵"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}