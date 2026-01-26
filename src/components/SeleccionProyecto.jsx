import React, { useState } from "react";

export default function SeleccionProyecto({ proyectoSeleccionado, setProyectoSeleccionado, proyectos = [], alActualizarDatos }) {
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");
  const [mostrandoFormNuevo, setMostrandoFormNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [cargando, setCargando] = useState(false);

  const empresas = [...new Set(proyectos.map((p) => p.company || "Otros"))].sort();
  const proyectosFiltrados = proyectos.filter(
    (p) => (p.company || "Otros") === empresaSeleccionada
  );

  const handleGuardarNuevo = async () => {
    if (!nuevoNombre.trim()) return;
    setCargando(true);

    const datos = {
      action: 'add_custom',
      tipo: 'proyecto', 
      nombre: nuevoNombre,
      empresa_relacionada: empresaSeleccionada
    };

    try {
      const resp = await fetch("https://registromono.monognomo.com/api.php?action=add_custom", {
        method: "POST",
        body: JSON.stringify(datos)
      });
      
      const res = await resp.json();
      
      if (res.success) {
        // 1. Pedimos al padre que refresque la lista de proyectos
        if (alActualizarDatos) {
          await alActualizarDatos();
        }

        // 2. IMPORTANTE: En lugar de esperar, buscamos el nombre en la lista 
        // que acaba de llegar o simplemente cerramos y dejamos que el usuario elija
        setMostrandoFormNuevo(false);
        setNuevoNombre("");
        alert("✅ Proyecto creado. Ahora puedes seleccionarlo en la lista.");
      } else {
        alert("Error: " + (res.message || "No se pudo guardar"));
      }
    } catch (err) {
      alert("Error de conexión con la API");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl rounded-xl bg-white/70 p-4 shadow space-y-4">
      
      {/* SECTOR EMPRESA */}
      <div className="w-full text-left">
        <label className="block mb-2 font-semibold text-gray-700 uppercase text-[10px] tracking-wider">Empresa / Cliente</label>
        <select
          value={empresaSeleccionada}
          onChange={(e) => {
            setEmpresaSeleccionada(e.target.value);
            setProyectoSeleccionado(null);
            setMostrandoFormNuevo(false);
          }}
          className="w-full p-3 border-none rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-black outline-none text-sm"
        >
          <option value="">-- Selecciona Empresa --</option>
          {empresas.map((emp) => (
            <option key={emp} value={emp}>{emp}</option>
          ))}
        </select>
      </div>

      {/* SECTOR PROYECTO */}
      {empresaSeleccionada && (
        <div className="space-y-3 w-full text-left">
          <label className="block mb-1 font-semibold text-gray-700 uppercase text-[10px] tracking-wider">Proyecto</label>
          <select
            value={proyectoSeleccionado ? proyectoSeleccionado.id : ""}
            onChange={(e) => {
              if(e.target.value === "nuevo") {
                setMostrandoFormNuevo(true);
              } else {
                const proy = proyectos.find((p) => p.id == e.target.value);
                setProyectoSeleccionado(proy);
                setMostrandoFormNuevo(false);
              }
            }}
            className="w-full p-3 border-none rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-black outline-none text-sm"
          >
            <option value="">-- Selecciona Proyecto --</option>
            {proyectosFiltrados.map((proy) => (
              <option key={proy.id} value={proy.id}>{proy.name}</option>
            ))}
            <option value="nuevo" className="text-blue-600 font-bold">+ AÑADIR NUEVO PROYECTO</option>
          </select>

          {/* FORMULARIO AÑADIR */}
          {mostrandoFormNuevo && (
            <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-md space-y-4">
              <input 
                type="text" 
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="w-full p-2 border-b-2 border-gray-200 outline-none focus:border-black"
                placeholder="Nombre del nuevo proyecto..."
                disabled={cargando}
              />
              <div className="flex gap-4 justify-end">
                <button 
                  onClick={() => { setMostrandoFormNuevo(false); setNuevoNombre(""); }} 
                  className="text-gray-400 text-[10px] font-bold uppercase"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleGuardarNuevo} 
                  disabled={cargando}
                  className="bg-black text-white px-4 py-2 rounded-full font-bold uppercase text-[10px]"
                >
                  {cargando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESUMEN FINAL */}
      {proyectoSeleccionado && !mostrandoFormNuevo && (
        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
           <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Seleccionado:</p>
           <p className="text-sm font-black uppercase">{empresaSeleccionada} / {proyectoSeleccionado.name}</p>
        </div>
      )}
    </div>
  );
}