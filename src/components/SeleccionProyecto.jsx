import { useState } from "react";
import companiesData from "../data/Empresas";

export default function SeleccionarProyectoModal() {
  const [companies, setCompanies] = useState(companiesData);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState("");

  // MODAL
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [inputValue, setInputValue] = useState("");

  const empresa = companies.find(
    (c) => c.id === parseInt(empresaSeleccionada)
  );
  const proyectos = empresa ? empresa.projects : [];

  const handleAdd = () => {
    if (!inputValue.trim()) return;

    if (modalType === "empresa") {
      const nueva = {
        id: Date.now(),
        name: inputValue,
        location: "",
        industry: "",
        projects: [],
      };
      setCompanies([...companies, nueva]);
    } else if (modalType === "proyecto") {
      if (!empresaSeleccionada) return;
      setCompanies(
        companies.map((c) =>
          c.id === parseInt(empresaSeleccionada)
            ? {
                ...c,
                projects: [
                  ...c.projects,
                  { id: Date.now(), name: inputValue, status: "Planeado" },
                ],
              }
            : c
        )
      );
    }

    setInputValue("");
    setShowModal(false);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white/60 rounded-lg shadow-md">
      {/* SELECCIÓN DE EMPRESA */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold text-gray-700">
          Selecciona una empresa:
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            value={empresaSeleccionada}
            onChange={(e) => {
              setEmpresaSeleccionada(e.target.value);
              setProyectoSeleccionado("");
            }}
            className="w-full sm:flex-1 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#e4201e] h-12"
          >
            <option value="">-- Selecciona --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setModalType("empresa");
              setShowModal(true);
            }}
            className="w-full sm:w-auto h-12 px-4 bg-gray-600 text-white rounded hover:bg-[#e4201e]"
          >
            Añadir
          </button>
        </div>
      </div>

      {/* SELECCIÓN DE PROYECTO */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold text-gray-700">
          Selecciona un proyecto:
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            value={proyectoSeleccionado}
            onChange={(e) => setProyectoSeleccionado(e.target.value)}
            disabled={!empresa}
            className="w-full sm:flex-1 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#e4201e] h-12"
          >
            <option value="">-- Selecciona --</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>
          {empresaSeleccionada && (
            <button
              onClick={() => {
                setModalType("proyecto");
                setShowModal(true);
              }}
              className="w-full sm:w-auto h-12 px-4 bg-gray-600 text-white rounded hover:bg-[#e4201e]"
            >
              Añadir
            </button>
          )}
        </div>
      </div>

      {/* INFO SELECCIONADA */}
      {empresaSeleccionada && proyectoSeleccionado && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p>
            <span className="font-semibold">Empresa:</span> {empresa.name}
          </p>
          <p>
            <span className="font-semibold">Proyecto:</span> {proyectoSeleccionado}
          </p>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              {modalType === "empresa"
                ? "Añadir nueva empresa"
                : "Añadir nuevo proyecto"}
            </h2>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder={
                modalType === "empresa"
                  ? "Nombre de la empresa"
                  : "Nombre del proyecto"
              }
            />
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded border hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

