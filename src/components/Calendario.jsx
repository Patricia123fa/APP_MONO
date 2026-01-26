import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

//DEFINIMOS EL COMPONENTE CALENDARIO
export default function Calendario({ label = "Seleccionar fecha", selectedDate, setSelectedDate }) {
  const [weekOfYear, setWeekOfYear] = useState(null);

  // FUNCION PARA CALCULAR LA SEMANA DEL AÑO
  const getWeekOfYear = (date) => {
    if (!date) return null;
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; 
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  // GESTIONAMOS EL CAMBIO
  const handleChange = (date) => {
    setSelectedDate(date);
    const week = getWeekOfYear(date);
    setWeekOfYear(week);
  };

  //CONTENEDOR VISUAL
  return (
    <div className="w-full rounded-xl bg-white/70 p-4 shadow text-center">
      <label className="block mb-2 font-semibold text-gray-700 uppercase text-[10px] tracking-wider">
        Fecha y Semana
      </label>
      <div className="w-full flex flex-col items-center">
        <DatePicker
          selected={selectedDate}
          onChange={handleChange}
          // FORMATO DE ESPAÑA
          dateFormat="dd/MM/yyyy"
          customInput={
            // BOTÓN CENTRADO
            <button className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#fdc436] text-white font-bold rounded-lg hover:bg-[#e4201e] transition-colors shadow-sm uppercase tracking-wider text-sm">
              {selectedDate ? selectedDate.toLocaleDateString() : label}
            </button>
          }
          calendarClassName="shadow-2xl rounded-lg border-none p-2"
          popperPlacement="bottom" 
          portalId="root-portal"
        />
      
    {/*MOSTRAR LA SEMANA Y FECHA SELECCIONADA*/}
        {selectedDate && (
          <div className="mt-3 text-center text-gray-700 text-sm animate-fade-in">
            <p className="font-medium text-gray-500 uppercase text-[10px] tracking-widest">Seleccionado</p>
            <p className="text-lg">
                Día: <strong className="text-black">{selectedDate.toLocaleDateString()}</strong> 
                <span className="mx-2 text-gray-300">|</span>
                Semana: <strong className="text-[#e4201e]">{weekOfYear || getWeekOfYear(selectedDate)}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}