import { useState } from "react";

export default function Tabs({ tabs }) {
  //INDICA QUÉ PESTAÑA ESTÁ ACTIVA
  const [active, setActive] = useState(0);

  return (
    <div className="w-full">
      {/* MENÚ DE OPCIONES */}
      <div className="flex bg-white/50 rounded-lg mb-4">
      {/* PARA CADA PESTAÑA OBTENEMOS EL OBJETO Y EL ÍNDICE */}
        {tabs.map((tab, index) => (
          <button
            key={index}
            //BOTÓN POR CADA PESTAÑA QUE CAMBIA AL HACER CLICK
            onClick={() => setActive(index)}
            //SI LA PESTAÑA ESTÁ ACTIVA SE VE DE UNA FORMA Y SI ESTÁ INACTIVA OTRA
            className={`
              flex-1 text-center py-2 text-sm font-medium transition-colors rounded-lg
              ${active === index ? "bg-white rounded-lg text-black shadow" : "text-gray-600 hover:bg-white/50"}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
{/*//EL CONTENIDO DE LA PESTAÑA QUE SE ENCUENTRA ACTIVA*/}
      <div>
        {tabs[active].content}
      </div>
    </div>
  );
}
