import { jsPDF } from "jspdf";
import { empleados } from "../data/Trabajadores";
import { companies } from "../data/Empresas";

export default function ExportarDatos() {
//DATOS POR EMPRESA Y COMPAÑÍA (PRUEBA SIN BASE DE DATOS, NECESITAMOS LA BASE DE DATOS)
  const datos = [];

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
    if (datos.length === 0) return;
    const headers = Object.keys(datos[0]).join(",");
    const rows = datos.map(row => Object.values(row).join(",")).join("\n");
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "datos.csv");
    link.click();
  };
  // EXPORTAMOS EL PDF DE EMPRESAS Y EMPLEADOS
  const exportPDF = () => {
    if (datos.length === 0) return;
    const doc = new jsPDF();
    let y = 10;
    const headers = Object.keys(datos[0]);
    doc.setFontSize(12);
    doc.text(headers.join(" | "), 10, y);
    y += 8;

    datos.forEach(row => {
      const values = Object.values(row).map(String);
      doc.text(values.join(" | "), 10, y);
      y += 8;
      if (y > 280) { 
        doc.addPage();
        y = 10;
      }
    });

    doc.save("datos.pdf");
  };
  //LOS BOTONES DE EXPORTACIÓN QUE ES LO QUE MOSTRAMOS AL USUARIO DE LA APP
  return (
    <div className="max-w-md mx-auto mt-6 p-4 bg-white rounded-lg shadow-md text-center">
      <h2 className="font-semibold mb-2">Exportar datos</h2>
      <div className="flex gap-4 justify-center">
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
