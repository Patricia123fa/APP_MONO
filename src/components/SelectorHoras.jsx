import { useState } from "react";

export default function SelectorHoras15min() {
  //ESTADO QUE EN UN PRINCIPIO EMPIEZA POR 15 MIN
  const [minutos, setMinutos] = useState(15); 

//FUNCIÓN PARA MOSTRAR EL FORMATO DE LAS HORAS EN HH:MM
  const formatHoras = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    //ASEGURA QUE LOS NÚMEROS TENGAN SIEMPRE 2 DÍGITOS, Y LO RELLENA CON 0 SINO
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  // AUMENTA O DISMINUYE DE 15 EN 15
  const aumentar = () => setMinutos(prev => prev + 15);
  const disminuir = () => setMinutos(prev => Math.max(0, prev - 15));

  // PODEMOS ESCRIBIR MANUALMENTE LA HORA TAMBIÉN
  const handleChange = (e) => {
    let value = e.target.value;

    //SEPARA LA CADENA CONVIRTIÉNDOLO 
    const partes = value.split(":");
    if (partes.length === 2) {
      let h = parseInt(partes[0]) || 0;
      let m = parseInt(partes[1]) || 0;

      //PARA QUE SIEMPRE SEAN MÚLTIPLOS DE 15
      m = Math.round(m / 15) * 15;
      if (m === 60) {
        h += 1;
        m = 0;
      }
      //SE CONVIERTE A MINUTOS TOTALES Y SET
      const total = h * 60 + m;
      setMinutos(total >= 0 ? total : 0);
    }
  };
  //MOSTRAMOS EL INPUT QUE AUMENTA Y DISMINUYE LAS HORAS
  return (
    <div className="max-w-xs mx-auto mt-4 p-4 bg-white/50 rounded-lg shadow-md text-center">
      <label className="block mb-2 font-semibold text-gray-700">Horas realizadas:</label>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={disminuir}
          className="px-3 py-2 bg-[#e4201e] text-white rounded hover:bg-red-700"
        >
          -
        </button>

        <input
          type="text"
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

