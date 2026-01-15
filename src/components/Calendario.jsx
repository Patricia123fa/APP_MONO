import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Calendario({ label = "Seleccionar fecha", onChange }) {
  const [startDate, setStartDate] = useState(null);
  const [weekOfYear, setWeekOfYear] = useState(null);

  // FUNCION PARA CALCULAR LA SEMANA DEL AÑO
  const getWeekOfYear = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; 
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  // GESTIONAMOS EL CAMBIO
  const handleChange = (date) => {
    setStartDate(date);
    const week = getWeekOfYear(date);
    setWeekOfYear(week);
    onChange?.({ date, weekOfYear: week });
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Contenedor pequeño para el calendario */}
      <div className="flex flex-col items-center bg-white/50 p-4 rounded-lg shadow-md w-full max-w-xs">
        <DatePicker
          selected={startDate}
          onChange={handleChange}
          customInput={
            <button className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#fdc436] text-white font-semibold rounded-lg hover:bg-[#e4201e] transition">
              📅 {startDate ? startDate.toLocaleDateString() : label}
            </button>
          }
          calendarClassName="shadow-lg rounded-lg p-2"
          popperPlacement="bottom-start"
        />

        {startDate && (
          <p className="mt-3 text-center text-gray-700 text-sm">
            Fecha: <strong>{startDate.toLocaleDateString()}</strong> <br />
            Semana: <strong>{weekOfYear}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
