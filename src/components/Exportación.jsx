import React, { useState } from "react";

export default function Exportacion({ onExport, tipo = "registro" }) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 7));
  const [alcance, setAlcance] = useState("mes");

  const handleAction = (formato) => {
    if (typeof onExport === "function") {
      onExport(formato, alcance, fecha);
    }
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-md border-y rounded-lg border-gray-100 py-1.5 px-3 shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1">
          <span className="hidden xs:block text-[7px] font-black uppercase tracking-wider text-gray-400 ml-3 mr-2">
        Exportar
        </span>
        {/* 1. SELECTOR ALCANCE (Le damos un pelín menos de padding para ganar espacio) */}
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

        {/* 2. FECHA (Ahora con espacio flexible pero protegido) */}
        {alcance === "mes" && (
          <div className="relative flex-1 flex items-center justify-center min-w-20">
            <div className="text-gray-800 font-black text-[10px] tracking-tight flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-xs">📅</span>
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

        {/* 3. BOTONES (Iconos con padding ajustado) */}
        <div className="flex items-center shrink-0">
          <button 
            type="button"
            onClick={() => handleAction("pdf")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 active:scale-90 transition-all text-base"
          >
            📄
          </button>
          
          <div className="w-px h-3 bg-gray-200 mx-0.5"></div>

          <button 
            type="button"
            onClick={() => handleAction("csv")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 active:scale-90 transition-all text-base"
          >
            📊
          </button>
        </div>

      </div>
    </div>
  );
}