import { useState } from "react";

export default function Tabs({ tabs }) {
  const [active, setActive] = useState(0);

  return (
    <div className="w-full">
      {/* MENÚ DE OPCIONES */}
      <div className="flex bg-white/50 rounded-lg mb-4">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActive(index)}
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
