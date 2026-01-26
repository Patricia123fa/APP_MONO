import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import ProyectosPorMes from "../components/ProyectosPorMes";
// Borramos el import de companies porque ahora ProyectosPorMes lee de la base de datos

export const Gestionar = () => {
  return (
    <div className="bg-[#fdc436] min-h-screen p-4 flex justify-center">
      {/* CONTENEDOR PRINCIPAL CENTRADO */}
      <div className="bg-white/50 p-6 rounded-xl shadow-lg w-full sm:max-w-4xl sm:mx-auto space-y-6">
        <div className="text-black text-center font-bold text-xl uppercase tracking-tight">
          Gestionar proyectos por meses
        </div>
       

        {/* Quitamos companiesData={companies} porque el componente ahora es independiente */}
        <ProyectosPorMes />
      </div>
    </div>
  );
};
