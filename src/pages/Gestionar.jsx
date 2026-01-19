import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import ProyectosPorMes from "../components/ProyectosPorMes";
import companies from "../data/Empresas";

export const Gestionar = () => {
  return (
    <div className="bg-[#fdc436] min-h-screen p-4 sm:p-8">
      {/* CONTENEDOR PRINCIPAL CENTRADO */}
       <div className="bg-white/50 p-6 rounded-xl shadow-lg w-full sm:max-w-4xl sm:mx-auto">
        <div className="text-black text-center font-bold">Gestionar proyectos por meses</div>
          <div className="text-black p-6 text-center">Aquí puedes modificar los meses asociados</div>
        <ProyectosPorMes companiesData={companies} />
      </div>
    </div>
  );
};
