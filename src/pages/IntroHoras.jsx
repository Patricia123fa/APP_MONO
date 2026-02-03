import { useState, useEffect, useMemo } from "react";
import SeleccionarEmpleado from "../components/SeleccionEmpleado";
import SeleccionProyecto from "../components/SeleccionProyecto";
import Exportacion from "../components/Exportación";
import Calendario from "../components/Calendario";
import SelectorHoras15min from "../components/SelectorHoras";
import { Footer } from "../components/Footer";

//SE ESTABLECE EL ORDEN DE PRIORIDAD DE LAS EMPRESAS
const ORDEN_PRIORIDAD = [
  "Monognomo", 
  "Neozink", 
  "Yurmuvi", 
  "Picofino", 
  "Guardianes", 
  "Escuela Energía", 
  "Castrillo2", 
  "General"
];
const sortEmpresas = (a, b) => {
  let idxA = ORDEN_PRIORIDAD.indexOf(a);
  let idxB = ORDEN_PRIORIDAD.indexOf(b);
  if (idxA === -1) idxA = 99;
  if (idxB === -1) idxB = 99;
  return idxA - idxB || a.localeCompare(b);
};

export const IntroHoras = () => {
  const [datosBD, setDatosBD] = useState({ trabajadores: [], proyectos: [] });
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [horas, setHoras] = useState(0);
  const [mostrarModal, setMostrarModal] = useState(false); 
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState("");
  const [horasRegistradas, setHorasRegistradas] = useState([]);

  // --- NUEVO ESTADO: Controlar modo Diario vs Mensual ---
  const [modoEntrada, setModoEntrada] = useState("diario"); 

  //LLAMADA A LA FUNCIÓN GET_INITIAL_DATA DE NUESTRO API.PHP
  const cargarDatos = () => {
    fetch("https://registromono.monognomo.com/api.php?action=get_initial_data")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDatosBD({ trabajadores: data.trabajadores, proyectos: data.proyectos });
        }
      });
  };

  useEffect(() => { cargarDatos(); }, []);

  const empresasDisponibles = useMemo(() => {
    const unicas = [...new Set(datosBD.proyectos.map((p) => p.company || "Otros"))];
    return unicas.sort(sortEmpresas);
  }, [datosBD.proyectos]);

  const mesFiltro = useMemo(() => {
    if (!fechaSeleccionada) return "";
    const d = new Date(fechaSeleccionada);
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }, [fechaSeleccionada]);

  // FUNCIÓN PARA REGISTRAR EN LA TABLA ENTRADAS DE LA BD
  const guardarHoras = () => {
    if (!empleadoSeleccionado || !proyectoSeleccionado || horas <= 0) {
      alert("⚠️ Selecciona las horas antes de guardar.");
      return;
    }

    // --- MODIFICACIÓN AQUÍ: Gestionar fecha mensual ---
    let fechaFinal = new Date(fechaSeleccionada);
    if (modoEntrada === "mensual") {
        // Si es mensual, forzamos el día 1 del mes para que cuente como registro mensual
        fechaFinal.setDate(1);
    }
    const fechaFormateada = fechaFinal.toLocaleDateString("en-CA");
    // --------------------------------------------------

    const datosEnvio = {
      worker_id: empleadoSeleccionado.id,
      project_id: proyectoSeleccionado.id,
      hours: horas,
      date_work: fechaFormateada,
    };

    fetch("https://registromono.monognomo.com/api.php?action=add_entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosEnvio),
    })
      .then((res) => res.json())
      .then((resp) => {
        if (resp.success) {
          // Ajustamos el mensaje según el modo
          const tipoTexto = modoEntrada === "mensual" ? "(Mensual)" : "";
          setMensajeConfirmacion(`Has guardado ${horas} horas ${tipoTexto} en ${proyectoSeleccionado.name}`);
          
          setHorasRegistradas([
            {
              empleado: empleadoSeleccionado.name,
              proyecto: proyectoSeleccionado.name,
              fecha: fechaFormateada,
              horas: horas,
            },
            ...horasRegistradas,
          ]);
        
          setHoras(0);
          setProyectoSeleccionado(null);
          setMostrarModal(false);
          setModoEntrada("diario"); // Reseteamos al cerrar
          setTimeout(() => setMensajeConfirmacion(""), 5000);
        }
      });
  };

  return (
    <div className="bg-[#fdc436] min-h-screen p-0 sm:p-4 flex justify-center text-left font-sans">
      <div className="w-full space-y-6 bg-transparent sm:bg-white/50 sm:p-6 sm:rounded-xl sm:shadow-lg sm:max-w-4xl sm:mx-auto">
        
        <h1 className="text-gray-700 text-center mb-6 font-bold text-xl uppercase tracking-tight">
          Introducir horas
        </h1>

        <SeleccionarEmpleado
          empleadoSeleccionado={empleadoSeleccionado}
          setEmpleadoSeleccionado={setEmpleadoSeleccionado}
          empleados={datosBD.trabajadores}
        />

        {empleadoSeleccionado && (
          <div className="mx-auto w-full max-w-4xl rounded-xl bg-white/70 p-4 shadow">
            <label className="block mb-2 font-semibold text-gray-700 uppercase text-[10px] tracking-wider">
              Selecciona Empresa
            </label>
            <select
              value={empresaSeleccionada}
              onChange={(e) => {
                setEmpresaSeleccionada(e.target.value);
                setProyectoSeleccionado(null);
              }}
              className="w-full p-3 border-none rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-black outline-none text-sm font-bold"
            >
              <option value="">-- Selecciona Empresa --</option>
              {empresasDisponibles.map((emp) => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </div>
        )}

        {empresaSeleccionada && (
          <div className="space-y-6 animate-in fade-in">
            <Calendario
              selectedDate={fechaSeleccionada}
              setSelectedDate={(date) => {
                setFechaSeleccionada(date);
                setProyectoSeleccionado(null);
              }}
            />
            <SeleccionProyecto
              proyectoSeleccionado={proyectoSeleccionado}
              setProyectoSeleccionado={(p) => {
                setProyectoSeleccionado(p);
                if (p) {
                    setModoEntrada("diario"); // Reseteamos modo al abrir
                    setMostrarModal(true);
                } 
              }}
              proyectos={datosBD.proyectos}
              empresaPadre={empresaSeleccionada}
              fechaPadre={mesFiltro}
              alActualizarDatos={cargarDatos}
            />
          </div>
        )}

        {/* --- MODAL DE RESUMEN Y REGISTRO --- */}
        {mostrarModal && proyectoSeleccionado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6 border-t-8 border-[#fdc436]">
              <div className="text-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Has seleccionado:</span>
                <h3 className="text-xl font-black text-black uppercase mt-2 tracking-tight">
                  {proyectoSeleccionado.name}
                </h3>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Monognomo</span>
                  <span className="text-xs font-black text-black">{empleadoSeleccionado.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">
                      {modoEntrada === "mensual" ? "Mes" : "Fecha"}
                  </span>
                  <span className="text-xs font-black text-black">
                      {modoEntrada === "mensual" 
                        ? new Date(fechaSeleccionada).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()
                        : new Date(fechaSeleccionada).toLocaleDateString()
                      }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Empresa</span>
                  <span className="text-xs font-black text-black">{empresaSeleccionada}</span>
                </div>
              </div>

              {/* --- NUEVO: SELECTOR DE MODO --- */}
              <div className="flex bg-gray-100 p-1.5 rounded-xl">
                 <button 
                    onClick={() => setModoEntrada("diario")}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${modoEntrada === "diario" ? "bg-white shadow text-black" : "text-gray-400 hover:text-gray-600"}`}
                 >
                    Día
                 </button>
                 <button 
                    onClick={() => setModoEntrada("mensual")}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${modoEntrada === "mensual" ? "bg-white shadow text-black" : "text-gray-400 hover:text-gray-600"}`}
                 >
                    Mes Entero
                 </button>
              </div>
              {/* ------------------------------- */}

              <div className="space-y-4">
                <p className="text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    {modoEntrada === "mensual" ? "Total horas del mes" : "Introduce tus horas"}
                </p>
                <SelectorHoras15min horas={horas} setHoras={setHoras} />
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={guardarHoras}
                  disabled={horas <= 0}
                  className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all border-4 
                    ${horas > 0 
                      ? "bg-black text-white border-black hover:bg-white hover:text-black" 
                      : "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"}`}
                >
                  {modoEntrada === "mensual" ? "Registrar Mes 📅" : "Registrar 🐵"}
                </button>
                <button 
                  onClick={() => { setMostrarModal(false); setProyectoSeleccionado(null); }} 
                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest py-2 hover:text-black transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {mensajeConfirmacion && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in slide-in-from-bottom-5">
            <div className="bg-black text-[#fdc436] p-4 rounded-2xl shadow-2xl border-2 border-[#fdc436] text-center">
              <p className="text-[10px] font-black uppercase tracking-widest">{mensajeConfirmacion}</p>
            </div>
          </div>
        )}
        </div>
    </div>
  );
};