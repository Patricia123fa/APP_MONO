import { useState } from "react";

export default function SelectorHoras15min() {
  const [minutos, setMinutos] = useState(15); // valor en minutos

  // Función para mostrar en HH:MM
  const formatHoras = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  // Aumentar o disminuir en 15 minutos
  const aumentar = () => setMinutos(prev => prev + 15);
  const disminuir = () => setMinutos(prev => Math.max(0, prev - 15));

  // Manejar input manual
  const handleChange = (e) => {
    let value = e.target.value;

    // Convertir a minutos
    const partes = value.split(":");
    if (partes.length === 2) {
      let h = parseInt(partes[0]) || 0;
      let m = parseInt(partes[1]) || 0;

      // Redondear al múltiplo de 15 más cercano
      m = Math.round(m / 15) * 15;
      if (m === 60) {
        h += 1;
        m = 0;
      }

      const total = h * 60 + m;
      setMinutos(total >= 0 ? total : 0);
    }
  };

  return (
    <div className="max-w-xs mx-auto mt-4 p-4 bg-white rounded-lg shadow-md text-center">
      <label className="block mb-2 font-semibold text-gray-700">Horas de trabajo:</label>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={disminuir}
          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          -
        </button>

        <input
          type="text"
          value={formatHoras(minutos)}
          onChange={handleChange}
          className="w-20 text-center border p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={aumentar}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          +
        </button>
      </div>

      <p className="mt-2 text-gray-600 text-sm">
        Los valores siempre serán múltiplos de 15 minutos.
      </p>
    </div>
  );
}

