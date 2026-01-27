import React, { useState } from "react"

export const Log = ({ setIsAuth }) => {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [recordar, setRecordar] = useState(false)
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando] = useState(false);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");

    try {
      // LE PREGUNTAMOS AL SERVIDOR (Aquí ya no hay contraseña a la vista)
      const resp = await fetch("https://registromono.monognomo.com/api.php?action=check_password", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pass: password })
      });
      
      const data = await resp.json();

      if (data.success) {
        if (recordar) localStorage.setItem("isAuth", "true");
        setIsAuth(true);
      } else {
        setError("❌ Contraseña incorrecta");
      }
    } catch (err) {
      setError("⚠️ Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  }
  //CONTENEDOR DE ESTILOS PRINCIPAL
  return (
    <div className="min-h-screen flex items-start justify-center bg-[#fdc436]">
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm bg-white/50 backdrop-blur-md rounded-xl p-8 shadow-lg">

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-black drop-shadow-xl">Acceso</h1>
          <p className="mt-2 text-black drop-shadow-xl">Introduce tu contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black">Contraseña</label>
            
            <div className="mt-2 relative">
              <input
                // SI VER CONTRASEÑA ES FALSE (MONO TAPADO), el tipo es "password"
                type={verPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError("")
                }}
                className="block w-full rounded-md bg-white px-3 py-2 pr-12 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#e4201e] shadow-inner"
                placeholder="Contraseña"
                required
              />
              
              {/* EL BOTÓN DEL MONO ESTRATEGA */}
              <button
                type="button"
                onClick={() => setVerPassword(!verPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-2xl leading-5 transition-transform active:scale-90 hover:opacity-80"
                title={verPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
               
                {verPassword ? "🐒" : "🙈"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="recordar"
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#e4201e] focus:ring-[#e4201e] cursor-pointer"
              />
              <label htmlFor="recordar" className="ml-2 block text-sm text-black cursor-pointer select-none font-medium">
                Recordar contraseña
              </label>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center font-bold animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full justify-center rounded-md bg-gray-800 px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#e4201e] transition-all transform hover:-translate-y-0.5 shadow-md active:translate-y-0"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  )
}
