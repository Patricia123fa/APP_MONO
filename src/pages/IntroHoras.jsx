import { useState, useEffect } from "react";
import SeleccionarEmpleado from "../components/SeleccionEmpleado";
import SeleccionProyecto from "../components/SeleccionProyecto";
import Exportacion from "../components/Exportación";
import Calendario from "../components/Calendario";
import SelectorHoras15min from "../components/SelectorHoras";

export const IntroHoras = () => {
  const [datosBD, setDatosBD] = useState({ trabajadores: [], proyectos: [] });
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [horas, setHoras] = useState(0);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState("");
  const [horasRegistradas, setHorasRegistradas] = useState([]);

  const cargarDatos = () => {
    fetch("https://registromono.monognomo.com/api.php?action=get_initial_data")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDatosBD({ trabajadores: data.trabajadores, proyectos: data.proyectos });
        }
      });
  };

  useEffect(() => { cargarDatos(); }, []);

  const guardarHoras = () => {
    if (!empleadoSeleccionado || !proyectoSeleccionado || horas <= 0) {
        alert("⚠️ Selecciona empleado, proyecto y horas.");
        return;
    }

    const fechaFormateada = new Date(fechaSeleccionada).toLocaleDateString('en-CA');
    const datosEnvio = {
        worker_id: empleadoSeleccionado.id,
        project_id: proyectoSeleccionado.id,
        hours: horas,
        date_work: fechaFormateada
    };

    fetch("https://registromono.monognomo.com/api.php?action=add_entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosEnvio)
    })
    .then(res => res.json())
    .then(resp => {
        if (resp.success) {
            setMensajeConfirmacion(`Has guardado ${horas} horas en ${proyectoSeleccionado.name}`);
            setHorasRegistradas([...horasRegistradas, { 
              empleado: empleadoSeleccionado.name, 
              proyecto: proyectoSeleccionado.name, 
              fecha: fechaFormateada, 
              horas: horas 
            }]);
            setHoras(0);
            setTimeout(() => setMensajeConfirmacion(""), 5000);
        }
    });
  };

  return (
    <div className="bg-[#fdc436] min-h-screen p-4 flex justify-center">
      {/* CONTENEDOR PRINCIPAL CENTRADO */}
      <div className="bg-white/50 p-6 rounded-xl shadow-lg w-full sm:max-w-4xl sm:mx-auto space-y-6">
    
        
        <h1 className="text-black text-center mb-4 font-bold text-xl uppercase tracking-tight">
          Introducir horas
        </h1>

        <SeleccionarEmpleado
          empleadoSeleccionado={empleadoSeleccionado}
          setEmpleadoSeleccionado={setEmpleadoSeleccionado}
          empleados={datosBD.trabajadores} 
        />

        <SeleccionProyecto
          proyectoSeleccionado={proyectoSeleccionado}
          setProyectoSeleccionado={setProyectoSeleccionado}
          proyectos={datosBD.proyectos}
          alActualizarDatos={cargarDatos}
        />

        {/* El calendario ahora ocupa el mismo ancho que los de arriba */}
        <Calendario
          selectedDate={fechaSeleccionada}
          setSelectedDate={setFechaSeleccionada}
        />

        <SelectorHoras15min horas={horas} setHoras={setHoras} />

        <div className="flex flex-col items-center mt-4 space-y-3">
          <button
            onClick={guardarHoras}
            className="w-full sm:w-auto rounded-lg bg-[#fdc436] px-12 py-3 text-white font-bold hover:bg-[#e4201e] transition-all shadow-md active:scale-95"
          >
            Guardar horas
          </button>

          {mensajeConfirmacion && (
            <p className="text-red-500 font-bold text-center bg-white/80 p-3 rounded-lg border border-red-200 w-full animate-pulse">
              {mensajeConfirmacion}
            </p>
          )}
        </div>

        <Exportacion horasRegistradas={horasRegistradas} />
      </div>
    </div>
  );
};