import { useState, useEffect } from "react";
import { Footer } from '../components/Footer'
import TodosLosProyectos from '../components/TodosLosProyectos'

export default function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = () => {
    fetch("https://registromono.monognomo.com/api.php?action=get_initial_data")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.proyectos) {
          setProyectos(data.proyectos);
        }
      })
      .catch(err => console.error("Error cargando proyectos:", err))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="bg-[#fdc436] min-h-screen p-0 sm:p-4">
      <div className="w-full space-y-6 bg-transparent sm:bg-white/50 sm:p-6 sm:rounded-xl sm:shadow-lg sm:max-w-4xl sm:mx-auto">
        
        {cargando ? (
          <div className="text-center p-10 font-black uppercase text-xs tracking-widest animate-pulse">
            Cargando proyectos... 🐒
          </div>
        ) : (
          /* PASAMOS 'proyectos' como 'projects' */
          <TodosLosProyectos 
            projects={proyectos} 
            alActualizar={cargarDatos} 
          />
        )}
        
      </div>
      <Footer />
    </div>
  )
}