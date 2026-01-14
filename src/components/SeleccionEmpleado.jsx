import { useState } from "react";
import { empleados } from "../data/Trabajadores.js"


export default function SeleccionarEmpleado() {
  const [seleccionado, setSeleccionado] = useState("");

  return (
    <div className="max-w-md mx-auto mt-8 p-4 bg-white rounded-lg shadow-md">
      <label className="block mb-2 font-semibold text-gray-700">
        Selecciona un trabajador:
      </label>
      <select
        value={seleccionado}
        onChange={(e) => setSeleccionado(e.target.value)}
        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Selecciona --</option>
        {empleados.map((emp) => (
          <option key={emp.id} value={emp.name}>
            {emp.name}
          </option>
        ))}
      </select>

      {seleccionado && (
        <div className="mt-4 flex items-center gap-3">
          <p className="text-gray-700 font-medium">{seleccionado}</p>
          <img
            src={empleados.find((emp) => emp.name === seleccionado)?.image}
            alt={seleccionado}
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
