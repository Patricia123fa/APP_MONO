import React, { useState, useMemo, useEffect } from "react"; // 1. Añadido useEffect

// CONVIERTE LA FECHA DEL AÑO
const formatearMesAnio = (mesAnioStr) => {
  if (!mesAnioStr) return "";
  if (mesAnioStr === "9999-12") return "✨ Siempre Activo";
  
  const [year, month] = mesAnioStr.split("-");
  const fecha = new Date(year, month - 1);
  const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fecha);
  return `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${year}`;
};

export default function SeleccionProyecto({ 
  proyectoSeleccionado, 
  setProyectoSeleccionado, 
  proyectos = [], 
  empresaPadre, 
  fechaPadre, 
  alActualizarDatos 
}) {
  const [mostrandoFormNuevo, setMostrandoFormNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [advertenciaDuplicado, setAdvertenciaDuplicado] = useState(""); // 2. Movido aquí dentro

  // --- FILTRADO DE PROYECTOS ---
  const proyectosFiltrados = useMemo(() => {
    if (!empresaPadre || !fechaPadre) return [];
    const empresaBuscada = String(empresaPadre).trim().toLowerCase();
    const mesBuscado = String(fechaPadre).replace(/-/g, "").trim(); 
    const unicos = new Map();

    proyectos.forEach(p => {
      const empresaBD = String(p.company || "Sin Empresa").trim().toLowerCase();
      const esProyectoVacio = !p.month_key;
      const mesBDRaw = String(p.month_key || ""); 
      const mesBD = mesBDRaw.replace(/-/g, "").trim();
      const coincideEmpresa = empresaBD === empresaBuscada;
      const esDelMes = mesBD === mesBuscado;
      const esSiempreActivo = mesBD === "999912" || mesBD === "9999-12";
      const debeAparecer = esDelMes || esSiempreActivo || esProyectoVacio;

      if (coincideEmpresa && debeAparecer) {
        const yaExiste = unicos.get(p.id);
        if (!yaExiste || esDelMes) {
            unicos.set(p.id, p);
        }
      }
    });

    return Array.from(unicos.values()).sort((a, b) => 
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }, [empresaPadre, fechaPadre, proyectos]);

  // --- VALIDACIÓN EN TIEMPO REAL ---
  useEffect(() => {
    const nombreLimpio = nuevoNombre.trim().toLowerCase();
    if (nombreLimpio.length < 3) {
      setAdvertenciaDuplicado("");
      return;
    }

    const palabrasNuevas = nombreLimpio.split(/\s+/).filter(p => p.length > 2);
    
    const duplicado = proyectos.find(proj => {
      const palabrasExistentes = proj.name.toLowerCase().split(/\s+/).filter(p => p.length > 2);
      const coincidencias = palabrasNuevas.filter(pal => palabrasExistentes.includes(pal));
      return coincidencias.length >= 3 || (palabrasNuevas.length > 0 && coincidencias.length === palabrasNuevas.length);
    });

    setAdvertenciaDuplicado(duplicado ? `⚠️ Se parece a: "${duplicado.name.toUpperCase()}"` : "");
  }, [nuevoNombre, proyectos]);

  const handleGuardarNuevo = async () => {
    const nombreLimpio = nuevoNombre.trim();
    if (!nombreLimpio) return;

    // Mantenemos el confirm por seguridad extra al hacer click
    if (advertenciaDuplicado) {
      const confirmar = window.confirm(
        `¡ATENCIÓN!\n\n${advertenciaDuplicado}\n\n¿Estás seguro de que quieres crearlo de todas formas?`
      );
      if (!confirmar) return; 
    }

    setCargando(true);
    try {
      const resp = await fetch(`https://registromono.monognomo.com/api.php?action=add_custom`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_custom',
          tipo: 'proyecto', 
          nombre: nombreLimpio,
          empresa_relacionada: empresaPadre,
          month_key: fechaPadre 
        })
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

  return (
    <div className="mx-auto w-full max-w-4xl rounded-xl bg-white/70 p-4 shadow space-y-3 animate-in fade-in duration-300">
      <div className="flex justify-between items-center px-1">
        <label className="font-black text-gray-400 uppercase text-[9px] tracking-[0.2em]">
          3. Proyectos de {empresaPadre} ({formatearMesAnio(fechaPadre)})
        </label>
      </div>

      <select
        value={proyectoSeleccionado ? proyectoSeleccionado.id : ""}
        onChange={(e) => {
          if (e.target.value === "nuevo") {
            setMostrandoFormNuevo(true);
          } else {
            const proy = proyectosFiltrados.find((p) => String(p.id) === String(e.target.value));
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
            className={`w-full p-3 bg-gray-50 border ${advertenciaDuplicado ? 'border-orange-300 ring-2 ring-orange-50' : 'border-gray-100'} rounded-xl text-sm font-bold outline-none`}
            placeholder="Nombre del nuevo proyecto..."
            autoFocus
          />
          
          {advertenciaDuplicado && (
            <p className="text-[10px] font-bold text-orange-600 px-1 animate-pulse italic">
              {advertenciaDuplicado}
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={() => { setMostrandoFormNuevo(false); setNuevoNombre(""); }} className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Cancelar</button>
            <button onClick={handleGuardarNuevo} disabled={cargando} className="bg-black text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px]">
              {cargando ? "Guardando..." : "Crear 🐵"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}