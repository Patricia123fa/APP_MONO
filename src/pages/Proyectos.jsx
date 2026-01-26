import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import TodosLosProyectos from '../components/TodosLosProyectos'
import { companies } from "../data/Empresas";

export default function Proyectos() {
  return ( 
     <div className="bg-[#fdc436] min-h-screen p-4 flex justify-center">
      {/* CONTENEDOR PRINCIPAL CENTRADO */}
      <div className="bg-white/50 p-6 rounded-xl shadow-lg w-full sm:max-w-4xl sm:mx-auto space-y-6">
    
          <TodosLosProyectos companiesData={companies} />
        </div>
      <p className="p-4 text-gray-700"></p>
    </div>
  )
}