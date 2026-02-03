import React, { useState } from "react";

// 1. Recibimos las listas de empresas y empleados como props
export default function Exportacion({ 
  onExport, 
  tipo = "registro", 
  empresas = [], 
  empleados = [] 
}) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 7));
  const [alcance, setAlcance] = useState("mes");
  
  // 2. Nuevos estados para los filtros
  const [empresaId, setEmpresaId] = useState("");
  const [empleadoId, setEmpleadoId] = useState("");

  const handleAction = (formato) => {
    if (typeof onExport === "function") {
      // 3. Enviamos todos los filtros al padre
      // Orden: formato, alcance, fecha, empresa, empleado
      onExport(formato, alcance, fecha, empresaId, empleadoId);
    }
  };

  // Estilo común para los selectores para mantener tu diseño limpio
  const selectStyle = "bg-gray-50 border border-gray-200 text-gray-700 text-[10px] rounded-md py-1 pl-2 pr-6 focus:outline-none focus:border-gray-400 hover:bg-white transition-colors cursor-pointer appearance-none min-w-[100px] max-w-[140px]";

  return (
    <div className="w-full bg-white/90 backdrop-blur-md border-y rounded-lg border-gray-100 py-1.5 px-3 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        
        {/* Bloque Izquierdo: Título + Alcance */}
        <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:block text-[7px] font-black uppercase tracking-wider text-gray-400">
              Exportar
            </span>
            
            <div className="flex bg-gray-100/50 p-0.5 rounded-full shrink-0 border border-gray-200/50">
              <button 
                type="button"
                onClick={() => setAlcance("mes")}
                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase transition-all ${alcance === 'mes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
              >
                Mes
              </button>
              <button 
                type="button"
                onClick={() => setAlcance("todo")}
                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase transition-all ${alcance === 'todo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
              >
                Todo
              </button>
            </div>
        </div>

        {/* Bloque Central: Filtros (Empresa / Empleado / Fecha) */}
        <div className="flex items-center gap-2 flex-1 justify-center">
            
            {/* Selector Empresa */}
            <div className="relative">
                <select 
                    value={empresaId} 
                    onChange={(e) => setEmpresaId(e.target.value)}
                    className={selectStyle}
                >
                    <option value="">🏢 Todas las empresas</option>
                    {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.nombre || emp.razon_social}</option>
                    ))}
                </select>
            </div>

            {/* Selector Empleado */}
            <div className="relative">
                <select 
                    value={empleadoId} 
                    onChange={(e) => setEmpleadoId(e.target.value)}
                    className={selectStyle}
                >
                    <option value="">👤 Todos los empleados</option>
                    {empleados.map((empl) => (
                        <option key={empl.id} value={empl.id}>{empl.nombre} {empl.apellido}</option>
                    ))}
                </select>
            </div>

            {/* Selector Fecha (Solo visible si alcance es mes) */}
            {alcance === "mes" && (
            <div className="relative flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md px-2 py-1 shrink-0">
                <div className="text-gray-700 font-bold text-[10px] flex items-center gap-1.5 whitespace-nowrap">
                <span>📅</span>
                {fecha.split('-')[1]}/{fecha.split('-')[0].slice(2)}
                </div>
                <input 
                type="month" 
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>
            )}
        </div>

        {/* Bloque Derecho: Botones de Acción */}
        <div className="flex items-center shrink-0">
          <button 
            type="button"
            onClick={() => handleAction("pdf")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 active:scale-90 transition-all text-base"
            title="Exportar a PDF"
          >
            📄
          </button>
          
          <div className="w-px h-3 bg-gray-200 mx-0.5"></div>

          <button 
            type="button"
            onClick={() => handleAction("csv")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 active:scale-90 transition-all text-base"
            title="Exportar a Excel/CSV"
          >
            📊
          </button>
        </div>

      </div>
    </div>
  );
}