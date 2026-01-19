  import {Header} from '../components/Header'
  import {Footer} from '../components/Footer'
  import SeleccionarEmpleado from '../components/SeleccionEmpleado'
  import SeleccionProyecto from '../components/SeleccionProyecto'
  import Exportacion from '../components/Exportación'
  import Calendario from '../components/Calendario'
  
export const IntroHoras = () => {
  return (
    <div className="bg-[#fdc436] min-h-screen">
      {/* CONTENEDOR PARA LAS TARJETAS ANTERIORES */}
      <div className="bg-white/50 p-6 rounded-xl shadow-lg w-full sm:max-w-4xl sm:mx-auto">
         <div className="text-black text-center font-bold">Introducir horas</div>
        <SeleccionarEmpleado />
        <SeleccionProyecto />
        <Calendario />
        <Exportacion />
        <p className="p-4 text-gray-700"></p>
      </div>
    </div>
  );
}