//MUESTRA LA PARTE SUPERIOR DE LA PANTALLA CON EL LOGO Y LA DESCRIPCIÓN DE LA INFORMACIÓN DE LA PÁGINA
export const Header = () => {
  return (
    <header className="bg-[#fdc436] border-gray-500 p-4">
      <div className="flex flex-col items-center gap-4">
        {/* USAMOS LA RUTA ABSOLUTA AL SERVIDOR PARA QUE ENCUENTRE EL ELEMENTO SIEMPRE */}
        <img 
          src="https://registromono.monognomo.com/assets/logo.png" 
          alt="logo" 
          className="w-80 h-32 object-contain drop-shadow-xl hover:scale-130 transition-transform duration-300"
        />
       {/*TÍTULO DE LA APP*/}
        <h1 className="text-xl text-black text-center drop-shadow-xl">
          Registro de horas y eventos
        </h1>
      </div>
    </header>
  );
};

