import React from "react";

// CONFIGURACIÓN DE LA RUTA PARA LAS IMÁGENES EN EL SERVIDOR
const URL_BASE = "https://registromono.monognomo.com/assets/"; 

export default function SeleccionarEmpleado({ empleados = [], empleadoSeleccionado, setEmpleadoSeleccionado }) {

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-white/70 p-4 shadow">
      <label className="block mb-2 font-semibold text-gray-700 uppercase text-[10px] tracking-wider">
        Selecciona tu monognomo
      </label>
      
      <select
        value={empleadoSeleccionado ? empleadoSeleccionado.id : ""}
        onChange={(e) => {
            const id = e.target.value;
            const usuarioReal = empleados.find(emp => emp.id == id);
            setEmpleadoSeleccionado(usuarioReal);
        }}
        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#e4201e] bg-white"
      >
        <option value="">-- ¿Quién eres? --</option>
        
        {empleados.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name}
          </option>
        ))}
      </select>

      {/* ZONA DE FOTO */}
      {empleadoSeleccionado && (
        <div className="mt-4 flex flex-col items-center justify-center animate-fade-in">
          
          <img
            // ADAPTAMOS LOS NOMBRES A LOS NOMBRES DE LA BASE DE DATOS
            src={`${URL_BASE}${empleadoSeleccionado.name.replace(/ /g, '')}.jpeg`} 
            
            onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "https://via.placeholder.com/150?text=Sin+Foto";
            }}

            alt={empleadoSeleccionado.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mb-2 bg-gray-200"
          />
          
          <p className="text-gray-800 font-bold text-xl mt-2">
            ¡Hola, {empleadoSeleccionado.name}! 👋
          </p>
        </div>
      )}
    </div>
  );
}