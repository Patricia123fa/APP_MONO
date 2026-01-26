import ProyectosPorMes from "../components/ProyectosPorMes";

export const Gestionar = () => {
  return (
    <div className="bg-[#fdc436] min-h-screen p-0 sm:p-4 flex justify-center">
      {/* CONTENEDOR PRINCIPAL ADAPTADO PARA QUE EL CONTENEDOR NO SALGA EN MÓVILES Y OCUPE MÁS ANCHO*/}
      <div className="w-full space-y-6 bg-transparent sm:bg-white/50 sm:p-6 sm:rounded-xl sm:shadow-lg sm:max-w-4xl sm:mx-auto">
        <div className="text-gray-700 text-center font-bold text-xl uppercase tracking-tight">
          Gestionar proyectos por meses
        </div>
        <ProyectosPorMes />
      </div>
    </div>
  );
};
