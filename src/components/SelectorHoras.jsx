import React from "react";

//RECIBE HORAS
export default function SelectorHoras15min({ horas, setHoras }) {
  
  // SE HACE LA CONVERSIÓN
  const minutos = Math.round((horas || 0) * 60);

  // FUNCIÓN PARA MOSTRAR EL FORMATO DE LAS HORAS EN HH:MM
  const formatHoras = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  // AUMENTA O DISMINUYE
  const aumentar = () => {
    const nuevosMinutos = minutos + 15;
    setHoras(nuevosMinutos / 60); 
  };

  const disminuir = () => {
    const nuevosMinutos = Math.max(0, minutos - 15);
    setHoras(nuevosMinutos / 60);
  };

  // PODEMOS ESCRIBIR MANUALMENTE LA HORA TAMBIÉN
  const handleChange = (e) => {
    let value = e.target.value;

    const partes = value.split(":");
    if (partes.length === 2) {
      let h = parseInt(partes[0]) || 0;
      let m = parseInt(partes[1]) || 0;

      // REDONDEO A 15 MIN
      m = Math.round(m / 15) * 15;
      if (m === 60) {
        h += 1;
        m = 0;
      }
      
      const totalMinutos = h * 60 + m;
      // ENVIAMOS EL DATO CONVERTIDO
      setHoras(totalMinutos >= 0 ? totalMinutos / 60 : 0);
    }
  };

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-white/70 p-4 shadow text-center">
      <label className="block mb-2 font-semibold text-gray-700 uppercase text-[10px] tracking-wider">Horas realizadas</label>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={disminuir}
          className="px-3 py-2 bg-[#fdc436] text-white rounded hover:bg-yellow-600"
        >
          -
        </button>

        <input
          type="text"
          // MOSTRAMOS EL VALOR YA CALCULADO
          value={formatHoras(minutos)}
          onChange={handleChange}
          className="w-20 text-center border p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#e4201e]"
        />

        <button
          onClick={aumentar}
          className="px-3 py-2 bg-[#fdc436] text-white rounded hover:bg-yellow-600"
        >
          +
        </button>
      </div>
    </div>
  );
}