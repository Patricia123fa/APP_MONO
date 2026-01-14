import { useState } from "react";

export default function Tabs({ tabs }) {
  const [active, setActive] = useState(0); // pestaña activa
  return (
    <div className="w-full">
      {/* Menú de tabs */}
      <div className="flex bg-gray-200 rounded-full p-1 mb-4">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActive(index)}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors
              ${active === index ? "bg-white text-black shadow" : "text-gray-600 hover:bg-white/50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="bg-white rounded-lg p-4 shadow">
        {tabs[active].content}
      </div>
    </div>
  );
}