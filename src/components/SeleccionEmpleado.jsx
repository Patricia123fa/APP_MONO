import { useState } from "react";
import { empleados } from "../data/Trabajadores.js"

//SEGÚN LA LISTA DE EMPLEADOS EN "TRABAJADORES" SE SELECCIONAN CADA UNO DE ELLOS Y LO RELACIONA CON SU RESPECTIVA FOTO
export default function SeleccionarEmpleado() {
  const [seleccionado, setSeleccionado] = useState("");

  return (
    <div className="max-w-md mx-auto mt-8 p-4 bg-white/50 rounded-lg shadow-md">
      <label className="block mb-2 font-semibold text-gray-700">
        Selecciona un trabajador:
      </label>
      <select
        value={seleccionado}
        //AL CAMBIAR SE ESTABLECE QUE EL VALOR ES EL EMPLEADO.
        onChange={(e) => setSeleccionado(e.target.value)}
        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#e4201e]"
      >
        <option value="">-- Selecciona --</option>
        {empleados.map((emp) => (
          //SE SACA EL NOMBRE DEL EMPLEADO
          <option key={emp.id} value={emp.name}>
            {emp.name}
          </option>
        ))}
      </select>

      {seleccionado && (
        <div className="mt-4 flex items-center gap-3">
          <p className="text-gray-700 font-medium">{seleccionado}</p>
          <img
          //SE BUSCA LA IMAGEN QUE CORRESPONDE AL EMPLEADO ANTERIORMENTE SELECCIONADO
            src={empleados.find((emp) => emp.name === seleccionado)?.image}
            alt={seleccionado}
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
