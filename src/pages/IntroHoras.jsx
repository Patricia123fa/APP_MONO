  import {Header} from '../components/Header'
  import {Footer} from '../components/Footer'
  import SeleccionarEmpleado from '../components/SeleccionEmpleado'
  import SeleccionProyecto from '../components/SeleccionProyecto'
  import Exportacion from '../components/Exportación'
  import Calendario from '../components/Calendario'
  
  export const IntroHoras =() => {
  return ( 
    <div className="bg-[#fdc436] min-h-screen">
      <SeleccionarEmpleado/>
      <SeleccionProyecto />
      <Calendario />
      <Exportacion />
      <p className="p-4 text-gray-700"></p>
    </div>
  )
  }