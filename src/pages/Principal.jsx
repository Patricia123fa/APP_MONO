import { Header } from "../components/Header"
import SeleccionEmpleado from "../components/SeleccionEmpleado"
import SeleccionProyecto from "../components/SeleccionProyecto"
import Calendario from "../components/Calendario"
import SelectorHoras from "../components/SelectorHoras"
import ExportarDatos from "../components/Exportación"
import { Footer } from "../components/Footer"
import Tabs from "../components/Tabs" // asegurarse de que export default Tabs
import { IntroHoras } from "./IntroHoras"
import { Proyectos } from "./Proyectos"
import { Gestionar } from "./Gestionar"
import { Division } from "./Division"

export const Principal = () => {

  // Definimos las pestañas
  const tabsData = [
    { label: "Registro y resumen", content: <IntroHoras /> },
    { label: "Ver todos los proyectos", content: <Proyectos /> },
    { label: "Gestionar proyectos", content: <Gestionar /> },
    { label: "División de trabajo", content: <Division /> },
   
  ]

  return (
    <div className="bg-[#fdc436] min-h-screen p-8">
      <Header />
      <Tabs tabs={tabsData} />
      <Footer />
    </div>
  )
}