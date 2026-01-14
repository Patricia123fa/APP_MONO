import { jsPDF } from "jspdf";
import { empleados } from "../data/Trabajadores";
import { companies } from "../data/Empresas";

export default function ExportarDatos() {
  // Unir datos de ejemplo: empleado + empresa + proyecto
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

  return (
    <div className="max-w-md mx-auto mt-6 p-4 bg-white rounded-lg shadow-md text-center">
      <h2 className="font-semibold mb-2">Exportar datos</h2>
      <div className="flex gap-4 justify-center">
        <button onClick={exportCSV} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Exportar CSV
        </button>
        <button onClick={exportPDF} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Exportar PDF
        </button>
      </div>
    </div>
  );
}
