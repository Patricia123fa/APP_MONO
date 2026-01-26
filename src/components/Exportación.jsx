import React, { useState } from "react";

export default function Exportacion({ onExport }) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 7));
  const [alcance, setAlcance] = useState("mes"); 

  const handleExport = (formato) => {
    onExport(formato, alcance, fecha);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 w-full max-w-sm mx-auto">
      
      {/* 1. SELECCIÓN DE ALCANCE - ADAPTADO A MÓVIL (MÁS ANCHO) */}
      <div className="flex w-full bg-white/20 p-1 rounded-2xl border border-white/40 shadow-inner">
        <button 
          onClick={() => setAlcance("mes")}
          className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${alcance === 'mes' ? 'bg-white text-gray-800 shadow-md scale-[1.02]' : 'text-gray-500 opacity-60'}`}
        >
          Mes Seleccionado
        </button>
        <button 
          onClick={() => setAlcance("todo")}
          className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${alcance === 'todo' ? 'bg-white text-gray-800 shadow-md scale-[1.02]' : 'text-gray-500 opacity-60'}`}
        >
          Todo el Histórico
        </button>
      </div>

      {/* 2. SELECTOR DE FECHA - DISEÑO MINIMALISTA */}
      <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${alcance === 'todo' ? 'h-0 opacity-0 overflow-hidden' : 'h-12 opacity-100'}`}>
        <span className="text-[7px] font-black uppercase tracking-[0.4em] text-gray-500/80">Periodo</span>
        <input 
          type="month" 
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="bg-transparent text-gray-800 font-black uppercase text-sm tracking-widest text-center outline-none border-none focus:ring-0"
        />
      </div>

      {/* 3. BOTONES DE FORMATO - EN COLUMNA PARA MÓVIL, FILA EN DESKTOP */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button 
          onClick={() => handleExport("pdf")}
          className="flex-1 py-4 bg-white/60 backdrop-blur-md border border-white/80 text-gray-800 text-[10px] font-black rounded-2xl active:scale-95 transition-all uppercase tracking-[0.2em] shadow-sm flex items-center justify-center gap-2"
        >
          <span>📄</span> PDF
        </button>
        <button 
          onClick={() => handleExport("csv")}
          className="flex-1 py-4 bg-white/60 backdrop-blur-md border border-white/80 text-gray-800 text-[10px] font-black rounded-2xl active:scale-95 transition-all uppercase tracking-[0.2em] shadow-sm flex items-center justify-center gap-2"
        >
          <span>📊</span> CSV
        </button>
      </div>

      <div className="flex flex-col items-center gap-1 mt-2">
        <div className="h-px w-8 bg-gray-400/20"></div>
      </div>
    </div>
  );
}