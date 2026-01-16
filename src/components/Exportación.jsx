import { jsPDF } from "jspdf";
import { empleados } from "../data/Trabajadores";
import { companies } from "../data/Empresas";

export default function ExportarDatos() {
//DATOS POR EMPRESA Y COMPAÑÍA (PRUEBA SIN BASE DE DATOS, NECESITAMOS LA BASE DE DATOS PARA MODIFICAR ESTO)
//CREACIÓN DE LA LISTA O ARRAY DE DATOS.
  const datos = [];
  //AHORA HACEMOS QUE SE RECORRA POR CADA EMPLEADO, COMPAÑÍA Y PROYECTO, Y SE CREAN COMBINACIONES 
  empleados.forEach(emp => {
    companies.forEach(c => {
      c.projects.forEach(p => {
        datos.push({
          empleado: emp.name,
          empresa: c.name,
          proyecto: p.name
        });
      });
    });
  });

  // SE EXPORTAN LOS DATOS CRUZADOS DE EMPLEADOS Y EMPRESAS
  const exportCSV = () => {
    //SE COMPRUEBA QUE HAYA DATOS. SI NO HAY DATOS NO HACE NADA
    if (datos.length === 0) return;
    //LA CLAVE ES EMPLEADO Y SE CREAN LAS RELACIONES.
    const headers = Object.keys(datos[0]).join(",");
    //CREA FILAS 
    const rows = datos.map(row => Object.values(row).join(",")).join("\n");
    //SE UNE TODO EN EL CSV Y SE CREA EL ARCHIVO DESCARGABLE
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    //GENERA UNA URL TEMPORAL PARA VISUALIZAR EL ARCHIVO
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "datos.csv");
    link.click();
  };
  // FUNCIÓN PARA EXPORTAR EL PDF DE EMPRESAS Y EMPLEADOS
  const exportPDF = () => {
    //OTRA VEZ, SI NO HAY DATOS NO DEVUELVE NADA.
    if (datos.length === 0) return;
    //CREA EL DOCUMENTO PDF Y SUS CARACTERÍSTICAS
    const doc = new jsPDF();
    let y = 10;
    const headers = Object.keys(datos[0]);
    doc.setFontSize(12);
    doc.text(headers.join(" | "), 10, y);
    //GENERA ESPACIO DEBAJO
    y += 8;
    
    datos.forEach(row => {
      //POR CADA FILA DE LOS DATOS SE ESCRIBEN COMO TEXTO 
      const values = Object.values(row).map(String);
      doc.text(values.join(" | "), 10, y);
      y += 8;
      if (y > 280) { 
        //AÑADIR PÁGINA SI SUPERA LOS ELEMENTOS.
        doc.addPage();
        y = 10;
      }
    });
    //SE GUARDA EL PDF LLAMADO DATOS.
    doc.save("datos.pdf");
  };
  //LOS BOTONES DE EXPORTACIÓN QUE ES LO QUE MOSTRAMOS AL USUARIO DE LA APP
  return (
    <div className="max-w-md mx-auto p-4 bg-white/50 rounded-lg shadow-md text-center">
      <h2 className="font-semibold mb-2">Exportar datos</h2>
      <div className="flex gap-4 justify-center">
        {/*CADA BOTÓN LLAMA A LA FUNCION ANTERIOR QUE LE CORRESPONDE Y TIENE SUS CARACTERÍSTICAS*/}
        <button onClick={exportCSV} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-[#e4201e]">
          Exportar CSV
        </button>
        <button onClick={exportPDF} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-[#e4201e]">
          Exportar PDF
        </button>
      </div>
    </div>
  );
}
