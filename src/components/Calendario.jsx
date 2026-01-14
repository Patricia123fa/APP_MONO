import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Calendario({ label = "Seleccionar fecha", onChange }) {
  const [startDate, setStartDate] = useState(null);
  const [weekOfYear, setWeekOfYear] = useState(null);

  //FUNCION CON LA CUAL CALCULAMOS LA SEMANA DEL AÑO SIN SELECCIONARLA DIRECTAMENTE

  const getWeekOfYear = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; 
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };
  //GESTIONAMOS EL CAMBIO
  const handleChange = (date) => {
    setStartDate(date);
    const week = getWeekOfYear(date);
    setWeekOfYear(week);
    onChange?.({ date, weekOfYear: week });
  };
  // LA INFORMACIÓN QUE DEVOLVEMOS, QUE ES LA FECHA Y EL NUMERO DE LA SEMANA QUE CORRESPONDE
  return (
    <div className="flex flex-col items-start">
      <DatePicker
        selected={startDate}
        onChange={handleChange}
        customInput={
          <button className="flex items-center gap-2 px-4 py-2 bg-[#fdc436] text-white rounded-lg hover:bg-[#e4201e] transition">
            📅 {startDate ? startDate.toLocaleDateString() : label}
          </button>
        }
        calendarClassName="shadow-lg rounded-lg p-2"
        popperPlacement="bottom-start"
      />

      {startDate && (
        <p className="mt-2 text-gray-700">
          Fecha seleccionada: <strong>{startDate.toLocaleDateString()}</strong> <br />
          Semana del año: <strong>{weekOfYear}</strong>
        </p>
      )}
    </div>
  );
}
