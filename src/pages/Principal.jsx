import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import Tabs from "../components/Tabs"
import { IntroHoras } from "./IntroHoras"
import  Proyectos  from "./Proyectos"
import { Gestionar } from "./Gestionar"
import Division  from "./Division"
import Calendar from "./Calendar"

export const Principal = () => {

  // DEFINIMOS CON QUÉ ENLAZA CADA PESTAÑA
  const tabsData = [
    { label: "Registro", content: <IntroHoras /> },
    { label: "Ver proyectos", content: <Proyectos /> },
    { label: "Gestionar proyectos", content: <Gestionar /> },
    { label: "División de trabajo", content: <Division /> },
    { label: "Calendario", content: <Calendar /> },
   
  ]

  return (
    <div className="bg-[#fdc436] min-h-screen p-8">
      <Header />
      <Tabs tabs={tabsData} />
      <Footer />
    </div>
  )
}
