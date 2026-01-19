import Exportacion from '../components/Exportación';
import { ejemploEventos } from "../data/EjemploEventos";
import { empleados } from "../data/Trabajadores";
import { useState, useMemo } from "react";

const Division = () => {
  const [filtroEmpleado, setFiltroEmpleado] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [aplicarFiltro, setAplicarFiltro] = useState(false);
  const [eventos, setEventos] = useState(ejemploEventos);
  const [expandido, setExpandido] = useState({}); 

  // FILTRAR EVENTOS
  const eventosFiltrados = useMemo(() => {
    if (!aplicarFiltro) return eventos;
    return eventos.filter((e) => {
      let matchEmpleado = true;
      if (filtroEmpleado) {
        const emp = empleados.find(emp => emp.id === filtroEmpleado);
        matchEmpleado = emp ? e.equipoMontaje.includes(emp.name) : false;
      }
      const matchMes = filtroMes ? e.fechaMontaje.slice(0, 7) === filtroMes : true;
      return matchEmpleado && matchMes;
    });
  }, [filtroEmpleado, filtroMes, aplicarFiltro, eventos]);

  // FUNCIONES DE EDITAR/BORRAR
  const borrarEvento = (id) => {
    setEventos(prev => prev.filter(e => e.id !== id));
  };

  const toggleExpandido = (id) => {
    setExpandido(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-[#fdc436] min-h-screen py-8">
      <div className="bg-white/50 p-6 rounded-xl shadow-lg w-full sm:max-w-4xl sm:mx-auto space-y-6">

        <div className="text-center font-bold text-xl text-black">
          División de trabajo
        </div>

        {/* FILTROS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            value={filtroEmpleado}
            onChange={(e) => setFiltroEmpleado(e.target.value)}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#e4201e] h-12"
          >
            <option value="">Todos los empleados</option>
            {empleados.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>

          <input
            type="month"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#e4201e] h-12"
          />
        </div>

        <div className="flex justify-center gap-4 mt-2">
          <button
            onClick={() => setAplicarFiltro(true)}
            className="rounded-lg bg-[#fdc436] px-6 py-2 text-white font-bold hover:bg-[#e4201e]"
          >
            Filtrar
          </button>
          <button
            onClick={() => {
              setFiltroEmpleado("");
              setFiltroMes("");
              setAplicarFiltro(false);
            }}
            className="rounded-lg bg-gray-400 px-6 py-2 text-white font-bold hover:bg-gray-600"
          >
            Limpiar filtros
          </button>
        </div>

        {/* LISTA DE EVENTOS QUE SE EXPANDE*/}
        <div className="space-y-2 mt-4">
          {eventosFiltrados.map(evento => {
            const abierto = expandido[evento.id] || false;
            return (
              <div key={evento.id} className="rounded-lg shadow-sm bg-white">
                
                {/* HEADER CUANDO ESTÁ COMPRIMIDO */}
                <div
                  className="flex rounded -lg justify-between items-center p-4 cursor-pointer bg-gray-100 hover:bg-gray-200"
                  onClick={() => toggleExpandido(evento.id)}
                >
                  <span className="font-bold">{evento.nombre}</span>
                  <span>{abierto ? "▲" : "▼"}</span>
                </div>

                {/* HEADER CUANDO ESTÁ EXPANDIDO*/}
                {abierto && (
                  <div className="p-4 space-y-2">
                    <p>Fecha registro: {evento.fechaRegistro}</p>
                    <p>Lugar: {evento.lugar}</p>
                    <p>Coordinador proyecto: {evento.coordinadorProyecto}</p>
                    <p>Coordinador producción: {evento.coordinadorProduccion}</p>
                    <p>Equipo montaje: {evento.equipoMontaje.join(", ")}</p>
                    <p>Fecha montaje: {evento.fechaMontaje}</p>
                    <p>Vehículo montaje: {evento.vehiculoMontaje}</p>
                    <p>Fecha desmontaje: {evento.fechaDesmontaje}</p>
                    <p>Noches fuera: {evento.nochesFuera}</p>

                    {/*BOTONES EDITAR Y BORRAR*/}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => alert("Función de editar aún no implementada")}
                        className="bg-blue-500 px-4 py-1 rounded text-white hover:bg-blue-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => borrarEvento(evento.id)}
                        className="bg-red-500 px-4 py-1 rounded text-white hover:bg-red-600"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>

        {/* EXPORTACIÓN (HAY QUE MODIFICAR ESTA EXPORTACIÓN) */}
        <Exportacion eventos={eventosFiltrados} />

      </div>
    </div>
  );
};

export default Division;




