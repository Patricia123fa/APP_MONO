import { useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import SeleccionarEmpleado from "../components/SeleccionEmpleado";
import SeleccionProyecto from "../components/SeleccionProyecto";
import Exportacion from "../components/Exportación";
import Calendario from "../components/Calendario";
import SelectorHoras15min from "../components/SelectorHoras";

export const IntroHoras = () => {
  // ESTADOS
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [horas, setHoras] = useState(0);

  
  const [horasRegistradas, setHorasRegistradas] = useState({});

  // FUNCIÓN PARA GUARDAR HORAS
  const guardarHoras = () => {
    if (!empleadoSeleccionado || !proyectoSeleccionado || !fechaSeleccionada) return;

    setHorasRegistradas((prev) => {
      const proyectoId = proyectoSeleccionado.id;
      const empleadoId = empleadoSeleccionado.id;

      const prevProyecto = prev[proyectoId] || {};
      const prevEmpleado = prevProyecto[empleadoId] || {};

      return {
        ...prev,
        [proyectoId]: {
          ...prevProyecto,
          [empleadoId]: {
            ...prevEmpleado,
            [fechaSeleccionada]: horas, 
          },
        },
      };
    });

    // RESET DE HORAS
    setHoras(0);
  };

  return (
    <div className="bg-[#fdc436] min-h-screen">
      <div className="bg-white/50 p-6 rounded-xl shadow-lg w-full sm:max-w-4xl sm:mx-auto space-y-4">
        <div className="text-black text-center font-bold text-lg mb-2">
          Introducir horas
        </div>

        {/* SELECCIÓN */}
        <SeleccionarEmpleado
          empleadoSeleccionado={empleadoSeleccionado}
          setEmpleadoSeleccionado={setEmpleadoSeleccionado}
        />

        <SeleccionProyecto
          proyectoSeleccionado={proyectoSeleccionado}
          setProyectoSeleccionado={setProyectoSeleccionado}
        />

        <Calendario
          fechaSeleccionada={fechaSeleccionada}
          setFechaSeleccionada={setFechaSeleccionada}
        />

        <SelectorHoras15min horas={horas} setHoras={setHoras} />

        {/*BOTÓN GUARDAR*/}
        <div className="flex justify-center mt-4">
          <button
            onClick={guardarHoras}
            className="block rounded-lg bg-[#fdc436] px-6 py-2 text-white font-bold hover:bg-[#e4201e]"
          >
            Guardar horas
          </button>
        </div>

        {/* EXPORTACIÓN */}
        <Exportacion horasRegistradas={horasRegistradas} />
      </div>
    </div>
  );
};
