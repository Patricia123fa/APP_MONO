//IMÁGENES DE PLÁTANOS PARA EL FONDO
export const Footer = () => {
  const platanos = [
    // Usamos la ruta directa al servidor "/assets/monologo.png"
    { src: "/assets/monologo.png", alt: "plátano 1", size: "w-10 sm:w-5 md:w-28" },
    { src: "/assets/monologo.png", alt: "plátano 2", size: "w-24 sm:w-28 md:w-15" },
    { src: "/assets/monologo.png", alt: "plátano 3", size: "w-28 sm:w-32 md:w-36" },
    { src: "/assets/monologo.png", alt: "plátano 4", size: "w-10 sm:w-5 md:w-28" },
    { src: "/assets/monologo.png", alt: "plátano 5", size: "w-24 sm:w-28 md:w-15" },
  ]

  return (
    //CONTENEDOR DEL FOOTER 
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-wrap justify-center gap-4 md:grid md:grid-cols-5 md:gap-6">
        {/*RECORRE LA LISTA DE PLÁTANOS Y NOS LOS MUESTRA*/}
        {platanos.map((pl, idx) => (
          <img
            key={idx}
            src={pl.src} // Ahora src ya trae el texto "/assets/monologo.png"
            alt={pl.alt}
            className={`${pl.size} object-contain drop-shadow-xl hover:scale-110 transition-transform duration-300`}
          />
        ))}
      </div>
    </div>
  )
}

