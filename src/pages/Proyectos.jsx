import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import TodosLosProyectos from '../components/TodosLosProyectos'
import { companies } from "../data/Empresas";

export default function Proyectos() {
  return (
    // Quitamos el padding lateral solo en móvil (p-0) y lo restauramos en sm (sm:p-4)
    <div className="bg-[#fdc436] min-h-screen p-0 sm:p-4 items-center">
      
      {/* CONTENEDOR PRINCIPAL:
          - En móvil (por defecto): Sin fondo, sin bordes, sin sombras, ancho total.
          - En sm+: Restauramos EXACTAMENTE tus clases originales.
      */}
      <div className="w-full space-y-6 bg-transparent sm:bg-white/50 sm:p-6 sm:rounded-xl sm:shadow-lg sm:max-w-4xl sm:mx-auto">
        
        <TodosLosProyectos companiesData={companies} />
        
      </div>

      {/* Este párrafo se mantiene igual, pero podrías querer ocultarlo en móvil si estorba */}
      <p className="hidden sm:block p-4 text-gray-700"></p>
    </div>
  )
}