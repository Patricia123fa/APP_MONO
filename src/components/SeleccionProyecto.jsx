import React, { useState, useMemo, useEffect, useRef } from "react";

// CONVIERTE LA FECHA DEL AÑO
const formatearMesAnio = (mesAnioStr) => {
  if (!mesAnioStr) return "";
  if (mesAnioStr === "9999-12" || mesAnioStr === "999912") return "✨ Siempre Activo";
  
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
  const [advertenciaDuplicado, setAdvertenciaDuplicado] = useState("");

  // --- ESTADOS PARA LA BÚSQUEDA ---
  const [busqueda, setBusqueda] = useState("");
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const contenedorRef = useRef(null);

  // Cerrar el menú desplegable al hacer clic fuera del componente
  useEffect(() => {
    const clickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setMostrarDropdown(false);
      }
    };
    document.addEventListener("mousedown", clickFuera);
    return () => document.removeEventListener("mousedown", clickFuera);
  }, []);

  // Sincronizar el texto del input con el proyecto seleccionado
  useEffect(() => {
    if (proyectoSeleccionado) {
      setBusqueda(proyectoSeleccionado.name);
    } else if (!mostrarDropdown) {
      setBusqueda("");
    }
  }, [proyectoSeleccionado, mostrarDropdown]);

  // --- 1. FILTRADO BASE (POR EMPRESA Y ESTADO ACTIVO/MES) ---
  const proyectosDisponibles = useMemo(() => {
    if (!empresaPadre) return [];
    const empresaBuscada = String(empresaPadre).trim().toLowerCase();
    const mesBuscado = String(fechaPadre).replace(/-/g, "").trim(); 
    const unicos = new Map();

    proyectos.forEach(p => {
      const empresaBD = String(p.company || "Sin Empresa").trim().toLowerCase();
      const mesBD = String(p.month_key || "").replace(/-/g, "").trim();
      const coincideEmpresa = empresaBD === empresaBuscada;
      
      // Debe aparecer si es del mes actual, si no tiene mes o si es "Siempre Activo"
      const esDelMes = mesBD === mesBuscado;
      const esSiempreActivo = mesBD === "999912" || mesBD === "9999-12";
      const esProyectoVacio = !p.month_key;

      if (coincideEmpresa && (esDelMes || esSiempreActivo || esProyectoVacio)) {
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

  // --- 2. FILTRADO DINÁMICO (LO QUE ESCRIBE EL USUARIO) ---
  const proyectosVisibles = useMemo(() => {
    if (busqueda && (!proyectoSeleccionado || busqueda !== proyectoSeleccionado.name)) {
      return proyectosDisponibles.filter(p => 
        p.name.toLowerCase().includes(busqueda.toLowerCase())
      );
    }
    return proyectosDisponibles;
  }, [proyectosDisponibles, busqueda, proyectoSeleccionado]);

  // --- VALIDACIÓN DE DUPLICADOS ---
  useEffect(() => {
    const nombreLimpio = nuevoNombre.trim().toLowerCase();
    if (nombreLimpio.length < 3) { setAdvertenciaDuplicado(""); return; }
    const palabrasNuevas = nombreLimpio.split(/\s+/).filter(p => p.length > 2);
    const duplicado = proyectos.find(proj => {
      const palabrasExistentes = proj.name.toLowerCase().split(/\s+/).filter(p => p.length > 2);
      const coincidencias = palabrasNuevas.filter(pal => palabrasExistentes.includes(pal));
      return coincidencias.length >= 3 || (palabrasNuevas.length > 0 && coincidencias.length === palabrasNuevas.length);
    });
    setAdvertenciaDuplicado(duplicado ? `⚠️ Se parece a: "${duplicado.name.toUpperCase()}"` : "");
  }, [nuevoNombre, proyectos]);

  // --- GUARDAR NUEVO PROYECTO ---
  const handleGuardarNuevo = async () => {
    const nombreLimpio = nuevoNombre.trim();
    if (!nombreLimpio) return;

    if (advertenciaDuplicado && !window.confirm(`¡ATENCIÓN!\n\n${advertenciaDuplicado}\n\n¿Crearlo de todas formas?`)) return;

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
          // CLAVE: Nace siempre activo para que no "muera" al cambiar de mes
          month_key: '9999-12' 
        })
      });
      const res = await resp.json();
      if (res.success) {
        if (alActualizarDatos) await alActualizarDatos();
        setMostrandoFormNuevo(false);
        setNuevoNombre("");
        setBusqueda(nombreLimpio); // Lo dejamos escrito para que el usuario lo vea
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  if (!empresaPadre) return null;

  return (
    <div className="mx-auto w-full max-w-4xl rounded-xl bg-white/70 p-4 shadow space-y-3 animate-in fade-in duration-300" ref={contenedorRef}>
      
      <div className="flex justify-between items-center px-1">
        <label className="font-black text-gray-400 uppercase text-[9px] tracking-[0.2em]">
          3. Proyectos de {empresaPadre} ({proyectosDisponibles.length} disponibles)
        </label>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
          {formatearMesAnio(fechaPadre)}
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            if (proyectoSeleccionado) setProyectoSeleccionado(null);
            setMostrarDropdown(true);
          }}
          onFocus={() => setMostrarDropdown(true)}
          placeholder={`Escribe para buscar entre ${proyectosDisponibles.length} proyectos...`}
          className="w-full p-3.5 border-none rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-black outline-none text-sm font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-normal"
        />

        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M7.247 11.14 2.451 5.658C2.185 5.355 2.398 5 2.773 5h9.454c.375 0 .588.355.323.658l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
          </svg>
        </div>
        
        {mostrarDropdown && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {proyectosVisibles.length > 0 ? (
                proyectosVisibles.map((proy) => (
                  <div
                    key={proy.id}
                    onClick={() => {
                      setProyectoSeleccionado(proy);
                      setBusqueda(proy.name);
                      setMostrarDropdown(false);
                    }}
                    className={`p-4 text-sm font-bold border-b border-gray-50 last:border-none cursor-pointer transition-colors
                      ${proyectoSeleccionado?.id === proy.id ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {proy.name}
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-gray-400 italic text-center">No hay resultados para "{busqueda}"</div>
              )}
            </div>

            <div 
              onClick={() => { setMostrandoFormNuevo(true); setMostrarDropdown(false); }}
              className="p-4 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-100 text-center border-t border-blue-100"
            >
              + CREAR NUEVO PROYECTO (ACTIVO SIEMPRE)
            </div>
          </div>
        )}
      </div>

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
          {advertenciaDuplicado && <p className="text-[10px] font-bold text-orange-600 px-1 animate-pulse italic">{advertenciaDuplicado}</p>}
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