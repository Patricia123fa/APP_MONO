import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Calendario({ label = "Seleccionar fecha", onChange }) {
  const [startDate, setStartDate] = useState(null);
  const [weekOfYear, setWeekOfYear] = useState(null);

  // Función para calcular la semana del año (ISO 8601)
  const getWeekOfYear = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // Domingo = 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  const handleChange = (date) => {
    setStartDate(date);
    const week = getWeekOfYear(date);
    setWeekOfYear(week);
    onChange?.({ date, weekOfYear: week });
  };

  return (
    <div className="flex flex-col items-start">
      <DatePicker
        selected={startDate}
        onChange={handleChange}
        customInput={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
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
