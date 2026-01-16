import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Calendario({ label = "Seleccionar fecha", onChange }) {
  //GUARDA LA FECHA Y LA SEMANA CORRESPONDIENTE QUE SELECCIONA EL USUARIO.
  const [startDate, setStartDate] = useState(null);
  const [weekOfYear, setWeekOfYear] = useState(null);

  // FUNCION PARA CALCULAR LA SEMANA DEL AÑO
  const getWeekOfYear = (date) => {
  //SE CREA UNA NUEVA FECHA EN UTC PARA EVITAR ERRORES.
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  //OBTENE EL DIA DE LA SEMANA Y LO AJUSTA
    const dayNum = d.getUTCDay() || 7; 
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  //OBTIENE EL 1 DE ENERO CORRESPONDIENTE AL AÑO
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  //CALCULA LOS DIAS QUE HAN PASADO Y LOS CONVIERTE A SEMANAS
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  //DEVUELVE EL NÚMERO DE LA SEMANA.
    return weekNo;
  };

  // GESTIONAMOS EL CAMBIO CUANDO EL USUARIO SELECCIONA.
  const handleChange = (date) => {
  //SE GUARDA LA FECHA
    setStartDate(date);
  // SE LLAMA A LA ANTERIOR FUNCIÓN PARA CALCULAR LA SEMANA Y SE GUARDA
    const week = getWeekOfYear(date);
    setWeekOfYear(week);
  //SE CAMBIAN LAS FECHAS Y SEMANAS EN FUNCIÓN DEL CLICK.
    onChange?.({ date, weekOfYear: week });
  };

  //CONTENEDOR DEL CALENDARIO
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center bg-white/50 p-4 rounded-lg shadow-md w-full max-w-md mx-auto">
        <DatePicker
        //FUNCIÓN QUE SE EJECUTA AL SELECCIONAR UNA FECHA
          selected={startDate}
          onChange={handleChange}
          customInput={
        //BOTÓN PERSONALIZADO
            <button className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#fdc436] text-white font-semibold rounded-lg hover:bg-[#e4201e] transition">
              {startDate ? startDate.toLocaleDateString() : label}
            </button>
          }
          calendarClassName="shadow-lg rounded-lg p-2"
        //COLOCA EL CALENDARIO DEBAJO DEL BOTÓN
          popperPlacement="bottom-start"
        />
      
        {startDate && (
          //NOS MUESTRA LA FECHA SELECCIONADA Y LA SEMANA DEL AÑO CORRESPONDIENTE.
          <p className="mt-3 text-center text-gray-700 text-sm">
            Fecha: <strong>{startDate.toLocaleDateString()}</strong> <br />
            Semana: <strong>{weekOfYear}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
